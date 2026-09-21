'use strict';

const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function atomicWrite(filePath, content) {
    const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    try {
        fs.writeFileSync(temporaryPath, content);
        fs.renameSync(temporaryPath, filePath);
    } finally {
        fs.rmSync(temporaryPath, { force: true });
    }
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeChangePoint(change) {
    const fields = [
        'id',
        'file',
        'fileLabel',
        'operation',
        'action',
        'group',
        'objectId',
        'summary',
        'keyField',
        'key',
        'index',
        'value',
        'commonValues',
        'beforeText',
        'afterText'
    ];
    const normalized = {};
    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(change, field)) {
            normalized[field] = clone(change[field]);
        }
    }
    return normalized;
}

function listJsonFiles(directory, prefix = '') {
    if (!fs.existsSync(directory)) return [];
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...listJsonFiles(filePath, relativePath));
        else if (entry.isFile() && entry.name.endsWith('.json')) files.push(relativePath);
    }
    return files.sort();
}

function snapshotEntries(projectRoot) {
    const archiveRoot = path.join(projectRoot, 'archive');
    return listJsonFiles(archiveRoot).map((relativeArchivePath) => {
        const content = fs.readFileSync(path.join(archiveRoot, relativeArchivePath));
        return {
            relativeArchivePath,
            relativePath: `archive/${relativeArchivePath}`,
            content,
            hash: createHash('sha256').update(content).digest('hex'),
            bytes: content.length
        };
    });
}

function snapshotHash(entries) {
    const hash = createHash('sha256');
    for (const entry of entries) {
        hash.update(entry.relativePath);
        hash.update('\0');
        hash.update(entry.content);
        hash.update('\0');
    }
    return hash.digest('hex');
}

function fileContext(relativePath) {
    const eventMatch = relativePath.match(/^archive\/events\/([^/]+)\/(.+)$/);
    if (eventMatch) return { group: '事件', objectId: eventMatch[1] };
    const storylineMatch = relativePath.match(/^archive\/storylines\/([^/]+)\.json$/);
    if (storylineMatch) return { group: '故事线', objectId: storylineMatch[1] };
    if (relativePath === 'archive/figures/figures.json') {
        return { group: '人物 / 实体', objectId: '人物注册表' };
    }
    return { group: 'Archive', objectId: relativePath };
}

function compareSnapshots(previousEntries, nextEntries) {
    const previous = new Map(previousEntries.map((entry) => [entry.relativePath, entry]));
    const next = new Map(nextEntries.map((entry) => [entry.relativePath, entry]));
    const files = [...new Set([...previous.keys(), ...next.keys()])].sort();
    return files.flatMap((relativePath) => {
        const before = previous.get(relativePath);
        const after = next.get(relativePath);
        if (before?.hash === after?.hash) return [];
        const operation = !before ? 'added' : !after ? 'deleted' : 'modified';
        return [{ file: relativePath, operation, ...fileContext(relativePath) }];
    });
}

function safeVersionId(value) {
    const versionId = String(value || '').trim();
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(versionId)) {
        throw Object.assign(new Error('Invalid history version id'), { statusCode: 400 });
    }
    return versionId;
}

function createAdminHistoryService(root) {
    const historyRoot = path.join(root, '.admin-history');
    const legacyHistoryRoot = path.join(root, '.tmp', 'admin-history');
    const versionsRoot = path.join(historyRoot, 'versions');
    const indexPath = path.join(historyRoot, 'index.json');

    function ensureStorageLocation() {
        if (fs.existsSync(historyRoot) || !fs.existsSync(legacyHistoryRoot)) return;
        try {
            fs.renameSync(legacyHistoryRoot, historyRoot);
        } catch (error) {
            if (error.code !== 'EXDEV') throw error;
            fs.cpSync(legacyHistoryRoot, historyRoot, { recursive: true });
            fs.rmSync(legacyHistoryRoot, { recursive: true, force: true });
        }
    }

    function readIndex() {
        ensureStorageLocation();
        if (!fs.existsSync(indexPath)) return { version: 1, versions: [] };
        const index = readJson(indexPath);
        return {
            version: 1,
            versions: Array.isArray(index.versions) ? index.versions : []
        };
    }

    function writeIndex(index) {
        atomicWrite(indexPath, `${JSON.stringify(index, null, 2)}\n`);
    }

    function versionRoot(versionId) {
        ensureStorageLocation();
        return path.join(versionsRoot, safeVersionId(versionId));
    }

    function readVersion(versionId) {
        const id = safeVersionId(versionId);
        const metadataPath = path.join(versionRoot(id), 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            throw Object.assign(new Error('历史版本不存在'), { statusCode: 404 });
        }
        return readJson(metadataPath);
    }

    function entriesForVersion(versionId) {
        return snapshotEntries(versionRoot(versionId));
    }

    function createVersion({
        action,
        note = '',
        rollbackFromVersionId = '',
        changedFiles = [],
        resourceFiles = [],
        changePoints = [],
        skipIfUnchanged = false
    } = {}) {
        const entries = snapshotEntries(root);
        const dataHash = snapshotHash(entries);
        const index = readIndex();
        const previous = index.versions[index.versions.length - 1] || null;
        if (skipIfUnchanged && previous?.dataHash === dataHash) {
            return { ...previous, created: false };
        }

        const createdAt = new Date().toISOString();
        const timestamp = createdAt.replace(/[-:.TZ]/g, '').slice(0, 14);
        let id = `${timestamp}-${dataHash.slice(0, 10)}`;
        if (fs.existsSync(versionRoot(id))) id = `${id}-${randomUUID().slice(0, 6)}`;
        const temporaryRoot = path.join(versionsRoot, `.${id}.${process.pid}.${randomUUID()}.tmp`);
        const previousEntries = previous ? entriesForVersion(previous.id) : [];
        const changes = previous ? compareSnapshots(previousEntries, entries) : [];
        const normalizedChangePoints = changePoints.map(normalizeChangePoint);
        const totalBytes = entries.reduce((total, entry) => total + entry.bytes, 0);
        const rollbackTarget = rollbackFromVersionId ? readVersion(rollbackFromVersionId) : null;
        const rollbackExact = rollbackTarget ? rollbackTarget.dataHash === dataHash : null;
        const resolvedNote = rollbackTarget
            ? rollbackExact
                ? `回滚到历史版本 ${rollbackTarget.id}`
                : `基于历史版本 ${rollbackTarget.id} 的部分回滚`
            : String(note || '');
        const metadata = {
            id,
            action: action || (previous ? 'apply' : 'initial'),
            createdAt,
            note: resolvedNote,
            dataHash,
            fileCount: entries.length,
            totalBytes,
            previousVersionId: previous?.id || '',
            rollbackFromVersionId: rollbackFromVersionId ? safeVersionId(rollbackFromVersionId) : '',
            rollbackExact,
            changePointCount: normalizedChangePoints.length,
            changePoints: normalizedChangePoints,
            changeCount: changes.length,
            changedFiles: [...new Set(changedFiles)].sort(),
            resourceFiles: [...new Set(resourceFiles)].sort(),
            changes
        };

        fs.mkdirSync(path.join(temporaryRoot, 'archive'), { recursive: true });
        try {
            for (const entry of entries) {
                const destination = path.join(temporaryRoot, entry.relativePath);
                fs.mkdirSync(path.dirname(destination), { recursive: true });
                fs.writeFileSync(destination, entry.content);
            }
            fs.writeFileSync(path.join(temporaryRoot, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
            fs.mkdirSync(versionsRoot, { recursive: true });
            fs.renameSync(temporaryRoot, versionRoot(id));
            index.versions.push(metadata);
            writeIndex(index);
        } catch (error) {
            fs.rmSync(temporaryRoot, { recursive: true, force: true });
            fs.rmSync(versionRoot(id), { recursive: true, force: true });
            throw error;
        }
        return { ...metadata, created: true };
    }

    function ensureInitialVersion() {
        const index = readIndex();
        if (index.versions.length) return index.versions[index.versions.length - 1];
        return createVersion({
            action: 'initial',
            note: '启用 Admin 历史版本时的正式内容文件基线'
        });
    }

    function ensureCurrentVersion() {
        ensureInitialVersion();
        return createVersion({
            action: 'external',
            note: '记录 Admin 之外产生的正式内容文件变化',
            skipIfUnchanged: true
        });
    }

    function listVersions() {
        return [...readIndex().versions]
            .reverse()
            .map(({ changes: _changes, changedFiles: _changedFiles, ...version }) => version);
    }

    function summary() {
        const versions = listVersions();
        return {
            count: versions.length,
            latest: versions[0] || null
        };
    }

    function createRollbackDraft(versionId, draftService) {
        const version = readVersion(versionId);
        const draft = draftService.createFromArchiveSnapshot(versionRoot(version.id), {
            type: 'rollback',
            versionId: version.id,
            createdAt: new Date().toISOString()
        });
        return { version, draft };
    }

    return {
        createRollbackDraft,
        createVersion,
        ensureCurrentVersion,
        ensureInitialVersion,
        getVersion: readVersion,
        listVersions,
        summary,
        versionRoot
    };
}

module.exports = {
    createAdminHistoryService
};
