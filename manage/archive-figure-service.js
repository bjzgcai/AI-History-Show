'use strict';

const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const { createArchiveSchemaValidator } = require('../scripts/archive-schema-validator');
const { isGroupPersonAsset, isPersonAsset } = require('../scripts/event-figure-rules');
const { createFigureRegistry, normalizeIdentityText } = require('../scripts/figure-registry');

function createHttpError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function atomicWrite(filePath, content) {
    const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(temporaryPath, content);
        fs.renameSync(temporaryPath, filePath);
    } finally {
        fs.rmSync(temporaryPath, { force: true });
    }
}

function transactionalWrite(entries) {
    const snapshots = entries.map(({ filePath }) => ({
        filePath,
        existed: fs.existsSync(filePath),
        content: fs.existsSync(filePath) ? fs.readFileSync(filePath) : null
    }));
    try {
        for (const { filePath, content } of entries) atomicWrite(filePath, content);
    } catch (error) {
        for (const snapshot of snapshots.reverse()) {
            if (snapshot.existed) atomicWrite(snapshot.filePath, snapshot.content);
            else fs.rmSync(snapshot.filePath, { force: true });
        }
        throw error;
    }
}

function fileRevision(filePath) {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function localized(value, locale) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    return String(value[locale] || value[locale === 'en' ? 'zh' : 'en'] || '').trim();
}

function hasLocalizedPair(value) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        String(value.en || '').trim() &&
        String(value.zh || '').trim()
    );
}

function relationObject(value) {
    if (typeof value === 'string') return { figureId: value };
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
}

function uniqueObjects(values) {
    const seen = new Set();
    return values.filter((value) => {
        const key = JSON.stringify(value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function mergeRelations(relations, sourceFigureId, targetFigureId) {
    const merged = [];
    for (const value of relations || []) {
        const relation = relationObject(value);
        const isExplicitTarget = relation.figureId === targetFigureId;
        const figureId = relation.figureId === sourceFigureId ? targetFigureId : relation.figureId;
        const candidate = { ...relation, figureId };
        const existing = merged.find((item) => item.figureId === figureId);
        if (!existing) {
            merged.push(candidate);
            continue;
        }
        const candidateRole = candidate.role && Object.values(candidate.role).some(Boolean);
        const existingRole = existing.role && Object.values(existing.role).some(Boolean);
        if (candidateRole && (isExplicitTarget || !existingRole)) existing.role = candidate.role;
        if (candidate.avatarAssetId && (isExplicitTarget || !existing.avatarAssetId)) {
            existing.avatarAssetId = candidate.avatarAssetId;
        }
        if (candidate.avatarStyle && (isExplicitTarget || !existing.avatarStyle)) {
            existing.avatarStyle = candidate.avatarStyle;
        }
        if (candidate.primary === true) existing.primary = true;
        if (candidate.useDefaultAvatar === true) existing.useDefaultAvatar = true;
    }
    return merged;
}

function detectImageType(buffer) {
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return { extension: 'png', mimeType: 'image/png' };
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { extension: 'jpg', mimeType: 'image/jpeg' };
    }
    const header = buffer.subarray(0, 12).toString('ascii');
    if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) {
        return { extension: 'gif', mimeType: 'image/gif' };
    }
    if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') {
        return { extension: 'webp', mimeType: 'image/webp' };
    }
    throw createHttpError('Unsupported or invalid image file; use PNG, JPEG, GIF, or WebP', 400);
}

const MAX_IMAGE_DIMENSION = 16384;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_DECODED_IMAGE_BYTES = 200 * 1024 * 1024;
const PNG_CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
    let crc = value;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    return crc >>> 0;
});

function invalidImage(message = 'Unsupported or invalid image file; use PNG, JPEG, GIF, or WebP') {
    throw createHttpError(message, 400);
}

function validateImageDimensions(width, height) {
    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width <= 0 ||
        height <= 0 ||
        width > MAX_IMAGE_DIMENSION ||
        height > MAX_IMAGE_DIMENSION ||
        width * height > MAX_IMAGE_PIXELS
    ) {
        invalidImage('Image dimensions are invalid or exceed the supported limit');
    }
}

function pngCrc32(buffer) {
    let crc = 0xffffffff;
    for (const value of buffer) crc = PNG_CRC_TABLE[(crc ^ value) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function validatePng(buffer) {
    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    let interlace = 0;
    let sawHeader = false;
    let sawImageData = false;
    let sawEnd = false;
    const compressedParts = [];

    while (offset < buffer.length) {
        if (offset + 12 > buffer.length) invalidImage('PNG file is truncated');
        const length = buffer.readUInt32BE(offset);
        const chunkEnd = offset + 12 + length;
        if (chunkEnd > buffer.length) invalidImage('PNG chunk exceeds the file length');
        const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
        if (!/^[A-Za-z]{4}$/.test(type)) invalidImage('PNG contains an invalid chunk type');
        const data = buffer.subarray(offset + 8, offset + 8 + length);
        const expectedCrc = buffer.readUInt32BE(offset + 8 + length);
        if (pngCrc32(buffer.subarray(offset + 4, offset + 8 + length)) !== expectedCrc) {
            invalidImage('PNG contains a corrupt chunk');
        }

        if (!sawHeader && type !== 'IHDR') invalidImage('PNG must begin with an IHDR chunk');
        if (type === 'IHDR') {
            if (sawHeader || length !== 13) invalidImage('PNG contains an invalid IHDR chunk');
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data[8];
            colorType = data[9];
            interlace = data[12];
            const validDepths = {
                0: [1, 2, 4, 8, 16],
                2: [8, 16],
                3: [1, 2, 4, 8],
                4: [8, 16],
                6: [8, 16]
            };
            if (
                !validDepths[colorType] ||
                !validDepths[colorType].includes(bitDepth) ||
                data[10] !== 0 ||
                data[11] !== 0 ||
                ![0, 1].includes(interlace)
            ) {
                invalidImage('PNG uses unsupported or invalid image parameters');
            }
            validateImageDimensions(width, height);
            sawHeader = true;
        } else if (type === 'IDAT') {
            sawImageData = true;
            compressedParts.push(data);
        } else if (type === 'IEND') {
            if (length !== 0 || chunkEnd !== buffer.length) invalidImage('PNG contains an invalid IEND chunk');
            sawEnd = true;
            offset = chunkEnd;
            break;
        }
        offset = chunkEnd;
    }

    if (!sawHeader || !sawImageData || !sawEnd) invalidImage('PNG is missing required image chunks');
    let decoded;
    try {
        decoded = zlib.inflateSync(Buffer.concat(compressedParts), { maxOutputLength: MAX_DECODED_IMAGE_BYTES });
    } catch {
        invalidImage('PNG image data cannot be decoded');
    }
    if (interlace === 0) {
        const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
        const expectedBytes = (Math.ceil((width * channels * bitDepth) / 8) + 1) * height;
        if (decoded.length !== expectedBytes) invalidImage('PNG decoded data has an invalid length');
    } else if (!decoded.length) {
        invalidImage('PNG decoded data is empty');
    }
}

function validateJpeg(buffer) {
    let offset = 2;
    let width = 0;
    let height = 0;
    let sawEnd = false;
    const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) invalidImage('JPEG contains invalid marker data');
        while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
        if (offset >= buffer.length) invalidImage('JPEG is truncated');
        const marker = buffer[offset];
        offset += 1;
        if (marker === 0xd9) {
            sawEnd = true;
            break;
        }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        if (offset + 2 > buffer.length) invalidImage('JPEG segment is truncated');
        const length = buffer.readUInt16BE(offset);
        if (length < 2 || offset + length > buffer.length) invalidImage('JPEG segment has an invalid length');
        const dataOffset = offset + 2;
        if (startOfFrameMarkers.has(marker)) {
            if (length < 8) invalidImage('JPEG frame header is invalid');
            height = buffer.readUInt16BE(dataOffset + 1);
            width = buffer.readUInt16BE(dataOffset + 3);
            validateImageDimensions(width, height);
        }
        offset += length;
        if (marker !== 0xda) continue;

        while (offset < buffer.length) {
            const markerOffset = buffer.indexOf(0xff, offset);
            if (markerOffset < 0 || markerOffset + 1 >= buffer.length) invalidImage('JPEG scan data is truncated');
            let next = markerOffset + 1;
            while (next < buffer.length && buffer[next] === 0xff) next += 1;
            if (next >= buffer.length) invalidImage('JPEG scan data is truncated');
            const scanMarker = buffer[next];
            if (scanMarker === 0x00 || (scanMarker >= 0xd0 && scanMarker <= 0xd7)) {
                offset = next + 1;
                continue;
            }
            offset = markerOffset;
            break;
        }
    }

    if (!width || !height || !sawEnd) invalidImage('JPEG is missing a frame header or end marker');
    if (offset !== buffer.length) invalidImage('JPEG contains trailing data after the end marker');
}

function skipGifSubBlocks(buffer, offset) {
    while (offset < buffer.length) {
        const length = buffer[offset];
        offset += 1;
        if (length === 0) return offset;
        if (offset + length > buffer.length) invalidImage('GIF data block is truncated');
        offset += length;
    }
    invalidImage('GIF data block is missing its terminator');
}

function validateGif(buffer) {
    if (buffer.length < 14) invalidImage('GIF file is truncated');
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    validateImageDimensions(width, height);
    let offset = 13;
    if (buffer[10] & 0x80) offset += 3 * 2 ** ((buffer[10] & 0x07) + 1);
    if (offset > buffer.length) invalidImage('GIF global color table is truncated');
    let sawImage = false;

    while (offset < buffer.length) {
        const blockType = buffer[offset];
        offset += 1;
        if (blockType === 0x3b) {
            if (!sawImage || offset !== buffer.length) invalidImage('GIF trailer is invalid');
            return;
        }
        if (blockType === 0x21) {
            if (offset >= buffer.length) invalidImage('GIF extension is truncated');
            offset += 1;
            offset = skipGifSubBlocks(buffer, offset);
            continue;
        }
        if (blockType !== 0x2c || offset + 9 > buffer.length) invalidImage('GIF contains an invalid block');
        const imageWidth = buffer.readUInt16LE(offset + 4);
        const imageHeight = buffer.readUInt16LE(offset + 6);
        validateImageDimensions(imageWidth, imageHeight);
        const packed = buffer[offset + 8];
        offset += 9;
        if (packed & 0x80) offset += 3 * 2 ** ((packed & 0x07) + 1);
        if (offset >= buffer.length) invalidImage('GIF image data is truncated');
        offset += 1;
        offset = skipGifSubBlocks(buffer, offset);
        sawImage = true;
    }
    invalidImage('GIF is missing its trailer');
}

function validateWebp(buffer) {
    if (buffer.length < 20 || buffer.readUInt32LE(4) + 8 !== buffer.length) invalidImage('WebP RIFF length is invalid');
    let offset = 12;
    let width = 0;
    let height = 0;
    while (offset < buffer.length) {
        if (offset + 8 > buffer.length) invalidImage('WebP chunk header is truncated');
        const type = buffer.subarray(offset, offset + 4).toString('ascii');
        const length = buffer.readUInt32LE(offset + 4);
        const dataOffset = offset + 8;
        const chunkEnd = dataOffset + length;
        if (chunkEnd > buffer.length) invalidImage('WebP chunk exceeds the file length');
        if (type === 'VP8X') {
            if (length < 10) invalidImage('WebP VP8X header is truncated');
            width = 1 + buffer.readUIntLE(dataOffset + 4, 3);
            height = 1 + buffer.readUIntLE(dataOffset + 7, 3);
        } else if (type === 'VP8 ') {
            if (
                length < 10 ||
                buffer[dataOffset + 3] !== 0x9d ||
                buffer[dataOffset + 4] !== 0x01 ||
                buffer[dataOffset + 5] !== 0x2a
            ) {
                invalidImage('WebP VP8 frame header is invalid');
            }
            width = buffer.readUInt16LE(dataOffset + 6) & 0x3fff;
            height = buffer.readUInt16LE(dataOffset + 8) & 0x3fff;
        } else if (type === 'VP8L') {
            if (length < 5 || buffer[dataOffset] !== 0x2f) invalidImage('WebP VP8L frame header is invalid');
            const bits = buffer.readUInt32LE(dataOffset + 1);
            width = (bits & 0x3fff) + 1;
            height = ((bits >>> 14) & 0x3fff) + 1;
        }
        offset = chunkEnd + (length % 2);
    }
    if (offset !== buffer.length || !width || !height) invalidImage('WebP is missing valid image data');
    validateImageDimensions(width, height);
}

function validateImage(buffer, imageType) {
    if (imageType.extension === 'png') validatePng(buffer);
    else if (imageType.extension === 'jpg') validateJpeg(buffer);
    else if (imageType.extension === 'gif') validateGif(buffer);
    else if (imageType.extension === 'webp') validateWebp(buffer);
}

function createArchiveFigureService(root) {
    const figuresPath = path.join(root, 'archive', 'figures', 'figures.json');
    const eventsDir = path.join(root, 'archive', 'events');
    const validateSchema = createArchiveSchemaValidator(root);

    function loadFigures() {
        return readJson(figuresPath);
    }

    function validateRegistry(figures, pendingPaths = new Set()) {
        const schemaResult = validateSchema('figure.schema.json', figures);
        if (!schemaResult.valid) {
            throw createHttpError(`Figure schema validation failed: ${schemaResult.errors.join('; ')}`, 400);
        }

        let registry;
        try {
            registry = createFigureRegistry(figures, 'archive/figures/figures.json');
        } catch (error) {
            throw createHttpError(error.message, 400);
        }

        for (const figure of figures) {
            if (figure.type === 'person' && !/[\u3400-\u9fff]/.test(localized(figure.name, 'zh'))) {
                throw createHttpError(`Person figure must have a Chinese-readable name: ${figure.id}`, 400);
            }
            for (const organizationId of figure.organizationIds || []) {
                const organization = registry.byId.get(organizationId);
                if (!organization) {
                    throw createHttpError(`${figure.id} references missing organizationId: ${organizationId}`, 400);
                }
                if (organization.type !== 'organization') {
                    throw createHttpError(`${figure.id} organizationId is not an organization: ${organizationId}`, 400);
                }
            }
            const avatarPath = figure.defaultAvatar && figure.defaultAvatar.path;
            if (
                avatarPath &&
                !/^https?:\/\//i.test(avatarPath) &&
                !pendingPaths.has(avatarPath) &&
                !fs.existsSync(path.join(root, avatarPath))
            ) {
                throw createHttpError(`${figure.id} default avatar does not exist: ${avatarPath}`, 400);
            }
        }
    }

    function listEventDirectories() {
        if (!fs.existsSync(eventsDir)) return [];
        return fs
            .readdirSync(eventsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && /^[a-z0-9][a-z0-9._-]*$/.test(entry.name))
            .map((entry) => ({ eventId: entry.name, eventDir: path.join(eventsDir, entry.name) }))
            .sort((left, right) => left.eventId.localeCompare(right.eventId));
    }

    function scanUsage() {
        const usageByFigureId = new Map();
        const allAssets = [];
        const addUsage = (figureId, entry) => {
            if (!figureId) return;
            if (!usageByFigureId.has(figureId)) usageByFigureId.set(figureId, []);
            usageByFigureId.get(figureId).push(entry);
        };

        for (const { eventId, eventDir } of listEventDirectories()) {
            const eventFile = path.join(eventDir, 'event.json');
            const assetsFile = path.join(eventDir, 'assets.json');
            const variantsDir = path.join(eventDir, 'variants');
            const event = fs.existsSync(eventFile) ? readJson(eventFile) : {};
            const assets = fs.existsSync(assetsFile) ? readJson(assetsFile) : [];

            for (const relationValue of event.figures || []) {
                const relation = relationObject(relationValue);
                addUsage(relation.figureId, {
                    kind: 'event-relation',
                    eventId,
                    file: `archive/events/${eventId}/event.json`,
                    role: relation.role || {},
                    primary: relation.primary === true,
                    avatarAssetId: relation.avatarAssetId || ''
                });
            }

            for (const asset of assets) {
                allAssets.push({ eventId, asset });
                for (const figureId of asset.figureIds || []) {
                    addUsage(figureId, {
                        kind: 'asset',
                        eventId,
                        file: `archive/events/${eventId}/assets.json`,
                        assetId: asset.id,
                        path: asset.path,
                        role: asset.role || '',
                        caption: asset.caption || {},
                        selectionReview: asset.selectionReview || null
                    });
                }
            }

            if (!fs.existsSync(variantsDir)) continue;
            for (const fileName of fs
                .readdirSync(variantsDir)
                .filter((file) => file.endsWith('.json'))
                .sort()) {
                const variant = readJson(path.join(variantsDir, fileName));
                for (const relationValue of variant.figures || []) {
                    const relation = relationObject(relationValue);
                    addUsage(relation.figureId, {
                        kind: 'variant-relation',
                        eventId,
                        storylineId: variant.storylineId || fileName.replace(/\.json$/, ''),
                        file: `archive/events/${eventId}/variants/${fileName}`,
                        role: relation.role || {},
                        primary: relation.primary === true,
                        avatarAssetId: relation.avatarAssetId || '',
                        useDefaultAvatar: relation.useDefaultAvatar === true
                    });
                }
            }
        }

        return { usageByFigureId, allAssets };
    }

    function listFigures() {
        const figures = loadFigures();
        const { usageByFigureId } = scanUsage();
        return figures.map((figure) => {
            const usage = usageByFigureId.get(figure.id) || [];
            return {
                id: figure.id,
                name: figure.name,
                aliases: figure.aliases || [],
                type: figure.type,
                reviewStatus: figure.review && figure.review.status,
                defaultAvatar: figure.defaultAvatar ? figure.defaultAvatar.path : '',
                defaultAvatarStyle: figure.defaultAvatar ? figure.defaultAvatar.avatarStyle || '' : '',
                eventCount: new Set(usage.map((entry) => entry.eventId).filter(Boolean)).size,
                relationCount: usage.filter((entry) => entry.kind.endsWith('relation')).length,
                assetCount: usage.filter((entry) => entry.kind === 'asset').length
            };
        });
    }

    function getFigure(figureId) {
        const safeFigureId = String(figureId || '').trim();
        const figure = loadFigures().find((candidate) => candidate.id === safeFigureId);
        if (!figure) throw createHttpError('Archive figure not found', 404);
        return { figureId: safeFigureId, data: figure, revision: fileRevision(figuresPath) };
    }

    function saveFigure({ figureId, data, create = false, expectedRevision = '' }) {
        const safeFigureId = String(figureId || '').trim();
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(safeFigureId)) {
            throw createHttpError('Invalid archive figureId', 400);
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw createHttpError('Archive figure data must be a JSON object', 400);
        }
        if (data.id !== safeFigureId) {
            throw createHttpError('Archive figure data.id must match figureId', 400);
        }

        const currentRevision = fileRevision(figuresPath);
        if (expectedRevision && expectedRevision !== currentRevision) {
            throw createHttpError('Figure registry changed since it was loaded; reload before saving', 409);
        }

        const figures = loadFigures();
        const index = figures.findIndex((candidate) => candidate.id === safeFigureId);
        if (create && index >= 0) throw createHttpError('Archive figure already exists', 409);
        if (!create && index < 0) throw createHttpError('Archive figure not found', 404);
        if (index >= 0) figures[index] = data;
        else figures.push(data);
        figures.sort((left, right) => left.id.localeCompare(right.id));
        validateRegistry(figures);
        atomicWrite(figuresPath, `${JSON.stringify(figures, null, 2)}\n`);
        return { ok: true, figureId: safeFigureId, created: index < 0, revision: fileRevision(figuresPath) };
    }

    function getFigureUsage(figureId) {
        const figure = getFigure(figureId).data;
        const { usageByFigureId } = scanUsage();
        const usage = usageByFigureId.get(figure.id) || [];
        return {
            figureId: figure.id,
            name: figure.name,
            events: [...new Set(usage.map((entry) => entry.eventId).filter(Boolean))],
            eventRelations: usage.filter((entry) => entry.kind === 'event-relation'),
            variantRelations: usage.filter((entry) => entry.kind === 'variant-relation'),
            assets: usage.filter((entry) => entry.kind === 'asset')
        };
    }

    function getFigureAssets(figureId, eventId = '') {
        getFigure(figureId);
        const { allAssets } = scanUsage();
        return allAssets
            .filter(
                (entry) =>
                    (!eventId || entry.eventId === eventId) &&
                    Array.isArray(entry.asset.figureIds) &&
                    entry.asset.figureIds.includes(figureId)
            )
            .map(({ eventId: assetEventId, asset }) => ({ eventId: assetEventId, ...asset }));
    }

    function previewFigureMerge(sourceFigureId, targetFigureId) {
        const source = getFigure(sourceFigureId).data;
        const target = getFigure(targetFigureId).data;
        if (source.id === target.id) throw createHttpError('Source and target figures must be different', 400);
        if (source.type !== target.type) throw createHttpError('Only figures of the same type can be merged', 400);

        const sourceUsage = getFigureUsage(source.id);
        const targetUsage = getFigureUsage(target.id);
        const organizationReferences = loadFigures().filter((figure) =>
            (figure.organizationIds || []).includes(source.id)
        ).length;
        return {
            source: { id: source.id, name: source.name, type: source.type },
            target: { id: target.id, name: target.name, type: target.type },
            revision: fileRevision(figuresPath),
            impact: {
                events: sourceUsage.events.length,
                eventRelations: sourceUsage.eventRelations.length,
                variantRelations: sourceUsage.variantRelations.length,
                assets: sourceUsage.assets.length,
                organizationReferences,
                targetExistingEvents: targetUsage.events.length
            }
        };
    }

    function mergeFigures({ sourceFigureId, targetFigureId, expectedRevision = '' }) {
        const preview = previewFigureMerge(sourceFigureId, targetFigureId);
        if (expectedRevision && expectedRevision !== preview.revision) {
            throw createHttpError('Figure registry changed since merge preview; preview again before merging', 409);
        }

        const figures = loadFigures();
        const sourceIndex = figures.findIndex((figure) => figure.id === sourceFigureId);
        const targetIndex = figures.findIndex((figure) => figure.id === targetFigureId);
        const source = figures[sourceIndex];
        const target = figures[targetIndex];
        const mergedTarget = {
            ...target,
            aliases: uniqueValues([
                ...(target.aliases || []),
                localized(source.name, 'en'),
                localized(source.name, 'zh'),
                ...(source.aliases || []),
                source.id
            ]),
            organizationIds: uniqueValues(
                [...(target.organizationIds || []), ...(source.organizationIds || [])].map((id) =>
                    id === source.id ? target.id : id
                )
            ).filter((id) => id !== target.id),
            profileSources: uniqueObjects([...(target.profileSources || []), ...(source.profileSources || [])]),
            defaultAvatar: target.defaultAvatar || source.defaultAvatar
        };
        if (!mergedTarget.defaultAvatar) delete mergedTarget.defaultAvatar;

        const nextFigures = figures
            .filter((figure) => figure.id !== source.id)
            .map((figure) => {
                if (figure.id === target.id) return mergedTarget;
                if (!(figure.organizationIds || []).includes(source.id)) return figure;
                return {
                    ...figure,
                    organizationIds: uniqueValues(
                        figure.organizationIds.map((id) => (id === source.id ? target.id : id))
                    )
                };
            })
            .sort((left, right) => left.id.localeCompare(right.id));
        validateRegistry(nextFigures);

        const writes = [
            {
                filePath: figuresPath,
                content: `${JSON.stringify(nextFigures, null, 2)}\n`
            }
        ];
        const changedFiles = ['archive/figures/figures.json'];
        for (const { eventId, eventDir } of listEventDirectories()) {
            const eventFile = path.join(eventDir, 'event.json');
            if (fs.existsSync(eventFile)) {
                const event = readJson(eventFile);
                if ((event.figures || []).some((value) => relationObject(value).figureId === source.id)) {
                    event.figures = mergeRelations(event.figures, source.id, target.id);
                    writes.push({ filePath: eventFile, content: `${JSON.stringify(event, null, 2)}\n` });
                    changedFiles.push(`archive/events/${eventId}/event.json`);
                }
            }

            const assetsFile = path.join(eventDir, 'assets.json');
            if (fs.existsSync(assetsFile)) {
                const assets = readJson(assetsFile);
                let changed = false;
                for (const asset of assets) {
                    if (!(asset.figureIds || []).includes(source.id)) continue;
                    asset.figureIds = uniqueValues(asset.figureIds.map((id) => (id === source.id ? target.id : id)));
                    changed = true;
                }
                if (changed) {
                    writes.push({ filePath: assetsFile, content: `${JSON.stringify(assets, null, 2)}\n` });
                    changedFiles.push(`archive/events/${eventId}/assets.json`);
                }
            }

            const variantsDir = path.join(eventDir, 'variants');
            if (!fs.existsSync(variantsDir)) continue;
            for (const fileName of fs.readdirSync(variantsDir).filter((file) => file.endsWith('.json'))) {
                const variantFile = path.join(variantsDir, fileName);
                const variant = readJson(variantFile);
                if (!(variant.figures || []).some((value) => relationObject(value).figureId === source.id)) continue;
                variant.figures = mergeRelations(variant.figures, source.id, target.id);
                writes.push({ filePath: variantFile, content: `${JSON.stringify(variant, null, 2)}\n` });
                changedFiles.push(`archive/events/${eventId}/variants/${fileName}`);
            }
        }

        transactionalWrite(writes);
        return {
            ok: true,
            sourceFigureId: source.id,
            targetFigureId: target.id,
            changedFiles,
            revision: fileRevision(figuresPath),
            impact: preview.impact
        };
    }

    function importFigureImage({
        figureId,
        eventId,
        assetId,
        sourceId,
        imageBase64,
        caption,
        subcaption,
        rights,
        sourceName,
        sourceUrl,
        role = 'portrait',
        setAsDefaultAvatar = false,
        expectedRevision = ''
    }) {
        const figure = getFigure(figureId).data;
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(String(eventId || ''))) {
            throw createHttpError('Invalid archive eventId', 400);
        }
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(String(assetId || ''))) {
            throw createHttpError('Invalid archive assetId', 400);
        }
        if (!sourceId || !hasLocalizedPair(caption)) {
            throw createHttpError('Source ID and bilingual captions are required', 400);
        }
        if (!rights || !rights.status || !hasLocalizedPair(rights.license) || !hasLocalizedPair(rights.usage)) {
            throw createHttpError('Rights status plus bilingual license and usage are required', 400);
        }
        const eventDir = path.join(eventsDir, eventId);
        const assetsFile = path.join(eventDir, 'assets.json');
        const sourcesFile = path.join(eventDir, 'sources.json');
        if (!fs.existsSync(assetsFile) || !fs.existsSync(sourcesFile)) {
            throw createHttpError('Event assets.json or sources.json not found', 404);
        }
        const sources = readJson(sourcesFile);
        if (!sources.some((source) => source.id === sourceId)) {
            throw createHttpError(`Source ID does not exist in ${eventId}: ${sourceId}`, 400);
        }
        const normalizedBase64 = String(imageBase64 || '')
            .replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '')
            .replace(/\s+/g, '');
        if (!normalizedBase64 || !/^(?:[a-z0-9+/]{4})*(?:[a-z0-9+/]{2}==|[a-z0-9+/]{3}=)?$/i.test(normalizedBase64)) {
            throw createHttpError('Invalid base64 image data', 400);
        }
        const image = Buffer.from(normalizedBase64, 'base64');
        if (!image.length || image.length > 10 * 1024 * 1024) {
            throw createHttpError('Image must be between 1 byte and 10 MB', 400);
        }
        const imageType = detectImageType(image);
        validateImage(image, imageType);
        const relativePath = `resources/images/${eventId}/people/${assetId}.${imageType.extension}`;
        const imagePath = path.join(root, relativePath);
        if (fs.existsSync(imagePath)) throw createHttpError(`Image already exists: ${relativePath}`, 409);

        const assets = readJson(assetsFile);
        if (assets.some((asset) => asset.id === assetId)) throw createHttpError('Archive asset already exists', 409);
        const asset = {
            id: assetId,
            type: 'image',
            path: relativePath,
            role: String(role || 'portrait'),
            caption,
            ...(subcaption && (localized(subcaption, 'en') || localized(subcaption, 'zh')) ? { subcaption } : {}),
            figureIds: [figure.id],
            sourceId,
            rights,
            usage: ['figure-avatar'],
            editable: true
        };
        const nextAssets = [...assets, asset];
        const schemaResult = validateSchema('asset.schema.json', nextAssets);
        if (!schemaResult.valid) {
            throw createHttpError(`Asset schema validation failed: ${schemaResult.errors.join('; ')}`, 400);
        }

        const writes = [
            { filePath: imagePath, content: image },
            { filePath: assetsFile, content: `${JSON.stringify(nextAssets, null, 2)}\n` }
        ];
        if (setAsDefaultAvatar) {
            const currentRevision = fileRevision(figuresPath);
            if (expectedRevision && expectedRevision !== currentRevision) {
                throw createHttpError('Figure registry changed since it was loaded; reload before importing', 409);
            }
            if (!hasLocalizedPair(sourceName) || !sourceUrl) {
                throw createHttpError('Bilingual source name and source URL are required for a default avatar', 400);
            }
            const nextFigures = loadFigures().map((candidate) =>
                candidate.id === figure.id
                    ? {
                          ...candidate,
                          defaultAvatar: {
                              path: relativePath,
                              sourceName,
                              sourceUrl,
                              rights
                          }
                      }
                    : candidate
            );
            validateRegistry(nextFigures, new Set([relativePath]));
            writes.push({ filePath: figuresPath, content: `${JSON.stringify(nextFigures, null, 2)}\n` });
        }

        transactionalWrite(writes);
        return {
            ok: true,
            figureId: figure.id,
            eventId,
            asset,
            revision: fileRevision(figuresPath)
        };
    }

    function getAudit() {
        const figures = loadFigures();
        const byId = new Map(figures.map((figure) => [figure.id, figure]));
        const categories = new Map();
        const add = (code, severity, title, item) => {
            if (!categories.has(code)) categories.set(code, { code, severity, title, items: [] });
            categories.get(code).items.push(item);
        };
        const identities = new Map();
        const avatarOwners = new Map();

        for (const figure of figures) {
            for (const value of [
                figure.name && figure.name.en,
                figure.name && figure.name.zh,
                ...(figure.aliases || [])
            ]) {
                const key = normalizeIdentityText(value);
                if (!key) continue;
                if (!identities.has(key)) identities.set(key, new Set());
                identities.get(key).add(figure.id);
            }
            if (figure.type === 'person' && !/[\u3400-\u9fff]/.test(localized(figure.name, 'zh'))) {
                add('unreadable-chinese-name', 'error', '人物缺少中文可读名称', { figureId: figure.id });
            }
            if (!Array.isArray(figure.profileSources) || figure.profileSources.length === 0) {
                add('missing-profile-source', 'warning', '人物或实体缺少资料来源', { figureId: figure.id });
            }
            if (['draft', 'needs-source', 'disputed'].includes(figure.review && figure.review.status)) {
                add('review-needed', 'info', '身份仍需审核', {
                    figureId: figure.id,
                    status: figure.review && figure.review.status
                });
            }
            const avatarPath = figure.defaultAvatar && figure.defaultAvatar.path;
            if (figure.type === 'person' && avatarPath) {
                if (!avatarOwners.has(avatarPath)) avatarOwners.set(avatarPath, []);
                avatarOwners.get(avatarPath).push(figure.id);
            }
        }

        for (const [identity, ids] of identities) {
            if (ids.size > 1) {
                add('duplicate-identity', 'warning', '疑似重复身份', { identity, figureIds: [...ids] });
            }
        }
        for (const [avatarPath, figureIds] of avatarOwners) {
            if (figureIds.length > 1) {
                add('avatar-conflict', 'error', '不同人物共享默认头像', { avatarPath, figureIds });
            }
        }

        for (const { eventId, eventDir } of listEventDirectories()) {
            const eventFile = path.join(eventDir, 'event.json');
            const assetsFile = path.join(eventDir, 'assets.json');
            const variantsDir = path.join(eventDir, 'variants');
            const event = fs.existsSync(eventFile) ? readJson(eventFile) : {};
            const canonicalIds = new Set((event.figures || []).map((relation) => relationObject(relation).figureId));
            for (const relationValue of event.figures || []) {
                const figureId = relationObject(relationValue).figureId;
                if (!byId.has(figureId)) {
                    add('missing-identity', 'error', '事件引用不存在的人物身份', {
                        eventId,
                        file: `archive/events/${eventId}/event.json`,
                        figureId
                    });
                }
            }

            const assets = fs.existsSync(assetsFile) ? readJson(assetsFile) : [];
            for (const asset of assets) {
                if ((isPersonAsset(asset) || isGroupPersonAsset(asset)) && !(asset.figureIds || []).length) {
                    add('person-asset-without-identity', 'error', '人物类资产缺少 figureIds', {
                        eventId,
                        assetId: asset.id,
                        path: asset.path
                    });
                }
                for (const figureId of asset.figureIds || []) {
                    if (!byId.has(figureId)) {
                        add('asset-missing-identity', 'error', '资产引用不存在的人物身份', {
                            eventId,
                            assetId: asset.id,
                            figureId
                        });
                    }
                }
            }

            if (!fs.existsSync(variantsDir)) continue;
            for (const fileName of fs.readdirSync(variantsDir).filter((file) => file.endsWith('.json'))) {
                const variant = readJson(path.join(variantsDir, fileName));
                for (const relationValue of variant.figures || []) {
                    const figureId = relationObject(relationValue).figureId;
                    if (!byId.has(figureId)) {
                        add('missing-identity', 'error', 'Variant 引用不存在的人物身份', {
                            eventId,
                            storylineId: variant.storylineId,
                            figureId
                        });
                    } else if (!canonicalIds.has(figureId)) {
                        add('variant-identity-drift', 'warning', 'Variant 人物不在 canonical event 中', {
                            eventId,
                            storylineId: variant.storylineId,
                            figureId
                        });
                    }
                }
            }
        }

        const result = [...categories.values()].sort(
            (left, right) =>
                ['error', 'warning', 'info'].indexOf(left.severity) -
                    ['error', 'warning', 'info'].indexOf(right.severity) || left.code.localeCompare(right.code)
        );
        return {
            generatedAt: new Date().toISOString(),
            summary: {
                figures: figures.length,
                errors: result
                    .filter((category) => category.severity === 'error')
                    .reduce((sum, category) => sum + category.items.length, 0),
                warnings: result
                    .filter((category) => category.severity === 'warning')
                    .reduce((sum, category) => sum + category.items.length, 0),
                info: result
                    .filter((category) => category.severity === 'info')
                    .reduce((sum, category) => sum + category.items.length, 0)
            },
            categories: result
        };
    }

    return {
        getAudit,
        getFigure,
        getFigureAssets,
        getRegistryRevision: () => fileRevision(figuresPath),
        getFigureUsage,
        importFigureImage,
        listFigures,
        mergeFigures,
        previewFigureMerge,
        saveFigure
    };
}

module.exports = {
    createArchiveFigureService
};
