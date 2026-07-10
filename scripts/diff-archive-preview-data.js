#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const NORMAL_DATA_PATH = path.join(ROOT, 'milestones-data.js');
const PREVIEW_DATA_PATH = path.join(ROOT, 'milestones-data-archive-preview.js');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-preview-main-diff.md');
const JSON_REPORT_PATH = path.join(ROOT, 'reports', 'archive-preview-main-diff.json');

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

function sourceKey(source) {
    return source && (source.id || source.url || JSON.stringify(source));
}

function compareLocalized(name, normalValue, previewValue, diffs) {
    const normal = localize(normalValue);
    const preview = localize(previewValue);
    if (normal.zh !== preview.zh || normal.en !== preview.en) {
        diffs.push({ field: name, normal, preview });
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
            normalCount: normalImages.length,
            previewCount: previewImages.length,
            decreased: previewImages.length < normalImages.length,
            normal: normalImages,
            preview: previewImages
        });
    }

    const normalVisual = (normal.achievement && normal.achievement.visual) || '';
    const previewVisual = (preview.achievement && preview.achievement.visual) || '';
    if (normalVisual !== previewVisual) {
        diffs.push({ field: 'visual', normal: normalVisual, preview: previewVisual });
    }

    const normalSources = list(normal.achievement && normal.achievement.sources).map(sourceKey);
    const previewSources = list(preview.achievement && preview.achievement.sources).map(sourceKey);
    if (JSON.stringify(normalSources) !== JSON.stringify(previewSources)) {
        diffs.push({
            field: 'sources',
            normalCount: normalSources.length,
            previewCount: previewSources.length,
            decreased: previewSources.length < normalSources.length,
            normal: normalSources,
            preview: previewSources
        });
    }

    const normalCommentary = list(normal.commentarySections);
    const previewCommentary = list(preview.commentarySections);
    if (JSON.stringify(normalCommentary) !== JSON.stringify(previewCommentary)) {
        diffs.push({
            field: 'commentary',
            normalCount: normalCommentary.length,
            previewCount: previewCommentary.length,
            decreased: previewCommentary.length < normalCommentary.length
        });
    }

    const normalQuizzes = list(normal.quizzes);
    const previewQuizzes = list(preview.quizzes);
    if (JSON.stringify(normalQuizzes) !== JSON.stringify(previewQuizzes)) {
        diffs.push({
            field: 'quizzes',
            normalCount: normalQuizzes.length,
            previewCount: previewQuizzes.length,
            decreased: previewQuizzes.length < normalQuizzes.length
        });
    }

    const normalAnalysis = normal.analysis || null;
    const previewAnalysis = preview.analysis || null;
    if (JSON.stringify(normalAnalysis) !== JSON.stringify(previewAnalysis)) {
        diffs.push({
            field: 'analysis',
            normal: Boolean(normalAnalysis),
            preview: Boolean(previewAnalysis)
        });
    }

    return diffs;
}

function summarizeDiff(diff) {
    if (
        diff.field === 'images' ||
        diff.field === 'sources' ||
        diff.field === 'commentary' ||
        diff.field === 'quizzes'
    ) {
        return `${diff.field} ${diff.normalCount}->${diff.previewCount}${diff.decreased ? ' decreased' : ''}`;
    }
    if (diff.field === 'visual') return `visual ${diff.normal || '∅'}->${diff.preview || '∅'}`;
    if (diff.field === 'analysis') return `analysis ${diff.normal ? 'yes' : 'no'}->${diff.preview ? 'yes' : 'no'}`;
    return diff.field;
}

function countByField(rows) {
    const counts = new Map();
    for (const row of rows) {
        for (const diff of row.diffs) counts.set(diff.field, (counts.get(diff.field) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function loadMilestones(filePath) {
    delete require.cache[require.resolve(filePath)];
    return require(filePath).milestones;
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
            diffs: [{ field: 'missing-preview' }]
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
const imageDecreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'images' && diff.decreased));
const sourceDecreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'sources' && diff.decreased));
const commentaryDecreases = rows.filter((row) =>
    row.diffs.some((diff) => diff.field === 'commentary' && diff.decreased)
);
const quizDecreases = rows.filter((row) => row.diffs.some((diff) => diff.field === 'quizzes' && diff.decreased));
const sortedRows = rows.slice().sort((a, b) => b.diffs.length - a.diffs.length || a.id.localeCompare(b.id));

const report = [];
report.push('# Main Exhibit Archive Preview Diff');
report.push('');
report.push(
    'Compares normal `milestones-data.js` with forced archive presentation preview `milestones-data-archive-preview.js`.'
);
report.push('');
report.push('## Summary');
report.push('');
report.push(`- Normal milestones: ${normalMilestones.length}`);
report.push(`- Archive preview milestones: ${previewMilestones.length}`);
report.push(`- Changed milestones: ${rows.length}`);
report.push(`- Image decreases: ${imageDecreases.length}`);
report.push(`- Source decreases: ${sourceDecreases.length}`);
report.push(`- Commentary decreases: ${commentaryDecreases.length}`);
report.push(`- Quiz decreases: ${quizDecreases.length}`);
report.push(`- Changed fields: ${fieldCounts.map(([field, count]) => `${field}: ${count}`).join(', ')}`);
report.push('');
report.push('## Image decreases');
report.push('');
if (imageDecreases.length === 0) {
    report.push('None.');
} else {
    for (const row of imageDecreases) {
        const imageDiff = row.diffs.find((diff) => diff.field === 'images');
        report.push(
            `- ${row.id} (${row.archiveEventId}/${row.archiveVariantId}) ${imageDiff.normalCount}->${imageDiff.previewCount}`
        );
    }
}
report.push('');
report.push('## Changed milestones');
report.push('');
for (const row of sortedRows) {
    report.push(`### ${row.id} — ${row.archiveEventId}/${row.archiveVariantId}`);
    report.push('');
    if (row.title.zh !== row.previewTitle.zh || row.title.en !== row.previewTitle.en) {
        report.push(`- Title zh: ${row.title.zh} → ${row.previewTitle.zh}`);
        report.push(`- Title en: ${row.title.en} → ${row.previewTitle.en}`);
    }
    report.push(`- Diffs: ${row.diffs.map(summarizeDiff).join('; ')}`);
    report.push('');
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${report.join('\n')}\n`, 'utf8');
fs.writeFileSync(
    JSON_REPORT_PATH,
    `${JSON.stringify(
        {
            normalCount: normalMilestones.length,
            previewCount: previewMilestones.length,
            changedCount: rows.length,
            fieldCounts: Object.fromEntries(fieldCounts),
            imageDecreaseCount: imageDecreases.length,
            sourceDecreaseCount: sourceDecreases.length,
            commentaryDecreaseCount: commentaryDecreases.length,
            quizDecreaseCount: quizDecreases.length,
            rows
        },
        null,
        2
    )}\n`,
    'utf8'
);

console.log(`Archive preview diff: ${path.relative(ROOT, REPORT_PATH)}`);
console.log(`Archive preview diff JSON: ${path.relative(ROOT, JSON_REPORT_PATH)}`);
console.log(`Changed milestones: ${rows.length}/${normalMilestones.length}`);
console.log(`Changed fields: ${fieldCounts.map(([field, count]) => `${field}:${count}`).join(', ')}`);
console.log(`Image decreases: ${imageDecreases.length}`);
console.log(`Source decreases: ${sourceDecreases.length}`);
console.log(`Commentary decreases: ${commentaryDecreases.length}`);
console.log(`Quiz decreases: ${quizDecreases.length}`);
