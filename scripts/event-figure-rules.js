'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { namesMatch, splitContributors } = require('./ai100-contributors');
const { isAssetSelectionExcluded } = require('./asset-selection-review');
const eventMediaSelection = require('../shared/event-media-selection');

const STORYLINE_ID = 'bench-council-ai100';
const CATALOG_PATH = path.join(
    __dirname,
    '..',
    'research',
    'benchcouncil-ai100',
    'canonical-root-table-2026-07-30.json'
);

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function localized(value, locale) {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';
    return String(value[locale] || value.en || value.zh || '').trim();
}

function humanizeFigureId(value) {
    return String(value || '')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function figureNameCandidates(figure) {
    if (!figure || typeof figure !== 'object') return [];
    return [localized(figure.name, 'en'), localized(figure.name, 'zh'), humanizeFigureId(figure.figureId)]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
}

function normalizedNameTokens(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
        .trim()
        .split(' ')
        .filter((token) => token.length > 1);
}

function mergeFigures(eventFigures, variantFigures) {
    const canonical = Array.isArray(eventFigures) ? eventFigures : [];
    const presentation = Array.isArray(variantFigures) ? variantFigures : [];
    const length = Math.max(canonical.length, presentation.length);
    return Array.from({ length }, (_, index) => ({
        ...(canonical[index] && typeof canonical[index] === 'object' ? canonical[index] : {}),
        ...(presentation[index] && typeof presentation[index] === 'object' ? presentation[index] : {})
    }));
}

function isPersonAsset(asset) {
    const text = [
        asset && asset.role,
        asset && asset.path,
        localized(asset && asset.caption, 'en'),
        localized(asset && asset.caption, 'zh'),
        localized(asset && asset.subcaption, 'en'),
        localized(asset && asset.subcaption, 'zh')
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (/not a portrait|不是人物肖像/.test(text)) return false;
    return /portrait|headshot|person-photo|people-photo|author-photo|team-photo|肖像|人物照|人物照片|人物图|照片|演讲资料照|speaking/.test(
        text
    );
}

function isGroupPersonAsset(asset) {
    const text = [
        localized(asset && asset.role, 'en'),
        localized(asset && asset.role, 'zh'),
        localized(asset && asset.caption, 'en'),
        localized(asset && asset.caption, 'zh'),
        localized(asset && asset.subcaption, 'en'),
        localized(asset && asset.subcaption, 'zh')
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return /team|group|author group|researchers behind|团队|作者团队|研究团队|研究者群体/.test(text);
}

function isGenericOrganizationAsset(asset) {
    const text = [
        asset && asset.path,
        localized(asset && asset.role, 'en'),
        localized(asset && asset.role, 'zh'),
        localized(asset && asset.caption, 'en'),
        localized(asset && asset.caption, 'zh')
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return /research-institution\.png|institution(?:s)? icon|organization icon|机构图标|组织图标/.test(text);
}

function assetMatchesFigure(asset, figure) {
    if (!asset || !figure) return false;
    if (figure.avatar && figure.avatar === asset.path) return true;
    const text = [
        asset.path,
        localized(asset.caption, 'en'),
        localized(asset.caption, 'zh'),
        localized(asset.subcaption, 'en'),
        localized(asset.subcaption, 'zh')
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    const normalizedAssetTokens = new Set(normalizedNameTokens(text));
    return figureNameCandidates(figure).some((name) => {
        if (text.includes(name)) return true;
        const tokens = normalizedNameTokens(name);
        return tokens.length > 1 && tokens.every((token) => normalizedAssetTokens.has(token));
    });
}

function isPrimaryFigure(figure, index) {
    if (index === 0) return true;
    const role = [localized(figure && figure.role, 'en'), localized(figure && figure.role, 'zh')]
        .join(' ')
        .toLowerCase();
    if (/related|supporting|context|historian|commentator|相关|背景|辅助/.test(role)) return false;
    return /lead|first author|project leader|creator|co-author|author|co-developer|developer|inventor|founder|principal|主要|第一作者|项目负责人|推动者|提出者|共同作者|作者|共同开发|开发者|发明者|创始人/.test(
        role
    );
}

function findPrimaryPersonAsset(selectedAssets, figures) {
    const primaryFigures = figures.filter((figure, index) => isPrimaryFigure(figure, index));
    const matchedAsset = selectedAssets.find(
        (asset) =>
            !isGenericOrganizationAsset(asset) &&
            primaryFigures.some(
                (figure) =>
                    (figure.avatar && figure.avatar === asset.path) ||
                    ((isPersonAsset(asset) || asset.role === 'hero-image') && assetMatchesFigure(asset, figure))
            )
    );
    if (matchedAsset) return matchedAsset;
    return selectedAssets.find((asset) => !isGenericOrganizationAsset(asset) && isGroupPersonAsset(asset)) || null;
}

function isArchitectureAsset(asset) {
    const role = String(asset && asset.role ? asset.role : '').trim();
    const assetPath = String(asset && asset.path ? asset.path : '').trim();
    if (eventMediaSelection.isExplanationRole(role)) return false;
    return eventMediaSelection.isArchitectureRole(role) || /(?:^|\/)architecture(?:\/|$)/i.test(assetPath);
}

function isExplanationAsset(asset) {
    const role = String(asset && asset.role ? asset.role : '').trim();
    const assetPath = String(asset && asset.path ? asset.path : '').trim();
    if (isArchitectureAsset(asset)) return false;
    return (
        eventMediaSelection.isExplanationRole(role) ||
        /(?:^|\/)explainers(?:\/|$)|diagram|flow|pipeline/i.test(assetPath)
    );
}

function isFigurePersonAsset(asset, figures) {
    if (!asset || isGenericOrganizationAsset(asset)) return false;
    return (Array.isArray(figures) ? figures : []).some(
        (figure) =>
            (figure.avatar && figure.avatar === asset.path) ||
            ((isPersonAsset(asset) || asset.role === 'hero-image') && assetMatchesFigure(asset, figure))
    );
}

function isSupportingFigurePersonAsset(asset, figures) {
    if (!asset || isGenericOrganizationAsset(asset)) return false;
    return (Array.isArray(figures) ? figures : []).some(
        (figure, index) =>
            !isPrimaryFigure(figure, index) &&
            ((figure.avatar && figure.avatar === asset.path) ||
                ((isPersonAsset(asset) || asset.role === 'hero-image') && assetMatchesFigure(asset, figure)))
    );
}

function isPersonDisplayAsset(event, variant, asset) {
    if (!asset || isGenericOrganizationAsset(asset)) return false;
    const figures = mergeFigures(event && event.figures, variant && variant.figures);
    return isPersonAsset(asset) || isFigurePersonAsset(asset, figures);
}

function orderVariantAssetIds(event, variant, assets) {
    const assetsById = new Map((Array.isArray(assets) ? assets : []).map((asset) => [asset.id, asset]));
    const entries = (Array.isArray(variant && variant.assetIds) ? variant.assetIds : []).map((assetId, index) => ({
        assetId,
        asset: assetsById.get(assetId) || null,
        index
    }));
    const figures = mergeFigures(event && event.figures, variant && variant.figures);
    const primaryAsset = findPrimaryPersonAsset(entries.map((entry) => entry.asset).filter(Boolean), figures);

    const groupFor = (entry) => {
        if (primaryAsset && entry.asset === primaryAsset) return 0;
        if (isArchitectureAsset(entry.asset)) return 1;
        if (isPersonAsset(entry.asset) || isFigurePersonAsset(entry.asset, figures)) {
            return isSupportingFigurePersonAsset(entry.asset, figures) ? 3 : 2;
        }
        if (isExplanationAsset(entry.asset)) return 4;
        return 3;
    };

    return {
        assetIds: entries
            .slice()
            .sort((left, right) => groupFor(left) - groupFor(right) || left.index - right.index)
            .map((entry) => entry.assetId),
        primaryAssetId: primaryAsset ? primaryAsset.id : ''
    };
}

function firstImageAsset(variant, assetsById) {
    const overviewId = String(variant && variant.overviewImageAssetId ? variant.overviewImageAssetId : '').trim();
    if (overviewId) return { asset: assetsById.get(overviewId), source: 'overviewImageAssetId', assetId: overviewId };
    const selected = Array.isArray(variant && variant.assetIds) ? variant.assetIds : [];
    for (const assetId of selected) {
        const asset = assetsById.get(assetId);
        if (asset && ['image', 'svg', 'gif'].includes(asset.type)) {
            return { asset, source: 'assetIds[0]', assetId };
        }
    }
    return { asset: null, source: 'assetIds[0]', assetId: '' };
}

function loadCanonicalCatalog() {
    if (!fs.existsSync(CATALOG_PATH)) return new Map();
    const catalog = readJson(CATALOG_PATH);
    return new Map((catalog.items || []).map((item) => [item.eventId, splitContributors(item.contributors)]));
}

function auditVariant({ eventId, event, variant, assets, catalog }) {
    const assetsById = new Map((Array.isArray(assets) ? assets : []).map((asset) => [asset.id, asset]));
    const figures = mergeFigures(event.figures, variant.figures);
    const issues = [];
    const first = firstImageAsset(variant, assetsById);
    const ai100Contributors = variant.storylineId === STORYLINE_ID ? catalog.get(eventId) || [] : [];
    const excludedAssetIds = (variant.assetIds || []).filter((assetId) =>
        isAssetSelectionExcluded(assetsById.get(assetId))
    );
    const orderedAssets = orderVariantAssetIds(event, variant, assets);
    const overviewAsset = variant.overviewImageAssetId ? assetsById.get(variant.overviewImageAssetId) || null : null;

    if (excludedAssetIds.length > 0) {
        issues.push(`selected assets are explicitly excluded from variants: ${excludedAssetIds.join(', ')}`);
    }

    if (JSON.stringify(variant.assetIds || []) !== JSON.stringify(orderedAssets.assetIds)) {
        issues.push(
            `assetIds must follow primary person, architecture, other people, supporting media, and explanation order: ${orderedAssets.assetIds.join(', ')}`
        );
    }

    if (
        orderedAssets.primaryAssetId &&
        variant.overviewImageAssetId &&
        variant.overviewImageAssetId !== orderedAssets.primaryAssetId &&
        isPersonDisplayAsset(event, variant, overviewAsset)
    ) {
        issues.push(`overviewImageAssetId must use the primary person asset: ${orderedAssets.primaryAssetId}`);
    }

    if (!first.asset) {
        issues.push('first image/home image is missing from selected assets');
    } else if (isPersonAsset(first.asset)) {
        const matchingIndexes = figures
            .map((figure, index) => (assetMatchesFigure(first.asset, figure) ? index : -1))
            .filter((index) => index >= 0);

        if (isGroupPersonAsset(first.asset)) {
            // A documented author/research team photo represents the event's primary people collectively.
        } else if (ai100Contributors.length > 0) {
            const expectedPrefix = figures.slice(0, ai100Contributors.length);
            const matchesOfficialContributor = matchingIndexes.some((index) =>
                expectedPrefix.some(
                    (figure, prefixIndex) =>
                        index === prefixIndex &&
                        namesMatch(ai100Contributors[prefixIndex], localized(figure.name, 'en'))
                )
            );
            if (!matchesOfficialContributor) {
                issues.push(
                    'first person image must identify a BenchCouncil-listed contributor in the leading figure prefix'
                );
            }
        } else if (!matchingIndexes.some((index) => isPrimaryFigure(figures[index], index))) {
            issues.push("first person image must identify the event's primary figure");
        }
    }

    if (ai100Contributors.length > 0) {
        for (let index = 0; index < ai100Contributors.length; index += 1) {
            const figure = figures[index];
            const actualName = localized(figure && figure.name, 'en');
            if (!figure || !namesMatch(ai100Contributors[index], actualName)) {
                issues.push(
                    `figure ${index + 1} must preserve the BenchCouncil contributor prefix: ${ai100Contributors[index]}`
                );
            }
            if (!/[\u3400-\u9fff]/.test(localized(figure && figure.name, 'zh'))) {
                issues.push(`figure ${index + 1} is missing a Chinese display name: ${ai100Contributors[index]}`);
            }
        }
    }

    return {
        eventId,
        variantId: variant.storylineId || '',
        firstImage: first.asset
            ? { assetId: first.assetId, path: first.asset.path, role: first.asset.role || '', source: first.source }
            : { assetId: first.assetId, path: '', role: '', source: first.source },
        issues
    };
}

function auditArchive(root) {
    const eventsDir = path.join(root, 'archive', 'events');
    const catalog = loadCanonicalCatalog();
    const results = [];
    if (!fs.existsSync(eventsDir)) return results;
    for (const eventId of fs.readdirSync(eventsDir).sort()) {
        const eventDir = path.join(eventsDir, eventId);
        const eventFile = path.join(eventDir, 'event.json');
        const assetsFile = path.join(eventDir, 'assets.json');
        const variantsDir = path.join(eventDir, 'variants');
        if (!fs.existsSync(eventFile) || !fs.existsSync(assetsFile) || !fs.existsSync(variantsDir)) continue;
        const event = readJson(eventFile);
        const assets = readJson(assetsFile);
        for (const fileName of fs
            .readdirSync(variantsDir)
            .filter((file) => file.endsWith('.json'))
            .sort()) {
            const variant = readJson(path.join(variantsDir, fileName));
            results.push({
                file: path.relative(root, path.join(variantsDir, fileName)).replace(/\\/g, '/'),
                ...auditVariant({ eventId, event, variant, assets, catalog })
            });
        }
    }
    return results;
}

module.exports = {
    auditArchive,
    auditVariant,
    assetMatchesFigure,
    isArchitectureAsset,
    isAssetSelectionExcluded,
    isExplanationAsset,
    isFigurePersonAsset,
    isGenericOrganizationAsset,
    isPersonDisplayAsset,
    isPersonAsset,
    isGroupPersonAsset,
    isPrimaryFigure,
    mergeFigures,
    orderVariantAssetIds
};
