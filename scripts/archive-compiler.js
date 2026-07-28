#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
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

function isDisplaySource(source) {
    return source && source.id !== 'source-legacy-event-record';
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
        purpose: source.purpose || '',
        reliability: source.reliability || '',
        sourceType: source.type || ''
    };
}

function assetImageMeta(asset) {
    const rights = asset.rights || {};
    return {
        caption: localizePair(asset.caption),
        subcaption: localizePair(asset.subcaption),
        ...(asset.sourceName ? { sourceName: cloneJson(asset.sourceName) } : {}),
        ...(asset.sourceUrl ? { sourceUrl: asset.sourceUrl } : {}),
        ...(rights.license ? { license: cloneJson(rights.license) } : {}),
        ...(asset.displayUsage ? { usage: cloneJson(asset.displayUsage) } : {}),
        sourceId: asset.sourceId || (Array.isArray(asset.sourceIds) ? asset.sourceIds[0] : ''),
        rights,
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
        name: localizePair(figure.name || { zh: figure.figureId || '', en: figure.figureId || '' }),
        role: localizePair(figure.role || { zh: '', en: '' }),
        ...(figure.avatar !== undefined ? { avatar: figure.avatar || '' } : {}),
        ...(figure.avatarStyle !== undefined ? { avatarStyle: figure.avatarStyle || '' } : {}),
        ...(figure.figureType !== undefined ? { figureType: figure.figureType || 'person' } : {}),
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

function buildMilestone(root, storyline, ref) {
    if (!ref.milestoneId) {
        throw new Error(`Missing milestoneId: ${storyline.id}/${ref.eventId}/${ref.variant}`);
    }
    const bundle = loadEventBundle(root, ref.eventId);
    const variant = loadVariant(bundle, ref.variant);
    const event = bundle.event;

    const selectedAssets = selectByIds(bundle.assets, variant.assetIds || []);
    const selectedSources = selectByIds(bundle.sources, variant.sourceIds || []);
    const displaySources = selectedSources.filter(isDisplaySource);
    const selectedClaims = selectByIds(bundle.claims, variant.claimIds || []);
    const quizMap = byId(bundle.quizzes);
    const selectedQuiz = variant.quizId ? quizMap.get(variant.quizId) : null;

    const imageAssets = selectedAssets.filter((asset) => ['image', 'svg', 'gif'].includes(asset.type));
    const imageMeta = {};
    for (const asset of imageAssets) imageMeta[asset.path] = assetImageMeta(asset);

    const title = pickLocalized(variant.displayTitle, event.title);
    const summary = pickLocalized(variant.displaySummary, event.summary);
    const description = pickLocalized(variant.displayDescription, event.description || event.summary);

    const milestone = {
        id: ref.milestoneId,
        archiveEventId: event.id,
        archiveVariantId: ref.variant,
        archivePresentationMode: variant.presentationMode || 'preserve-legacy',
        sourceKind: 'archive',
        storyline: {
            id: storyline.id,
            name: localizePair(storyline.title)
        },
        order: ref.order,
        year: event.year,
        date: event.date || '',
        title,
        subtitle: pickLocalized(variant.displaySubtitle, summary),
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
            ...(storyline.id === 'humanistic-cycle' ? { imageMeta } : {}),
            videos: selectedAssets
                .filter((asset) => asset.type === 'video')
                .map((asset) => ({ id: asset.id, url: asset.path })),
            assetIds: selectedAssets.map((asset) => asset.id)
        },
        imageMeta,
        achievement: {
            ...(variant.visual ? { visual: variant.visual } : {}),
            visualModules: variant.visualModules || [],
            sources: displaySources.map(sourceDisplay),
            sourceIds: displaySources.map((source) => source.id),
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

    return applyVariantPresentation(milestone, variant);
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

function applyVariantPresentation(milestone, variant) {
    const directFields = [
        'category',
        'location',
        'figures',
        'papers',
        'photos',
        'videoUrl',
        'quote',
        'quoteText',
        'quoteHtml',
        'quoteMeta',
        'quotePage',
        'quoteAttribution',
        'quoteLabel',
        'sentiment',
        'realityLinks',
        'branchSummary',
        'branch'
    ];
    for (const field of directFields) {
        if (variant[field] !== undefined) milestone[field] = cloneJson(variant[field]);
    }

    if (variant.resources && Array.isArray(variant.resources.videos)) {
        milestone.resources.videos = cloneJson(variant.resources.videos);
    }
    if (variant.achievement && typeof variant.achievement === 'object' && !Array.isArray(variant.achievement)) {
        milestone.achievement = {
            ...milestone.achievement,
            ...cloneJson(variant.achievement)
        };
    }

    return milestone;
}

function compileArchive(root) {
    const storylines = loadStorylines(root);
    const milestones = [];
    const errors = [];

    for (const storyline of storylines) {
        for (const ref of storyline.events || []) {
            if (ref && ref.enabled === false) continue;
            try {
                milestones.push(buildMilestone(root, storyline, ref));
            } catch (error) {
                errors.push({ storylineId: storyline.id, ref, message: error.message });
            }
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        source: 'archive',
        note: 'Compiled from Archive storylines, events, and variants.',
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

module.exports = {
    compileArchive
};
