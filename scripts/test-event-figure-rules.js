#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { auditVariant, isAssetSelectionExcluded, orderVariantAssetIds } = require('./event-figure-rules');
const { findPortraitCandidate } = require('./ai100-contributors');
const { resolveEffectivePresentation } = require('./archive-presentation');
const { validateAssetSelectionReview } = require('./asset-selection-review');
const { loadFigureRegistry, resolveFigureRelations } = require('./figure-registry');

const root = path.join(__dirname, '..');
const figureRegistry = loadFigureRegistry(root);

function image(id, role, caption, path = `resources/images/${id}.png`) {
    return {
        id,
        type: role === 'architecture-explainer' ? 'svg' : 'image',
        path,
        role,
        caption: { en: caption, zh: caption },
        subcaption: { en: caption, zh: caption }
    };
}

const genericEvent = {
    figures: [
        {
            name: { en: 'Primary Person', zh: '主要人物' },
            role: { en: 'Project leader', zh: '项目负责人' },
            avatar: 'resources/images/primary.png'
        },
        {
            name: { en: 'Related Person', zh: '相关人物' },
            role: { en: 'Related researcher', zh: '相关研究者' },
            avatar: 'resources/images/related.png'
        }
    ]
};

const nonPerson = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: { storylineId: 'test', assetIds: ['diagram'] },
    assets: [image('diagram', 'architecture-explainer', 'System diagram')],
    catalog: new Map()
});
assert.deepEqual(nonPerson.issues, [], 'a non-person first image should be allowed');

const primaryPortrait = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: { storylineId: 'test', assetIds: ['primary'] },
    assets: [image('primary', 'portrait', 'Primary Person portrait', 'resources/images/primary.png')],
    catalog: new Map()
});
assert.deepEqual(primaryPortrait.issues, [], 'a primary-person first image should be allowed');

const orderedAssets = [
    image('primary', 'portrait', 'Primary Person portrait', 'resources/images/primary.png'),
    image('architecture', 'architecture-explainer', 'System architecture'),
    image('related', 'supporting-portrait', 'Related Person portrait', 'resources/images/related.png'),
    image('source', 'paper-page', 'Source page'),
    image('explanation', 'algorithm-explainer', 'Algorithm explanation')
];
const unorderedVariant = {
    storylineId: 'test',
    assetIds: ['source', 'related', 'explanation', 'architecture', 'primary']
};
assert.deepEqual(
    orderVariantAssetIds(genericEvent, unorderedVariant, orderedAssets).assetIds,
    ['primary', 'architecture', 'source', 'related', 'explanation'],
    'a related person should stay with supporting media instead of being promoted as a core figure'
);
assert.deepEqual(
    orderVariantAssetIds(
        genericEvent,
        { storylineId: 'test', assetIds: ['explanation-in-architecture', 'architecture', 'primary'] },
        [
            image('primary', 'portrait', 'Primary Person portrait', 'resources/images/primary.png'),
            image('architecture', 'architecture-explainer', 'System architecture'),
            image(
                'explanation-in-architecture',
                'algorithm-explainer',
                'Algorithm explanation',
                'resources/images/example/architecture/algorithm.png'
            )
        ]
    ).assetIds,
    ['primary', 'architecture', 'explanation-in-architecture'],
    'an explicit explanation role should take precedence over an architecture-like path'
);
const unorderedAudit = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: unorderedVariant,
    assets: orderedAssets,
    catalog: new Map()
});
assert.ok(
    unorderedAudit.issues.some((issue) => issue.includes('assetIds must follow primary person')),
    'variant validation should enforce the global image order'
);

const institutionIcon = image(
    'institution',
    'team-portrait',
    'Research institutions icon',
    'resources/images/figures/research-institution.png'
);
const institutionEvent = {
    figures: [
        {
            name: { en: 'Research Institutions', zh: '研究机构' },
            role: { en: 'Research organizations', zh: '研究机构' },
            avatar: institutionIcon.path,
            figureType: 'team'
        }
    ]
};
assert.deepEqual(
    orderVariantAssetIds(institutionEvent, { storylineId: 'test', assetIds: ['institution', 'architecture'] }, [
        institutionIcon,
        image('architecture', 'architecture-explainer', 'System architecture')
    ]).assetIds,
    ['architecture', 'institution'],
    'a generic institution icon should not be promoted ahead of a structural image as a primary person'
);

const relatedPortrait = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: { storylineId: 'test', assetIds: ['related'] },
    assets: [image('related', 'portrait', 'Related Person portrait', 'resources/images/related.png')],
    catalog: new Map()
});
assert.ok(
    relatedPortrait.issues.some((issue) => issue.includes('primary figure')),
    'a related-person first image should be rejected'
);

const nonPersonOverview = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: {
        storylineId: 'test',
        assetIds: ['primary', 'cover'],
        overviewImageAssetId: 'cover'
    },
    assets: [
        image('primary', 'portrait', 'Primary Person portrait', 'resources/images/primary.png'),
        image('cover', 'hero-image', 'First-edition book cover', 'resources/images/book-cover.jpg')
    ],
    catalog: new Map()
});
assert.deepEqual(nonPersonOverview.issues, [], 'a non-person overview override should be allowed');

const relatedPersonOverview = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: {
        storylineId: 'test',
        assetIds: ['primary', 'related'],
        overviewImageAssetId: 'related'
    },
    assets: [
        image('primary', 'portrait', 'Primary Person portrait', 'resources/images/primary.png'),
        image('related', 'portrait', 'Related Person portrait', 'resources/images/related.png')
    ],
    catalog: new Map()
});
assert.ok(
    relatedPersonOverview.issues.some((issue) => issue.includes('overviewImageAssetId must use the primary person')),
    'a person overview override should still use the primary person'
);

const ai100Catalog = new Map([['ai100-1994-sarsa', ['Gavin Rummery', 'Mahesan Niranjan']]]);
const ai100WrongOrder = auditVariant({
    eventId: 'ai100-1994-sarsa',
    event: { figures: [] },
    variant: {
        storylineId: 'bench-council-ai100',
        assetIds: ['diagram'],
        figures: [
            { name: { en: 'Mahesan Niranjan', zh: '马赫桑·尼兰詹' } },
            { name: { en: 'Gavin Rummery', zh: '加文·拉默里' } }
        ]
    },
    assets: [image('diagram', 'architecture-explainer', 'SARSA process')],
    catalog: ai100Catalog
});
assert.ok(
    ai100WrongOrder.issues.some((issue) => issue.includes('figure 1 must preserve')),
    'AI100 figures should preserve the BenchCouncil contributor prefix order'
);

const excludedPortrait = image('excluded', 'portrait', 'Archived portrait');
excludedPortrait.selectionReview = {
    status: 'excluded-from-variants',
    reasonCode: 'historical-reference',
    reason: { en: 'Archived only.', zh: '仅作档案保留。' },
    reviewedAt: '2026-08-02'
};
assert.equal(isAssetSelectionExcluded(excludedPortrait), true, 'selection review should identify excluded assets');
assert.deepEqual(validateAssetSelectionReview(excludedPortrait.selectionReview), []);
assert.ok(
    validateAssetSelectionReview({
        status: 'excluded',
        reasonCode: 'unknown',
        reason: { en: '', zh: '' },
        reviewedAt: '2026-02-30'
    }).length >= 4,
    'selection review schema should reject invalid status, reason, localization, and dates'
);

const excludedPortraitCandidate = image(
    'excluded-sync-candidate',
    'portrait',
    'Primary Person portrait',
    'resources/images/figures/authoritative/michael-buro.jpg'
);
excludedPortraitCandidate.selectionReview = excludedPortrait.selectionReview;
const excludedPortraitRegistry = {
    root,
    figures: [],
    assets: [
        {
            eventId: 'test-event',
            asset: excludedPortraitCandidate,
            source: null,
            personNames: ['Primary Person']
        }
    ]
};
assert.equal(
    findPortraitCandidate('Primary Person', excludedPortraitRegistry, 'test-event'),
    undefined,
    'variant portrait selection should ignore explicitly excluded assets by default'
);
assert.equal(
    findPortraitCandidate('Primary Person', excludedPortraitRegistry, 'test-event', {
        allowExcludedFromVariants: true
    }).asset.id,
    excludedPortraitCandidate.id,
    'figure avatars may explicitly retain an excluded portrait while awaiting a replacement'
);

const excludedSelection = auditVariant({
    eventId: 'test-event',
    event: genericEvent,
    variant: { storylineId: 'test', assetIds: ['excluded'] },
    assets: [excludedPortrait],
    catalog: new Map()
});
assert.ok(
    excludedSelection.issues.some((issue) => issue.includes('explicitly excluded from variants')),
    'an intentionally excluded asset should fail if it is selected by a variant'
);

const archiveExclusions = {
    '1986-backpropagation': [['asset-1986-backpropagation-paper-03', 'historical-reference']],
    '1997-deep-blue': [['asset-1997-deep-blue-garry-kasparov', 'historical-reference']],
    'ai100-2005-gnn': [['asset-ai100-2005-gnn-citations', 'display-quality']],
    'ai100-1967-knn': [['asset-ai100-1967-knn-2012-04-12-obit-cover', 'historical-reference']],
    '2018-bert': [['asset-2018-bert-people-03', 'historical-reference']],
    '2018-gpt': [['asset-2018-gpt-people-02', 'historical-reference']],
    '2019-suphx': [
        ['asset-2019-suphx-guoqing-liu', 'curated-figure-scope'],
        ['asset-2019-suphx-li-zhao', 'curated-figure-scope']
    ],
    '2014-highway-network': [['asset-2014-highway-network-klaus-greff', 'display-quality']]
};
for (const [eventId, exclusions] of Object.entries(archiveExclusions)) {
    const eventDir = path.join(root, 'archive', 'events', eventId);
    const event = JSON.parse(fs.readFileSync(path.join(eventDir, 'event.json'), 'utf8'));
    const assets = JSON.parse(fs.readFileSync(path.join(eventDir, 'assets.json'), 'utf8'));
    const selectedAssetIds = new Set();
    for (const storylineFile of fs.readdirSync(path.join(root, 'archive', 'storylines'))) {
        if (!storylineFile.endsWith('.json')) continue;
        const storyline = JSON.parse(fs.readFileSync(path.join(root, 'archive', 'storylines', storylineFile), 'utf8'));
        for (const ref of storyline.events || []) {
            if (ref.enabled === false || ref.eventId !== eventId) continue;
            const presentation = resolveEffectivePresentation({
                root,
                eventDir,
                event,
                eventId,
                storylineId: storyline.id,
                ref
            }).presentation;
            for (const assetId of presentation.assetIds || []) selectedAssetIds.add(assetId);
        }
    }
    for (const [assetId, reasonCode] of exclusions) {
        const asset = assets.find((candidate) => candidate.id === assetId);
        assert.ok(asset, `${eventId} should retain the reviewed asset ${assetId}`);
        assert.equal(asset.selectionReview.status, 'excluded-from-variants');
        assert.equal(asset.selectionReview.reasonCode, reasonCode);
        assert.equal(selectedAssetIds.has(assetId), false, `${assetId} should remain outside all variant assetIds`);
    }
}

const confirmedAvatarReuse = {
    '1984-cart': [
        'Jerome Friedman',
        'resources/images/external/ai100-2001-gradient-boosting/jerome-friedman-portrait.png'
    ],
    '2014-attention': [
        'Christopher Manning',
        'resources/images/external/ai100-2014-glove/christopher-manning-commons.jpg'
    ],
    'ai100-2014-seq2seq': ['Kyunghyun Cho', 'resources/images/2014-attention/people/kyunghyun-cho-nyu-courant.jpg'],
    '2016-alphago': [
        'Julian Schrittwieser',
        'resources/images/external/2017-alphazero/julian-schrittwieser-portrait.jpg'
    ]
};
for (const [eventId, [personName, expectedAvatar]] of Object.entries(confirmedAvatarReuse)) {
    const eventDir = path.join(root, 'archive', 'events', eventId);
    const event = JSON.parse(fs.readFileSync(path.join(eventDir, 'event.json'), 'utf8'));
    const assets = JSON.parse(fs.readFileSync(path.join(eventDir, 'assets.json'), 'utf8'));
    const canonicalFigure = resolveFigureRelations({
        eventFigures: event.figures,
        assets,
        registry: figureRegistry
    }).find((figure) => figure.name.en === personName);
    assert.ok(canonicalFigure, `${eventId} should resolve ${personName} from the global figure registry`);
    assert.equal(
        canonicalFigure.avatar,
        expectedAvatar,
        `${eventId} should reuse the confirmed avatar for ${personName}`
    );

    const presentationEntries = [
        ['defaultPresentation', event.defaultPresentation || {}],
        ...(fs.existsSync(path.join(eventDir, 'variants'))
            ? fs
                  .readdirSync(path.join(eventDir, 'variants'))
                  .filter((name) => name.endsWith('.json'))
                  .map((file) => [file, JSON.parse(fs.readFileSync(path.join(eventDir, 'variants', file), 'utf8'))])
            : [])
    ];
    for (const [label, variant] of presentationEntries) {
        const variantFigure = resolveFigureRelations({
            eventFigures: event.figures,
            variantFigures: variant.figures,
            assets,
            registry: figureRegistry
        }).find((figure) => figure.name.en === personName);
        if (variantFigure) {
            assert.equal(
                variantFigure.avatar,
                expectedAvatar,
                `${eventId}/${label} should reuse the confirmed avatar for ${personName}`
            );
        }
    }
}

console.log('PASS event figure and first-image rules');
