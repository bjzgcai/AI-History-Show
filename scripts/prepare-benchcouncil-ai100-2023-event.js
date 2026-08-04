#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const STORYLINE_ID = 'bench-council-ai100-2022-2023';
const SNAPSHOT_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-candidates-2022-2023-2026-08-03.json');
const RESEARCH_DIR = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-events-2023');
const RESEARCH_ASSET_DIR = path.join(RESEARCH_DIR, 'assets');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
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

function parseArgs(argv) {
    const eventIndex = argv.indexOf('--event');
    if (eventIndex === -1 || !argv[eventIndex + 1]) {
        throw new Error('Usage: node scripts/prepare-benchcouncil-ai100-2023-event.js --event <order|event-id|work>');
    }
    return { event: argv[eventIndex + 1], dryRun: argv.includes('--dry-run') };
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
    const match = matches[0];
    const eventPath = path.join(ROOT, 'archive', 'events', match.eventId, 'event.json');
    if (!fs.existsSync(eventPath)) throw new Error(`Archive event does not exist: ${match.eventId}`);
    const event = readJson(eventPath);
    if (event.year !== 2023) throw new Error(`${match.eventId} is year ${event.year}, not 2023.`);
    return { ...match, event };
}

function stripQuizEnvelope(quiz) {
    if (!quiz) return null;
    const content = { ...quiz };
    delete content.id;
    delete content.storylineId;
    delete content.assetIds;
    return content;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const snapshot = readJson(SNAPSHOT_PATH);
    const selected = resolveEvent(snapshot, args.event);
    const eventDir = path.join(ROOT, 'archive', 'events', selected.eventId);
    const variant = readJson(path.join(eventDir, 'variants', `${STORYLINE_ID}.json`));
    const assets = readJson(path.join(eventDir, 'assets.json'));
    const quizzes = readJson(path.join(eventDir, 'quizzes.json'));
    const recordAsset = assets.find((asset) =>
        ['annual-achievement-explainer', 'architecture-explainer', 'algorithm-explainer'].includes(asset.role)
    );
    if (!recordAsset) throw new Error(`${selected.eventId} has no annual achievement explainer.`);

    const researchPath = path.join(RESEARCH_DIR, `${selected.eventId}.json`);
    if (fs.existsSync(researchPath))
        throw new Error(`Research file already exists: ${path.relative(ROOT, researchPath)}`);

    const sourceSvgPath = path.join(RESEARCH_ASSET_DIR, `${selected.eventId}.svg`);
    if (args.dryRun) {
        console.log(`Would prepare ${path.relative(ROOT, researchPath)}`);
        console.log(`Would prepare ${path.relative(ROOT, sourceSvgPath)}`);
        return;
    }
    fs.mkdirSync(path.dirname(sourceSvgPath), { recursive: true });
    if (!fs.existsSync(sourceSvgPath)) fs.copyFileSync(path.join(ROOT, recordAsset.path), sourceSvgPath);

    const research = {
        schemaVersion: 1,
        eventId: selected.eventId,
        status: 'draft',
        officialOrder: selected.index,
        work: selected.item.work,
        official: {
            area: selected.item.area,
            publication: selected.item.publication,
            citation: selected.item.citation,
            contributors: selected.item.contributors,
            institution: selected.item.institution,
            country: selected.item.country,
            sourceUrl: snapshot.sourceUrl
        },
        summary: selected.event.summary,
        displaySummary: variant.displaySummary,
        description: selected.event.description,
        people: selected.event.figures.map((figure) => ({
            name: figure.name,
            role: figure.role,
            verification: {
                status: 'pending',
                sourceIds: [],
                notes: { en: 'Research pending.', zh: '人物核验待完成。' }
            },
            portraitSearch: {
                status: 'not-started',
                reliability: 'unverified',
                rights: 'No image has been selected.'
            }
        })),
        selectedPortrait: null,
        sourceOverrides: {},
        additionalSources: [],
        additionalClaims: [],
        commentarySections: variant.commentarySections,
        visualModule: variant.visualModules[0],
        recordSvgSource: path.relative(ROOT, sourceSvgPath),
        recordAsset: {
            caption: recordAsset.caption,
            subcaption: recordAsset.subcaption,
            sourceIds: recordAsset.sourceIds,
            sourceName: recordAsset.sourceName,
            sourceUrl: recordAsset.sourceUrl,
            displayUsage: recordAsset.displayUsage
        },
        achievement: variant.achievement,
        quiz: stripQuizEnvelope(quizzes[0]),
        reviewNotes: {
            en: 'Draft event research. Replace this note after evidence, people, portrait and content checks are complete.',
            zh: '事件研究草稿；完成资料、人物、肖像和内容核验后替换此备注。'
        }
    };
    delete research.achievement.annualRecord;
    writeJson(researchPath, research);
    console.log(`Prepared ${path.relative(ROOT, researchPath)}`);
    console.log(`Prepared ${path.relative(ROOT, sourceSvgPath)}`);
    console.log(
        `Next: complete the research file, set status to complete, then run npm run sync:ai100-annual -- --event ${selected.index}`
    );
}

try {
    main();
} catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
}
