'use strict';

const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function hashBuffer(value) {
    return createHash('sha256').update(value).digest('hex');
}

function fileRevision(filePath) {
    return fs.existsSync(filePath) ? hashBuffer(fs.readFileSync(filePath)) : '';
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

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

function linkTree(source, destination) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);
        if (entry.isDirectory()) {
            linkTree(sourcePath, destinationPath);
        } else if (entry.isSymbolicLink()) {
            const resolved = fs.realpathSync(sourcePath);
            if (fs.statSync(resolved).isDirectory()) linkTree(resolved, destinationPath);
            else fs.linkSync(resolved, destinationPath);
        } else if (entry.isFile()) {
            fs.linkSync(sourcePath, destinationPath);
        }
    }
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

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isEmptyJsonValue(value) {
    return (
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.values(value).every((entry) => isEmptyJsonValue(entry)))
    );
}

function semanticallyEqual(left, right) {
    if (left === undefined || right === undefined) {
        if (left === undefined && right === undefined) return true;
        return isEmptyJsonValue(left === undefined ? right : left);
    }
    if (left === right) return true;
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
        return left.every((value, index) => semanticallyEqual(value, right[index]));
    }
    if (
        left &&
        right &&
        typeof left === 'object' &&
        typeof right === 'object' &&
        !Array.isArray(left) &&
        !Array.isArray(right)
    ) {
        const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
        return [...keys].every((key) => semanticallyEqual(left[key], right[key]));
    }
    return false;
}

function equal(left, right) {
    return semanticallyEqual(left, right);
}

function collectionIdentity(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    for (const field of ['id', 'eventId', 'figureId']) {
        if (typeof value[field] === 'string' && value[field]) return { field, value: value[field] };
    }
    return null;
}

// Keep the baseline's object-key order while removing only newly introduced empty values.
function normalizeDraftValue(value, baseline, keepEmpty = baseline === undefined) {
    if (Array.isArray(value)) {
        const baselineItems = Array.isArray(baseline) ? baseline : [];
        const baselineByIdentity = new Map();
        for (const candidate of baselineItems) {
            const identity = collectionIdentity(candidate);
            if (identity) baselineByIdentity.set(`${identity.field}\0${identity.value}`, candidate);
        }
        return value.map((item, index) => {
            const identity = collectionIdentity(item);
            const matchingBaseline = identity
                ? baselineByIdentity.get(`${identity.field}\0${identity.value}`)
                : baselineItems[index];
            return normalizeDraftValue(item, matchingBaseline, matchingBaseline === undefined);
        });
    }
    if (value && typeof value === 'object') {
        const baselineObject = baseline && typeof baseline === 'object' && !Array.isArray(baseline) ? baseline : {};
        const keys = [
            ...Object.keys(baselineObject).filter((key) => Object.prototype.hasOwnProperty.call(value, key)),
            ...Object.keys(value).filter((key) => !Object.prototype.hasOwnProperty.call(baselineObject, key))
        ];
        const normalized = {};
        for (const key of keys) {
            const hasBaselineKey = Object.prototype.hasOwnProperty.call(baselineObject, key);
            const nextValue = normalizeDraftValue(value[key], baselineObject[key], keepEmpty && !hasBaselineKey);
            if (!keepEmpty && !hasBaselineKey && isEmptyJsonValue(nextValue)) continue;
            normalized[key] = nextValue;
        }
        return normalized;
    }
    return value;
}

function itemKeyField(before, after) {
    const values = [...before, ...after];
    if (!values.length || values.some((value) => !value || typeof value !== 'object' || Array.isArray(value))) {
        return '';
    }
    for (const field of ['id', 'eventId', 'figureId']) {
        const beforeKeys = before.map((value) => value[field]);
        const afterKeys = after.map((value) => value[field]);
        if (
            [...beforeKeys, ...afterKeys].every((key) => typeof key === 'string' && key) &&
            new Set(beforeKeys).size === beforeKeys.length &&
            new Set(afterKeys).size === afterKeys.length
        ) {
            return field;
        }
    }
    return '';
}

function pathKey(tokens) {
    return tokens
        .map((token) =>
            typeof token === 'string' ? token : `${token.keyField}=${encodeURIComponent(String(token.key))}`
        )
        .join('/');
}

function preview(value) {
    if (value === undefined) return '无';
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function fileContext(relativePath) {
    const eventMatch = relativePath.match(/^archive\/events\/([^/]+)\/([^/]+(?:\/[^/]+)?)$/);
    if (eventMatch) {
        const fileLabels = {
            'assets.json': '图片与音视频',
            'claims.json': '事实主张',
            'event.json': '事件资料',
            'quizzes.json': 'Quiz',
            'sources.json': '来源'
        };
        return {
            group: '事件',
            objectId: eventMatch[1],
            fileLabel: fileLabels[eventMatch[2]] || eventMatch[2]
        };
    }
    const storylineMatch = relativePath.match(/^archive\/storylines\/([^/]+)\.json$/);
    if (storylineMatch) return { group: '故事线', objectId: storylineMatch[1], fileLabel: '故事线' };
    if (relativePath === 'archive/figures/figures.json') {
        return { group: '人物 / 实体', objectId: '人物注册表', fileLabel: '人物注册表' };
    }
    return { group: 'Archive', objectId: relativePath, fileLabel: relativePath };
}

const fieldLabels = {
    assetIds: '图片与音视频顺序',
    defaultAvatar: '默认头像',
    description: '描述',
    displayTitle: '展示标题',
    figureIds: '关联人物',
    figures: '人物关系',
    overviewImageAssetId: '首图资产',
    profileSources: '资料来源',
    quizzes: 'Quiz',
    role: '角色',
    sourceIds: '来源关联',
    title: '标题'
};

function tokenLabel(token) {
    if (typeof token !== 'string') return token.key;
    return fieldLabels[token] || token;
}

function changeDescription(relativePath, operation, tokens, before, after, metadata = {}) {
    const context = fileContext(relativePath);
    const scopedToken = tokens.find((token) => typeof token !== 'string');
    const objectId = scopedToken
        ? context.group === '人物 / 实体'
            ? scopedToken.key
            : `${context.objectId} / ${scopedToken.key}`
        : context.objectId;
    const lastToken = tokens[tokens.length - 1];
    const parentToken = tokens[tokens.length - 2];
    const field = tokenLabel(lastToken || context.fileLabel);
    let action = '编辑';
    let summary = `${objectId}：修改 ${field}`;

    if (operation === 'add-item') {
        action = '添加';
        const collection = tokenLabel(lastToken || context.fileLabel);
        summary = `${objectId}：添加${collection} ${metadata.key || ''}`.trim();
    } else if (operation === 'remove-item') {
        action = '删除';
        const collection = tokenLabel(lastToken || context.fileLabel);
        summary = `${objectId}：删除${collection} ${metadata.key || ''}`.trim();
    } else if (operation === 'reorder') {
        action = '调整顺序';
        summary = `${objectId}：调整${tokenLabel(lastToken || context.fileLabel)}顺序`;
    } else if (operation === 'add-value') {
        action = lastToken === 'figureIds' ? '关联人物' : '添加';
        summary = `${objectId}：${action} ${metadata.value || ''}`.trim();
    } else if (operation === 'remove-value') {
        action = lastToken === 'figureIds' ? '解除人物关联' : '移除';
        summary = `${objectId}：${action} ${metadata.value || ''}`.trim();
    } else if (operation === 'add') {
        action = parentToken === 'figureIds' ? '关联' : '添加';
        summary = `${objectId}：${action} ${field}`;
    } else if (operation === 'remove') {
        action = parentToken === 'figureIds' ? '解除关联' : '删除';
        summary = `${objectId}：${action} ${field}`;
    }

    if (relativePath.endsWith('/assets.json') && operation === 'add-item') {
        action = '添加图片/音视频';
        summary = `${context.objectId}：添加资产 ${metadata.key || ''}`.trim();
    }
    if (relativePath.endsWith('/assets.json') && operation === 'remove-item') {
        action = '移除图片/音视频';
        summary = `${context.objectId}：移除资产 ${metadata.key || ''}`.trim();
    }
    if (relativePath.startsWith('archive/storylines/') && lastToken === 'events') {
        if (operation === 'add-item') action = '添加事件到故事线';
        if (operation === 'remove-item') action = '从故事线移除事件';
        summary = `${context.objectId}：${action} ${metadata.key || ''}`.trim();
    }
    if (relativePath === 'archive/figures/figures.json' && lastToken === undefined) {
        summary = `人物注册表：${action}人物 / 实体 ${metadata.key || ''}`.trim();
    }

    return {
        action,
        group: context.group,
        objectId: context.objectId,
        summary,
        beforeText: preview(before),
        afterText: preview(after)
    };
}

function isStorylineEventOrderChange(change) {
    return (
        ['add', 'remove', 'replace'].includes(change.operation) &&
        change.path.length === 3 &&
        change.path[0] === 'events' &&
        typeof change.path[1] !== 'string' &&
        change.path[2] === 'order'
    );
}

function makeChange(relativePath, operation, tokens, before, after, metadata = {}) {
    const stableKey = `${relativePath}\0${operation}\0${pathKey(tokens)}\0${metadata.keyField || ''}\0${metadata.key || ''}\0${JSON.stringify(metadata.value)}`;
    const id = createHash('sha1').update(stableKey).digest('hex').slice(0, 16);
    const fingerprint = createHash('sha1')
        .update(`${stableKey}\0${JSON.stringify(before)}\0${JSON.stringify(after)}`)
        .digest('hex');
    return {
        id,
        fingerprint,
        file: relativePath,
        operation,
        path: clone(tokens),
        before: clone(before),
        after: clone(after),
        ...metadata,
        ...changeDescription(relativePath, operation, tokens, before, after, metadata)
    };
}

function diffValues(relativePath, before, after, tokens = [], changes = []) {
    if (equal(before, after)) return changes;
    if (Array.isArray(before) && Array.isArray(after)) {
        const primitiveValues = [...before, ...after].every(
            (value) => ['string', 'number', 'boolean'].includes(typeof value) || value === null
        );
        if (primitiveValues && new Set(before).size === before.length && new Set(after).size === after.length) {
            for (const [index, value] of before.entries()) {
                if (!after.includes(value)) {
                    changes.push(makeChange(relativePath, 'remove-value', tokens, value, undefined, { value, index }));
                }
            }
            for (const [index, value] of after.entries()) {
                if (!before.includes(value)) {
                    changes.push(makeChange(relativePath, 'add-value', tokens, undefined, value, { value, index }));
                }
            }
            const beforeCommon = before.filter((value) => after.includes(value));
            const afterCommon = after.filter((value) => before.includes(value));
            if (!equal(beforeCommon, afterCommon)) {
                changes.push(
                    makeChange(relativePath, 'reorder', tokens, beforeCommon, afterCommon, {
                        commonValues: beforeCommon
                    })
                );
            }
            return changes;
        }
        const keyField = itemKeyField(before, after);
        if (!keyField) {
            changes.push(makeChange(relativePath, 'replace', tokens, before, after));
            return changes;
        }
        const beforeMap = new Map(before.map((item, index) => [item[keyField], { item, index }]));
        const afterMap = new Map(after.map((item, index) => [item[keyField], { item, index }]));
        for (const [key, entry] of beforeMap) {
            if (!afterMap.has(key)) {
                changes.push(
                    makeChange(relativePath, 'remove-item', tokens, entry.item, undefined, {
                        keyField,
                        key,
                        index: entry.index
                    })
                );
            }
        }
        for (const [key, entry] of afterMap) {
            if (!beforeMap.has(key)) {
                changes.push(
                    makeChange(relativePath, 'add-item', tokens, undefined, entry.item, {
                        keyField,
                        key,
                        index: entry.index
                    })
                );
            }
        }
        for (const [key, beforeEntry] of beforeMap) {
            const afterEntry = afterMap.get(key);
            if (!afterEntry) continue;
            diffValues(relativePath, beforeEntry.item, afterEntry.item, [...tokens, { keyField, key }], changes);
        }
        const beforeKeys = before.map((item) => item[keyField]);
        const afterKeys = after.map((item) => item[keyField]);
        if (
            beforeKeys.length === afterKeys.length &&
            beforeKeys.every((key) => afterMap.has(key)) &&
            !equal(beforeKeys, afterKeys)
        ) {
            changes.push(
                makeChange(relativePath, 'reorder', tokens, beforeKeys, afterKeys, {
                    keyField
                })
            );
        }
        return changes;
    }
    if (
        before &&
        after &&
        typeof before === 'object' &&
        typeof after === 'object' &&
        !Array.isArray(before) &&
        !Array.isArray(after)
    ) {
        const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
        for (const key of [...keys].sort()) {
            if (!(key in before))
                changes.push(makeChange(relativePath, 'add', [...tokens, key], undefined, after[key]));
            else if (!(key in after))
                changes.push(makeChange(relativePath, 'remove', [...tokens, key], before[key], undefined));
            else diffValues(relativePath, before[key], after[key], [...tokens, key], changes);
        }
        return changes;
    }
    changes.push(makeChange(relativePath, 'replace', tokens, before, after));
    return changes;
}

function collapseDerivedChanges(relativePath, changes) {
    if (!relativePath.startsWith('archive/storylines/')) return changes;
    const hasMembershipChange = changes.some(
        (change) =>
            change.path.length === 1 &&
            change.path[0] === 'events' &&
            ['add-item', 'remove-item', 'reorder'].includes(change.operation)
    );
    if (!hasMembershipChange) return changes;
    return changes.filter((change) => !isStorylineEventOrderChange(change));
}

function resolveParent(root, tokens) {
    let current = root;
    for (const token of tokens) {
        if (typeof token === 'string') current = current[token];
        else current = current.find((item) => item && item[token.keyField] === token.key);
    }
    return current;
}

function revertChange(documentValue, change) {
    if (
        change.operation === 'add-item' ||
        change.operation === 'remove-item' ||
        change.operation === 'add-value' ||
        change.operation === 'remove-value' ||
        change.operation === 'reorder'
    ) {
        const target = resolveParent(documentValue, change.path);
        if (!Array.isArray(target)) throw new Error(`Draft collection no longer exists for ${change.summary}`);
        if (change.operation === 'add-item') {
            const index = target.findIndex((item) => item && item[change.keyField] === change.key);
            if (index >= 0) target.splice(index, 1);
        } else if (change.operation === 'remove-item') {
            const index = Math.min(Number(change.index) || 0, target.length);
            target.splice(index, 0, clone(change.before));
        } else if (change.operation === 'add-value') {
            const index = target.indexOf(change.value);
            if (index >= 0) target.splice(index, 1);
        } else if (change.operation === 'remove-value') {
            const index = Math.min(Number(change.index) || 0, target.length);
            if (!target.includes(change.before)) target.splice(index, 0, clone(change.before));
        } else {
            const order = new Map(change.before.map((key, index) => [key, index]));
            if (change.commonValues) {
                const positions = [];
                const values = [];
                target.forEach((value, index) => {
                    if (order.has(value)) {
                        positions.push(index);
                        values.push(value);
                    }
                });
                values.sort((left, right) => order.get(left) - order.get(right));
                positions.forEach((position, index) => {
                    target[position] = values[index];
                });
            } else {
                target.sort((left, right) => {
                    const leftKey = change.keyField ? left[change.keyField] : left;
                    const rightKey = change.keyField ? right[change.keyField] : right;
                    return order.get(leftKey) - order.get(rightKey);
                });
            }
        }
        return documentValue;
    }
    if (!change.path.length) return clone(change.before);
    const parent = resolveParent(documentValue, change.path.slice(0, -1));
    const token = change.path[change.path.length - 1];
    if (typeof token !== 'string') throw new Error(`Unsupported draft path for ${change.summary}`);
    if (change.before === undefined) delete parent[token];
    else parent[token] = clone(change.before);
    return documentValue;
}

function rebuildStorylineDerivedOrder(documentValue, baselineValue) {
    if (
        !documentValue ||
        !baselineValue ||
        !Array.isArray(documentValue.events) ||
        !Array.isArray(baselineValue.events)
    ) {
        return documentValue;
    }
    const documentIds = documentValue.events.map((item) => item && item.eventId);
    const baselineIds = baselineValue.events.map((item) => item && item.eventId);
    if (documentIds.length !== baselineIds.length || documentIds.some((id, index) => id !== baselineIds[index])) {
        return documentValue;
    }
    const baselineById = new Map(baselineValue.events.map((item) => [item.eventId, item]));
    documentValue.events = documentValue.events.map((item) => {
        const baselineItem = baselineById.get(item.eventId);
        if (!baselineItem) return item;
        const nextItem = { ...item };
        if (Object.hasOwn(baselineItem, 'order')) nextItem.order = clone(baselineItem.order);
        else delete nextItem.order;
        return nextItem;
    });
    return documentValue;
}

function publicChange(change, status) {
    const { before: _before, after: _after, path: _path, fingerprint: _fingerprint, ...visible } = change;
    return { ...visible, status };
}

function draftFingerprint(manifest, changes, workspaceRoot) {
    if (!changes.length && !manifest.stagedResources.length) return null;
    const decisions = changes
        .map((change) => {
            const decision = manifest.decisions[change.id];
            const status = decision && decision.fingerprint === change.fingerprint ? decision.status : 'pending';
            return [change.id, change.fingerprint, status];
        })
        .sort(([left], [right]) => left.localeCompare(right));
    const resources = [...manifest.stagedResources]
        .sort()
        .map((relativePath) => [relativePath, fileRevision(path.join(workspaceRoot, relativePath))]);
    return hashBuffer(JSON.stringify({ decisions, resources }));
}

function createAdminDraftService(root) {
    const draftDirectory = path.join(root, '.tmp', 'admin-drafts');
    const baselineRoot = path.join(draftDirectory, 'baseline');
    const workspaceRoot = path.join(draftDirectory, 'workspace');
    const manifestPath = path.join(draftDirectory, 'manifest.json');

    function hasDraft() {
        return fs.existsSync(manifestPath);
    }

    function readManifest() {
        return hasDraft()
            ? readJson(manifestPath)
            : {
                  version: 1,
                  createdAt: '',
                  updatedAt: '',
                  files: {},
                  decisions: {},
                  discarded: [],
                  stagedResources: [],
                  origin: null
              };
    }

    function writeManifest(manifest) {
        manifest.updatedAt = new Date().toISOString();
        atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }

    function ensureInitialized() {
        if (hasDraft()) {
            const manifest = readManifest();
            if (!manifest.discarded.length || Object.keys(manifest.files).length || manifest.stagedResources.length) {
                return;
            }
            fs.rmSync(draftDirectory, { recursive: true, force: true });
        }
        fs.mkdirSync(draftDirectory, { recursive: true });
        fs.cpSync(path.join(root, 'archive'), path.join(baselineRoot, 'archive'), { recursive: true });
        fs.cpSync(path.join(root, 'archive'), path.join(workspaceRoot, 'archive'), { recursive: true });
        if (fs.existsSync(path.join(root, 'resources'))) {
            linkTree(path.join(root, 'resources'), path.join(workspaceRoot, 'resources'));
        }
        const now = new Date().toISOString();
        writeManifest({
            version: 1,
            createdAt: now,
            updatedAt: now,
            files: {},
            decisions: {},
            discarded: [],
            stagedResources: [],
            origin: null
        });
    }

    function createFromArchiveSnapshot(snapshotRoot, origin) {
        const currentStatus = status();
        if (currentStatus.summary.active || currentStatus.summary.stagedResources) {
            throw Object.assign(new Error('当前存在待处理 Admin 草稿，请先保留并应用或全部放弃'), {
                statusCode: 409
            });
        }
        const snapshotArchiveRoot = path.join(snapshotRoot, 'archive');
        if (!fs.existsSync(snapshotArchiveRoot) || !fs.statSync(snapshotArchiveRoot).isDirectory()) {
            throw Object.assign(new Error('历史版本快照不完整'), { statusCode: 500 });
        }

        fs.rmSync(draftDirectory, { recursive: true, force: true });
        fs.mkdirSync(draftDirectory, { recursive: true });
        fs.cpSync(path.join(root, 'archive'), path.join(baselineRoot, 'archive'), { recursive: true });
        fs.cpSync(path.join(root, 'archive'), path.join(workspaceRoot, 'archive'), { recursive: true });
        if (fs.existsSync(path.join(root, 'resources'))) {
            linkTree(path.join(root, 'resources'), path.join(workspaceRoot, 'resources'));
        }

        const currentFiles = new Set(listJsonFiles(path.join(workspaceRoot, 'archive')));
        const snapshotFiles = new Set(listJsonFiles(snapshotArchiveRoot));
        for (const relativeArchivePath of currentFiles) {
            if (!snapshotFiles.has(relativeArchivePath)) {
                fs.rmSync(path.join(workspaceRoot, 'archive', relativeArchivePath), { force: true });
            }
        }
        for (const relativeArchivePath of snapshotFiles) {
            const source = path.join(snapshotArchiveRoot, relativeArchivePath);
            const destination = path.join(workspaceRoot, 'archive', relativeArchivePath);
            atomicWrite(destination, fs.readFileSync(source));
        }

        const now = new Date().toISOString();
        const files = {};
        for (const relativeArchivePath of [...new Set([...currentFiles, ...snapshotFiles])].sort()) {
            const relativePath = `archive/${relativeArchivePath}`;
            const baselinePath = path.join(baselineRoot, relativePath);
            const workspacePath = path.join(workspaceRoot, relativePath);
            if (fileRevision(baselinePath) === fileRevision(workspacePath)) continue;
            files[relativePath] = {
                baseRevision: fileRevision(baselinePath),
                firstChangedAt: now
            };
        }
        writeManifest({
            version: 1,
            createdAt: now,
            updatedAt: now,
            files,
            decisions: {},
            discarded: [],
            stagedResources: [],
            origin: clone(origin) || null
        });
        pruneManifest();
        return status();
    }

    function contentRoot() {
        return hasDraft() ? workspaceRoot : root;
    }

    function changesForManifest(manifest = readManifest()) {
        const changes = [];
        for (const relativePath of Object.keys(manifest.files).sort()) {
            const baselinePath = path.join(baselineRoot, relativePath);
            const workspacePath = path.join(workspaceRoot, relativePath);
            const before = fs.existsSync(baselinePath) ? readJson(baselinePath) : undefined;
            const after = fs.existsSync(workspacePath) ? readJson(workspacePath) : undefined;
            changes.push(...collapseDerivedChanges(relativePath, diffValues(relativePath, before, after)));
        }
        return changes;
    }

    function pruneManifest() {
        if (!hasDraft()) return;
        const manifest = readManifest();
        const activeChanges = changesForManifest(manifest);
        const activeFiles = new Set(activeChanges.map((change) => change.file));
        for (const relativePath of Object.keys(manifest.files)) {
            if (activeFiles.has(relativePath)) continue;
            const baselinePath = path.join(baselineRoot, relativePath);
            const workspacePath = path.join(workspaceRoot, relativePath);
            if (fs.existsSync(baselinePath)) atomicWrite(workspacePath, fs.readFileSync(baselinePath));
            else fs.rmSync(workspacePath, { force: true });
            delete manifest.files[relativePath];
        }
        const activeIds = new Set(activeChanges.map((change) => change.id));
        for (const id of Object.keys(manifest.decisions)) {
            if (!activeIds.has(id)) delete manifest.decisions[id];
        }
        manifest.discarded = manifest.discarded.filter((change) => !activeIds.has(change.id));
        const archiveText = [...activeFiles]
            .filter((relativePath) => relativePath.startsWith('archive/'))
            .filter((relativePath) => fs.existsSync(path.join(workspaceRoot, relativePath)))
            .map((relativePath) => fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8'))
            .join('\n');
        manifest.stagedResources = manifest.stagedResources.filter((relativePath) => {
            if (archiveText.includes(relativePath)) return true;
            fs.rmSync(path.join(workspaceRoot, relativePath), { force: true });
            return false;
        });
        if (!Object.keys(manifest.files).length && !manifest.stagedResources.length && !manifest.discarded.length) {
            fs.rmSync(draftDirectory, { recursive: true, force: true });
            return;
        }
        writeManifest(manifest);
    }

    function noteFileChanged(relativePath) {
        ensureInitialized();
        normalizeWorkspaceFile(relativePath);
        const manifest = readManifest();
        if (!manifest.files[relativePath]) {
            manifest.files[relativePath] = {
                baseRevision: fileRevision(path.join(baselineRoot, relativePath)),
                firstChangedAt: new Date().toISOString()
            };
            writeManifest(manifest);
        }
        pruneManifest();
        return status();
    }

    function normalizeWorkspaceFile(relativePath) {
        const workspacePath = path.join(workspaceRoot, relativePath);
        if (!fs.existsSync(workspacePath) || !relativePath.endsWith('.json')) return;
        const baselinePath = path.join(baselineRoot, relativePath);
        const value = readJson(workspacePath);
        const baseline = fs.existsSync(baselinePath) ? readJson(baselinePath) : undefined;
        atomicWrite(
            workspacePath,
            `${JSON.stringify(normalizeDraftValue(value, baseline, baseline === undefined), null, 2)}\n`
        );
    }

    function trackResource(relativePath) {
        ensureInitialized();
        const manifest = readManifest();
        if (!fs.existsSync(path.join(root, relativePath)) && !manifest.stagedResources.includes(relativePath)) {
            manifest.stagedResources.push(relativePath);
            writeManifest(manifest);
        }
    }

    function status() {
        const manifest = readManifest();
        const changes = hasDraft() ? changesForManifest(manifest) : [];
        const active = changes.map((change) => {
            const decision = manifest.decisions[change.id];
            const decisionStatus =
                decision && decision.fingerprint === change.fingerprint ? decision.status : 'pending';
            return publicChange(change, decisionStatus);
        });
        const kept = active.filter((change) => change.status === 'kept').length;
        const pending = active.filter((change) => change.status === 'pending').length;
        return {
            active,
            discarded: manifest.discarded || [],
            summary: {
                total: active.length + (manifest.discarded || []).length,
                active: active.length,
                pending,
                kept,
                discarded: (manifest.discarded || []).length,
                files: new Set(active.map((change) => change.file)).size,
                stagedResources: manifest.stagedResources.length
            },
            readyToApply: active.length > 0 && pending === 0,
            fingerprint: draftFingerprint(manifest, changes, workspaceRoot),
            createdAt: manifest.createdAt || null,
            updatedAt: manifest.updatedAt || null,
            origin: manifest.origin || null
        };
    }

    function decide(changeId, decision) {
        if (!['kept', 'discarded'].includes(decision)) throw new Error('Invalid draft decision');
        const manifest = readManifest();
        const change = changesForManifest(manifest).find((candidate) => candidate.id === changeId);
        if (!change) throw Object.assign(new Error('Draft change not found'), { statusCode: 404 });
        if (decision === 'kept') {
            manifest.decisions[change.id] = { status: 'kept', fingerprint: change.fingerprint };
            writeManifest(manifest);
        } else {
            const workspacePath = path.join(workspaceRoot, change.file);
            const documentValue = fs.existsSync(workspacePath) ? readJson(workspacePath) : undefined;
            let reverted = revertChange(documentValue, change);
            if (
                change.file.startsWith('archive/storylines/') &&
                change.path.length === 1 &&
                change.path[0] === 'events' &&
                ['add-item', 'remove-item', 'reorder'].includes(change.operation)
            ) {
                const baselinePath = path.join(baselineRoot, change.file);
                const baselineValue = fs.existsSync(baselinePath) ? readJson(baselinePath) : undefined;
                reverted = rebuildStorylineDerivedOrder(reverted, baselineValue);
            }
            if (reverted === undefined) fs.rmSync(workspacePath, { force: true });
            else atomicWrite(workspacePath, `${JSON.stringify(reverted, null, 2)}\n`);
            delete manifest.decisions[change.id];
            manifest.discarded.push({
                ...publicChange(change, 'discarded'),
                discardedAt: new Date().toISOString()
            });
            writeManifest(manifest);
            pruneManifest();
        }
        return status();
    }

    function decideAll(decision) {
        if (decision === 'kept') {
            const manifest = readManifest();
            for (const change of changesForManifest(manifest)) {
                manifest.decisions[change.id] = { status: 'kept', fingerprint: change.fingerprint };
            }
            writeManifest(manifest);
            return status();
        }
        if (decision !== 'discarded') throw new Error('Invalid draft decision');
        const manifest = readManifest();
        const discarded = changesForManifest(manifest).map((change) => ({
            ...publicChange(change, 'discarded'),
            discardedAt: new Date().toISOString()
        }));
        for (const relativePath of Object.keys(manifest.files)) {
            const source = path.join(baselineRoot, relativePath);
            const destination = path.join(workspaceRoot, relativePath);
            if (fs.existsSync(source)) atomicWrite(destination, fs.readFileSync(source));
            else fs.rmSync(destination, { force: true });
        }
        for (const relativePath of manifest.stagedResources) {
            fs.rmSync(path.join(workspaceRoot, relativePath), { force: true });
        }
        manifest.files = {};
        manifest.decisions = {};
        manifest.stagedResources = [];
        manifest.discarded.push(...discarded);
        writeManifest(manifest);
        return status();
    }

    function assertNoConflicts(manifest, changedFiles) {
        const conflicts = changedFiles.filter((relativePath) => {
            const expected = manifest.files[relativePath] && manifest.files[relativePath].baseRevision;
            return expected !== fileRevision(path.join(root, relativePath));
        });
        if (conflicts.length) {
            throw Object.assign(new Error(`正式文件已在草稿创建后发生变化：${conflicts.join('、')}`), {
                statusCode: 409
            });
        }
    }

    function apply() {
        const draftStatus = status();
        if (draftStatus.summary.pending) {
            throw Object.assign(new Error('仍有未决策变更，请先逐项保留或放弃'), { statusCode: 409 });
        }
        if (!draftStatus.summary.kept) {
            throw Object.assign(new Error('没有需要应用的已保留变更'), { statusCode: 409 });
        }
        const manifest = readManifest();
        const changedFiles = [...new Set(draftStatus.active.map((change) => change.file))];
        assertNoConflicts(manifest, changedFiles);

        const targets = [
            ...changedFiles.map((relativePath) => ({
                relativePath,
                source: path.join(workspaceRoot, relativePath),
                destination: path.join(root, relativePath),
                allowMissingSource: true
            })),
            ...manifest.stagedResources.map((relativePath) => ({
                relativePath,
                source: path.join(workspaceRoot, relativePath),
                destination: path.join(root, relativePath),
                allowMissingSource: false
            }))
        ];
        const snapshots = targets.map((target) => ({
            ...target,
            existed: fs.existsSync(target.destination),
            content: fs.existsSync(target.destination) ? fs.readFileSync(target.destination) : null
        }));
        try {
            for (const target of targets) {
                if (fs.existsSync(target.source)) atomicWrite(target.destination, fs.readFileSync(target.source));
                else if (target.allowMissingSource) fs.rmSync(target.destination, { force: true });
                else throw new Error(`暂存资源不存在：${target.relativePath}`);
            }
        } catch (error) {
            for (const snapshot of snapshots.reverse()) {
                if (snapshot.existed) atomicWrite(snapshot.destination, snapshot.content);
                else fs.rmSync(snapshot.destination, { force: true });
            }
            throw error;
        }
        const origin = clone(manifest.origin) || null;
        const changePoints = draftStatus.active.map((change) => clone(change));
        fs.rmSync(draftDirectory, { recursive: true, force: true });
        return { ok: true, changedFiles, resources: manifest.stagedResources, origin, changePoints };
    }

    function reset() {
        fs.rmSync(draftDirectory, { recursive: true, force: true });
        return status();
    }

    function draftResourcePath(relativePath) {
        if (!hasDraft()) return '';
        const manifest = readManifest();
        return manifest.stagedResources.includes(relativePath) ? path.join(workspaceRoot, relativePath) : '';
    }

    return {
        apply,
        contentRoot,
        decide,
        decideAll,
        createFromArchiveSnapshot,
        draftResourcePath,
        ensureInitialized,
        hasDraft,
        noteFileChanged,
        reset,
        status,
        trackResource,
        workspaceRoot
    };
}

module.exports = {
    createAdminDraftService
};
