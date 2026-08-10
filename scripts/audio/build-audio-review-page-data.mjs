#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const ROOT = path.resolve(SCRIPT_DIR, '../..');
const STORYLINES_ROOT = path.join(ROOT, 'archive/storylines');
const REVISIONS_ROOT = path.join(ROOT, 'audio/revisions');
const TOOL_ROOT = path.join(ROOT, 'tools/audio-review-console');
const OUTPUT_PATH = path.join(TOOL_ROOT, 'review-data.json');
const ACTIVE_OVERLAYS_PATH = path.join(TOOL_ROOT, 'active-overlays.json');

const FORMAT_LABELS = {
    dialogue: { zh: '双人问答', en: 'Two-speaker dialogue' },
    narration: { zh: '单人讲述', en: 'Single narration' },
    hybrid: { zh: '对话与讲述混合', en: 'Dialogue and narration' }
};

const NARRATIVE_STYLE_LABELS = {
    dialogue: { zh: '科普问答', en: 'Science dialogue' },
    narration: { zh: '科普故事讲述', en: 'Science storytelling' },
    hybrid: { zh: '混合式科普讲述', en: 'Hybrid science storytelling' }
};

const CLOSING_LABELS = {
    summary: { zh: '自然收束', en: 'Natural conclusion' },
    'open-question': { zh: '开放问题', en: 'Open question' },
    'historical-echo': { zh: '历史回响', en: 'Historical echo' },
    'forward-hook': { zh: '向后预告', en: 'Forward hook' }
};

async function readJson(filePath) {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function exists(filePath) {
    return Boolean(await fs.stat(filePath).catch(() => null));
}

export async function loadStorylineEntries(storylinesRoot = STORYLINES_ROOT) {
    const fileNames = (await fs.readdir(storylinesRoot)).filter((fileName) => fileName.endsWith('.json')).sort();
    const entries = await Promise.all(
        fileNames.map(async (fileName) => {
            const storyline = await readJson(path.join(storylinesRoot, fileName));
            if (!storyline.id) throw new Error(`Storyline ${fileName} is missing an id`);
            return [
                storyline.id,
                storyline.events.filter((entry) => entry.enabled !== false).sort((a, b) => a.order - b.order)
            ];
        })
    );
    const storylines = new Map(entries);
    if (storylines.size !== entries.length) throw new Error('Archive contains duplicate storyline ids');
    return storylines;
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

function reviewEventKey(scopeId, sequenceIndex) {
    return `${scopeId}:${sequenceIndex}`;
}

function editorialMetadataKey(scopeId, sequenceIndex, eventId, locale, mode) {
    return `${scopeId}:${sequenceIndex}:${eventId}:${locale}:${mode}`;
}

async function loadRevisionConfigs(revisionsRoot = REVISIONS_ROOT) {
    const configs = new Map();
    const fileNames = (await fs.readdir(revisionsRoot, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name)
        .sort();
    for (const fileName of fileNames) {
        const configPath = path.join(revisionsRoot, fileName);
        const config = await readJson(configPath);
        if (!config.revisionId) continue;
        if (configs.has(config.revisionId)) throw new Error(`Duplicate revision id: ${config.revisionId}`);
        const turnsDir = path.resolve(ROOT, config.turnsDir);
        const voiceProfilePath = path.resolve(ROOT, config.voiceProfilePath);
        const metadata = new Map();
        for (const turnsFileName of (await fs.readdir(turnsDir)).filter((name) => name.endsWith('.json')).sort()) {
            const turns = await readJson(path.join(turnsDir, turnsFileName));
            const locale = turns.locale || config.specification?.locales?.[0] || 'zh';
            const mode = turns.mode || 'storyline';
            metadata.set(editorialMetadataKey(turns.scopeId, turns.sequenceIndex, turns.eventId, locale, mode), turns);
        }
        configs.set(config.revisionId, {
            config,
            configPath,
            metadata,
            voiceProfile: await readJson(voiceProfilePath)
        });
    }
    return configs;
}

async function loadActiveOverlays() {
    if (!(await exists(ACTIVE_OVERLAYS_PATH))) return { overlays: new Map(), revisions: new Map() };
    const descriptors = await readJson(ACTIVE_OVERLAYS_PATH);
    const configs = await loadRevisionConfigs();
    const overlays = new Map();
    const revisions = new Map();

    for (const overlayEntry of descriptors) {
        const descriptor = typeof overlayEntry === 'string' ? { path: overlayEntry } : overlayEntry;
        const overlay = await readJson(path.join(ROOT, descriptor.path));
        const revision = configs.get(overlay.revisionId);
        if (!revision) throw new Error(`Missing tracked revision config for overlay ${overlay.revisionId}`);
        if (descriptor.revisionId && descriptor.revisionId !== overlay.revisionId) {
            throw new Error(
                `Overlay revision mismatch for ${descriptor.path}: expected ${descriptor.revisionId}, found ${overlay.revisionId}`
            );
        }
        if (descriptor.configPath) {
            const expectedConfigPath = path.resolve(ROOT, descriptor.configPath);
            if (expectedConfigPath !== revision.configPath) {
                throw new Error(`Revision config mismatch for overlay ${overlay.revisionId}`);
            }
        }
        revisions.set(overlay.revisionId, revision);
        for (const asset of overlay.assets || []) {
            const key = overlayKey(asset.scopeId, asset.sequenceIndex, asset.locale, asset.mode);
            const metadata = revision.metadata.get(
                editorialMetadataKey(asset.scopeId, asset.sequenceIndex, asset.eventId, asset.locale, asset.mode)
            );
            if (!metadata) {
                throw new Error(
                    `Revision ${overlay.revisionId} has no tracked turns for ${asset.scopeId}/${asset.sequenceIndex}/${asset.locale}/${asset.mode}`
                );
            }
            const candidates = overlays.get(key) || [];
            candidates.push({
                status: overlay.status,
                comparisonKind:
                    descriptor.comparisonKind ||
                    overlay.comparisonKind ||
                    revision.config.comparisonKind ||
                    (overlay.revisionId.includes('interactive') ? 'interactive' : 'previous'),
                comparisonLabel: descriptor.label || overlay.label || revision.config.label,
                editorial: metadata,
                turns: asset.turns || metadata.turns,
                voiceProfile: asset.voiceProfile || revision.voiceProfile,
                ...asset
            });
            overlays.set(key, candidates);
        }
    }

    return { overlays, revisions };
}

function latestEditorialMetadata(overlays, scopeId, sequenceIndex) {
    for (const locale of ['zh', 'en']) {
        const candidates = overlays.get(overlayKey(scopeId, sequenceIndex, locale, 'storyline')) || [];
        const editorial = candidates.at(-1)?.editorial;
        if (editorial) return editorial;
    }
    return null;
}

function editorialFields(editorial) {
    const format = editorial?.format || 'narration';
    const closingType = editorial?.closingType || 'summary';
    return {
        format,
        formatLabel: FORMAT_LABELS[format] || FORMAT_LABELS.narration,
        narrativeStyle: `${format}-science-story`,
        narrativeStyleLabel: NARRATIVE_STYLE_LABELS[format] || NARRATIVE_STYLE_LABELS.narration,
        closingType,
        closingLabel: CLOSING_LABELS[closingType] || CLOSING_LABELS.summary
    };
}

function applyOverlay(overlay) {
    return {
        audio: overlay.audio,
        quality: overlay.quality,
        sampleAudit: null,
        turns: overlay.turns || [],
        voiceProfile: overlay.voiceProfile,
        revision: {
            id: overlay.revisionId,
            status: overlay.status,
            kind: overlay.comparisonKind,
            label: overlay.comparisonLabel
        }
    };
}

function collectEvidenceIds(candidates, field) {
    return [
        ...new Set(
            candidates.flatMap((candidate) =>
                (candidate.turns || []).flatMap((turn) => (Array.isArray(turn[field]) ? turn[field] : []))
            )
        )
    ];
}

function buildOverlayVariant(candidates) {
    const revisionOptions = candidates.map(applyOverlay);
    return {
        ...revisionOptions.at(-1),
        revisionOptions
    };
}

export async function buildOverlayOnlyEvent({ scopeId, sequenceIndex, overlays, storylineEntries }) {
    const candidatesByLocale = Object.fromEntries(
        ['zh', 'en']
            .map((locale) => [locale, overlays.get(overlayKey(scopeId, sequenceIndex, locale, 'storyline')) || []])
            .filter(([, candidates]) => candidates.length)
    );
    const locales = Object.keys(candidatesByLocale);
    if (!locales.length) throw new Error(`Overlay-only review event ${scopeId}/${sequenceIndex} has no audio`);
    const allCandidates = locales.flatMap((locale) => candidatesByLocale[locale]);
    const latest = candidatesByLocale.zh?.at(-1) || candidatesByLocale.en.at(-1);
    const storyline = storylineEntries.get(scopeId);
    const storylineEntry = storyline?.[sequenceIndex - 1];
    if (!storylineEntry || storylineEntry.eventId !== latest.eventId) {
        throw new Error(
            `Storyline order mismatch for overlay-only event ${scopeId}/${sequenceIndex}/${latest.eventId}`
        );
    }

    const eventDirectory = path.join(ROOT, 'archive/events', latest.eventId);
    const event = await readJson(path.join(eventDirectory, 'event.json'));
    const editorial = latestEditorialMetadata(overlays, scopeId, sequenceIndex);
    const variantId = editorial?.variantId || storylineEntry.variant;
    const variant = await readJson(path.join(eventDirectory, 'variants', `${variantId}.json`));
    const sourceIds = collectEvidenceIds(allCandidates, 'sourceIds');
    const claimIds = collectEvidenceIds(allCandidates, 'claimIds');
    const archiveSources = await readJson(path.join(eventDirectory, 'sources.json'));
    const sources = sourceIds
        .map((sourceId) => archiveSources.find((source) => source.id === sourceId))
        .filter(Boolean)
        .map(normalizeSource);
    const previousEntry = storyline[sequenceIndex - 2] || null;
    const nextEntry = storyline[sequenceIndex] || null;
    const durations = allCandidates.map((candidate) => candidate.audio.durationSec).filter(Number.isFinite);

    return {
        scopeId,
        sequenceIndex,
        storylineOrder: storylineEntry.order,
        year: event.year,
        eventId: event.id,
        variantId,
        styleAuthority: editorial?.styleAuthority || scopeId,
        title: variant.displayTitle || event.title,
        ...editorialFields(editorial),
        targetDurationSec: Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length),
        bridgeFromEventId: previousEntry?.eventId || null,
        bridgeToEventId: nextEntry?.eventId || null,
        relatedFigureIds: (variant.figures || event.figures || []).map((figure) => figure.figureId),
        sourceIds,
        claimIds,
        archiveAudit: {
            status: variant.review?.status || 'reviewed',
            warnings: [],
            selectedClaimStatuses: {}
        },
        sources,
        variants: Object.fromEntries(
            locales.map((locale) => [locale, { storyline: buildOverlayVariant(candidatesByLocale[locale]) }])
        )
    };
}

function releaseSummary(overlays) {
    const candidates = [...overlays.values()].flat();
    const uniqueAudio = new Map(candidates.map((candidate) => [candidate.audio.path, candidate]));
    const assets = [...uniqueAudio.values()];
    const passed = assets.filter((asset) => asset.quality?.passed).length;
    return {
        status: 'candidate-listening-review',
        humanListeningReview: { required: true, status: 'pending' },
        qualitySummary: { assetCount: assets.length, passed, failed: assets.length - passed },
        sampleAudit: null,
        previews: []
    };
}

async function main() {
    const [storylineEntries, active] = await Promise.all([loadStorylineEntries(), loadActiveOverlays()]);
    if (!active.overlays.size)
        throw new Error(`No active overlays configured in ${path.relative(ROOT, ACTIVE_OVERLAYS_PATH)}`);

    const eventKeys = new Set();
    for (const key of active.overlays.keys()) {
        const [scopeId, sequenceIndexText, , mode] = key.split(':');
        if (mode === 'storyline') eventKeys.add(reviewEventKey(scopeId, Number(sequenceIndexText)));
    }
    const events = [];
    for (const key of eventKeys) {
        const [scopeId, sequenceIndexText] = key.split(':');
        events.push(
            await buildOverlayOnlyEvent({
                scopeId,
                sequenceIndex: Number(sequenceIndexText),
                overlays: active.overlays,
                storylineEntries
            })
        );
    }
    const scopeOrder = new Map([...storylineEntries.keys()].map((scopeId, index) => [scopeId, index]));
    events.sort(
        (left, right) =>
            (scopeOrder.get(left.scopeId) ?? Number.MAX_SAFE_INTEGER) -
                (scopeOrder.get(right.scopeId) ?? Number.MAX_SAFE_INTEGER) || left.sequenceIndex - right.sequenceIndex
    );

    const firstRevision = active.revisions.values().next().value;
    const output = {
        schemaVersion: 2,
        generatedAt: new Date().toISOString(),
        release: releaseSummary(active.overlays),
        specification: firstRevision?.config.specification || null,
        voiceProfiles: Object.fromEntries(
            [...active.revisions.entries()].map(([revisionId, revision]) => [revisionId, revision.voiceProfile])
        ),
        scopes: Object.fromEntries(
            [...new Set(events.map((event) => event.scopeId))].map((scopeId) => [
                scopeId,
                { eventCount: events.filter((event) => event.scopeId === scopeId).length }
            ])
        ),
        events
    };

    await fs.mkdir(TOOL_ROOT, { recursive: true });
    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
    console.log(`Built ${path.relative(ROOT, OUTPUT_PATH)} with ${events.length} event packages.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
