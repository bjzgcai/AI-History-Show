#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildArchivePreview } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-build-diff.md');
const SNAPSHOT_PATH = path.join(ROOT, 'reports', 'archive-review-snapshot.json');
const GENERATED_DATA = path.join(ROOT, 'milestones-data.js');

function localize(value, locale) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value == null ? '' : String(value);
    return value[locale] || value.zh || value.en || '';
}

function compact(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function imageList(milestone) {
    return milestone && milestone.resources && Array.isArray(milestone.resources.images)
        ? milestone.resources.images
        : [];
}

function sourceList(milestone) {
    return milestone && milestone.achievement && Array.isArray(milestone.achievement.sources)
        ? milestone.achievement.sources
        : [];
}

function sourceSignature(source) {
    return {
        labelZh: compact(localize(source && source.label, 'zh')),
        labelEn: compact(localize(source && source.label, 'en')),
        url: (source && source.url) || '',
        type: (source && (source.sourceType || source.type)) || ''
    };
}

function quizList(milestone) {
    return Array.isArray(milestone && milestone.quizzes) ? milestone.quizzes : [];
}

function commentaryList(milestone) {
    return Array.isArray(milestone && milestone.commentarySections) ? milestone.commentarySections : [];
}

function visualOf(milestone) {
    return (milestone && milestone.achievement && milestone.achievement.visual) || '';
}

function compareText(label, legacyValue, finalValue) {
    const legacyZh = compact(localize(legacyValue, 'zh'));
    const finalZh = compact(localize(finalValue, 'zh'));
    const legacyEn = compact(localize(legacyValue, 'en'));
    const finalEn = compact(localize(finalValue, 'en'));
    return {
        label,
        same: legacyZh === finalZh && legacyEn === finalEn,
        legacy: { zh: legacyZh, en: legacyEn },
        final: { zh: finalZh, en: finalEn }
    };
}

function compareJson(label, legacyValue, finalValue) {
    return {
        label,
        same: JSON.stringify(legacyValue) === JSON.stringify(finalValue),
        legacy: legacyValue,
        final: finalValue
    };
}

function presentationComparisons(legacy, final) {
    return [
        compareText('Title', legacy.title, final.title),
        compareText('Subtitle', legacy.subtitle, final.subtitle),
        compareText('Description', legacy.description, final.description),
        compareJson('Images', imageList(legacy), imageList(final)),
        compareJson('Sources', sourceList(legacy).map(sourceSignature), sourceList(final).map(sourceSignature)),
        compareJson('Visual', visualOf(legacy), visualOf(final)),
        compareJson(
            'Commentary',
            commentaryList(legacy).map((section) => ({
                label: { zh: compact(localize(section.label, 'zh')), en: compact(localize(section.label, 'en')) }
            })),
            commentaryList(final).map((section) => ({
                label: { zh: compact(localize(section.label, 'zh')), en: compact(localize(section.label, 'en')) }
            }))
        ),
        compareJson(
            'Quizzes',
            quizList(legacy).map((quiz) => ({
                id: quiz.id || '',
                question: { zh: compact(localize(quiz.question, 'zh')), en: compact(localize(quiz.question, 'en')) }
            })),
            quizList(final).map((quiz) => ({
                id: quiz.id || '',
                question: { zh: compact(localize(quiz.question, 'zh')), en: compact(localize(quiz.question, 'en')) }
            }))
        )
    ];
}

function modeOf(row) {
    return (
        row.archivePresentationMode ||
        (row.rawArchivePreview && row.rawArchivePreview.archivePresentationMode) ||
        'preserve-legacy'
    );
}

function previewCoverage(preview, rows) {
    delete require.cache[require.resolve(GENERATED_DATA)];
    const { milestones } = require(GENERATED_DATA);
    const previewIds = preview.milestones.map((milestone) => milestone.id).filter(Boolean);
    const generatedIds = milestones.map((milestone) => milestone.id).filter(Boolean);
    const previewCounts = new Map();
    const rowCounts = new Map();

    for (const id of previewIds) previewCounts.set(id, (previewCounts.get(id) || 0) + 1);
    for (const row of rows) {
        if (row && row.id) rowCounts.set(row.id, (rowCounts.get(row.id) || 0) + 1);
    }

    const generatedIdSet = new Set(generatedIds);
    const previewIdSet = new Set(previewIds);
    const rowIdSet = new Set([...rowCounts.keys()]);

    return {
        generatedCount: generatedIds.length,
        previewCount: previewIds.length,
        previewUniqueCount: previewIdSet.size,
        snapshotRowCount: rows.length,
        duplicatePreviewIds: [...previewCounts].filter(([, count]) => count > 1),
        duplicateSnapshotIds: [...rowCounts].filter(([, count]) => count > 1),
        previewIdsMissingGeneratedTarget: [...previewIdSet].filter(
            (id) => !id.startsWith('archive-preview-') && !generatedIdSet.has(id)
        ),
        generatedIdsMissingPreview: generatedIds.filter((id) => !previewIdSet.has(id)),
        generatedIdsMissingSnapshot: generatedIds.filter((id) => !rowIdSet.has(id))
    };
}

function appendCoverageSection(lines, coverage) {
    lines.push('## Coverage result');
    lines.push('');
    lines.push(`- Generated milestones: ${coverage.generatedCount}`);
    lines.push(`- Archive preview targets: ${coverage.previewCount}`);
    lines.push(`- Unique archive preview target ids: ${coverage.previewUniqueCount}`);
    lines.push(`- Snapshot rows: ${coverage.snapshotRowCount}`);
    lines.push(`- Duplicate preview target ids: ${coverage.duplicatePreviewIds.length}`);
    lines.push(`- Duplicate snapshot target ids: ${coverage.duplicateSnapshotIds.length}`);
    lines.push(`- Preview ids missing generated target: ${coverage.previewIdsMissingGeneratedTarget.length}`);
    lines.push(`- Generated ids missing archive preview: ${coverage.generatedIdsMissingPreview.length}`);
    lines.push(`- Generated ids missing snapshot row: ${coverage.generatedIdsMissingSnapshot.length}`);
    lines.push('');

    const details = [
        ['Duplicate preview target ids', coverage.duplicatePreviewIds.map(([id, count]) => `${id} x${count}`)],
        ['Duplicate snapshot target ids', coverage.duplicateSnapshotIds.map(([id, count]) => `${id} x${count}`)],
        ['Preview ids missing generated target', coverage.previewIdsMissingGeneratedTarget],
        ['Generated ids missing archive preview', coverage.generatedIdsMissingPreview],
        ['Generated ids missing snapshot row', coverage.generatedIdsMissingSnapshot]
    ];
    for (const [title, values] of details) {
        if (values.length === 0) continue;
        lines.push(`### ${title}`);
        lines.push('');
        for (const value of values) lines.push(`- \`${value}\``);
        lines.push('');
    }
}

function coverageHasFailures(coverage) {
    return (
        coverage.duplicatePreviewIds.length > 0 ||
        coverage.duplicateSnapshotIds.length > 0 ||
        coverage.previewIdsMissingGeneratedTarget.length > 0 ||
        coverage.generatedIdsMissingPreview.length > 0 ||
        coverage.generatedIdsMissingSnapshot.length > 0
    );
}

function writeMissingSnapshotReport(preview) {
    const lines = [
        '# Archive Build Diff',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
        'Run `npm run generate` before `npm run diff:archive` so `reports/archive-review-snapshot.json` contains legacy and final snapshots.',
        '',
        '## Summary',
        '',
        `- Archive preview milestones: ${preview.milestones.length}`,
        `- Archive preview errors: ${preview.errors.length}`,
        '- Status: missing review snapshot',
        ''
    ];
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`);
}

function main() {
    const preview = buildArchivePreview(ROOT);
    if (!fs.existsSync(SNAPSHOT_PATH)) {
        writeMissingSnapshotReport(preview);
        console.error('Archive diff requires reports/archive-review-snapshot.json. Run npm run generate first.');
        process.exitCode = 1;
        return;
    }

    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    const rows = Array.isArray(snapshot.rows) ? snapshot.rows : [];
    const coverage = previewCoverage(preview, rows);
    const unexpected = [];
    const intentional = [];
    const same = [];

    const lines = [];
    lines.push('# Archive Build Diff');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('This report compares legacy snapshots with generated final milestones after archive overlay.');
    lines.push(
        'Archive migration defaults to `presentationMode: preserve-legacy`, so user-visible presentation changes are failures unless a variant explicitly sets `presentationMode: archive`.'
    );
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Archive preview milestones: ${preview.milestones.length}`);
    lines.push(`- Snapshot rows: ${rows.length}`);
    lines.push(`- Archive preview errors: ${preview.errors.length}`);
    lines.push(`- Duplicate preview target ids: ${coverage.duplicatePreviewIds.length}`);
    lines.push(`- Generated ids missing archive preview: ${coverage.generatedIdsMissingPreview.length}`);
    lines.push(`- Generated ids missing snapshot row: ${coverage.generatedIdsMissingSnapshot.length}`);
    lines.push('');

    for (const row of rows) {
        lines.push(`## ${row.archiveEventId} / ${row.archiveVariantId} / ${row.storylineId}`);
        lines.push('');
        lines.push(`- Target milestone id: \`${row.id || ''}\``);
        lines.push(`- Presentation mode: \`${modeOf(row)}\``);
        if (!row.legacy || !row.final) {
            lines.push(`- Status: skipped (${row.reason || 'no legacy/final snapshot'})`);
            lines.push('');
            continue;
        }

        const changed = presentationComparisons(row.legacy, row.final).filter((comparison) => !comparison.same);
        if (changed.length === 0) {
            same.push(row);
            lines.push('- Status: same');
            lines.push('');
            continue;
        }

        const intentionalChange = modeOf(row) === 'archive';
        const bucket = intentionalChange ? intentional : unexpected;
        bucket.push({ row, changed });
        lines.push(`- Status: ${intentionalChange ? 'changed intentionally' : 'changed unexpectedly'}`);
        for (const comparison of changed) {
            lines.push(`- ${comparison.label}: changed`);
            if (
                comparison.label === 'Images' ||
                comparison.label === 'Sources' ||
                comparison.label === 'Quizzes' ||
                comparison.label === 'Commentary'
            ) {
                lines.push(`  - Legacy count: ${Array.isArray(comparison.legacy) ? comparison.legacy.length : 0}`);
                lines.push(`  - Final count: ${Array.isArray(comparison.final) ? comparison.final.length : 0}`);
            } else if (
                comparison.label === 'Title' ||
                comparison.label === 'Subtitle' ||
                comparison.label === 'Description'
            ) {
                lines.push(`  - Legacy zh: ${comparison.legacy.zh}`);
                lines.push(`  - Final zh: ${comparison.final.zh}`);
                lines.push(`  - Legacy en: ${comparison.legacy.en}`);
                lines.push(`  - Final en: ${comparison.final.en}`);
            } else {
                lines.push(`  - Legacy: ${JSON.stringify(comparison.legacy)}`);
                lines.push(`  - Final: ${JSON.stringify(comparison.final)}`);
            }
        }
        lines.push('');
    }

    lines.push('## Presentation result');
    lines.push('');
    lines.push(`- Same presentation rows: ${same.length}`);
    lines.push(`- Intentional presentation changes: ${intentional.length}`);
    lines.push(`- Unexpected presentation changes: ${unexpected.length}`);
    lines.push('');
    appendCoverageSection(lines, coverage);

    if (preview.errors.length > 0) {
        lines.push('## Preview errors');
        lines.push('');
        for (const error of preview.errors) lines.push(`- \`${error.storylineId}\`: ${error.message}`);
        lines.push('');
    }

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`);
    console.log(`Archive build diff: ${path.relative(ROOT, REPORT_PATH)}`);
    if (coverageHasFailures(coverage)) {
        console.error('Archive diff found target coverage issue(s).');
        process.exitCode = 1;
    }
    if (unexpected.length > 0) {
        console.error(`Archive diff found ${unexpected.length} unexpected presentation change(s).`);
        process.exitCode = 1;
    }
}

main();
