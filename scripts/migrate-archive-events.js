#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../manage/catalog.js');
const { FUSIONS, getFusionCanonical } = require('../manage/event-fusions.js');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const STORYLINES_DIR = path.join(ROOT, 'archive', 'storylines');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-migration-progress.md');
const GENERATED_DATA = path.join(ROOT, 'milestones-data.js');

const FUSION_BY_AI100 = new Map(FUSIONS.map((fusion) => [fusion.ai100, fusion]));

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function isObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isLocalized(value) {
    return isObject(value) && (hasOwn(value, 'zh') || hasOwn(value, 'en'));
}

function localized(value, fallback = '') {
    if (isLocalized(value)) {
        return {
            zh: String(value.zh || value.en || fallback || '').trim(),
            en: String(value.en || value.zh || fallback || '').trim()
        };
    }
    const text = String(value || fallback || '').trim();
    return { zh: text, en: text };
}

function text(value, locale = 'en') {
    if (isLocalized(value)) return String(value[locale] || value.zh || value.en || '').trim();
    return String(value || '').trim();
}

function slug(value, fallback = 'item') {
    const raw = String(value || fallback)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9一-龥]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return raw || fallback;
}

function readJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
    const next = `${JSON.stringify(data, null, 2)}\n`;
    const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    if (prev === next) return false;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, next);
    return true;
}

function uniqueId(base, seen) {
    let id = base;
    let index = 2;
    while (seen.has(id)) {
        id = `${base}-${index}`;
        index += 1;
    }
    seen.add(id);
    return id;
}

function regionFromLocation(location) {
    const value =
        `${text(location && location.country, 'en')} ${text(location && location.country, 'zh')}`.toLowerCase();
    if (value.includes('united states') || value.includes('usa') || value.includes('美国')) return 'usa';
    if (value.includes('canada') || value.includes('加拿大')) return 'canada';
    if (value.includes('united kingdom') || value.includes('uk') || value.includes('英国')) return 'united-kingdom';
    if (value.includes('japan') || value.includes('日本')) return 'japan';
    if (value.includes('china') || value.includes('中国')) return 'china';
    if (value.includes('france') || value.includes('法国')) return 'france';
    if (value.includes('germany') || value.includes('德国')) return 'germany';
    if (value.includes('switzerland') || value.includes('瑞士')) return 'switzerland';
    return slug(
        text(location && location.country, 'en') || text(location && location.country, 'zh') || 'unknown-region',
        'unknown-region'
    );
}

function sourceType(source) {
    const value = `${text(source && source.type, 'en')} ${text(source && source.label, 'en')}`.toLowerCase();
    if (value.includes('paper') || value.includes('论文')) return 'paper';
    if (value.includes('blog')) return 'official-page';
    if (value.includes('code') || value.includes('github')) return 'code';
    if (value.includes('book')) return 'book';
    if (value.includes('video')) return 'video';
    if (value.includes('archive')) return 'archive';
    if (value.includes('official') || value.includes('project')) return 'project-page';
    return 'reference-only';
}

function sourceReliability(index, type) {
    if (index === 0 && ['paper', 'official-page', 'project-page'].includes(type)) return 'primary';
    if (['paper', 'official-page', 'project-page', 'code'].includes(type)) return 'secondary';
    return 'reference-only';
}

function assetRole(assetPath, index) {
    const value = String(assetPath || '').toLowerCase();
    if (value.includes('people') || value.includes('figures') || value.includes('portrait'))
        return index === 0 ? 'portrait' : 'team-photo';
    if (value.includes('architecture') || value.includes('explainer') || value.endsWith('.svg'))
        return 'architecture-explainer';
    if (value.includes('paper')) return 'paper-page';
    return index === 0 ? 'hero-image' : 'supporting-image';
}

function assetType(assetPath) {
    const value = String(assetPath || '').toLowerCase();
    if (value.endsWith('.svg')) return 'svg';
    if (value.endsWith('.gif')) return 'gif';
    if (value.endsWith('.mp4') || value.endsWith('.webm')) return 'video';
    return 'image';
}

function ensureSourceFallback(sources, legacyKey) {
    if (sources.length > 0) return sources;
    return [
        {
            id: 'source-legacy-event-record',
            type: 'reference-only',
            title: localized(`Legacy event record for ${legacyKey}`),
            url: 'https://www.benchcouncil.org/',
            language: 'en',
            reliability: 'reference-only',
            notes: {
                zh: '由 legacy 事件记录生成的临时来源占位，需要后续补充主论文或原始资料。',
                en: 'Temporary source placeholder generated from the legacy event record; add primary papers or original sources later.'
            }
        }
    ];
}

function buildSources(milestone, legacyKey) {
    const rawSources = (
        milestone.achievement && Array.isArray(milestone.achievement.sources) ? milestone.achievement.sources : []
    ).filter(Boolean);
    const seen = new Set();
    const sources = rawSources.map((source, index) => {
        const label = localized(source.label || source.title || source.url || `Source ${index + 1}`);
        const type = sourceType(source);
        const id = uniqueId(`source-${slug(text(label, 'en') || text(label, 'zh'), `source-${index + 1}`)}`, seen);
        return {
            id,
            type,
            label: localized(source.type || type, type),
            title: label,
            url: source.url || 'https://www.benchcouncil.org/',
            language: 'en',
            reliability: source.reliability || sourceReliability(index, type),
            notes: {
                zh: '由 legacy generated milestone 的 achievement sources 迁移。',
                en: 'Migrated from generated legacy milestone achievement sources.'
            }
        };
    });
    return ensureSourceFallback(sources, legacyKey);
}

function buildAssets(milestone, sourceId) {
    const images = milestone.resources && Array.isArray(milestone.resources.images) ? milestone.resources.images : [];
    const imageMeta = milestone.imageMeta || (milestone.resources && milestone.resources.imageMeta) || {};
    const seen = new Set();
    return images
        .filter((imagePath) => fs.existsSync(path.join(ROOT, imagePath)))
        .map((imagePath, index) => {
            const meta = imageMeta[imagePath] || {};
            const role = assetRole(imagePath, index);
            return {
                id: uniqueId(
                    `asset-${slug(path.basename(imagePath, path.extname(imagePath)), `asset-${index + 1}`)}`,
                    seen
                ),
                type: assetType(imagePath),
                path: imagePath,
                role,
                caption: localized(meta.caption || `${text(milestone.title, 'en')} ${role}`),
                subcaption: localized(meta.subcaption || role),
                sourceName: clone(meta.sourceName || {}),
                sourceUrl: meta.sourceUrl || '',
                displayUsage: clone(meta.usage || {}),
                sourceId,
                rights: {
                    status: meta.license
                        ? 'documented-in-legacy'
                        : role.includes('explainer')
                          ? 'local-redraw'
                          : 'external-reference',
                    license: localized(
                        meta.license ||
                            meta.usage ||
                            'Migrated from legacy media metadata; verify rights before publication.'
                    )
                },
                usage: [],
                editable: true
            };
        });
}

function buildClaims(milestone, sourceIds, storylineId = '') {
    const title = localized(milestone.title || milestone.id);
    const claimSourceIds = sourceIds.slice(0, Math.min(2, sourceIds.length));
    if (storylineId === 'humanistic-cycle') {
        return [
            {
                id: 'claim-branch-summary',
                importance: 'core',
                text: localized(milestone.branchSummary || milestone.subtitle || title),
                sourceIds: claimSourceIds,
                status: 'needs-source'
            },
            {
                id: 'claim-event-description',
                importance: 'context',
                text: localized(milestone.description || milestone.subtitle || title),
                sourceIds: claimSourceIds,
                status: 'needs-source'
            }
        ];
    }
    return [
        {
            id: 'claim-legacy-achievement-summary',
            importance: 'core',
            text: {
                zh: `${title.zh} 是当前 legacy 展示中的一个 AI 历史节点。`,
                en: `${title.en} is an AI history milestone in the current legacy presentation.`
            },
            sourceIds: claimSourceIds,
            status: 'needs-source'
        },
        {
            id: 'claim-legacy-description',
            importance: 'context',
            text: localized(milestone.description || milestone.subtitle || title),
            sourceIds: claimSourceIds,
            status: 'needs-source'
        }
    ];
}

function normalizeQuizOptions(quiz) {
    return (quiz.options || []).map((option) => localized(option.text || option));
}

function buildQuizzes(milestone, sourceId, assetId) {
    const quizzes = Array.isArray(milestone.quizzes) ? milestone.quizzes : [];
    return quizzes.map((quiz, index) => ({
        id: quiz.id || `quiz-${slug(milestone.id, 'event')}-${index + 1}`,
        storylineId: quiz.storylineId || '',
        question: localized(quiz.question),
        options: normalizeQuizOptions(quiz),
        answer: Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : Number.isInteger(quiz.answer) ? quiz.answer : 0,
        explanation: localized(quiz.explanation || ''),
        sourceIds: sourceId ? [sourceId] : [],
        assetIds: assetId ? [assetId] : []
    }));
}

function normalizeFigures(milestone) {
    return (milestone.figures || []).map((figure) => ({
        figureId: slug(text(figure.name, 'en') || text(figure.name, 'zh'), 'unknown-figure'),
        role: localized(figure.role || ''),
        organizationIds: []
    }));
}

function buildEvent(archiveId, milestone, legacyKey, storylineId) {
    return {
        id: archiveId,
        year: milestone.year,
        date: String(milestone.date || milestone.year || ''),
        title: localized(milestone.title || legacyKey),
        summary: localized(milestone.subtitle || milestone.description || milestone.title || legacyKey),
        description: localized(milestone.description || milestone.subtitle || milestone.title || legacyKey),
        location: {
            regionId: regionFromLocation(milestone.location),
            country: localized(milestone.location && milestone.location.country, ''),
            place: localized(milestone.location && (milestone.location.name || milestone.location.place), ''),
            coordinates: (milestone.location && milestone.location.coordinates) || []
        },
        topics: [storylineId],
        achievementTypeIds: [storylineId === 'bench-council-ai100' ? 'ai100-achievement' : storylineId],
        figures: normalizeFigures(milestone).map((figure, index) => ({
            ...figure,
            name: localized((milestone.figures || [])[index] && (milestone.figures || [])[index].name, figure.figureId),
            avatar: ((milestone.figures || [])[index] && (milestone.figures || [])[index].avatar) || '',
            avatarStyle: ((milestone.figures || [])[index] && (milestone.figures || [])[index].avatarStyle) || '',
            figureType: ((milestone.figures || [])[index] && (milestone.figures || [])[index].figureType) || 'person'
        })),
        organizations: [],
        canonical: true,
        relatedLegacyIds: archiveId === legacyKey ? [] : [legacyKey],
        review: {
            status: 'draft',
            notes: {
                zh: '由 legacy generated milestone 批量迁移，展示层默认 preserve-legacy，需后续人工细化 claims 与来源绑定。',
                en: 'Batch migrated from generated legacy milestone; presentation defaults to preserve-legacy, with claims and source bindings needing later review.'
            }
        }
    };
}

function mergeById(existing, incoming) {
    const result = Array.isArray(existing) ? [...existing] : [];
    const seen = new Set(result.map((item) => item && item.id).filter(Boolean));
    for (const item of incoming) {
        if (!item || !item.id || seen.has(item.id)) continue;
        result.push(item);
        seen.add(item.id);
    }
    return result;
}

function mergeUsage(assets, variantId) {
    return assets.map((asset) => {
        const usage = new Set(Array.isArray(asset.usage) ? asset.usage : []);
        usage.add(`variant:${variantId}`);
        return { ...asset, usage: Array.from(usage) };
    });
}

function variantPath(eventDir, variantId) {
    return path.join(eventDir, 'variants', `${variantId}.json`);
}

function buildVariant(target, milestone, sources, assets, claims, quizzes) {
    const variant = {
        storylineId: target.storylineId,
        eventId: target.archiveId,
        presentationMode: target.storylineId === 'humanistic-cycle' ? 'archive' : 'preserve-legacy',
        displayTitle: localized(milestone.title || target.legacyKey),
        displaySummary: localized(milestone.subtitle || milestone.description || milestone.title || target.legacyKey),
        ...(target.storylineId === 'humanistic-cycle' ? { displaySubtitle: localized(milestone.subtitle || '') } : {}),
        displayDescription: localized(
            milestone.description || milestone.subtitle || milestone.title || target.legacyKey
        ),
        emphasis: ['batch-migration', 'source-review-needed'],
        visual: (milestone.achievement && milestone.achievement.visual) || 'archive-dossier',
        visualModules: (milestone.achievement && milestone.achievement.visualModules) || [],
        assetIds: assets.map((asset) => asset.id),
        sourceIds: sources.map((source) => source.id),
        claimIds: claims.map((claim) => claim.id),
        ...(quizzes[0] ? { quizId: quizzes[0].id } : {}),
        commentarySections: Array.isArray(milestone.commentarySections)
            ? milestone.commentarySections.map((section, index) => ({
                  id: slug(text(section.label, 'en') || `section-${index + 1}`, `section-${index + 1}`),
                  label: localized(section.label || `Section ${index + 1}`),
                  html: localized(section.html || ''),
                  sourceIds: sources.slice(0, 1).map((source) => source.id)
              }))
            : [],
        review: {
            status: 'draft',
            notes: {
                zh: '由 legacy generated milestone 批量生成的 variant；展示层默认不覆盖 legacy。',
                en: 'Variant batch-generated from the generated legacy milestone; presentation does not override legacy by default.'
            }
        }
    };

    if (target.storylineId !== 'humanistic-cycle') return variant;

    variant.sentiment = milestone.sentiment || '';
    variant.realityLinks = clone(milestone.realityLinks || []);
    variant.branchSummary = localized(milestone.branchSummary || milestone.subtitle || '');
    variant.branch = clone(milestone.branch || {});
    variant.analysis = clone(milestone.analysis || {});
    variant.achievement = clone(milestone.achievement || {});
    if (Array.isArray(milestone.papers)) variant.papers = clone(milestone.papers);
    variant.photos = clone(milestone.photos || []);
    variant.videoUrl = milestone.videoUrl || '';
    variant.quote = clone(milestone.quote || '');
    variant.quoteAttribution = clone(milestone.quoteAttribution || '');
    variant.quoteMeta = clone(milestone.quoteMeta || {});
    variant.quotePage = clone(milestone.quotePage || '');
    return variant;
}

function loadMilestones() {
    delete require.cache[require.resolve(GENERATED_DATA)];
    return require(GENERATED_DATA).milestones || [];
}

function milestoneIdForTarget(target) {
    if (target.storylineId === 'gaming-ai') return `milestone-gaming-ai-${target.legacyKey}`;
    if (target.storylineId === 'humanistic-cycle') return `milestone-humanistic-cycle-${target.legacyKey}`;
    return `milestone-${target.legacyKey}`;
}

function archiveIdForAi100Key(key) {
    const fusion = FUSION_BY_AI100.get(key);
    return fusion ? fusion.canonical : getFusionCanonical(key);
}

function ai100Targets() {
    const category = (catalog.categories || []).find(
        (item) => item.storyline && item.storyline.id === 'bench-council-ai100'
    );
    return ((category && category.events) || []).map((key, index) => ({
        group: 'ai100',
        storylineId: 'bench-council-ai100',
        variantId: 'bench-council-ai100',
        legacyKey: key,
        archiveId: archiveIdForAi100Key(key),
        order: (index + 1) * 10
    }));
}

function coreTargets() {
    const ai100CategoryId = 'bench-council-ai100';
    const targets = [];
    for (const category of catalog.categories || []) {
        if (category.storyline && category.storyline.id === ai100CategoryId) continue;
        for (const key of category.events || []) {
            targets.push({
                group: 'core',
                storylineId: 'deep-learning',
                variantId: 'deep-learning',
                legacyKey: key,
                archiveId: getFusionCanonical(key),
                order: targets.length * 10 + 10
            });
        }
    }
    return targets;
}

function branchTargets(storylineId) {
    const branch = (catalog.branches || []).find((item) => item.id === storylineId);
    return ((branch && branch.events) || []).map((key, index) => ({
        group: storylineId,
        storylineId,
        variantId: storylineId,
        legacyKey: key,
        archiveId: getFusionCanonical(key),
        order: (index + 1) * 10
    }));
}

function gamingTargets() {
    return branchTargets('gaming-ai').map((target) => ({ ...target, group: 'gaming' }));
}

function humanisticTargets() {
    return branchTargets('humanistic-cycle');
}

function selectedTargets(mode) {
    if (mode === 'ai100') return ai100Targets();
    if (mode === 'core') return coreTargets();
    if (mode === 'gaming') return gamingTargets();
    if (mode === 'humanistic') return humanisticTargets();
    return [...ai100Targets(), ...coreTargets(), ...gamingTargets(), ...humanisticTargets()];
}

function migrateTarget(target, milestoneById) {
    const milestoneId = milestoneIdForTarget(target);
    const milestone = milestoneById.get(milestoneId);
    if (!milestone) return { status: 'missing-milestone', target, milestoneId };

    const eventDir = path.join(ARCHIVE_EVENTS, target.archiveId);
    const sourcesPath = path.join(eventDir, 'sources.json');
    const assetsPath = path.join(eventDir, 'assets.json');
    const claimsPath = path.join(eventDir, 'claims.json');
    const quizzesPath = path.join(eventDir, 'quizzes.json');
    const eventPath = path.join(eventDir, 'event.json');
    const variantFile = variantPath(eventDir, target.variantId);

    const hasExistingEvent = fs.existsSync(eventPath);

    const existingSources = readJson(sourcesPath, []);
    const generatedSources = buildSources(milestone, target.legacyKey);
    const shouldGenerateSources = !hasExistingEvent || existingSources.length === 0;
    const newSources = shouldGenerateSources ? generatedSources : [];
    const sources = mergeById(existingSources, newSources);
    const sourceId = (newSources[0] || sources[0] || {}).id;

    const existingAssets = readJson(assetsPath, []);
    const generatedAssets = mergeUsage(buildAssets(milestone, sourceId), target.variantId);
    const shouldGenerateAssets = !hasExistingEvent || existingAssets.length === 0;
    const newAssets = shouldGenerateAssets ? generatedAssets : [];
    const assets = mergeById(existingAssets, newAssets);
    const variantAssets = newAssets.length
        ? newAssets
        : assets.filter((asset) => (asset.usage || []).includes(`variant:${target.variantId}`)).length
          ? assets.filter((asset) => (asset.usage || []).includes(`variant:${target.variantId}`))
          : assets;

    const existingClaims = readJson(claimsPath, []);
    const generatedClaims = buildClaims(
        milestone,
        sources.map((source) => source.id),
        target.storylineId
    );
    const shouldGenerateClaims = !hasExistingEvent || existingClaims.length === 0;
    const newClaims = shouldGenerateClaims ? generatedClaims : [];
    const claims = mergeById(existingClaims, newClaims);

    const existingQuizzes = readJson(quizzesPath, []);
    const generatedQuizzes = buildQuizzes(milestone, sourceId, (variantAssets[0] || assets[0] || {}).id);
    const shouldGenerateQuizzes = !hasExistingEvent || existingQuizzes.length === 0;
    const newQuizzes = shouldGenerateQuizzes ? generatedQuizzes : [];
    const quizzes = mergeById(existingQuizzes, newQuizzes);
    const variantQuizzes = newQuizzes.length
        ? newQuizzes
        : quizzes.filter((quiz) => quiz.storylineId === target.storylineId).length
          ? quizzes.filter((quiz) => quiz.storylineId === target.storylineId)
          : quizzes;

    let changed = false;
    if (!fs.existsSync(eventPath))
        changed =
            writeJson(eventPath, buildEvent(target.archiveId, milestone, target.legacyKey, target.storylineId)) ||
            changed;
    changed = writeJson(sourcesPath, sources) || changed;
    changed = writeJson(assetsPath, assets) || changed;
    changed = writeJson(claimsPath, claims) || changed;
    changed = writeJson(quizzesPath, quizzes) || changed;
    if (!fs.existsSync(variantFile)) {
        changed =
            writeJson(
                variantFile,
                buildVariant(
                    target,
                    milestone,
                    newSources.length ? newSources : sources,
                    variantAssets,
                    newClaims,
                    variantQuizzes
                )
            ) || changed;
    }

    return { status: changed ? 'migrated' : 'exists', target, milestoneId };
}

function storylineFile(storylineId) {
    return path.join(STORYLINES_DIR, `${storylineId}.json`);
}

function updateStoryline(storylineId, targets) {
    const branch = (catalog.branches || []).find((item) => item.id === storylineId);
    const filePath = storylineFile(storylineId);
    const storyline = readJson(filePath, {
        id: storylineId,
        title: localized((branch && branch.name) || storylineId),
        subtitle: localized((branch && branch.subtitle) || ''),
        type: branch ? 'branch-timeline' : 'timeline',
        events: []
    });
    const existing = Array.isArray(storyline.events) ? storyline.events : [];
    const seen = new Set(existing.map((ref) => `${ref.eventId}/${ref.variant}`));
    let changed = false;
    for (const target of targets) {
        const key = `${target.archiveId}/${target.variantId}`;
        if (seen.has(key)) continue;
        existing.push({
            eventId: target.archiveId,
            variant: target.variantId,
            ...(target.storylineId === 'humanistic-cycle' ? { milestoneId: milestoneIdForTarget(target) } : {}),
            order: target.order,
            enabled: true
        });
        seen.add(key);
        changed = true;
    }
    if (!changed) return false;
    existing.sort((a, b) => {
        if (a.enabled === false && b.enabled !== false) return 1;
        if (a.enabled !== false && b.enabled === false) return -1;
        return (
            (a.order || 0) - (b.order || 0) || `${a.eventId}/${a.variant}`.localeCompare(`${b.eventId}/${b.variant}`)
        );
    });
    storyline.events = existing;
    return writeJson(filePath, storyline);
}

function writeProgressReport(results) {
    const archiveEventDirs = fs.existsSync(ARCHIVE_EVENTS)
        ? fs
              .readdirSync(ARCHIVE_EVENTS, { withFileTypes: true })
              .filter((entry) => entry.isDirectory())
              .map((entry) => entry.name)
              .sort()
        : [];
    const allTargets = selectedTargets('all');
    const archivedTargetCount = allTargets.filter((target) => archiveEventDirs.includes(target.archiveId)).length;
    const lines = [];
    lines.push('# Archive Migration Progress');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Archive event directories: ${archiveEventDirs.length}`);
    lines.push(`- Catalog/storyline migration targets: ${allTargets.length}`);
    lines.push(`- Targets with archive event directories: ${archivedTargetCount}`);
    lines.push(`- Migrated/updated in this run: ${results.filter((result) => result.status === 'migrated').length}`);
    lines.push(`- Already existed: ${results.filter((result) => result.status === 'exists').length}`);
    lines.push(
        `- Missing generated milestones: ${results.filter((result) => result.status === 'missing-milestone').length}`
    );
    lines.push('');
    lines.push('## Remaining targets without archive event directories');
    lines.push('');
    const remaining = allTargets.filter((target) => !archiveEventDirs.includes(target.archiveId));
    if (remaining.length === 0) {
        lines.push('None.');
    } else {
        for (const target of remaining)
            lines.push(`- ${target.group}: \`${target.legacyKey}\` → \`${target.archiveId}/${target.variantId}\``);
    }
    lines.push('');
    lines.push('## Missing generated milestones in last run');
    lines.push('');
    const missing = results.filter((result) => result.status === 'missing-milestone');
    if (missing.length === 0) {
        lines.push('None.');
    } else {
        for (const result of missing)
            lines.push(`- ${result.target.group}: \`${result.target.legacyKey}\` expected \`${result.milestoneId}\``);
    }
    lines.push('');
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`);
}

function main() {
    const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
    const mode = modeArg ? modeArg.split('=')[1] : 'ai100';
    if (!['ai100', 'core', 'gaming', 'humanistic', 'all'].includes(mode)) throw new Error(`Unsupported mode: ${mode}`);
    const keys = process.argv.filter((arg) => !arg.startsWith('--')).slice(2);
    const targets = selectedTargets(mode).filter(
        (target) => keys.length === 0 || keys.includes(target.legacyKey) || keys.includes(target.archiveId)
    );
    const milestones = loadMilestones();
    const milestoneById = new Map(milestones.map((milestone) => [milestone.id, milestone]));
    const results = targets.map((target) => migrateTarget(target, milestoneById));

    for (const storylineId of [
        ...new Set(
            results.filter((result) => result.status !== 'missing-milestone').map((result) => result.target.storylineId)
        )
    ]) {
        updateStoryline(
            storylineId,
            results
                .filter((result) => result.status !== 'missing-milestone' && result.target.storylineId === storylineId)
                .map((result) => result.target)
        );
    }

    writeProgressReport(results);
    const counts = results.reduce((acc, result) => ({ ...acc, [result.status]: (acc[result.status] || 0) + 1 }), {});
    console.log(`Archive migration mode=${mode}: ${JSON.stringify(counts)}`);
    console.log(`Archive migration progress: ${path.relative(ROOT, REPORT_PATH)}`);
    if (counts['missing-milestone']) process.exitCode = 1;
}

main();
