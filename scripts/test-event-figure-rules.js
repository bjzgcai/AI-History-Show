#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const { auditVariant } = require('./event-figure-rules');

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

console.log('PASS event figure and first-image rules');
