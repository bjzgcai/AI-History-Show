#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_DATA_PATH = path.join(ROOT, '.tmp', 'archive-preview', 'milestones-data-archive-preview.js');
const NATIVE_DATA_PATH = path.join(ROOT, '.tmp', 'archive-preview', 'milestones-data-archive-native.js');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-native-diff.md');
const JSON_REPORT_PATH = path.join(ROOT, 'reports', 'archive-native-diff.json');

const DISPLAY_CRITICAL_FIELDS = new Set(['title', 'subtitle', 'description', 'images', 'visual', 'analysis']);
const VISIBLE_STRUCTURED_FIELDS = new Set(['sourceDisplay', 'papers', 'commentaryDisplay', 'quizDisplay']);
const STRUCTURAL_FIELDS = new Set(['category', 'figures', 'imageMeta', 'resourcesVideos', 'quote']);

function stripHtml(value) {
    return String(value ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function localize(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
            zh: stripHtml(value.zh ?? value.en ?? ''),
            en: stripHtml(value.en ?? value.zh ?? '')
        };
    }
    return { zh: stripHtml(value), en: stripHtml(value) };
}

function list(value) {
    return Array.isArray(value) ? value : [];
}

function stable(value) {
    return JSON.stringify(value ?? null);
}

function groupFor(field) {
    if (DISPLAY_CRITICAL_FIELDS.has(field)) return 'displayCritical';
    if (VISIBLE_STRUCTURED_FIELDS.has(field)) return 'visibleStructured';
    if (STRUCTURAL_FIELDS.has(field)) return 'structuralCoverage';
    return 'other';
}

function visibleSourceSignature(source) {
    return {
        type: localize(source && source.type),
        label: localize(source && source.label),
        url: String((source && source.url) || '')
    };
}

function visiblePaperSignature(paper) {
    return {
        title: localize(paper && paper.title),
        authors: localize(paper && paper.authors),
        journal: localize(paper && paper.journal),
        year: String((paper && paper.year) || ''),
        url: String((paper && paper.url) || '')
    };
}

function commentaryDisplaySignature(section) {
    return localize(section && section.html);
}

function quizDisplaySignature(quiz) {
    return {
        question: localize(quiz && quiz.question),
        options: list(quiz && quiz.options).map((option) => localize(option && option.text ? option.text : option)),
        answerIndex: typeof (quiz && quiz.answerIndex) === 'number' ? quiz.answerIndex : quiz && quiz.answer,
        explanation: localize(quiz && quiz.explanation)
    };
}

function compareValue(field, previewValue, nativeValue, diffs) {
    if (stable(previewValue) !== stable(nativeValue)) {
        diffs.push({ field, group: groupFor(field) });
    }
}

function compareLocalized(field, previewValue, nativeValue, diffs) {
    compareValue(field, localize(previewValue), localize(nativeValue), diffs);
}

function locationSignature(location) {
    return {
        name: localize(location && location.name),
        country: localize(location && location.country),
        coordinates: list(location && location.coordinates)
    };
}

function compareMilestone(preview, native) {
    const diffs = [];
    compareLocalized('title', preview.title, native.title, diffs);
    compareLocalized('subtitle', preview.subtitle, native.subtitle, diffs);
    compareLocalized('description', preview.description, native.description, diffs);
    compareValue(
        'images',
        list(preview.resources && preview.resources.images),
        list(native.resources && native.resources.images),
        diffs
    );
    compareValue(
        'visual',
        preview.achievement && preview.achievement.visual,
        native.achievement && native.achievement.visual,
        diffs
    );
    compareValue('analysis', preview.analysis || null, native.analysis || null, diffs);

    compareValue(
        'sourceDisplay',
        list(preview.achievement && preview.achievement.sources).map(visibleSourceSignature),
        list(native.achievement && native.achievement.sources).map(visibleSourceSignature),
        diffs
    );
    compareValue(
        'papers',
        list(preview.papers).map(visiblePaperSignature),
        list(native.papers).map(visiblePaperSignature),
        diffs
    );
    compareValue(
        'commentaryDisplay',
        list(preview.commentarySections).map(commentaryDisplaySignature),
        list(native.commentarySections).map(commentaryDisplaySignature),
        diffs
    );
    compareValue(
        'quizDisplay',
        list(preview.quizzes).map(quizDisplaySignature),
        list(native.quizzes).map(quizDisplaySignature),
        diffs
    );

    compareValue('year', preview.year, native.year, diffs);
    if (preview.date !== undefined) compareValue('date', preview.date, native.date, diffs);
    compareLocalized('category', preview.category, native.category, diffs);
    compareValue('location', locationSignature(preview.location), locationSignature(native.location), diffs);
    compareValue('figures', preview.figures, native.figures, diffs);
    compareValue('imageMeta', preview.imageMeta, native.imageMeta, diffs);
    compareValue(
        'resourcesVideos',
        preview.resources && preview.resources.videos,
        native.resources && native.resources.videos,
        diffs
    );
    compareValue(
        'achievementAuxiliary',
        list(preview.achievement && preview.achievement.visualModules),
        list(native.achievement && native.achievement.visualModules),
        diffs
    );
    compareValue(
        'quote',
        {
            quote: preview.quote,
            quoteText: preview.quoteText,
            quoteHtml: preview.quoteHtml,
            quoteMeta: preview.quoteMeta,
            quotePage: preview.quotePage,
            quoteAttribution: preview.quoteAttribution
        },
        {
            quote: native.quote,
            quoteText: native.quoteText,
            quoteHtml: native.quoteHtml,
            quoteMeta: native.quoteMeta,
            quotePage: native.quotePage,
            quoteAttribution: native.quoteAttribution
        },
        diffs
    );

    return diffs;
}

function loadMilestones(filePath) {
    delete require.cache[require.resolve(filePath)];
    return require(filePath).milestones;
}

function countByField(rows, filter = () => true) {
    const counts = new Map();
    for (const row of rows) {
        for (const diff of row.diffs) {
            if (filter(diff)) counts.set(diff.field, (counts.get(diff.field) || 0) + 1);
        }
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const previewMilestones = loadMilestones(PREVIEW_DATA_PATH);
const nativeMilestones = loadMilestones(NATIVE_DATA_PATH);
const nativeById = new Map(nativeMilestones.map((milestone) => [milestone.id, milestone]));
const rows = [];

for (const preview of previewMilestones) {
    const native = nativeById.get(preview.id);
    if (!native) {
        rows.push({
            id: preview.id,
            archiveEventId: preview.archiveEventId || '',
            archiveVariantId: preview.archiveVariantId || '',
            diffs: [{ field: 'missing-native', group: 'displayCritical' }]
        });
        continue;
    }
    const diffs = compareMilestone(preview, native);
    if (diffs.length > 0) {
        rows.push({
            id: preview.id,
            archiveEventId: preview.archiveEventId || native.archiveEventId || '',
            archiveVariantId: preview.archiveVariantId || native.archiveVariantId || '',
            diffs
        });
    }
}

for (const native of nativeMilestones) {
    if (!previewMilestones.some((preview) => preview.id === native.id)) {
        rows.push({
            id: native.id,
            archiveEventId: native.archiveEventId || '',
            archiveVariantId: native.archiveVariantId || '',
            diffs: [{ field: 'extra-native', group: 'displayCritical' }]
        });
    }
}

const displayCriticalRows = rows.filter((row) => row.diffs.some((diff) => diff.group === 'displayCritical'));
const visibleStructuredRows = rows.filter((row) => row.diffs.some((diff) => diff.group === 'visibleStructured'));
const structuralCoverageRows = rows.filter((row) => row.diffs.some((diff) => diff.group === 'structuralCoverage'));
const fieldCounts = countByField(rows);
const displayCriticalFieldCounts = countByField(rows, (diff) => diff.group === 'displayCritical');
const visibleStructuredFieldCounts = countByField(rows, (diff) => diff.group === 'visibleStructured');
const structuralCoverageFieldCounts = countByField(rows, (diff) => diff.group === 'structuralCoverage');

const report = [];
report.push('# Archive Native Diff');
report.push('');
report.push(
    'Compares scaffold-based archive preview data with archive-native data generated directly from `archive/`.'
);
report.push('');
report.push('## Summary');
report.push('');
report.push(`- Scaffold archive preview milestones: ${previewMilestones.length}`);
report.push(`- Archive-native milestones: ${nativeMilestones.length}`);
report.push(`- Changed milestones: ${rows.length}`);
report.push(`- Display-critical changed milestones: ${displayCriticalRows.length}`);
report.push(`- Visible structured changed milestones: ${visibleStructuredRows.length}`);
report.push(`- Structural coverage changed milestones: ${structuralCoverageRows.length}`);
report.push(`- Changed fields: ${fieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`);
report.push(
    `- Display-critical fields: ${displayCriticalFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push(
    `- Visible structured fields: ${visibleStructuredFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push(
    `- Structural coverage fields: ${structuralCoverageFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push('');
report.push('## Changed milestones');
report.push('');
if (rows.length === 0) {
    report.push('None.');
} else {
    for (const row of rows.slice().sort((a, b) => b.diffs.length - a.diffs.length || a.id.localeCompare(b.id))) {
        report.push(`### ${row.id} — ${row.archiveEventId}/${row.archiveVariantId}`);
        report.push(`- Diffs: ${row.diffs.map((diff) => diff.field).join(', ')}`);
        report.push('');
    }
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${report.join('\n')}\n`, 'utf8');
fs.writeFileSync(
    JSON_REPORT_PATH,
    `${JSON.stringify(
        {
            previewCount: previewMilestones.length,
            nativeCount: nativeMilestones.length,
            changedCount: rows.length,
            displayCriticalChangedCount: displayCriticalRows.length,
            visibleStructuredChangedCount: visibleStructuredRows.length,
            structuralCoverageChangedCount: structuralCoverageRows.length,
            fieldCounts: Object.fromEntries(fieldCounts),
            displayCriticalFieldCounts: Object.fromEntries(displayCriticalFieldCounts),
            visibleStructuredFieldCounts: Object.fromEntries(visibleStructuredFieldCounts),
            structuralCoverageFieldCounts: Object.fromEntries(structuralCoverageFieldCounts),
            rows
        },
        null,
        2
    )}\n`,
    'utf8'
);

console.log(`Archive native diff: ${path.relative(ROOT, REPORT_PATH)}`);
console.log(`Archive native diff JSON: ${path.relative(ROOT, JSON_REPORT_PATH)}`);
console.log(`Changed milestones: ${rows.length}/${previewMilestones.length}`);
console.log(`Display-critical changed milestones: ${displayCriticalRows.length}`);
console.log(`Visible structured changed milestones: ${visibleStructuredRows.length}`);
console.log(`Structural coverage changed milestones: ${structuralCoverageRows.length}`);
console.log(`Changed fields: ${fieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`);
console.log(
    `Display-critical fields: ${displayCriticalFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
console.log(
    `Visible structured fields: ${visibleStructuredFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
console.log(
    `Structural coverage fields: ${structuralCoverageFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
