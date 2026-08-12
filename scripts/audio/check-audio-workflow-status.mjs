#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
    ROOT,
    loadRevisionConfig,
    loadRevisionTurns,
    readJson,
    relativeToRoot,
    revisionPaths
} from './lib/audio-revision.mjs';
const require = createRequire(import.meta.url);
const { resolveEffectivePresentation } = require('../archive-presentation');
const { loadMediaStorageConfig, normalizeObjectKey, resolveMediaStorage } = require('../media-storage');

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REVISIONS_ROOT = path.join(ROOT, 'audio/revisions');
const SOURCE_CHECK_SCRIPT = path.join(ROOT, 'scripts/audio/build-audio-revision.mjs');
const ACTIVE_OVERLAYS_PATH = path.join(ROOT, 'tools/audio-review-console/active-overlays.json');
const REVIEW_DATA_PATH = path.join(ROOT, 'tools/audio-review-console/review-data.json');

function parseArgs(argv) {
    return {
        json: argv.includes('--json'),
        remote: argv.includes('--remote'),
        strict: argv.includes('--strict')
    };
}

function listRevisionConfigs() {
    return fs
        .readdirSync(REVISIONS_ROOT)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .map((fileName) => path.join(REVISIONS_ROOT, fileName));
}

function trackedFiles() {
    const result = spawnSync('git', ['ls-files', '-z', 'audio'], {
        cwd: ROOT,
        encoding: 'utf8'
    });
    if (result.status !== 0) return new Set();
    return new Set(result.stdout.split('\0').filter(Boolean));
}

function sourceCheck(configPath) {
    const result = spawnSync(process.execPath, [SOURCE_CHECK_SCRIPT, configPath, '--source-only'], {
        cwd: ROOT,
        encoding: 'utf8'
    });
    return {
        ok: result.status === 0,
        message: (result.status === 0 ? result.stdout : result.stderr || result.stdout).trim()
    };
}

function inspectRevisions() {
    const tracked = trackedFiles();
    const revisions = [];
    const sourceFiles = new Set();
    const errors = [];
    let turnCount = 0;
    let generatedAssetCount = 0;

    for (const configPath of listRevisionConfigs()) {
        try {
            const config = loadRevisionConfig(configPath);
            const turns = loadRevisionTurns(config);
            const check = sourceCheck(config.configPath);
            const files = [config.configPath, config.voiceProfilePath, ...turns.map((turn) => turn.path)];
            files.forEach((filePath) => sourceFiles.add(relativeToRoot(filePath)));
            turnCount += turns.length;
            if (!check.ok) errors.push(`${relativeToRoot(config.configPath)}: ${check.message}`);

            const { planPath, overlayPath } = revisionPaths(config);
            const planExists = fs.existsSync(planPath);
            const overlayExists = fs.existsSync(overlayPath);
            let overlayAssetCount = 0;
            let missingAudioCount = 0;
            if (overlayExists) {
                const overlay = readJson(overlayPath);
                overlayAssetCount = (overlay.assets || []).length;
                missingAudioCount = (overlay.assets || []).filter(
                    (asset) => !asset.audio?.path || !fs.existsSync(path.join(ROOT, asset.audio.path))
                ).length;
                generatedAssetCount += overlayAssetCount;
            }
            revisions.push({
                revisionId: config.revisionId,
                configPath: relativeToRoot(config.configPath),
                turnCount: turns.length,
                sourceValid: check.ok,
                generated: {
                    plan: planExists,
                    overlay: overlayExists,
                    assetCount: overlayAssetCount,
                    missingAudioCount,
                    complete:
                        planExists && overlayExists && overlayAssetCount === turns.length && missingAudioCount === 0
                }
            });
        } catch (error) {
            errors.push(`${relativeToRoot(configPath)}: ${error.message}`);
        }
    }

    const untrackedFiles = [...sourceFiles].filter((filePath) => !tracked.has(filePath)).sort();
    if (untrackedFiles.length) errors.push(`${untrackedFiles.length} audio source file(s) are not tracked by Git`);
    return {
        configCount: revisions.length,
        turnCount,
        trackedSourceFileCount: sourceFiles.size - untrackedFiles.length,
        untrackedFiles,
        validConfigCount: revisions.filter((revision) => revision.sourceValid).length,
        generatedRevisionCount: revisions.filter((revision) => revision.generated.complete).length,
        generatedAssetCount,
        revisions,
        errors
    };
}

function inspectReview() {
    const warnings = [];
    let activeRevisions = [];
    let eventCount = 0;
    let scopes = {};
    if (fs.existsSync(ACTIVE_OVERLAYS_PATH)) {
        activeRevisions = readJson(ACTIVE_OVERLAYS_PATH)
            .map((descriptor) => descriptor.revisionId)
            .filter(Boolean);
    } else {
        warnings.push('No active review overlays are configured');
    }
    if (fs.existsSync(REVIEW_DATA_PATH)) {
        const reviewData = readJson(REVIEW_DATA_PATH);
        eventCount = reviewData.events?.length || 0;
        scopes = reviewData.scopes || {};
    } else {
        warnings.push('Review data has not been generated');
    }
    return {
        activeRevisionCount: activeRevisions.length,
        activeRevisions,
        eventCount,
        scopes,
        warnings
    };
}

function inspectArchive() {
    const storylinesRoot = path.join(ROOT, 'archive/storylines');
    const mediaStorageConfig = loadMediaStorageConfig(ROOT);
    const assetCache = new Map();
    const eventCache = new Map();
    const variantCache = new Map();
    const eventIds = new Set();
    const referencedAudioIds = new Set();
    const missingAudio = [];
    const deliveryErrors = [];
    let storylineEntryCount = 0;

    for (const fileName of fs
        .readdirSync(storylinesRoot)
        .filter((name) => name.endsWith('.json'))
        .sort()) {
        const storyline = readJson(path.join(storylinesRoot, fileName));
        const entries = storyline.events
            .filter((entry) => entry.enabled !== false)
            .sort((left, right) => left.order - right.order);
        for (const entry of entries) {
            storylineEntryCount += 1;
            eventIds.add(entry.eventId);
            if (!assetCache.has(entry.eventId)) {
                assetCache.set(
                    entry.eventId,
                    readJson(path.join(ROOT, 'archive/events', entry.eventId, 'assets.json'))
                );
            }
            if (!eventCache.has(entry.eventId)) {
                eventCache.set(entry.eventId, readJson(path.join(ROOT, 'archive/events', entry.eventId, 'event.json')));
            }
            const variantId = entry.variant || storyline.id;
            const variantKey = `${entry.eventId}:${variantId}`;
            if (!variantCache.has(variantKey)) {
                const eventDir = path.join(ROOT, 'archive/events', entry.eventId);
                variantCache.set(
                    variantKey,
                    resolveEffectivePresentation({
                        root: ROOT,
                        eventDir,
                        event: eventCache.get(entry.eventId),
                        eventId: entry.eventId,
                        storylineId: storyline.id,
                        ref: entry
                    }).presentation
                );
            }
            const assets = assetCache.get(entry.eventId);
            const variant = variantCache.get(variantKey);
            const assetIds = new Set(variant.assetIds || []);
            for (const locale of ['zh', 'en']) {
                const audio = assets.find(
                    (asset) => assetIds.has(asset.id) && asset.type === 'audio' && asset.language === locale
                );
                if (!audio) {
                    missingAudio.push(`${storyline.id}/${entry.eventId}/${variantId}/${locale}`);
                    continue;
                }
                referencedAudioIds.add(`${entry.eventId}:${audio.id}`);
            }
        }
    }

    const assets = [];
    for (const [eventId, eventAssets] of assetCache) {
        for (const audio of eventAssets.filter((asset) => asset.type === 'audio')) {
            const storage = resolveMediaStorage(audio, { config: mediaStorageConfig });
            const deliveryUrl = storage.publicUrl;
            const objectKey = storage.objectKey;
            const objectKeyPrefix = normalizeObjectKey(storage.objectKeyPrefix).replace(/\/+$/, '');
            if (
                !storage.provider ||
                !storage.bucket ||
                !objectKey.startsWith(`${objectKeyPrefix}/`) ||
                !deliveryUrl.startsWith(storage.publicUrlPrefix)
            ) {
                deliveryErrors.push(`${eventId}/${audio.id}`);
            }
            const sourcePath = String(storage.sourcePath || '').trim();
            assets.push({
                eventId,
                assetId: audio.id,
                language: audio.language,
                deliveryUrl,
                objectKey,
                sourcePath,
                referenced: referencedAudioIds.has(`${eventId}:${audio.id}`),
                localSourceExists: Boolean(sourcePath && fs.existsSync(path.join(ROOT, sourcePath)))
            });
        }
    }
    return {
        storylineEntryCount,
        uniqueEventCount: eventIds.size,
        referencedAudioAssetCount: referencedAudioIds.size,
        releaseObjectCount: assets.length,
        unreferencedAudioAssetCount: assets.filter((asset) => !asset.referenced).length,
        localSourceCount: assets.filter((asset) => asset.localSourceExists).length,
        missingLocalSourceCount: assets.filter((asset) => !asset.localSourceExists).length,
        missingAudio,
        deliveryErrors,
        assets
    };
}

async function inspectRemote(assets) {
    const results = new Array(assets.length);
    let cursor = 0;
    async function worker() {
        while (cursor < assets.length) {
            const index = cursor++;
            const asset = assets[index];
            try {
                const response = await fetch(asset.deliveryUrl, { method: 'HEAD' });
                results[index] = {
                    objectKey: asset.objectKey,
                    ok: response.ok,
                    status: response.status
                };
            } catch (error) {
                results[index] = { objectKey: asset.objectKey, ok: false, error: error.message };
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(12, assets.length) }, () => worker()));
    const failed = results.filter((result) => !result.ok);
    return { checked: results.length, passed: results.length - failed.length, failed };
}

export async function buildWorkflowReport(options = {}) {
    const source = inspectRevisions();
    const review = inspectReview();
    const archive = inspectArchive();
    const warnings = [...review.warnings];
    if (source.generatedRevisionCount !== source.configCount) {
        warnings.push(
            `${source.configCount - source.generatedRevisionCount} revision(s) do not have complete local generated output`
        );
    }
    if (archive.missingLocalSourceCount) {
        warnings.push(`${archive.missingLocalSourceCount} published audio source file(s) are not present locally`);
    }
    const errors = [
        ...source.errors,
        ...archive.missingAudio.map((item) => `Archive variant is missing audio: ${item}`),
        ...archive.deliveryErrors.map((item) => `Archive audio delivery is invalid: ${item}`)
    ];
    const remote = options.remote ? await inspectRemote(archive.assets) : null;
    if (remote?.failed.length) errors.push(`${remote.failed.length} published OSS audio object(s) are unreachable`);
    return {
        ok: errors.length === 0 && (!options.strict || warnings.length === 0),
        generatedAt: new Date().toISOString(),
        source,
        review,
        archive: { ...archive, assets: undefined },
        remote,
        warnings,
        errors
    };
}

function printReport(report) {
    console.log('Audio workflow status');
    console.log(
        `Source: ${report.source.validConfigCount}/${report.source.configCount} revisions valid, ` +
            `${report.source.turnCount} turns, ${report.source.untrackedFiles.length} untracked source file(s)`
    );
    console.log(
        `Generated: ${report.source.generatedRevisionCount}/${report.source.configCount} revisions complete, ` +
            `${report.source.generatedAssetCount} local audio asset(s)`
    );
    console.log(
        `Review: ${report.review.activeRevisionCount} active revisions, ${report.review.eventCount} event packages, ` +
            `${Object.keys(report.review.scopes).length} storyline(s)`
    );
    console.log(
        `Archive: ${report.archive.storylineEntryCount} storyline entries, ${report.archive.uniqueEventCount} events, ` +
            `${report.archive.releaseObjectCount} OSS release asset(s), ${report.archive.referencedAudioAssetCount} selected by variants, ` +
            `${report.archive.missingAudio.length} missing locale binding(s)`
    );
    console.log(
        report.remote
            ? `Remote: ${report.remote.passed}/${report.remote.checked} public OSS object(s) reachable`
            : 'Remote: not checked; pass --remote to probe public OSS objects'
    );
    for (const warning of report.warnings) console.warn(`WARN ${warning}`);
    for (const error of report.errors) console.error(`ERROR ${error}`);
    console.log(report.ok ? 'Audio workflow status passed.' : 'Audio workflow status failed.');
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const report = await buildWorkflowReport(options);
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printReport(report);
    if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });
}
