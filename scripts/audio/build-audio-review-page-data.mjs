#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '../..');
const PACKAGE_ROOT = path.join(ROOT, 'resources/audio/scripts/ai100-first-40-and-gaming');
const GENERATED_ROOT = path.join(ROOT, 'resources/audio/generated/ai100-first-40-and-gaming');
const PLAN_PATH = path.join(ROOT, 'resources/audio/plans/ai100-first-40-and-gaming/editorial-plan.json');
const OUTPUT_PATH = path.join(ROOT, 'designs/audio-review-console/review-data.json');
const ACTIVE_OVERLAYS_PATH = path.join(ROOT, 'designs/audio-review-console/active-overlays.json');

async function readJson(filePath) {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function getPlanEvent(plan, scopeId, eventId, sequenceIndex) {
    return plan.scopes[scopeId].events.find(
        (event) => event.eventId === eventId && event.sequenceIndex === sequenceIndex
    );
}

function getQualityAsset(quality, scopeId, sequenceIndex, locale, mode) {
    return quality.assets.find(
        (asset) =>
            asset.scopeId === scopeId &&
            asset.sequenceIndex === sequenceIndex &&
            asset.locale === locale &&
            asset.mode === mode
    );
}

function getSampleAudit(samples, scopeId, sequenceIndex, locale) {
    if (scopeId !== 'bench-council-ai100') return null;

    const prefix = String(sequenceIndex).padStart(2, '0');
    return samples.results.find((result) => result.sample.startsWith(`${prefix}-`) && result.locale === locale) || null;
}

function compileTurns(event, locale, mode) {
    const localeData = event.locales[locale];
    const intro = mode === 'standalone' ? localeData.standaloneIntro : localeData.storylineBridgeIn;

    return [...intro, ...localeData.body, ...localeData.closing];
}

function normalizeSource(source) {
    return {
        id: source.id,
        type: source.type,
        label: source.label,
        title: source.title,
        url: source.url,
        reliability: source.reliability,
        purpose: source.purpose
    };
}

function overlayKey(scopeId, sequenceIndex, locale, mode) {
    return `${scopeId}:${sequenceIndex}:${locale}:${mode}`;
}

async function loadActiveOverlays() {
    if (!(await fs.stat(ACTIVE_OVERLAYS_PATH).catch(() => null))) return new Map();
    const overlayPaths = await readJson(ACTIVE_OVERLAYS_PATH);
    const overlays = new Map();
    for (const overlayEntry of overlayPaths) {
        const descriptor = typeof overlayEntry === 'string' ? { path: overlayEntry } : overlayEntry;
        const overlay = await readJson(path.join(ROOT, descriptor.path));
        if (descriptor.revisionId && descriptor.revisionId !== overlay.revisionId) {
            throw new Error(
                `Overlay revision mismatch for ${descriptor.path}: expected ${descriptor.revisionId}, found ${overlay.revisionId}`
            );
        }
        for (const asset of overlay.assets) {
            const key = overlayKey(asset.scopeId, asset.sequenceIndex, asset.locale, asset.mode);
            const candidates = overlays.get(key) || [];
            candidates.push({
                status: overlay.status,
                comparisonKind:
                    descriptor.comparisonKind ||
                    overlay.comparisonKind ||
                    (overlay.revisionId.includes('interactive') ? 'interactive' : 'previous'),
                comparisonLabel:
                    descriptor.label ||
                    overlay.label ||
                    (overlay.revisionId.includes('interactive') ? '互动增强版' : '原版'),
                ...asset
            });
            overlays.set(key, candidates);
        }
    }
    return overlays;
}

function applyOverlay(variant, overlay) {
    return {
        ...variant,
        audio: overlay.audio,
        quality: overlay.quality,
        turns: overlay.turns || variant.turns,
        voiceProfile: overlay.voiceProfile,
        revision: {
            id: overlay.revisionId,
            status: overlay.status,
            kind: overlay.comparisonKind,
            label: overlay.comparisonLabel
        }
    };
}

async function buildEvent({ event, plan, resourceMap, quality, samples, overlays }) {
    const planEvent = getPlanEvent(plan, event.scopeId, event.eventId, event.sequenceIndex);
    const resourceEvent = resourceMap.scopes[event.scopeId].events.find(
        (candidate) => candidate.sequenceIndex === event.sequenceIndex
    );
    const allSources = await readJson(path.join(ROOT, 'archive/events', event.eventId, 'sources.json'));
    const sources = event.sourceIds.map((sourceId) => {
        const source = allSources.find((candidate) => candidate.id === sourceId);
        if (!source) {
            throw new Error(`Missing source ${sourceId} for ${event.eventId}`);
        }
        return normalizeSource(source);
    });
    const variants = {};

    for (const locale of ['zh', 'en']) {
        variants[locale] = {};
        for (const mode of ['standalone', 'storyline']) {
            const audio = resourceEvent.audio[mode][locale];
            variants[locale][mode] = {
                audio,
                quality: getQualityAsset(quality, event.scopeId, event.sequenceIndex, locale, mode),
                sampleAudit:
                    mode === 'storyline' ? getSampleAudit(samples, event.scopeId, event.sequenceIndex, locale) : null,
                turns: compileTurns(event, locale, mode),
                voiceProfile: event.voiceProfile[locale],
                revision: null
            };
            const overlayCandidates = overlays.get(overlayKey(event.scopeId, event.sequenceIndex, locale, mode)) || [];
            if (overlayCandidates.length) {
                const baseVariant = variants[locale][mode];
                const revisionOptions = overlayCandidates.map((overlay) => applyOverlay(baseVariant, overlay));
                variants[locale][mode] = {
                    ...revisionOptions.at(-1),
                    revisionOptions
                };
            }
        }
    }

    return {
        scopeId: event.scopeId,
        sequenceIndex: event.sequenceIndex,
        storylineOrder: event.storylineOrder,
        year: planEvent.year,
        eventId: event.eventId,
        variantId: event.variantId,
        styleAuthority: event.styleAuthority,
        title: event.title,
        format: event.format,
        formatLabel: planEvent.editorial.formatLabel,
        narrativeStyle: event.narrativeStyle,
        narrativeStyleLabel: planEvent.editorial.narrativeStyleLabel,
        closingType: event.closingType,
        closingLabel: planEvent.editorial.closingLabel,
        targetDurationSec: event.targetDurationSec,
        bridgeFromEventId: event.bridgeFromEventId,
        bridgeToEventId: event.bridgeToEventId,
        relatedFigureIds: event.relatedFigureIds,
        sourceIds: event.sourceIds,
        claimIds: event.claimIds,
        archiveAudit: event.archiveAudit,
        sources,
        variants
    };
}

async function main() {
    const [manifest, plan, resourceMap, quality, samples, release, overlays] = await Promise.all([
        readJson(path.join(PACKAGE_ROOT, 'manifest.json')),
        readJson(PLAN_PATH),
        readJson(path.join(GENERATED_ROOT, 'resource-map.json')),
        readJson(path.join(GENERATED_ROOT, 'quality-report.json')),
        readJson(path.join(GENERATED_ROOT, 'listening-sample-report.json')),
        readJson(path.join(GENERATED_ROOT, 'release-manifest.json')),
        loadActiveOverlays()
    ]);

    const events = [];
    for (const [scopeId, scope] of Object.entries(manifest.scopes)) {
        for (const manifestEvent of scope.events) {
            const structured = await readJson(path.join(PACKAGE_ROOT, manifestEvent.structuredPath));
            events.push(
                await buildEvent({
                    event: { ...structured, scopeId },
                    plan,
                    resourceMap,
                    quality,
                    samples,
                    overlays
                })
            );
        }
    }

    const output = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        release: {
            status: release.status,
            humanListeningReview: release.humanListeningReview,
            qualitySummary: release.qualitySummary,
            sampleAudit: release.sampleAudit,
            previews: release.previews
        },
        specification: resourceMap.specification,
        voiceProfiles: manifest.voiceProfiles,
        scopes: Object.fromEntries(
            Object.entries(resourceMap.scopes).map(([scopeId, scope]) => [scopeId, { eventCount: scope.eventCount }])
        ),
        events
    };

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
    console.log(`Built ${path.relative(ROOT, OUTPUT_PATH)} with ${events.length} event packages.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
