#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-native-field-coverage.md');
const FRONTEND_FILES = ['index.html', 'dual-screen.html', 'shared/milestone-view.js'];

const FIELD_GROUPS = [
    {
        title: 'Identity / routing',
        fields: ['id', 'archiveEventId', 'archiveVariantId', 'sourceKind', 'order', 'storyline', 'category']
    },
    {
        title: 'Core display',
        fields: ['year', 'date', 'title', 'subtitle', 'description', 'location']
    },
    {
        title: 'People / figures',
        fields: ['figures', 'figures.avatar', 'figures.image', 'figures.role']
    },
    {
        title: 'Media / resources',
        fields: ['resources.images', 'resources.videos', 'imageMeta', 'photos', 'videoUrl']
    },
    {
        title: 'Quotes',
        fields: ['quote', 'quoteText', 'quoteHtml', 'quoteMeta', 'quotePage', 'quoteAttribution', 'quoteLabel']
    },
    {
        title: 'Achievement',
        fields: [
            'achievement.visual',
            'achievement.visualModules',
            'achievement.sources',
            'achievement.sourceIds',
            'achievement.claims',
            'achievement.emphasis',
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
            'achievement.demoNotes'
        ]
    },
    {
        title: 'Structured text / interaction',
        fields: ['commentarySections', 'analysis', 'quizzes']
    }
];

const ARCHIVE_NATIVE_FIELDS = new Set([
    'id',
    'archiveEventId',
    'archiveVariantId',
    'sourceKind',
    'order',
    'storyline',
    'category',
    'year',
    'date',
    'title',
    'subtitle',
    'description',
    'location',
    'figures',
    'figures.avatar',
    'figures.image',
    'figures.role',
    'resources.images',
    'resources.videos',
    'imageMeta',
    'photos',
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
    'achievement.sources',
    'achievement.sourceIds',
    'achievement.claims',
    'achievement.emphasis',
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
    'commentarySections',
    'analysis',
    'quizzes'
]);

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

const frontendText = FRONTEND_FILES.map((file) => `\n// ${file}\n${read(file)}`).join('\n');

function usageHint(field) {
    const parts = field.split('.');
    const last = parts[parts.length - 1];
    const patterns = [field.replace(/\./g, '\\.'), last];
    const matches = patterns.some((pattern) =>
        new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(frontendText)
    );
    return matches ? 'used/likely used' : 'not directly found by text scan';
}

function status(field) {
    if (ARCHIVE_NATIVE_FIELDS.has(field)) return 'covered by archive-native generator';
    return 'not yet covered';
}

const report = [];
report.push('# Archive Native Field Coverage');
report.push('');
report.push(
    'This report tracks frontend milestone fields needed to remove the legacy scaffold from archive generation.'
);
report.push(
    'It is a conservative text-scan plus current generator coverage map; verify behavior with `npm run diff:archive-native`.'
);
report.push('');

for (const group of FIELD_GROUPS) {
    report.push(`## ${group.title}`);
    report.push('');
    report.push('| Field | Frontend usage | Current archive-native coverage |');
    report.push('|---|---|---|');
    for (const field of group.fields) {
        report.push(`| \`${field}\` | ${usageHint(field)} | ${status(field)} |`);
    }
    report.push('');
}

report.push('## Current status');
report.push('');
report.push(
    'The archive-native generator now emits the current frontend milestone presentation shape directly from archive events and storyline variants.'
);
report.push(
    'Legacy quote formatting, figure presentation, video metadata, and achievement auxiliary fields were migrated into variant-owned presentation data; the generated native preview does not use `milestones-data.js` as a scaffold.'
);
report.push('');
report.push(
    'Use `npm run generate:archive-native-preview` followed by `npm run diff:archive-native` to verify parity against the scaffold-based archive preview.'
);

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${report.join('\n')}\n`, 'utf8');
console.log(`Archive native field coverage: ${path.relative(ROOT, REPORT_PATH)}`);
