#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createFigureRegistry, loadFigureRegistry, resolveFigureRelations } = require('./figure-registry');
const { buildRegistry, rewriteArchive } = require('./migrate-figure-registry');

const root = path.join(__dirname, '..');

function figure(id, name, defaultAvatar) {
    return {
        id,
        name,
        aliases: [],
        type: 'person',
        organizationIds: [],
        profileSources: [],
        ...(defaultAvatar
            ? {
                  defaultAvatar: {
                      path: defaultAvatar,
                      sourceName: { en: 'Test source', zh: '测试来源' },
                      sourceUrl: 'https://example.com/profile',
                      rights: {
                          status: 'test',
                          license: { en: 'Test only', zh: '仅用于测试' },
                          usage: { en: 'Test only', zh: '仅用于测试' }
                      }
                  }
              }
            : {}),
        review: {
            status: 'draft',
            reviewedAt: '2026-08-04',
            reviewer: 'test'
        }
    };
}

const primaryAvatar = 'resources/images/test-primary.jpg';
const overrideAvatar = 'resources/images/test-override.jpg';
const primaryFigure = figure('primary-person', { en: 'Primary Person', zh: '主要人物' }, primaryAvatar);
primaryFigure.defaultAvatar.avatarStyle = 'transform: scale(1.25);';
const testRegistry = createFigureRegistry([
    primaryFigure,
    figure('related-person', { en: 'Related Person', zh: '相关人物' })
]);
const assets = [
    {
        id: 'override-avatar',
        type: 'image',
        path: overrideAvatar,
        figureIds: ['primary-person']
    }
];

const resolved = resolveFigureRelations({
    eventFigures: [
        {
            figureId: 'primary-person',
            role: { en: 'Project lead', zh: '项目负责人' },
            primary: true,
            avatarAssetId: 'override-avatar'
        },
        {
            figureId: 'related-person',
            role: { en: 'Researcher', zh: '研究者' }
        }
    ],
    variantFigures: [
        {
            figureId: 'related-person',
            role: { en: 'Variant commentator', zh: '变体评论者' }
        },
        {
            figureId: 'primary-person',
            role: { en: 'Variant lead', zh: '变体负责人' },
            useDefaultAvatar: true
        }
    ],
    assets,
    registry: testRegistry
});

assert.deepEqual(
    resolved.map((item) => item.id),
    ['related-person', 'primary-person'],
    'variant relations should preserve their stable-ID order'
);
assert.deepEqual(
    resolved.map((item) => item.role.en),
    ['Variant commentator', 'Variant lead'],
    'variant roles should override canonical event roles by figureId'
);
assert.equal(resolved[1].avatar, primaryAvatar, 'useDefaultAvatar should bypass the event avatar override');

const eventResolved = resolveFigureRelations({
    eventFigures: [
        {
            figureId: 'primary-person',
            role: { en: 'Project lead', zh: '项目负责人' },
            avatarAssetId: 'override-avatar'
        }
    ],
    assets,
    registry: testRegistry
});
assert.equal(eventResolved[0].avatar, overrideAvatar, 'avatarAssetId should resolve the linked event asset');

const styledOverride = resolveFigureRelations({
    eventFigures: [
        {
            figureId: 'primary-person',
            avatarAssetId: 'override-avatar',
            avatarStyle: primaryFigure.defaultAvatar.avatarStyle
        }
    ],
    assets,
    registry: testRegistry
});
assert.equal(
    styledOverride[0].avatarStyle,
    primaryFigure.defaultAvatar.avatarStyle,
    'event-specific avatars must retain their own style even when it matches the default style'
);

const clearedDefaultStyle = resolveFigureRelations({
    eventFigures: [{ figureId: 'primary-person', useDefaultAvatar: true, avatarStyle: '' }],
    assets,
    registry: testRegistry
});
assert.equal(clearedDefaultStyle[0].avatarStyle, '', 'an explicit empty relation style should clear the default style');

assert.throws(
    () =>
        resolveFigureRelations({
            eventFigures: [{ figureId: 'related-person', avatarAssetId: 'override-avatar' }],
            assets,
            registry: testRegistry
        }),
    /linked by figureIds/,
    'avatarAssetId should reject assets owned by another identity'
);
assert.throws(
    () =>
        createFigureRegistry([
            figure('duplicate', { en: 'One', zh: '甲' }),
            figure('duplicate', { en: 'Two', zh: '乙' })
        ]),
    /duplicate figure id/,
    'duplicate stable IDs should be rejected'
);
assert.throws(
    () =>
        createFigureRegistry([
            figure('person-one', { en: 'Person One', zh: '人物甲' }, primaryAvatar),
            figure('person-two', { en: 'Person Two', zh: '人物乙' }, primaryAvatar)
        ]),
    /multiple people/,
    'different people should not share one default avatar'
);

const archiveRegistry = loadFigureRegistry(root);
for (const item of archiveRegistry.figures.filter((candidate) => candidate.type === 'person')) {
    assert.match(item.name.zh, /[\u3400-\u9fff]/, `${item.id} should have a Chinese-readable display name`);
}
const michaelJordan = archiveRegistry.byId.get('michael-i-jordan');
assert.ok(michaelJordan, 'Michael I. Jordan should have a stable registry identity');
assert.match(michaelJordan.disambiguation.en, /computer scientist/i);
assert.match(michaelJordan.disambiguation.zh, /计算机科学家/);

const registryOnlyFigure = figure('registry-only-person', { en: 'Registry Only Person', zh: '仅注册表人物' });
const firstMigration = buildRegistry([], new Map(), [registryOnlyFigure]);
const secondMigration = buildRegistry([], new Map(), firstMigration);
assert.deepEqual(firstMigration, [registryOnlyFigure], 'migration should preserve registry-only identities');
assert.deepEqual(secondMigration, firstMigration, 'registry-only migration should be idempotent');

const migrationEntry = {
    eventId: 'style-pairing-event',
    event: {},
    assets: [
        { id: 'avatar-a', path: 'resources/images/avatar-a.jpg', figureIds: [] },
        { id: 'avatar-b', path: 'resources/images/avatar-b.jpg', figureIds: [] }
    ],
    sources: [],
    variants: []
};
const migrationGroup = {
    figureId: 'style-pairing-person',
    event: migrationEntry,
    index: 0,
    occurrences: [
        {
            kind: 'event',
            position: 0,
            data: {
                name: { en: 'Style Pairing Person', zh: '样式配对人物' },
                avatar: 'resources/images/avatar-a.jpg',
                avatarStyle: 'transform: scale(1.5);'
            }
        },
        {
            kind: 'variant',
            filePath: 'variant-a.json',
            position: 0,
            data: {
                name: { en: 'Style Pairing Person', zh: '样式配对人物' },
                avatar: 'resources/images/avatar-b.jpg',
                avatarStyle: ''
            }
        },
        {
            kind: 'variant',
            filePath: 'variant-b.json',
            position: 0,
            data: {
                name: { en: 'Style Pairing Person', zh: '样式配对人物' },
                avatar: 'resources/images/avatar-b.jpg',
                avatarStyle: ''
            }
        }
    ]
};
const pairedRegistry = buildRegistry([migrationGroup], new Map());
assert.equal(pairedRegistry[0].defaultAvatar.path, 'resources/images/avatar-b.jpg');
assert.equal(
    pairedRegistry[0].defaultAvatar.avatarStyle,
    '',
    'default avatar style must be selected only from occurrences using the selected avatar path'
);

const rewriteEntry = {
    eventId: 'style-rewrite-event',
    event: {},
    assets: [{ id: 'override-avatar', path: overrideAvatar, figureIds: [] }],
    sources: [],
    variants: []
};
const rewriteGroup = {
    figureId: 'primary-person',
    event: rewriteEntry,
    index: 0,
    occurrences: [
        {
            kind: 'event',
            position: 0,
            data: {
                role: { en: 'Project lead', zh: '项目负责人' },
                avatar: overrideAvatar,
                avatarStyle: primaryFigure.defaultAvatar.avatarStyle
            }
        }
    ]
};
rewriteArchive([rewriteGroup], [primaryFigure], new Map());
assert.equal(rewriteEntry.event.figures[0].avatarAssetId, 'override-avatar');
assert.equal(
    rewriteEntry.event.figures[0].avatarStyle,
    primaryFigure.defaultAvatar.avatarStyle,
    'migration must preserve a style attached to a non-default avatar'
);

const forbiddenIdentityFields = ['name', 'avatar', 'figureType', 'organizationIds'];
for (const eventId of fs.readdirSync(path.join(root, 'archive', 'events'))) {
    const eventDir = path.join(root, 'archive', 'events', eventId);
    const relationFiles = [path.join(eventDir, 'event.json')];
    const variantsDir = path.join(eventDir, 'variants');
    if (fs.existsSync(variantsDir)) {
        relationFiles.push(
            ...fs
                .readdirSync(variantsDir)
                .filter((fileName) => fileName.endsWith('.json'))
                .map((fileName) => path.join(variantsDir, fileName))
        );
    }
    for (const filePath of relationFiles) {
        if (!fs.existsSync(filePath)) continue;
        const document = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const relation of document.figures || []) {
            for (const field of forbiddenIdentityFields) {
                assert.equal(
                    Object.hasOwn(relation, field),
                    false,
                    `${path.relative(root, filePath)} should not inline figure identity field ${field}`
                );
            }
        }
    }
}

console.log('PASS global figure registry');
