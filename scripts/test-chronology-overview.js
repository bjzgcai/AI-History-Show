const assert = require('node:assert/strict');
const path = require('node:path');

const overview = require(path.join(__dirname, '..', 'shared', 'chronology-overview.js'));
const { milestones } = require(path.join(__dirname, '..', 'milestones-data.js'));

const localize = (value) => {
    if (value == null) return '';
    if (typeof value !== 'object' || Array.isArray(value)) return String(value);
    return String(value.zh ?? value.en ?? '');
};

assert.equal(milestones.length, 165, 'the chronology overview should consume all generated Archive milestones');

const canonicalMilestones = overview.buildCanonicalMilestones(milestones, {
    storylinePriority: ['bench-council-ai100', 'deep-learning', 'gaming-ai', 'humanistic-cycle'],
    localize
});
assert.equal(canonicalMilestones.length, 147, 'the all-events view should render one card per routed Archive event');
assert.equal(
    new Set(canonicalMilestones.map((item) => overview.getCanonicalEventId(item))).size,
    canonicalMilestones.length,
    'canonical event IDs should be unique in the all-events view'
);

const canonicalAlexNet = canonicalMilestones.find((item) => item.archiveEventId === '2012-alexnet');
assert.ok(canonicalAlexNet, 'the canonical AlexNet event should exist');
assert.equal(
    canonicalAlexNet.id,
    'milestone-ai100-2012-alexnet',
    'the all-events view should use the configured AI History Map default variant'
);
assert.deepEqual(
    overview.getStorylineMemberships(canonicalAlexNet).map((membership) => membership.id),
    ['bench-council-ai100', 'deep-learning'],
    'canonical cards should retain all storyline memberships'
);
assert.equal(
    overview.selectMilestoneVariant(canonicalAlexNet, 'deep-learning').id,
    'milestone-2012-alexnet',
    'a storyline filter should select that storyline variant'
);
assert.equal(
    overview.selectMilestoneVariant(canonicalAlexNet, 'gaming-ai'),
    null,
    'a storyline filter should omit events outside that storyline'
);
assert.equal(
    overview.selectMilestonesByStoryline(canonicalMilestones, 'deep-learning').length,
    21,
    'storyline selection should create a filtered detail-navigation list without shrinking the canonical source'
);
assert.equal(
    overview.selectMilestonesByStoryline(canonicalMilestones, 'all'),
    canonicalMilestones,
    'the all-events selection should retain the complete canonical source'
);
console.log('PASS chronology canonical events remove duplicate cards and preserve variants');

const spectralClustering = milestones.find((item) => item.id === 'milestone-2000-spectral-clustering');
assert.deepEqual(
    spectralClustering.title,
    {
        zh: '归一化切分与谱聚类',
        en: 'Normalized Cuts and Spectral Clustering'
    },
    'the AI100 spectral-clustering event should retain its normalized-cuts framing'
);
assert.deepEqual(
    spectralClustering.figures.map((figure) => figure.name.en),
    ['Jianbo Shi', 'Jitendra Malik', 'Andrew Ng', 'Yair Weiss'],
    'the AI100 spectral-clustering event should expose four individual core contributors'
);
assert.equal(
    spectralClustering.imageMeta[
        'resources/images/bench-council-ai100/explainers/2000-spectral-clustering_eigen-map.svg'
    ].sourceId,
    'source-on-spectral-clustering-analysis-and-an-algorithm',
    'the spectral embedding explainer should cite the 2001 spectral-clustering paper'
);
assert.equal(
    spectralClustering.imageMeta['resources/images/external/2000-spectral-clustering/andrew-ng-portrait.jpg'].sourceId,
    'source-andrew-ng-wikimedia-portrait',
    'the Andrew Ng portrait should cite its Wikimedia Commons file page'
);
assert.equal(
    spectralClustering.imageMeta[
        'resources/images/external/2000-spectral-clustering/six-node-spectral-clustering-graph.png'
    ].sourceId,
    'source-spectral-graph-illustration',
    'the six-node graph should cite its Wikimedia Commons source'
);

const llmCompetition = milestones.find((item) => item.id === 'milestone-2025-llm-competition');
assert.deepEqual(
    llmCompetition.figures.map((figure) => figure.name.zh),
    ['研究机构', '郑廉民'],
    'the 2025 LLM competition people list should place Lianmin Zheng after research institutions'
);
assert.equal(llmCompetition.figures[0].figureType, 'team', 'research institutions should remain a team figure');

const fallbackImageMilestone = {
    resources: { images: ['detail-first.png', 'detail-second.png'] }
};
const configuredImageMilestone = {
    resources: {
        overviewImage: 'configured-overview.png',
        images: ['detail-first.png', 'detail-second.png']
    }
};
assert.equal(
    overview.getPrimaryImage(configuredImageMilestone),
    'configured-overview.png',
    'overview cards should prefer the explicitly configured overview image'
);
assert.equal(
    overview.getPrimaryImage(fallbackImageMilestone),
    'detail-first.png',
    'overview cards should use the first resource image when no overview image is configured'
);
console.log('PASS chronology cards use configured images with first-image fallback');

for (const [milestoneId, expectedImage] of [
    ['milestone-1956-dartmouth', 'resources/images/1956-dartmouth/historical/1956-dartmouth_historical_02.jpg'],
    [
        'milestone-1986-backpropagation',
        'resources/images/1986-backpropagation/people/1986-backpropagation_paper_02.png'
    ],
    ['milestone-1992-svm', 'resources/images/bench-council-ai100/photos/1971-vc-theory_vladimir-vapnik.png'],
    ['milestone-ai100-2012-alexnet', 'resources/images/2012-alexnet/people/alex-krizhevsky-user-provided.png'],
    ['milestone-2012-alexnet', 'resources/images/2012-alexnet/people/alex-krizhevsky-user-provided.png'],
    ['milestone-2016-alphago', 'resources/images/figures/authoritative/david-silver.jpg'],
    [
        'milestone-2025-llm-competition',
        'resources/images/2025-llm-competition/historical/2025-llm-competition_historical_01.png'
    ]
]) {
    const milestone = milestones.find((item) => item.id === milestoneId);
    assert.equal(milestone.resources.overviewImage, expectedImage, `${milestoneId} should compile its overview image`);
    assert.equal(
        milestone.resources.images[0],
        expectedImage,
        `${milestoneId} detail images should preserve the configured assetIds order`
    );
}
console.log('PASS configured overview images and detail image order compile from Archive variants');

for (const milestoneId of ['milestone-ai100-2012-alexnet', 'milestone-2012-alexnet']) {
    const milestone = milestones.find((item) => item.id === milestoneId);
    assert.equal(
        milestone.figures[0].avatar,
        'resources/images/2012-alexnet/people/alex-krizhevsky-user-provided.png',
        `${milestoneId} should use the user-provided Alex Krizhevsky portrait as its figure avatar`
    );
}
console.log('PASS AlexNet variants use the user-provided portrait consistently');

const summaries = overview.summarizeStorylines(canonicalMilestones, localize);
assert.deepEqual(
    summaries.map(({ id, count }) => ({ id, count })),
    [
        { id: 'bench-council-ai100', count: 119 },
        { id: 'gaming-ai', count: 13 },
        { id: 'humanistic-cycle', count: 12 },
        { id: 'deep-learning', count: 21 }
    ],
    'the overview should derive the four production storylines and their generated counts'
);
assert.deepEqual(
    summaries.map(({ id, color }) => ({ id, color })),
    [
        { id: 'bench-council-ai100', color: '#ff8833' },
        { id: 'gaming-ai', color: '#33b0ff' },
        { id: 'humanistic-cycle', color: '#44dd88' },
        { id: 'deep-learning', color: '#b088ff' }
    ],
    'AI100 and deep learning should exchange their selector positions and colors'
);
console.log('PASS chronology storyline summaries use Archive milestone data');

const allDensityPaths = overview.buildDensityPaths(canonicalMilestones, summaries);
const ai100DensityPaths = overview.buildDensityPaths(canonicalMilestones, summaries, 'bench-council-ai100');
assert.equal(
    (allDensityPaths.match(/<polyline/g) || []).length,
    summaries.length,
    'the all-events density navigator should render every storyline'
);
assert.equal(
    (ai100DensityPaths.match(/<polyline/g) || []).length,
    1,
    'a filtered density navigator should render only the selected storyline'
);
assert.match(ai100DensityPaths, /stroke="#ff8833"/, 'the AI100 density path should retain its orange color');
assert.doesNotMatch(
    ai100DensityPaths,
    /stroke="#(?:33b0ff|44dd88|b088ff)"/,
    'the AI100 density path should omit the other storyline colors'
);
console.log('PASS chronology density paths follow the active storyline filter');

const sorted = [...canonicalMilestones].sort((a, b) => overview.compareMilestones(a, b, localize));
assert.equal(overview.getSortYear(sorted[0]), 1920, 'the first overview event should be the earliest Archive year');
assert.equal(overview.getSortYear(sorted.at(-1)), 2025, 'the last overview event should be the latest Archive year');
assert.ok(
    sorted.every(
        (milestone, index) => index === 0 || overview.getSortYear(sorted[index - 1]) <= overview.getSortYear(milestone)
    ),
    'chronology sorting should be monotonically increasing by display year'
);
console.log('PASS chronology sorting covers the complete 1920-2025 range');

const layout = overview.buildTimelineLayout(canonicalMilestones, {
    viewportWidth: 1920,
    viewportHeight: 900,
    localize
});
assert.equal(layout.cards.length, canonicalMilestones.length, 'every canonical event should receive one overview card');
assert.deepEqual(
    [layout.cardWidth, layout.cardHeight],
    [264, 250],
    'desktop overview cards should reserve room for year, title, and a two-line location'
);
assert.equal(layout.laneCount, 1, 'the overview should always use one card row above and below the timeline');
assert.ok(
    Math.abs(
        layout.cards.filter((card) => card.side === 'top').length -
            layout.cards.filter((card) => card.side === 'bottom').length
    ) <= 1,
    'cards should be distributed evenly between the upper and lower rows'
);
assert.ok(
    new Set(layout.cards.filter((card) => card.side === 'top').map((card) => card.y)).size > 1,
    'the upper card row should use staggered vertical positions'
);
assert.ok(
    new Set(layout.cards.filter((card) => card.side === 'bottom').map((card) => card.y)).size > 1,
    'the lower card row should use staggered vertical positions'
);
assert.equal(
    Math.max(...layout.cards.map((card) => card.staggerOffset)) -
        Math.min(...layout.cards.map((card) => card.staggerOffset)),
    60,
    'desktop card staggering should have a clearly visible vertical range'
);
assert.ok(
    layout.cards.every((card) => card.y >= 0 && card.y + layout.cardHeight <= layout.height),
    'larger desktop staggering should keep every card inside the timeline canvas'
);
assert.ok(layout.width > 1920, 'the complete timeline should be horizontally scrollable');
assert.ok(
    layout.years.some((item) => item.year === 2014 && item.count === 12),
    'deduplicated 2014 events should share one year node'
);
assert.ok(
    layout.years.some((item) => item.year === 2015 && item.count === 13),
    'deduplicated 2015 events should share one year node'
);
assert.equal(
    overview.getDensityTargetYear(layout.years, 0).year,
    1920,
    'the start of the density navigator should select the first timeline year'
);
assert.equal(
    overview.getDensityTargetYear(layout.years, 1).year,
    2025,
    'the end of the density navigator should select the last timeline year'
);
assert.equal(
    overview.getDensityTargetYear(layout.years, 0.5).year,
    1973,
    'density navigation should select the closest available year at the clicked ratio'
);
assert.equal(
    overview.getCenteredScrollLeft(1000, 400, 2000),
    800,
    'density navigation should center its target year in the timeline viewport'
);
assert.equal(
    overview.getCenteredScrollLeft(1950, 400, 2000),
    1600,
    'density navigation should clamp late targets to the maximum scroll position'
);
assert.deepEqual(
    overview.getNearestVisibleYear(layout.years, layout.years[4].x - 200, 400),
    layout.years[4],
    'the density cursor should follow the year nearest the timeline viewport center'
);
console.log('PASS chronology density navigator maps clicks and viewport positions to timeline years');

for (let index = 0; index < layout.cards.length; index += 1) {
    const left = layout.cards[index];
    for (let otherIndex = index + 1; otherIndex < layout.cards.length; otherIndex += 1) {
        const right = layout.cards[otherIndex];
        const overlaps =
            left.x < right.x + layout.cardWidth &&
            left.x + layout.cardWidth > right.x &&
            left.y < right.y + layout.cardHeight &&
            left.y + layout.cardHeight > right.y;
        assert.equal(
            overlaps,
            false,
            `overview cards should not overlap: ${left.milestone.id} / ${right.milestone.id}`
        );
    }
}
console.log('PASS chronology multi-lane layout avoids card collisions');

const compactLayout = overview.buildTimelineLayout(canonicalMilestones, {
    compact: true,
    viewportWidth: 390,
    viewportHeight: 754,
    localize
});
assert.deepEqual(
    [compactLayout.cardWidth, compactLayout.cardHeight],
    [228, 220],
    'compact overview cards should remain large enough for the complete information hierarchy'
);
assert.equal(
    Math.max(...compactLayout.cards.map((card) => card.staggerOffset)) -
        Math.min(...compactLayout.cards.map((card) => card.staggerOffset)),
    30,
    'compact card staggering should remain visible without reaching the canvas edge'
);
assert.ok(
    compactLayout.cards.every((card) => card.y >= 0 && card.y + compactLayout.cardHeight <= compactLayout.height),
    'larger compact staggering should keep every card inside the timeline canvas'
);
console.log('PASS chronology cards expose larger desktop and compact dimensions');

const shortLandscapeViewport = overview.getOverviewViewport(
    { clientWidth: 800, clientHeight: 520 },
    { innerWidth: 800, innerHeight: 520 }
);
assert.equal(shortLandscapeViewport.mode, 'shortLandscape', 'short phone landscape should use its compact layout mode');
assert.equal(
    shortLandscapeViewport.timelineHeight,
    431,
    'short phone landscape should reserve compact filter and density chrome'
);
const shortLandscapeLayout = overview.buildTimelineLayout(canonicalMilestones, {
    mode: shortLandscapeViewport.mode,
    viewportWidth: shortLandscapeViewport.width,
    viewportHeight: shortLandscapeViewport.timelineHeight,
    localize
});
assert.deepEqual(
    [shortLandscapeLayout.cardWidth, shortLandscapeLayout.cardHeight],
    [196, 170],
    'short phone landscape should use smaller cards that retain the complete information hierarchy'
);
assert.ok(
    shortLandscapeLayout.cards.every(
        (card) => card.y >= 0 && card.y + shortLandscapeLayout.cardHeight <= shortLandscapeViewport.timelineHeight
    ),
    'short phone landscape should keep both card rows inside the visible timeline canvas'
);
console.log('PASS chronology short landscape keeps both card rows visible');

const tallLandscapeViewport = overview.getOverviewViewport(
    { clientWidth: 800, clientHeight: 560 },
    { innerWidth: 800, innerHeight: 700 }
);
assert.equal(
    tallLandscapeViewport.mode,
    'mediumLandscape',
    'medium-height landscape should use a layout sized for its available canvas'
);
assert.equal(
    tallLandscapeViewport.timelineHeight,
    455,
    'tall landscape should reserve the same responsive chrome height as its CSS media query'
);
const tallLandscapeLayout = overview.buildTimelineLayout(canonicalMilestones, {
    mode: tallLandscapeViewport.mode,
    viewportWidth: tallLandscapeViewport.width,
    viewportHeight: tallLandscapeViewport.timelineHeight,
    localize
});
assert.deepEqual(
    [tallLandscapeLayout.cardWidth, tallLandscapeLayout.cardHeight],
    [212, 180],
    'medium-height landscape should retain larger cards than the shortest phone layout'
);
assert.ok(
    tallLandscapeLayout.cards.every(
        (card) => card.y >= 0 && card.y + tallLandscapeLayout.cardHeight <= tallLandscapeViewport.timelineHeight
    ),
    'medium-height landscape should keep both card rows inside the visible timeline canvas'
);
console.log('PASS chronology medium landscape stays aligned with CSS media queries');

const explicitPortrait = milestones.find((item) => item.id === 'milestone-ai100-2012-alexnet');
const inferredPortrait = milestones.find((item) => item.id === 'milestone-1950-turing-test');
const namedPersonPhoto = milestones.find((item) => item.id === 'milestone-ai100-1943-mcculloch-pitts-neuron');
const backpropagationMilestone = milestones.find((item) => item.id === 'milestone-1986-backpropagation');
const backpropagationPortrait = 'resources/images/1986-backpropagation/people/1986-backpropagation_paper_02.png';
const backpropagationArchitecture =
    'resources/images/1986-backpropagation/architecture/1986-backpropagation_architecture01.png';
const svmMilestone = milestones.find((item) => item.id === 'milestone-1992-svm');
const vapnikPortrait = 'resources/images/bench-council-ai100/photos/1971-vc-theory_vladimir-vapnik.png';
const vcTheoryMilestone = milestones.find((item) => item.id === 'milestone-1971-vc-theory');
assert.equal(
    overview.isPortraitImage(explicitPortrait, explicitPortrait.resources.images[0]),
    true,
    'explicit portrait metadata should enable face-preserving card media'
);
assert.equal(
    overview.isPortraitImage(inferredPortrait, inferredPortrait.resources.images[0]),
    true,
    'legacy portrait captions should enable face-preserving card media'
);
assert.equal(
    overview.isPortraitImage(namedPersonPhoto, namedPersonPhoto.resources.images[0]),
    true,
    'person names in legacy photo metadata should enable face-preserving card media'
);
assert.equal(
    backpropagationMilestone.resources.images[0],
    backpropagationPortrait,
    'the 1986 backpropagation detail view should lead with David Rumelhart'
);
assert.equal(
    overview.isPortraitImage(backpropagationMilestone, backpropagationPortrait),
    true,
    'the David Rumelhart image should use face-preserving card media'
);
assert.equal(
    overview.isPortraitImage(backpropagationMilestone, backpropagationArchitecture),
    false,
    'architecture images should keep the standard cover treatment'
);
assert.equal(
    svmMilestone.resources.images[0],
    vapnikPortrait,
    'the 1992 SVM detail view should lead with Vladimir Vapnik'
);
assert.equal(
    svmMilestone.imageMeta[vapnikPortrait].sourceId,
    'source-vladimir-vapnik-simons-profile',
    'the reused Vapnik portrait should retain its Simons Foundation provenance'
);
assert.equal(
    vcTheoryMilestone.imageMeta[vapnikPortrait].sourceId,
    'source-vladimir-vapnik-simons-profile',
    'the original VC theory use should retain the same portrait provenance'
);
assert.equal(
    overview.isPortraitImage(svmMilestone, vapnikPortrait),
    true,
    'the Vladimir Vapnik image should use face-preserving card media'
);
assert.equal(
    overview.canPortraitCoverWithoutVerticalCrop(800, 1067, 259, 176),
    false,
    'portrait-oriented images should retain contain fitting to preserve the complete head'
);
assert.equal(
    overview.canPortraitCoverWithoutVerticalCrop(1190, 795, 259, 176),
    true,
    'wide person images should use cover when the full image height remains visible'
);
console.log('PASS chronology portraits use metadata-aware face-preserving media');

console.log('All chronology overview checks passed.');
