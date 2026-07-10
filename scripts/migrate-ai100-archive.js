#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const STORYLINES_DIR = path.join(ROOT, 'archive', 'storylines');
const AI100_STORYLINE_ID = 'bench-council-ai100';

const catalog = require('../manage/catalog.js');
const events = require('../manage/events.js');
const quizCatalog = require('../manage/quizzes.js');

function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getText(value, locale = 'en') {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return String(value[locale] || value.en || value.zh || '').trim();
    return String(value);
}

function stripHtml(value) {
    return getText(value)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function localized(value, fallbackEn, fallbackZh) {
    if (value && typeof value === 'object' && value.en && value.zh) return value;
    const text = getText(value) || fallbackEn || fallbackZh || '';
    return {
        en: text || fallbackEn || '',
        zh: fallbackZh || text || fallbackEn || ''
    };
}

function slugify(value, fallback) {
    const slug = String(value || '')
        .toLowerCase()
        .replace(/https?:\/\//g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return slug || fallback;
}

function findAi100Category() {
    return (catalog.categories || []).find(
        (category) => category.storyline && category.storyline.id === AI100_STORYLINE_ID
    );
}

function normalizeSources(rawSources) {
    const seen = new Set();
    return (rawSources || []).map((source, index) => {
        const base = slugify(getText(source.label) || source.url, `source-${index + 1}`);
        let id = base;
        let suffix = 2;
        while (seen.has(id)) {
            id = `${base}-${suffix}`;
            suffix += 1;
        }
        seen.add(id);
        return {
            id,
            type: source.type || { en: 'Source', zh: '来源' },
            label: source.label || { en: source.url || id, zh: source.url || id },
            url: source.url || ''
        };
    });
}

function sourceIdForUrl(sources, url) {
    if (!url) return '';
    const normalizedUrl = String(url).trim();
    const source = sources.find((item) => item.url === normalizedUrl);
    return source ? source.id : '';
}

function ensureSourceForAsset(sources, meta, assetPath) {
    const url = meta.sourceUrl || meta.source || (/^https?:\/\//.test(assetPath) ? assetPath : '');
    const sourceId = sourceIdForUrl(sources, url);
    if (sourceId) return sourceId;

    if (!url) return '';
    const idBase = slugify(meta.sourceName && getText(meta.sourceName), slugify(url, 'asset-source'));
    let id = idBase;
    let suffix = 2;
    const existing = new Set(sources.map((source) => source.id));
    while (existing.has(id)) {
        id = `${idBase}-${suffix}`;
        suffix += 1;
    }
    sources.push({
        id,
        type: { en: 'Image source', zh: '图片来源' },
        label: meta.sourceName || { en: url, zh: url },
        url
    });
    return id;
}

function normalizeAssets(eventId, event, sources) {
    const imageMeta = event.imageMeta || {};
    return (event.images || []).map((assetPath, index) => {
        const meta = imageMeta[assetPath] || {};
        return {
            id: `${eventId}-image-${index + 1}`,
            kind: 'image',
            path: assetPath,
            caption: meta.caption || { en: `Image ${index + 1}`, zh: `图片 ${index + 1}` },
            subcaption: meta.subcaption || { en: 'AI100 visual material', zh: 'AI100 视觉材料' },
            sourceId: ensureSourceForAsset(sources, meta, assetPath),
            sourceName: meta.sourceName || { en: 'Source not specified', zh: '来源未注明' },
            sourceUrl: meta.sourceUrl || meta.source || (/^https?:\/\//.test(assetPath) ? assetPath : ''),
            originalImageUrl: meta.originalImageUrl || '',
            rights: meta.license || { en: 'Rights not specified.', zh: '未注明权利信息。' },
            usage: meta.usage || { en: 'Achievement visual material', zh: '成就视觉材料' }
        };
    });
}

function normalizeClaims(eventId, event, sources) {
    const sourceIds = sources.slice(0, 2).map((source) => source.id);
    const claims = [];
    const description = {
        en: stripHtml(event.description && event.description.en ? event.description.en : event.description),
        zh: stripHtml(event.description && event.description.zh ? event.description.zh : '')
    };

    if (description.en || description.zh) {
        claims.push({
            id: `${eventId}-summary`,
            text: {
                en: description.en || description.zh,
                zh: description.zh || description.en
            },
            sourceIds
        });
    }

    if (event.quoteText) {
        claims.push({
            id: `${eventId}-quote`,
            text: {
                en: getText(event.quoteText, 'en'),
                zh: getText(event.quoteText, 'zh')
            },
            sourceIds: sourceIds.slice(0, 1)
        });
    }

    return claims.filter((claim) => claim.sourceIds.length > 0 && (claim.text.en || claim.text.zh));
}

function buildEventJson(eventId, event) {
    return {
        id: eventId,
        year: event.year,
        title: event.title,
        location: event.location,
        figures: event.figures || [],
        quoteText: event.quoteText || '',
        quoteMeta: event.quoteMeta || undefined,
        quotePage: event.quotePage || ''
    };
}

function buildVariant(event) {
    const achievement = normalizeAchievement(event.achievement);
    const variant = {
        description: event.description,
        commentarySections: event.commentarySections || [],
        videos: event.videos || [],
        achievement
    };
    if (event.analysis) variant.analysis = event.analysis;
    if (event.papers) variant.papers = event.papers;
    if (event.storyline) variant.storyline = event.storyline;
    return variant;
}

function normalizeAchievement(achievement) {
    if (!achievement || typeof achievement !== 'object') return achievement;
    return {
        ...achievement,
        visualModules: (achievement.visualModules || []).map((module) => normalizeVisualModule(module))
    };
}

function normalizeVisualModule(module) {
    if (!module || module.type !== 'archiveLink') return module;
    return {
        ...module,
        site: localized(module.site, 'Reference source', '参考来源'),
        title: localized(module.title, 'Source record', '资料记录'),
        description: localized(
            module.description,
            'Reference source for this AI100 achievement.',
            '该 AI100 成就的参考资料。'
        ),
        license: localized(
            module.license,
            'Reference link only; verify source rights before reuse.',
            '仅作为参考链接；复用前需核验来源权利。'
        ),
        usage: localized(module.usage, 'Article / source reference', '论文或资料来源'),
        action: localized(module.action, 'Open source page', '打开资料页面')
    };
}

function migrateEvent(eventId) {
    const event = events[eventId];
    if (!event) {
        throw new Error(`AI100 catalog references missing event: ${eventId}`);
    }

    const eventDir = path.join(ARCHIVE_EVENTS_DIR, eventId);
    const sources = normalizeSources((event.achievement && event.achievement.sources) || []);
    const assets = normalizeAssets(eventId, event, sources);
    const claims = normalizeClaims(eventId, event, sources);
    const quizzes = (quizCatalog.events && quizCatalog.events[eventId]) || event.quizzes || event.quiz || [];

    writeJson(path.join(eventDir, 'event.json'), buildEventJson(eventId, event));
    writeJson(path.join(eventDir, 'sources.json'), sources);
    writeJson(path.join(eventDir, 'assets.json'), assets);
    writeJson(path.join(eventDir, 'claims.json'), claims);
    writeJson(path.join(eventDir, 'quizzes.json'), Array.isArray(quizzes) ? quizzes : [quizzes]);
    writeJson(path.join(eventDir, 'variants', 'default.json'), buildVariant(event));
}

const ai100Category = findAi100Category();
if (!ai100Category) {
    throw new Error('Could not find BenchCouncil AI100 category in manage/catalog.js');
}

for (const eventId of ai100Category.events || []) {
    migrateEvent(eventId);
}

writeJson(path.join(STORYLINES_DIR, `${AI100_STORYLINE_ID}.json`), {
    id: AI100_STORYLINE_ID,
    title: ai100Category.storyline.name,
    events: ai100Category.events.map((eventId) => ({
        eventId,
        variantId: 'default'
    }))
});

console.log(`Migrated ${ai100Category.events.length} BenchCouncil AI100 events into archive/.`);
