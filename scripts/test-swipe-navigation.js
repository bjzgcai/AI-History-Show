const assert = require('node:assert/strict');
const path = require('node:path');

const swipe = require(path.join(__dirname, '..', 'shared', 'swipe-navigation.js'));

const directionCases = [
    { name: 'left swipe goes next', dx: -120, dy: 20, expected: 'next' },
    { name: 'right swipe goes prev', dx: 120, dy: 10, expected: 'prev' },
    { name: 'short swipe is ignored', dx: 89, dy: 0, expected: '' },
    { name: 'diagonal swipe under ratio is ignored', dx: 100, dy: 80, expected: '' },
    { name: 'vertical drag is ignored', dx: 24, dy: 120, expected: '' }
];

for (const testCase of directionCases) {
    const actual = swipe.getSwipeDirection(testCase.dx, testCase.dy);
    assert.equal(actual, testCase.expected, testCase.name);
    console.log(`PASS ${testCase.name}: ${actual || 'ignored'}`);
}

assert.equal(swipe.shouldCancelSwipe(20, 90), true, 'vertical-heavy gesture should cancel');
console.log('PASS vertical-heavy gesture cancels');

assert.equal(swipe.shouldCancelSwipe(100, 40), false, 'horizontal gesture should not cancel');
console.log('PASS horizontal gesture stays active');

const ignoredTarget = {
    nodeType: 1,
    closest(selector) {
        return selector.includes('.video-frame') ? {} : null;
    }
};
assert.equal(
    swipe.shouldIgnoreSwipeTarget(ignoredTarget, '.video-frame, button'),
    true,
    'video frame target should be ignored'
);
console.log('PASS ignored target detection');

const activeTarget = {
    nodeType: 1,
    closest() {
        return null;
    }
};
assert.equal(
    swipe.shouldIgnoreSwipeTarget(activeTarget, '.video-frame, button'),
    false,
    'plain content target should stay active'
);
console.log('PASS active target detection');

assert.equal(swipe.isTouchLikePointer('touch'), true, 'touch pointer should be accepted');
assert.equal(swipe.isTouchLikePointer('pen'), true, 'pen pointer should be accepted');
assert.equal(swipe.isTouchLikePointer('mouse'), false, 'mouse pointer should be ignored');
console.log('PASS pointer type filtering');

assert.equal(
    swipe.isTouchEmulationContext({ navigator: { maxTouchPoints: 5 } }),
    true,
    'touch-capable context should be detected'
);
assert.equal(
    swipe.isTouchEmulationContext({
        navigator: { maxTouchPoints: 0 },
        matchMedia(query) {
            return { matches: query === '(pointer: coarse)' };
        }
    }),
    true,
    'coarse pointer context should be detected'
);
assert.equal(
    swipe.isTouchEmulationContext({
        navigator: { maxTouchPoints: 0 },
        matchMedia(query) {
            return { matches: query === '(hover: none)' };
        }
    }),
    true,
    'no-hover context should be detected'
);
assert.equal(
    swipe.isTouchEmulationContext({ navigator: { maxTouchPoints: 0 } }),
    false,
    'plain desktop context should be ignored'
);
console.log('PASS touch emulation context detection');

assert.equal(
    swipe.isSwipePointerType('touch', { navigator: { maxTouchPoints: 0 } }),
    true,
    'touch pointer should enable swipe input'
);
assert.equal(
    swipe.isSwipePointerType('mouse', { navigator: { maxTouchPoints: 5 } }),
    true,
    'emulated mouse should enable swipe input'
);
assert.equal(
    swipe.isSwipePointerType('mouse', { navigator: { maxTouchPoints: 0 } }),
    false,
    'plain mouse should stay disabled'
);
console.log('PASS swipe pointer eligibility');

function createTarget() {
    const listeners = new Map();
    return {
        addEventListener(type, handler) {
            if (!listeners.has(type)) {
                listeners.set(type, new Set());
            }
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            if (!listeners.has(type)) return;
            listeners.get(type).delete(handler);
        },
        dispatch(type, event) {
            const handlers = listeners.get(type);
            if (!handlers) return;
            for (const handler of handlers) {
                handler(event);
            }
        },
        setPointerCapture() {},
        releasePointerCapture() {}
    };
}

function createMouseEvent(target, overrides = {}) {
    let defaultPrevented = false;
    return {
        button: 0,
        buttons: 1,
        cancelable: true,
        clientX: 0,
        clientY: 0,
        isTrusted: true,
        target,
        preventDefault() {
            defaultPrevented = true;
        },
        get defaultPrevented() {
            return defaultPrevented;
        },
        ...overrides
    };
}

{
    const surface = createTarget();
    const trackingTarget = createTarget();
    const directions = [];
    const controller = swipe.setupSwipeNavigation({
        surface,
        trackingTarget,
        onNavigate(direction) {
            directions.push(direction);
        }
    });

    const startEvent = createMouseEvent(activeTarget, {
        clientX: 220,
        clientY: 100,
        sourceCapabilities: { firesTouchEvents: true }
    });
    surface.dispatch('mousedown', startEvent);

    trackingTarget.dispatch(
        'mousemove',
        createMouseEvent(activeTarget, {
            clientX: 70,
            clientY: 118,
            sourceCapabilities: { firesTouchEvents: true }
        })
    );
    trackingTarget.dispatch(
        'mouseup',
        createMouseEvent(activeTarget, {
            clientX: 70,
            clientY: 118,
            sourceCapabilities: { firesTouchEvents: true }
        })
    );

    assert.deepEqual(directions, ['next'], 'emulated touch mouse drag should navigate');
    assert.equal(startEvent.defaultPrevented, true, 'emulated mouse down should suppress native drag behavior');
    controller.destroy();
    console.log('PASS emulated touch mouse drag navigation');
}

{
    const surface = createTarget();
    const trackingTarget = createTarget();
    const directions = [];
    const controller = swipe.setupSwipeNavigation({
        surface,
        trackingTarget,
        onNavigate(direction) {
            directions.push(direction);
        }
    });

    surface.dispatch(
        'mousedown',
        createMouseEvent(activeTarget, {
            clientX: 220,
            clientY: 100
        })
    );
    trackingTarget.dispatch(
        'mousemove',
        createMouseEvent(activeTarget, {
            clientX: 70,
            clientY: 118
        })
    );
    trackingTarget.dispatch(
        'mouseup',
        createMouseEvent(activeTarget, {
            clientX: 70,
            clientY: 118
        })
    );

    assert.deepEqual(directions, [], 'plain desktop mouse drag should stay disabled');
    controller.destroy();
    console.log('PASS plain desktop mouse drag stays disabled');
}

console.log('All swipe-navigation checks passed.');
