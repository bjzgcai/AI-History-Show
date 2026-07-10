// Compatibility adapter for fused event media selection.
// Source of truth: archive/storyline-variants/fusion-assets.json

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FUSION_ASSETS_PATH = path.join(ROOT, 'archive', 'storyline-variants', 'fusion-assets.json');

function normalizePattern(pattern) {
    if (pattern && typeof pattern === 'object' && pattern.regex) {
        return new RegExp(pattern.regex, pattern.flags || '');
    }
    return pattern;
}

function loadFusionAssets() {
    if (!fs.existsSync(FUSION_ASSETS_PATH)) return {};
    const archive = JSON.parse(fs.readFileSync(FUSION_ASSETS_PATH, 'utf8'));
    return Object.fromEntries(
        Object.entries(archive.assets || {}).map(([canonical, config]) => [
            canonical,
            {
                images: config.images || [],
                excludeImages: config.excludeImages || [],
                excludeImagePatterns: (config.excludeImagePatterns || []).map(normalizePattern)
            }
        ])
    );
}

module.exports = loadFusionAssets();
