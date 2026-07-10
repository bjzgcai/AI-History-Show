// Compatibility adapter for canonical event fusion.
//
// Source of truth lives in archive/storyline-variants:
// - event-fusions.json models canonical event + storyline variants.
// - fusion-assets.json models media selection for fused outputs.
//
// The existing generator and review tooling still import this module, so it
// exposes the previous FUSIONS/applyEventFusion API while reading archive data.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_VARIANTS_DIR = path.join(ROOT, 'archive', 'storyline-variants');
const FUSION_CONFIG_PATH = path.join(ARCHIVE_VARIANTS_DIR, 'event-fusions.json');
const FUSION_ASSETS_PATH = path.join(ARCHIVE_VARIANTS_DIR, 'fusion-assets.json');

function readJson(file, fallback) {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function toLegacyFusion(entry) {
    const display = entry.display || {};
    const variants = entry.variants || {};
    return {
        canonical: entry.canonicalEventId,
        deep: variants['deep-learning'] && variants['deep-learning'].eventId,
        ai100: variants['bench-council-ai100'] && variants['bench-council-ai100'].eventId,
        year: display.year,
        title: display.title,
        location: display.location,
        description: display.description,
        figures: display.figures || [],
        mergePolicy: entry.mergePolicy || {}
    };
}

function normalizePattern(pattern) {
    if (pattern && typeof pattern === 'object' && pattern.regex) {
        return new RegExp(pattern.regex, pattern.flags || '');
    }
    return pattern;
}

const fusionArchive = readJson(FUSION_CONFIG_PATH, { fusions: [] });
const fusionAssetArchive = readJson(FUSION_ASSETS_PATH, { assets: {} });
const FUSIONS = (fusionArchive.fusions || []).map(toLegacyFusion);
const FUSION_ASSETS = Object.fromEntries(
    Object.entries(fusionAssetArchive.assets || {}).map(([canonical, config]) => [
        canonical,
        {
            images: config.images || [],
            excludeImages: config.excludeImages || [],
            excludeImagePatterns: (config.excludeImagePatterns || []).map(normalizePattern)
        }
    ])
);

const FUSION_BY_ID = new Map();
for (const fusion of FUSIONS) {
    for (const id of [fusion.deep, fusion.ai100, ...(fusion.ids || [])]) {
        if (id) FUSION_BY_ID.set(id, fusion);
    }
}

function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function localizedText(value) {
    if (value && typeof value === 'object') {
        return [value.en, value.zh].filter(Boolean).join(' ');
    }
    return String(value || '');
}

function normalizeKey(value) {
    return localizedText(value)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '')
        .trim();
}

function mergeUnique(primary, secondary, getKey = (item) => JSON.stringify(item)) {
    const result = [];
    const seen = new Set();
    for (const item of [...(primary || []), ...(secondary || [])]) {
        if (!item) continue;
        const key = getKey(item);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(clone(item));
    }
    return result;
}

function mergeFigures(deepFigures, ai100Figures) {
    return mergeUnique(deepFigures, ai100Figures, (figure) => normalizeKey(figure && figure.name));
}

function getFusionAssetConfig(fusion) {
    return (fusion && fusion.canonical && FUSION_ASSETS[fusion.canonical]) || {};
}

function makeImageExcluder(assetConfig) {
    const exact = new Set((assetConfig.excludeImages || []).map((url) => String(url || '').trim()).filter(Boolean));
    const patterns = (assetConfig.excludeImagePatterns || [])
        .map((pattern) => {
            if (pattern instanceof RegExp) return pattern;
            const text = String(pattern || '').trim();
            if (!text) return null;
            return {
                test: (url) => url.includes(text)
            };
        })
        .filter(Boolean);

    return (url) => {
        const value = String(url || '').trim();
        if (!value) return true;
        if (exact.has(value)) return true;
        return patterns.some((pattern) => pattern.test(value));
    };
}

function mergeImages(ai100, deep, fusion = {}) {
    const assetConfig = getFusionAssetConfig(fusion);
    const isExcluded = makeImageExcluder(assetConfig);
    const merged = assetConfig.images
        ? clone(assetConfig.images)
        : mergeUnique(ai100 && ai100.images, deep && deep.images, (url) => String(url || ''));
    return merged.filter((url) => !isExcluded(url));
}

function mergeImageMeta(ai100, deep, images) {
    const merged = {
        ...clone((deep && deep.imageMeta) || {}),
        ...clone((ai100 && ai100.imageMeta) || {})
    };
    const keep = new Set(images || []);
    return Object.fromEntries(Object.entries(merged).filter(([url]) => keep.has(url)));
}

function applyEventFusion(key, eventMap) {
    const fusion = FUSION_BY_ID.get(key);
    const current = eventMap[key];
    if (!fusion || !current) return clone(current);

    const deep = eventMap[fusion.deep] || {};
    const ai100 = eventMap[fusion.ai100] || {};
    const base = clone(ai100 && Object.keys(ai100).length ? ai100 : current);
    const achievement = clone(base.achievement || {});
    const images = mergeImages(ai100, deep, fusion);

    return {
        ...base,
        fusionCanonical: fusion.canonical,
        fusionQuoteKey: fusion.ai100,
        year: fusion.year != null ? fusion.year : base.year,
        title: clone(fusion.title || base.title),
        location: clone(fusion.location || base.location || deep.location || current.location),
        description: clone(fusion.description || base.description),
        figures: clone(fusion.figures || mergeFigures(deep.figures, ai100.figures || base.figures)),
        videos: Array.isArray(deep.videos) && deep.videos.length ? clone(deep.videos) : clone(base.videos || []),
        images,
        imageMeta: mergeImageMeta(ai100, deep, images),
        quoteText: clone(base.quoteText || base.quote || current.quoteText),
        quoteMeta: clone(base.quoteMeta || current.quoteMeta),
        quotePage: base.quotePage || current.quotePage || '',
        commentarySections: clone(base.commentarySections || current.commentarySections || []),
        achievement: {
            ...achievement,
            sources: clone((ai100.achievement && ai100.achievement.sources) || achievement.sources || []),
            visualModules: clone(
                (ai100.achievement && ai100.achievement.visualModules) || achievement.visualModules || []
            ),
            keyConcepts: clone((ai100.achievement && ai100.achievement.keyConcepts) || achievement.keyConcepts || []),
            demoImage: (ai100.achievement && ai100.achievement.demoImage) || achievement.demoImage
        }
    };
}

function getFusionCanonical(key) {
    const fusion = FUSION_BY_ID.get(key);
    return fusion ? fusion.canonical : key;
}

module.exports = {
    FUSIONS,
    applyEventFusion,
    getFusionCanonical
};
