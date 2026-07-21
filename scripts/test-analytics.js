const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { createAnalytics, normalizeConfig, normalizeEventData } = require(
    path.join(__dirname, '..', 'shared', 'analytics.js')
);

function createScope() {
    let currentTime = 0;
    let timerId = 0;
    return {
        document: {
            visibilityState: 'visible',
            documentElement: { lang: 'zh-CN' },
            addEventListener() {}
        },
        location: { pathname: '/index.html' },
        performance: { now: () => currentTime },
        setTimeout() {
            timerId += 1;
            return timerId;
        },
        clearTimeout() {},
        addEventListener() {},
        advance(milliseconds) {
            currentTime += milliseconds;
        }
    };
}

const disabledScope = createScope();
assert.equal(normalizeConfig({ provider: 'umami' }).minMilestoneViewMs, 1000);
const disabledAnalytics = createAnalytics(disabledScope, { provider: 'none', enabled: false });
assert.equal(disabledAnalytics.track('should_not_send', { value: 1 }), false);
disabledAnalytics.markInteraction();
disabledAnalytics.startMilestoneView({ milestone_id: 'disabled' });
disabledAnalytics.endMilestoneView();
console.log('PASS analytics remains a no-op without a provider');

const scope = createScope();
const events = [];
const analytics = createAnalytics(scope, {
    provider: 'capture',
    enabled: true,
    minMilestoneViewMs: 3000,
    context: { layout: 'single' }
});
analytics.registerAdapter('capture', () => ({
    init() {},
    track(eventName, eventData) {
        events.push({ eventName, eventData });
        return true;
    }
}));

analytics.markInteraction();
analytics.startMilestoneView({
    milestone_id: 'milestone-a',
    archive_event_id: 'event-a',
    storyline_id: 'storyline-a'
});
scope.advance(3500);
analytics.endMilestoneView('manual_navigation');

assert.deepEqual(
    events.map((event) => event.eventName),
    ['session_start', 'milestone_view', 'milestone_leave']
);
assert.equal(events[1].eventData.layout, 'single');
assert.equal(events[2].eventData.duration_seconds, 4);
assert.equal(events[2].eventData.leave_reason, 'manual_navigation');
console.log('PASS analytics records an engaged milestone view and duration');

analytics.startMilestoneView({ milestone_id: 'milestone-auto' }, { eligible: false });
scope.advance(5000);
analytics.endMilestoneView('auto_navigation');
assert.equal(events.filter((event) => event.eventData.milestone_id === 'milestone-auto').length, 0);

analytics.startMilestoneView({ milestone_id: 'milestone-auto-engaged' }, { eligible: false });
analytics.markInteraction();
scope.advance(3200);
analytics.endMilestoneView('manual_navigation');
assert.equal(
    events.filter(
        (event) => event.eventName === 'milestone_view' && event.eventData.milestone_id === 'milestone-auto-engaged'
    ).length,
    1
);
console.log('PASS auto-advanced milestones require a later interaction');

scope.advance(30 * 60 * 1000);
analytics.markInteraction();
const sessionEvents = events.filter((event) => event.eventName === 'session_start');
assert.equal(sessionEvents.length, 2);
assert.equal(sessionEvents[1].eventData.session_reason, 'inactivity_timeout');
assert.notEqual(sessionEvents[0].eventData.session_id, sessionEvents[1].eventData.session_id);
console.log('PASS a new kiosk session starts after the inactivity timeout');

assert.equal(analytics.trackOnce('once-key', 'quiz_impression', { quiz_id: 'quiz-a' }), true);
assert.equal(analytics.trackOnce('once-key', 'quiz_impression', { quiz_id: 'quiz-a' }), false);
assert.equal(events.filter((event) => event.eventName === 'quiz_impression').length, 1);
console.log('PASS once-only analytics events are deduplicated');

assert.deepEqual(normalizeEventData({ empty: '', missing: null, count: 2, correct: true, ids: ['a', 'b'] }), {
    count: 2,
    correct: true,
    ids: 'a,b'
});
console.log('PASS analytics event data is normalized');

const storylineScope = createScope();
const storylineEvents = [];
const storylineAnalytics = createAnalytics(storylineScope, {
    provider: 'capture',
    enabled: true,
    context: { layout: 'single' }
});
storylineAnalytics.registerAdapter('capture', () => ({
    init() {},
    track(eventName, eventData) {
        storylineEvents.push({ eventName, eventData });
        return true;
    }
}));
storylineAnalytics.startStorylineView({
    storyline_id: 'unified-ai-history',
    storyline_layout: 'ui-browser',
    entry_source: 'default'
});
assert.equal(storylineEvents[0].eventName, 'storyline_view');
assert.equal(storylineEvents[0].eventData.storyline_id, 'unified-ai-history');
storylineAnalytics.markInteraction();
storylineScope.advance(2400);
storylineAnalytics.endStorylineView('switch');
const storylineLeave = storylineEvents.find((event) => event.eventName === 'storyline_leave');
assert.equal(storylineLeave.eventData.duration_seconds, 2);
assert.equal(storylineLeave.eventData.leave_reason, 'switch');
console.log('PASS storyline views record immediate entry and engaged duration');

const root = path.join(__dirname, '..');
for (const fileName of ['index.html', 'dual-screen.html']) {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    assert.match(
        html,
        /shared\/umami-config\.js[\s\S]*shared\/analytics-config\.js[\s\S]*shared\/analytics\.js/,
        `${fileName} should load provider config before the analytics plugin`
    );
    assert.match(html, /analytics\.markInteraction\(\)/, `${fileName} should mark trusted visitor interaction`);
    assert.match(html, /startAnalyticsMilestoneView/, `${fileName} should track milestone view lifecycle`);
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const eventName of [
    'quiz_impression',
    'quiz_answer',
    'mobile_quiz_start',
    'mobile_quiz_complete',
    'qr_landing',
    'storyline_picker_open',
    'storyline_switch'
]) {
    assert.match(indexHtml, new RegExp(`['"]${eventName}['"]`), `index.html should emit ${eventName}`);
}
assert.match(indexHtml, /startAnalyticsStorylineView\(\s*activeStorylineId/);
assert.match(indexHtml, /analyticsSource: 'picker'/);

const analyticsConfigSource = fs.readFileSync(path.join(root, 'shared', 'analytics-config.js'), 'utf8');
const umamiConfigSource = fs.readFileSync(path.join(root, 'shared', 'umami-config.js'), 'utf8');
assert.match(umamiConfigSource, /websiteId: ['"][^'"]*['"]/);
assert.match(umamiConfigSource, /https:\/\/museum\.bza\.edu\.cn\/umami\/script\.js/);
assert.match(umamiConfigSource, /hostUrl: 'https:\/\/museum\.bza\.edu\.cn\/umami'/);

const disabledConfigContext = vm.createContext({});
vm.runInContext(umamiConfigSource, disabledConfigContext);
vm.runInContext(analyticsConfigSource, disabledConfigContext);
assert.equal(disabledConfigContext.AI_HISTORY_ANALYTICS_CONFIG.provider, 'none');

const enabledConfigContext = vm.createContext({
    AI_HISTORY_UMAMI_CONFIG: {
        enabled: true,
        websiteId: 'website-id',
        scriptUrl: 'https://museum.bza.edu.cn/umami/script.js'
    }
});
vm.runInContext(analyticsConfigSource, enabledConfigContext);
assert.equal(enabledConfigContext.AI_HISTORY_ANALYTICS_CONFIG.provider, 'umami');
assert.equal(enabledConfigContext.AI_HISTORY_ANALYTICS_CONFIG.websiteId, 'website-id');
console.log('PASS Umami provider settings are isolated and enabled only with a Website ID');
console.log('PASS presentation entries expose the required analytics hooks');
