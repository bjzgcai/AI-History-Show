#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const events = require('../manage/events.js');
const quizCatalog = require('../manage/quizzes.js');
const {
    sourceLabel,
    sourcePurpose,
    sourceReliability,
    sourceTitle,
    sourceTypeFromLegacy
} = require('./archive-source-normalizer.js');

const DEFAULT_KEYS = [
    '1950-turing-test',
    '1958-lisp',
    '1971-complexity-theory',
    '1971-vc-theory',
    '1956-logic-theorist',
    '1958-wangs-algorithm',
    '1960-davis-putnam-dpll',
    '2014-adam',
    '2014-vgg',
    '1975-genetic-algorithm'
];

function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function isLocalized(value) {
    return Boolean(
        value && typeof value === 'object' && !Array.isArray(value) && (hasOwn(value, 'zh') || hasOwn(value, 'en'))
    );
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

function assetRole(assetPath, index) {
    const p = assetPath.toLowerCase();
    if (p.includes('people') || p.includes('figures') || p.includes('portrait'))
        return index === 0 ? 'portrait' : 'team-photo';
    if (p.includes('architecture') || p.includes('explainer') || p.endsWith('.svg')) return 'architecture-explainer';
    if (p.includes('paper')) return 'paper-page';
    return index === 0 ? 'source-card' : 'algorithm-explainer';
}

function regionFromCountry(country) {
    const value = `${text(country, 'en')} ${text(country, 'zh')}`.toLowerCase();
    if (value.includes('united states') || value.includes('usa') || value.includes('美国')) return 'usa';
    if (value.includes('canada') || value.includes('加拿大')) return 'canada';
    if (value.includes('united kingdom') || value.includes('uk') || value.includes('英国')) return 'united-kingdom';
    if (value.includes('japan') || value.includes('日本')) return 'japan';
    if (value.includes('china') || value.includes('中国')) return 'china';
    if (value.includes('france') || value.includes('法国')) return 'france';
    if (value.includes('germany') || value.includes('德国')) return 'germany';
    if (value.includes('switzerland') || value.includes('瑞士')) return 'switzerland';
    return slug(text(country, 'en') || text(country, 'zh') || 'unknown-region', 'unknown-region');
}

function writeJson(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function buildSources(key, ev) {
    const rawSources = (ev.achievement && Array.isArray(ev.achievement.sources) ? ev.achievement.sources : []).filter(
        (source) => source && source.url
    );
    const sources = rawSources.map((source, index) => {
        const type = sourceTypeFromLegacy(source.type, source.label, source.title, source.url);
        const title = sourceTitle(type, localized(source.title || source.label || source.url, source.url));
        return {
            id: `source-${slug(text(title, 'en') || text(title, 'zh') || `${key}-${index + 1}`, `source-${index + 1}`)}`,
            type,
            label: sourceLabel(type),
            title,
            url: source.url,
            language: 'en',
            purpose: sourcePurpose(type, index, source.type, source.label, source.title),
            reliability: sourceReliability(type, index, source.reliability),
            notes: {
                zh:
                    index === 0
                        ? '由 legacy AI100 achievement sources 迁移的主要来源。'
                        : '由 legacy AI100 achievement sources 迁移的补充来源。',
                en:
                    index === 0
                        ? 'Primary source migrated from legacy AI100 achievement sources.'
                        : 'Supplementary source migrated from legacy AI100 achievement sources.'
            }
        };
    });

    if (sources.length === 0) {
        sources.push({
            id: 'source-legacy-ai100-notes',
            type: 'internal-record',
            label: sourceLabel('internal-record'),
            title: localized('Legacy BenchCouncil AI100 achievement notes'),
            url: 'https://www.benchcouncil.org/',
            language: 'en',
            purpose: sourcePurpose('internal-record'),
            reliability: sourceReliability('internal-record'),
            notes: {
                zh: '临时来源占位，需要后续补充主论文或原始资料。',
                en: 'Temporary source placeholder; primary paper or original material should be added later.'
            }
        });
    }

    const seen = new Set();
    return sources.map((source, index) => {
        let id = source.id;
        while (seen.has(id)) id = `${source.id}-${index + 1}`;
        seen.add(id);
        return { ...source, id };
    });
}

function buildAssets(key, ev, sources) {
    const primarySource = sources[0] && sources[0].id;
    const imageMeta = ev.imageMeta || {};
    return (ev.images || []).map((imagePath, index) => {
        const meta = imageMeta[imagePath] || {};
        const role = assetRole(imagePath, index);
        return {
            id: `asset-${slug(path.basename(imagePath, path.extname(imagePath)), `${key}-asset-${index + 1}`)}`,
            type: imagePath.toLowerCase().endsWith('.svg')
                ? 'svg'
                : imagePath.toLowerCase().endsWith('.gif')
                  ? 'gif'
                  : 'image',
            path: imagePath,
            role,
            caption: localized(meta.caption || `${text(ev.title, 'en')} ${role}`),
            subcaption: localized(meta.subcaption || role),
            sourceId: primarySource,
            rights: {
                status: role.includes('explainer') ? 'local-redraw' : 'external-reference',
                license: localized(
                    meta.license ||
                        meta.usage ||
                        'Migrated from legacy event media metadata; verify rights before publication.'
                )
            },
            usage: ['variant:bench-council-ai100'],
            editable: true
        };
    });
}

function buildClaims(key, ev, sources) {
    const sourceIds = sources.slice(0, Math.min(2, sources.length)).map((source) => source.id);
    const title = localized(ev.title || key);
    const method = ev.achievement && ev.achievement.method ? localized(ev.achievement.method) : null;
    const artifact = ev.achievement && ev.achievement.artifact ? localized(ev.achievement.artifact) : null;
    const claims = [
        {
            id: 'claim-ai100-achievement',
            importance: 'core',
            text: {
                zh: `${title.zh} 是 BenchCouncil AI100 叙事中的一个 AI 历史成就节点。`,
                en: `${title.en} is an AI history achievement node in the BenchCouncil AI100 storyline.`
            },
            sourceIds,
            status: 'needs-source'
        }
    ];
    if (method || artifact) {
        claims.push({
            id: 'claim-method-artifact',
            importance: 'context',
            text: {
                zh: `${title.zh} 的技术线索包括${method ? `「${method.zh}」` : '相关方法'}${artifact ? `，代表性产物是「${artifact.zh}」` : ''}。`,
                en: `${title.en} is described through ${method ? `the method "${method.en}"` : 'its method'}${artifact ? ` and the artifact "${artifact.en}"` : ''}.`
            },
            sourceIds,
            status: 'needs-source'
        });
    }
    return claims;
}

function normalizeQuiz(key) {
    const quizzes = (quizCatalog.events && quizCatalog.events[key]) || [];
    return quizzes.map((quiz, index) => ({
        id: `quiz-${key}-ai100${index ? `-${index + 1}` : ''}`,
        storylineId: 'bench-council-ai100',
        question: localized(quiz.question),
        options: (quiz.options || []).map((option) => localized(option)),
        answer: Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : 0,
        explanation: localized(quiz.explanation || ''),
        sourceIds: ['source-legacy-ai100-notes'],
        assetIds: []
    }));
}

function migrateEvent(key) {
    const ev = events[key];
    if (!ev) throw new Error(`Missing event: ${key}`);
    const dir = path.join(ARCHIVE_EVENTS, key);
    if (fs.existsSync(path.join(dir, 'event.json'))) {
        console.log(`Skip existing archive event: ${key}`);
        return false;
    }

    const sources = buildSources(key, ev);
    const assets = buildAssets(key, ev, sources);
    const claims = buildClaims(key, ev, sources);
    const quizzes = normalizeQuiz(key);
    const fallbackSourceId = sources[0] && sources[0].id;
    for (const quiz of quizzes) {
        quiz.sourceIds = fallbackSourceId ? [fallbackSourceId] : [];
        quiz.assetIds = assets[0] ? [assets[0].id] : [];
    }

    const event = {
        id: key,
        year: ev.year,
        date: String(ev.year || ''),
        title: localized(ev.title || key),
        summary: localized(ev.description || ev.title || key),
        description: localized(ev.description || ev.title || key),
        location: {
            regionId: regionFromCountry(ev.location && ev.location.country),
            country: localized(ev.location && ev.location.country, ''),
            place: localized(ev.location && ev.location.name, ''),
            coordinates: (ev.location && ev.location.coordinates) || []
        },
        topics: ['ai100'],
        achievementTypeIds:
            ev.achievement && ev.achievement.area
                ? [slug(text(ev.achievement.area, 'en'), 'achievement')]
                : ['achievement'],
        figures: (ev.figures || []).map((figure) => ({
            figureId: slug(text(figure.name, 'en') || text(figure.name, 'zh'), 'unknown-figure'),
            role: localized(figure.role || ''),
            organizationIds: []
        })),
        organizations: [],
        canonical: true,
        review: {
            status: 'draft',
            notes: {
                zh: 'Step 8 首批 AI100 批量迁移，需后续人工核对 claim 粒度与来源绑定。',
                en: 'Step 8 initial AI100 batch migration; claim granularity and source binding need later manual review.'
            }
        }
    };

    const quizId = quizzes[0] && quizzes[0].id;
    const variant = {
        storylineId: 'bench-council-ai100',
        eventId: key,
        displayTitle: localized(ev.title || key),
        displaySummary: localized(ev.description || ev.title || key),
        emphasis: ['ai100-batch-migration', 'source-review-needed'],
        visual: (ev.achievement && ev.achievement.visual) || 'archive-dossier',
        assetIds: assets.slice(0, 3).map((asset) => asset.id),
        sourceIds: sources.map((source) => source.id),
        claimIds: claims.map((claim) => claim.id),
        ...(quizId ? { quizId } : {}),
        commentarySections: Array.isArray(ev.commentarySections)
            ? ev.commentarySections.map((section, index) => ({
                  id: slug(text(section.label, 'en') || `section-${index + 1}`, `section-${index + 1}`),
                  label: localized(section.label || `Section ${index + 1}`),
                  html: localized(section.html || ''),
                  sourceIds: sources.slice(0, 1).map((source) => source.id)
              }))
            : [],
        review: {
            status: 'draft',
            notes: {
                zh: '由 legacy AI100 数据批量生成的 variant。',
                en: 'Variant generated from legacy AI100 data in a batch migration.'
            }
        }
    };

    writeJson(path.join(dir, 'event.json'), event);
    writeJson(path.join(dir, 'claims.json'), claims);
    writeJson(path.join(dir, 'sources.json'), sources);
    writeJson(path.join(dir, 'assets.json'), assets);
    writeJson(path.join(dir, 'quizzes.json'), quizzes);
    writeJson(path.join(dir, 'variants', 'bench-council-ai100.json'), variant);
    console.log(`Migrated ${key}`);
    return true;
}

function main() {
    const keys = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_KEYS;
    let migrated = 0;
    for (const key of keys) {
        if (migrateEvent(key)) migrated += 1;
    }
    console.log(`AI100 batch migration complete: ${migrated} migrated, ${keys.length - migrated} skipped.`);
}

main();
