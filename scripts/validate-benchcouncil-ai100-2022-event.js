#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { countTextSentences, getLocalizedText } = require('../shared/utils.js');

const ROOT = path.join(__dirname, '..');
const STORYLINE_ID = 'bench-council-ai100-2022-2023';
const SNAPSHOT_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-candidates-2022-2023-2026-08-03.json');
const RESEARCH_DIR = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-events-2022');
const LEGACY_RESEARCH_PATH = path.join(
    ROOT,
    'research',
    'benchcouncil-ai100',
    'annual-event-research-2022-2026-08-03.json'
);
const REQUIRED_SECTION_IDS = ['historical-background', 'core-idea', 'long-term-legacy'];
const REQUIRED_VISUAL_MODULE_FIELDS = ['site', 'title', 'description', 'license', 'usage', 'action'];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeKey(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function slugify(value) {
    return normalizeKey(value).replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}

function eventIdForItem(item, index) {
    return `ai100-annual-2022-2023-${String(index).padStart(3, '0')}-${slugify(item.work)}`;
}

function splitContributors(value) {
    return String(value || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
}

function startsWithNames(actual, expectedPrefix) {
    return expectedPrefix.every((name, index) => actual[index] === name);
}

function parseEventSelector(argv) {
    const eventIndex = argv.indexOf('--event');
    if (eventIndex === -1 || !argv[eventIndex + 1]) {
        throw new Error('Usage: node scripts/validate-benchcouncil-ai100-2022-event.js --event <order|event-id|work>');
    }
    return argv[eventIndex + 1];
}

function resolveEvent(snapshot, selector) {
    const normalizedSelector = normalizeKey(selector);
    const numericOrder = /^\d+$/.test(String(selector).trim()) ? Number(selector) : 0;
    const matches = snapshot.items
        .map((item, zeroBasedIndex) => {
            const index = zeroBasedIndex + 1;
            return { item, index, eventId: eventIdForItem(item, index) };
        })
        .filter((entry) => {
            if (numericOrder && entry.index === numericOrder) return true;
            return [entry.eventId, entry.item.work, slugify(entry.item.work)].some(
                (candidate) => normalizeKey(candidate) === normalizedSelector
            );
        });
    if (matches.length !== 1) throw new Error(`Expected one event for ${selector}; found ${matches.length}.`);
    return matches[0];
}

function loadResearch(eventId) {
    const eventPath = path.join(RESEARCH_DIR, `${eventId}.json`);
    if (fs.existsSync(eventPath)) return { filePath: eventPath, value: readJson(eventPath) };
    if (fs.existsSync(LEGACY_RESEARCH_PATH)) {
        const legacy = readJson(LEGACY_RESEARCH_PATH);
        if (legacy.events && legacy.events[eventId]) {
            return { filePath: LEGACY_RESEARCH_PATH, value: legacy.events[eventId] };
        }
    }
    throw new Error(`No research record exists for ${eventId}.`);
}

function hasLocalized(value) {
    return Boolean(
        value && typeof value === 'object' && String(value.en || '').trim() && String(value.zh || '').trim()
    );
}

function main() {
    const failures = [];
    const selector = parseEventSelector(process.argv.slice(2));
    const snapshot = readJson(SNAPSHOT_PATH);
    const selected = resolveEvent(snapshot, selector);
    const researchRecord = loadResearch(selected.eventId);
    const research = researchRecord.value;
    const eventDir = path.join(ROOT, 'archive', 'events', selected.eventId);
    const event = readJson(path.join(eventDir, 'event.json'));
    if (event.year !== 2022) failures.push(`event year must be 2022; found ${event.year}`);
    const sources = readJson(path.join(eventDir, 'sources.json'));
    const claims = readJson(path.join(eventDir, 'claims.json'));
    const assets = readJson(path.join(eventDir, 'assets.json'));
    const quizzes = readJson(path.join(eventDir, 'quizzes.json'));
    const variant = readJson(path.join(eventDir, 'variants', `${STORYLINE_ID}.json`));
    const sourceIds = new Set(sources.map((source) => source.id));
    const claimIds = new Set(claims.map((claim) => claim.id));
    const assetIds = new Set(assets.map((asset) => asset.id));
    const expectedContributors = splitContributors(selected.item.contributors);
    const researchContributors = (research.people || []).map((person) => person.name && person.name.en).filter(Boolean);
    const eventContributors = (event.figures || []).map((figure) => figure.name && figure.name.en).filter(Boolean);

    if (research.status !== 'complete')
        failures.push(`research status must be complete; found ${research.status || 'missing'}`);
    if (research.officialOrder !== selected.index) failures.push(`officialOrder must be ${selected.index}`);
    if (research.work !== selected.item.work) failures.push(`work must remain ${selected.item.work}`);
    if (research.official) {
        for (const field of ['area', 'publication', 'citation', 'contributors', 'institution', 'country']) {
            if ((research.official[field] || '') !== (selected.item[field] || '')) {
                failures.push(`official.${field} must match the BenchCouncil row exactly`);
            }
        }
        if (research.official.sourceUrl !== snapshot.sourceUrl) {
            failures.push('official.sourceUrl must match the BenchCouncil snapshot source URL');
        }
    }
    if (!event.title || event.title.en !== selected.item.work) {
        failures.push('Archive English title must match the BenchCouncil work name exactly');
    }
    if (!startsWithNames(researchContributors, expectedContributors)) {
        failures.push('research people must preserve the complete official contributor prefix and order');
    }
    if (!startsWithNames(eventContributors, expectedContributors)) {
        failures.push('Archive figures must preserve the complete official contributor prefix and order');
    }
    if (!hasLocalized(research.summary) || !hasLocalized(research.description)) {
        failures.push('summary and description must contain English and Chinese');
    }

    for (const person of research.people || []) {
        if (!hasLocalized(person.name) || !hasLocalized(person.role)) {
            failures.push(`person ${person.name && person.name.en} needs localized name and role`);
        }
        if (!person.verification || person.verification.status !== 'confirmed') {
            failures.push(`person ${person.name.en} verification must be confirmed`);
        }
        if (
            !person.verification ||
            !Array.isArray(person.verification.sourceIds) ||
            !person.verification.sourceIds.length
        ) {
            failures.push(`person ${person.name.en} verification needs sourceIds`);
        } else {
            for (const sourceId of person.verification.sourceIds) {
                if (!sourceIds.has(sourceId)) {
                    failures.push(`person ${person.name.en} verification references missing source ${sourceId}`);
                }
            }
        }
        if (!hasLocalized(person.verification && person.verification.notes)) {
            failures.push(`person ${person.name.en} verification notes must be localized`);
        }
        if (!person.portraitSearch || ['not-started', 'unverified'].includes(person.portraitSearch.status)) {
            failures.push(`person ${person.name.en} portrait search is incomplete`);
        }
        if (!String(person.portraitSearch && person.portraitSearch.reliability).trim()) {
            failures.push(`person ${person.name.en} portrait search needs a reliability assessment`);
        }
        if (!String(person.portraitSearch && person.portraitSearch.rights).trim()) {
            failures.push(`person ${person.name.en} portrait search needs a rights note`);
        }
    }

    if (research.selectedPortrait) {
        const selectedPortrait = research.selectedPortrait;
        if (!expectedContributors.includes(selectedPortrait.personName)) {
            failures.push('selectedPortrait.personName must be an official contributor');
        }
        const image = selectedPortrait.image || {};
        for (const field of ['path', 'sourceUrl', 'imageUrl', 'reliability', 'usageStatus']) {
            if (!String(image[field] || '').trim()) failures.push(`selectedPortrait.image.${field} is required`);
        }
        for (const field of ['sourceName', 'license', 'notes']) {
            if (!hasLocalized(image[field])) failures.push(`selectedPortrait.image.${field} must be localized`);
        }
        if (!Array.isArray(image.identityChecks) || !image.identityChecks.length) {
            failures.push('selectedPortrait.image.identityChecks is required');
        }
        if (image.path && !fs.existsSync(path.join(ROOT, image.path))) {
            failures.push(`selected portrait file does not exist: ${image.path}`);
        }
    }

    if (sources.length < 4) failures.push(`expected at least 4 sources; found ${sources.length}`);
    if (!sources.some((source) => source.reliability === 'primary' && source.purpose === 'core-evidence')) {
        failures.push('at least one primary core-evidence source is required');
    }
    for (const source of sources) {
        if (!hasLocalized(source.label) || !hasLocalized(source.title))
            failures.push(`source ${source.id} is not localized`);
    }
    for (const sourceId of Object.keys(research.sourceOverrides || {})) {
        if (!sourceIds.has(sourceId)) failures.push(`sourceOverrides references missing source ${sourceId}`);
    }
    for (const claim of claims) {
        for (const sourceId of claim.sourceIds || []) {
            if (!sourceIds.has(sourceId)) failures.push(`claim ${claim.id} references missing source ${sourceId}`);
        }
    }
    for (const sourceId of variant.sourceIds || []) {
        if (!sourceIds.has(sourceId)) failures.push(`variant references missing source ${sourceId}`);
    }
    for (const claimId of variant.claimIds || []) {
        if (!claimIds.has(claimId)) failures.push(`variant references missing claim ${claimId}`);
    }
    for (const assetId of variant.assetIds || []) {
        if (!assetIds.has(assetId)) failures.push(`variant references missing asset ${assetId}`);
    }

    const selectedAssets = (variant.assetIds || []).map((assetId) => assets.find((asset) => asset.id === assetId));
    const explainers = selectedAssets.filter(
        (asset) =>
            asset &&
            ['annual-achievement-explainer', 'architecture-explainer', 'algorithm-explainer'].includes(asset.role)
    );
    if (explainers.length !== 1) {
        failures.push('variant must select exactly one achievement explainer');
    }
    if (variant.overviewImageAssetId !== variant.assetIds[0]) {
        failures.push('overviewImageAssetId must match the first selected detail asset');
    }
    if (research.recordSvgSource) {
        const svgPath = path.resolve(ROOT, research.recordSvgSource);
        const relative = path.relative(RESEARCH_DIR, svgPath);
        if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(svgPath)) {
            failures.push('recordSvgSource must exist inside the per-event research directory');
        }
    }

    const sections = new Map((variant.commentarySections || []).map((section) => [section.id, section]));
    for (const sectionId of REQUIRED_SECTION_IDS) {
        const section = sections.get(sectionId);
        if (!section) {
            failures.push(`missing commentary section ${sectionId}`);
            continue;
        }
        for (const locale of ['en', 'zh']) {
            const count = countTextSentences(getLocalizedText(section.html, locale), locale);
            if (count < 2) failures.push(`${sectionId}.${locale} must contain at least 2 sentences`);
        }
    }

    const visualModule = variant.visualModules && variant.visualModules[0];
    if (!visualModule || visualModule.type !== 'archiveLink' || !visualModule.url) {
        failures.push('the first visual module must be an archiveLink with a URL');
    } else {
        for (const field of REQUIRED_VISUAL_MODULE_FIELDS) {
            if (!hasLocalized(visualModule[field])) failures.push(`visualModule.${field} must be localized`);
        }
    }

    if (quizzes.length !== 1) failures.push(`expected one quiz; found ${quizzes.length}`);
    const quiz = quizzes[0];
    if (quiz) {
        if (!hasLocalized(quiz.question) || !hasLocalized(quiz.explanation))
            failures.push('quiz text must be localized');
        if (!Array.isArray(quiz.options) || quiz.options.length !== 4)
            failures.push('quiz must have exactly 4 options');
        for (const sourceId of quiz.sourceIds || []) {
            if (!sourceIds.has(sourceId)) failures.push(`quiz references missing source ${sourceId}`);
        }
        for (const assetId of quiz.assetIds || []) {
            if (!assetIds.has(assetId)) failures.push(`quiz references missing asset ${assetId}`);
        }
    }

    if (failures.length) {
        console.error(`AI100 2022 event validation failed for ${selected.eventId}:`);
        for (const failure of failures) console.error(`- ${failure}`);
        process.exitCode = 1;
        return;
    }
    console.log(`PASS ${selected.eventId} is complete, source-grounded, localized and safe for integration.`);
    console.log(`Research: ${path.relative(ROOT, researchRecord.filePath)}`);
}

try {
    main();
} catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
}
