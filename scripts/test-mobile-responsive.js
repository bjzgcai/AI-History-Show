const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', 'index.html');
const source = fs.readFileSync(indexPath, 'utf8');

function assertContains(pattern, message) {
    const passed = typeof pattern === 'string' ? source.includes(pattern) : pattern.test(source);
    assert.equal(passed, true, message);
    console.log(`PASS ${message}`);
}

const mobileRequirements = [
    {
        pattern: '--touch-target: 44px',
        message: 'mobile touch target token is defined'
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
        pattern: /@media\s*\(max-width:\s*600px\)[\s\S]*?\.branch-event \.branch-game-record-trigger[\s\S]*?pointer-events:\s*auto/,
        message: 'phone chess demos remain visible and touchable'
    },
    {
        pattern: /const showAllRecords = window\.matchMedia\('\(max-width: 600px\)'\)\.matches;[\s\S]*?showAllRecords \|\| isCentered/,
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
        pattern: /function handleUiBrowserHistoryPop\(event\)[\s\S]*?returnFromUiDetail\(\{ updateHistory: false \}\)/,
        message: 'browser back returns from phone detail page to the map page'
    },
    {
        pattern: /window\.addEventListener\('popstate', handleUiBrowserHistoryPop\)/,
        message: 'browser history popstate is bound for mobile detail navigation'
    }
];

for (const requirement of mobileRequirements) {
    assertContains(requirement.pattern, requirement.message);
}
