#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getCanonicalLocation } = require('./ai100-locations.js');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'canonical-root-table-2026-07-30.json');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeIfChanged(filePath, value) {
    const current = fs.readFileSync(filePath, 'utf8');
    const indentation = current.match(/\n([ \t]+)"/)?.[1] || '  ';
    const next = `${JSON.stringify(value, null, indentation)}\n`;
    if (current === next) return false;
    fs.writeFileSync(filePath, next);
    return true;
}

const catalog = readJson(CATALOG_PATH);
let updatedFiles = 0;

for (const item of catalog.items) {
    const eventDir = path.join(ROOT, 'archive', 'events', item.eventId);
    const eventPath = path.join(eventDir, 'event.json');
    const variantPath = path.join(eventDir, 'variants', 'bench-council-ai100.json');
    const expected = getCanonicalLocation(item);

    const event = readJson(eventPath);
    event.location = event.location || {};
    event.location.country = expected.country;
    event.location.place = expected.place;
    if (writeIfChanged(eventPath, event)) updatedFiles += 1;

    const variant = readJson(variantPath);
    variant.location = variant.location || {};
    variant.location.name = expected.place;
    variant.location.country = expected.country;
    variant.location.coordinates = variant.location.coordinates || event.location.coordinates || [];
    if (writeIfChanged(variantPath, variant)) updatedFiles += 1;
}

console.log(`AI100 location sync complete: ${catalog.items.length} achievements, ${updatedFiles} file(s) updated.`);
