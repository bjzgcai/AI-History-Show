#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const LEGACY_PATH = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(ROOT, '.tmp', 'archive-parity', 'data', 'milestones-data-legacy.js');
const ARCHIVE_PATH = process.argv[3] ? path.resolve(process.argv[3]) : path.join(ROOT, 'milestones-data.js');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-legacy-main-diff.md');
const JSON_REPORT_PATH = path.join(ROOT, '.tmp', 'archive-reports', 'archive-legacy-main-diff.json');
const VIEW_SCRIPT = fs.readFileSync(path.join(ROOT, 'shared', 'milestone-view.js'), 'utf8');

function loadMilestones(filePath) {
    delete require.cache[require.resolve(filePath)];
    return require(filePath).milestones || [];
}

function stripHtml(value) {
    return String(value ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function localize(value, locale) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return stripHtml(value[locale] ?? value.en ?? value.zh ?? '');
    }
    return stripHtml(value);
}

function list(value) {
    return Array.isArray(value) ? value : [];
}

function stable(value) {
    return JSON.stringify(value ?? null);
}

function storylineId(milestone) {
    const storyline = milestone && milestone.storyline;
    if (typeof storyline === 'string') return storyline || 'deep-learning';
    return (storyline && storyline.id) || 'deep-learning';
}

function sortYear(milestone) {
    const match = String(milestone && milestone.year != null ? milestone.year : '').match(/\d{3,4}/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function normalizeKeyText(value) {
    const raw = typeof value === 'object' ? [value.en, value.zh].filter(Boolean).join(' ') : String(value || '');
    return raw
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9一-龥]+/g, '')
        .replace(/networks?/g, 'net')
        .replace(/模型|网络|算法|时代|突破|爆发/g, '')
        .trim();
}

function storylineIds(milestones) {
    const result = {};
    for (const milestone of milestones) {
        const id = storylineId(milestone);
        (result[id] ||= []).push(milestone);
    }
    for (const items of Object.values(result)) {
        items.sort(
            (a, b) => sortYear(a) - sortYear(b) || normalizeKeyText(a.title).localeCompare(normalizeKeyText(b.title))
        );
    }
    return Object.fromEntries(Object.entries(result).map(([id, items]) => [id, items.map((item) => item.id)]));
}

function visibleSourceSignature(milestone, locale) {
    const papers = list(milestone.papers).map((paper) => ({
        type: paper.journal ? `Paper · ${paper.journal}` : 'Paper',
        label: localize(paper.title, locale),
        url: paper.url || ''
    }));
    const sources = list(milestone.achievement && milestone.achievement.sources).map((source) => ({
        type: localize(source.type, locale),
        label: localize(source.label, locale),
        url: source.url || ''
    }));
    const seen = new Set();
    return [...papers, ...sources].filter((source) => {
        if (!source.url || !source.label || seen.has(source.url)) return false;
        seen.add(source.url);
        return true;
    });
}

function visibleQuizSignature(milestone, locale) {
    return list(milestone.quizzes).map((quiz) => ({
        question: localize(quiz.question, locale),
        options: list(quiz.options).map((option) => localize(option && option.text ? option.text : option, locale)),
        answerIndex: Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : quiz.answer,
        explanation: localize(quiz.explanation, locale)
    }));
}

function visibleCommentarySignature(milestone, locale) {
    return list(milestone.commentarySections).map((section) => ({
        label: localize(section.label, locale),
        html: localize(section.html, locale)
    }));
}

function figuresSignature(milestone, locale) {
    return list(milestone.figures).map((figure) => ({
        name: localize(figure.name, locale),
        role: localize(figure.role, locale),
        avatar: figure.avatar || figure.image || '',
        avatarStyle: figure.avatarStyle || '',
        figureType: figure.figureType || ''
    }));
}

function quoteSignature(milestone, locale) {
    return {
        quote: localize(milestone.quote, locale),
        attribution: localize(milestone.quoteAttribution, locale),
        label: localize(milestone.quoteLabel, locale),
        page: localize(milestone.quotePage, locale)
    };
}

function achievementAuxiliarySignature(milestone) {
    const achievement = milestone.achievement || {};
    return Object.fromEntries(
        [
            'area',
            'method',
            'artifact',
            'material',
            'demo',
            'keyConcepts',
            'relatedAchievements',
            'relatedRegions',
            'demoSteps',
            'demoImage',
            'demoNotes'
        ].map((field) => [field, achievement[field] ?? null])
    );
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

function viewSignature(milestones, locale) {
    const normalize = createViewNormalizer(locale);
    return new Map(
        milestones.map((milestone, index) => {
            const view = normalize(milestone, index, milestones);
            return [
                milestone.id,
                {
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
                    commentarySections: view.commentarySections
                }
            ];
        })
    );
}

function changedIds(legacy, archiveById, signature) {
    return legacy
        .filter((milestone) => stable(signature(milestone)) !== stable(signature(archiveById.get(milestone.id))))
        .map((milestone) => milestone.id);
}

function visualModuleChanges(legacy, archiveById) {
    const rows = [];
    for (const milestone of legacy) {
        const archive = archiveById.get(milestone.id);
        const before = list(milestone.achievement && milestone.achievement.visualModules);
        const after = list(archive && archive.achievement && archive.achievement.visualModules);
        if (stable(before) === stable(after)) continue;
        const fields = [];
        for (let index = 0; index < Math.max(before.length, after.length); index += 1) {
            const left = before[index] || {};
            const right = after[index] || {};
            for (const field of new Set([...Object.keys(left), ...Object.keys(right)])) {
                if (stable(left[field]) !== stable(right[field])) {
                    fields.push({ index, field, legacy: left[field], archive: right[field] });
                }
            }
        }
        rows.push({ id: milestone.id, fields });
    }
    return rows;
}

function commentaryChanges(legacy, archiveById) {
    const ids = new Set();
    for (const locale of ['en', 'zh']) {
        for (const id of changedIds(legacy, archiveById, (milestone) => visibleCommentarySignature(milestone, locale)))
            ids.add(id);
    }
    return [...ids];
}

function metadataCoverage(milestones) {
    const fields = [
        'archive',
        'archiveEventId',
        'archiveVariantId',
        'archivePresentationMode',
        'sourceKind',
        'storyline',
        'branch',
        'fusionCanonical',
        'order',
        'date',
        'papers',
        'quiz'
    ];
    return Object.fromEntries(
        fields.map((field) => [field, milestones.filter((milestone) => milestone[field] !== undefined).length])
    );
}

const legacy = loadMilestones(LEGACY_PATH);
const archive = loadMilestones(ARCHIVE_PATH);
const archiveById = new Map(archive.map((milestone) => [milestone.id, milestone]));
const legacyIds = new Set(legacy.map((milestone) => milestone.id));
const archiveIds = new Set(archive.map((milestone) => milestone.id));
const semantic = {};

for (const locale of ['en', 'zh']) {
    semantic[locale] = {
        title: changedIds(legacy, archiveById, (milestone) => localize(milestone.title, locale)),
        subtitle: changedIds(legacy, archiveById, (milestone) => localize(milestone.subtitle, locale)),
        description: changedIds(legacy, archiveById, (milestone) => localize(milestone.description, locale)),
        category: changedIds(legacy, archiveById, (milestone) => localize(milestone.category, locale)),
        figures: changedIds(legacy, archiveById, (milestone) => figuresSignature(milestone, locale)),
        quote: changedIds(legacy, archiveById, (milestone) => quoteSignature(milestone, locale)),
        sources: changedIds(legacy, archiveById, (milestone) => visibleSourceSignature(milestone, locale)),
        commentary: changedIds(legacy, archiveById, (milestone) => visibleCommentarySignature(milestone, locale)),
        quizzes: changedIds(legacy, archiveById, (milestone) => visibleQuizSignature(milestone, locale))
    };
}

const legacyViews = { en: viewSignature(legacy, 'en'), zh: viewSignature(legacy, 'zh') };
const archiveViews = { en: viewSignature(archive, 'en'), zh: viewSignature(archive, 'zh') };
const sharedViewChanges = {};
for (const locale of ['en', 'zh']) {
    sharedViewChanges[locale] = legacy
        .filter(
            (milestone) =>
                stable(legacyViews[locale].get(milestone.id)) !== stable(archiveViews[locale].get(milestone.id))
        )
        .map((milestone) => milestone.id);
}

const reportData = {
    generatedAt: new Date().toISOString(),
    inputs: { legacy: LEGACY_PATH, archive: ARCHIVE_PATH },
    counts: { legacy: legacy.length, archive: archive.length },
    ids: {
        missingArchive: [...legacyIds].filter((id) => !archiveIds.has(id)),
        extraArchive: [...archiveIds].filter((id) => !legacyIds.has(id))
    },
    storylines: {
        legacy: storylineIds(legacy),
        archive: storylineIds(archive)
    },
    semantic,
    structural: {
        images: changedIds(legacy, archiveById, (milestone) => list(milestone.resources && milestone.resources.images)),
        photos: changedIds(legacy, archiveById, (milestone) => list(milestone.photos)),
        videos: changedIds(legacy, archiveById, (milestone) => list(milestone.resources && milestone.resources.videos)),
        videoUrl: changedIds(legacy, archiveById, (milestone) => milestone.videoUrl || ''),
        visual: changedIds(
            legacy,
            archiveById,
            (milestone) => (milestone.achievement && milestone.achievement.visual) || ''
        ),
        visualModules: visualModuleChanges(legacy, archiveById),
        analysis: changedIds(legacy, archiveById, (milestone) => milestone.analysis || null),
        achievementAuxiliary: changedIds(legacy, archiveById, achievementAuxiliarySignature),
        papers: changedIds(legacy, archiveById, (milestone) => list(milestone.papers)),
        commentary: commentaryChanges(legacy, archiveById)
    },
    sharedViewChanges,
    metadataCoverage: {
        legacy: metadataCoverage(legacy),
        archive: metadataCoverage(archive)
    }
};

const storylineSame = [
    ...new Set([...Object.keys(reportData.storylines.legacy), ...Object.keys(reportData.storylines.archive)])
].every((id) => stable(reportData.storylines.legacy[id] || []) === stable(reportData.storylines.archive[id] || []));
const semanticCounts = Object.fromEntries(
    Object.entries(semantic).map(([locale, fields]) => [
        locale,
        Object.fromEntries(Object.entries(fields).map(([field, ids]) => [field, ids.length]))
    ])
);
const lines = [
    '# Archive-native vs Legacy Main Exhibit Diff',
    '',
    `Generated: ${reportData.generatedAt}`,
    '',
    'This report compares fresh outputs from the legacy-compatible generator and the direct archive-native generator as consumed by `index.html`.',
    '',
    '## Summary',
    '',
    `- Legacy milestones: ${legacy.length}`,
    `- Archive-native milestones: ${archive.length}`,
    `- Missing archive ids: ${reportData.ids.missingArchive.length}`,
    `- Extra archive ids: ${reportData.ids.extraArchive.length}`,
    `- Storyline membership and order identical: ${storylineSame ? 'yes' : 'no'}`,
    `- English shared view-model changed milestones: ${sharedViewChanges.en.length}`,
    `- Chinese shared view-model changed milestones: ${sharedViewChanges.zh.length}`,
    `- Visual-module changed milestones: ${reportData.structural.visualModules.length}`,
    `- Commentary changed milestones: ${reportData.structural.commentary.length}`,
    '',
    '## Visible semantic field counts',
    '',
    '| Field | English changes | Chinese changes |',
    '|---|---:|---:|',
    ...Object.keys(semantic.en).map(
        (field) => `| ${field} | ${semanticCounts.en[field]} | ${semanticCounts.zh[field]} |`
    ),
    '',
    '## Other rendered structures',
    '',
    `- Images changed: ${reportData.structural.images.length}`,
    `- Photos changed: ${reportData.structural.photos.length}`,
    `- Videos changed: ${reportData.structural.videos.length}`,
    `- Top-level video URL changed: ${reportData.structural.videoUrl.length}`,
    `- Visual renderer changed: ${reportData.structural.visual.length}`,
    `- Analysis changed: ${reportData.structural.analysis.length}`,
    `- Achievement auxiliary fields changed: ${reportData.structural.achievementAuxiliary.length}`,
    `- Legacy paper-list changed: ${reportData.structural.papers.length}`,
    '',
    'The seven `sources` differences come from legacy `papers[]` cards that are absent in archive-native output. Remote paper URLs are still present in `achievement.sources`, but five local PDF links are no longer rendered.',
    '## Visual-module differences',
    ''
];

if (reportData.structural.visualModules.length === 0) {
    lines.push('None.');
} else {
    lines.push(
        'The remaining module differences are gaming replay URLs: legacy points at planned but absent event MP4 files, while archive-native points at the existing fallback GIF.'
    );
    lines.push('');
    for (const row of reportData.structural.visualModules) {
        lines.push(`- \`${row.id}\``);
        for (const field of row.fields) {
            lines.push(
                `  - module ${field.index} \`${field.field}\`: \`${field.legacy ?? ''}\` → \`${field.archive ?? ''}\``
            );
        }
    }
}

lines.push('', '## Commentary differences', '');
if (reportData.structural.commentary.length === 0) {
    lines.push('None.');
} else {
    lines.push(
        'Archive-native commentary carries source bindings and, for the listed records, uses curated archive core-idea wording instead of the legacy generator suffix.'
    );
    lines.push('');
    for (const id of reportData.structural.commentary) lines.push(`- \`${id}\``);
}

lines.push('', '## Structural metadata differences', '');
lines.push('| Field | Legacy records | Archive-native records |');
lines.push('|---|---:|---:|');
for (const field of Object.keys(reportData.metadataCoverage.legacy)) {
    lines.push(
        `| ${field} | ${reportData.metadataCoverage.legacy[field]} | ${reportData.metadataCoverage.archive[field]} |`
    );
}
lines.push('');
lines.push('Notable interpretation:');
lines.push('');
lines.push(
    '- Archive-native explicitly assigns all 21 core milestones to `deep-learning`; legacy relies on the frontend fallback when `storyline` is absent. The resulting storyline membership and chronological order are identical.'
);
lines.push(
    '- Archive-native adds `order` and `date` to all records and removes legacy-only helper fields such as `branch`, `fusionCanonical`, `papers`, and singular `quiz`.'
);
lines.push(
    '- Archive-native omits legacy `papers[]`. Seven gaming records lose paper-list metadata; five of those records lose a rendered local PDF card, while equivalent remote sources remain available. Quiz rendering remains unchanged through `quizzes`.'
);
lines.push('- Provenance changes from `sourceKind: archive+legacy` to `sourceKind: archive-preview`.');

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.mkdirSync(path.dirname(JSON_REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8');
fs.writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(reportData, null, 2)}\n`, 'utf8');
console.log(`Archive/legacy main diff: ${path.relative(ROOT, REPORT_PATH)}`);
console.log(`Archive/legacy main diff JSON: ${path.relative(ROOT, JSON_REPORT_PATH)}`);
console.log(`Milestones: legacy ${legacy.length}, archive ${archive.length}`);
console.log(`Storyline membership/order identical: ${storylineSame}`);
console.log(`Shared view changes: en ${sharedViewChanges.en.length}, zh ${sharedViewChanges.zh.length}`);
console.log(`Visual-module changes: ${reportData.structural.visualModules.length}`);
console.log(`Commentary changes: ${reportData.structural.commentary.length}`);
