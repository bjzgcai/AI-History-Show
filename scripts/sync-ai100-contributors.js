#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
    buildRegistry,
    contributorZh,
    findFigureCandidate,
    findPortraitCandidate,
    getSourceUrl,
    localized,
    namesMatch,
    readJson,
    slugName,
    splitContributors
} = require('./ai100-contributors');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'canonical-root-table-2026-07-30.json');
const STORYLINE_PATH = path.join(ROOT, 'archive', 'storylines', 'bench-council-ai100.json');

function writeJsonIfChanged(filePath, value) {
    const relativePath = path.relative(ROOT, filePath);
    let formatSource = '';
    try {
        formatSource = execFileSync('git', ['show', `HEAD:${relativePath}`], {
            cwd: ROOT,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
    } catch {
        formatSource = fs.readFileSync(filePath, 'utf8');
    }
    const indentSizes = formatSource
        .split('\n')
        .map((line) => (line.match(/^( +)\S/) || [null, ''])[1].length)
        .filter((size) => size > 0);
    const indent = indentSizes.length ? Math.min(...indentSizes) : 2;
    const next = `${JSON.stringify(value, null, indent)}\n`;
    if (fs.readFileSync(filePath, 'utf8') === next) return false;
    fs.writeFileSync(filePath, next);
    return true;
}

function uniqueId(base, existingIds) {
    let candidate = base;
    let suffix = 2;
    while (existingIds.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    existingIds.add(candidate);
    return candidate;
}

function isGeneratedContributorRole(role) {
    return (
        /\b(?:first )?listed contributor\b/i.test(localized(role, 'en')) ||
        /人物列表(?:首位|成员)/.test(localized(role, 'zh'))
    );
}

function normalizeFigure(name, work, publications, candidate, index) {
    const sourceFigure = candidate ? candidate.figure : {};
    const zh = contributorZh(name, localized(sourceFigure.name, 'zh'));
    if (!zh) throw new Error(`Missing Chinese contributor name for ${name}`);
    const hasPublication = Array.isArray(publications) && publications.length > 0;
    const fallbackRole = {
        en: index === 0 ? `${work} ${hasPublication ? 'lead author' : 'key contributor'}` : `${work} co-author`,
        zh: index === 0 ? `${work} ${hasPublication ? '主要作者' : '主要成员'}` : `${work} 共同作者`
    };
    const role = sourceFigure.role && !isGeneratedContributorRole(sourceFigure.role) ? sourceFigure.role : fallbackRole;
    return {
        ...(sourceFigure.figureId ? { figureId: sourceFigure.figureId } : {}),
        name: { en: name, zh },
        role,
        avatar: sourceFigure.avatar || '',
        avatarStyle: sourceFigure.avatarStyle || '',
        figureType: 'person',
        organizationIds: sourceFigure.organizationIds || []
    };
}

function clonePortraitIntoEvent({ work, figure, portrait, assets, sources }) {
    let asset = assets.find((item) => item.path === portrait.asset.path);
    const assetIds = new Set(assets.map((item) => item.id));
    const sourceIds = new Set(sources.map((item) => item.id));
    const personSlug = slugName(figure.name.en);
    const sourceUrl = getSourceUrl(portrait);
    let sourceId = asset && asset.sourceId;

    if (!asset && (!sourceId || !sources.some((source) => source.id === sourceId))) {
        sourceId = uniqueId(`source-ai100-contributor-${personSlug}`, sourceIds);
        const sourceTemplate = portrait.source || {};
        sources.push({
            ...sourceTemplate,
            id: sourceId,
            type: 'image-source',
            label: { en: 'Image source', zh: '图片来源' },
            title: {
                en: `${figure.name.en} portrait source`,
                zh: `${figure.name.zh}肖像来源`
            },
            url: sourceUrl,
            language: sourceTemplate.language || 'en',
            reliability: sourceTemplate.reliability || 'primary',
            notes: sourceTemplate.notes || {
                en: 'Portrait provenance reused from another Archive event.',
                zh: '复用自另一 Archive 事件的肖像来源信息。'
            },
            purpose: 'image-provenance'
        });
    }

    if (!asset) {
        asset = {
            ...portrait.asset,
            id: uniqueId(`asset-ai100-contributor-${personSlug}`, assetIds),
            path: portrait.asset.path,
            type: portrait.asset.type || 'image',
            usage: ['variant:bench-council-ai100'],
            editable: true
        };
        assets.push(asset);
    }

    if (String(asset.id || '').startsWith('asset-ai100-contributor-')) {
        asset.role = 'portrait';
        asset.caption = { en: `${figure.name.en} portrait`, zh: `${figure.name.zh}肖像` };
        asset.subcaption = {
            en: localized(figure.role, 'en'),
            zh: localized(figure.role, 'zh')
        };
        asset.sourceId = sourceId;
        asset.sourceUrl = sourceUrl;
        asset.displayUsage = {
            en: `Contributor portrait for the ${work} achievement page`,
            zh: `用于${work}成就页面的人物肖像`
        };
        asset.usage = [...new Set([...(asset.usage || []), 'variant:bench-council-ai100'])];
    }
    figure.avatar = asset.path;
    return { assetId: asset.id, sourceId, sourceUrl };
}

function syncItem(item, ref, registry) {
    const eventDir = path.join(ROOT, 'archive', 'events', item.eventId);
    const eventPath = path.join(eventDir, 'event.json');
    const assetsPath = path.join(eventDir, 'assets.json');
    const sourcesPath = path.join(eventDir, 'sources.json');
    const variantPath = path.join(eventDir, 'variants', `${ref.variant}.json`);
    const event = readJson(eventPath);
    const assets = readJson(assetsPath);
    const sources = readJson(sourcesPath);
    const variant = readJson(variantPath);
    const generatedAssetIds = new Set(
        assets.filter((asset) => String(asset.id || '').startsWith('asset-ai100-contributor-')).map((asset) => asset.id)
    );
    const generatedSourceIds = new Set(
        sources
            .filter((source) => String(source.id || '').startsWith('source-ai100-contributor-'))
            .map((source) => source.id)
    );
    for (let index = assets.length - 1; index >= 0; index -= 1) {
        if (generatedAssetIds.has(assets[index].id)) assets.splice(index, 1);
    }
    for (let index = sources.length - 1; index >= 0; index -= 1) {
        if (generatedSourceIds.has(sources[index].id)) sources.splice(index, 1);
    }
    variant.assetIds = (variant.assetIds || []).filter(
        (id) => !generatedAssetIds.has(id) && !String(id || '').startsWith('asset-ai100-contributor-')
    );
    variant.sourceIds = (variant.sourceIds || []).filter(
        (id) => !generatedSourceIds.has(id) && !String(id || '').startsWith('source-ai100-contributor-')
    );
    const expectedNames = splitContributors(item.contributors);
    const currentFigures = [...(variant.figures || []), ...(event.figures || [])];
    const expectedFigures = expectedNames.map((name, index) => {
        const localCandidate = currentFigures.find(
            (figure) => figure.name && namesMatch(name, localized(figure.name, 'en'))
        );
        const candidate = localCandidate
            ? { eventId: item.eventId, figure: localCandidate }
            : findFigureCandidate(name, registry, item.eventId);
        const figure = normalizeFigure(name, item.work, item.publications, candidate, index);
        const portrait = findPortraitCandidate(name, registry, item.eventId);
        figure.avatar = portrait ? portrait.asset.path : '';
        return figure;
    });

    const extras = (variant.figures || []).filter((figure) => {
        const name = localized(figure.name, 'en');
        return !name || !expectedNames.some((expected) => namesMatch(expected, name));
    });
    const finalFigures = [...expectedFigures, ...extras];

    let selectedPortrait = null;
    for (const figure of expectedFigures) {
        const portrait = findPortraitCandidate(figure.name.en, registry, item.eventId);
        if (!portrait) continue;
        selectedPortrait = clonePortraitIntoEvent({
            work: item.work,
            figure,
            portrait,
            assets,
            sources
        });
        break;
    }

    if (selectedPortrait) {
        const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
        const currentIds = (variant.assetIds || []).filter(
            (id) => id !== selectedPortrait.assetId && !/^https?:\/\//i.test(String(assetMap.get(id)?.path || ''))
        );
        const isPortraitAsset = (id) => {
            const asset = assetMap.get(id) || {};
            return (
                /portrait|hero-image/i.test(String(asset.role || '')) ||
                /portrait/i.test(localized(asset.caption, 'en')) ||
                /肖像/.test(localized(asset.caption, 'zh'))
            );
        };
        const nonPortraitIds = currentIds.filter((id) => !isPortraitAsset(id));
        const portraitIds = currentIds.filter((id) => isPortraitAsset(id));
        variant.assetIds = [selectedPortrait.assetId, ...nonPortraitIds, ...portraitIds];
        const selectedSourceIds = (variant.sourceIds || []).filter((id) => id !== selectedPortrait.sourceId);
        const isLocalPortraitSource = /^(?:\.\/)?resources\//i.test(selectedPortrait.sourceUrl);
        variant.sourceIds = isLocalPortraitSource
            ? selectedSourceIds
            : [...new Set([...selectedSourceIds, selectedPortrait.sourceId].filter(Boolean))];
    } else {
        const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
        variant.assetIds = (variant.assetIds || []).filter(
            (id) => !/^https?:\/\//i.test(String(assetMap.get(id)?.path || ''))
        );
    }

    for (const asset of assets) {
        if (!isGeneratedContributorRole(asset.subcaption)) continue;
        const figure = finalFigures.find((candidate) => candidate.avatar && candidate.avatar === asset.path);
        if (!figure) continue;
        asset.subcaption = {
            en: localized(figure.role, 'en'),
            zh: localized(figure.role, 'zh')
        };
    }

    event.figures = finalFigures;
    variant.figures = finalFigures;
    const changed = [
        writeJsonIfChanged(eventPath, event),
        writeJsonIfChanged(assetsPath, assets),
        writeJsonIfChanged(sourcesPath, sources),
        writeJsonIfChanged(variantPath, variant)
    ].filter(Boolean).length;
    return changed;
}

function main() {
    const catalog = readJson(CATALOG_PATH);
    const storyline = readJson(STORYLINE_PATH);
    const refs = new Map(storyline.events.filter((item) => item.enabled !== false).map((item) => [item.eventId, item]));
    const contributorNames = [...new Set(catalog.items.flatMap((item) => splitContributors(item.contributors)))];
    const registry = buildRegistry(ROOT, contributorNames);
    let changedFiles = 0;

    for (const item of catalog.items) {
        const ref = refs.get(item.eventId);
        if (!ref) throw new Error(`Missing storyline entry for ${item.eventId}`);
        changedFiles += syncItem(item, ref, registry);
    }

    console.log(
        `AI100 contributor sync complete: ${catalog.items.length} achievements, ${changedFiles} file(s) updated.`
    );
}

if (require.main === module) main();
