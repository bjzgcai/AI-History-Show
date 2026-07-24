#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildArchivePreview } = require('./archive-compiler.js');
const { FUSIONS } = require('../manage/event-fusions.js');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, '.tmp', 'archive-reports', 'legacy-data-audit.md');

function requireFresh(relativePath) {
    const fullPath = path.join(ROOT, relativePath);
    delete require.cache[require.resolve(fullPath)];
    return require(fullPath);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function listArchiveEventIds() {
    const eventsDir = path.join(ROOT, 'archive', 'events');
    if (!fileExists(eventsDir)) return [];
    return fs
        .readdirSync(eventsDir)
        .filter((name) => fs.statSync(path.join(eventsDir, name)).isDirectory())
        .sort();
}

function archiveQuizEventIds() {
    const ids = [];
    for (const eventId of listArchiveEventIds()) {
        const quizzesPath = path.join(ROOT, 'archive', 'events', eventId, 'quizzes.json');
        if (!fileExists(quizzesPath)) continue;
        const quizzes = readJson(quizzesPath);
        if (Array.isArray(quizzes) && quizzes.length > 0) ids.push(eventId);
    }
    return ids;
}

function loadStorylines() {
    const storylinesDir = path.join(ROOT, 'archive', 'storylines');
    if (!fileExists(storylinesDir)) return [];
    return fs
        .readdirSync(storylinesDir)
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => readJson(path.join(storylinesDir, file)));
}

function catalogRefs(catalog) {
    const refs = [];
    for (const category of catalog.categories || []) {
        for (const eventId of category.events || []) {
            refs.push({ eventId, group: category.storyline && category.storyline.id ? category.storyline.id : 'main' });
        }
    }
    for (const branch of catalog.branches || []) {
        for (const eventId of branch.events || []) refs.push({ eventId, group: branch.id });
    }
    return refs;
}

function unique(values) {
    return [...new Set(values)].sort();
}

function setDiff(left, right) {
    const rightSet = new Set(right);
    return left.filter((value) => !rightSet.has(value));
}

function countBy(values) {
    const counts = new Map();
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
    return [...counts].filter(([, count]) => count > 1).sort(([a], [b]) => a.localeCompare(b));
}

function enabledStorylineRefs(storylines) {
    return storylines.flatMap((storyline) =>
        (storyline.events || [])
            .filter((ref) => !(ref && ref.enabled === false))
            .map((ref) => ({ storylineId: storyline.id, eventId: ref.eventId, variant: ref.variant }))
    );
}

function fusionArchiveCoverage(storylines) {
    const refs = enabledStorylineRefs(storylines);
    const refKeys = new Set(refs.map((ref) => `${ref.storylineId}:${ref.eventId}:${ref.variant}`));
    return FUSIONS.map((fusion) => {
        const canonical = fusion.canonical;
        const deepKey = `deep-learning:${canonical}:deep-learning`;
        const ai100Key = `bench-council-ai100:${canonical}:bench-council-ai100`;
        const legacyAi100Key = `bench-council-ai100:${fusion.ai100}:bench-council-ai100`;
        return {
            canonical,
            deep: fusion.deep,
            ai100: fusion.ai100,
            hasArchiveEvent: fileExists(path.join(ROOT, 'archive', 'events', canonical)),
            hasDeepVariant: fileExists(
                path.join(ROOT, 'archive', 'events', canonical, 'variants', 'deep-learning.json')
            ),
            hasAi100Variant: fileExists(
                path.join(ROOT, 'archive', 'events', canonical, 'variants', 'bench-council-ai100.json')
            ),
            hasDeepStorylineRef: refKeys.has(deepKey),
            hasAi100StorylineRef: refKeys.has(ai100Key) || refKeys.has(legacyAi100Key)
        };
    });
}

function generatedMilestoneIds() {
    const generatedPath = path.join(ROOT, 'milestones-data.js');
    if (!fileExists(generatedPath)) return [];
    const data = requireFresh('milestones-data.js');
    return (data.milestones || []).map((milestone) => milestone.id).filter(Boolean);
}

function archivePreviewCoverage() {
    const preview = buildArchivePreview(ROOT);
    const previewIds = preview.milestones.map((milestone) => milestone.id).filter(Boolean);
    const generatedIds = generatedMilestoneIds();
    const generatedSet = new Set(generatedIds);
    const previewSet = new Set(previewIds);
    return {
        preview,
        generatedIds,
        previewIds,
        duplicatePreviewIds: countBy(previewIds),
        generatedIdsMissingPreview: generatedIds.filter((id) => !previewSet.has(id)),
        previewIdsMissingGeneratedTarget: unique(previewIds).filter(
            (id) => !id.startsWith('archive-preview-') && !generatedSet.has(id)
        )
    };
}

function writeList(lines, title, values, formatter = (value) => `\`${value}\``) {
    lines.push(`### ${title}`);
    lines.push('');
    if (values.length === 0) {
        lines.push('- None');
    } else {
        for (const value of values) lines.push(`- ${formatter(value)}`);
    }
    lines.push('');
}

function main() {
    const catalog = requireFresh('manage/catalog.js');
    const events = requireFresh('manage/events.js');
    const quizzes = requireFresh('manage/quizzes.js');
    const refs = catalogRefs(catalog);
    const catalogEventIds = refs.map((ref) => ref.eventId);
    const uniqueCatalogEventIds = unique(catalogEventIds);
    const eventIds = unique(Object.keys(events));
    const legacyQuizIds = unique(Object.keys((quizzes && quizzes.events) || {}));
    const archiveEventIds = listArchiveEventIds();
    const archiveQuizIds = archiveQuizEventIds();
    const storylines = loadStorylines();
    const fusionCoverage = fusionArchiveCoverage(storylines);
    const previewCoverage = archivePreviewCoverage();

    const missingFromEvents = setDiff(uniqueCatalogEventIds, eventIds);
    const unreferencedEvents = setDiff(eventIds, uniqueCatalogEventIds);
    const duplicateCatalogRefs = countBy(catalogEventIds);
    const legacyQuizMissingArchive = setDiff(legacyQuizIds, archiveQuizIds);
    const archiveQuizMissingLegacy = setDiff(archiveQuizIds, legacyQuizIds);
    const fusionProblems = fusionCoverage.filter(
        (item) =>
            !item.hasArchiveEvent ||
            !item.hasDeepVariant ||
            !item.hasAi100Variant ||
            !item.hasDeepStorylineRef ||
            !item.hasAi100StorylineRef
    );

    const lines = [];
    lines.push('# Legacy Data Audit');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('This report checks the legacy history data files against the archive migration boundary.');
    lines.push('It is intentionally read-only and does not regenerate display data.');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Catalog categories: ${(catalog.categories || []).length}`);
    lines.push(`- Catalog branches: ${(catalog.branches || []).length}`);
    lines.push(`- Catalog event references: ${catalogEventIds.length}`);
    lines.push(`- Unique catalog event references: ${uniqueCatalogEventIds.length}`);
    lines.push(`- Legacy event keys: ${eventIds.length}`);
    lines.push(`- Archive event directories: ${archiveEventIds.length}`);
    lines.push(`- Legacy quiz event keys: ${legacyQuizIds.length}`);
    lines.push(`- Archive quiz event keys: ${archiveQuizIds.length}`);
    lines.push(`- Fusion rules: ${FUSIONS.length}`);
    lines.push(`- Archive preview milestones: ${previewCoverage.preview.milestones.length}`);
    lines.push(`- Archive preview errors: ${previewCoverage.preview.errors.length}`);
    lines.push(`- Generated milestone ids: ${previewCoverage.generatedIds.length}`);
    lines.push(`- Duplicate catalog refs: ${duplicateCatalogRefs.length}`);
    lines.push(`- Catalog refs missing legacy events: ${missingFromEvents.length}`);
    lines.push(`- Legacy event keys not referenced by catalog: ${unreferencedEvents.length}`);
    lines.push(`- Legacy quiz events missing archive quizzes: ${legacyQuizMissingArchive.length}`);
    lines.push(`- Archive quiz events missing legacy quizzes: ${archiveQuizMissingLegacy.length}`);
    lines.push(`- Fusion archive coverage problems: ${fusionProblems.length}`);
    lines.push(`- Duplicate archive preview ids: ${previewCoverage.duplicatePreviewIds.length}`);
    lines.push(`- Generated ids missing archive preview: ${previewCoverage.generatedIdsMissingPreview.length}`);
    lines.push(`- Preview ids missing generated target: ${previewCoverage.previewIdsMissingGeneratedTarget.length}`);
    lines.push('');

    writeList(lines, 'Duplicate catalog refs', duplicateCatalogRefs, ([id, count]) => `\`${id}\` x${count}`);
    writeList(lines, 'Catalog refs missing legacy events', missingFromEvents);
    writeList(lines, 'Legacy event keys not referenced by catalog', unreferencedEvents);
    writeList(lines, 'Legacy quiz events missing archive quizzes', legacyQuizMissingArchive);
    writeList(lines, 'Archive quiz events missing legacy quizzes', archiveQuizMissingLegacy);
    writeList(
        lines,
        'Fusion archive coverage problems',
        fusionProblems,
        (item) =>
            `\`${item.canonical}\` archiveEvent=${item.hasArchiveEvent} deepVariant=${item.hasDeepVariant} ai100Variant=${item.hasAi100Variant} deepRef=${item.hasDeepStorylineRef} ai100Ref=${item.hasAi100StorylineRef}`
    );
    writeList(
        lines,
        'Duplicate archive preview ids',
        previewCoverage.duplicatePreviewIds,
        ([id, count]) => `\`${id}\` x${count}`
    );
    writeList(lines, 'Generated ids missing archive preview', previewCoverage.generatedIdsMissingPreview);
    writeList(lines, 'Preview ids missing generated target', previewCoverage.previewIdsMissingGeneratedTarget);

    lines.push('## Interpretation');
    lines.push('');
    lines.push('- Catalog/event mismatches are blockers for normal generation.');
    lines.push(
        '- Quiz differences are migration inventory, not automatic failures, because archive and legacy IDs can differ during transition.'
    );
    lines.push(
        '- Fusion coverage problems indicate remaining legacy transition logic that should eventually move into archive variants.'
    );
    lines.push('- Archive preview coverage should stay clean before retiring legacy source files.');
    lines.push('');

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8');

    const blockingFailures =
        missingFromEvents.length > 0 ||
        previewCoverage.preview.errors.length > 0 ||
        previewCoverage.duplicatePreviewIds.length > 0 ||
        previewCoverage.generatedIdsMissingPreview.length > 0 ||
        previewCoverage.previewIdsMissingGeneratedTarget.length > 0;

    console.log(`Legacy data audit written to ${path.relative(ROOT, REPORT_PATH)}`);
    console.log(`Catalog refs missing legacy events: ${missingFromEvents.length}`);
    console.log(`Archive preview errors: ${previewCoverage.preview.errors.length}`);
    console.log(`Generated ids missing archive preview: ${previewCoverage.generatedIdsMissingPreview.length}`);
    console.log(`Fusion archive coverage problems: ${fusionProblems.length}`);
    console.log(`Legacy quiz events missing archive quizzes: ${legacyQuizMissingArchive.length}`);

    if (blockingFailures) {
        process.exitCode = 1;
    }
}

main();
