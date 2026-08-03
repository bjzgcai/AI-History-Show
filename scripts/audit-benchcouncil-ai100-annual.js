#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const STORYLINE_ID = 'bench-council-ai100-2022-2023';
const SNAPSHOT_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-candidates-2022-2023-2026-08-03.json');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function splitContributors(value) {
    return String(value || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
}

const snapshot = readJson(SNAPSHOT_PATH);
const storyline = readJson(path.join(ROOT, 'archive', 'storylines', `${STORYLINE_ID}.json`));
const failures = [];

if (snapshot.candidateCount !== 120 || snapshot.items.length !== 120) {
    failures.push(`snapshot must contain 120 rows; found ${snapshot.candidateCount}/${snapshot.items.length}`);
}
if (storyline.events.length !== snapshot.items.length) {
    failures.push(`storyline must contain ${snapshot.items.length} rows; found ${storyline.events.length}`);
}

for (const [index, item] of snapshot.items.entries()) {
    const ref = storyline.events[index];
    if (!ref) continue;
    const expectedOrder = (index + 1) * 10;
    if (ref.order !== expectedOrder) failures.push(`${index + 1} ${item.work}: order ${ref.order} != ${expectedOrder}`);
    if (ref.variant !== STORYLINE_ID) failures.push(`${index + 1} ${item.work}: variant ${ref.variant}`);

    const eventDir = path.join(ROOT, 'archive', 'events', ref.eventId);
    const event = readJson(path.join(eventDir, 'event.json'));
    const variant = readJson(path.join(eventDir, 'variants', `${STORYLINE_ID}.json`));
    const assets = readJson(path.join(eventDir, 'assets.json'));
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    const selectedAssets = (variant.assetIds || []).map((assetId) => assetsById.get(assetId)).filter(Boolean);
    const record = variant.achievement && variant.achievement.annualRecord;
    const actualContributors = (event.figures || []).map((figure) => figure.name && figure.name.en).filter(Boolean);
    const variantContributors = (variant.figures || []).map((figure) => figure.name && figure.name.en).filter(Boolean);
    const expectedContributors = splitContributors(item.contributors);

    if (event.title.en !== item.work || variant.displayTitle.en !== item.work) {
        failures.push(`${index + 1}: title mismatch for ${item.work}`);
    }
    if (JSON.stringify(actualContributors) !== JSON.stringify(expectedContributors)) {
        failures.push(
            `${index + 1} ${item.work}: contributors ${JSON.stringify(actualContributors)} != ${JSON.stringify(expectedContributors)}`
        );
    }
    if (JSON.stringify(variantContributors) !== JSON.stringify(expectedContributors)) {
        failures.push(
            `${index + 1} ${item.work}: variant contributors ${JSON.stringify(variantContributors)} != ${JSON.stringify(expectedContributors)}`
        );
    }
    if (!record) {
        failures.push(`${index + 1} ${item.work}: missing achievement.annualRecord`);
        continue;
    }
    const expectedRecord = {
        officialOrder: index + 1,
        area: item.area,
        work: item.work,
        publication: item.publication,
        citation: item.citation,
        contributors: item.contributors,
        institution: item.institution,
        country: item.country,
        sourceUrl: snapshot.sourceUrl
    };
    if (JSON.stringify(record) !== JSON.stringify(expectedRecord)) {
        failures.push(`${index + 1} ${item.work}: annualRecord differs from the official snapshot`);
    }
    if (!selectedAssets.length || !variant.visualModules || variant.visualModules[0].type !== 'archiveLink') {
        failures.push(`${index + 1} ${item.work}: explainer or source card is missing`);
    }
    if (selectedAssets.some((asset) => /_contributors\.svg$/i.test(asset.path || ''))) {
        failures.push(`${index + 1} ${item.work}: generated contributor profile cards are not allowed`);
    }
    const explainers = selectedAssets.filter((asset) => asset.role === 'annual-achievement-explainer');
    const portraits = selectedAssets.filter((asset) => asset.role === 'portrait');
    const figureAvatars = (variant.figures || []).map((figure) => figure.avatar).filter(Boolean);
    if (selectedAssets.length > 2 || explainers.length !== 1 || portraits.length > 1) {
        failures.push(`${index + 1} ${item.work}: expected one explainer and at most one verified portrait`);
    }
    if (
        figureAvatars.length !== portraits.length ||
        figureAvatars.some((avatar) => !portraits.some((portrait) => portrait.path === avatar))
    ) {
        failures.push(`${index + 1} ${item.work}: verified portrait selection and figure avatar mapping differ`);
    }
    for (const portrait of portraits) {
        const source = readJson(path.join(eventDir, 'sources.json')).find((entry) => entry.id === portrait.sourceId);
        if (
            !source ||
            !source.notes ||
            !source.reliability ||
            !portrait.sourceReliability ||
            !portrait.provenanceNotes ||
            !portrait.rights ||
            !portrait.rights.license
        ) {
            failures.push(`${index + 1} ${item.work}: portrait provenance or reliability metadata is incomplete`);
        }
    }
    if (variant.visual !== 'configuredPaper') {
        failures.push(`${index + 1} ${item.work}: visual must use configuredPaper`);
    }
}

if (failures.length > 0) {
    console.error(`BenchCouncil annual AI100 audit failed with ${failures.length} issue(s):`);
    for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`);
    process.exit(1);
}

console.log('PASS BenchCouncil AI100 (2022-2023) storyline preserves all 120 official rows and contributor order.');
