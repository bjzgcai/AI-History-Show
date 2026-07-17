#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const NORMAL_DATA_PATH = path.join(ROOT, 'milestones-data.js');
const PREVIEW_DATA_PATH = path.join(ROOT, '.tmp', 'archive-preview', 'milestones-data-archive-preview.js');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-preview-main-diff.md');
const JSON_REPORT_PATH = path.join(ROOT, 'reports', 'archive-preview-main-diff.json');

const DISPLAY_CRITICAL_FIELDS = new Set(['title', 'subtitle', 'description', 'images', 'visual', 'analysis']);
const VISIBLE_STRUCTURED_FIELDS = new Set(['sourceDisplay', 'commentaryDisplay', 'quizDisplay']);
const STRUCTURED_ARCHIVE_FIELDS = new Set(['sources', 'commentary', 'commentaryLabels', 'quizzes']);
const ACCEPTED_ARCHIVE_COMMENTARY_DISPLAY_IDS = new Set([
    'milestone-1958-wangs-algorithm',
    'milestone-1960-davis-putnam-dpll',
    'milestone-2014-adam',
    'milestone-1975-genetic-algorithm',
    'milestone-ai100-2012-alexnet',
    'milestone-ai100-2017-transformer'
]);

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

function visibleSourceSignature(source) {
    return {
        type: localize(source && source.type),
        label: localize(source && source.label),
        url: String((source && source.url) || '')
    };
}

function commentaryDisplaySignature(section) {
    return localize(section && section.html);
}

function commentaryLabelSignature(section) {
    return localize(section && section.label);
}

function quizDisplaySignature(quiz) {
    return {
        question: localize(quiz && quiz.question),
        options: list(quiz && quiz.options).map((option) => localize(option && option.text ? option.text : option)),
        answerIndex: typeof (quiz && quiz.answerIndex) === 'number' ? quiz.answerIndex : quiz && quiz.answer,
        explanation: localize(quiz && quiz.explanation)
    };
}

function diffGroup(field) {
    if (DISPLAY_CRITICAL_FIELDS.has(field)) return 'displayCritical';
    if (VISIBLE_STRUCTURED_FIELDS.has(field)) return 'visibleStructured';
    if (STRUCTURED_ARCHIVE_FIELDS.has(field)) return 'structuredArchive';
    return 'other';
}

function compareLocalized(name, normalValue, previewValue, diffs) {
    const normal = localize(normalValue);
    const preview = localize(previewValue);
    if (normal.zh !== preview.zh || normal.en !== preview.en) {
        diffs.push({ field: name, group: diffGroup(name), normal, preview });
    }
}

function compareMilestone(normal, preview) {
    const diffs = [];
    compareLocalized('title', normal.title, preview.title, diffs);
    compareLocalized('subtitle', normal.subtitle, preview.subtitle, diffs);
    compareLocalized('description', normal.description, preview.description, diffs);

    const normalImages = list(normal.resources && normal.resources.images);
    const previewImages = list(preview.resources && preview.resources.images);
    if (JSON.stringify(normalImages) !== JSON.stringify(previewImages)) {
        diffs.push({
            field: 'images',
            group: diffGroup('images'),
            normalCount: normalImages.length,
            previewCount: previewImages.length,
            decreased: previewImages.length < normalImages.length,
            increased: previewImages.length > normalImages.length,
            normal: normalImages,
            preview: previewImages
        });
    }

    const normalVisual = (normal.achievement && normal.achievement.visual) || '';
    const previewVisual = (preview.achievement && preview.achievement.visual) || '';
    if (normalVisual !== previewVisual) {
        diffs.push({ field: 'visual', group: diffGroup('visual'), normal: normalVisual, preview: previewVisual });
    }

    const normalSources = list(normal.achievement && normal.achievement.sources);
    const previewSources = list(preview.achievement && preview.achievement.sources);
    const normalSourceDisplay = normalSources.map(visibleSourceSignature);
    const previewSourceDisplay = previewSources.map(visibleSourceSignature);
    if (JSON.stringify(normalSourceDisplay) !== JSON.stringify(previewSourceDisplay)) {
        diffs.push({
            field: 'sourceDisplay',
            group: diffGroup('sourceDisplay'),
            normalCount: normalSources.length,
            previewCount: previewSources.length,
            decreased: previewSources.length < normalSources.length,
            increased: previewSources.length > normalSources.length,
            normal: normalSourceDisplay,
            preview: previewSourceDisplay
        });
    }
    const normalSourceStructure = normalSources.map(
        (source) => source && (source.id || source.url || JSON.stringify(source))
    );
    const previewSourceStructure = previewSources.map(
        (source) => source && (source.id || source.url || JSON.stringify(source))
    );
    if (JSON.stringify(normalSourceStructure) !== JSON.stringify(previewSourceStructure)) {
        diffs.push({
            field: 'sources',
            group: diffGroup('sources'),
            normalCount: normalSources.length,
            previewCount: previewSources.length,
            decreased: previewSources.length < normalSources.length,
            increased: previewSources.length > normalSources.length,
            normal: normalSourceStructure,
            preview: previewSourceStructure
        });
    }

    const normalCommentary = list(normal.commentarySections);
    const previewCommentary = list(preview.commentarySections);
    const normalCommentaryDisplay = normalCommentary.map(commentaryDisplaySignature);
    const previewCommentaryDisplay = previewCommentary.map(commentaryDisplaySignature);
    if (JSON.stringify(normalCommentaryDisplay) !== JSON.stringify(previewCommentaryDisplay)) {
        diffs.push({
            field: 'commentaryDisplay',
            group: diffGroup('commentaryDisplay'),
            normalCount: normalCommentary.length,
            previewCount: previewCommentary.length,
            decreased: previewCommentary.length < normalCommentary.length,
            increased: previewCommentary.length > normalCommentary.length
        });
    }
    const normalCommentaryLabels = normalCommentary.map(commentaryLabelSignature);
    const previewCommentaryLabels = previewCommentary.map(commentaryLabelSignature);
    if (JSON.stringify(normalCommentaryLabels) !== JSON.stringify(previewCommentaryLabels)) {
        diffs.push({
            field: 'commentaryLabels',
            group: diffGroup('commentaryLabels'),
            normalCount: normalCommentary.length,
            previewCount: previewCommentary.length,
            decreased: previewCommentary.length < normalCommentary.length,
            increased: previewCommentary.length > normalCommentary.length
        });
    }
    if (JSON.stringify(normalCommentary) !== JSON.stringify(previewCommentary)) {
        diffs.push({
            field: 'commentary',
            group: diffGroup('commentary'),
            normalCount: normalCommentary.length,
            previewCount: previewCommentary.length,
            decreased: previewCommentary.length < normalCommentary.length,
            increased: previewCommentary.length > normalCommentary.length
        });
    }

    const normalQuizzes = list(normal.quizzes);
    const previewQuizzes = list(preview.quizzes);
    const normalQuizDisplay = normalQuizzes.map(quizDisplaySignature);
    const previewQuizDisplay = previewQuizzes.map(quizDisplaySignature);
    if (JSON.stringify(normalQuizDisplay) !== JSON.stringify(previewQuizDisplay)) {
        diffs.push({
            field: 'quizDisplay',
            group: diffGroup('quizDisplay'),
            normalCount: normalQuizzes.length,
            previewCount: previewQuizzes.length,
            decreased: previewQuizzes.length < normalQuizzes.length,
            increased: previewQuizzes.length > normalQuizzes.length
        });
    }
    if (JSON.stringify(normalQuizzes) !== JSON.stringify(previewQuizzes)) {
        diffs.push({
            field: 'quizzes',
            group: diffGroup('quizzes'),
            normalCount: normalQuizzes.length,
            previewCount: previewQuizzes.length,
            decreased: previewQuizzes.length < normalQuizzes.length,
            increased: previewQuizzes.length > normalQuizzes.length
        });
    }

    const normalAnalysis = normal.analysis || null;
    const previewAnalysis = preview.analysis || null;
    if (JSON.stringify(normalAnalysis) !== JSON.stringify(previewAnalysis)) {
        diffs.push({
            field: 'analysis',
            group: diffGroup('analysis'),
            normal: Boolean(normalAnalysis),
            preview: Boolean(previewAnalysis)
        });
    }

    return diffs;
}

function summarizeDiff(diff) {
    if (
        diff.field === 'images' ||
        diff.field === 'sourceDisplay' ||
        diff.field === 'sources' ||
        diff.field === 'commentaryDisplay' ||
        diff.field === 'commentaryLabels' ||
        diff.field === 'commentary' ||
        diff.field === 'quizDisplay' ||
        diff.field === 'quizzes'
    ) {
        return `${diff.field} ${diff.normalCount}->${diff.previewCount}${diff.decreased ? ' decreased' : ''}${diff.increased ? ' increased' : ''}`;
    }
    if (diff.field === 'visual') return `visual ${diff.normal || '∅'}->${diff.preview || '∅'}`;
    if (diff.field === 'analysis') return `analysis ${diff.normal ? 'yes' : 'no'}->${diff.preview ? 'yes' : 'no'}`;
    return diff.field;
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

function countRowsWithGroup(rows, group) {
    return rows.filter((row) => row.diffs.some((diff) => diff.group === group)).length;
}

function isAcceptedArchiveCommentaryDiff(row, diff) {
    return diff.field === 'commentaryDisplay' && ACCEPTED_ARCHIVE_COMMENTARY_DISPLAY_IDS.has(row.id);
}

function activeVisibleDiffs(row) {
    return row.diffs.filter(
        (diff) => diff.group === 'visibleStructured' && !isAcceptedArchiveCommentaryDiff(row, diff)
    );
}

function acceptedVisibleDiffs(row) {
    return row.diffs.filter((diff) => diff.group === 'visibleStructured' && isAcceptedArchiveCommentaryDiff(row, diff));
}

function countActiveVisibleFields(rows) {
    const counts = new Map();
    for (const row of rows) {
        for (const diff of activeVisibleDiffs(row)) counts.set(diff.field, (counts.get(diff.field) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function loadMilestones(filePath) {
    delete require.cache[require.resolve(filePath)];
    return require(filePath).milestones;
}

function sectionForRows(report, title, rows, options = {}) {
    report.push(`## ${title}`);
    report.push('');
    if (rows.length === 0) {
        report.push('None.');
        report.push('');
        return;
    }

    for (const row of rows) {
        const diffs = options.diffFilter
            ? row.diffs.filter((diff) => options.diffFilter(row, diff))
            : options.group
              ? row.diffs.filter((diff) => diff.group === options.group)
              : row.diffs;
        report.push(`### ${row.id} — ${row.archiveEventId}/${row.archiveVariantId}`);
        report.push('');
        if (row.title.zh !== row.previewTitle.zh || row.title.en !== row.previewTitle.en) {
            report.push(`- Title zh: ${row.title.zh} → ${row.previewTitle.zh}`);
            report.push(`- Title en: ${row.title.en} → ${row.previewTitle.en}`);
        }
        report.push(`- Diffs: ${diffs.map(summarizeDiff).join('; ')}`);
        report.push('');
    }
}

const normalMilestones = loadMilestones(NORMAL_DATA_PATH);
const previewMilestones = loadMilestones(PREVIEW_DATA_PATH);
const previewById = new Map(previewMilestones.map((milestone) => [milestone.id, milestone]));
const rows = [];

for (const normal of normalMilestones) {
    const preview = previewById.get(normal.id);
    if (!preview) {
        rows.push({
            id: normal.id,
            archiveEventId: normal.archiveEventId || '',
            archiveVariantId: normal.archiveVariantId || '',
            title: localize(normal.title),
            previewTitle: { zh: '', en: '' },
            diffs: [{ field: 'missing-preview', group: 'displayCritical' }]
        });
        continue;
    }

    const diffs = compareMilestone(normal, preview);
    if (diffs.length > 0) {
        rows.push({
            id: normal.id,
            archiveEventId: preview.archiveEventId || normal.archiveEventId || '',
            archiveVariantId: preview.archiveVariantId || normal.archiveVariantId || '',
            title: localize(normal.title),
            previewTitle: localize(preview.title),
            diffs
        });
    }
}

const fieldCounts = countByField(rows);
const displayCriticalFieldCounts = countByField(rows, (diff) => diff.group === 'displayCritical');
const visibleStructuredFieldCounts = countByField(rows, (diff) => diff.group === 'visibleStructured');
const activeVisibleStructuredFieldCounts = countActiveVisibleFields(rows);
const structuredArchiveFieldCounts = countByField(rows, (diff) => diff.group === 'structuredArchive');
const displayCriticalRows = rows.filter((row) => row.diffs.some((diff) => diff.group === 'displayCritical'));
const visibleStructuredRows = rows.filter((row) => row.diffs.some((diff) => diff.group === 'visibleStructured'));
const activeVisibleStructuredRows = rows.filter((row) => activeVisibleDiffs(row).length > 0);
const acceptedArchiveCommentaryRows = rows.filter((row) => acceptedVisibleDiffs(row).length > 0);
const structuredArchiveRows = rows.filter((row) => row.diffs.some((diff) => diff.group === 'structuredArchive'));
const imageDecreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'images' && diff.decreased));
const imageIncreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'images' && diff.increased));
const sourceDecreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'sources' && diff.decreased));
const sourceIncreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'sources' && diff.increased));
const commentaryDecreases = rows.filter((row) =>
    row.diffs.some((diff) => diff.field === 'commentary' && diff.decreased)
);
const commentaryIncreases = rows.filter((row) =>
    row.diffs.some((diff) => diff.field === 'commentary' && diff.increased)
);
const quizDecreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'quizzes' && diff.decreased));
const quizIncreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'quizzes' && diff.increased));
const sortedRows = rows.slice().sort((a, b) => b.diffs.length - a.diffs.length || a.id.localeCompare(b.id));
const sortedDisplayCriticalRows = displayCriticalRows
    .slice()
    .sort((a, b) => b.diffs.length - a.diffs.length || a.id.localeCompare(b.id));
const sortedVisibleStructuredRows = visibleStructuredRows
    .slice()
    .sort((a, b) => b.diffs.length - a.diffs.length || a.id.localeCompare(b.id));
const sortedActiveVisibleStructuredRows = activeVisibleStructuredRows
    .slice()
    .sort((a, b) => activeVisibleDiffs(b).length - activeVisibleDiffs(a).length || a.id.localeCompare(b.id));
const sortedAcceptedArchiveCommentaryRows = acceptedArchiveCommentaryRows
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
const sortedStructuredArchiveRows = structuredArchiveRows
    .slice()
    .sort((a, b) => b.diffs.length - a.diffs.length || a.id.localeCompare(b.id));

const report = [];
report.push('# Main Exhibit Archive Preview Diff');
report.push('');
report.push(
    'Compares normal `milestones-data.js` with forced archive presentation preview `milestones-data-archive-preview.js`.'
);
report.push('');
report.push('The report separates display-critical differences from structured archive object differences:');
report.push('');
report.push('- Display-critical: `title`, `subtitle`, `description`, `images`, `visual`, `analysis`.');
report.push('- Visible structured: rendered `sources`, `commentary` body text, or `quizzes` text/counts.');
report.push(
    '- Structured archive objects: archive-only ids/provenance fields and non-rendered labels inside `sources`, `commentary`, `commentaryLabels`, `quizzes`.'
);
report.push('');
report.push('## Summary');
report.push('');
report.push(`- Normal milestones: ${normalMilestones.length}`);
report.push(`- Archive preview milestones: ${previewMilestones.length}`);
report.push(`- Changed milestones: ${rows.length}`);
report.push(`- Display-critical changed milestones: ${displayCriticalRows.length}`);
report.push(`- Visible structured changed milestones: ${visibleStructuredRows.length}`);
report.push(`- Active visible structured changed milestones: ${activeVisibleStructuredRows.length}`);
report.push(`- Accepted archive commentary differences: ${acceptedArchiveCommentaryRows.length}`);
report.push(`- Structured archive changed milestones: ${structuredArchiveRows.length}`);
report.push(`- Image decreases: ${imageDecreases.length}`);
report.push(`- Image increases: ${imageIncreases.length}`);
report.push(`- Source decreases: ${sourceDecreases.length}`);
report.push(`- Source increases: ${sourceIncreases.length}`);
report.push(`- Commentary decreases: ${commentaryDecreases.length}`);
report.push(`- Commentary increases: ${commentaryIncreases.length}`);
report.push(`- Quiz decreases: ${quizDecreases.length}`);
report.push(`- Quiz increases: ${quizIncreases.length}`);
const changedFieldSummary = fieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none';
report.push(`- Changed fields: ${changedFieldSummary}`);
report.push(
    `- Display-critical fields: ${displayCriticalFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push(
    `- Visible structured fields: ${visibleStructuredFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push(
    `- Active visible structured fields: ${activeVisibleStructuredFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push(
    `- Structured archive fields: ${structuredArchiveFieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ') || 'none'}`
);
report.push('');
report.push('## Display-critical differences');
report.push('');
if (displayCriticalRows.length === 0) {
    report.push('None.');
} else {
    report.push(
        'These differences can affect visible presentation and should be reviewed before archive-native generation becomes default.'
    );
    report.push('');
}
report.push('');
if (displayCriticalRows.length > 0)
    sectionForRows(report, 'Display-critical changed milestones', sortedDisplayCriticalRows, {
        group: 'displayCritical'
    });
report.push('## Decreases');
report.push('');
report.push(`- Image decreases: ${imageDecreases.length}`);
report.push(`- Image increases: ${imageIncreases.length}`);
report.push(`- Source decreases: ${sourceDecreases.length}`);
report.push(`- Source increases: ${sourceIncreases.length}`);
report.push(`- Commentary decreases: ${commentaryDecreases.length}`);
report.push(`- Commentary increases: ${commentaryIncreases.length}`);
report.push(`- Quiz decreases: ${quizDecreases.length}`);
report.push(`- Quiz increases: ${quizIncreases.length}`);
report.push('');
report.push('## Visible structured differences');
report.push('');
if (visibleStructuredRows.length === 0) {
    report.push('None.');
} else {
    report.push(
        'These differences can affect rendered source labels, commentary body text, or quiz text even when counts do not decrease.'
    );
}
report.push('');
sectionForRows(report, 'Visible structured changed milestones', sortedVisibleStructuredRows, {
    group: 'visibleStructured'
});
report.push('## Active visible structured differences');
report.push('');
if (activeVisibleStructuredRows.length === 0) {
    report.push('None.');
} else {
    report.push('These differences still need review after excluding accepted archive-native commentary text.');
}
report.push('');
sectionForRows(report, 'Active visible structured changed milestones', sortedActiveVisibleStructuredRows, {
    diffFilter: (row, diff) => activeVisibleDiffs(row).includes(diff)
});
report.push('## Accepted archive commentary differences');
report.push('');
if (acceptedArchiveCommentaryRows.length === 0) {
    report.push('None.');
} else {
    report.push(
        'These commentary body differences are intentionally kept because archive-native historical commentary is preferred over legacy generated template sentences.'
    );
}
report.push('');
sectionForRows(report, 'Accepted archive commentary changed milestones', sortedAcceptedArchiveCommentaryRows, {
    diffFilter: (row, diff) => acceptedVisibleDiffs(row).includes(diff)
});
report.push('## Structured archive object differences');
report.push('');
if (structuredArchiveRows.length === 0) {
    report.push('None.');
} else {
    report.push(
        'These differences indicate archive objects replacing legacy objects while preserving counts. They are expected during archive migration if display-critical fields and decrease counts stay clean.'
    );
}
report.push('');
sectionForRows(report, 'Structured archive changed milestones', sortedStructuredArchiveRows, {
    group: 'structuredArchive'
});
sectionForRows(report, 'All changed milestones', sortedRows);

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${report.join('\n')}\n`, 'utf8');
fs.writeFileSync(
    JSON_REPORT_PATH,
    `${JSON.stringify(
        {
            normalCount: normalMilestones.length,
            previewCount: previewMilestones.length,
            changedCount: rows.length,
            displayCriticalChangedCount: displayCriticalRows.length,
            activeVisibleStructuredChangedCount: activeVisibleStructuredRows.length,
            acceptedArchiveCommentaryChangedCount: acceptedArchiveCommentaryRows.length,
            structuredArchiveChangedCount: structuredArchiveRows.length,
            fieldCounts: Object.fromEntries(fieldCounts),
            displayCriticalFieldCounts: Object.fromEntries(displayCriticalFieldCounts),
            visibleStructuredFieldCounts: Object.fromEntries(visibleStructuredFieldCounts),
            activeVisibleStructuredFieldCounts: Object.fromEntries(activeVisibleStructuredFieldCounts),
            structuredArchiveFieldCounts: Object.fromEntries(structuredArchiveFieldCounts),
            imageDecreaseCount: imageDecreases.length,
            imageIncreaseCount: imageIncreases.length,
            sourceDecreaseCount: sourceDecreases.length,
            sourceIncreaseCount: sourceIncreases.length,
            commentaryDecreaseCount: commentaryDecreases.length,
            commentaryIncreaseCount: commentaryIncreases.length,
            quizDecreaseCount: quizDecreases.length,
            quizIncreaseCount: quizIncreases.length,
            rows,
            displayCriticalRowIds: displayCriticalRows.map((row) => row.id),
            visibleStructuredRowIds: visibleStructuredRows.map((row) => row.id),
            activeVisibleStructuredRowIds: activeVisibleStructuredRows.map((row) => row.id),
            acceptedArchiveCommentaryRowIds: acceptedArchiveCommentaryRows.map((row) => row.id),
            structuredArchiveRowIds: structuredArchiveRows.map((row) => row.id)
        },
        null,
        2
    )}\n`,
    'utf8'
);

console.log(`Archive preview diff: ${path.relative(ROOT, REPORT_PATH)}`);
console.log(`Archive preview diff JSON: ${path.relative(ROOT, JSON_REPORT_PATH)}`);
console.log(`Changed milestones: ${rows.length}/${normalMilestones.length}`);
console.log(`Display-critical changed milestones: ${countRowsWithGroup(rows, 'displayCritical')}`);
console.log(`Visible structured changed milestones: ${countRowsWithGroup(rows, 'visibleStructured')}`);
console.log(`Active visible structured changed milestones: ${activeVisibleStructuredRows.length}`);
console.log(`Accepted archive commentary differences: ${acceptedArchiveCommentaryRows.length}`);
console.log(`Structured archive changed milestones: ${countRowsWithGroup(rows, 'structuredArchive')}`);
console.log(`Changed fields: ${fieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`);
console.log(
    `Display-critical fields: ${displayCriticalFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
console.log(
    `Visible structured fields: ${visibleStructuredFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
console.log(
    `Active visible structured fields: ${activeVisibleStructuredFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
console.log(
    `Structured archive fields: ${structuredArchiveFieldCounts.map(([field, count]) => `${field}:${count}`).join(', ') || 'none'}`
);
console.log(`Image decreases: ${imageDecreases.length}`);
console.log(`Image increases: ${imageIncreases.length}`);
console.log(`Source decreases: ${sourceDecreases.length}`);
console.log(`Source increases: ${sourceIncreases.length}`);
console.log(`Commentary decreases: ${commentaryDecreases.length}`);
console.log(`Commentary increases: ${commentaryIncreases.length}`);
console.log(`Quiz decreases: ${quizDecreases.length}`);
console.log(`Quiz increases: ${quizIncreases.length}`);
