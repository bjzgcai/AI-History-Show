const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const selection = require(path.join(__dirname, '..', 'shared', 'gaming-media-selection.js'));
const { milestones } = require(path.join(__dirname, '..', 'milestones-data.js'));

const gameplayRoles = ['game-record-animation', 'game-analysis-image', 'game-comparison-image'];

for (const role of gameplayRoles) {
    const images = ['portrait.jpg', `${role}.asset`, 'fallback-diagram.svg'];
    const roles = new Map([
        ['portrait.jpg', 'portrait'],
        [`${role}.asset`, role],
        ['fallback-diagram.svg', 'algorithm-explainer']
    ]);
    const selected = selection.findGameplayMedia(images, (url) => roles.get(url));
    const detailImages = selection.excludeSelectedMedia(images, selected);

    assert.equal(selected, `${role}.asset`, `${role} should be selected for commentary media`);
    assert.equal(detailImages.includes(selected), false, `${role} should be removed from the detail image rail`);
    assert.deepEqual(
        detailImages,
        ['portrait.jpg', 'fallback-diagram.svg'],
        `${role} selection should preserve the remaining image order`
    );
}

assert.equal(selection.isGameplayRole('game-record-image'), true);
assert.equal(selection.isGameplayRole('gameplay-image'), true);
assert.equal(selection.isGameplayRole('portrait'), false);
console.log('PASS gaming media role selection and detail image exclusion');

const alphaGo = milestones.find((item) => item.id === 'milestone-gaming-ai-2016-alphago');
const alphaGoAi100 = milestones.find((item) => item.id === 'milestone-2016-alphago');
const leeSedolPortrait = 'resources/images/bench-council-ai100/photos/2016-alphago_lee-sedol.jpg';
assert.equal(
    alphaGo.resources.images[0],
    'resources/images/figures/authoritative/david-silver.jpg',
    'the AlphaGo detail image rail should lead with David Silver'
);
assert.equal(
    alphaGo.resources.images.at(-1),
    leeSedolPortrait,
    'the gaming AI AlphaGo image list should place Lee Sedol last'
);
assert.equal(
    alphaGoAi100.resources.images.at(-1),
    leeSedolPortrait,
    'the AI100 AlphaGo image list should place Lee Sedol last'
);
console.log('PASS AlphaGo detail media leads with David Silver');

const alphaZero = milestones.find((item) => item.id === 'milestone-gaming-ai-2017-alphazero');
assert.equal(
    alphaZero.resources.images[0],
    'resources/images/figures/authoritative/david-silver.jpg',
    'the AlphaZero detail image rail should lead with David Silver'
);
console.log('PASS AlphaZero detail media leads with David Silver');

const suphx = milestones.find((item) => item.id === 'milestone-gaming-ai-2019-suphx');
assert.equal(
    suphx.resources.images[0],
    'resources/images/external/2019-suphx/tie-yan-liu-portrait.jpg',
    'the Suphx detail image rail should lead with Tie-Yan Liu'
);
console.log('PASS Suphx detail media leads with Tie-Yan Liu');

const muZero = milestones.find((item) => item.id === 'milestone-gaming-ai-2019-muzero');
assert.equal(
    muZero.resources.images[0],
    'resources/images/figures/authoritative/david-silver.jpg',
    'the MuZero detail image rail should lead with David Silver'
);
console.log('PASS MuZero detail media leads with David Silver');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(indexHtml, /<script src="shared\/gaming-media-selection\.js"><\/script>/);
assert.match(indexHtml, /GamingMediaSelection\.findGameplayMedia\(images/);
assert.match(indexHtml, /GamingMediaSelection\.excludeSelectedMedia\(candidates, sideImageUrl\)/);
assert.match(indexHtml, /getPhotosForDisplay\(vm\.photos\)/);
assert.doesNotMatch(indexHtml, /UI_PHOTO_ORDER_OVERRIDES|scorePhoto|getPhotoOrderOverride/);
assert.doesNotMatch(indexHtml, /UI_CHRONOLOGY_IMAGE_OVERRIDES/);
console.log('PASS gaming media selection preserves Archive order without event-specific UI overrides');
