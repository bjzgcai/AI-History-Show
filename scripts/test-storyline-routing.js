const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const routing = require(path.join(__dirname, '..', 'shared', 'storyline-routing.js'));
const { milestones: generatedMilestones } = require(path.join(__dirname, '..', 'milestones-data.js'));

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
assert.equal(
    routing.getMilestoneStorylineId({ storyline: { id: 'humanistic-cycle' } }),
    'humanistic-cycle',
    'the humanistic cycle storyline should remain independently routable'
);
console.log('PASS milestone storyline resolution');

const humanisticMilestones = generatedMilestones.filter(
    (milestone) => routing.getMilestoneStorylineId(milestone) === 'humanistic-cycle'
);
assert.equal(humanisticMilestones.length, 12, 'the humanistic cycle should contain twelve events');
humanisticMilestones.forEach((milestone) => {
    const images = milestone.resources && Array.isArray(milestone.resources.images) ? milestone.resources.images : [];
    assert.ok(
        images.some((url) => /\/humanistic-cycle\/explainers\//.test(String(url || ''))),
        `${milestone.archiveEventId || milestone.id} should provide an explainer for commentary media`
    );
});
console.log('PASS humanistic commentary media coverage');

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

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const pqMiniProgramQrPath = path.join(__dirname, '..', 'resources', 'pq.png');
assert.match(
    indexHtml,
    /class="single-stage is-ui-browser" id="singleStage"/,
    'the default document should paint the unified UI shell before JavaScript initialization'
);
assert.match(
    indexHtml,
    /function isHumanisticMilestone\(milestone\)[\s\S]*?archiveVariantId === 'humanistic-cycle'[\s\S]*?milestone-humanistic-cycle-[\s\S]*?function buildUiSentimentTagHtml\(raw\)[\s\S]*?isHumanisticMilestone\(raw\)[\s\S]*?raw\.sentiment[\s\S]*?getAchievementField\(raw, 'area'/,
    'humanistic UI browser cards should restore localized emotion labels with sentiment styling'
);
assert.match(
    indexHtml,
    /function buildUnifiedMilestones\(\)[\s\S]*?storylineId === DEEP_STORYLINE_ID[\s\S]*?storylineId === 'bench-council-ai100'[\s\S]*?storylineId === 'humanistic-cycle'/,
    'the unified AI history map should include all humanistic cycle events'
);
assert.match(
    indexHtml,
    /class="ui-detail-title-row">[\s\S]*?class="ui-detail-title"[\s\S]*?\$\{sentimentTagHtml\}/,
    'humanistic detail pages should place the emotion label directly after the event title'
);
assert.match(
    indexHtml,
    /UI_CONTINENTS\.filter\(\(continent\) => \(continentCounts\.get\(continent\.id\) \|\| 0\) > 0\)\.map/,
    'the event map should omit continent controls whose event count is zero'
);
assert.match(
    indexHtml,
    /\.ui-detail-topline\s*\{[\s\S]*?--ui-detail-context-base-width:\s*564px[\s\S]*?--ui-detail-context-max-width:\s*829px[\s\S]*?--ui-detail-title-min-width:\s*300px[\s\S]*?grid-template-columns:[\s\S]*?fit-content\(var\(--ui-detail-context-max-width\)\)[\s\S]*?minmax\(var\(--ui-detail-title-min-width\), 1fr\)[\s\S]*?\.ui-detail-context\s*\{[\s\S]*?width:\s*var\(--ui-detail-context-width, max-content\)[\s\S]*?min-width:\s*var\(--ui-detail-context-base-width\)[\s\S]*?max-width:\s*var\(--ui-detail-context-max-width\)/,
    'desktop detail titles should start at the body column and move right only when the context requires it'
);
assert.match(
    indexHtml,
    /\.ui-detail-heading\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?min-width:\s*0[\s\S]*?width:\s*100%[\s\S]*?max-width:\s*100%/,
    'desktop detail titles should occupy the same second content column as the body copy without expanding that column'
);
assert.match(
    indexHtml,
    /\.ui-detail-place\s*\{[\s\S]*?width:\s*auto[\s\S]*?max-height:\s*2\.6em[\s\S]*?overflow:\s*hidden[\s\S]*?text-overflow:\s*ellipsis[\s\S]*?-webkit-line-clamp:\s*2/,
    'detail locations should use the available width and truncate only after two lines'
);
assert.match(
    indexHtml,
    /function fitUiDetailLocation\(\)[\s\S]*?readLayoutWidth\('--ui-detail-context-base-width'\)[\s\S]*?readLayoutWidth\('--ui-detail-context-max-width'\)[\s\S]*?readLayoutWidth\('--ui-detail-title-min-width'\)[\s\S]*?fitsInTwoLines[\s\S]*?while \(high - low > 1\)/,
    'desktop detail locations should use their base width first and grow only enough to fit within two lines'
);
assert.match(
    indexHtml,
    /function refreshUiBrowserMeasurements\(\)[\s\S]*?fitUiEventImages\(\)[\s\S]*?fitUiDetailLocation\(\)[\s\S]*?window\.addEventListener\('resize'[\s\S]*?refreshUiBrowserMeasurements\(\)[\s\S]*?window\.addEventListener\('orientationchange'[\s\S]*?refreshUiBrowserMeasurements\(\)/,
    'responsive UI measurements should share one refresh path'
);
assert.match(
    indexHtml,
    /function scheduleUiDetailLocationFit\(\)[\s\S]*?requestAnimationFrame\(fitUiDetailLocation\)[\s\S]*?document\.fonts\.ready\.then\(fitUiDetailLocation\)[\s\S]*?function renderUiDetail\(\)[\s\S]*?scheduleUiDetailLocationFit\(\)/,
    'detail location wrapping should be recalculated after rendering and after fonts load'
);
assert.match(
    indexHtml,
    /function buildLocationText\(location\)[\s\S]*?return `\$\{name\}\$\{uiText\(', ', '，'\)\}\$\{country\}`;/,
    'location names and countries should flow naturally instead of being split by a forced line break'
);
assert.match(
    indexHtml,
    /function formatUiCountryName\(value\)[\s\S]*?replace\(\/\\bUnited States\\b\/g, 'US'\)/,
    'unified UI addresses should abbreviate United States as US in English'
);
assert.match(
    indexHtml,
    /vm\.location = formatUiLocation\(vm\.location\)/,
    'country abbreviation should be applied to the normalized UI view model only'
);
assert.match(
    indexHtml,
    /const rawCountry = String\(country && typeof country === 'object' \? country\.en : country \|\| ''\)\.trim\(\)/,
    'region filtering should continue to read the canonical English country value'
);
assert.doesNotMatch(
    indexHtml,
    /function buildLocationHtml\(/,
    'plain location text should not pass through a redundant HTML rendering helper'
);
assert.match(
    indexHtml,
    /class="ui-detail-place" title="\$\{escapeHtml\(locationText\)\}"/,
    'detail locations should expose their full value on hover'
);
assert.match(
    indexHtml,
    /function getConfiguredImageMetaMap\(vm\)[\s\S]*?raw\.resources && raw\.resources\.imageMeta[\s\S]*?\.\.\.\(raw\.imageMeta \|\| \{\}\)/,
    'Archive image metadata should override legacy resource metadata in the unified UI'
);
assert.doesNotMatch(
    indexHtml,
    /entry\.subcaption \|\| entry\.subtitle \|\| entry\.description \|\| entry\.role/,
    'internal image roles should never be used as visible image descriptions'
);
assert.match(
    indexHtml,
    /\.ui-avatar-name,[\s\S]*?\.ui-avatar-role\s*\{[\s\S]*?width:\s*max-content[\s\S]*?overflow:\s*visible[\s\S]*?text-overflow:\s*clip/,
    'desktop detail figure names and roles should use their content width without ellipsis'
);
assert.match(
    indexHtml,
    /const UI_DETAIL_FIGURE_LIMIT = 4;/,
    'unified UI detail pages should define one four-figure limit'
);
assert.match(
    indexHtml,
    /function getUiDetailFigures\(vm\)[\s\S]*?slice\(0, UI_DETAIL_FIGURE_LIMIT\)/,
    'unified UI detail pages should apply the shared figure limit in one helper'
);
assert.match(
    indexHtml,
    /class="ui-avatar-strip count-\$\{detailFigureCount\}"/,
    'unified UI detail pages should expose their figure count to the layout'
);
assert.match(
    indexHtml,
    /buildUiAvatarHtml\(vm, detailFigures\)/,
    'figure rendering and figure-count layout should use the same selected figures'
);
assert.match(
    indexHtml,
    /@media \(min-width: 1200px\)[\s\S]*?\.ui-avatar-strip\.count-4\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)[\s\S]*?\.ui-avatar-strip\.count-4 \.ui-avatar-face\s*\{[\s\S]*?width:\s*72px/,
    'desktop four-figure layouts should use a compact four-column grid'
);
assert.match(
    indexHtml,
    /function updateStorylineUrl[\s\S]*?searchParams\.delete\('uiMode'\)[\s\S]*?searchParams\.delete\('event'\)/,
    'storyline changes should clear stale detail URL parameters'
);
assert.match(
    indexHtml,
    /requestedUiMode === 'detail'[\s\S]*?isUiBrowserActive\(\)[\s\S]*?normalizedUrl\.searchParams\.delete\('uiMode'\)/,
    'initial detail URLs should only restore inside the UI browser and otherwise normalize themselves'
);
assert.doesNotMatch(
    indexHtml,
    /function isTopAchievementStorylineActive|activeStorylineId === 'bench-council-ai100'[\s\S]{0,300}maybeOpenCompletionQuiz/,
    'completion quizzes should not be restricted to the AI100 storyline'
);
assert.match(
    indexHtml,
    /function maybeOpenCompletionQuiz\(onComplete\)[\s\S]*?isUiBrowserActive\(\) && uiBrowserMode !== 'detail'[\s\S]*?const quizzes = getQuizItems\(vm\)[\s\S]*?!quizzes\.length/,
    'completion quizzes should depend on event quiz data and stay disabled on the unified map level'
);
assert.match(
    indexHtml,
    /function getQuizItems\(vm\)[\s\S]*?raw\.archiveEventId[\s\S]*?allMilestones\.find[\s\S]*?milestone\.archiveEventId !== raw\.archiveEventId/,
    'quiz lookup should fall back to another storyline variant of the same archive event'
);
assert.match(
    indexHtml,
    /function returnFromUiDetail\(options = \{\}\)[\s\S]*?!options\.skipCompletionQuiz && maybeOpenCompletionQuiz[\s\S]*?returnFromUiDetail\(\{ \.\.\.options, skipCompletionQuiz: true \}\)/,
    'leaving a unified event detail should pass through the completion quiz check'
);
assert.match(
    indexHtml,
    /const COMPLETION_QUIZ_MIN_DWELL_MS = 15 \* 1000[\s\S]*?function hasCompletionQuizDwellElapsed\(vm\)[\s\S]*?getCompletionQuizClock\(\) - completionQuizViewStartedAt >= COMPLETION_QUIZ_MIN_DWELL_MS/,
    'completion quizzes should require at least 15 seconds in the current event detail session'
);
assert.match(
    indexHtml,
    /if \(isUiBrowserActive\(\) && uiBrowserMode !== 'detail'\) \{[\s\S]*?resetCompletionQuizView\(\)[\s\S]*?\} else \{[\s\S]*?markCompletionQuizView\(vm\)/,
    'the unified map level should reset quiz dwell time while event details start it'
);
console.log('PASS unified UI boot state and storyline detail URL normalization');

assert.equal(fs.existsSync(pqMiniProgramQrPath), true, 'the PQ mini program code should be restored');
const pqMiniProgramQr = fs.readFileSync(pqMiniProgramQrPath);
assert.equal(
    pqMiniProgramQr.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'the PQ mini program code should be a PNG'
);
assert.ok(pqMiniProgramQr.length > 100_000, 'the PQ mini program code should contain the full scannable asset');
assert.match(
    indexHtml,
    /const PQ_MINI_PROGRAM_QR_URL = 'resources\/pq\.png\?v=20260724';/,
    'the quiz entry should reference the restored PQ mini program code'
);
assert.match(
    indexHtml,
    /function buildPqCourseEntry\(\)[\s\S]*?uiText\('PQ AI literacy course', 'PQ AI 通识课'\)[\s\S]*?class="quick-quiz-pq-qr-frame"[\s\S]*?PQ_MINI_PROGRAM_QR_URL/,
    'the quiz panel should expose the bilingual PQ mini program course entrance'
);
assert.doesNotMatch(
    indexHtml,
    /POP_QUIZ_MOBILE|mobileQuizApp|mobile-quiz-app|quiz=mobile|mobile_quiz_start|mobile_quiz_complete|qr_landing|10-question mobile challenge|10 题手机挑战|claim a souvenir|领取纪念品|ai100-pop-quiz-qr-v2/,
    'the retired mobile challenge page, route, analytics, entry, and souvenir copy should not remain in the presentation'
);
console.log('PASS PQ-only quiz course entrance');

assert.match(
    indexHtml,
    /const shouldUseVideo = isDirectVideoMedia\(videoUrl\)[\s\S]*?canLoadBranchVideo/,
    'game evolution images such as GIF files should not be rendered through a video element'
);
assert.match(
    indexHtml,
    /class="ui-media-video-poster"/,
    'AI100 commentary media should display a visual poster before playback'
);
assert.match(
    indexHtml,
    /function getUiDetailImages\(vm\)[\s\S]*?const candidates = getUiImageCandidates\(vm\)[\s\S]*?getUiMediaVisualImage\(vm, candidates\)[\s\S]*?candidates\.filter\(\(url\) => url !== sideImageUrl\)/,
    'detail image lists should exclude the image mounted in the right-side media panel'
);
assert.doesNotMatch(
    indexHtml,
    /function getUiDetailImages\(vm\)[\s\S]*?isHumanisticMilestone\(vm && vm\.raw\)\) return candidates/,
    'humanistic detail image lists should not retain the explainer mounted in the right-side media panel'
);
assert.match(
    indexHtml,
    /function getConfiguredImageMetaMap\(vm\)[\s\S]*?function getConfiguredImageMetaEntry\(vm, url\)[\s\S]*?function getConfiguredImageMeta\(vm, url\)/,
    'image metadata consumers should share one normalized Archive metadata lookup'
);
assert.match(
    indexHtml,
    /function findHumanisticExplainerImage\(vm, images\)[\s\S]*?isHumanisticMilestone\(vm && vm\.raw\)[\s\S]*?images\.find\(\(url\) => isExplainerMedia\(vm, url\)\)[\s\S]*?function getUiMediaVisualImage\(vm,[\s\S]*?findHumanisticExplainerImage\(vm, images\)/,
    'humanistic commentary media should prioritize the first explainer image'
);
assert.match(
    indexHtml,
    /const mediaHtml = buildUiMediaHtml\(vm, \{ forceStaticImage: isHumanisticCycle \}\)[\s\S]*?uiText\('Sources', '资料来源'\)[\s\S]*?uiText\('Commentary & Media', '评论与媒体'\)/,
    'humanistic explainers should render as static commentary media directly after sources'
);
assert.match(
    indexHtml,
    /function getUiPrimaryImage\(vm\)[\s\S]*?getUiImageCandidates\(vm\)\[0\]/,
    'map and event-list thumbnails should keep using the complete image candidates'
);
assert.match(
    indexHtml,
    /const detailImageHtml = imageUrl[\s\S]*?\? `[\s\S]*?class="ui-detail-image"[\s\S]*?: '';/,
    'detail pages should omit the left image area when every candidate is mounted on the right'
);
assert.match(
    indexHtml,
    /const player = button\.querySelector\('video'\)[\s\S]*?const playback = player\.play\(\)/,
    'direct AI100 commentary videos should start playback from the user click'
);
console.log('PASS Pages media rendering safeguards');

console.log('All storyline-routing checks passed.');
