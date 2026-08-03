#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const selection = require(path.join(__dirname, '..', 'shared', 'event-media-selection.js'));
const { milestones } = require(path.join(__dirname, '..', 'milestones-data.js'));

const sampleImages = ['portrait.jpg', 'architecture.svg', 'other-person.jpg', 'algorithm-flow.svg'];
const sampleRoles = new Map([
    ['portrait.jpg', 'portrait'],
    ['architecture.svg', 'architecture-explainer'],
    ['other-person.jpg', 'supporting-portrait'],
    ['algorithm-flow.svg', 'algorithm-explainer']
]);
const selectedSample = selection.findCommentaryMedia(sampleImages, (url) => sampleRoles.get(url));
assert.equal(selectedSample, 'architecture.svg', 'commentary media should select the first architecture image');
assert.deepEqual(
    selection.excludeSelectedMedia(sampleImages, selectedSample),
    ['portrait.jpg', 'other-person.jpg', 'algorithm-flow.svg'],
    'the commentary image should be removed from the detail image list'
);
assert.equal(selection.isCommentaryMediaCandidate('portrait.jpg', 'portrait'), false);
assert.equal(selection.isCommentaryMediaCandidate('game.svg', 'game-record-image'), false);
assert.equal(
    selection.isCommentaryMediaCandidate('resources/images/architecture/game-record.svg', 'game-record-image'),
    false,
    'game records should not become commentary media even when their path looks structural'
);
assert.equal(selection.isCommentaryMediaCandidate('flow.svg', 'algorithm-explainer'), true);
assert.equal(
    selection.findCommentaryMedia(['portrait.jpg'], () => 'portrait'),
    ''
);
console.log('PASS commentary media selects architecture or explanation images without portraits or duplicates');

const expectedEvents = {
    'milestone-gaming-ai-1951-strachey-draughts': {
        first: 'resources/images/external/1951-strachey-draughts/christopher-strachey-portrait.jpg',
        media: 'resources/images/bench-council-ai100/explainers/1951-strachey-draughts_board-search.svg'
    },
    'milestone-gaming-ai-1988-td-update': {
        first: 'resources/images/bench-council-ai100/photos/1988-td-update_richard-sutton.jpg',
        media: 'resources/images/bench-council-ai100/explainers/1988-td-update_value-timeline.svg'
    },
    'milestone-gaming-ai-1994-chinook': {
        first: 'resources/images/external/1994-chinook/jonathan-schaeffer-portrait.jpg',
        media: 'resources/images/bench-council-ai100/explainers/1994-chinook_endgame-database.svg'
    },
    'milestone-gaming-ai-1997-deep-blue': {
        first: 'resources/images/bench-council-ai100/photos/1997-deep-blue_feng-hsiung-hsu.jpg',
        media: 'resources/images/bench-council-ai100/explainers/1997-deep-blue_search-tree.svg'
    },
    'milestone-gaming-ai-2013-dqn': {
        first: 'resources/images/bench-council-ai100/photos/2013-dqn_volodymyr-mnih.jpg',
        media: 'resources/images/bench-council-ai100/explainers/2013-dqn_replay-buffer.svg'
    },
    'milestone-2014-attention': {
        first: 'resources/images/2014-attention/people/dzmitry-bahdanau-mila.jpg',
        media: 'resources/images/bench-council-ai100/explainers/2014-attention_alignment.svg'
    },
    'milestone-1957-kmeans': {
        first: 'resources/images/external/1957-kmeans/bell-labs-holmdel-complex.jpg',
        media: 'resources/images/bench-council-ai100/explainers/1957-kmeans_centroid-loop.svg'
    },
    'milestone-1980-xcon-r1': {
        first: 'resources/images/external/1980-xcon-r1/dec-vax-11-780-computer.jpg',
        media: 'resources/images/bench-council-ai100/explainers/1980-xcon-r1_rule-configurator.svg'
    },
    'milestone-ai100-2014-conditional-gan': {
        first: 'resources/images/external/ai100-2014-conditional-gan/conditional-gan-paper-first-page.jpg',
        media: 'resources/images/bench-council-ai100/explainers/2014-conditional-gan_conditioned-generator.svg'
    },
    'milestone-2017-transformer': {
        first: 'resources/images/figures/ashish-vaswani.jpg',
        media: 'resources/images/2017-transformer/architecture/2017-transformer_architecture_02.png'
    },
    'milestone-1990-otter': {
        first: 'resources/images/external/1990-otter/otter-3-3-reference-manual-first-page.svg',
        media: 'resources/images/bench-council-ai100/explainers/1990-otter_input-clauses.svg'
    },
    'milestone-2022-post-training-intelligence': {
        first: 'resources/images/2022-post-training-intelligence/architecture/post-training-pipeline.svg',
        archiveFirst: 'resources/images/2022-post-training-intelligence/architecture/instruction-tuning-pipeline.png',
        media: 'resources/images/2022-post-training-intelligence/architecture/instruction-tuning-pipeline.png'
    },
    'milestone-ai100-1994-sarsa': {
        first: 'resources/images/bench-council-ai100/supporting/1994-sarsa-paper-record.svg',
        media: 'resources/images/bench-council-ai100/explainers/1994-1994-sarsa_process.svg'
    }
};

for (const [milestoneId, expected] of Object.entries(expectedEvents)) {
    const milestone = milestones.find((item) => item.id === milestoneId);
    assert.ok(milestone, `${milestoneId} should exist`);
    const images = milestone.resources.images;
    const commentaryImage = selection.findCommentaryMedia(images, (url) => {
        const meta = milestone.imageMeta && milestone.imageMeta[url];
        return meta && meta.role;
    });
    const detailImages = selection.excludeSelectedMedia(images, commentaryImage);
    assert.equal(
        images[0],
        expected.archiveFirst || expected.first,
        `${milestoneId} should preserve its intended Archive image order`
    );
    assert.equal(commentaryImage, expected.media, `${milestoneId} should use its first structural image as media`);
    assert.equal(detailImages.includes(commentaryImage), false, `${milestoneId} should not duplicate commentary media`);
    assert.equal(detailImages[0], expected.first, `${milestoneId} should preserve its intended first detail image`);
    assert.equal(
        milestone.resources.overviewImage || images[0],
        expected.first,
        `${milestoneId} overview should match the first displayed detail image`
    );
}
console.log('PASS affected event variants preserve their intended first image and use distinct structural media');

for (const milestone of milestones) {
    if (milestone.resources && milestone.resources.overviewImageAssetId) continue;
    const images = milestone.resources && Array.isArray(milestone.resources.images) ? milestone.resources.images : [];
    const commentaryImage = selection.findCommentaryMedia(images, (url) => {
        const meta = milestone.imageMeta && milestone.imageMeta[url];
        return meta && meta.role;
    });
    const detailImages = selection.excludeSelectedMedia(images, commentaryImage);
    if (!images[0] || !detailImages[0]) continue;
    assert.equal(
        detailImages[0],
        images[0],
        `${milestone.id} without an overview override should keep its home image first in detail`
    );
}
console.log('PASS default overview images match the first displayed detail image');

for (const milestone of milestones) {
    const images = milestone.resources && Array.isArray(milestone.resources.images) ? milestone.resources.images : [];
    const commentaryImage = selection.findCommentaryMedia(images, (url) => {
        const meta = milestone.imageMeta && milestone.imageMeta[url];
        return meta && meta.role;
    });
    if (!commentaryImage) continue;
    const role =
        milestone.imageMeta && milestone.imageMeta[commentaryImage] && milestone.imageMeta[commentaryImage].role;
    assert.equal(
        selection.isCommentaryMediaCandidate(commentaryImage, role),
        true,
        `${milestone.id} commentary media should be an architecture or explanation image`
    );
    assert.equal(
        selection.excludeSelectedMedia(images, commentaryImage).includes(commentaryImage),
        false,
        `${milestone.id} commentary media should be absent from detail images`
    );
}
console.log('PASS generated milestones expose only distinct structural commentary media');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(indexHtml, /<script src="shared\/event-media-selection\.js"><\/script>/);
assert.match(indexHtml, /EventMediaSelection\.findCommentaryMedia\(images/);
assert.match(indexHtml, /EventMediaSelection\.excludeSelectedMedia\(candidates, sideImageUrl\)/);
assert.match(
    indexHtml,
    /function getUiImageCandidates\(vm\)[\s\S]*?const photos = getPhotosForDisplay\(vm\.photos\)[\s\S]*?return \[\.\.\.photos, configuredDemoImage\]/,
    'detail image candidates should preserve the complete Archive image list'
);
assert.doesNotMatch(indexHtml, /GamingMediaSelection|findGameplayMedia|UI_MEDIA_VISUAL_OVERRIDES/);
assert.doesNotMatch(indexHtml, /shouldHideUiCommentaryMediaVisual|commentaryMedia\.hideVisual/);
assert.match(
    indexHtml,
    /function buildUiMediaHtml\(vm\)[\s\S]*?const imageUrl = getUiMediaVisualImage\(vm\)[\s\S]*?if \(!imageUrl\) return ''/,
    'the commentary media section should remain empty when no structural image is available'
);
console.log('PASS unified detail UI follows the global commentary media contract');
