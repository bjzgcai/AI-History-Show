#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STORYLINE_PATH = path.join(ROOT, 'archive', 'storylines', 'bench-council-ai100.json');
const CATALOG_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'canonical-root-table-2026-07-30.json');
const EXCLUDED_EVENT_IDS = ['ai100-2021-clip', 'ai100-2021-dalle', 'ai100-2022-stable-diffusion'];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function diff(left, right) {
    const rightSet = new Set(right);
    return left.filter((item) => !rightSet.has(item));
}

const catalog = readJson(CATALOG_PATH);
const storyline = readJson(STORYLINE_PATH);
const canonicalEventIds = catalog.items.map((item) => item.eventId);
const selectedByYear = storyline.annualHighlights && storyline.annualHighlights.years;
const highlightEventIds = selectedByYear ? [...selectedByYear['2022'], ...selectedByYear['2023']] : [];
const expected = [...canonicalEventIds, ...highlightEventIds];
const actual = storyline.events.filter((item) => item.enabled !== false).map((item) => item.eventId);
const missing = diff(expected, actual);
const extra = diff(actual, expected);
const duplicateIds = actual.filter((eventId, index) => actual.indexOf(eventId) !== index);
const orderMismatches = expected
    .map((eventId, index) => ({ index, expected: eventId, actual: actual[index] }))
    .filter((item) => item.expected !== item.actual);
const excludedStatusIssues = [];

for (const eventId of EXCLUDED_EVENT_IDS) {
    const event = readJson(path.join(ROOT, 'archive', 'events', eventId, 'event.json'));
    if (event.canonical !== false || !(event.topics || []).includes('bench-council-ai100-extension')) {
        excludedStatusIssues.push(eventId);
    }
}

const failures = [];
if (catalog.uniqueWorkCount !== 119 || canonicalEventIds.length !== 119) {
    failures.push(`catalog count must be 119; found ${catalog.uniqueWorkCount}/${canonicalEventIds.length}`);
}
if (!selectedByYear) failures.push('storyline must define annualHighlights.years');
if (highlightEventIds.length !== 20) failures.push(`highlight count must be 20; found ${highlightEventIds.length}`);
if (new Set(expected).size !== expected.length) failures.push('canonical and highlight event IDs must not overlap');
if (actual.length !== 139) failures.push(`storyline count must be 139; found ${actual.length}`);
if (missing.length) failures.push(`missing event IDs: ${missing.join(', ')}`);
if (extra.length) failures.push(`extra event IDs: ${extra.join(', ')}`);
if (duplicateIds.length) failures.push(`duplicate event IDs: ${[...new Set(duplicateIds)].join(', ')}`);
if (orderMismatches.length) {
    failures.push(
        `order mismatches: ${orderMismatches
            .slice(0, 8)
            .map((item) => `${item.index + 1}:${item.expected}!=${item.actual || '<missing>'}`)
            .join(', ')}`
    );
}
if (excludedStatusIssues.length) {
    failures.push(`excluded Archive events are not marked as extensions: ${excludedStatusIssues.join(', ')}`);
}

if (failures.length) {
    console.error('BenchCouncil AI100 membership audit failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
} else {
    console.log(
        `PASS BenchCouncil AI100 storyline preserves all ${canonicalEventIds.length} canonical root-table works in official order.`
    );
    console.log(`PASS all ${highlightEventIds.length} annual highlights follow the canonical table in curated order.`);
    console.log(`PASS ${EXCLUDED_EVENT_IDS.length} retained extension events are marked non-canonical.`);
}
