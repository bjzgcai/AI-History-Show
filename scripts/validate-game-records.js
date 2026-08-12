#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { createArchiveSchemaValidator } = require('./archive-schema-validator.js');

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`${path.basename(filePath)} is not valid JSON: ${error.message}`);
    }
}

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function isInside(parent, candidate) {
    const relative = path.relative(parent, candidate);
    return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function pngDimensions(filePath) {
    const header = fs.readFileSync(filePath).subarray(0, 24);
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (header.length < 24 || !header.subarray(0, 8).equals(signature)) return null;
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function parseGameRecordWithProductionParser(root, manifestPath) {
    const parserPath = path.join(root, 'scripts', 'game-evolution', 'verify_game_record.py');
    const python = process.env.GAME_RECORD_PYTHON || 'python3';
    const result = childProcess.spawnSync(python, [parserPath, manifestPath], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
    });
    if (result.error) {
        throw new Error(`cannot run production parser with ${python}: ${result.error.message}`);
    }
    if (result.status !== 0) {
        throw new Error((result.stderr || result.stdout || `parser exited with status ${result.status}`).trim());
    }
    try {
        return JSON.parse(result.stdout);
    } catch (error) {
        throw new Error(`production parser returned invalid JSON: ${error.message}`);
    }
}

function validateGameRecords(root) {
    const validateSchema = createArchiveSchemaValidator(root);
    const eventsDir = path.join(root, 'archive', 'events');
    const errors = [];
    const records = [];

    if (!fs.existsSync(eventsDir)) return { errors: [`Missing Archive events directory: ${eventsDir}`], records };

    for (const eventName of fs.readdirSync(eventsDir).sort()) {
        const eventDir = path.join(eventsDir, eventName);
        const manifestPath = path.join(eventDir, 'game-records', 'game-record.json');
        if (!fs.existsSync(manifestPath)) continue;
        let manifest;
        try {
            manifest = readJson(manifestPath);
        } catch (error) {
            errors.push(`${path.relative(root, manifestPath)}: ${error.message}`);
            continue;
        }

        const relativeManifest = path.relative(root, manifestPath).replace(/\\/g, '/');
        const schemaResult = validateSchema('game-record.schema.json', manifest);
        for (const error of schemaResult.errors) errors.push(`${relativeManifest}: game-record.schema.json: ${error}`);
        if (!schemaResult.valid) continue;

        if (manifest.eventId !== eventName) {
            errors.push(`${relativeManifest}: eventId must match its event directory (${eventName}).`);
        }

        const recordRoot = path.dirname(manifestPath);
        const rawRecordPath = path.resolve(recordRoot, manifest.record.path);
        if (!isInside(recordRoot, rawRecordPath)) {
            errors.push(`${relativeManifest}: record.path must stay inside the game-records directory.`);
        } else if (!fs.existsSync(rawRecordPath)) {
            errors.push(`${relativeManifest}: record file does not exist: ${manifest.record.path}`);
        } else {
            const digest = sha256File(rawRecordPath);
            if (digest !== manifest.record.sha256) {
                errors.push(
                    `${relativeManifest}: record SHA-256 mismatch; expected ${manifest.record.sha256}, got ${digest}.`
                );
            }
        }

        const expectedMainLine = manifest.verification.mainLineSha256;
        const recordSources = manifest.sources.filter(
            (source) => source.role === 'record' || source.role === 'cross-check'
        );
        const uniqueRecordUrls = new Set(recordSources.map((source) => source.url));
        if (recordSources.length < manifest.verification.matchedRecordSources) {
            errors.push(`${relativeManifest}: matchedRecordSources exceeds the number of record/cross-check entries.`);
        }
        if (uniqueRecordUrls.size < 2) {
            errors.push(`${relativeManifest}: at least two distinct record URLs are required.`);
        }
        for (const source of recordSources) {
            if (source.mainLineSha256 !== expectedMainLine) {
                errors.push(
                    `${relativeManifest}: source ${source.sourceId} does not match verification.mainLineSha256.`
                );
            }
        }

        let parsedRecord;
        try {
            parsedRecord = parseGameRecordWithProductionParser(root, manifestPath);
            if (parsedRecord.moveCount !== manifest.record.moveCount) {
                errors.push(
                    `${relativeManifest}: production parser move count mismatch; expected ${manifest.record.moveCount}, got ${parsedRecord.moveCount}.`
                );
            }
            if (parsedRecord.mainLineSha256 !== expectedMainLine) {
                errors.push(
                    `${relativeManifest}: production parser main-line SHA-256 mismatch; expected ${expectedMainLine}, got ${parsedRecord.mainLineSha256}.`
                );
            }
        } catch (error) {
            errors.push(`${relativeManifest}: production parser verification failed: ${error.message}`);
        }

        const sources = readJson(path.join(eventDir, 'sources.json'));
        const assets = readJson(path.join(eventDir, 'assets.json'));
        const event = readJson(path.join(eventDir, 'event.json'));
        const sourcesById = new Map(sources.map((source) => [source.id, source]));
        const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

        for (const source of manifest.sources) {
            const archiveSource = sourcesById.get(source.sourceId);
            if (!archiveSource) {
                errors.push(`${relativeManifest}: sourceId is missing from sources.json: ${source.sourceId}.`);
            } else if (![archiveSource.url, archiveSource.archiveUrl].filter(Boolean).includes(source.url)) {
                errors.push(`${relativeManifest}: source URL differs from sources.json for ${source.sourceId}.`);
            }
        }

        const videoAsset = assetsById.get(manifest.archive.videoAssetId);
        const posterAsset = assetsById.get(manifest.archive.posterAssetId);
        if (!videoAsset || videoAsset.type !== 'video' || videoAsset.path !== manifest.render.videoPath) {
            errors.push(`${relativeManifest}: videoAssetId must resolve to the configured videoPath.`);
        }
        if (!posterAsset || posterAsset.type !== 'image' || posterAsset.path !== manifest.render.posterPath) {
            errors.push(`${relativeManifest}: posterAssetId must resolve to the configured posterPath.`);
        }

        const modules = [
            ...(event.defaultPresentation?.visualModules || []),
            ...(event.defaultPresentation?.achievement?.visualModules || [])
        ];
        const module = modules.find((item) => item?.type === 'gameEvolutionVideo' && item.recordId === manifest.id);
        if (!module) {
            errors.push(
                `${relativeManifest}: event.defaultPresentation must include a matching gameEvolutionVideo module.`
            );
        } else if (
            module.videoAssetId !== manifest.archive.videoAssetId ||
            module.posterAssetId !== manifest.archive.posterAssetId
        ) {
            errors.push(`${relativeManifest}: gameEvolutionVideo asset IDs must match the manifest archive mapping.`);
        }

        const videoPath = path.join(root, manifest.render.videoPath);
        const posterPath = path.join(root, manifest.render.posterPath);
        if (!fs.existsSync(videoPath)) {
            errors.push(`${relativeManifest}: rendered MP4 does not exist: ${manifest.render.videoPath}.`);
        } else {
            const header = fs.readFileSync(videoPath).subarray(0, 32).toString('latin1');
            if (!header.includes('ftyp')) errors.push(`${relativeManifest}: rendered video is not an MP4 file.`);
            if (fs.statSync(videoPath).size > manifest.render.maxBytes) {
                errors.push(`${relativeManifest}: rendered video exceeds maxBytes.`);
            }
        }
        if (!fs.existsSync(posterPath)) {
            errors.push(`${relativeManifest}: rendered poster does not exist: ${manifest.render.posterPath}.`);
        } else {
            const dimensions = pngDimensions(posterPath);
            if (
                !dimensions ||
                dimensions.width !== manifest.render.width ||
                dimensions.height !== manifest.render.height
            ) {
                errors.push(
                    `${relativeManifest}: poster dimensions must be ${manifest.render.width}x${manifest.render.height}.`
                );
            }
        }

        records.push({ id: manifest.id, eventId: eventName, manifestPath, manifest, parsedRecord });
    }

    return { errors, records };
}

function main() {
    const root = path.resolve(process.env.AI_HISTORY_ARCHIVE_ROOT || path.join(__dirname, '..'));
    const result = validateGameRecords(root);
    console.log(`Game-record validation: ${result.errors.length} error(s), ${result.records.length} record(s).`);
    for (const error of result.errors.slice(0, 30)) console.error(error);
    if (result.errors.length > 30) console.error(`... ${result.errors.length - 30} more error(s)`);
    if (result.errors.length > 0) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
    pngDimensions,
    parseGameRecordWithProductionParser,
    sha256File,
    validateGameRecords
};
