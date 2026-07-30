#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { localized, namesMatch, readJson, splitContributors } = require('./ai100-contributors');

const ROOT = path.resolve(__dirname, '..');
const catalog = readJson(path.join(ROOT, 'research', 'benchcouncil-ai100', 'canonical-root-table-2026-07-30.json'));
const storyline = readJson(path.join(ROOT, 'archive', 'storylines', 'bench-council-ai100.json'));
const refs = new Map(storyline.events.filter((item) => item.enabled !== false).map((item) => [item.eventId, item]));
const failures = [];
let firstAuthorPortraits = 0;
let fallbackPortraits = 0;
let noOfficialPortraits = 0;

for (const item of catalog.items) {
    const ref = refs.get(item.eventId);
    if (!ref) {
        failures.push(`${item.eventId}: missing storyline entry`);
        continue;
    }
    const eventDir = path.join(ROOT, 'archive', 'events', item.eventId);
    const variant = readJson(path.join(eventDir, 'variants', `${ref.variant}.json`));
    const assets = readJson(path.join(eventDir, 'assets.json'));
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const expected = splitContributors(item.contributors);
    const actual = variant.figures || [];

    for (let index = 0; index < expected.length; index += 1) {
        const actualName = localized(actual[index] && actual[index].name, 'en');
        if (!namesMatch(expected[index], actualName)) {
            failures.push(
                `${item.eventId}: figure ${index + 1} must be ${expected[index]}, found ${actualName || '<missing>'}`
            );
        }
        const zh = localized(actual[index] && actual[index].name, 'zh');
        if (!/[\u3400-\u9fff]/.test(zh)) {
            failures.push(`${item.eventId}: ${expected[index]} is missing a Chinese display name`);
        }
    }

    for (const figure of actual) {
        const roleEn = localized(figure && figure.role, 'en');
        const roleZh = localized(figure && figure.role, 'zh');
        if (/\b(?:first )?listed contributor\b/i.test(roleEn) || /人物列表(?:首位|成员)/.test(roleZh)) {
            failures.push(
                `${item.eventId}: ${localized(figure && figure.name, 'en') || '<unnamed>'} still uses a legacy contributor-list role`
            );
        }
    }

    const officialFigures = actual.slice(0, expected.length);
    const selectedAsset = assetMap.get((variant.assetIds || [])[0]);
    const portraitIndex = officialFigures.findIndex(
        (figure) => figure && figure.avatar && assets.some((asset) => asset.path === figure.avatar)
    );
    if (portraitIndex < 0) {
        noOfficialPortraits += 1;
        continue;
    }
    if (!selectedAsset || selectedAsset.path !== officialFigures[portraitIndex].avatar) {
        failures.push(
            `${item.eventId}: first selected image must match the earliest listed contributor with a portrait`
        );
    }
    if (portraitIndex === 0) firstAuthorPortraits += 1;
    else fallbackPortraits += 1;
}

if (failures.length) {
    console.error('AI100 contributor audit failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
} else {
    console.log(`PASS all ${catalog.items.length} AI100 figure lists preserve the BenchCouncil contributor prefix.`);
    console.log(`PASS ${firstAuthorPortraits} achievements lead with a first-listed contributor portrait.`);
    console.log(`PASS ${fallbackPortraits} achievements use the earliest later listed contributor with a portrait.`);
    console.log(`INFO ${noOfficialPortraits} achievements have no configured portrait for any listed contributor.`);
}
