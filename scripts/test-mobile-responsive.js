const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', 'index.html');
const source = fs.readFileSync(indexPath, 'utf8');
const dualScreenSource = fs.readFileSync(path.join(__dirname, '..', 'dual-screen.html'), 'utf8');
const chronologySource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'chronology-overview.css'), 'utf8');
const chronologyScriptSource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'chronology-overview.js'), 'utf8');

function assertContains(pattern, message, haystack = source) {
    const passed = typeof pattern === 'string' ? haystack.includes(pattern) : pattern.test(haystack);
    assert.equal(passed, true, message);
    console.log(`PASS ${message}`);
}

const mobileRequirements = [
    {
        pattern: '--touch-target: 44px',
        message: 'mobile touch target token is defined'
    },
    {
        pattern: /--mode-chip-width:\s*150px/,
        message: 'the localized AI history label keeps a stable width with room for Chinese text'
    },
    {
        pattern: /@media\s*\(max-width:\s*1199px\)/,
        message: 'tablet and mobile responsive breakpoint exists'
    },
    {
        pattern: /@media\s*\(max-width:\s*600px\)/,
        message: 'small phone responsive breakpoint exists'
    },
    {
        pattern: 'min-height: 100dvh',
        message: 'dynamic viewport height is used for mobile browser chrome'
    },
    {
        pattern: /\.single-stage\.is-ui-browser \.ui-browser-main[\s\S]*?position:\s*static/,
        message: 'UI browser main area leaves fixed desktop positioning on mobile'
    },
    {
        pattern: /shared\/chronology-overview\.css/,
        message: 'the responsive chronology overview stylesheet is loaded'
    },
    {
        pattern:
            /\.single-stage\.is-ui-browser\.is-ui-detail \.storyline-context\s*\{[\s\S]*?min-height:\s*var\(--touch-target\)[\s\S]*?font-size:\s*13px/,
        message: 'the static detail storyline label remains readable in the mobile top bar'
    },
    {
        pattern:
            /\.chrono-storyline-subtitle\s*\{[\s\S]*?text-overflow:\s*ellipsis[\s\S]*?@media\s*\(max-width:\s*1199px\)[\s\S]*?--chrono-storyline-height:\s*66px[\s\S]*?\.chrono-storyline-subtitle\s*\{[\s\S]*?max-width:\s*290px/,
        haystack: chronologySource,
        message: 'mobile storyline subtitles stay visible without expanding the chronology header indefinitely'
    },
    {
        pattern:
            /@media\s*\(max-width:\s*700px\) and \(max-height:\s*760px\)[\s\S]*?\.single-stage\.is-ui-browser:not\(\.is-ui-detail\)[\s\S]*?overflow:\s*visible[\s\S]*?\.stage-grid[\s\S]*?min-height:\s*700px/,
        haystack: chronologySource,
        message: 'short portrait chronology pages grow vertically instead of clipping cards'
    },
    {
        pattern:
            /@media\s*\(max-width:\s*932px\) and \(max-height:\s*600px\) and \(orientation:\s*landscape\)[\s\S]*?\.stage-grid[\s\S]*?min-height:\s*520px/,
        haystack: chronologySource,
        message: 'short landscape chronology pages keep full cards visible'
    },
    {
        pattern:
            /@media\s*\(min-height:\s*601px\) and \(max-height:\s*700px\) and \(max-width:\s*932px\) and \(orientation:\s*landscape\)[\s\S]*?\.stage-grid[\s\S]*?min-height:\s*560px/,
        haystack: chronologySource,
        message: 'medium-height landscape chronology pages reserve enough room for both card rows'
    },
    {
        pattern: /@media\s*\(max-width:\s*1199px\)[\s\S]*?\.chrono-scroll\s*\{[\s\S]*?touch-action:\s*pan-x pan-y/,
        haystack: chronologySource,
        message: 'responsive chronology scrolling preserves vertical page gestures'
    },
    {
        pattern: /@media\s*\(max-width:\s*1199px\)[\s\S]*?html,[\s\S]*?body\s*\{[\s\S]*?overscroll-behavior-y:\s*auto/,
        message: 'responsive document scrolling keeps the native vertical touch chain open'
    },
    {
        pattern: /\.ui-detail[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        message: 'detail page can collapse to a single readable column'
    },
    {
        pattern: /\.bench-hero-visual[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        message: 'AI100 top visual modules can stack on narrow screens'
    },
    {
        pattern: /\.bench-demo-surface[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        message: 'AI100 visual demo and explanation boxes can stack'
    },
    {
        pattern: /\.quiz-modal-content[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        message: 'quiz material and challenge areas can stack'
    },
    {
        pattern:
            /\.quick-quiz-pq-entry\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+132px[\s\S]*?@media\s*\(max-width:\s*600px\)[\s\S]*?\.quick-quiz-pq-entry,[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        message: 'the PQ course entrance stacks its copy and mini program code on small phones'
    },
    {
        pattern: 'MOBILE_GLOBE_PIXEL_RATIO_CAP',
        message: 'mobile globe pixel ratio cap is configured'
    },
    {
        pattern: "window.addEventListener('orientationchange'",
        message: 'orientation change refreshes globe and responsive layout'
    },
    {
        pattern: 'touch-action: pan-x pan-y',
        message: 'horizontal rails still allow vertical mobile page scrolling'
    },
    {
        pattern:
            /@media\s*\(max-width:\s*600px\),\s*\(max-width:\s*932px\) and \(max-height:\s*600px\) and \(orientation:\s*landscape\)/,
        message: 'phone landscape uses the stacked branch timeline layout'
    },
    {
        pattern:
            /\.single-stage\.is-branch-timeline \.topbar-actions[\s\S]*?--branch-about-width:\s*58px[\s\S]*?grid-template-columns:[^;]*var\(--branch-about-width\)[\s\S]*?\.single-stage\.is-branch-timeline \.about-trigger[\s\S]*?width:\s*var\(--branch-about-width\)[\s\S]*?white-space:\s*nowrap/,
        message: 'phone branch about control stays on one line'
    },
    {
        pattern:
            /\.branch-event-summary[\s\S]*?display:\s*block[\s\S]*?overflow:\s*visible[\s\S]*?-webkit-line-clamp:\s*unset/,
        message: 'phone branch summaries remain fully readable'
    },
    {
        pattern:
            /@media\s*\(max-width:\s*600px\)[\s\S]*?\.branch-event \.branch-game-record-trigger[\s\S]*?pointer-events:\s*auto/,
        message: 'phone chess demos remain visible and touchable'
    },
    {
        pattern:
            /const BRANCH_TIMELINE_STACK_MEDIA_QUERY =\s*'[^']*orientation: landscape[^']*';[\s\S]*?window\.matchMedia\(BRANCH_TIMELINE_STACK_MEDIA_QUERY\)\.matches;[\s\S]*?showAllRecords \|\| isCentered/,
        message: 'phone chess demos remain keyboard accessible'
    },
    {
        pattern:
            /@media\s*\(max-width:\s*600px\)[\s\S]*?\.branch-timeline-page\.is-humanistic-cycle \.branch-timeline[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]*?grid-auto-flow:\s*row/,
        message: 'phone humanistic timeline stacks vertically'
    },
    {
        pattern:
            /\.branch-timeline-page\.is-humanistic-cycle \.branch-event-content[\s\S]*?max-height:\s*none[\s\S]*?overflow:\s*visible/,
        message: 'phone humanistic cards avoid nested scroll traps'
    },
    {
        pattern: /@media\s*\(max-width:\s*600px\)[\s\S]*?\.ui-detail-year[\s\S]*?font-size:\s*58px/,
        message: 'phone detail pages use compact typography'
    },
    {
        pattern: /@media\s*\(max-width:\s*600px\)[\s\S]*?\.ui-avatar-strip[\s\S]*?grid-auto-rows:\s*auto/,
        message: 'phone detail people list stays in normal flow before the image'
    },
    {
        pattern: /@media\s*\(max-width:\s*600px\)[\s\S]*?\.ui-detail-image-stage img[\s\S]*?object-fit:\s*contain/,
        message: 'phone detail images stay contained within their frame'
    },
    {
        pattern: /@media\s*\(max-width:\s*600px\)[\s\S]*?\.ui-detail-image-nav::before[\s\S]*?width:\s*7px/,
        message: 'phone detail image pager uses a small visible dot'
    },
    {
        pattern: /function renderUiDetailFromSelection\(options = \{\}\)[\s\S]*?resetPortraitScrollPosition\(\)/,
        message: 'entering detail view resets mobile scroll to the top'
    },
    {
        pattern: /single-stage\.is-ui-browser\.is-ui-detail \.ui-side-panel[\s\S]*?overflow-y:\s*visible !important/,
        message: 'phone detail view avoids nested vertical scroll traps'
    },
    {
        pattern: '-webkit-overflow-scrolling: touch',
        message: 'phone detail view uses native momentum scrolling'
    },
    {
        pattern: /function shouldSuspendPortraitEdgeNavigation\(\)[\s\S]*?uiBrowserMode === 'detail'/,
        message: 'phone detail view suspends edge navigation gestures while scrolling'
    },
    {
        pattern: /\.ui-source-card[\s\S]*?border-radius:\s*8px[\s\S]*?\.ui-source-url[\s\S]*?border-radius:\s*999px/,
        message: 'phone sources render as compact readable cards'
    },
    {
        pattern:
            /\.ui-commentary-card > \.ui-section-kicker[\s\S]*?font-size:\s*22px[\s\S]*?\.ui-commentary-card \.ui-concept-chip[\s\S]*?font-size:\s*17px/,
        message: 'phone commentary heading is larger than subsection labels'
    },
    {
        pattern: /function pushUiDetailHistoryEntry\(\)[\s\S]*?window\.history\.pushState/,
        message: 'opening a phone detail page creates a browser history entry'
    },
    {
        pattern:
            /function pushUiDetailHistoryEntry\(\)[\s\S]*?isCurrentUiDetailHistoryEntry\(uiSelectedEventId\)[\s\S]*?replaceState\(getUiHistoryState\('overview'\)[\s\S]*?fromOverview: true/,
        message: 'detail history entries are deduplicated and retain an overview return target'
    },
    {
        pattern:
            /function renderUiOverviewState\(\)[\s\S]*?uiBrowserMode = 'overview'[\s\S]*?uiSelectedEventId = ''[\s\S]*?uiDetailImageIndex = 0[\s\S]*?renderPage\(currentIndex\)/,
        message: 'overview rendering resets detail state through one shared helper'
    },
    {
        pattern:
            /function returnFromUiDetail\(options = \{\}\)[\s\S]*?canReturnToUiOverviewWithHistory\(\)[\s\S]*?uiReturnHistoryInProgress = true[\s\S]*?renderUiOverviewState\(\)[\s\S]*?window\.history\.back\(\)/,
        message: 'the detail back button switches to the overview immediately with one activation'
    },
    {
        pattern:
            /if \(uiReturnHistoryInProgress\)[\s\S]*?uiState\.mode === 'detail' && uiState\.fromOverview[\s\S]*?window\.history\.back\(\)/,
        message: 'the detail back button skips duplicate detail history entries automatically'
    },
    {
        pattern:
            /@media\s*\(max-width:\s*600px\)[\s\S]*?html,[\s\S]*?body\s*\{[\s\S]*?overflow-y:\s*auto[\s\S]*?\.stage-viewport,[\s\S]*?\.single-stage\.is-ui-browser\.is-ui-detail\s*\{[\s\S]*?overflow-y:\s*visible[\s\S]*?overflow-x:\s*clip/,
        message: 'phone detail pages use one document scroll container without hidden nested scrollers'
    },
    {
        pattern:
            /function isActive\(\)[\s\S]*?config\.isActive\(\)[\s\S]*?function render\(\)\s*\{[\s\S]*?if \(!isActive\(\)\) return;[\s\S]*?function handleResize\(\)[\s\S]*?if \(isActive\(\)\) render\(\)/,
        haystack: chronologyScriptSource,
        message: 'inactive chronology resize callbacks cannot overwrite the mobile detail view'
    },
    {
        pattern:
            /ChronologyOverview\.create\(refs\.uiBrowserMain,\s*\{[\s\S]*?isActive:\s*\(\) => isUiBrowserActive\(\) && uiBrowserMode === 'overview'/,
        message: 'the chronology renderer is active only while the overview is visible'
    },
    {
        pattern: /function handleUiBrowserHistoryPop\(event\)[\s\S]*?renderUiOverviewState\(\)/,
        message: 'browser back returns from phone detail page to the chronology overview'
    },
    {
        pattern: /window\.addEventListener\('popstate', handleUiBrowserHistoryPop\)/,
        message: 'browser history popstate is bound for mobile detail navigation'
    },
    {
        pattern:
            /function handlePageWheelFallback\(event\)[\s\S]*?canNestedScrollerHandleWheel\(target, deltaY\)[\s\S]*?document\.addEventListener\('wheel', handlePageWheelFallback/,
        message: 'the page wheel fallback is defined before it is bound'
    },
    {
        pattern:
            /function fitAvatarFallbackLabels\(root = refs\.uiBrowserMain\)[\s\S]*?lineCounts\[lineCounts\.length - 1\] !== 1[\s\S]*?classList\.add\('is-squeezed'\)[\s\S]*?--avatar-fallback-scale/,
        message: 'single-character fallback avatar orphans are centered on one squeezed line'
    }
];

for (const requirement of mobileRequirements) {
    assertContains(requirement.pattern, requirement.message, requirement.haystack);
}

for (const [entry, entrySource] of [
    ['single-screen', source],
    ['dual-screen', dualScreenSource]
]) {
    assert.equal(
        entrySource.includes('portraitPool[index]'),
        false,
        `${entry} figures must not infer avatars from event images`
    );
    assert.match(
        entrySource,
        /function getFigureAvatarSource\(figure\)[\s\S]*?if \(figure && figure\.avatar\)[\s\S]*?return null;/,
        `${entry} figures use only explicitly configured avatars`
    );
    console.log(`PASS ${entry} figures require explicit avatar data`);
}
