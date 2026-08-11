#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { resolveEffectivePresentation } = require('./archive-presentation');

const ROOT = path.resolve(__dirname, '..');
const STORYLINE_ID = 'bench-council-ai100';
const STORYLINE_PATH = path.join(ROOT, 'archive', 'storylines', `${STORYLINE_ID}.json`);
const EVENTS_ROOT = path.join(ROOT, 'archive', 'events');
const EVENT_PREFIX = 'ai100-annual-2022-2023-';

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const storyline = readJson(STORYLINE_PATH);
const failures = [];
const enabledEvents = storyline.events.filter(
    (event) => event.enabled !== false && event.eventId.startsWith(EVENT_PREFIX)
);
const selectedByYear = storyline.annualHighlights && storyline.annualHighlights.years;
const expectedIds = selectedByYear ? [...selectedByYear['2022'], ...selectedByYear['2023']] : [];
const actualIds = enabledEvents.map((event) => event.eventId);
const archiveEventIds = fs
    .readdirSync(EVENTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(EVENT_PREFIX))
    .map((entry) => entry.name)
    .sort();

if (!selectedByYear) failures.push('storyline must define annualHighlights.years');
if ((selectedByYear && selectedByYear['2022'].length) !== 10) failures.push('2022 selection must contain 10 events');
if ((selectedByYear && selectedByYear['2023'].length) !== 10) failures.push('2023 selection must contain 10 events');
if (enabledEvents.length !== 20)
    failures.push(`storyline must contain 20 enabled events; found ${enabledEvents.length}`);
if (new Set(actualIds).size !== actualIds.length) failures.push('storyline event IDs must be unique');
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    failures.push('storyline order must match curation.years');
}
if (JSON.stringify(archiveEventIds) !== JSON.stringify([...expectedIds].sort())) {
    const expectedSet = new Set(expectedIds);
    const actualSet = new Set(archiveEventIds);
    const missing = expectedIds.filter((eventId) => !actualSet.has(eventId));
    const extra = archiveEventIds.filter((eventId) => !expectedSet.has(eventId));
    if (missing.length) failures.push(`missing selected Archive events: ${missing.join(', ')}`);
    if (extra.length) failures.push(`unselected annual Archive events remain: ${extra.join(', ')}`);
}

for (const [index, eventRef] of enabledEvents.entries()) {
    const eventDir = path.join(EVENTS_ROOT, eventRef.eventId);
    const requiredFiles = ['event.json', 'claims.json', 'sources.json', 'assets.json', 'quizzes.json'];

    if (eventRef.variant && eventRef.variant !== STORYLINE_ID) {
        failures.push(`${eventRef.eventId}: unexpected variant ${eventRef.variant}`);
    }
    if (eventRef.order !== 1200 + index * 10) failures.push(`${eventRef.eventId}: unexpected order ${eventRef.order}`);
    for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(eventDir, file))) failures.push(`${eventRef.eventId}: missing ${file}`);
    }

    const event = readJson(path.join(eventDir, 'event.json'));
    const variant = resolveEffectivePresentation({
        root: ROOT,
        eventDir,
        event,
        eventId: eventRef.eventId,
        storylineId: STORYLINE_ID,
        ref: eventRef
    }).presentation;
    if (!variant.quizId) failures.push(`${eventRef.eventId}: missing quiz selection`);
    if (!variant.visual) {
        failures.push(`${eventRef.eventId}: missing achievement visual`);
    }
    if (!Array.isArray(variant.sourceIds) || variant.sourceIds.length < 3) {
        failures.push(`${eventRef.eventId}: fewer than three selected sources`);
    }
}

if (failures.length) {
    console.error('BenchCouncil AI100 annual highlights audit failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
} else {
    console.log('PASS BenchCouncil AI100 2022-2023 retains exactly 20 curated events (10 per year).');
    console.log('PASS no unselected annual Archive event bundles remain.');
}
