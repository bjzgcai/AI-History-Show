#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'reports', 'archive-parity', 'data');
const LEGACY_PATH = path.join(DATA_DIR, 'milestones-data-legacy.js');
const ARCHIVE_PATH = path.join(DATA_DIR, 'milestones-data-archive.js');
const JSON_PATH = path.join(ROOT, 'reports', 'archive-parity', 'data-diff.json');
const MARKDOWN_PATH = path.join(ROOT, 'reports', 'archive-parity', 'data-diff.md');
const VIEW_SCRIPT = fs.readFileSync(path.join(ROOT, 'shared', 'milestone-view.js'), 'utf8');

function load(filePath) {
    delete require.cache[require.resolve(filePath)];
    return require(filePath).milestones || [];
}

function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(
                    ([key]) =>
                        ![
                            'archive',
                            'archiveEventId',
                            'archiveVariantId',
                            'archivePresentationMode',
                            'sourceKind'
                        ].includes(key)
                )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, item]) => [key, stable(item)])
        );
    }
    return value === undefined ? null : value;
}

function same(left, right) {
    return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function pick(object, pathValue) {
    return pathValue.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function storylineId(milestone) {
    const storyline = milestone && milestone.storyline;
    if (typeof storyline === 'string') return storyline || 'deep-learning';
    return (storyline && storyline.id) || 'deep-learning';
}

function createViewNormalizer(locale) {
    const context = { window: {} };
    context.window.I18n = {
        t: (key) => key,
        localize: (value) =>
            value && typeof value === 'object' && !Array.isArray(value)
                ? (value[locale] ?? value.en ?? value.zh ?? '')
                : (value ?? '')
    };
    vm.createContext(context);
    vm.runInContext(VIEW_SCRIPT, context);
    return context.window.MilestoneView.normalizeMilestone;
}

function viewSignature(milestone, index, milestones, locale) {
    const normalize = createViewNormalizer(locale);
    const view = normalize(milestone, index, milestones);
    return {
        year: view.year,
        title: view.title,
        category: view.category,
        subtitle: view.subtitle,
        location: view.location,
        descriptionHtml: view.descriptionHtml,
        figures: view.figures,
        photos: view.photos,
        primaryVideo: view.primaryVideo,
        quoteHtml: view.quoteHtml,
        quoteAttribution: view.quoteAttribution,
        quoteLabel: view.quoteLabel,
        quotePage: view.quotePage,
        commentarySections: view.commentarySections,
        quizzes: view.quizzes
    };
}

const FIELDS = [
    'year',
    'date',
    'title',
    'subtitle',
    'category',
    'location',
    'description',
    'figures',
    'resources.images',
    'photos',
    'resources.videos',
    'imageMeta',
    'videoUrl',
    'quote',
    'quoteText',
    'quoteHtml',
    'quoteMeta',
    'quotePage',
    'quoteAttribution',
    'quoteLabel',
    'achievement.visual',
    'achievement.visualModules',
    'achievement.area',
    'achievement.method',
    'achievement.artifact',
    'achievement.material',
    'achievement.demo',
    'achievement.keyConcepts',
    'achievement.relatedAchievements',
    'achievement.relatedRegions',
    'achievement.demoSteps',
    'achievement.demoImage',
    'achievement.demoNotes',
    'achievement.sources',
    'analysis',
    'papers',
    'commentarySections',
    'quizzes'
];

const legacy = load(LEGACY_PATH);
const archive = load(ARCHIVE_PATH);
const legacyById = new Map(legacy.map((item) => [item.id, item]));
const archiveById = new Map(archive.map((item) => [item.id, item]));
const ids = [...new Set([...legacyById.keys(), ...archiveById.keys()])].sort();
const rows = [];

for (const id of ids) {
    const before = legacyById.get(id);
    const after = archiveById.get(id);
    if (!before || !after) {
        rows.push({ id, kind: before ? 'missing-archive' : 'extra-archive', differences: [] });
        continue;
    }
    const differences = [];
    if (storylineId(before) !== storylineId(after)) {
        differences.push({ field: 'storyline', legacy: storylineId(before), archive: storylineId(after) });
    }
    for (const field of FIELDS) {
        const left = pick(before, field);
        const right = pick(after, field);
        if (!same(left, right)) differences.push({ field, legacy: left ?? null, archive: right ?? null });
    }
    for (const locale of ['zh', 'en']) {
        const left = viewSignature(before, legacy.indexOf(before), legacy, locale);
        const right = viewSignature(after, archive.indexOf(after), archive, locale);
        if (!same(left, right)) differences.push({ field: `viewModel.${locale}`, legacy: left, archive: right });
    }
    if (differences.length > 0) rows.push({ id, kind: 'changed', differences });
}

const fieldCounts = {};
for (const row of rows) {
    for (const difference of row.differences) fieldCounts[difference.field] = (fieldCounts[difference.field] || 0) + 1;
}
const legacyStorylines = Object.fromEntries(
    [...new Set(legacy.map(storylineId))]
        .sort()
        .map((id) => [id, legacy.filter((item) => storylineId(item) === id).map((item) => item.id)])
);
const archiveStorylines = Object.fromEntries(
    [...new Set(archive.map(storylineId))]
        .sort()
        .map((id) => [id, archive.filter((item) => storylineId(item) === id).map((item) => item.id)])
);
const report = {
    generatedAt: new Date().toISOString(),
    inputs: { legacy: path.relative(ROOT, LEGACY_PATH), archive: path.relative(ROOT, ARCHIVE_PATH) },
    counts: { legacy: legacy.length, archive: archive.length, changed: rows.length },
    storylineMembershipIdentical: same(legacyStorylines, archiveStorylines),
    fieldCounts,
    rows
};
fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const lines = [
    '# Archive Authority Parity Data Diff',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Legacy milestones: ${legacy.length}`,
    `- Archive milestones: ${archive.length}`,
    `- Changed/missing milestones: ${rows.length}`,
    `- Storyline membership/order identical: ${report.storylineMembershipIdentical ? 'yes' : 'no'}`,
    `- Field counts: ${
        Object.entries(fieldCounts)
            .map(([field, count]) => `${field}: ${count}`)
            .join(', ') || 'none'
    }`,
    '',
    '## Differences',
    ''
];
if (rows.length === 0) lines.push('None.');
for (const row of rows) {
    lines.push(`### ${row.id}`, '', `- Kind: ${row.kind}`);
    for (const difference of row.differences) {
        lines.push(`- \`${difference.field}\``);
        lines.push(`  - Legacy: \`${JSON.stringify(difference.legacy)}\``);
        lines.push(`  - Archive: \`${JSON.stringify(difference.archive)}\``);
    }
    lines.push('');
}
fs.writeFileSync(MARKDOWN_PATH, `${lines.join('\n')}\n`, 'utf8');

console.log(`Parity data diff: ${path.relative(ROOT, MARKDOWN_PATH)}`);
console.log(`Changed/missing milestones: ${rows.length}/${ids.length}`);
console.log(
    `Fields: ${
        Object.entries(fieldCounts)
            .map(([field, count]) => `${field}:${count}`)
            .join(', ') || 'none'
    }`
);
