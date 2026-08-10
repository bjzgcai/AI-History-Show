#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const { createAuthService, loadTokenEntries } = require('./auth');
const { loadReviewCatalog } = require('./candidates');
const { AudioReviewStore } = require('./store');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PUBLIC_ROOT = path.join(ROOT, 'tools', 'audio-review-console');
const DEFAULT_REVIEW_DATA = path.join(DEFAULT_PUBLIC_ROOT, 'review-data.json');
const DEFAULT_DATABASE = path.join(ROOT, '.tmp', 'audio-review', 'reviews.sqlite');
const DEFAULT_TOKEN_FILE = path.join(ROOT, '.secrets', 'audio-review-tokens.json');
const MAX_BODY_BYTES = 64 * 1024;
const MIME = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};

function sendJson(res, value, status = 200, headers = {}) {
    const body = JSON.stringify(value);
    res.writeHead(status, {
        ...securityHeaders(),
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
        ...headers
    });
    res.end(body);
}

function sendError(res, error) {
    sendJson(res, { error: error instanceof Error ? error.message : String(error) }, error.statusCode || 500);
}

function securityHeaders() {
    return {
        'Content-Security-Policy':
            "default-src 'self'; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
    };
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
            reject(Object.assign(new Error('Content-Type must be application/json'), { statusCode: 415 }));
            return;
        }
        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size <= MAX_BODY_BYTES) chunks.push(chunk);
        });
        req.on('end', () => {
            if (size > MAX_BODY_BYTES) {
                reject(Object.assign(new Error('Request body is too large'), { statusCode: 413 }));
                return;
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch {
                reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }));
            }
        });
        req.on('error', reject);
    });
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

function requestUsesHttps(req, forceSecureCookie) {
    return (
        forceSecureCookie ||
        String(req.headers['x-forwarded-proto'] || '')
            .split(',')[0]
            .trim() === 'https'
    );
}

function parseByteRange(range, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(range || ''));
    if (!match || size <= 0 || (!match[1] && !match[2])) return null;
    if (!match[1]) {
        const suffix = Number(match[2]);
        if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
        return { start: Math.max(0, size - suffix), end: size - 1 };
    }
    const start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : size - 1;
    if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(requestedEnd) ||
        start < 0 ||
        start >= size ||
        requestedEnd < start
    )
        return null;
    return { start, end: Math.min(size - 1, requestedEnd) };
}

function serveFile(res, filePath, method) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404, securityHeaders());
        res.end('Not found');
        return;
    }
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
        ...securityHeaders(),
        'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache'
    });
    if (method === 'HEAD') res.end();
    else fs.createReadStream(filePath).pipe(res);
}

function serveAudio(req, res, filePath) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendJson(res, { error: 'Audio file not found' }, 404);
        return;
    }
    const stat = fs.statSync(filePath);
    const headers = {
        ...securityHeaders(),
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache'
    };
    const range = req.headers.range;
    if (!range) {
        res.writeHead(200, { ...headers, 'Content-Length': stat.size });
        if (req.method === 'HEAD') res.end();
        else fs.createReadStream(filePath).pipe(res);
        return;
    }
    const parsed = parseByteRange(range, stat.size);
    if (!parsed) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
    }
    res.writeHead(206, {
        ...headers,
        'Content-Length': parsed.end - parsed.start + 1,
        'Content-Range': `bytes ${parsed.start}-${parsed.end}/${stat.size}`
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(filePath, parsed).pipe(res);
}

function createAudioReviewServer(options = {}) {
    const projectRoot = path.resolve(options.projectRoot || ROOT);
    const publicRoot = path.resolve(options.publicRoot || process.env.AUDIO_REVIEW_PUBLIC_ROOT || DEFAULT_PUBLIC_ROOT);
    const reviewDataPath = path.resolve(options.reviewDataPath || process.env.AUDIO_REVIEW_DATA || DEFAULT_REVIEW_DATA);
    const databasePath = path.resolve(options.databasePath || process.env.AUDIO_REVIEW_DB || DEFAULT_DATABASE);
    const tokenEntries =
        options.tokenEntries ||
        loadTokenEntries({
            tokenFile: options.tokenFile || process.env.AUDIO_REVIEW_TOKEN_FILE || DEFAULT_TOKEN_FILE,
            tokenJson: process.env.AUDIO_REVIEW_TOKENS_JSON
        });
    const auth = createAuthService(tokenEntries, options.authOptions);
    const store = new AudioReviewStore(databasePath);
    const forceSecureCookie = options.secureCookie ?? process.env.AUDIO_REVIEW_SECURE_COOKIE === 'true';
    let catalogMtime = -1;
    let catalog;

    function currentCatalog() {
        const stat = fs.statSync(reviewDataPath);
        if (!catalog || stat.mtimeMs !== catalogMtime) {
            catalog = loadReviewCatalog(reviewDataPath);
            catalogMtime = stat.mtimeMs;
            store.syncCandidates(catalog.candidates);
        }
        return catalog;
    }

    currentCatalog();

    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const method = req.method === 'HEAD' ? 'GET' : req.method;

            if (url.pathname === '/healthz' && method === 'GET') {
                sendJson(res, { ok: true });
                return;
            }
            if (url.pathname === '/api/auth/session' && method === 'POST') {
                if (!isTrustedOrigin(req)) throw Object.assign(new Error('Forbidden origin'), { statusCode: 403 });
                const body = await readJsonBody(req);
                const user = auth.authenticateToken(body.token);
                if (!user) throw Object.assign(new Error('Token 无效'), { statusCode: 401 });
                const sessionId = auth.createSession(user);
                sendJson(res, { user: { id: user.id, name: user.name, role: user.role } }, 200, {
                    'Set-Cookie': auth.sessionCookie(sessionId, requestUsesHttps(req, forceSecureCookie))
                });
                return;
            }

            if (url.pathname === '/api/auth/session' && method === 'GET') {
                sendJson(res, { user: auth.sessionUser(req) });
                return;
            }

            const user = url.pathname.startsWith('/api/') ? auth.sessionUser(req) : null;
            if (url.pathname.startsWith('/api/') && !user) {
                sendJson(res, { error: '需要登录' }, 401);
                return;
            }
            if (url.pathname === '/api/auth/session' && method === 'DELETE') {
                if (!isTrustedOrigin(req)) throw Object.assign(new Error('Forbidden origin'), { statusCode: 403 });
                auth.destroySession(req);
                sendJson(res, { ok: true }, 200, {
                    'Set-Cookie': auth.clearSessionCookie(requestUsesHttps(req, forceSecureCookie))
                });
                return;
            }
            if (url.pathname === '/api/review-data' && method === 'GET') {
                sendJson(res, currentCatalog().data);
                return;
            }
            if (url.pathname === '/api/reviews' && method === 'GET') {
                currentCatalog();
                sendJson(res, { reviews: store.summaries(), user });
                return;
            }
            if (url.pathname === '/api/reviews' && method === 'POST') {
                if (!isTrustedOrigin(req)) throw Object.assign(new Error('Forbidden origin'), { statusCode: 403 });
                currentCatalog();
                const body = await readJsonBody(req);
                sendJson(res, store.appendReview({ ...body, reviewer: user }), 201);
                return;
            }
            if (url.pathname === '/api/reviews/export' && method === 'GET') {
                sendJson(res, store.exportData());
                return;
            }
            if (url.pathname === '/api/reviews/approved-manifest' && method === 'GET') {
                sendJson(res, store.approvedManifest());
                return;
            }
            if (url.pathname === '/api/reviews/unapproved' && method === 'GET') {
                sendJson(res, { candidates: store.unapprovedCandidates() });
                return;
            }
            const invalidationMatch = /^\/api\/reviews\/([^/]+)\/invalidate$/.exec(url.pathname);
            if (invalidationMatch && method === 'POST') {
                if (user.role !== 'admin') throw Object.assign(new Error('需要管理员权限'), { statusCode: 403 });
                if (!isTrustedOrigin(req)) throw Object.assign(new Error('Forbidden origin'), { statusCode: 403 });
                const body = await readJsonBody(req);
                sendJson(
                    res,
                    store.invalidateReview({ recordId: invalidationMatch[1], reviewer: user, reason: body.reason })
                );
                return;
            }
            const audioMatch = /^\/api\/audio\/([^/]+)$/.exec(url.pathname);
            if (audioMatch && method === 'GET') {
                const activeCatalog = currentCatalog();
                const audioPath = activeCatalog.audioFiles.get(audioMatch[1]);
                if (!audioPath) throw Object.assign(new Error('Review audio not found'), { statusCode: 404 });
                const filePath = path.resolve(projectRoot, audioPath);
                const audioRoot = path.resolve(
                    options.audioRoot || path.join(projectRoot, 'resources', 'audio', 'generated')
                );
                if (!filePath.startsWith(`${audioRoot}${path.sep}`)) {
                    throw Object.assign(new Error('Audio path is outside the review audio root'), { statusCode: 403 });
                }
                serveAudio(req, res, filePath);
                return;
            }

            if (!['GET', 'HEAD'].includes(req.method)) {
                res.writeHead(405, securityHeaders());
                res.end('Method not allowed');
                return;
            }
            const staticFiles = {
                '/': 'index.html',
                '/index.html': 'index.html',
                '/app.js': 'app.js',
                '/styles.css': 'styles.css'
            };
            const fileName = staticFiles[url.pathname];
            if (!fileName) {
                res.writeHead(404, securityHeaders());
                res.end('Not found');
                return;
            }
            serveFile(res, path.join(publicRoot, fileName), req.method);
        } catch (error) {
            sendError(res, error);
        }
    });

    server.on('close', () => store.close());
    return server;
}

if (require.main === module) {
    const host = process.env.HOST || '127.0.0.1';
    const port = Number(process.env.PORT || 3002);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        console.error(`Invalid port: ${process.env.PORT}`);
        process.exit(1);
    }
    try {
        const server = createAudioReviewServer();
        server.listen(port, host, () => {
            console.log(`Audio review service listening at http://${host}:${port}`);
        });
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

module.exports = { createAudioReviewServer, parseByteRange };
