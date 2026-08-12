#!/usr/bin/env node
'use strict';

const { execFile } = require('node:child_process');
const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const { createArchiveFigureService } = require('./archive-figure-service');
const {
    presentationIdForRef,
    resolveEffectivePresentation,
    variantFilePath
} = require('../scripts/archive-presentation');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);
const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const ARCHIVE_STORYLINES = path.join(ROOT, 'archive', 'storylines');
const MAX_BODY_BYTES = 15 * 1024 * 1024;
const figureService = createArchiveFigureService(ROOT);
let activeArchiveCommand = '';

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

function readJsonFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileRevision(filePath) {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertExpectedRevision(filePath, expectedRevision) {
    if (expectedRevision && expectedRevision !== fileRevision(filePath)) {
        const error = new Error('Archive file changed since it was loaded; reload before saving');
        error.statusCode = 409;
        throw error;
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

function listStorylineRecords() {
    return fs
        .readdirSync(ARCHIVE_STORYLINES)
        .filter((file) => /^[a-z0-9][a-z0-9._-]*\.json$/.test(file))
        .sort()
        .map((file) => {
            const id = file.slice(0, -'.json'.length);
            const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_STORYLINES, file), 'utf8'));
            const activeEvents = (data.events || []).filter(
                (entry) => entry.enabled !== false && typeof entry.milestoneId === 'string' && entry.milestoneId.trim()
            );
            return { id, data, activeEvents };
        });
}

function eventUsageById(storylineRecords) {
    const usage = new Map();
    for (const storyline of storylineRecords) {
        for (const membership of storyline.activeEvents) {
            if (!usage.has(membership.eventId)) usage.set(membership.eventId, []);
            usage.get(membership.eventId).push({
                storylineId: storyline.id,
                milestoneId: membership.milestoneId,
                variant: membership.variant || ''
            });
        }
    }
    return usage;
}

function eventPresentationTargets(eventId) {
    const safeEventId = safeArchiveId(eventId, 'archive eventId');
    const eventDirectory = path.join(ARCHIVE_EVENTS, safeEventId);
    const eventFile = path.join(eventDirectory, 'event.json');
    if (!fs.existsSync(eventFile)) throw Object.assign(new Error('Archive event not found'), { statusCode: 404 });
    const event = readJsonFile(eventFile);
    return listStorylineRecords()
        .flatMap(({ id: storylineId, data }) => {
            const storylineFile = archiveStorylinePath(storylineId);
            return (data.events || [])
                .filter((entry) => entry.eventId === safeEventId && entry.enabled !== false && entry.milestoneId)
                .map((entry) => {
                    const resolved = resolveEffectivePresentation({
                        root: ROOT,
                        eventDir: eventDirectory,
                        event,
                        eventId: safeEventId,
                        storylineId,
                        ref: entry
                    });
                    const overridePath = resolved.overridePath;
                    const hasOverride = Boolean(overridePath);
                    return {
                        storylineId,
                        storylineTitle: data.title || {},
                        milestoneId: entry.milestoneId,
                        refVariant: entry.variant || '',
                        presentationId: resolved.overrideId || storylineId,
                        source: hasOverride ? 'override' : 'default',
                        sourceLabel: hasOverride ? '使用故事线覆盖' : '继承默认展示',
                        hasDefaultPresentation: resolved.hasDefaultPresentation,
                        hasOverride,
                        overrideFile: resolved.overrideFile,
                        overrideRevision: hasOverride ? fileRevision(overridePath) : '',
                        storylineRevision: fileRevision(storylineFile),
                        defaultPresentation: resolved.defaultPresentation,
                        override: resolved.override,
                        effectivePresentation: resolved.presentation
                    };
                });
        })
        .sort((left, right) => left.storylineId.localeCompare(right.storylineId));
}

function countOtherPresentationReferences(eventId, variantId, currentStorylineId, currentMilestoneId) {
    let references = 0;
    for (const { id: storylineId, data } of listStorylineRecords()) {
        for (const entry of data.events || []) {
            if (entry.eventId !== eventId || entry.enabled === false) continue;
            if (storylineId === currentStorylineId && entry.milestoneId === currentMilestoneId) continue;
            if (presentationIdForRef(entry, storylineId) === variantId) references += 1;
        }
    }
    return references;
}

function restorePresentationInheritance(body) {
    const eventId = safeArchiveId(body.eventId, 'archive eventId');
    const storylineId = safeArchiveId(body.storylineId, 'archive storylineId');
    const milestoneId = safeArchiveId(body.milestoneId, 'archive milestoneId');
    const eventDirectory = path.join(ARCHIVE_EVENTS, eventId);
    const storylineFile = archiveStorylinePath(storylineId);
    const storylineSource = fs.readFileSync(storylineFile, 'utf8');
    const storyline = readJsonFile(storylineFile);
    const membership = (storyline.events || []).find(
        (entry) => entry.eventId === eventId && entry.milestoneId === milestoneId && entry.enabled !== false
    );
    if (!membership) throw Object.assign(new Error('Storyline event membership not found'), { statusCode: 404 });

    const presentationId = presentationIdForRef(membership, storylineId);
    const overridePath = variantFilePath(eventDirectory, presentationId);
    const overrideExists = fs.existsSync(overridePath);
    const changedFiles = [];
    let clearedStorylineVariant = false;
    let deletedOverride = false;
    let keptOverrideDueToReferences = false;
    const otherReferences = overrideExists
        ? countOtherPresentationReferences(eventId, presentationId, storylineId, milestoneId)
        : 0;

    if (membership.variant) assertExpectedRevision(storylineFile, body.expectedStorylineRevision);
    if (overrideExists) assertExpectedRevision(overridePath, body.expectedOverrideRevision);
    if (otherReferences > 0 && presentationId === storylineId) {
        const error = new Error(
            `覆盖文件 ${presentationId} 仍被其他展示引用，且当前故事线会继续隐式加载该文件，无法恢复继承`
        );
        error.statusCode = 409;
        throw error;
    }

    const stagedOverridePath = overrideExists && otherReferences === 0 ? `${overridePath}.${randomUUID()}.delete` : '';
    try {
        if (stagedOverridePath) fs.renameSync(overridePath, stagedOverridePath);
        if (membership.variant) {
            delete membership.variant;
            atomicWrite(storylineFile, `${JSON.stringify(storyline, null, 2)}\n`);
            clearedStorylineVariant = true;
        }
        if (stagedOverridePath) fs.rmSync(stagedOverridePath);
    } catch (error) {
        if (membership.variant === undefined && clearedStorylineVariant) atomicWrite(storylineFile, storylineSource);
        if (stagedOverridePath && fs.existsSync(stagedOverridePath) && !fs.existsSync(overridePath)) {
            fs.renameSync(stagedOverridePath, overridePath);
        }
        throw error;
    }

    if (clearedStorylineVariant) {
        changedFiles.push(path.relative(ROOT, storylineFile).replace(/\\/g, '/'));
    }
    if (stagedOverridePath) {
        changedFiles.push(path.relative(ROOT, overridePath).replace(/\\/g, '/'));
        deletedOverride = true;
    } else if (overrideExists) {
        keptOverrideDueToReferences = true;
    }

    return {
        ok: true,
        eventId,
        storylineId,
        milestoneId,
        presentationId,
        clearedStorylineVariant,
        deletedOverride,
        keptOverrideDueToReferences,
        changedFiles,
        targets: eventPresentationTargets(eventId)
    };
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

function runArchiveCommand(res, commandName, scriptName) {
    if (activeArchiveCommand) {
        sendError(res, `Archive command already running: ${activeArchiveCommand}`, 409);
        return;
    }
    activeArchiveCommand = commandName;
    execFile(
        process.execPath,
        [path.join(ROOT, 'scripts', scriptName)],
        { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 120000 },
        (error, stdout, stderr) => {
            activeArchiveCommand = '';
            sendJson(res, {
                ok: !error,
                command: commandName,
                stdout: stdout || '',
                stderr: stderr || '',
                exitCode: error ? error.code : 0
            });
        }
    );
}

const routes = {
    'GET /admin': (req, res) => serveFile(res, path.join(__dirname, 'admin.html'), 'no-store', req.method === 'HEAD'),
    'GET /admin.css': (req, res) =>
        serveFile(res, path.join(__dirname, 'admin.css'), 'no-store', req.method === 'HEAD'),
    'GET /admin.js': (req, res) => serveFile(res, path.join(__dirname, 'admin.js'), 'no-store', req.method === 'HEAD'),

    'GET /api/archive/figures': (_req, res) => {
        try {
            sendJson(res, {
                items: figureService.listFigures(),
                revision: figureService.getRegistryRevision()
            });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/figure-options': (_req, res) => {
        try {
            sendJson(res, figureService.listFigures());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/event-display-targets': (_req, res, url) => {
        try {
            sendJson(res, figureService.getEventDisplayTargets(url.searchParams.get('eventId')));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/event-presentation-targets': (_req, res, url) => {
        try {
            sendJson(res, eventPresentationTargets(url.searchParams.get('eventId')));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/event-presentation-restore-inheritance': async (req, res) => {
        try {
            sendJson(res, restorePresentationInheritance(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure': (_req, res, url) => {
        try {
            sendJson(res, figureService.getFigure(url.searchParams.get('figureId')));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure': async (req, res) => {
        try {
            sendJson(res, figureService.saveFigure(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure-usage': (_req, res, url) => {
        try {
            sendJson(res, figureService.getFigureUsage(url.searchParams.get('figureId')));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure-assets': (_req, res, url) => {
        try {
            sendJson(
                res,
                figureService.getFigureAssets(url.searchParams.get('figureId'), url.searchParams.get('eventId') || '')
            );
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-default-avatar': async (req, res) => {
        try {
            sendJson(res, figureService.setDefaultAvatar(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure-audit': (_req, res) => {
        try {
            sendJson(res, figureService.getAudit());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/figure-merge-preview': (_req, res, url) => {
        try {
            sendJson(
                res,
                figureService.previewFigureMerge(
                    url.searchParams.get('sourceFigureId'),
                    url.searchParams.get('targetFigureId')
                )
            );
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-merge': async (req, res) => {
        try {
            sendJson(res, figureService.mergeFigures(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-asset-merge-preview': async (req, res) => {
        try {
            sendJson(res, figureService.previewFigureAssetMerge(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-asset-merge': async (req, res) => {
        try {
            sendJson(res, figureService.mergeFigureAssets(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-image': async (req, res) => {
        try {
            sendJson(res, figureService.importFigureImage(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/events': (_req, res) => {
        try {
            const usageByEventId = eventUsageById(listStorylineRecords());
            const events = fs
                .readdirSync(ARCHIVE_EVENTS, { withFileTypes: true })
                .filter((entry) => entry.isDirectory() && /^[a-z0-9][a-z0-9._-]*$/.test(entry.name))
                .map((entry) => {
                    const files = archiveEventFileList(entry.name);
                    const usage = usageByEventId.get(entry.name) || [];
                    const eventFile = path.join(ARCHIVE_EVENTS, entry.name, 'event.json');
                    const event = fs.existsSync(eventFile) ? JSON.parse(fs.readFileSync(eventFile, 'utf8')) : {};
                    return {
                        id: entry.name,
                        year: event.year || '',
                        files,
                        variants: files
                            .filter((file) => file.startsWith('variants/'))
                            .map((file) => file.slice('variants/'.length, -'.json'.length)),
                        used: usage.length > 0,
                        usageCount: usage.length,
                        storylineIds: usage.map((item) => item.storylineId)
                    };
                })
                .sort(
                    (left, right) =>
                        String(left.year).localeCompare(String(right.year), 'en', { numeric: true }) ||
                        left.id.localeCompare(right.id)
                );
            sendJson(res, events);
        } catch (error) {
            sendError(res, error.message);
        }
    },

    'GET /api/archive/storylines': (_req, res) => {
        try {
            const storylines = listStorylineRecords().map(({ id, data, activeEvents }) => ({
                id,
                title: data.title || {},
                used: activeEvents.length > 0,
                usageCount: activeEvents.length,
                enabledEventCount: activeEvents.length,
                totalEventCount: (data.events || []).length
            }));
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
            sendJson(res, {
                storylineId,
                data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
                revision: fileRevision(filePath)
            });
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
            assertExpectedRevision(filePath, body.expectedRevision);
            atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
            sendJson(res, { ok: true, storylineId, revision: fileRevision(filePath) });
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
            sendJson(res, {
                eventId,
                file,
                data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
                revision: fileRevision(filePath)
            });
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
            assertExpectedRevision(filePath, body.expectedRevision);
            atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
            sendJson(res, {
                ok: true,
                eventId: body.eventId,
                file: body.file,
                revision: fileRevision(filePath)
            });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/validate': (_req, res) => runArchiveCommand(res, 'validate', 'validate-archive.js'),

    'POST /api/archive/generate': (_req, res) => runArchiveCommand(res, 'generate', 'generate-archive-data.js')
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
