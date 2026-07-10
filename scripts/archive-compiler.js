#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { FUSIONS } = require('../manage/event-fusions.js');

const AI100_LEGACY_ID_BY_CANONICAL = new Map(FUSIONS.map((fusion) => [fusion.canonical, `milestone-${fusion.ai100}`]));

const SAMPLE_LEGACY_IDS = {
    'deep-learning:2012-alexnet': 'milestone-2012-alexnet',
    'deep-learning:2017-transformer': 'milestone-2017-transformer',
    'deep-learning:2016-alphago': null,
    'bench-council-ai100:2012-alexnet': 'milestone-ai100-2012-alexnet',
    'bench-council-ai100:2017-transformer': 'milestone-ai100-2017-transformer',
    'bench-council-ai100:2016-alphago': 'milestone-2016-alphago',
    'gaming-ai:2016-alphago': 'milestone-gaming-ai-2016-alphago'
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function localizePair(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value == null ? { zh: '', en: '' } : value;
    return {
        zh: value.zh || value.en || '',
        en: value.en || value.zh || ''
    };
}

function pickLocalized(variantValue, eventValue) {
    return localizePair(variantValue || eventValue || { zh: '', en: '' });
}

function byId(items) {
    return new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}

function selectByIds(items, ids) {
    const map = byId(items);
    return (ids || []).map((id) => map.get(id)).filter(Boolean);
}

function sourceDisplay(source) {
    return {
        id: source.id,
        type: source.label || localizePair({ zh: source.type || '', en: source.type || '' }),
        label:
            typeof source.title === 'object'
                ? localizePair(source.title)
                : localizePair({ zh: source.title || '', en: source.title || '' }),
        url: source.url || source.doi || source.archiveUrl || '',
        reliability: source.reliability || '',
        sourceType: source.type || ''
    };
}

function assetImageMeta(asset) {
    return {
        caption: localizePair(asset.caption),
        subcaption: localizePair(asset.subcaption || { zh: asset.role || '', en: asset.role || '' }),
        sourceId: asset.sourceId || (Array.isArray(asset.sourceIds) ? asset.sourceIds[0] : ''),
        rights: asset.rights || {},
        role: asset.role || '',
        type: asset.type || ''
    };
}

function normalizeFigure(figure) {
    if (typeof figure === 'string') {
        return {
            id: figure,
            name: { zh: figure, en: figure },
            role: { zh: '', en: '' }
        };
    }

    return {
        id: figure.figureId || '',
        name: { zh: figure.figureId || '', en: figure.figureId || '' },
        role: localizePair(figure.role || { zh: '', en: '' }),
        organizationIds: figure.organizationIds || []
    };
}

function normalizeQuiz(quiz) {
    if (!quiz) return null;
    return {
        id: quiz.id,
        storylineId: quiz.storylineId || '',
        question: localizePair(quiz.question),
        options: (quiz.options || []).map((option) => localizePair(option.text || option)),
        answerIndex: typeof quiz.answer === 'number' ? quiz.answer : undefined,
        answer: quiz.answer,
        explanation: localizePair(quiz.explanation),
        sourceIds: quiz.sourceIds || [],
        assetIds: quiz.assetIds || []
    };
}

function loadEventBundle(root, eventId) {
    const eventDir = path.join(root, 'archive', 'events', eventId);
    if (!fileExists(eventDir)) throw new Error(`Missing archive event: ${eventId}`);

    return {
        id: eventId,
        dir: eventDir,
        event: readJson(path.join(eventDir, 'event.json')),
        claims: readJson(path.join(eventDir, 'claims.json')),
        sources: readJson(path.join(eventDir, 'sources.json')),
        assets: readJson(path.join(eventDir, 'assets.json')),
        quizzes: readJson(path.join(eventDir, 'quizzes.json'))
    };
}

function loadVariant(bundle, variantId) {
    const variantPath = path.join(bundle.dir, 'variants', `${variantId}.json`);
    if (!fileExists(variantPath)) throw new Error(`Missing variant: ${bundle.id}/${variantId}`);
    return readJson(variantPath);
}

function legacyIdFor(storylineId, eventId) {
    const key = `${storylineId}:${eventId}`;
    if (Object.prototype.hasOwnProperty.call(SAMPLE_LEGACY_IDS, key)) return SAMPLE_LEGACY_IDS[key];
    if (storylineId === 'gaming-ai') return `milestone-gaming-ai-${eventId}`;
    if (storylineId === 'bench-council-ai100' && eventId.startsWith('ai100-')) return `milestone-${eventId}`;
    if (storylineId === 'bench-council-ai100')
        return AI100_LEGACY_ID_BY_CANONICAL.get(eventId) || `milestone-${eventId}`;
    return `milestone-${eventId}`;
}

function buildMilestonePreview(root, storyline, ref) {
    const bundle = loadEventBundle(root, ref.eventId);
    const variant = loadVariant(bundle, ref.variant);
    const event = bundle.event;

    const selectedAssets = selectByIds(bundle.assets, variant.assetIds || []);
    const selectedSources = selectByIds(bundle.sources, variant.sourceIds || []);
    const selectedClaims = selectByIds(bundle.claims, variant.claimIds || []);
    const quizMap = byId(bundle.quizzes);
    const selectedQuiz = variant.quizId ? quizMap.get(variant.quizId) : null;

    const imageAssets = selectedAssets.filter((asset) => ['image', 'svg', 'gif'].includes(asset.type));
    const imageMeta = {};
    for (const asset of imageAssets) imageMeta[asset.path] = assetImageMeta(asset);

    const title = pickLocalized(variant.displayTitle, event.title);
    const summary = pickLocalized(variant.displaySummary, event.summary);
    const description = pickLocalized(variant.displayDescription, event.description || event.summary);

    return {
        id: legacyIdFor(storyline.id, event.id) || `archive-preview-${storyline.id}-${event.id}`,
        archiveEventId: event.id,
        archiveVariantId: ref.variant,
        archivePresentationMode: variant.presentationMode || 'preserve-legacy',
        sourceKind: 'archive-preview',
        storyline: {
            id: storyline.id,
            name: localizePair(storyline.title)
        },
        order: ref.order,
        year: event.year,
        date: event.date || '',
        title,
        subtitle: summary,
        category: localizePair(storyline.title),
        location: {
            name: (event.location && (event.location.place || event.location.name)) || { zh: '', en: '' },
            country: (event.location &&
                (event.location.country || {
                    zh: event.location.regionId || '',
                    en: event.location.regionId || ''
                })) || { zh: '', en: '' },
            regionId: event.location && event.location.regionId,
            coordinates: (event.location && event.location.coordinates) || []
        },
        description,
        figures: (event.figures || []).map(normalizeFigure),
        resources: {
            images: imageAssets.map((asset) => asset.path),
            videos: selectedAssets
                .filter((asset) => asset.type === 'video')
                .map((asset) => ({ id: asset.id, url: asset.path })),
            assetIds: selectedAssets.map((asset) => asset.id)
        },
        imageMeta,
        achievement: {
            visual: variant.visual || '',
            visualModules: variant.visualModules || [],
            sources: selectedSources.map(sourceDisplay),
            sourceIds: selectedSources.map((source) => source.id),
            claimIds: selectedClaims.map((claim) => claim.id),
            claims: selectedClaims.map((claim) => ({
                id: claim.id,
                importance: claim.importance || '',
                text: localizePair(claim.text),
                sourceIds: claim.sourceIds || [],
                status: claim.status || ''
            })),
            emphasis: variant.emphasis || []
        },
        commentarySections: variant.commentarySections || [],
        analysis: variant.analysis || null,
        quizzes: selectedQuiz ? [normalizeQuiz(selectedQuiz)] : [],
        archive: {
            eventFile: path.relative(root, path.join(bundle.dir, 'event.json')).replace(/\\/g, '/'),
            variantFile: path
                .relative(root, path.join(bundle.dir, 'variants', `${ref.variant}.json`))
                .replace(/\\/g, '/'),
            presentationMode: variant.presentationMode || 'preserve-legacy'
        }
    };
}

function loadStorylines(root) {
    const storylinesDir = path.join(root, 'archive', 'storylines');
    if (!fileExists(storylinesDir)) return [];
    return fs
        .readdirSync(storylinesDir)
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => readJson(path.join(storylinesDir, file)));
}

function buildArchivePreview(root) {
    const storylines = loadStorylines(root);
    const milestones = [];
    const errors = [];

    for (const storyline of storylines) {
        for (const ref of storyline.events || []) {
            if (ref && ref.enabled === false) continue;
            try {
                milestones.push(buildMilestonePreview(root, storyline, ref));
            } catch (error) {
                errors.push({ storylineId: storyline.id, ref, message: error.message });
            }
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        source: 'archive-preview',
        note: 'Preview output only. This file is not consumed by index.html or dual-screen.html.',
        counts: {
            storylines: storylines.length,
            milestones: milestones.length,
            errors: errors.length
        },
        storylines: storylines.map((storyline) => ({
            id: storyline.id,
            title: storyline.title,
            type: storyline.type,
            events: (storyline.events || []).length
        })),
        milestones,
        errors
    };
}

function mergeLocalizedPatch(targetValue, patchValue) {
    if (!patchValue || typeof patchValue !== 'object' || Array.isArray(patchValue)) return targetValue;
    return {
        ...(targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue) ? targetValue : {}),
        ...patchValue
    };
}

function cloneForReview(value) {
    return JSON.parse(JSON.stringify(value));
}

function applyArchiveMetadata(target, preview) {
    target.archive = preview.archive;
    target.archiveEventId = preview.archiveEventId;
    target.archiveVariantId = preview.archiveVariantId;
    target.archivePresentationMode = preview.archivePresentationMode || 'preserve-legacy';
    target.sourceKind = 'archive+legacy';

    target.resources = target.resources || {};
    target.resources.archiveAssetIds = preview.resources.assetIds;

    target.imageMeta = {
        ...(target.imageMeta || {}),
        ...preview.imageMeta
    };

    target.achievement = target.achievement || {};
    target.achievement.archiveSources = preview.achievement.sources;
    target.achievement.archiveSourceIds = preview.achievement.sourceIds;
    target.achievement.archiveClaims = preview.achievement.claims;
    target.achievement.archiveClaimIds = preview.achievement.claimIds;
    target.achievement.archiveEmphasis = preview.achievement.emphasis;
}

function applyArchivePresentation(target, preview) {
    target.title = mergeLocalizedPatch(target.title, preview.title);
    target.subtitle = mergeLocalizedPatch(target.subtitle, preview.subtitle);
    target.description = mergeLocalizedPatch(target.description, preview.description);

    target.resources = target.resources || {};
    target.resources.images = preview.resources.images;

    target.achievement = target.achievement || {};
    target.achievement.sources = preview.achievement.sources;
    target.achievement.sourceIds = preview.achievement.sourceIds;
    if (preview.achievement.visual) target.achievement.visual = preview.achievement.visual;

    if (preview.commentarySections.length > 0) target.commentarySections = preview.commentarySections;
    if (preview.analysis) target.analysis = preview.analysis;
    if (preview.quizzes.length > 0) target.quizzes = preview.quizzes;
}

function applyArchivePreviewToMilestone(target, preview, options = {}) {
    applyArchiveMetadata(target, preview);
    const presentationMode = options.forceArchivePresentation
        ? 'archive'
        : preview.archivePresentationMode || 'preserve-legacy';
    if (presentationMode === 'archive') {
        applyArchivePresentation(target, preview);
    }
}

function buildEffectiveArchivePreview(legacySnapshot, preview, options = {}) {
    const effective = cloneForReview(legacySnapshot);
    applyArchivePreviewToMilestone(effective, preview, options);
    effective.sourceKind = 'archive-preview-effective';
    return effective;
}

function applyArchiveOverlays(milestones, options = {}) {
    const root = options.root || path.resolve(__dirname, '..');
    const forceArchivePresentation = options.forceArchivePresentation === true;
    const preview = buildArchivePreview(root);
    const applied = [];
    const skipped = [];
    const reviewRows = [];

    for (const item of preview.milestones) {
        if (!item.id || item.id.startsWith('archive-preview-')) {
            const skippedItem = {
                archiveEventId: item.archiveEventId,
                archiveVariantId: item.archiveVariantId,
                reason: 'no legacy id'
            };
            skipped.push(skippedItem);
            reviewRows.push({
                id: item.id,
                archiveEventId: item.archiveEventId,
                archiveVariantId: item.archiveVariantId,
                storylineId: item.storyline.id,
                status: 'skipped',
                reason: skippedItem.reason,
                archivePresentationMode: item.archivePresentationMode,
                legacy: null,
                archivePreview: cloneForReview(item),
                rawArchivePreview: cloneForReview(item),
                final: null
            });
            continue;
        }
        const target = milestones.find((milestone) => milestone.id === item.id);
        if (!target) {
            const skippedItem = {
                id: item.id,
                archiveEventId: item.archiveEventId,
                archiveVariantId: item.archiveVariantId,
                reason: 'legacy milestone not found'
            };
            skipped.push(skippedItem);
            reviewRows.push({
                id: item.id,
                archiveEventId: item.archiveEventId,
                archiveVariantId: item.archiveVariantId,
                storylineId: item.storyline.id,
                status: 'skipped',
                reason: skippedItem.reason,
                archivePresentationMode: item.archivePresentationMode,
                legacy: null,
                archivePreview: cloneForReview(item),
                rawArchivePreview: cloneForReview(item),
                final: null
            });
            continue;
        }
        const legacySnapshot = cloneForReview(target);
        const effectiveArchivePreview = buildEffectiveArchivePreview(legacySnapshot, item, {
            forceArchivePresentation
        });
        applyArchivePreviewToMilestone(target, item, { forceArchivePresentation });
        const finalSnapshot = cloneForReview(target);
        applied.push({
            id: item.id,
            archiveEventId: item.archiveEventId,
            archiveVariantId: item.archiveVariantId,
            storylineId: item.storyline.id
        });
        reviewRows.push({
            id: item.id,
            archiveEventId: item.archiveEventId,
            archiveVariantId: item.archiveVariantId,
            archivePresentationMode: item.archivePresentationMode,
            storylineId: item.storyline.id,
            status: 'applied',
            reason: '',
            legacy: legacySnapshot,
            archivePreview: effectiveArchivePreview,
            rawArchivePreview: cloneForReview(item),
            final: finalSnapshot
        });
    }

    return { applied, skipped, errors: preview.errors, preview, reviewRows };
}

module.exports = {
    applyArchivePreviewToMilestone,
    applyArchiveOverlays,
    buildArchivePreview,
    legacyIdFor
};
