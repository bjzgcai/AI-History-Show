#!/usr/bin/env node
'use strict';

/**
 * Completed one-time figure registry migration, retained only for read-only
 * historical reproduction and audit reporting. It is not an editing workflow.
 */

const fs = require('node:fs');
const path = require('node:path');

const { normalizeIdentityText } = require('./figure-registry');

const ROOT = path.resolve(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const FIGURES_PATH = path.join(ROOT, 'archive', 'figures', 'figures.json');
const REPORT_PATH = path.join(ROOT, '.tmp', 'archive-reports', 'figure-migration.md');
const REVIEWED_AT = '2026-08-04';
const FIGURE_ID_OVERRIDES = new Map([['1997-deep-blue:2', 'a-joseph-hoane-jr']]);
const FIGURE_NAME_OVERRIDES = new Map([
    [
        'a-joseph-hoane-jr',
        {
            en: 'A. Joseph Hoane Jr.',
            zh: '约瑟夫·霍恩'
        }
    ]
]);
const ORGANIZATION_NAMES = new Map([
    ['deepmind', { en: 'DeepMind', zh: 'DeepMind' }],
    ['microsoft-research-asia', { en: 'Microsoft Research Asia', zh: '微软亚洲研究院' }]
]);

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function localized(value, locale) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    return String(value[locale] || '').trim();
}

function slugify(value) {
    return (
        String(value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'figure'
    );
}

function mostFrequent(values) {
    const counts = new Map();
    for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
    return (
        [...counts.entries()].sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)[0]?.[0] ||
        ''
    );
}

function localizedChoice(values) {
    const en = mostFrequent(values.map((value) => localized(value, 'en')));
    const zh = mostFrequent(values.map((value) => localized(value, 'zh')));
    return { en: en || zh, zh: zh || en };
}

function roleMarksPrimary(role, index) {
    if (index === 0) return true;
    const text = `${localized(role, 'en')} ${localized(role, 'zh')}`.toLowerCase();
    if (/related|supporting|context|historian|commentator|相关|背景|辅助/.test(text)) return false;
    return /lead|first author|project leader|creator|co-author|author|co-developer|developer|inventor|founder|principal|主要|第一作者|项目负责人|推动者|提出者|共同作者|作者|共同开发|开发者|发明者|创始人/.test(
        text
    );
}

function sourceLabel(source) {
    if (!source) return { en: 'AI-History-Show legacy archive', zh: 'AI-History-Show 旧档案' };
    if (source.title && typeof source.title === 'object') return localizedChoice([source.title]);
    if (source.label && typeof source.label === 'object') return localizedChoice([source.label]);
    const label = String(source.title || source.label || source.type || 'Archive source');
    return { en: label, zh: label };
}

function sourceUrl(source, avatarPath) {
    return (
        (source && (source.url || source.doi || source.archiveUrl)) ||
        `https://github.com/bjzgcai/AI-History-Show/blob/main/${avatarPath}`
    );
}

function legacyLicense() {
    return {
        en: 'The original image source and reuse license were not recorded before the global figure migration; source review is required.',
        zh: '全局人物库迁移前未记录该图片的原始来源与再利用许可，仍需补充来源审核。'
    };
}

function defaultUsage() {
    return {
        en: 'Used as a biographical figure image in this exhibition; review the recorded source terms before redistribution.',
        zh: '用于本展览的人物资料展示；再次分发前应复核所记录来源的使用条款。'
    };
}

function loadArchive() {
    const events = [];
    const assetsByPath = new Map();

    for (const eventId of fs.readdirSync(EVENTS_DIR).sort()) {
        const eventDir = path.join(EVENTS_DIR, eventId);
        const eventPath = path.join(eventDir, 'event.json');
        if (!fs.existsSync(eventPath)) continue;
        const assetsPath = path.join(eventDir, 'assets.json');
        const sourcesPath = path.join(eventDir, 'sources.json');
        const event = readJson(eventPath);
        const assets = fs.existsSync(assetsPath) ? readJson(assetsPath) : [];
        const sources = fs.existsSync(sourcesPath) ? readJson(sourcesPath) : [];
        const sourcesById = new Map(sources.map((source) => [source.id, source]));
        const variants = [];
        const variantsDir = path.join(eventDir, 'variants');
        if (fs.existsSync(variantsDir)) {
            for (const fileName of fs
                .readdirSync(variantsDir)
                .filter((file) => file.endsWith('.json'))
                .sort()) {
                const filePath = path.join(variantsDir, fileName);
                variants.push({ filePath, data: readJson(filePath) });
            }
        }

        for (const asset of assets) {
            if (!asset.path) continue;
            const source =
                sourcesById.get(asset.sourceId) ||
                (Array.isArray(asset.sourceIds)
                    ? asset.sourceIds.map((id) => sourcesById.get(id)).find(Boolean)
                    : null);
            if (!assetsByPath.has(asset.path)) assetsByPath.set(asset.path, []);
            assetsByPath.get(asset.path).push({ eventId, asset, source });
        }

        events.push({ eventId, eventPath, assetsPath, event, assets, sources, variants });
    }
    return { events, assetsByPath };
}

function buildGroups(events) {
    const groups = [];
    for (const entry of events) {
        const eventGroups = (entry.event.figures || []).map((figure, index) => ({
            event: entry,
            index,
            occurrences: [{ kind: 'event', position: index, data: figure }],
            figureId: ''
        }));

        for (const variant of entry.variants) {
            if (!Array.isArray(variant.data.figures)) continue;
            const unmatched = [];
            const usedGroups = new Set();

            variant.data.figures.forEach((figure, position) => {
                const figureKeys = new Set(
                    [figure.figureId, localized(figure.name, 'en'), localized(figure.name, 'zh')]
                        .map(normalizeIdentityText)
                        .filter(Boolean)
                );
                const exactMatches = eventGroups.filter((group) => {
                    if (usedGroups.has(group)) return false;
                    const eventFigure = group.occurrences[0].data;
                    const eventKeys = [
                        eventFigure.figureId,
                        localized(eventFigure.name, 'en'),
                        localized(eventFigure.name, 'zh')
                    ]
                        .map(normalizeIdentityText)
                        .filter(Boolean);
                    if (figure.figureId && eventFigure.figureId === figure.figureId) return true;
                    if (figure.avatar && eventFigure.avatar && figure.avatar === eventFigure.avatar) return true;
                    return eventKeys.some((key) => figureKeys.has(key));
                });
                if (exactMatches.length === 1) {
                    exactMatches[0].occurrences.push({
                        kind: 'variant',
                        filePath: variant.filePath,
                        position,
                        data: figure
                    });
                    usedGroups.add(exactMatches[0]);
                } else {
                    unmatched.push({ figure, position });
                }
            });

            const unmatchedEventGroups = eventGroups.filter((group) => !usedGroups.has(group));
            if (unmatched.length === 1 && unmatchedEventGroups.length === 1) {
                unmatchedEventGroups[0].occurrences.push({
                    kind: 'variant',
                    filePath: variant.filePath,
                    position: unmatched[0].position,
                    data: unmatched[0].figure
                });
                usedGroups.add(unmatchedEventGroups[0]);
                unmatched.length = 0;
            } else if (
                unmatched.length > 0 &&
                unmatched.length === unmatchedEventGroups.length &&
                unmatchedEventGroups.every((group) => !group.occurrences[0].data.name)
            ) {
                for (const item of unmatched) {
                    const positionalGroup = unmatchedEventGroups.find((group) => group.index === item.position);
                    if (!positionalGroup) continue;
                    positionalGroup.occurrences.push({
                        kind: 'variant',
                        filePath: variant.filePath,
                        position: item.position,
                        data: item.figure
                    });
                    usedGroups.add(positionalGroup);
                }
                unmatched.length = 0;
            }

            for (const item of unmatched) {
                const group = {
                    event: entry,
                    index: eventGroups.length,
                    occurrences: [
                        {
                            kind: 'variant',
                            filePath: variant.filePath,
                            position: item.position,
                            data: item.figure
                        }
                    ],
                    figureId: ''
                };
                eventGroups.push(group);
            }
        }
        groups.push(...eventGroups);
    }
    return groups;
}

function groupNames(group) {
    return group.occurrences.map(({ data }) => data.name).filter(Boolean);
}

function groupIdentityKeys(group) {
    return [
        ...groupNames(group).flatMap((name) => [localized(name, 'en'), localized(name, 'zh')]),
        ...group.occurrences.map(({ data }) => data.figureId)
    ]
        .map(normalizeIdentityText)
        .filter(Boolean);
}

function assignFigureIds(groups) {
    const knownByIdentity = new Map();
    const usedIds = new Set();

    for (const group of groups) {
        const overrideId = FIGURE_ID_OVERRIDES.get(`${group.event.eventId}:${group.index}`);
        if (overrideId) {
            group.figureId = overrideId;
            usedIds.add(overrideId);
        }
        const existingIds = [...new Set(group.occurrences.map(({ data }) => data.figureId).filter(Boolean))];
        if (existingIds.length > 1)
            throw new Error(`${group.event.eventId} figure ${group.index} has conflicting IDs.`);
        if (existingIds.length === 1 && !group.figureId) {
            group.figureId = existingIds[0];
            usedIds.add(group.figureId);
            for (const key of groupIdentityKeys(group)) {
                if (!knownByIdentity.has(key)) knownByIdentity.set(key, new Set());
                knownByIdentity.get(key).add(group.figureId);
            }
        }
    }

    for (const group of groups.filter((item) => !item.figureId)) {
        const candidates = new Set(groupIdentityKeys(group).flatMap((key) => [...(knownByIdentity.get(key) || [])]));
        if (candidates.size === 1) group.figureId = [...candidates][0];
    }

    const newIdByIdentity = new Map();
    for (const group of groups.filter((item) => !item.figureId)) {
        const names = groupNames(group);
        const canonical = localizedChoice(names);
        const key = normalizeIdentityText(canonical.en) || normalizeIdentityText(canonical.zh);
        if (newIdByIdentity.has(key)) {
            group.figureId = newIdByIdentity.get(key);
            continue;
        }
        const baseId = slugify(canonical.en || canonical.zh);
        let figureId = baseId;
        let suffix = 2;
        while (usedIds.has(figureId)) figureId = `${baseId}-${suffix++}`;
        group.figureId = figureId;
        usedIds.add(figureId);
        newIdByIdentity.set(key, figureId);
    }
}

function buildRegistry(groups, assetsByPath, existingFigures = []) {
    const existingById = new Map(existingFigures.map((figure) => [figure.id, figure]));
    const grouped = new Map();
    for (const group of groups) {
        if (!grouped.has(group.figureId)) grouped.set(group.figureId, []);
        grouped.get(group.figureId).push(group);
    }

    const figures = [];
    for (const [figureId, identityGroups] of grouped) {
        const existing = existingById.get(figureId) || {};
        const occurrences = identityGroups.flatMap((group) => group.occurrences.map(({ data }) => data));
        const names = occurrences.map((figure) => figure.name).filter(Boolean);
        const name = FIGURE_NAME_OVERRIDES.get(figureId) || existing.name || localizedChoice(names);
        const aliases = [
            ...new Set(
                [
                    ...(existing.aliases || []),
                    ...names.flatMap((value) => [localized(value, 'en'), localized(value, 'zh')])
                ].filter((value) => value && value !== name.en && value !== name.zh)
            )
        ].sort();
        const type = existing.type || mostFrequent(occurrences.map((figure) => figure.figureType)) || 'person';
        const organizationIds = [
            ...new Set([
                ...(existing.organizationIds || []),
                ...occurrences.flatMap((figure) => figure.organizationIds || []).filter(Boolean)
            ])
        ].sort();
        const avatarPath =
            (existing.defaultAvatar && existing.defaultAvatar.path) ||
            mostFrequent(occurrences.map((figure) => figure.avatar));
        const avatarStyle = existing.defaultAvatar
            ? existing.defaultAvatar.avatarStyle || ''
            : mostFrequent(
                  occurrences.filter((figure) => figure.avatar === avatarPath).map((figure) => figure.avatarStyle)
              );
        const documentedAvatar = avatarPath ? (assetsByPath.get(avatarPath) || [])[0] : null;
        const source = documentedAvatar && documentedAvatar.source;
        const asset = documentedAvatar && documentedAvatar.asset;
        const license = (asset && asset.rights && asset.rights.license) || legacyLicense();
        const usage = (asset && (asset.displayUsage || (asset.rights && asset.rights.usage))) || defaultUsage();
        const profileUrl = avatarPath ? sourceUrl(source, avatarPath) : '';
        const profileLabel = sourceLabel(source);
        const needsSource = Boolean(avatarPath && !documentedAvatar);
        const figure = {
            id: figureId,
            name,
            aliases,
            ...(existing.disambiguation ? { disambiguation: existing.disambiguation } : {}),
            type,
            organizationIds,
            profileSources:
                existing.profileSources ||
                (profileUrl
                    ? [
                          {
                              type: source ? source.type || 'archive-source' : 'legacy-archive',
                              label: profileLabel,
                              url: profileUrl
                          }
                      ]
                    : []),
            ...(avatarPath
                ? {
                      defaultAvatar: existing.defaultAvatar || {
                          path: avatarPath,
                          sourceName: profileLabel,
                          sourceUrl: profileUrl,
                          rights: {
                              status: (asset && asset.rights && asset.rights.status) || 'needs-source',
                              license,
                              usage
                          },
                          avatarStyle
                      }
                  }
                : {}),
            review: existing.review || {
                status: needsSource ? 'needs-source' : 'draft',
                reviewedAt: REVIEWED_AT,
                reviewer: 'archive-migration',
                notes: {
                    en: needsSource
                        ? 'Migrated from inline figure data; the original avatar source still requires verification.'
                        : 'Migrated from inline event and storyline figure data; identity review remains pending.',
                    zh: needsSource
                        ? '由内联人物数据迁移；头像原始来源仍需核验。'
                        : '由事件与 storyline 的内联人物数据迁移；身份信息仍待人工复核。'
                }
            }
        };
        if (figureId === 'michael-i-jordan') {
            figure.disambiguation = {
                en: 'Computer scientist Michael I. Jordan, not the basketball player Michael Jordan.',
                zh: '计算机科学家迈克尔·I·乔丹，与同名篮球运动员区别。'
            };
        }
        figures.push(figure);
    }
    const migratedIds = new Set(figures.map((figure) => figure.id));
    for (const existing of existingFigures) {
        if (!migratedIds.has(existing.id)) figures.push(existing);
    }
    const referencedOrganizationIds = new Set(figures.flatMap((figure) => figure.organizationIds || []));
    const existingIds = new Set(figures.map((figure) => figure.id));
    for (const organizationId of referencedOrganizationIds) {
        if (existingIds.has(organizationId)) continue;
        const name = ORGANIZATION_NAMES.get(organizationId) || {
            en: organizationId
                .split('-')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' '),
            zh: organizationId
        };
        figures.push({
            id: organizationId,
            name,
            aliases: [],
            type: 'organization',
            organizationIds: [],
            profileSources: [],
            review: {
                status: 'draft',
                reviewedAt: REVIEWED_AT,
                reviewer: 'archive-migration',
                notes: {
                    en: 'Created from an organization reference during the global figure migration.',
                    zh: '由全局人物库迁移期间发现的机构引用创建。'
                }
            }
        });
    }
    return figures.sort((left, right) => left.id.localeCompare(right.id));
}

function uniqueAssetId(entry, baseId) {
    const used = new Set(entry.assets.map((asset) => asset.id));
    if (!used.has(baseId)) return baseId;
    let suffix = 2;
    while (used.has(`${baseId}-${suffix}`)) suffix += 1;
    return `${baseId}-${suffix}`;
}

function findAvatarAssetId(entry, avatarPath, figureId, registryFigure, assetsByPath) {
    if (!avatarPath) return '';
    let asset = entry.assets.find((candidate) => candidate.path === avatarPath);
    if (!asset && avatarPath !== (registryFigure.defaultAvatar && registryFigure.defaultAvatar.path)) {
        const documented = (assetsByPath.get(avatarPath) || [])[0];
        const fallbackSource =
            entry.sources.find((source) => source.id === 'source-legacy-event-record') || entry.sources[0];
        if (!fallbackSource) return '';
        const name = registryFigure.name;
        const rights = (documented && documented.asset && documented.asset.rights) || {
            status: 'needs-source',
            license: legacyLicense()
        };
        asset = {
            id: uniqueAssetId(entry, `asset-${entry.eventId}-figure-avatar-${figureId}`),
            type: 'image',
            path: avatarPath,
            role: 'portrait',
            caption: {
                en: `${name.en} portrait`,
                zh: `${name.zh}肖像`
            },
            subcaption: {
                en: 'Event-specific biographical image retained during the global figure migration.',
                zh: '全局人物库迁移期间保留的事件专属人物图片。'
            },
            sourceId: fallbackSource.id,
            rights,
            displayUsage: defaultUsage(),
            usage: ['figure-avatar'],
            editable: true,
            figureIds: [figureId]
        };
        if (documented && documented.source) {
            asset.sourceName = sourceLabel(documented.source);
            asset.sourceUrl = sourceUrl(documented.source, avatarPath);
        }
        entry.assets.push(asset);
    }
    if (!asset) return '';
    if (!Array.isArray(asset.figureIds)) asset.figureIds = [];
    if (!asset.figureIds.includes(figureId)) asset.figureIds.push(figureId);
    asset.figureIds.sort();
    return asset.id;
}

function relationFor(figure, position, group, registryFigure, entry, assetsByPath) {
    const relation = { figureId: group.figureId };
    if (figure.role) relation.role = figure.role;
    if (roleMarksPrimary(figure.role, position)) relation.primary = true;
    const defaultAvatarPath = registryFigure.defaultAvatar && registryFigure.defaultAvatar.path;
    const usesDefaultAvatar =
        figure.useDefaultAvatar === true || (figure.avatar && figure.avatar === defaultAvatarPath);
    if (usesDefaultAvatar) {
        relation.useDefaultAvatar = true;
    } else {
        const avatarAssetId =
            figure.avatarAssetId ||
            findAvatarAssetId(entry, figure.avatar, group.figureId, registryFigure, assetsByPath);
        if (avatarAssetId) relation.avatarAssetId = avatarAssetId;
    }
    const defaultStyle = (registryFigure.defaultAvatar && registryFigure.defaultAvatar.avatarStyle) || '';
    if (
        Object.hasOwn(figure, 'avatarStyle') &&
        (!usesDefaultAvatar || String(figure.avatarStyle || '') !== defaultStyle)
    ) {
        relation.avatarStyle = String(figure.avatarStyle || '');
    }
    return relation;
}

function rewriteArchive(groups, figures, assetsByPath) {
    const registryById = new Map(figures.map((figure) => [figure.id, figure]));
    const groupsByEvent = new Map();
    for (const group of groups) {
        if (!groupsByEvent.has(group.event.eventId)) groupsByEvent.set(group.event.eventId, []);
        groupsByEvent.get(group.event.eventId).push(group);
    }

    for (const [eventId, eventGroups] of groupsByEvent) {
        const entry = eventGroups[0].event;
        entry.event.figures = eventGroups
            .flatMap((group) =>
                group.occurrences.filter((item) => item.kind === 'event').map((occurrence) => ({ group, occurrence }))
            )
            .sort((left, right) => left.occurrence.position - right.occurrence.position)
            .map(({ group, occurrence }) =>
                relationFor(
                    occurrence.data,
                    occurrence.position,
                    group,
                    registryById.get(group.figureId),
                    entry,
                    assetsByPath
                )
            );

        for (const variant of entry.variants) {
            if (!Array.isArray(variant.data.figures)) continue;
            variant.data.figures = eventGroups
                .flatMap((group) =>
                    group.occurrences
                        .filter((item) => item.kind === 'variant' && item.filePath === variant.filePath)
                        .map((occurrence) => ({ group, occurrence }))
                )
                .sort((left, right) => left.occurrence.position - right.occurrence.position)
                .map(({ group, occurrence }) =>
                    relationFor(
                        occurrence.data,
                        occurrence.position,
                        group,
                        registryById.get(group.figureId),
                        entry,
                        assetsByPath
                    )
                )
                .map(({ primary: _primary, ...relation }) => relation);
        }

        if (!eventId) throw new Error('Unexpected empty event id.');
    }
}

function duplicateCandidates(figures) {
    const byName = new Map();
    for (const figure of figures) {
        for (const value of [figure.name.en, figure.name.zh, ...(figure.aliases || [])]) {
            const key = normalizeIdentityText(value);
            if (!key) continue;
            if (!byName.has(key)) byName.set(key, new Set());
            byName.get(key).add(figure.id);
        }
    }
    return [...byName.entries()].filter(([, ids]) => ids.size > 1);
}

function writeReport(groups, figures) {
    const duplicateNames = duplicateCandidates(figures);
    const missingAvatars = figures.filter((figure) => figure.type === 'person' && !figure.defaultAvatar);
    const needsSource = figures.filter((figure) => figure.review.status === 'needs-source');
    const lines = [
        '# Figure Registry Migration',
        '',
        '- Mode: report only (retired one-time migration)',
        `- Figure relations: ${groups.length}`,
        `- Global identities: ${figures.length}`,
        `- Person identities without a default avatar: ${missingAvatars.length}`,
        `- Avatar records requiring source review: ${needsSource.length}`,
        `- Duplicate identity candidates: ${duplicateNames.length}`,
        '',
        '## Needs Source Review',
        '',
        ...(needsSource.length ? needsSource.map((figure) => `- \`${figure.id}\` — ${figure.name.en}`) : ['None.']),
        '',
        '## Missing Default Avatars',
        '',
        ...(missingAvatars.length
            ? missingAvatars.map((figure) => `- \`${figure.id}\` — ${figure.name.en}`)
            : ['None.']),
        '',
        '## Duplicate Candidates',
        '',
        ...(duplicateNames.length
            ? duplicateNames.map(([name, ids]) => `- \`${name}\` — ${[...ids].join(', ')}`)
            : ['None.']),
        ''
    ];
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, lines.join('\n'));
}

function main() {
    if (process.argv.includes('--write')) {
        throw new Error('Figure registry migration is retired; --write is no longer supported.');
    }
    const { events, assetsByPath } = loadArchive();
    const groups = buildGroups(events);
    assignFigureIds(groups);
    const existingFigures = fs.existsSync(FIGURES_PATH) ? readJson(FIGURES_PATH) : [];
    const figures = buildRegistry(groups, assetsByPath, existingFigures);
    rewriteArchive(groups, figures, assetsByPath);
    writeReport(groups, figures);
    console.log(`Figure migration report: ${path.relative(ROOT, REPORT_PATH)}`);
    console.log(`Analyzed ${groups.length} relations into ${figures.length} identities.`);
}

if (require.main === module) main();

module.exports = {
    assignFigureIds,
    buildGroups,
    buildRegistry,
    loadArchive,
    rewriteArchive
};
