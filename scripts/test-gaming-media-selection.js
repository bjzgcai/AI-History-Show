const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const selection = require(path.join(__dirname, '..', 'shared', 'gaming-media-selection.js'));

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

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(indexHtml, /<script src="shared\/gaming-media-selection\.js"><\/script>/);
assert.match(indexHtml, /GamingMediaSelection\.findGameplayMedia\(images/);
assert.match(indexHtml, /GamingMediaSelection\.excludeSelectedMedia\(candidates, sideImageUrl\)/);
console.log('PASS gaming media selection is integrated into the unified UI');
