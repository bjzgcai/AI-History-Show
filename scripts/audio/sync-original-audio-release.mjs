#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const { orderVariantAssetIds } = require('../event-figure-rules');
const { loadFigureRegistry, resolveFigureRelations } = require('../figure-registry');
const BUCKET = 'ai-history';
const PUBLIC_ROOT = 'https://s3.inner.bza.edu.cn/innovation%3Aai-history';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PREFERRED_STORYLINE_ID = 'bench-council-ai100';
const RELEASES = [
    {
        storylineId: 'humanistic-cycle',
        overlays: {
            zh: 'resources/audio/generated/remaining-storylines-original-v1/humanistic-cycle-storyline-zh-original-v1-2026-08-09/overlay.json',
            en: 'resources/audio/generated/remaining-storylines-original-v1/humanistic-cycle-storyline-en-original-v1-2026-08-09/overlay.json'
        }
    },
    {
        storylineId: 'deep-learning',
        overlays: {
            zh: 'resources/audio/generated/remaining-storylines-original-v1/deep-learning-remaining-storyline-zh-original-v1-2026-08-09/overlay.json',
            en: 'resources/audio/generated/remaining-storylines-original-v1/deep-learning-remaining-storyline-en-original-v1-2026-08-09/overlay.json'
        }
    },
    {
        storylineId: 'gaming-ai',
        overlays: {
            zh: 'resources/audio/generated/ai100-and-gaming-original-v1/gaming-all-storyline-zh-original-v1-2026-08-09/overlay.json',
            en: 'resources/audio/generated/ai100-and-gaming-original-v1/gaming-all-storyline-en-original-v1-2026-08-09/overlay.json'
        }
    },
    {
        storylineId: PREFERRED_STORYLINE_ID,
        overlays: {
            zh: 'resources/audio/generated/ai100-and-gaming-original-v1/ai100-remaining-storyline-zh-original-v1-2026-08-09/overlay.json',
            en: 'resources/audio/generated/ai100-and-gaming-original-v1/ai100-remaining-storyline-en-original-v1-2026-08-09/overlay.json'
        }
    }
];

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function appendJsonArrayItems(relativePath, items) {
    if (!items.length) return;
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    const closingIndex = source.lastIndexOf(']');
    if (closingIndex < 0) throw new Error(`${relativePath} is not a JSON array`);
    const prefix = source.slice(0, closingIndex).replace(/\s*$/, '');
    const indent = source.match(/\n([ \t]+)\{/)?.[1] || '  ';
    const blocks = items.map((item) =>
        JSON.stringify(item, null, 2)
            .split('\n')
            .map((line) => `${indent}${line}`)
            .join('\n')
    );
    const separator = JSON.parse(source).length ? ',' : '';
    fs.writeFileSync(
        absolutePath,
        `${prefix}${separator}\n${blocks.join(',\n')}\n${source.slice(closingIndex)}`,
        'utf8'
    );
}

function replaceJsonArrayItem(relativePath, item) {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    let arrayDepth = 0;
    let objectDepth = 0;
    let objectStart = -1;
    let inString = false;

    for (let index = 0; index < source.length; index += 1) {
        const character = source[index];
        if (inString) {
            if (character === '\\') index += 1;
            else if (character === '"') inString = false;
            continue;
        }
        if (character === '"') {
            inString = true;
            continue;
        }
        if (character === '[') arrayDepth += 1;
        else if (character === ']') arrayDepth -= 1;
        else if (character === '{') {
            if (arrayDepth === 1 && objectDepth === 0) objectStart = index;
            objectDepth += 1;
        } else if (character === '}') {
            objectDepth -= 1;
            if (objectDepth !== 0 || objectStart < 0) continue;
            const objectEnd = index + 1;
            const candidate = JSON.parse(source.slice(objectStart, objectEnd));
            if (candidate.id !== item.id) {
                objectStart = -1;
                continue;
            }
            const lineStart = source.lastIndexOf('\n', objectStart - 1) + 1;
            const indent = source.slice(lineStart, objectStart);
            const replacement = JSON.stringify(item, null, 2)
                .split('\n')
                .map((line, lineIndex) => (lineIndex === 0 ? line : `${indent}${line}`))
                .join('\n');
            fs.writeFileSync(
                absolutePath,
                `${source.slice(0, objectStart)}${replacement}${source.slice(objectEnd)}`,
                'utf8'
            );
            return;
        }
    }
    throw new Error(`${relativePath} is missing JSON array item ${item.id}`);
}

function findJsonValueEnd(source, startIndex) {
    const opening = source[startIndex];
    const closing = opening === '[' ? ']' : opening === '{' ? '}' : '';
    if (!closing) throw new Error(`Unsupported JSON value at offset ${startIndex}`);
    let depth = 0;
    let inString = false;
    for (let index = startIndex; index < source.length; index += 1) {
        const character = source[index];
        if (inString) {
            if (character === '\\') index += 1;
            else if (character === '"') inString = false;
            continue;
        }
        if (character === '"') inString = true;
        else if (character === opening) depth += 1;
        else if (character === closing && --depth === 0) return index + 1;
    }
    throw new Error(`Unable to find JSON value end at offset ${startIndex}`);
}

function replaceTopLevelArray(relativePath, propertyName, value) {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    const pattern = new RegExp(`^([ \\t]*)"${propertyName}"[ \\t]*:[ \\t]*`, 'm');
    const match = pattern.exec(source);
    if (!match) throw new Error(`${relativePath} is missing ${propertyName}`);
    const valueStart = match.index + match[0].length;
    const valueEnd = findJsonValueEnd(source, valueStart);
    const indent = match[1];
    const replacement = JSON.stringify(value, null, 2)
        .split('\n')
        .map((line, index) => (index === 0 ? line : `${indent}${line}`))
        .join('\n');
    fs.writeFileSync(absolutePath, `${source.slice(0, valueStart)}${replacement}${source.slice(valueEnd)}`, 'utf8');
}

function objectKey(eventId, locale) {
    return `audio/releases/${eventId}-${locale === 'zh' ? 'zh-original-v1' : 'en-v1'}.mp3`;
}

function assetId(eventId, locale) {
    return `asset-${eventId}-audio-${locale === 'zh' ? 'zh-original-v1' : 'en-v1'}`;
}

function loadStorylineMemberships() {
    const memberships = new Map();
    for (const { storylineId } of RELEASES) {
        const storyline = readJson(`archive/storylines/${storylineId}.json`);
        const entries = storyline.events
            .filter((entry) => entry.enabled !== false)
            .sort((left, right) => left.order - right.order);
        for (const entry of entries) {
            const variants = memberships.get(entry.eventId) || new Map();
            variants.set(storylineId, entry.variant);
            memberships.set(entry.eventId, variants);
        }
    }
    return memberships;
}

function loadReleaseSources() {
    const selected = new Map();
    const collisions = new Map();
    for (const { storylineId, overlays } of RELEASES) {
        for (const locale of ['zh', 'en']) {
            const overlay = readJson(overlays[locale]);
            for (const audio of overlay.assets) {
                const event = selected.get(audio.eventId) || {
                    eventId: audio.eventId,
                    sourceStorylineId: storylineId,
                    sourceStorylineIds: new Set()
                };
                event.sourceStorylineIds.add(storylineId);
                if (event.sourceStorylineId !== storylineId) {
                    const prior = collisions.get(audio.eventId) || new Set([event.sourceStorylineId]);
                    prior.add(storylineId);
                    collisions.set(audio.eventId, prior);
                    event.sourceStorylineId = storylineId;
                    event.zh = undefined;
                    event.en = undefined;
                }
                event[locale] = audio;
                selected.set(audio.eventId, event);
            }
        }
    }
    return { selected, collisions };
}

function createAudioAsset({ eventId, locale, sourcePath, sourceId, variantIds }) {
    const key = objectKey(eventId, locale);
    const isChinese = locale === 'zh';
    return {
        id: assetId(eventId, locale),
        type: 'audio',
        path: `${PUBLIC_ROOT}/${key}`,
        role: 'audio-narration',
        caption: {
            zh: `${eventId} ${isChinese ? '中文原版' : '英文'}科普音频`,
            en: `${eventId} ${isChinese ? 'original Chinese' : 'English'} audio narration`
        },
        subcaption: {
            zh: isChinese ? '中文原版科普讲述，供中文页面播放。' : '英文原版科普讲述，供英文页面播放。',
            en: isChinese
                ? 'Original Chinese science narration used on the Chinese page.'
                : 'Original English science narration used on the English page.'
        },
        sourceId,
        rights: {
            status: 'project-produced',
            license: {
                zh: '本项目使用已授权语音合成服务制作。',
                en: 'Produced by this project with an authorized text-to-speech service.'
            },
            usage: {
                zh: '用于本展览的事件科普音频播放。',
                en: 'Used for event narration in this exhibition.'
            }
        },
        language: locale,
        deliveryUrl: `${PUBLIC_ROOT}/${key}`,
        storage: {
            provider: 'bza-s3',
            bucket: BUCKET,
            objectKey: key,
            sourcePath,
            contentType: 'audio/mpeg',
            cacheControl: CACHE_CONTROL
        },
        usage: variantIds.map((variantId) => `variant:${variantId}`),
        editable: true
    };
}

function withoutUsage(asset) {
    const { usage: _usage, ...rest } = asset;
    return rest;
}

function upsertAsset(assets, asset, eventId) {
    const index = assets.findIndex((candidate) => candidate.id === asset.id);
    if (index < 0) {
        assets.push(asset);
        return 'added';
    }
    if (JSON.stringify(assets[index]) === JSON.stringify(asset)) return 'unchanged';
    if (JSON.stringify(withoutUsage(assets[index])) !== JSON.stringify(withoutUsage(asset))) {
        throw new Error(`${eventId} already has conflicting audio asset ${asset.id}`);
    }
    assets[index] = asset;
    return 'updated';
}

async function main() {
    const apply = process.argv.includes('--apply');
    const linkSharedVariants = process.argv.includes('--link-shared-variants');
    const memberships = loadStorylineMemberships();
    const { selected, collisions } = loadReleaseSources();
    const figureRegistry = loadFigureRegistry(ROOT);
    const plannedAssetAppends = [];
    const plannedAssetUpdates = [];
    const plannedVariantWrites = [];
    let managedAssetCount = 0;

    for (const event of [...selected.values()].sort((left, right) => left.eventId.localeCompare(right.eventId))) {
        if (!event.zh || !event.en) throw new Error(`${event.eventId} is missing a zh or en generated audio source`);
        const variantMemberships = memberships.get(event.eventId);
        if (!variantMemberships?.size) throw new Error(`${event.eventId} is not selected by a target storyline`);
        const eventDirectory = `archive/events/${event.eventId}`;
        const canonicalEvent = readJson(`${eventDirectory}/event.json`);
        const assetsPath = `${eventDirectory}/assets.json`;
        const sources = readJson(`${eventDirectory}/sources.json`);
        const assets = readJson(assetsPath);
        const sourceVariantEntries = [...variantMemberships.entries()].filter(([storylineId]) =>
            event.sourceStorylineIds.has(storylineId)
        );
        const linkedVariantEntries = linkSharedVariants ? [...variantMemberships.entries()] : sourceVariantEntries;
        const linkedVariantIds = [...new Set(linkedVariantEntries.map(([, variantId]) => variantId))];
        const sourceVariantIds = [...new Set(sourceVariantEntries.map(([, variantId]) => variantId))];
        const primaryVariantId = variantMemberships.get(event.sourceStorylineId) || sourceVariantIds[0];
        const primaryVariant = readJson(`${eventDirectory}/variants/${primaryVariantId}.json`);
        const sourceId =
            primaryVariant.sourceIds?.find((id) => sources.some((source) => source.id === id)) || sources[0]?.id;
        if (!sourceId) throw new Error(`${event.eventId} has no source available for audio provenance`);

        const newAssets = [];
        const updatedAssets = [];
        for (const locale of ['zh', 'en']) {
            const audio = event[locale];
            const sourcePath = audio.audio.path;
            const absoluteSourcePath = path.join(ROOT, sourcePath);
            if (!fs.existsSync(absoluteSourcePath)) throw new Error(`Missing generated audio: ${sourcePath}`);
            const asset = createAudioAsset({
                eventId: event.eventId,
                locale,
                sourcePath,
                sourceId,
                variantIds: linkSharedVariants ? linkedVariantIds : sourceVariantIds
            });
            const action = upsertAsset(assets, asset, event.eventId);
            if (action === 'added') newAssets.push(asset);
            else if (action === 'updated') updatedAssets.push(asset);
            managedAssetCount += 1;
        }
        if (newAssets.length) plannedAssetAppends.push([assetsPath, newAssets]);
        for (const asset of updatedAssets) plannedAssetUpdates.push([assetsPath, asset]);

        for (const variantId of linkedVariantIds) {
            const variantPath = `${eventDirectory}/variants/${variantId}.json`;
            const variant = readJson(variantPath);
            variant.assetIds ||= [];
            for (const locale of ['zh', 'en']) {
                const id = assetId(event.eventId, locale);
                if (!variant.assetIds.includes(id)) variant.assetIds.push(id);
            }
            const resolvedFigures = resolveFigureRelations({
                eventFigures: canonicalEvent.figures,
                variantFigures: variant.figures,
                assets,
                registry: figureRegistry
            });
            const orderedAssetIds = orderVariantAssetIds(canonicalEvent, variant, assets, resolvedFigures).assetIds;
            if (JSON.stringify(variant.assetIds) !== JSON.stringify(orderedAssetIds)) {
                plannedVariantWrites.push([variantPath, orderedAssetIds]);
            }
        }
    }

    if (apply) {
        for (const [relativePath, asset] of plannedAssetUpdates) replaceJsonArrayItem(relativePath, asset);
        for (const [relativePath, items] of plannedAssetAppends) appendJsonArrayItems(relativePath, items);
        for (const [relativePath, assetIds] of plannedVariantWrites)
            replaceTopLevelArray(relativePath, 'assetIds', assetIds);
    }

    console.log(
        `Managed ${selected.size} release event(s) and ${managedAssetCount} audio asset(s): ` +
            `${apply ? 'applied' : 'planned'} ${plannedAssetAppends.reduce((sum, [, items]) => sum + items.length, 0)} ` +
            `asset addition(s), ${plannedAssetUpdates.length} metadata update(s), and ` +
            `${plannedVariantWrites.length} variant update(s).`
    );
    if (linkSharedVariants) console.log('Shared-event audio IDs are linked across all enabled storyline variants.');
    console.log(
        `${collisions.size} overlapping event(s) use ${PREFERRED_STORYLINE_ID} as the release source: ` +
            `${[...collisions.keys()].sort().join(', ')}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
