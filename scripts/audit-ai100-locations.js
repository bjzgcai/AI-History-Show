#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getCanonicalLocation, localized } = require('./ai100-locations.js');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'canonical-root-table-2026-07-30.json');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function samePair(actual, expected) {
    return localized(actual, 'en') === expected.en && localized(actual, 'zh') === expected.zh;
}

function hasDuplicateCountry(place, country, locale) {
    const placeText = localized(place, locale).trim();
    const countryText = localized(country, locale).trim();
    if (!placeText || !countryText) return false;
    const separators = locale === 'zh' ? ['，', ',', '、'] : [','];
    return separators.some(
        (separator) =>
            placeText.endsWith(`${separator}${countryText}`) || placeText.endsWith(`${separator} ${countryText}`)
    );
}

function hasUntranslatedGenericInstitution(value) {
    return /\b(?:University|Institute|Laborator(?:y|ies)|Research|College|Technology|Corporation)\b/i.test(value);
}

function containsNonAscii(value) {
    return Array.from(String(value || '')).some((character) => character.codePointAt(0) > 127);
}

const catalog = readJson(CATALOG_PATH);
const catalogEventIds = new Set(catalog.items.map((item) => item.eventId));
const runtime = require(path.join(ROOT, 'milestones-data.js')).milestones;
const runtimeByEventId = new Map(
    runtime
        .filter(
            (item) =>
                item.storyline &&
                item.storyline.id === 'bench-council-ai100' &&
                catalogEventIds.has(item.archiveEventId)
        )
        .map((item) => [item.archiveEventId, item])
);
const failures = [];

for (const item of catalog.items) {
    const eventDir = path.join(ROOT, 'archive', 'events', item.eventId);
    const event = readJson(path.join(eventDir, 'event.json'));
    const variant = readJson(path.join(eventDir, 'variants', 'bench-council-ai100.json'));
    const milestone = runtimeByEventId.get(item.eventId);
    const expected = getCanonicalLocation(item);
    const locations = [
        {
            label: 'event',
            place: event.location && event.location.place,
            country: event.location && event.location.country
        },
        {
            label: 'variant',
            place: variant.location && variant.location.name,
            country: variant.location && variant.location.country
        },
        {
            label: 'runtime',
            place: milestone && milestone.location && milestone.location.name,
            country: milestone && milestone.location && milestone.location.country
        }
    ];

    for (const location of locations) {
        if (!samePair(location.place, expected.place)) {
            failures.push(
                `${item.eventId} ${location.label} institution differs from BenchCouncil: ${JSON.stringify(location.place)}`
            );
        }
        if (!samePair(location.country, expected.country)) {
            failures.push(
                `${item.eventId} ${location.label} country differs from BenchCouncil: ${JSON.stringify(location.country)}`
            );
        }
        if (containsNonAscii(localized(location.place, 'en')) || containsNonAscii(localized(location.country, 'en'))) {
            failures.push(`${item.eventId} ${location.label} English location contains non-ASCII localized text`);
        }
        if (hasUntranslatedGenericInstitution(localized(location.place, 'zh'))) {
            failures.push(
                `${item.eventId} ${location.label} Chinese institution contains untranslated generic English text`
            );
        }
        if (!/[\u3400-\u9fff]/.test(localized(location.country, 'zh'))) {
            failures.push(`${item.eventId} ${location.label} Chinese country is not localized`);
        }
        if (
            hasDuplicateCountry(location.place, location.country, 'en') ||
            hasDuplicateCountry(location.place, location.country, 'zh')
        ) {
            failures.push(`${item.eventId} ${location.label} repeats the country inside the institution field`);
        }
    }
}

if (runtimeByEventId.size !== catalog.items.length) {
    failures.push(
        `runtime contains ${runtimeByEventId.size} canonical AI100 location(s); expected ${catalog.items.length}`
    );
}

if (failures.length) {
    console.error(`AI100 location audit failed with ${failures.length} issue(s):`);
    failures.slice(0, 40).forEach((failure) => console.error(`- ${failure}`));
    if (failures.length > 40) console.error(`- ... ${failures.length - 40} more issue(s)`);
    process.exitCode = 1;
} else {
    console.log(
        `PASS all ${catalog.items.length} AI100 locations match the BenchCouncil institution and country fields.`
    );
    console.log('PASS English and Chinese locations are localized independently with no duplicated country suffixes.');
}
