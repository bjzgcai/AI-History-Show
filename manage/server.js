#!/usr/bin/env node
'use strict';

const { execFile } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);
const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const ARCHIVE_STORYLINES = path.join(ROOT, 'archive', 'storylines');
const MAX_BODY_BYTES = 5 * 1024 * 1024;

if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
    console.error(`Invalid port: ${process.env.PORT}`);
    process.exit(1);
}

const MIME = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
};

function sendJson(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function sendError(res, message, status = 500) {
    sendJson(res, { error: message }, status);
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
            const error = new Error('Content-Type must be application/json');
            error.statusCode = 415;
            reject(error);
            return;
        }

        const chunks = [];
        let size = 0;
        let tooLarge = false;

        req.on('data', (chunk) => {
            if (tooLarge) return;
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                tooLarge = true;
                chunks.length = 0;
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (tooLarge) {
                const error = new Error('Request body is too large');
                error.statusCode = 413;
                reject(error);
                return;
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

function atomicWrite(filePath, content) {
    const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    try {
        fs.writeFileSync(temporaryPath, content, 'utf8');
        fs.renameSync(temporaryPath, filePath);
    } finally {
        fs.rmSync(temporaryPath, { force: true });
    }
}

function isTrustedOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;

    try {
        return new URL(origin).host.toLowerCase() === String(req.headers.host || '').toLowerCase();
    } catch {
        return false;
    }
}

function safeArchiveId(value, label) {
    if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
        throw new Error(`Invalid ${label}`);
    }
    return value;
}

function safeArchiveFileName(value) {
    if (
        typeof value !== 'string' ||
        !/^(event|claims|sources|assets|quizzes)\.json$|^variants\/[a-z0-9][a-z0-9._-]*\.json$/.test(value)
    ) {
        throw new Error('Invalid archive file');
    }
    return value;
}

function archiveEventPath(eventId, file) {
    const safeEventId = safeArchiveId(eventId, 'archive eventId');
    const safeFile = safeArchiveFileName(file);
    const eventDirectory = path.join(ARCHIVE_EVENTS, safeEventId);
    const filePath = path.resolve(eventDirectory, safeFile);
    if (!filePath.startsWith(`${eventDirectory}${path.sep}`)) throw new Error('Archive path traversal rejected');
    return filePath;
}

function archiveStorylinePath(storylineId) {
    const safeStorylineId = safeArchiveId(storylineId, 'archive storylineId');
    return path.join(ARCHIVE_STORYLINES, `${safeStorylineId}.json`);
}

function archiveEventFileList(eventId) {
    const eventDirectory = path.join(ARCHIVE_EVENTS, eventId);
    if (!fs.existsSync(eventDirectory) || !fs.statSync(eventDirectory).isDirectory()) return [];

    const files = ['event.json', 'claims.json', 'sources.json', 'assets.json', 'quizzes.json'].filter((file) =>
        fs.existsSync(path.join(eventDirectory, file))
    );
    const variantsDirectory = path.join(eventDirectory, 'variants');
    if (fs.existsSync(variantsDirectory)) {
        files.push(
            ...fs
                .readdirSync(variantsDirectory)
                .filter((file) => /^[a-z0-9][a-z0-9._-]*\.json$/.test(file))
                .sort()
                .map((file) => `variants/${file}`)
        );
    }
    return files;
}

function serveFile(res, filePath, cacheControl = 'no-store', headOnly = false) {
    let stat;
    try {
        stat = fs.statSync(filePath);
    } catch {
        stat = null;
    }
    if (!stat || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
    }
    const contentType = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
        'Cache-Control': cacheControl,
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff'
    });
    if (headOnly) {
        res.end();
        return;
    }
    const stream = fs.createReadStream(filePath);
    stream.on('error', (error) => {
        if (res.headersSent) {
            res.destroy(error);
            return;
        }
        sendError(res, 'Unable to read file');
    });
    stream.pipe(res);
}

function serveResource(res, pathname, headOnly = false) {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        sendError(res, 'Invalid resource path', 400);
        return;
    }
    const resourcesDirectory = fs.realpathSync(path.join(ROOT, 'resources'));
    let filePath = path.resolve(ROOT, decodedPath.slice(1));
    if (!filePath.startsWith(`${resourcesDirectory}${path.sep}`)) {
        sendError(res, 'Forbidden', 403);
        return;
    }
    if (fs.existsSync(filePath)) {
        filePath = fs.realpathSync(filePath);
        if (!filePath.startsWith(`${resourcesDirectory}${path.sep}`)) {
            sendError(res, 'Forbidden', 403);
            return;
        }
    }
    serveFile(res, filePath, 'public, max-age=3600', headOnly);
}

const routes = {
    'GET /admin': (req, res) => serveFile(res, path.join(__dirname, 'admin.html'), 'no-store', req.method === 'HEAD'),

    'GET /api/archive/events': (_req, res) => {
        try {
            const events = fs
                .readdirSync(ARCHIVE_EVENTS, { withFileTypes: true })
                .filter((entry) => entry.isDirectory() && /^[a-z0-9][a-z0-9._-]*$/.test(entry.name))
                .map((entry) => {
                    const files = archiveEventFileList(entry.name);
                    return {
                        id: entry.name,
                        files,
                        variants: files
                            .filter((file) => file.startsWith('variants/'))
                            .map((file) => file.slice('variants/'.length, -'.json'.length))
                    };
                })
                .sort((a, b) => a.id.localeCompare(b.id));
            sendJson(res, events);
        } catch (error) {
            sendError(res, error.message);
        }
    },

    'GET /api/archive/storylines': (_req, res) => {
        try {
            const storylines = fs
                .readdirSync(ARCHIVE_STORYLINES)
                .filter((file) => /^[a-z0-9][a-z0-9._-]*\.json$/.test(file))
                .map((file) => file.slice(0, -'.json'.length))
                .sort();
            sendJson(res, storylines);
        } catch (error) {
            sendError(res, error.message);
        }
    },

    'GET /api/archive/storyline': (req, res, url) => {
        try {
            const storylineId = url.searchParams.get('storylineId');
            const filePath = archiveStorylinePath(storylineId);
            if (!fs.existsSync(filePath)) return sendError(res, 'Archive storyline not found', 404);
            sendJson(res, { storylineId, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/storyline': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const storylineId = safeArchiveId(body.storylineId, 'archive storylineId');
            if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
                return sendError(res, 'Archive storyline data must be a JSON object', 400);
            }
            if (body.data.id !== storylineId) {
                return sendError(res, 'Archive storyline data.id must match storylineId', 400);
            }
            const filePath = archiveStorylinePath(storylineId);
            if (!fs.existsSync(filePath)) return sendError(res, 'Archive storyline not found', 404);
            atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
            sendJson(res, { ok: true, storylineId });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/file': (req, res, url) => {
        try {
            const eventId = url.searchParams.get('eventId');
            const file = url.searchParams.get('file');
            const filePath = archiveEventPath(eventId, file);
            if (!fs.existsSync(filePath)) return sendError(res, 'Archive file not found', 404);
            sendJson(res, { eventId, file, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/file': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            if (!body.data || typeof body.data !== 'object') {
                return sendError(res, 'Archive file data must be JSON', 400);
            }
            const filePath = archiveEventPath(body.eventId, body.file);
            if (!fs.existsSync(filePath)) return sendError(res, 'Archive file not found', 404);
            atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
            sendJson(res, { ok: true, eventId: body.eventId, file: body.file });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/validate': (_req, res) => {
        execFile(
            process.execPath,
            [path.join(ROOT, 'scripts', 'validate-archive.js')],
            { cwd: ROOT },
            (error, stdout, stderr) => {
                sendJson(res, {
                    ok: !error,
                    stdout: stdout || '',
                    stderr: stderr || '',
                    exitCode: error ? error.code : 0
                });
            }
        );
    }
};

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(405, { Allow: 'GET, HEAD, POST', 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method not allowed');
        return;
    }

    let url;
    try {
        url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
        sendError(res, 'Invalid URL', 400);
        return;
    }

    const routeMethod = req.method === 'HEAD' ? 'GET' : req.method;
    const handler = routes[`${routeMethod} ${url.pathname}`];
    if (handler) {
        if (req.method === 'HEAD' && url.pathname.startsWith('/api/')) {
            res.writeHead(405, { Allow: 'GET, POST', 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Method not allowed');
            return;
        }
        if (req.method === 'POST' && !isTrustedOrigin(req)) {
            sendError(res, 'Cross-origin requests are not allowed', 403);
            return;
        }
        Promise.resolve(handler(req, res, url)).catch((error) => sendError(res, error.message));
        return;
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname.startsWith('/resources/')) {
        serveResource(res, url.pathname, req.method === 'HEAD');
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
});

server.listen(PORT, HOST, () => {
    console.log('Archive management server started');
    console.log(`http://${HOST}:${PORT}/admin`);
});
