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

const gamingMilestones = generatedMilestones.filter(
    (milestone) => routing.getMilestoneStorylineId(milestone) === 'gaming-ai'
);
assert.equal(gamingMilestones.length, 13, 'the gaming AI storyline should contain thirteen events');
gamingMilestones.forEach((milestone) => {
    assert.ok(
        milestone.achievement && milestone.achievement.visual,
        `${milestone.archiveEventId || milestone.id} should provide a unified UI visual`
    );
    assert.ok(
        Array.isArray(milestone.quizzes) && milestone.quizzes.length > 0,
        `${milestone.archiveEventId || milestone.id} should provide a detail checkpoint quiz`
    );
});
console.log('PASS gaming AI unified UI content coverage');

const annualAi100Milestones = generatedMilestones.filter(
    (milestone) => routing.getMilestoneStorylineId(milestone) === 'bench-council-ai100-2022-2023'
);
assert.equal(
    annualAi100Milestones.length,
    120,
    'the BenchCouncil 2022-2023 annual storyline should contain 120 events'
);
assert.equal(annualAi100Milestones[0].title.en, 'Swin Transformer V2', 'the annual storyline should retain row 1');
assert.equal(annualAi100Milestones.at(-1).title.en, 'OSTrack', 'the annual storyline should retain row 120');
assert.deepEqual(
    annualAi100Milestones[0].figures.map((figure) => figure.name.en),
    ['Ze Liu', 'Han Hu'],
    'annual milestones should preserve the complete official contributor order'
);
assert.equal(annualAi100Milestones[0].figures[0].avatar.endsWith('ze-liu-portrait.jpg'), true);
assert.equal(annualAi100Milestones[0].figures[1].avatar, '');
assert.deepEqual(
    annualAi100Milestones[1].figures.map((figure) => figure.name.en),
    ['Zhenda Xie', 'Zheng Zhang', 'Yue Cao', 'Han Hu'],
    'annual milestones should retain contributor information when no portrait is available'
);
assert.equal(
    annualAi100Milestones[1].figures.every((figure) => figure.avatar === ''),
    true,
    'contributors without a verified portrait should remain text-only'
);
console.log('PASS BenchCouncil annual storyline order');

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
const dualScreenHtml = fs.readFileSync(path.join(__dirname, '..', 'dual-screen.html'), 'utf8');
const chronologySource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'chronology-overview.js'), 'utf8');
const chronologyCss = fs.readFileSync(path.join(__dirname, '..', 'shared', 'chronology-overview.css'), 'utf8');
const i18nSource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'i18n.js'), 'utf8');
const pqMiniProgramQrPath = path.join(__dirname, '..', 'resources', 'pq.png');
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
    /class="ui-back-button"[^>]*aria-label="返回">返回<\/button>/,
    'event details should expose a visible text back action before JavaScript initializes'
);
assert.match(
    indexHtml,
    /\.ui-back-button\s*\{[\s\S]*?min-width:\s*124px[\s\S]*?height:\s*42px[\s\S]*?background:\s*var\(--accent\)[\s\S]*?font-size:\s*17px/,
    'the desktop event-detail back action should use a prominent text-button treatment'
);
assert.match(
    indexHtml,
    /@media \(min-width:\s*1200px\)[\s\S]*?\.single-stage\.is-ui-browser\.is-ui-detail \.ui-browser-main\s*\{[\s\S]*?height:\s*878px/,
    'desktop event details should leave a separate gap above the back action'
);
assert.match(
    indexHtml,
    /\.single-stage\.is-ui-browser\.is-ui-detail \.ui-back-button\s*\{[\s\S]*?position:\s*fixed[\s\S]*?min-width:\s*112px[\s\S]*?height:\s*var\(--touch-target\)/,
    'the mobile event-detail back action should remain prominent and touchable'
);
assert.match(
    indexHtml,
    /const backLabel = uiText\('Back', '返回'\);[\s\S]*?uiBackButton\.textContent = backLabel[\s\S]*?setAttribute\('aria-label', backLabel\)/,
    'the visible back action should follow the current page language'
);
assert.match(
    indexHtml,
    /unifiedSourceMilestones = allMilestones\.filter[\s\S]*?unifiedMilestoneCache = window\.ChronologyOverview\.buildCanonicalMilestones\(unifiedSourceMilestones,[\s\S]*?storylinePriority: AI_HISTORY_MAP_VARIANT_PRIORITY/,
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
    /chronologyOverview\.setState\(\{ storylineId: chronologyFilterStorylineId \}\);[\s\S]*?chronologyOverview\.update\(\{[\s\S]*?milestones:\s*getChronologyOverviewMilestones\(\)/,
    'the overview should restore the selected storyline against its matching dataset'
);
assert.match(
    indexHtml,
    /function getChronologyFilterStorylineId\(storylineId\)[\s\S]*?normalizeStorylineId\(storylineId\)[\s\S]*?CHRONOLOGY_FILTER_STORYLINE_IDS\.has\(normalizedStorylineId\)/,
    'all configured chronology storylines should map back to their matching overview filter'
);
assert.match(
    indexHtml,
    /let chronologyFilterStorylineId = requestedChronologyFilterStorylineId[\s\S]*?getChronologyFilterStorylineId\(activeStorylineId\)/,
    'a storyline URL should initialize the chronology filter from the active storyline'
);
assert.match(
    indexHtml,
    /function getChronologyOverviewMilestones\(\)[\s\S]*?chronologyFilterStorylineId === ANNUAL_AI100_STORYLINE_ID[\s\S]*?getStorylineMilestones\(ANNUAL_AI100_STORYLINE_ID\)[\s\S]*?milestones: getChronologyOverviewMilestones\(\)[\s\S]*?preserveSourceOrder: chronologyFilterStorylineId === ANNUAL_AI100_STORYLINE_ID/,
    'the annual storyline should supply its own 120-row dataset to the overview in official order'
);
assert.match(
    indexHtml,
    /const CHRONOLOGY_FILTER_PARAM = 'storylineFilter'[\s\S]*?function syncChronologyFilterUrl\(url\)[\s\S]*?searchParams\.set\(CHRONOLOGY_FILTER_PARAM, chronologyFilterStorylineId\)[\s\S]*?function getUiHistoryState[\s\S]*?storylineFilterId: chronologyFilterStorylineId/,
    'chronology filters should persist in detail URLs and browser history state'
);
assert.match(
    indexHtml,
    /function handleUiBrowserHistoryPop\(event\)[\s\S]*?uiState\.storylineFilterId[\s\S]*?getChronologyVisibleMilestones\(\)[\s\S]*?findMilestoneIndexByEventId\(uiState\.eventId, detailMilestones\)/,
    'browser history should restore the filter before rebuilding detail navigation'
);
assert.match(
    indexHtml,
    /function setChronologyFilterStorylineId\(storylineId, options = \{\}\)[\s\S]*?getChronologyFilterStorylineId\(storylineId\)[\s\S]*?options\.replaceHistory[\s\S]*?replaceUiLevelHistoryEntry\(\)[\s\S]*?onFilterChange: \(storylineId\) => \{[\s\S]*?setChronologyFilterStorylineId\(storylineId, \{ replaceHistory: true \}\)/,
    'overview filter changes should update the current URL and history entry'
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
    /\.chrono-card-media\.is-portrait::before\s*\{[\s\S]*?background-image:\s*var\(--portrait-backdrop-image[\s\S]*?background-size:\s*cover[\s\S]*?\.chrono-card-media\.is-portrait img\s*\{[\s\S]*?object-fit:\s*contain[\s\S]*?object-position:\s*center top[\s\S]*?\.chrono-card-media\.is-portrait\.is-cover-safe img\s*\{[\s\S]*?object-fit:\s*cover[\s\S]*?\.chrono-event-card:hover \.chrono-card-media\.is-portrait img,[\s\S]*?transform:\s*none/,
    'portrait cards should fill their backdrop while preserving the complete foreground head'
);
assert.match(
    chronologySource,
    /function canPortraitCoverWithoutVerticalCrop\([\s\S]*?safeImageWidth \/ safeImageHeight >= safeFrameWidth \/ safeFrameHeight[\s\S]*?function observeImages\(scroller\)[\s\S]*?--portrait-backdrop-image[\s\S]*?classList\.toggle\([\s\S]*?'is-cover-safe'/,
    'portrait fit should be selected after the image dimensions are available'
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
    /id: 'gaming-ai',[\s\S]*?layout: 'ui-browser'/,
    'the gaming AI storyline should use the same UI browser as the other public storylines'
);
assert.match(
    indexHtml,
    /UI_GAME_EVOLUTION_PLACEHOLDER_PATTERN[\s\S]*?sample-go-game[\s\S]*?function getUiGameEvolutionModule/,
    'the unified gaming UI should not expose the shared sample game as event-specific playback'
);
assert.match(
    i18nSource,
    /aiHistoryMode:\s*'人工智能历史'/,
    'the Chinese mode label should use the full localized name'
);
assert.match(
    indexHtml,
    /data-i18n="aiHistoryMode">人工智能历史<\/span>/,
    'the initial UI shell should match the localized Chinese mode label before JavaScript initializes'
);
assert.match(
    indexHtml,
    /function isHumanisticMilestone\(milestone\)[\s\S]*?archiveVariantId === 'humanistic-cycle'[\s\S]*?milestone-humanistic-cycle-[\s\S]*?function buildUiSentimentTagHtml\(raw\)[\s\S]*?isHumanisticMilestone\(raw\)[\s\S]*?raw\.sentiment[\s\S]*?getAchievementField\(raw, 'area'/,
    'humanistic UI browser cards should restore localized emotion labels with sentiment styling'
);
assert.match(
    indexHtml,
    /const AI_HISTORY_MAP_VARIANT_PRIORITY = \[[\s\S]*?'bench-council-ai100'[\s\S]*?DEEP_STORYLINE_ID[\s\S]*?'gaming-ai'[\s\S]*?'humanistic-cycle'[\s\S]*?\]/,
    'the unified chronology should include the four long-term public storylines'
);
assert.match(
    indexHtml,
    /const UNIFIED_STORYLINE_EXCLUSIONS = new Set\(\[ANNUAL_AI100_STORYLINE_ID\]\)[\s\S]*?unifiedSourceMilestones = allMilestones\.filter/,
    'the annual AI100 snapshot should remain separate from the unified long-term chronology'
);
assert.match(
    indexHtml,
    /const STORYLINE_OPTIONS = \[[\s\S]*?id: UNIFIED_STORYLINE_ID[\s\S]*?id: 'bench-council-ai100'[\s\S]*?id: ANNUAL_AI100_STORYLINE_ID[\s\S]*?id: 'gaming-ai'[\s\S]*?id: 'humanistic-cycle'[\s\S]*?id: DEEP_STORYLINE_ID[\s\S]*?\];/,
    'the storyline selector should expose canonical and annual AI100 as separate views'
);
assert.match(
    indexHtml,
    /class="ui-detail-title-row">[\s\S]*?class="ui-detail-title"[\s\S]*?\$\{sentimentTagHtml\}/,
    'humanistic detail pages should place the emotion label directly after the event title'
);
assert.match(
    indexHtml,
    /\.branch-timeline-page\.is-humanistic-cycle \.branch-event,\s*\.ui-sentiment-tag\s*\{[\s\S]*?--sentiment:[\s\S]*?--sentiment-soft:/,
    'humanistic timeline cards and detail labels should share one default sentiment palette'
);
assert.match(
    indexHtml,
    /\.ui-sentiment-tag\s*\{[\s\S]*?border:\s*1px solid var\(--sentiment\)[\s\S]*?background:\s*var\(--sentiment-soft\)[\s\S]*?color:\s*var\(--sentiment\)/,
    'humanistic emotion labels should retain their bordered sentiment background'
);
for (const sentiment of ['hype', 'ethics', 'warning', 'optimism', 'cyberpunk', 'dread', 'defense', 'winter']) {
    assert.match(
        indexHtml,
        new RegExp(
            `\\.branch-timeline-page\\.is-humanistic-cycle \\.branch-event--sentiment-${sentiment},\\s*\\.ui-sentiment-tag--${sentiment}\\s*\\{`
        ),
        `humanistic ${sentiment} cards and labels should share the same sentiment palette`
    );
}
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
assert.doesNotMatch(
    indexHtml,
    /replace\(\/\\bUnited States\\b\/g, 'US'\)/,
    'unified UI addresses should preserve complete English country names'
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
assert.doesNotMatch(
    indexHtml,
    /class="ui-detail-place"[^>]*\stitle=/,
    'detail locations should not duplicate the custom tooltip with a native title'
);
assert.match(
    indexHtml,
    /function syncUiDetailLocationTooltip\(place, shell\)[\s\S]*?scrollHeight > place\.clientHeight[\s\S]*?has-truncated-address[\s\S]*?aria-describedby/,
    'detail locations should enable their tooltip only when the visible address is truncated'
);
assert.match(
    indexHtml,
    /ui-detail-place-shell\.has-truncated-address:hover \.ui-detail-place-tooltip,[\s\S]*?focus-within \.ui-detail-place-tooltip[\s\S]*?visibility:\s*visible/,
    'truncated detail addresses should reveal the complete address on hover or keyboard focus'
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
assert.doesNotMatch(
    indexHtml,
    /function getUiDetailFigures\(vm\)[\s\S]*?slice\(0, UI_DETAIL_FIGURE_LIMIT\)/,
    'unified UI detail pages should preserve every configured figure'
);
assert.match(
    indexHtml,
    /function getUiDetailFigures\(vm\)[\s\S]*?vm\.figures\.filter\(Boolean\)/,
    'unified UI detail pages should return the complete configured figure list'
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
assert.doesNotMatch(
    indexHtml,
    /function getUiDetailFigures\(vm\)[\s\S]*?figures\.filter\(\(figure\) => Boolean\(getFigureAvatarSource\(figure\)\)\)/,
    'detail pages should not hide contributor information when a verified portrait is unavailable'
);
assert.match(
    indexHtml,
    /function initials\(name\)[\s\S]*?localizedName\.replace\(\/\\s\*\[（\(\]\[\^\(\)（）\]\*\[\)）\]\\s\*\$\/[\s\S]*?toUpperCase\(\)/,
    'text avatars should omit parenthetical source qualifiers while preserving the full visible person name'
);
assert.match(
    indexHtml,
    /detailFigureCount \? `<div class="ui-avatar-strip count-\$\{detailFigureCount\}">\$\{buildUiAvatarHtml\(vm, detailFigures\)\}<\/div>` : ''/,
    'events without contributor information should not render an empty person-card strip'
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
    /const uiBrowserActive = isUiBrowserActive\(\)[\s\S]*?const isChronologyOverview = uiBrowserActive && uiBrowserMode !== 'detail'[\s\S]*?if \(isChronologyOverview\) \{[\s\S]*?resetCompletionQuizView\(\)[\s\S]*?\} else \{[\s\S]*?markCompletionQuizView\(vm\)/,
    'the chronology overview should reset quiz dwell time while event details start it'
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
    /const shouldUseVideo = isDirectVideoMedia\(videoUrl\)[\s\S]*?canLoadGameEvolutionVideo/,
    'game evolution images such as GIF files should not be rendered through a video element'
);
assert.match(
    indexHtml,
    /class="ui-media-video-poster"/,
    'AI100 commentary media should display a visual poster before playback'
);
assert.match(
    indexHtml,
    /\.ui-media-video-poster\s*\{[\s\S]*?object-fit:\s*contain[\s\S]*?\.ui-media-video video,[\s\S]*?object-fit:\s*contain/,
    'commentary images and direct videos should scale to fit without cropping'
);
assert.match(
    indexHtml,
    /function getUiDetailImages\(vm\)[\s\S]*?if \(shouldHideUiCommentaryMediaVisual\(vm && vm\.raw\)\) return candidates[\s\S]*?const sideImageIndex = sideImageUrl \? candidates\.indexOf\(sideImageUrl\) : -1[\s\S]*?if \(sideImageIndex <= 0\) return candidates[\s\S]*?GamingMediaSelection\.excludeSelectedMedia\(candidates, sideImageUrl\)/,
    'detail image lists should preserve the first candidate while excluding a later side-panel image'
);
assert.doesNotMatch(
    indexHtml,
    /UI_CHRONOLOGY_IMAGE_OVERRIDES|getChronologyCardImage|resolveCardImage/,
    'overview cards should read generated Archive image configuration without index.html overrides'
);
assert.match(
    dualScreenHtml,
    /function sortPhotosForDisplay\(photos\)[\s\S]*?return \[\.\.\.\(photos \|\| \[\]\)\]\.filter\(Boolean\);/,
    'dual-screen detail images should preserve Archive resources.images order by default'
);
assert.doesNotMatch(
    dualScreenHtml,
    /function sortPhotosForDisplay\(photos\)[\s\S]*?\.sort\(/,
    'dual-screen detail images should not reorder Archive resources by media type'
);
console.log('PASS dual-screen detail images preserve Archive order');
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
    /function shouldHideUiCommentaryMediaVisual\(raw\)[\s\S]*?function buildUiMediaHtml\(vm, \{ forceStaticImage = false, hideVisual = false \} = \{\}\)[\s\S]*?if \(vm\.videoEmbedUrl && !forceStaticImage\)[\s\S]*?const posterUrl = hideVisual \? '' : getUiMediaVisualImage\(vm\)[\s\S]*?if \(hideVisual\) return ''[\s\S]*?const hideCommentaryMediaVisual = shouldHideUiCommentaryMediaVisual\(raw\)[\s\S]*?hideVisual: hideCommentaryMediaVisual/,
    'event-level visual suppression should retain video rendering while hiding duplicate static media'
);
assert.match(
    indexHtml,
    /function getAchievementSources\(rawMilestone\)[\s\S]*?type: uiText\('Paper', '论文'\)[\s\S]*?const seenTitles = new Set\(\)[\s\S]*?titleKeys\.some\(\(key\) => seenTitles\.has\(key\)\)/,
    'achievement sources should use compact paper types and deduplicate alternate links by normalized title'
);
assert.doesNotMatch(
    indexHtml,
    /uiText\(`Paper · \$\{journal\}`, `论文 · \$\{journal\}`\)/,
    'achievement source type labels should not include long journal or submission details'
);
assert.match(
    indexHtml,
    /const detailImageHtml = imageUrl[\s\S]*?\? `[\s\S]*?class="ui-detail-image"[\s\S]*?: '';/,
    'detail pages should omit the left image area when every candidate is mounted on the right'
);
assert.match(
    indexHtml,
    /const UI_DETAIL_IMAGE_AUTOPLAY_MS = 3 \* 1000;[\s\S]*?function scheduleUiDetailImageAutoplay\(\)[\s\S]*?document\.hidden[\s\S]*?prefers-reduced-motion: reduce[\s\S]*?window\.setTimeout[\s\S]*?setUiDetailImageIndex\(uiDetailImageIndex \+ 1, activeImages\)/,
    'detail image collections should advance every three seconds while the page is visible'
);
assert.match(
    indexHtml,
    /function updateUiDetailImageView\(vm, detailImages\)[\s\S]*?image\.src = imageUrl[\s\S]*?captionTitle\.innerHTML = escapeHtmlWithCjkTail[\s\S]*?aria-current[\s\S]*?function setUiDetailImageIndex[\s\S]*?updateUiDetailImageView\(vm, detailImages\)[\s\S]*?scheduleUiDetailImageAutoplay\(\)/,
    'detail image changes should update the media, caption, and pager without rebuilding the full detail page'
);
assert.doesNotMatch(
    indexHtml,
    /function bindUiDetailImageSwipe|UI_DETAIL_IMAGE_SWIPE_THRESHOLD|UI_DETAIL_IMAGE_SWIPE_AXIS_RATIO/,
    'detail image navigation should not retain drag or swipe handling'
);
assert.match(
    indexHtml,
    /function buildUiDetailImageEdgeButtonsHtml\(detailImages\)[\s\S]*?data-ui-image-step="-1"[\s\S]*?上一张图片[\s\S]*?data-ui-image-step="1"[\s\S]*?下一张图片[\s\S]*?querySelectorAll\('\[data-ui-image-step\]'\)[\s\S]*?setUiDetailImageIndex\(uiDetailImageIndex \+ imageStep, detailImages\)/,
    'multi-image details should expose previous and next edge buttons'
);
assert.match(
    indexHtml,
    /\.ui-detail-image-edge\s*\{[\s\S]*?opacity:\s*0[\s\S]*?pointer-events:\s*none[\s\S]*?\.ui-detail-image-stage:hover \.ui-detail-image-edge,[\s\S]*?opacity:\s*1[\s\S]*?@media \(hover:\s*none\)[\s\S]*?\.ui-detail-image-edge\s*\{[\s\S]*?opacity:\s*1/,
    'image edge buttons should appear on desktop hover and remain visible on touch devices'
);
assert.match(
    indexHtml,
    /function buildUiEventEdgeButtonsHtml\(\)[\s\S]*?uiText\('Previous event', '上一个事件'\)[\s\S]*?uiText\('Next event', '下一个事件'\)[\s\S]*?data-ui-event-step="-1"[\s\S]*?data-ui-event-step="1"[\s\S]*?function bindUiEventEdgeNavigation\(root\)[\s\S]*?analyticsSource: 'event-edge'/,
    'detail pages should expose previous and next event edge buttons'
);
assert.match(
    indexHtml,
    /\.ui-event-edge\s*\{[\s\S]*?--ui-event-triangle-block:\s*12px[\s\S]*?top:\s*44px[\s\S]*?bottom:\s*72px[\s\S]*?\.ui-event-edge::before\s*\{[\s\S]*?border-top:\s*var\(--ui-event-triangle-block\) solid transparent[\s\S]*?\.ui-event-edge\.is-prev::before\s*\{[\s\S]*?border-right:\s*var\(--ui-event-triangle-inline\) solid currentColor[\s\S]*?\.ui-event-edge:disabled\s*\{[\s\S]*?display:\s*none/,
    'event edge controls should remain visible as compact triangles within tall side targets'
);
assert.match(
    indexHtml,
    /function bindUiEventEdgeNavigation\(root\)[\s\S]*?querySelectorAll\('\[data-ui-event-step\]'\)[\s\S]*?navigate\(eventStep > 0 \? 'next' : 'prev'[\s\S]*?bindUiEventEdgeNavigation\(refs\.uiBrowserMain\)/,
    'event edge triangles should navigate immediately when clicked'
);
assert.match(
    indexHtml,
    /function shouldRunIdleAutoAdvance\(\)[\s\S]*?return !isUiBrowserActive\(\) \|\| uiBrowserMode === 'detail'[\s\S]*?function handleIdleAutoAdvance\(\)[\s\S]*?if \(!shouldRunIdleAutoAdvance\(\)\)[\s\S]*?function restartIdleAdvanceTimer\(\)[\s\S]*?if \(!shouldRunIdleAutoAdvance\(\)\) return/,
    'chronology overview should never idle-advance into an event detail'
);
assert.match(
    indexHtml,
    /function bindUiDetailImageAutoplayPause\(imageStage, imageCount\)[\s\S]*?mouseenter[\s\S]*?mouseleave[\s\S]*?focusin[\s\S]*?focusout[\s\S]*?function renderUiDetail\(\)[\s\S]*?bindUiDetailImageAutoplayPause[\s\S]*?scheduleUiDetailImageAutoplay\(\)[\s\S]*?visibilitychange[\s\S]*?document\.hidden\) clearUiDetailImageAutoplay/,
    'detail image autoplay should pause for navigation controls and when the document is hidden'
);
assert.match(
    indexHtml,
    /const player = button\.querySelector\('video'\)[\s\S]*?const playback = player\.play\(\)/,
    'direct AI100 commentary videos should start playback from the user click'
);
console.log('PASS Pages media rendering safeguards');

console.log('All storyline-routing checks passed.');
