'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT, 'archive');
const EVENTS_DIR = path.join(ARCHIVE_DIR, 'events');
const DEFAULT_VARIANT = 'default';

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonIfExists(file, fallback) {
    if (!fs.existsSync(file)) return fallback;
    return readJson(file);
}

function listEventIds() {
    if (!fs.existsSync(EVENTS_DIR)) return [];
    return fs
        .readdirSync(EVENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

function normalizeSourceForDisplay(source) {
    return {
        type: source.type,
        label: source.label,
        url: source.url
    };
}

function compileAssets(assets) {
    const images = [];
    const imageMeta = {};

    for (const asset of assets) {
        if (!asset || asset.kind !== 'image') continue;
        images.push(asset.path);
        imageMeta[asset.path] = {
            caption: asset.caption,
            subcaption: asset.subcaption,
            sourceName: asset.sourceName,
            source: asset.sourceUrl || asset.source,
            sourceUrl: asset.sourceUrl || asset.source,
            originalImageUrl: asset.originalImageUrl || '',
            license: asset.rights,
            usage: asset.usage
        };
    }

    return { images, imageMeta };
}

function compileEvent(eventId, options = {}) {
    const variantId = options.variantId || DEFAULT_VARIANT;
    const eventDir = path.join(EVENTS_DIR, eventId);
    const event = readJson(path.join(eventDir, 'event.json'));
    const claims = readJsonIfExists(path.join(eventDir, 'claims.json'), []);
    const sources = readJsonIfExists(path.join(eventDir, 'sources.json'), []);
    const assets = readJsonIfExists(path.join(eventDir, 'assets.json'), []);
    const quizzes = readJsonIfExists(path.join(eventDir, 'quizzes.json'), []);
    const variantFile = path.join(eventDir, 'variants', `${variantId}.json`);
    const variant = readJsonIfExists(variantFile, {});
    const compiledAssets = compileAssets(assets);
    const achievement = variant.achievement ? { ...variant.achievement } : undefined;

    if (achievement && !Array.isArray(achievement.sources)) {
        achievement.sources = sources.map(normalizeSourceForDisplay);
    }

    return {
        ...event,
        ...variant,
        id: event.id || eventId,
        year: event.year,
        title: variant.title || event.title,
        location: event.location,
        figures: variant.figures || event.figures || [],
        quoteText: variant.quoteText || event.quoteText,
        quoteMeta: variant.quoteMeta || event.quoteMeta,
        quotePage: variant.quotePage || event.quotePage,
        claims,
        sources,
        images: variant.images || compiledAssets.images,
        imageMeta: {
            ...compiledAssets.imageMeta,
            ...(variant.imageMeta || {})
        },
        videos: variant.videos || [],
        quizzes: variant.quizzes || quizzes,
        achievement
    };
}

function loadArchiveEvents(options = {}) {
    const events = {};
    for (const eventId of listEventIds()) {
        events[eventId] = compileEvent(eventId, options);
    }
    return events;
}

module.exports = {
    ARCHIVE_DIR,
    EVENTS_DIR,
    compileEvent,
    loadArchiveEvents,
    listEventIds
};
