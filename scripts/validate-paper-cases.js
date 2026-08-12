#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function pngDimensions(filePath) {
    const header = fs.readFileSync(filePath).subarray(0, 24);
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (header.length < 24 || !header.subarray(0, 8).equals(signature)) return null;
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function validatePaperCases(root) {
    const eventsDir = path.join(root, 'archive', 'events');
    const errors = [];
    const cases = [];

    for (const eventId of fs.readdirSync(eventsDir).sort()) {
        const eventDir = path.join(eventsDir, eventId);
        const manifestPath = path.join(eventDir, 'paper-cases', 'paper-case.json');
        if (!fs.existsSync(manifestPath)) continue;
        const relativeManifest = path.relative(root, manifestPath).replace(/\\/g, '/');
        let manifest;
        try {
            manifest = readJson(manifestPath);
        } catch (error) {
            errors.push(`${relativeManifest}: invalid JSON: ${error.message}`);
            continue;
        }

        if (manifest.eventId !== eventId) errors.push(`${relativeManifest}: eventId must match ${eventId}.`);
        if (manifest.caseType !== 'partial-paper-case') {
            errors.push(`${relativeManifest}: caseType must be partial-paper-case.`);
        }
        if (manifest.completeGameReplay !== false) {
            errors.push(`${relativeManifest}: completeGameReplay must be false.`);
        }
        if (manifest.outcomeKnown !== false) errors.push(`${relativeManifest}: outcomeKnown must be false.`);
        if (!manifest.case?.limits?.zh || !manifest.case?.limits?.en) {
            errors.push(`${relativeManifest}: bilingual evidence limits are required.`);
        }
        if (!Array.isArray(manifest.scenes) || manifest.scenes.length < 3) {
            errors.push(`${relativeManifest}: at least three scenes are required.`);
        } else {
            const duration = manifest.scenes.reduce((sum, scene) => sum + Number(scene.durationSeconds || 0), 0);
            if (Math.abs(duration - Number(manifest.render?.durationSeconds || 0)) > 0.001) {
                errors.push(`${relativeManifest}: scene durations must equal render.durationSeconds.`);
            }
            if (Number(manifest.scenes.at(-1).durationSeconds) < 3.5) {
                errors.push(`${relativeManifest}: final scene must hold for at least 3.5 seconds.`);
            }
        }

        const evidencePath = path.join(root, manifest.evidence?.localPath || '');
        if (!fs.existsSync(evidencePath)) {
            errors.push(`${relativeManifest}: evidence file is missing.`);
        } else if (sha256File(evidencePath) !== manifest.evidence.sha256) {
            errors.push(`${relativeManifest}: evidence SHA-256 mismatch.`);
        }

        const assets = readJson(path.join(eventDir, 'assets.json'));
        const event = readJson(path.join(eventDir, 'event.json'));
        const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
        const videoAsset = assetsById.get(manifest.archive?.videoAssetId);
        const posterAsset = assetsById.get(manifest.archive?.posterAssetId);
        if (!videoAsset || videoAsset.type !== 'video' || videoAsset.path !== manifest.render?.videoPath) {
            errors.push(`${relativeManifest}: videoAssetId must resolve to render.videoPath.`);
        }
        if (!posterAsset || posterAsset.type !== 'image' || posterAsset.path !== manifest.render?.posterPath) {
            errors.push(`${relativeManifest}: posterAssetId must resolve to render.posterPath.`);
        }

        const modules = [
            ...(event.defaultPresentation?.visualModules || []),
            ...(event.defaultPresentation?.achievement?.visualModules || [])
        ];
        const module = modules.find((item) => item?.type === 'paperCaseVideo' && item.caseId === manifest.id);
        if (!module) {
            errors.push(`${relativeManifest}: a matching paperCaseVideo module is required.`);
        } else {
            if (module.completeGameReplay !== false) {
                errors.push(`${relativeManifest}: paperCaseVideo.completeGameReplay must be false.`);
            }
            if (
                module.videoAssetId !== manifest.archive.videoAssetId ||
                module.posterAssetId !== manifest.archive.posterAssetId
            ) {
                errors.push(`${relativeManifest}: paperCaseVideo asset IDs must match the manifest.`);
            }
        }

        const videoPath = path.join(root, manifest.render?.videoPath || '');
        const posterPath = path.join(root, manifest.render?.posterPath || '');
        if (!fs.existsSync(videoPath)) {
            errors.push(`${relativeManifest}: rendered MP4 is missing.`);
        } else {
            const header = fs.readFileSync(videoPath).subarray(0, 32).toString('latin1');
            if (!header.includes('ftyp')) errors.push(`${relativeManifest}: rendered output is not an MP4.`);
            if (fs.statSync(videoPath).size > Number(manifest.render.maxBytes)) {
                errors.push(`${relativeManifest}: rendered MP4 exceeds maxBytes.`);
            }
        }
        if (!fs.existsSync(posterPath)) {
            errors.push(`${relativeManifest}: rendered poster is missing.`);
        } else {
            const dimensions = pngDimensions(posterPath);
            if (
                !dimensions ||
                dimensions.width !== manifest.render.width ||
                dimensions.height !== manifest.render.height
            ) {
                errors.push(`${relativeManifest}: poster dimensions must match the render dimensions.`);
            }
        }

        cases.push({ id: manifest.id, eventId, manifestPath, manifest });
    }
    return { errors, cases };
}

function main() {
    const root = path.resolve(process.env.AI_HISTORY_ARCHIVE_ROOT || path.join(__dirname, '..'));
    const result = validatePaperCases(root);
    console.log(`Paper-case validation: ${result.errors.length} error(s), ${result.cases.length} case(s).`);
    for (const error of result.errors) console.error(error);
    if (result.errors.length) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { validatePaperCases };
