#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const REPORT_DIR = path.join(ROOT, 'reports');
const MACHINE_REPORT_DIR = path.join(ROOT, '.tmp', 'archive-reports');
const REPORT_JSON = path.join(MACHINE_REPORT_DIR, 'event-figure-audit.json');
const REPORT_MD = path.join(REPORT_DIR, 'event-figure-audit.md');
const writeReports = !process.argv.includes('--check');
const legacyAvatars = require('../manage/figure-avatars.js');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function localized(value, locale) {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';
    return String(value[locale] || value[locale === 'en' ? 'zh' : 'en'] || '').trim();
}

function normalizeName(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
        .trim();
}

function comparablePersonName(value) {
    return normalizeName(value)
        .split(' ')
        .filter((token) => token.length > 1)
        .join(' ');
}

function humanizeFigureId(figureId) {
    return String(figureId || '')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function localFileExists(relativePath) {
    return Boolean(relativePath && !/^https?:\/\//i.test(relativePath) && fs.existsSync(path.join(ROOT, relativePath)));
}

function isPortraitAsset(asset, figures) {
    const role = String(asset && asset.role ? asset.role : '').toLowerCase();
    const assetPath = String(asset && asset.path ? asset.path : '').toLowerCase();
    const captionNameText = [localized(asset && asset.caption, 'en'), localized(asset && asset.caption, 'zh')]
        .join(' ')
        .toLowerCase();
    const descriptorText = [
        localized(asset && asset.caption, 'en'),
        localized(asset && asset.caption, 'zh'),
        localized(asset && asset.subcaption, 'en'),
        localized(asset && asset.subcaption, 'zh')
    ]
        .join(' ')
        .toLowerCase();
    const namesFigure = figures.some((figure) =>
        [figure.name.en, figure.name.zh]
            .map((name) => String(name || '').toLowerCase())
            .filter(Boolean)
            .some((name) => captionNameText.includes(name))
    );
    return (
        /portrait|person-photo|people-photo|author-photo|team-photo/.test(role) ||
        /\/(?:people|photos)\//.test(assetPath) ||
        /portrait|headshot/.test(assetPath) ||
        /portrait|肖像|人物照|人物图|photographed|at a blackboard/.test(descriptorText) ||
        namesFigure
    );
}

function listVariantFiles(eventDir) {
    const variantsDir = path.join(eventDir, 'variants');
    if (!fs.existsSync(variantsDir)) return [];
    return fs
        .readdirSync(variantsDir)
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => ({ file, data: readJson(path.join(variantsDir, file)) }));
}

function resolveFigure(eventFigure, variantFigures, index) {
    const variantFigure = variantFigures[index] || {};
    const figureId = typeof eventFigure === 'string' ? eventFigure : eventFigure.figureId || '';
    const explicitName = typeof eventFigure === 'object' ? eventFigure.name : null;
    const nameEn = localized(explicitName, 'en') || localized(variantFigure.name, 'en') || humanizeFigureId(figureId);
    const nameZh = localized(explicitName, 'zh') || localized(variantFigure.name, 'zh') || nameEn;
    const role = typeof eventFigure === 'object' ? eventFigure.role : null;
    const avatar = (typeof eventFigure === 'object' && eventFigure.avatar) || variantFigure.avatar || '';
    const figureType =
        (typeof eventFigure === 'object' && eventFigure.figureType) || variantFigure.figureType || 'person';
    const legacy = legacyAvatars[nameEn] || legacyAvatars[nameZh] || null;
    return {
        figureId,
        name: { en: nameEn, zh: nameZh },
        role: {
            en: localized(role, 'en') || localized(variantFigure.role, 'en'),
            zh: localized(role, 'zh') || localized(variantFigure.role, 'zh')
        },
        figureType,
        avatar,
        avatarExists: localFileExists(avatar),
        legacyAvatar: legacy && localFileExists(legacy.avatar) ? legacy.avatar : '',
        legacyStatus: legacy ? legacy.status || '' : ''
    };
}

function assetCaptionMatchesFigure(asset, figure) {
    const caption = [localized(asset.caption, 'en'), localized(asset.caption, 'zh')].join(' ').toLowerCase();
    return [figure.name.en, figure.name.zh]
        .map((name) => String(name || '').toLowerCase())
        .filter(Boolean)
        .some((name) => caption.includes(name));
}

function auditEvent(eventId) {
    const eventDir = path.join(EVENTS_DIR, eventId);
    const event = readJson(path.join(eventDir, 'event.json'));
    const assets = readJson(path.join(eventDir, 'assets.json'));
    const variants = listVariantFiles(eventDir);
    const variantFigures = variants.flatMap(({ data }) => (Array.isArray(data.figures) ? data.figures : []));
    const canonicalFigures = Array.isArray(event.figures) ? event.figures : [];
    let figures = canonicalFigures.map((figure, index) => resolveFigure(figure, variantFigures, index));
    const portraitAssets = assets.filter((asset) => isPortraitAsset(asset, figures));
    const selectedAssetIds = new Set(variants.flatMap(({ data }) => data.assetIds || []));
    const selectedPortraits = portraitAssets.filter((asset) => selectedAssetIds.has(asset.id));
    const unselectedPortraits = portraitAssets.filter((asset) => !selectedAssetIds.has(asset.id));
    figures = figures.map((figure) => ({
        ...figure,
        matchingSelectedPortraits: selectedPortraits
            .filter((asset) => assetCaptionMatchesFigure(asset, figure))
            .map((asset) => ({ id: asset.id, path: asset.path }))
    }));
    const brokenFigureAvatars = figures.filter((figure) => figure.avatar && !figure.avatarExists);
    const figuresWithoutAvatar = figures.filter((figure) => !figure.avatarExists);
    const reusableLegacyAvatars = figuresWithoutAvatar.filter((figure) => figure.legacyAvatar);

    const canonicalNames = new Set(
        figures.flatMap((figure) => [normalizeName(figure.name.en), normalizeName(figure.name.zh)]).filter(Boolean)
    );
    const variantOnlyNames = variantFigures
        .map((figure) => ({ en: localized(figure.name, 'en'), zh: localized(figure.name, 'zh') }))
        .filter((name) => {
            const keys = [normalizeName(name.en), normalizeName(name.zh)].filter(Boolean);
            return keys.length > 0 && !keys.some((key) => canonicalNames.has(key));
        });

    const issues = [];
    if (figures.length === 0) issues.push('missing canonical main figure');
    if (figures.length > 0 && !figures.some((figure) => figure.figureType === 'person')) {
        issues.push('event has no person-type figure');
    }
    if (figures.length > 0 && !figures[0].avatarExists && selectedPortraits.length === 0) {
        issues.push('main figure has no explicit avatar or selected portrait');
    }
    if (figuresWithoutAvatar.length > 0)
        issues.push(`${figuresWithoutAvatar.length} figure(s) lack explicit local avatars`);
    if (brokenFigureAvatars.length > 0) issues.push(`${brokenFigureAvatars.length} figure avatar path(s) are missing`);
    if (variantOnlyNames.length > 0)
        issues.push(`${variantOnlyNames.length} variant figure name(s) are absent from canonical event facts`);
    if (unselectedPortraits.length > 0)
        issues.push(`${unselectedPortraits.length} portrait asset(s) are not selected by a variant`);
    if (reusableLegacyAvatars.length > 0)
        issues.push(`${reusableLegacyAvatars.length} local legacy avatar candidate(s) can be reused`);
    const reusableSelectedPortraits = figures.filter(
        (figure) => !figure.avatarExists && figure.matchingSelectedPortraits.length > 0
    );
    if (reusableSelectedPortraits.length > 0) {
        issues.push(`${reusableSelectedPortraits.length} selected portrait(s) can populate explicit figure avatars`);
    }

    return {
        eventId,
        year: event.year,
        title: { en: localized(event.title, 'en'), zh: localized(event.title, 'zh') },
        figures,
        portraitAssets: portraitAssets.map((asset) => ({ id: asset.id, path: asset.path, role: asset.role || '' })),
        selectedPortraits: selectedPortraits.map((asset) => ({ id: asset.id, path: asset.path })),
        unselectedPortraits: unselectedPortraits.map((asset) => ({ id: asset.id, path: asset.path })),
        variantOnlyNames,
        issues
    };
}

function escapeTable(value) {
    return String(value || '')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ');
}

function findAvatarConflicts(items) {
    const byAvatar = new Map();

    for (const item of items) {
        for (const figure of item.figures) {
            if (!figure.avatarExists) continue;
            const identity = comparablePersonName(figure.name.en) || normalizeName(figure.name.zh) || figure.figureId;
            if (!identity) continue;
            if (!byAvatar.has(figure.avatar)) byAvatar.set(figure.avatar, new Map());
            const identities = byAvatar.get(figure.avatar);
            if (!identities.has(identity)) {
                identities.set(identity, {
                    figureId: figure.figureId,
                    names: new Set(),
                    eventIds: new Set()
                });
            }
            const record = identities.get(identity);
            if (figure.name.en) record.names.add(figure.name.en);
            if (figure.name.zh) record.names.add(figure.name.zh);
            record.eventIds.add(item.eventId);
        }
    }

    return [...byAvatar.entries()]
        .filter(([, identities]) => identities.size > 1)
        .map(([avatar, identities]) => ({
            avatar,
            figures: [...identities.values()].map((record) => ({
                figureId: record.figureId,
                names: [...record.names],
                eventIds: [...record.eventIds]
            }))
        }));
}

function figureIdentityKeys(figure) {
    return [figure.figureId, figure.name.en, figure.name.zh].map(normalizeName).filter(Boolean);
}

function attachCrossEventAvatarCandidates(items) {
    const byIdentity = new Map();

    for (const item of items) {
        for (const figure of item.figures) {
            if (!figure.avatarExists || figure.figureType !== 'person') continue;
            for (const key of figureIdentityKeys(figure)) {
                if (!byIdentity.has(key)) byIdentity.set(key, []);
                byIdentity.get(key).push({
                    eventId: item.eventId,
                    figureId: figure.figureId,
                    avatar: figure.avatar
                });
            }
        }
    }

    for (const item of items) {
        for (const figure of item.figures) {
            const candidates = figureIdentityKeys(figure)
                .flatMap((key) => byIdentity.get(key) || [])
                .filter((candidate) => candidate.eventId !== item.eventId);
            figure.reusableCrossEventAvatars = [
                ...new Map(
                    candidates.map((candidate) => [`${candidate.eventId}\0${candidate.avatar}`, candidate])
                ).values()
            ];
            if (figure.avatarExists || figure.reusableCrossEventAvatars.length === 0) continue;

            const uniqueAvatars = new Set(figure.reusableCrossEventAvatars.map((candidate) => candidate.avatar));
            const sourceEvents = [...new Set(figure.reusableCrossEventAvatars.map((candidate) => candidate.eventId))];
            if (uniqueAvatars.size === 1) {
                item.issues.push(`cross-event avatar can be reused from ${sourceEvents.join(', ')}`);
            } else {
                item.issues.push(`cross-event avatar candidates need manual choice from ${sourceEvents.join(', ')}`);
            }
        }
    }
}

function renderReport(items, avatarConflicts) {
    const withIssues = items.filter((item) => item.issues.length > 0);
    const noSelectedPortrait = items.filter((item) => item.selectedPortraits.length === 0);
    const missingExplicitAvatars = items.filter((item) => item.figures.some((figure) => !figure.avatarExists));
    const variantDrift = items.filter((item) => item.variantOnlyNames.length > 0);
    const withoutPerson = items.filter(
        (item) => item.figures.length > 0 && !item.figures.some((figure) => figure.figureType === 'person')
    );
    const reusableCrossEventAvatars = items.reduce(
        (count, item) =>
            count +
            item.figures.filter((figure) => !figure.avatarExists && figure.reusableCrossEventAvatars.length > 0).length,
        0
    );
    const lines = [
        '# Event Figure and Portrait Audit',
        '',
        'This is a structural worklist. Historical identity and image licensing still require manual verification against authoritative sources.',
        '',
        '## Summary',
        '',
        `- Events: ${items.length}`,
        `- Events with structural issues: ${withIssues.length}`,
        `- Events without a selected portrait asset: ${noSelectedPortrait.length}`,
        `- Events with one or more figures lacking explicit local avatars: ${missingExplicitAvatars.length}`,
        `- Events with canonical/variant figure drift: ${variantDrift.length}`,
        `- Events without a person-type figure: ${withoutPerson.length}`,
        `- Missing figures with reusable cross-event avatars: ${reusableCrossEventAvatars}`,
        `- Avatar files assigned to different people: ${avatarConflicts.length}`,
        '',
        '## Worklist',
        '',
        '| Event | Year | Main figures | Selected portraits | Issues |',
        '| --- | ---: | --- | ---: | --- |'
    ];

    for (const item of items) {
        const figureNames = item.figures
            .map((figure) => figure.name.en)
            .filter(Boolean)
            .join(', ');
        lines.push(
            `| ${item.eventId} / ${escapeTable(item.title.en)} | ${item.year || ''} | ${escapeTable(figureNames || 'none')} | ${item.selectedPortraits.length} | ${escapeTable(item.issues.join('; ') || 'ready for manual fact review')} |`
        );
    }

    if (avatarConflicts.length > 0) {
        lines.push('', '## Avatar Conflicts', '');
        lines.push('| Avatar | Conflicting figures |', '| --- | --- |');
        for (const conflict of avatarConflicts) {
            const figures = conflict.figures
                .map((figure) => `${figure.names[0] || figure.figureId} (${figure.eventIds.join(', ')})`)
                .join('; ');
            lines.push(`| ${escapeTable(conflict.avatar)} | ${escapeTable(figures)} |`);
        }
    }

    lines.push('', '## Review Rules', '');
    lines.push(
        '1. Confirm the event has its principal inventor, lead author, or project leader before adding secondary figures.'
    );
    lines.push('2. Prefer an existing local portrait when its identity and provenance are already documented.');
    lines.push(
        '3. For new portraits, prefer official personal, university, research-institute, publisher, conference, or Wikimedia Commons pages.'
    );
    lines.push(
        '4. Record bilingual caption, relationship, source, source URL, license, and usage notes for every selected portrait.'
    );
    lines.push('5. Do not use search-result thumbnails or unattributed social-media images as production assets.');
    lines.push('');
    return `${lines.join('\n')}\n`;
}

const items = fs
    .readdirSync(EVENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(EVENTS_DIR, entry.name, 'event.json')))
    .map((entry) => auditEvent(entry.name))
    .sort((a, b) => Number(a.year || 0) - Number(b.year || 0) || a.eventId.localeCompare(b.eventId));

attachCrossEventAvatarCandidates(items);
const avatarConflicts = findAvatarConflicts(items);
for (const conflict of avatarConflicts) {
    const names = conflict.figures.map((figure) => figure.names[0] || figure.figureId).join(', ');
    for (const eventId of new Set(conflict.figures.flatMap((figure) => figure.eventIds))) {
        const item = items.find((candidate) => candidate.eventId === eventId);
        if (item) item.issues.push(`avatar is assigned to different figures: ${names}`);
    }
}

const report = {
    generatedAt: new Date().toISOString(),
    summary: {
        events: items.length,
        eventsWithIssues: items.filter((item) => item.issues.length > 0).length,
        eventsWithoutSelectedPortrait: items.filter((item) => item.selectedPortraits.length === 0).length,
        eventsWithMissingExplicitAvatars: items.filter((item) => item.figures.some((figure) => !figure.avatarExists))
            .length,
        eventsWithCanonicalVariantDrift: items.filter((item) => item.variantOnlyNames.length > 0).length,
        eventsWithoutPersonFigure: items.filter(
            (item) => item.figures.length > 0 && !item.figures.some((figure) => figure.figureType === 'person')
        ).length,
        reusableCrossEventAvatars: items.reduce(
            (count, item) =>
                count +
                item.figures.filter((figure) => !figure.avatarExists && figure.reusableCrossEventAvatars.length > 0)
                    .length,
            0
        ),
        avatarConflicts: avatarConflicts.length
    },
    avatarConflicts,
    items
};

if (writeReports) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.mkdirSync(MACHINE_REPORT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(REPORT_MD, renderReport(items, avatarConflicts));
}

console.log(writeReports ? `Event figure audit: ${REPORT_MD}` : 'Event figure audit check');
console.log(
    `${report.summary.events} event(s), ${report.summary.eventsWithIssues} with structural issues, ${report.summary.eventsWithoutSelectedPortrait} without a selected portrait, ${report.summary.avatarConflicts} cross-person avatar conflict(s).`
);
if (avatarConflicts.length > 0) process.exitCode = 1;
