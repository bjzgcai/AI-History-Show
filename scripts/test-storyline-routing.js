const assert = require('node:assert/strict');
const path = require('node:path');

const routing = require(path.join(__dirname, '..', 'shared', 'storyline-routing.js'));

assert.equal(
    routing.normalizeStorylineId('deep-learning'),
    routing.DEEP_STORYLINE_ID,
    'archive deep-learning id should map to the public deep-learning-history route'
);
assert.equal(
    routing.normalizeStorylineId('deep-learning-history'),
    routing.DEEP_STORYLINE_ID,
    'public deep-learning-history id should remain stable'
);
assert.equal(
    routing.normalizeStorylineId('bench-council-ai100'),
    'bench-council-ai100',
    'unrelated storyline ids should remain unchanged'
);
console.log('PASS storyline id normalization');

assert.equal(
    routing.getMilestoneStorylineId({ storyline: { id: 'deep-learning' } }),
    routing.DEEP_STORYLINE_ID,
    'archive object storyline should resolve to the public deep-learning route'
);
assert.equal(
    routing.getMilestoneStorylineId({ storyline: 'deep-learning' }),
    routing.DEEP_STORYLINE_ID,
    'archive string storyline should resolve to the public deep-learning route'
);
assert.equal(
    routing.getMilestoneStorylineId({}),
    routing.DEEP_STORYLINE_ID,
    'legacy core milestones without explicit storyline should retain the deep-learning fallback'
);
assert.equal(
    routing.getMilestoneStorylineId({ storyline: { id: 'gaming-ai' } }),
    'gaming-ai',
    'other explicit storylines should remain unchanged'
);
console.log('PASS milestone storyline resolution');

const archiveMilestones = [
    { id: 'milestone-1956-dartmouth', storyline: { id: 'deep-learning' } },
    { id: 'milestone-2017-transformer', storyline: { id: 'deep-learning' } },
    { id: 'milestone-ai100-2012-alexnet', storyline: { id: 'bench-council-ai100' } }
];
const deepMilestones = archiveMilestones.filter(
    (milestone) => routing.getMilestoneStorylineId(milestone) === routing.DEEP_STORYLINE_ID
);
assert.deepEqual(
    deepMilestones.map((milestone) => milestone.id),
    ['milestone-1956-dartmouth', 'milestone-2017-transformer'],
    'archive deep-learning events should be available to the public storyline route'
);
assert.equal(
    deepMilestones.findIndex((milestone) => milestone.id === 'milestone-1956-dartmouth'),
    0,
    'detail routing should find an archive event by its milestone id'
);
console.log('PASS archive deep-learning detail lookup');

console.log('All storyline-routing checks passed.');
