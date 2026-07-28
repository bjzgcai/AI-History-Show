const assert = require('node:assert/strict');
const fs = require('node:fs');
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
assert.equal(
    routing.getMilestoneStorylineId({ storyline: { id: 'humanistic-cycle' } }),
    'humanistic-cycle',
    'the humanistic cycle storyline should remain independently routable'
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

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const chronologySource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'chronology-overview.js'), 'utf8');
const chronologyCss = fs.readFileSync(path.join(__dirname, '..', 'shared', 'chronology-overview.css'), 'utf8');
assert.match(
    indexHtml,
    /class="single-stage is-ui-browser" id="singleStage"/,
    'the default document should paint the unified UI shell before JavaScript initialization'
);
assert.match(
    indexHtml,
    /shared\/chronology-overview\.js/,
    'the default UI shell should load the production chronology overview module'
);
assert.match(
    indexHtml,
    /unifiedMilestoneCache = window\.ChronologyOverview\.buildCanonicalMilestones\(allMilestones,[\s\S]*?storylinePriority: AI_HISTORY_MAP_VARIANT_PRIORITY/,
    'the default overview should merge storyline variants by canonical Archive event'
);
assert.match(
    indexHtml,
    /function getDetailMilestone\(index\)[\s\S]*?findMilestoneById\(uiSelectedEventId\)[\s\S]*?getCanonicalEventId\(selectedMilestone\) === getCanonicalEventId\(defaultMilestone\)/,
    'detail rendering should resolve the exact variant selected from a canonical card'
);
assert.match(
    indexHtml,
    /window\.ChronologyOverview\.create\(refs\.uiBrowserMain,[\s\S]*?onOpenMilestone:\s*openChronologyMilestone/,
    'the chronology overview should open milestones through the existing detail renderer'
);
assert.match(
    indexHtml,
    /chronologyOverview\.setState\(\{ storylineId: chronologyFilterStorylineId \}\);[\s\S]*?chronologyOverview\.update\(\{[\s\S]*?milestones:\s*buildUnifiedMilestones\(\)/,
    'the overview should retain the complete canonical filters while restoring the selected storyline'
);
assert.match(
    indexHtml,
    /function openChronologyMilestone\(eventId\)[\s\S]*?detailMilestones = getChronologyVisibleMilestones\(\)[\s\S]*?milestoneList = detailMilestones/,
    'opening a chronology card should use the active filter only for detail navigation'
);
assert.match(
    indexHtml,
    /function getStorylineSelectorStorylineId\(\)[\s\S]*?uiBrowserMode === 'detail'[\s\S]*?getChronologyOptionStorylineId\(chronologyFilterStorylineId\)[\s\S]*?const selectedStorylineId = getStorylineSelectorStorylineId\(\)[\s\S]*?option\.id === selectedStorylineId/,
    'detail storyline controls should reflect the filter used to enter the event'
);
assert.match(
    indexHtml,
    /function navigate\(direction, options = \{\}\)[\s\S]*?currentIndex \+ 1, milestoneList\.length - 1[\s\S]*?uiSelectedEventId = milestoneList\[nextIndex\]/,
    'detail arrow navigation should stay within the filtered milestone list'
);
assert.match(
    indexHtml,
    /function jumpTo\(index[\s\S]*?uiSelectedEventId = milestoneList\[index\]\.id[\s\S]*?replaceUiDetailHistoryEntry\(\)/,
    'detail arrow navigation should update the current event URL without adding another history entry'
);
assert.doesNotMatch(
    chronologySource,
    /class="chrono-toolbar"/,
    'the chronology overview should not duplicate storyline controls in a separate toolbar'
);
assert.match(
    chronologySource,
    /const filters = \[[\s\S]*?id: 'all'[\s\S]*?class="chrono-storyline-strip"[\s\S]*?\$\{filters/,
    'the single storyline strip should begin with an all-events filter'
);
assert.match(
    chronologySource,
    /selectMilestonesByStoryline\(getCanonicalMilestones\(\), state\.storylineId\)[\s\S]*?class="chrono-card-memberships"/,
    'storyline filters should select their variant while multi-storyline cards expose membership markers'
);
assert.match(
    chronologyCss,
    /\.chrono-card-strip i[\s\S]*?flex:\s*1[\s\S]*?\.chrono-card-memberships i[\s\S]*?background:\s*var\(--membership-color\)/,
    'multi-storyline cards should use segmented color strips and visible membership dots'
);
assert.match(
    chronologyCss,
    /\.single-stage\.is-ui-browser:not\(\.is-ui-detail\) \.storyline-trigger\s*\{[\s\S]*?display:\s*none/,
    'the redundant top-right storyline selector should stay hidden on the chronology overview'
);
assert.match(
    indexHtml,
    /renderTimeline\(vm\);[\s\S]*?isUiBrowserActive\(\) && uiBrowserMode !== 'detail'[\s\S]*?document\.title = `\$\{tx\('appTitleSingle'\)\} - \$\{getStorylineLabel\(getActiveStorylineOption\(\)\)/,
    'the chronology overview should use its storyline title instead of retaining the last event title'
);
assert.match(
    indexHtml,
    /\.ui-detail-topline\s*\{[\s\S]*?grid-template-columns:\s*fit-content\(829px\) minmax\(300px, 1fr\)[\s\S]*?column-gap:\s*67px[\s\S]*?\.ui-detail-context\s*\{[\s\S]*?min-width:\s*564px[\s\S]*?max-width:\s*829px/,
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
    /const map = \{[\s\S]*?raw\.resources && raw\.resources\.imageMeta[\s\S]*?\.\.\.\(raw\.imageMeta \|\| \{\}\)/,
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
    'completion quizzes should depend on event quiz data and stay disabled on the chronology overview'
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
    'the chronology overview should reset quiz dwell time while event details start it'
);
console.log('PASS unified UI boot state and storyline detail URL normalization');

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
