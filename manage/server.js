#!/usr/bin/env node
'use strict';

const { execFile } = require('node:child_process');
const { createHash, randomUUID } = require('node:crypto');
const dns = require('node:dns');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { URL } = require('node:url');

const { createAdminDraftService } = require('./admin-draft-service');
const { createAdminHistoryService } = require('./admin-history-service');
const { createArchiveFigureService } = require('./archive-figure-service');
const { createAdminGitService } = require('./admin-git-service');
const {
    presentationIdForRef,
    resolveEffectivePresentation,
    variantFilePath
} = require('../scripts/archive-presentation');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);
const APP_ROOT = path.resolve(__dirname, '..');
const ROOT = path.resolve(process.env.AI_HISTORY_ARCHIVE_ROOT || APP_ROOT);
const ARCHIVE_GENERATION_META = path.join(ROOT, '.tmp', 'archive-generation.json');
const PUBLISH_STATE_META = path.join(ROOT, '.tmp', 'admin-publish-state.json');
const TEST_DISPLAY_PORT = Number(process.env.TEST_DISPLAY_PORT || 8000);
const MAX_BODY_BYTES = 15 * 1024 * 1024;
const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const REMOTE_IMAGE_TIMEOUT_MS = 15000;
const draftService = createAdminDraftService(ROOT);
const historyService = createAdminHistoryService(ROOT);
const gitService = createAdminGitService(ROOT);
let activeArchiveCommand = '';

function activeContentRoot() {
    return draftService.contentRoot();
}

function currentFigureService() {
    return createArchiveFigureService(activeContentRoot());
}

function runDraftMutation(operation) {
    const draftStatus = draftService.status();
    const createdDraft =
        !draftService.hasDraft() || (!draftStatus.summary.active && !draftStatus.summary.stagedResources);
    draftService.ensureInitialized();
    try {
        return operation();
    } catch (error) {
        if (createdDraft) draftService.reset();
        throw error;
    }
}

if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
    console.error(`Invalid port: ${process.env.PORT}`);
    process.exit(1);
}

historyService.ensureCurrentVersion();

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
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
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

function isPrivateNetworkAddress(value) {
    const address = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^::ffff:/, '');
    if (net.isIP(address) === 4) {
        const parts = address.split('.').map(Number);
        return (
            parts[0] === 0 ||
            parts[0] === 10 ||
            parts[0] === 127 ||
            (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
            (parts[0] === 169 && parts[1] === 254) ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168) ||
            (parts[0] === 198 && [18, 19].includes(parts[1])) ||
            parts[0] >= 224
        );
    }
    if (net.isIP(address) === 6) {
        return (
            address === '::' ||
            address === '::1' ||
            address.startsWith('fc') ||
            address.startsWith('fd') ||
            /^fe[89ab]/.test(address) ||
            address.startsWith('ff')
        );
    }
    return true;
}

async function resolvePublicAddress(hostname) {
    if (/^localhost$/i.test(hostname) || hostname.toLowerCase().endsWith('.local')) {
        throw Object.assign(new Error('Image URL must use a public host'), { statusCode: 400 });
    }
    const addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => isPrivateNetworkAddress(entry.address))) {
        throw Object.assign(new Error('Image URL resolves to a private or unsupported network address'), {
            statusCode: 400
        });
    }
    return addresses[0];
}

async function downloadRemoteImage(rawUrl, redirectCount = 0) {
    if (redirectCount > 4) throw Object.assign(new Error('Image URL redirected too many times'), { statusCode: 400 });
    let url;
    try {
        url = new URL(String(rawUrl || '').trim());
    } catch {
        throw Object.assign(new Error('Invalid image URL'), { statusCode: 400 });
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw Object.assign(new Error('Image URL must use HTTP or HTTPS without embedded credentials'), {
            statusCode: 400
        });
    }
    const resolved = await resolvePublicAddress(url.hostname);
    const transport = url.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
        const request = transport.get(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || undefined,
                path: `${url.pathname}${url.search}`,
                headers: {
                    Accept: 'image/png,image/jpeg,image/gif,image/webp;q=0.9,*/*;q=0.1',
                    'Accept-Encoding': 'identity',
                    'User-Agent': 'AI-History-Show-Archive-Admin/1.0'
                },
                lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family)
            },
            (response) => {
                const status = response.statusCode || 0;
                if (status >= 300 && status < 400 && response.headers.location) {
                    response.resume();
                    const redirectUrl = new URL(response.headers.location, url).toString();
                    downloadRemoteImage(redirectUrl, redirectCount + 1).then(resolve, reject);
                    return;
                }
                if (status < 200 || status >= 300) {
                    response.resume();
                    reject(Object.assign(new Error(`Image URL returned HTTP ${status}`), { statusCode: 400 }));
                    return;
                }
                const contentLength = Number(response.headers['content-length'] || 0);
                if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
                    response.destroy();
                    reject(Object.assign(new Error('Remote image exceeds the 10 MB limit'), { statusCode: 400 }));
                    return;
                }
                const chunks = [];
                let size = 0;
                response.on('data', (chunk) => {
                    size += chunk.length;
                    if (size > MAX_REMOTE_IMAGE_BYTES) {
                        response.destroy(
                            Object.assign(new Error('Remote image exceeds the 10 MB limit'), { statusCode: 400 })
                        );
                        return;
                    }
                    chunks.push(chunk);
                });
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            }
        );
        request.setTimeout(REMOTE_IMAGE_TIMEOUT_MS, () => {
            request.destroy(Object.assign(new Error('Image URL download timed out'), { statusCode: 408 }));
        });
        request.on('error', reject);
    });
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
    return archiveEventPathForRoot(activeContentRoot(), eventId, file);
}

function archiveEventPathForRoot(projectRoot, eventId, file) {
    const safeEventId = safeArchiveId(eventId, 'archive eventId');
    const safeFile = safeArchiveFileName(file);
    const eventDirectory = path.join(projectRoot, 'archive', 'events', safeEventId);
    const filePath = path.resolve(eventDirectory, safeFile);
    if (!filePath.startsWith(`${eventDirectory}${path.sep}`)) throw new Error('Archive path traversal rejected');
    return filePath;
}

function archiveStorylinePath(storylineId) {
    return archiveStorylinePathForRoot(activeContentRoot(), storylineId);
}

function archiveStorylinePathForRoot(projectRoot, storylineId) {
    const safeStorylineId = safeArchiveId(storylineId, 'archive storylineId');
    return path.join(projectRoot, 'archive', 'storylines', `${safeStorylineId}.json`);
}

function assertUniqueStorylineEvents(storyline) {
    if (!Array.isArray(storyline.events)) return;
    const eventIds = new Set();
    for (const membership of storyline.events) {
        const eventId = String((membership && membership.eventId) || '').trim();
        if (!eventId) continue;
        if (eventIds.has(eventId)) {
            throw Object.assign(new Error(`Storyline cannot contain duplicate event: ${eventId}`), {
                statusCode: 400
            });
        }
        eventIds.add(eventId);
    }
}

function listStorylineRecords(projectRoot = activeContentRoot()) {
    const storylinesDirectory = path.join(projectRoot, 'archive', 'storylines');
    return fs
        .readdirSync(storylinesDirectory)
        .filter((file) => /^[a-z0-9][a-z0-9._-]*\.json$/.test(file))
        .sort()
        .map((file) => {
            const id = file.slice(0, -'.json'.length);
            const data = JSON.parse(fs.readFileSync(path.join(storylinesDirectory, file), 'utf8'));
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
    const projectRoot = activeContentRoot();
    const eventDirectory = path.join(projectRoot, 'archive', 'events', safeEventId);
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
                        root: projectRoot,
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
    const projectRoot = activeContentRoot();
    const eventId = safeArchiveId(body.eventId, 'archive eventId');
    const storylineId = safeArchiveId(body.storylineId, 'archive storylineId');
    const milestoneId = safeArchiveId(body.milestoneId, 'archive milestoneId');
    const eventDirectory = path.join(projectRoot, 'archive', 'events', eventId);
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
        changedFiles.push(path.relative(projectRoot, storylineFile).replace(/\\/g, '/'));
    }
    if (stagedOverridePath) {
        changedFiles.push(path.relative(projectRoot, overridePath).replace(/\\/g, '/'));
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
    const eventDirectory = path.join(activeContentRoot(), 'archive', 'events', eventId);
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
    const relativePath = decodedPath.replace(/^\//, '');
    const draftPath = draftService.draftResourcePath(relativePath);
    if (draftPath && fs.existsSync(draftPath)) {
        serveFile(res, draftPath, 'no-store', headOnly);
        return;
    }
    const configuredResourcesDirectory = path.resolve(ROOT, 'resources');
    let filePath = path.resolve(ROOT, decodedPath.slice(1));
    if (!filePath.startsWith(`${configuredResourcesDirectory}${path.sep}`)) {
        sendError(res, 'Forbidden', 403);
        return;
    }
    const resourcesDirectory = fs.realpathSync(configuredResourcesDirectory);
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
    if (draftService.status().summary.active) {
        sendError(res, '存在待处理 Admin 草稿，请先在发布管理中完成保留、放弃和应用', 409);
        return;
    }
    if (activeArchiveCommand) {
        sendError(res, `Archive command already running: ${activeArchiveCommand}`, 409);
        return;
    }
    activeArchiveCommand = commandName;
    execFile(
        process.execPath,
        [path.join(APP_ROOT, 'scripts', scriptName)],
        {
            cwd: APP_ROOT,
            env: { ...process.env, AI_HISTORY_ARCHIVE_ROOT: ROOT },
            maxBuffer: 10 * 1024 * 1024,
            timeout: 120000
        },
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

function runArchiveScript(scriptName, projectRoot = ROOT) {
    return new Promise((resolve) => {
        execFile(
            process.execPath,
            [path.join(APP_ROOT, 'scripts', scriptName)],
            {
                cwd: APP_ROOT,
                env: { ...process.env, AI_HISTORY_ARCHIVE_ROOT: projectRoot },
                maxBuffer: 10 * 1024 * 1024,
                timeout: 120000
            },
            (error, stdout, stderr) => {
                resolve({
                    ok: !error,
                    stdout: stdout || '',
                    stderr: stderr || '',
                    exitCode: error ? error.code : 0
                });
            }
        );
    });
}

function runProjectScript(scriptName, projectRoot = ROOT, timeout = 240000) {
    return new Promise((resolve) => {
        execFile(
            process.execPath,
            [path.join(APP_ROOT, 'scripts', scriptName)],
            {
                cwd: APP_ROOT,
                env: { ...process.env, AI_HISTORY_ARCHIVE_ROOT: projectRoot },
                maxBuffer: 20 * 1024 * 1024,
                timeout
            },
            (error, stdout, stderr) => {
                resolve({
                    ok: !error,
                    stdout: stdout || '',
                    stderr: stderr || '',
                    exitCode: error ? error.code : 0
                });
            }
        );
    });
}

function collectPathStats(targetPath, visited = new Set()) {
    if (!fs.existsSync(targetPath)) return { latestMtimeMs: 0, fileCount: 0, totalBytes: 0 };
    let realPath;
    try {
        realPath = fs.realpathSync(targetPath);
    } catch {
        realPath = targetPath;
    }
    if (visited.has(realPath)) return { latestMtimeMs: 0, fileCount: 0, totalBytes: 0 };
    const stat = fs.statSync(targetPath);
    if (stat.isFile()) {
        return { latestMtimeMs: stat.mtimeMs, fileCount: 1, totalBytes: stat.size };
    }
    if (!stat.isDirectory()) return { latestMtimeMs: stat.mtimeMs, fileCount: 0, totalBytes: 0 };
    visited.add(realPath);
    const result = { latestMtimeMs: stat.mtimeMs, fileCount: 0, totalBytes: 0 };
    for (const name of fs.readdirSync(targetPath)) {
        const child = collectPathStats(path.join(targetPath, name), visited);
        result.latestMtimeMs = Math.max(result.latestMtimeMs, child.latestMtimeMs);
        result.fileCount += child.fileCount;
        result.totalBytes += child.totalBytes;
    }
    return result;
}

function latestMtime(paths) {
    const visited = new Set();
    return paths.reduce(
        (latest, targetPath) => Math.max(latest, collectPathStats(targetPath, visited).latestMtimeMs),
        0
    );
}

function readMetadataFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        return readJsonFile(filePath);
    } catch {
        return null;
    }
}

function listArchiveJsonFiles(directory, prefix = '') {
    if (!fs.existsSync(directory)) return [];
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...listArchiveJsonFiles(filePath, relativePath));
        else if (entry.isFile() && entry.name.endsWith('.json')) files.push(relativePath);
    }
    return files.sort();
}

function archiveRevision() {
    const archiveRoot = path.join(ROOT, 'archive');
    const hash = createHash('sha256');
    for (const relativePath of listArchiveJsonFiles(archiveRoot)) {
        hash.update(relativePath);
        hash.update('\0');
        hash.update(fs.readFileSync(path.join(archiveRoot, relativePath)));
        hash.update('\0');
    }
    return hash.digest('hex');
}

function readPublishState() {
    return {
        draftValidatedFingerprint: '',
        savedValidatedRevision: '',
        savedValidatedAt: null,
        generatedArchiveRevision: '',
        generatedAt: null,
        submittedArchiveRevision: '',
        submittedAt: null,
        submittedCommit: '',
        submittedRemote: '',
        submittedBranch: '',
        testDisplayConfirmedRevision: '',
        testDisplayConfirmedAt: null,
        ...(readMetadataFile(PUBLISH_STATE_META) || {})
    };
}

function writePublishState(updates) {
    const next = { ...readPublishState(), ...updates };
    atomicWrite(PUBLISH_STATE_META, `${JSON.stringify(next, null, 2)}\n`);
    return next;
}

function invalidatePublishedArtifacts() {
    return writePublishState({
        draftValidatedFingerprint: '',
        savedValidatedRevision: '',
        savedValidatedAt: null,
        generatedArchiveRevision: '',
        generatedAt: null,
        submittedArchiveRevision: '',
        submittedAt: null,
        submittedCommit: '',
        submittedRemote: '',
        submittedBranch: '',
        testDisplayConfirmedRevision: '',
        testDisplayConfirmedAt: null
    });
}

function normalizeDisplayUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    return url.endsWith('/') ? url : `${url}/`;
}

function testDisplayUrl(req) {
    const configured = normalizeDisplayUrl(process.env.TEST_DISPLAY_URL);
    if (configured) return configured;
    const requestHost = String(req?.headers?.host || '').split(':')[0] || '127.0.0.1';
    const protocol = process.env.TEST_DISPLAY_PROTOCOL || 'http';
    return `${protocol}://${requestHost}:${TEST_DISPLAY_PORT}/`;
}

async function getGitStatus() {
    if (process.env.ADMIN_GIT_DRY_RUN === 'true') {
        return {
            available: true,
            remote: process.env.ADMIN_GIT_REMOTE || 'origin',
            remoteUrl: 'dry-run://github-submit',
            branch: process.env.ADMIN_GIT_BRANCH || 'admin-test',
            files: []
        };
    }
    try {
        const context = await gitService.context();
        const files = await gitService.status(['archive', 'resources', 'milestones-data.js']);
        return { available: true, ...context, files };
    } catch (error) {
        return { available: false, error: error.message };
    }
}

function currentContentSubmissionPaths() {
    const paths = new Set(['milestones-data.js']);
    const latest = historyService.summary().latest;
    if (!latest) return [...paths];
    const version = historyService.getVersion(latest.id);
    for (const relativePath of [...(version.changedFiles || []), ...(version.resourceFiles || [])]) {
        if (/^(archive|resources)\//.test(relativePath)) paths.add(relativePath);
    }
    return [...paths];
}

async function submitAdminContent(body = {}) {
    if (draftService.status().summary.active) {
        throw Object.assign(new Error('存在待处理 Admin 草稿，请先完成保留、放弃和应用'), { statusCode: 409 });
    }
    if (activeArchiveCommand) {
        throw Object.assign(new Error(`Archive command already running: ${activeArchiveCommand}`), {
            statusCode: 409
        });
    }
    const currentRevision = archiveRevision();
    const publishState = readPublishState();
    if (publishState.savedValidatedRevision !== currentRevision) {
        throw Object.assign(new Error('请先完成“生效前先校验”，校验当前已保存的文件后才能提交 GitHub'), {
            statusCode: 409
        });
    }
    if (publishState.generatedArchiveRevision !== currentRevision || !runtimeFilesExist()) {
        throw Object.assign(new Error('请先生成与当前文件对应的运行时数据，才能提交 GitHub'), { statusCode: 409 });
    }
    activeArchiveCommand = 'submit-github';
    try {
        if (process.env.ADMIN_GIT_DRY_RUN === 'true') {
            const context = await getGitStatus();
            const result = {
                ok: true,
                committed: false,
                pushed: false,
                dryRun: true,
                message: '测试模式：未执行 Git commit 或 push。',
                remote: context.remote,
                remoteUrl: context.remoteUrl,
                branch: context.branch,
                files: currentContentSubmissionPaths(),
                commit: ''
            };
            writePublishState({
                submittedArchiveRevision: currentRevision,
                submittedAt: new Date().toISOString(),
                submittedCommit: '',
                submittedRemote: result.remote,
                submittedBranch: result.branch
            });
            return result;
        }
        const result = await gitService.submit({
            paths: currentContentSubmissionPaths(),
            message: body.message,
            remoteName: body.remote,
            branch: body.branch
        });
        writePublishState({
            submittedArchiveRevision: currentRevision,
            submittedAt: new Date().toISOString(),
            submittedCommit: result.commit || '',
            submittedRemote: result.remote || '',
            submittedBranch: result.branch || ''
        });
        return result;
    } finally {
        activeArchiveCommand = '';
    }
}

async function getPublishStatus(req) {
    const archiveMtime = latestMtime([path.join(ROOT, 'archive')]);
    const currentArchiveRevision = archiveRevision();
    const publishState = readPublishState();
    const activeRuntimePath = path.join(ROOT, 'milestones-data.js');
    const fallbackRuntimePath = path.join(ROOT, 'milestones-data-default.js');
    const runtimeExists = fs.existsSync(activeRuntimePath);
    const fallbackExists = fs.existsSync(fallbackRuntimePath);
    const runtimeMtime = runtimeExists ? fs.statSync(activeRuntimePath).mtimeMs : 0;
    const generationMeta = readMetadataFile(ARCHIVE_GENERATION_META);
    const generatedAtMs = generationMeta?.generatedAt ? new Date(generationMeta.generatedAt).getTime() : runtimeMtime;
    const draft = draftService.status();
    const draftValidationReady =
        Boolean(draft.fingerprint) && publishState.draftValidatedFingerprint === draft.fingerprint;
    const runtimeGenerationReady =
        runtimeExists &&
        publishState.generatedArchiveRevision === currentArchiveRevision &&
        generatedAtMs >= archiveMtime;
    const testDisplayConfirmed =
        runtimeGenerationReady && publishState.testDisplayConfirmedRevision === currentArchiveRevision;
    const submissionReady = runtimeGenerationReady && publishState.submittedArchiveRevision === currentArchiveRevision;
    return {
        ok: true,
        activeCommand: activeArchiveCommand,
        draft,
        changes: draft.active,
        discardedChanges: draft.discarded,
        changeSummary: draft.summary,
        history: historyService.summary(),
        git: await getGitStatus(),
        workflow: {
            archiveRevision: currentArchiveRevision,
            draftValidation: {
                ready: draftValidationReady,
                fingerprint: draftValidationReady ? publishState.draftValidatedFingerprint : '',
                validatedAt: draftValidationReady ? publishState.draftValidatedAt : null
            },
            savedValidation: {
                ready: publishState.savedValidatedRevision === currentArchiveRevision,
                revision: publishState.savedValidatedRevision || '',
                validatedAt: publishState.savedValidatedAt || null
            },
            runtimeGeneration: {
                ready: runtimeGenerationReady,
                revision: publishState.generatedArchiveRevision || '',
                generatedAt: publishState.generatedAt || null
            },
            testDisplayConfirmation: {
                ready: testDisplayConfirmed,
                revision: publishState.testDisplayConfirmedRevision || '',
                confirmedAt: publishState.testDisplayConfirmedAt || null
            },
            githubSubmission: {
                ready: submissionReady,
                revision: publishState.submittedArchiveRevision || '',
                submittedAt: publishState.submittedAt || null,
                commit: publishState.submittedCommit || '',
                remote: publishState.submittedRemote || '',
                branch: publishState.submittedBranch || ''
            }
        },
        runtime: {
            exists: runtimeExists,
            fallbackExists,
            ready: runtimeGenerationReady,
            generatedAt: generatedAtMs ? new Date(generatedAtMs).toISOString() : null,
            archiveModifiedAt: archiveMtime ? new Date(archiveMtime).toISOString() : null
        },
        testDisplay: {
            url: testDisplayUrl(req),
            ready: runtimeGenerationReady,
            confirmed: testDisplayConfirmed,
            updatedAt: publishState.generatedAt || null
        }
    };
}

function confirmTestDisplay() {
    const currentRevision = archiveRevision();
    const publishState = readPublishState();
    if (draftService.status().summary.active) {
        throw Object.assign(new Error('存在待处理 Admin 草稿，请先完成保留、放弃和保存'), { statusCode: 409 });
    }
    if (publishState.generatedArchiveRevision !== currentRevision || !runtimeFilesExist()) {
        throw Object.assign(new Error('请先生成与当前文件对应的运行时数据，再确认测试服务'), { statusCode: 409 });
    }
    const confirmedAt = new Date().toISOString();
    writePublishState({
        testDisplayConfirmedRevision: currentRevision,
        testDisplayConfirmedAt: confirmedAt
    });
    return {
        ok: true,
        confirmedAt,
        revision: currentRevision,
        message: '已确认测试服务展示结果。'
    };
}

function createUndoLastChangeDraft() {
    if (draftService.status().summary.active) {
        throw Object.assign(new Error('存在待处理 Admin 草稿，请先完成当前变更'), { statusCode: 409 });
    }
    const latest = historyService.summary().latest;
    if (!latest?.previousVersionId) {
        throw Object.assign(new Error('没有可撤销的最近一次保存变更'), { statusCode: 409 });
    }
    const targetVersion = historyService.getVersion(latest.previousVersionId);
    const draft = draftService.createFromArchiveSnapshot(historyService.versionRoot(targetVersion.id), {
        type: 'rollback',
        versionId: targetVersion.id,
        createdAt: new Date().toISOString()
    });
    return {
        ok: true,
        fromVersion: latest,
        targetVersion,
        draft
    };
}

function draftRelativePath(body) {
    if (body.type === 'figures') return 'archive/figures/figures.json';
    if (body.type === 'storylines') {
        return `archive/storylines/${safeArchiveId(body.storylineId, 'archive storylineId')}.json`;
    }
    if (body.type === 'events') {
        return path.relative(ROOT, archiveEventPathForRoot(ROOT, body.eventId, body.file)).replace(/\\/g, '/');
    }
    throw Object.assign(new Error('Unsupported Archive entity type'), { statusCode: 400 });
}

function saveAdminDraft(body) {
    const relativePath = draftRelativePath(body);
    const formalPath = path.join(ROOT, relativePath);
    if (body.type === 'figures') {
        const figureId = safeArchiveId(body.figureId, 'archive figureId');
        if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data) || body.data.id !== figureId) {
            throw Object.assign(new Error('Archive figure data.id must match figureId'), { statusCode: 400 });
        }
    } else {
        if (!body.data || typeof body.data !== 'object') {
            throw Object.assign(new Error('Archive draft data must be a JSON object or array'), { statusCode: 400 });
        }
        if ((body.type === 'storylines' || body.file === 'event.json') && Array.isArray(body.data)) {
            throw Object.assign(new Error('Archive event and storyline data must be a JSON object'), {
                statusCode: 400
            });
        }
        if (body.type === 'storylines' && body.data.id !== body.storylineId) {
            throw Object.assign(new Error('Archive storyline data.id must match storylineId'), { statusCode: 400 });
        }
        if (body.type === 'events' && body.file === 'event.json' && body.data.id !== body.eventId) {
            throw Object.assign(new Error('Archive event data.id must match eventId'), { statusCode: 400 });
        }
    }
    if (!draftService.hasDraft()) assertExpectedRevision(formalPath, body.expectedRevision);
    draftService.ensureInitialized();
    const filePath = path.join(draftService.workspaceRoot, relativePath);
    assertExpectedRevision(filePath, body.expectedRevision);
    let result;
    if (body.type === 'figures') {
        const figureId = safeArchiveId(body.figureId, 'archive figureId');
        const figures = readJsonFile(filePath);
        const index = figures.findIndex((figure) => figure.id === figureId);
        if (body.create === true && index >= 0) {
            throw Object.assign(new Error('Archive figure already exists'), { statusCode: 409 });
        }
        if (body.create !== true && index < 0) {
            throw Object.assign(new Error('Archive figure not found'), { statusCode: 404 });
        }
        if (index >= 0) figures[index] = body.data;
        else figures.push(body.data);
        figures.sort((left, right) => left.id.localeCompare(right.id));
        atomicWrite(filePath, `${JSON.stringify(figures, null, 2)}\n`);
        result = { ok: true, figureId, created: index < 0, revision: fileRevision(filePath) };
    } else {
        atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
        result = { ok: true, revision: fileRevision(filePath) };
    }
    const draft = draftService.noteFileChanged(relativePath);
    return { ...result, draft };
}

async function validateAdminDraft() {
    const draftStatus = draftService.status();
    if (!draftStatus.summary.active) {
        throw Object.assign(new Error('当前没有待处理草稿'), { statusCode: 409 });
    }
    if (draftStatus.summary.pending) {
        throw Object.assign(new Error('仍有未决策变更，请先逐项保留或放弃'), { statusCode: 409 });
    }
    if (!draftStatus.summary.kept) {
        throw Object.assign(new Error('没有需要校验的已保留变更'), { statusCode: 409 });
    }
    if (activeArchiveCommand) {
        throw Object.assign(new Error(`Archive command already running: ${activeArchiveCommand}`), {
            statusCode: 409
        });
    }
    activeArchiveCommand = 'validate-admin-draft';
    try {
        const fingerprint = draftStatus.fingerprint;
        writePublishState({ draftValidatedFingerprint: '', draftValidatedAt: null });
        const result = await runArchiveScript('validate-archive.js', draftService.workspaceRoot);
        if (result.ok && draftService.status().fingerprint !== fingerprint) {
            return {
                ok: false,
                stdout: result.stdout,
                stderr: `${result.stderr}\n草稿在校验期间发生变化，请重新校验。`.trim(),
                exitCode: 409,
                saved: false
            };
        }
        if (result.ok) {
            writePublishState({
                draftValidatedFingerprint: fingerprint,
                draftValidatedAt: new Date().toISOString()
            });
        }
        return { ...result, saved: false };
    } finally {
        activeArchiveCommand = '';
    }
}

async function applyAdminDraft() {
    const draftStatus = draftService.status();
    const publishState = readPublishState();
    if (publishState.draftValidatedFingerprint !== draftStatus.fingerprint) {
        throw Object.assign(new Error('请先校验保留变更，校验通过后才能保存文件'), { statusCode: 409 });
    }
    const validation = await validateAdminDraft();
    if (!validation.ok) return { ok: false, validation, applied: false };
    historyService.ensureCurrentVersion();
    const result = draftService.apply();
    const rollbackFromVersionId = result.origin?.type === 'rollback' ? result.origin.versionId : '';
    const version = historyService.createVersion({
        action: rollbackFromVersionId ? 'rollback' : 'apply',
        note: rollbackFromVersionId ? '' : `保存 Admin 草稿（${result.changedFiles.length} 个内容文件）`,
        rollbackFromVersionId,
        changedFiles: result.changedFiles,
        resourceFiles: result.resources,
        changePoints: result.changePoints
    });
    invalidatePublishedArtifacts();
    return { ok: true, validation, applied: true, result, version };
}

async function applyAndValidateAdminDraft() {
    const draftValidation = await validateAdminDraft();
    if (!draftValidation.ok) {
        return {
            ok: false,
            steps: [
                { name: 'draft-validate', ...draftValidation },
                { name: 'apply-validate', ok: false, skipped: true, message: '草稿校验失败，未保存。' }
            ]
        };
    }
    const applyResult = await applyAdminDraft();
    if (!applyResult.ok) {
        return {
            ok: false,
            steps: [
                { name: 'draft-validate', ...draftValidation },
                { name: 'apply-validate', ok: false, skipped: true, message: '草稿校验失败，未保存。' }
            ]
        };
    }
    const savedValidation = await runPublishSteps(['validate']);
    const savedValidationMessage = savedValidation.ok
        ? `已写入 ${applyResult.result.changedFiles.length} 个内容文件，并完成文件校验。`
        : `已写入 ${applyResult.result.changedFiles.length} 个内容文件，但正式文件校验失败。`;
    return {
        ok: savedValidation.ok,
        steps: [
            { name: 'draft-validate', ...draftValidation },
            {
                ...(savedValidation.steps[0] || {}),
                name: 'apply-validate',
                message: savedValidationMessage
            }
        ],
        validation: savedValidation.steps[0],
        applied: true,
        result: applyResult.result,
        version: applyResult.version
    };
}

async function saveChangesAndGenerate() {
    const before = draftService.status();
    if (!before.summary.active) {
        throw Object.assign(new Error('当前没有待保存的 Admin 变更'), { statusCode: 409 });
    }

    const decided = draftService.decideAll('kept');
    const keepStep = {
        name: 'draft-keep',
        ok: true,
        message: `已默认保留 ${decided.summary.active} 项未放弃变更，已放弃的 ${decided.summary.discarded} 项保持不变。`
    };

    const applyResult = await applyAndValidateAdminDraft();
    const draftValidation = applyResult.steps?.find((step) => step.name === 'draft-validate');
    const applyValidation = applyResult.steps?.find((step) => step.name === 'apply-validate');
    const saveStep = {
        name: 'apply-validate',
        ok: applyResult.ok,
        skipped: applyValidation?.skipped === true,
        stdout: [draftValidation?.stdout, applyValidation?.stdout].filter(Boolean).join('\n'),
        stderr: [draftValidation?.stderr, applyValidation?.stderr].filter(Boolean).join('\n'),
        message: applyResult.ok
            ? applyValidation?.message || '已保存并完成文件校验。'
            : applyValidation?.message || draftValidation?.message || '校验失败，未保存。'
    };
    if (!applyResult.ok) {
        return {
            ok: false,
            steps: [
                keepStep,
                saveStep,
                { name: 'generate', ok: false, skipped: true, message: '前一步失败，未执行。' }
            ],
            validation: applyResult.validation,
            applied: applyResult.applied === true,
            result: applyResult.result,
            version: applyResult.version
        };
    }

    const generated = await runPublishSteps(['generate']);
    return {
        ok: generated.ok,
        steps: [keepStep, saveStep, ...generated.steps],
        validation: applyResult.validation,
        applied: true,
        result: applyResult.result,
        version: applyResult.version
    };
}

async function prepareAdminPublish() {
    const steps = [];
    const draftStatus = draftService.status();
    if (draftStatus.summary.active) {
        const saveResult = await saveChangesAndGenerate();
        steps.push(...(saveResult.steps || []));
        if (!saveResult.ok) {
            steps.push({ name: 'submit', ok: false, skipped: true, message: '前一步失败，未执行。' });
            return { ok: false, steps };
        }
    } else {
        const publishResult = await runPublishSteps(['validate', 'generate']);
        steps.push(...publishResult.steps);
        if (!publishResult.ok) {
            steps.push({ name: 'submit', ok: false, skipped: true, message: '前一步失败，未执行。' });
            return { ok: false, steps };
        }
    }
    try {
        steps.push({ name: 'submit', ...(await submitAdminContent()) });
    } catch (error) {
        steps.push({ name: 'submit', ok: false, message: error.message });
    }
    return { ok: steps.every((step) => step.ok), steps };
}

const publishScripts = {
    validate: 'validate-archive.js',
    generate: 'generate-archive-data.js'
};

function assertPublishPrerequisite(name) {
    const currentRevision = archiveRevision();
    const publishState = readPublishState();
    if (name === 'generate' && publishState.savedValidatedRevision !== currentRevision) {
        throw Object.assign(new Error('请先完成“生效前先校验”，校验当前已保存的文件后才能生成运行时数据'), {
            statusCode: 409
        });
    }
}

function runtimeFilesExist() {
    return fs.existsSync(path.join(ROOT, 'milestones-data.js'));
}

async function runPublishSteps(stepNames) {
    if (draftService.status().summary.active) {
        throw Object.assign(new Error('存在待处理 Admin 草稿，请先完成保留、放弃和应用'), {
            statusCode: 409
        });
    }
    if (activeArchiveCommand) {
        throw Object.assign(new Error(`Archive command already running: ${activeArchiveCommand}`), {
            statusCode: 409
        });
    }
    activeArchiveCommand = stepNames.length > 1 ? 'prepare-submit' : `publish-${stepNames[0]}`;
    const steps = [];
    try {
        if (stepNames.includes('validate')) {
            writePublishState({
                savedValidatedRevision: '',
                savedValidatedAt: null,
                submittedArchiveRevision: '',
                submittedAt: null,
                submittedCommit: '',
                submittedRemote: '',
                submittedBranch: ''
            });
        }
        for (let index = 0; index < stepNames.length; index += 1) {
            const name = stepNames[index];
            if (name === 'generate') assertPublishPrerequisite(name);
            const stepRevision = archiveRevision();
            const result = await runProjectScript(publishScripts[name]);
            const afterRevision = archiveRevision();
            steps.push({ name, ...result });
            if (stepRevision !== afterRevision) {
                steps[steps.length - 1] = {
                    name,
                    ok: false,
                    stdout: result.stdout,
                    stderr: `${result.stderr}\n正式文件在操作期间发生变化，请重新执行发布流程。`.trim(),
                    exitCode: 409
                };
            }
            if (!result.ok) {
                for (const skippedName of stepNames.slice(index + 1)) {
                    steps.push({ name: skippedName, ok: false, skipped: true, message: '前一步失败，未执行。' });
                }
                break;
            }
            if (!steps[steps.length - 1].ok) {
                for (const skippedName of stepNames.slice(index + 1)) {
                    steps.push({ name: skippedName, ok: false, skipped: true, message: '前一步失败，未执行。' });
                }
                break;
            }
            if (name === 'validate') {
                writePublishState({
                    savedValidatedRevision: afterRevision,
                    savedValidatedAt: new Date().toISOString(),
                    testDisplayConfirmedRevision: '',
                    testDisplayConfirmedAt: null
                });
            } else if (name === 'generate') {
                writePublishState({
                    generatedArchiveRevision: afterRevision,
                    generatedAt: new Date().toISOString(),
                    submittedArchiveRevision: '',
                    submittedAt: null,
                    submittedCommit: '',
                    submittedRemote: '',
                    submittedBranch: '',
                    testDisplayConfirmedRevision: '',
                    testDisplayConfirmedAt: null
                });
            }
        }
        return { ok: steps.every((step) => step.ok), steps };
    } finally {
        activeArchiveCommand = '';
    }
}

function saveArchiveDraft(projectRoot, body) {
    if (body.type === 'figures') {
        return createArchiveFigureService(projectRoot).saveFigure({
            figureId: body.figureId,
            data: body.data,
            create: body.create === true,
            expectedRevision: body.expectedRevision || ''
        });
    }
    if (body.type === 'storylines') {
        const storylineId = safeArchiveId(body.storylineId, 'archive storylineId');
        if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
            throw Object.assign(new Error('Archive storyline data must be a JSON object'), { statusCode: 400 });
        }
        if (body.data.id !== storylineId) {
            throw Object.assign(new Error('Archive storyline data.id must match storylineId'), { statusCode: 400 });
        }
        assertUniqueStorylineEvents(body.data);
        const filePath = archiveStorylinePathForRoot(projectRoot, storylineId);
        if (!fs.existsSync(filePath)) {
            throw Object.assign(new Error('Archive storyline not found'), { statusCode: 404 });
        }
        assertExpectedRevision(filePath, body.expectedRevision);
        atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
        return { ok: true, storylineId, revision: fileRevision(filePath) };
    }
    if (body.type === 'events') {
        if (!body.data || typeof body.data !== 'object') {
            throw Object.assign(new Error('Archive file data must be JSON'), { statusCode: 400 });
        }
        const filePath = archiveEventPathForRoot(projectRoot, body.eventId, body.file);
        if (!fs.existsSync(filePath)) {
            throw Object.assign(new Error('Archive file not found'), { statusCode: 404 });
        }
        assertExpectedRevision(filePath, body.expectedRevision);
        atomicWrite(filePath, `${JSON.stringify(body.data, null, 2)}\n`);
        return {
            ok: true,
            eventId: body.eventId,
            file: body.file,
            revision: fileRevision(filePath)
        };
    }
    throw Object.assign(new Error('Unsupported Archive entity type'), { statusCode: 400 });
}

async function validateArchiveDraft(body) {
    if (activeArchiveCommand) {
        throw Object.assign(new Error(`Archive command already running: ${activeArchiveCommand}`), {
            statusCode: 409
        });
    }
    activeArchiveCommand = 'validate-draft';
    const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-archive-validation-'));
    try {
        fs.cpSync(path.join(ROOT, 'archive'), path.join(stagingRoot, 'archive'), { recursive: true });
        fs.symlinkSync(path.join(ROOT, 'resources'), path.join(stagingRoot, 'resources'), 'dir');
        saveArchiveDraft(stagingRoot, body);
        const validation = await runArchiveScript('validate-archive.js', stagingRoot);
        return { ...validation, saved: false };
    } finally {
        activeArchiveCommand = '';
        fs.rmSync(stagingRoot, { recursive: true, force: true });
    }
}

const routes = {
    'GET /admin': (req, res) => serveFile(res, path.join(__dirname, 'admin.html'), 'no-store', req.method === 'HEAD'),
    'GET /admin.css': (req, res) =>
        serveFile(res, path.join(__dirname, 'admin.css'), 'no-store', req.method === 'HEAD'),
    'GET /admin.js': (req, res) => serveFile(res, path.join(__dirname, 'admin.js'), 'no-store', req.method === 'HEAD'),

    'GET /api/archive/figures': (_req, res) => {
        try {
            const service = currentFigureService();
            sendJson(res, {
                items: service.listFigures(),
                revision: service.getRegistryRevision()
            });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/figure-options': (_req, res) => {
        try {
            sendJson(res, currentFigureService().listFigures());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/event-display-targets': (_req, res, url) => {
        try {
            sendJson(res, currentFigureService().getEventDisplayTargets(url.searchParams.get('eventId')));
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
            const body = await readJsonBody(req);
            const result = runDraftMutation(() => {
                const draftResult = restorePresentationInheritance(body);
                draftResult.changedFiles.forEach((relativePath) => draftService.noteFileChanged(relativePath));
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure': (_req, res, url) => {
        try {
            sendJson(res, currentFigureService().getFigure(url.searchParams.get('figureId')));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure': async (req, res) => {
        try {
            sendJson(res, saveAdminDraft({ ...(await readJsonBody(req)), type: 'figures' }));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure-usage': (_req, res, url) => {
        try {
            sendJson(res, currentFigureService().getFigureUsage(url.searchParams.get('figureId')));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure-assets': (_req, res, url) => {
        try {
            sendJson(
                res,
                currentFigureService().getFigureAssets(
                    url.searchParams.get('figureId'),
                    url.searchParams.get('eventId') || ''
                )
            );
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-default-avatar': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            if (!draftService.hasDraft()) {
                assertExpectedRevision(path.join(ROOT, 'archive', 'figures', 'figures.json'), body.expectedRevision);
            }
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().setDefaultAvatar(body);
                draftService.noteFileChanged('archive/figures/figures.json');
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-asset-link': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const relativePath = `archive/events/${safeArchiveId(body.eventId, 'archive eventId')}/assets.json`;
            if (!draftService.hasDraft()) {
                assertExpectedRevision(path.join(ROOT, relativePath), body.expectedRevision);
            }
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().linkFigureAsset(body);
                draftService.noteFileChanged(relativePath);
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-asset-unlink': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const associations = Array.isArray(body.associations)
                ? body.associations
                : [{ eventId: body.eventId, assetId: body.assetId }];
            const relativePaths = [
                ...new Set(
                    associations.map(
                        (association) =>
                            `archive/events/${safeArchiveId(association.eventId, 'archive eventId')}/assets.json`
                    )
                )
            ];
            if (!draftService.hasDraft()) {
                for (const association of associations) {
                    const relativePath = `archive/events/${safeArchiveId(association.eventId, 'archive eventId')}/assets.json`;
                    assertExpectedRevision(
                        path.join(ROOT, relativePath),
                        association.expectedRevision || body.expectedRevision
                    );
                }
            }
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().unlinkFigureAsset(body);
                relativePaths.forEach((relativePath) => draftService.noteFileChanged(relativePath));
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/figure-audit': (_req, res) => {
        try {
            sendJson(res, currentFigureService().getAudit());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/figure-merge-preview': (_req, res, url) => {
        try {
            sendJson(
                res,
                currentFigureService().previewFigureMerge(
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
            const body = await readJsonBody(req);
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().mergeFigures(body);
                draftResult.changedFiles.forEach((relativePath) => draftService.noteFileChanged(relativePath));
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-asset-merge-preview': async (req, res) => {
        try {
            sendJson(res, currentFigureService().previewFigureAssetMerge(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-asset-merge': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().mergeFigureAssets(body);
                draftResult.changedFiles.forEach((relativePath) => draftService.noteFileChanged(relativePath));
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/figure-image': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const hasUpload = Boolean(String(body.imageBase64 || '').trim());
            const hasUrl = Boolean(String(body.imageUrl || '').trim());
            if (hasUpload === hasUrl) {
                return sendError(res, 'Provide exactly one uploaded image or image URL', 400);
            }
            const imageBase64 = hasUrl
                ? (await downloadRemoteImage(body.imageUrl)).toString('base64')
                : body.imageBase64;
            const assetsPath = `archive/events/${safeArchiveId(body.eventId, 'archive eventId')}/assets.json`;
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().importFigureImage({ ...body, imageBase64 });
                draftService.trackResource(draftResult.asset.path);
                draftService.noteFileChanged(assetsPath);
                if (body.setAsDefaultAvatar) draftService.noteFileChanged('archive/figures/figures.json');
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/event-image': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const hasUpload = Boolean(String(body.imageBase64 || '').trim());
            const hasUrl = Boolean(String(body.imageUrl || '').trim());
            if (hasUpload === hasUrl) {
                return sendError(res, 'Provide exactly one uploaded image or image URL', 400);
            }
            const imageBase64 = hasUrl
                ? (await downloadRemoteImage(body.imageUrl)).toString('base64')
                : body.imageBase64;
            const result = runDraftMutation(() => {
                const draftResult = currentFigureService().importEventImage({
                    eventId: body.eventId,
                    assetId: body.assetId,
                    imageBase64
                });
                draftService.trackResource(draftResult.path);
                return draftResult;
            });
            sendJson(res, result);
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'GET /api/archive/events': (_req, res) => {
        try {
            const projectRoot = activeContentRoot();
            const eventsDirectory = path.join(projectRoot, 'archive', 'events');
            const usageByEventId = eventUsageById(listStorylineRecords());
            const events = fs
                .readdirSync(eventsDirectory, { withFileTypes: true })
                .filter((entry) => entry.isDirectory() && /^[a-z0-9][a-z0-9._-]*$/.test(entry.name))
                .map((entry) => {
                    const files = archiveEventFileList(entry.name);
                    const usage = usageByEventId.get(entry.name) || [];
                    const eventFile = path.join(eventsDirectory, entry.name, 'event.json');
                    const event = fs.existsSync(eventFile) ? JSON.parse(fs.readFileSync(eventFile, 'utf8')) : {};
                    return {
                        id: entry.name,
                        year: event.year || '',
                        title: event.title || {},
                        summary: event.summary || {},
                        description: event.description || {},
                        hasDefaultPresentation: Boolean(event.defaultPresentation),
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
            const eventsDirectory = path.join(activeContentRoot(), 'archive', 'events');
            const storylines = listStorylineRecords().map(({ id, data, activeEvents }) => {
                const events = (data.events || [])
                    .map((membership, index) => {
                        const eventFile = path.join(eventsDirectory, membership.eventId, 'event.json');
                        const event = fs.existsSync(eventFile) ? readJsonFile(eventFile) : {};
                        return {
                            eventId: membership.eventId,
                            order: typeof membership.order === 'number' ? membership.order : index,
                            enabled: membership.enabled !== false,
                            milestoneId: membership.milestoneId || '',
                            variant: membership.variant || '',
                            year: event.year || '',
                            title: event.title || {}
                        };
                    })
                    .sort(
                        (left, right) =>
                            Number(left.order) - Number(right.order) || left.eventId.localeCompare(right.eventId)
                    );
                return {
                    id,
                    title: data.title || {},
                    subtitle: data.subtitle || {},
                    used: activeEvents.length > 0,
                    usageCount: activeEvents.length,
                    enabledEventCount: activeEvents.length,
                    totalEventCount: (data.events || []).length,
                    events
                };
            });
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
            sendJson(res, saveAdminDraft({ ...(await readJsonBody(req)), type: 'storylines' }));
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
            sendJson(res, saveAdminDraft({ ...(await readJsonBody(req)), type: 'events' }));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/validate-draft': async (req, res) => {
        try {
            sendJson(res, await validateArchiveDraft(await readJsonBody(req)));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/draft-decision': async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const result = body.all
                ? draftService.decideAll(body.decision)
                : draftService.decide(body.changeId, body.decision);
            sendJson(res, { ok: true, draft: result });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/draft-validate': async (_req, res) => {
        try {
            sendJson(res, await validateAdminDraft());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/draft-apply': async (_req, res) => {
        try {
            sendJson(res, await applyAdminDraft());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/draft-apply-validate': async (_req, res) => {
        try {
            sendJson(res, await applyAndValidateAdminDraft());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/save-changes': async (_req, res) => {
        try {
            sendJson(res, await saveChangesAndGenerate());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/draft-reset': async (_req, res) => {
        try {
            sendJson(res, { ok: true, draft: draftService.reset() });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 400);
        }
    },

    'POST /api/archive/validate': (_req, res) => runArchiveCommand(res, 'validate', 'validate-archive.js'),

    'POST /api/archive/generate': (_req, res) => runArchiveCommand(res, 'generate', 'generate-archive-data.js'),

    'GET /api/archive/publish-status': async (req, res) => {
        try {
            sendJson(res, await getPublishStatus(req));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/history': (_req, res) => {
        try {
            sendJson(res, { ok: true, versions: historyService.listVersions() });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'GET /api/archive/history-version': (_req, res, url) => {
        try {
            sendJson(res, { ok: true, version: historyService.getVersion(url.searchParams.get('versionId')) });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'POST /api/archive/history-restore': async (req, res) => {
        try {
            if (activeArchiveCommand) {
                throw Object.assign(new Error(`Archive command already running: ${activeArchiveCommand}`), {
                    statusCode: 409
                });
            }
            const body = await readJsonBody(req);
            sendJson(res, { ok: true, ...historyService.createRollbackDraft(body.versionId, draftService) });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'POST /api/archive/publish-validate': async (_req, res) => {
        try {
            sendJson(res, await runPublishSteps(['validate']));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'POST /api/archive/publish-generate': async (_req, res) => {
        try {
            sendJson(res, await runPublishSteps(['generate']));
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'POST /api/archive/test-display-confirm': (_req, res) => {
        try {
            sendJson(res, confirmTestDisplay());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 409);
        }
    },

    'POST /api/archive/undo-last-change': (_req, res) => {
        try {
            sendJson(res, createUndoLastChangeDraft());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 409);
        }
    },

    'GET /api/archive/git-status': async (_req, res) => {
        try {
            sendJson(res, { ok: true, git: await getGitStatus() });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'POST /api/archive/submit-github': async (req, res) => {
        try {
            const body = req.headers['content-type'] ? await readJsonBody(req) : {};
            sendJson(res, { ok: true, ...(await submitAdminContent(body)) });
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
    },

    'POST /api/archive/prepare-submit': async (_req, res) => {
        try {
            sendJson(res, await prepareAdminPublish());
        } catch (error) {
            sendError(res, error.message, error.statusCode || 500);
        }
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
