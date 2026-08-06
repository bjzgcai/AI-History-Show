'use strict';

const fs = require('node:fs');
const path = require('node:path');

const FIGURES_RELATIVE_PATH = path.join('archive', 'figures', 'figures.json');

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function localizePair(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { zh: '', en: '' };
    return {
        zh: value.zh || value.en || '',
        en: value.en || value.zh || ''
    };
}

function localized(value, locale) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    return String(value[locale] || value[locale === 'en' ? 'zh' : 'en'] || '').trim();
}

function normalizeIdentityText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
        .trim();
}

function createFigureRegistry(figures, sourcePath = FIGURES_RELATIVE_PATH) {
    if (!Array.isArray(figures)) throw new Error(`${sourcePath} must contain an array.`);

    const byId = new Map();
    const identityCandidates = new Map();
    const avatarOwners = new Map();

    for (const figure of figures) {
        if (!figure || typeof figure !== 'object' || Array.isArray(figure)) {
            throw new Error(`${sourcePath} contains a non-object figure record.`);
        }
        const figureId = String(figure.id || '').trim();
        if (!figureId) throw new Error(`${sourcePath} contains a figure without an id.`);
        if (byId.has(figureId)) throw new Error(`${sourcePath} contains duplicate figure id: ${figureId}`);
        byId.set(figureId, cloneJson(figure));

        const identityValues = [
            figure.name && figure.name.en,
            figure.name && figure.name.zh,
            ...(Array.isArray(figure.aliases) ? figure.aliases : [])
        ];
        for (const value of identityValues) {
            const normalized = normalizeIdentityText(value);
            if (!normalized) continue;
            if (!identityCandidates.has(normalized)) identityCandidates.set(normalized, new Set());
            identityCandidates.get(normalized).add(figureId);
        }

        const avatarPath = figure.defaultAvatar && String(figure.defaultAvatar.path || '').trim();
        if (avatarPath) {
            if (!avatarOwners.has(avatarPath)) avatarOwners.set(avatarPath, []);
            avatarOwners.get(avatarPath).push(figureId);
        }
    }

    for (const [avatarPath, figureIds] of avatarOwners) {
        const personIds = figureIds.filter((figureId) => byId.get(figureId).type === 'person');
        if (personIds.length > 1) {
            throw new Error(
                `${sourcePath} assigns default avatar ${avatarPath} to multiple people: ${personIds.join(', ')}`
            );
        }
    }

    return {
        sourcePath,
        figures: figures.map(cloneJson),
        byId,
        identityCandidates,
        avatarOwners
    };
}

function loadFigureRegistry(root) {
    const filePath = path.join(root, FIGURES_RELATIVE_PATH);
    if (!fs.existsSync(filePath)) throw new Error(`Missing global figure registry: ${FIGURES_RELATIVE_PATH}`);
    return createFigureRegistry(JSON.parse(fs.readFileSync(filePath, 'utf8')), FIGURES_RELATIVE_PATH);
}

function relationObject(relation) {
    if (typeof relation === 'string') return { figureId: relation };
    return relation && typeof relation === 'object' && !Array.isArray(relation) ? relation : {};
}

function relationById(relations) {
    const result = new Map();
    for (const relationValue of Array.isArray(relations) ? relations : []) {
        const relation = relationObject(relationValue);
        if (relation.figureId) result.set(relation.figureId, relation);
    }
    return result;
}

function resolveAvatarStyle(variantRelation, eventRelation, fallback = '') {
    if (Object.hasOwn(variantRelation, 'avatarStyle')) return String(variantRelation.avatarStyle || '');
    if (Object.hasOwn(eventRelation, 'avatarStyle')) return String(eventRelation.avatarStyle || '');
    return fallback;
}

function resolveAvatar(figure, eventRelation, variantRelation, assetsById) {
    if (
        variantRelation.useDefaultAvatar === true ||
        (!variantRelation.avatarAssetId && eventRelation.useDefaultAvatar === true)
    ) {
        const defaultAvatar = figure.defaultAvatar || {};
        return {
            avatar: defaultAvatar.path || '',
            avatarStyle: resolveAvatarStyle(variantRelation, eventRelation, defaultAvatar.avatarStyle || '')
        };
    }
    const avatarAssetId = variantRelation.avatarAssetId || eventRelation.avatarAssetId || '';
    if (avatarAssetId) {
        const asset = assetsById.get(avatarAssetId);
        if (!asset) throw new Error(`Figure ${figure.id} references missing avatarAssetId: ${avatarAssetId}`);
        if (!Array.isArray(asset.figureIds) || !asset.figureIds.includes(figure.id)) {
            throw new Error(
                `Figure ${figure.id} avatarAssetId must reference an asset linked by figureIds: ${avatarAssetId}`
            );
        }
        return {
            avatar: asset.path || '',
            avatarStyle: resolveAvatarStyle(variantRelation, eventRelation)
        };
    }

    const defaultAvatar = figure.defaultAvatar || {};
    return {
        avatar: defaultAvatar.path || '',
        avatarStyle: resolveAvatarStyle(variantRelation, eventRelation, defaultAvatar.avatarStyle || '')
    };
}

function resolveFigureRelations({ eventFigures, variantFigures, assets, registry }) {
    const canonicalById = relationById(eventFigures);
    const selectedRelations = Array.isArray(variantFigures) ? variantFigures : eventFigures || [];
    const assetsById = new Map((Array.isArray(assets) ? assets : []).map((asset) => [asset.id, asset]));

    return selectedRelations.map((relationValue, index) => {
        const variantRelation = relationObject(relationValue);
        const figureId = String(variantRelation.figureId || '').trim();
        if (!figureId) throw new Error('Figure relation is missing figureId.');
        const figure = registry.byId.get(figureId);
        if (!figure) throw new Error(`Figure relation references missing figureId: ${figureId}`);
        const eventRelation = canonicalById.get(figureId) || {};
        const avatar = resolveAvatar(figure, eventRelation, variantRelation, assetsById);

        return {
            id: figure.id,
            name: localizePair(figure.name),
            role: localizePair(variantRelation.role || eventRelation.role),
            avatar: avatar.avatar,
            avatarStyle: avatar.avatarStyle,
            figureType: figure.type || 'person',
            organizationIds: Array.isArray(figure.organizationIds) ? [...figure.organizationIds] : [],
            primary:
                variantRelation.primary !== undefined
                    ? variantRelation.primary
                    : eventRelation.primary !== undefined
                      ? eventRelation.primary
                      : index === 0
        };
    });
}

module.exports = {
    FIGURES_RELATIVE_PATH,
    createFigureRegistry,
    loadFigureRegistry,
    localizePair,
    localized,
    normalizeIdentityText,
    resolveFigureRelations
};
