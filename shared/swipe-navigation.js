(function (globalScope) {
    const SWIPE_MIN_X = 90;
    const SWIPE_HORIZONTAL_RATIO = 1.4;
    const SWIPE_CANCEL_Y = 80;
    const TOUCH_POINTER_SUPPRESSION_MS = 800;
    const EMULATED_MOUSE_POINTER_ID = 'mouse-emulation';
    const DEFAULT_IGNORE_SELECTOR = [
        '.photo-viewer',
        'button',
        'iframe',
        '.timeline-track',
        '.timeline-block',
        '.branch-timeline',
        '.branch-timeline-page',
        '.left-timeline',
        '.archive-stage',
        '.archive-bottomline',
        '.archive-strip',
        '.video-frame'
    ].join(', ');

    function isTouchLikePointer(pointerType) {
        return pointerType === 'touch' || pointerType === 'pen';
    }

    function isTouchEmulationContext(context) {
        const scope = context || globalScope || {};
        const nav = scope.navigator || {};
        const hasTouchPoints = Number(nav.maxTouchPoints) > 0;
        const supportsMatchMedia = typeof scope.matchMedia === 'function';
        const hasCoarsePointer =
            supportsMatchMedia &&
            (scope.matchMedia('(pointer: coarse)').matches || scope.matchMedia('(any-pointer: coarse)').matches);
        const hasNoHover =
            supportsMatchMedia &&
            (scope.matchMedia('(hover: none)').matches || scope.matchMedia('(any-hover: none)').matches);
        return hasTouchPoints || hasCoarsePointer || hasNoHover;
    }

    function isSwipePointerType(pointerType, context) {
        return isTouchLikePointer(pointerType) || (pointerType === 'mouse' && isTouchEmulationContext(context));
    }

    function getTargetElement(target) {
        if (!target) return null;
        if (target.nodeType === 1) return target;
        return target.parentElement || null;
    }

    function shouldIgnoreSwipeTarget(target, ignoreSelector = DEFAULT_IGNORE_SELECTOR) {
        const element = getTargetElement(target);
        if (!element || !ignoreSelector) return false;
        return Boolean(element.closest(ignoreSelector));
    }

    function shouldCancelSwipe(dx, dy) {
        return Math.abs(dy) > SWIPE_CANCEL_Y && Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO;
    }

    function getSwipeDirection(dx, dy) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx < SWIPE_MIN_X) return '';
        if (absDx < absDy * SWIPE_HORIZONTAL_RATIO) return '';

        return dx < 0 ? 'next' : 'prev';
    }

    function setupSwipeNavigation(options) {
        const config = options || {};
        const surface = config.surface;
        if (!surface || typeof config.onNavigate !== 'function') {
            return {
                destroy() {}
            };
        }

        const ignoreSelector = config.ignoreSelector || DEFAULT_IGNORE_SELECTOR;
        const trackingTarget =
            config.trackingTarget && typeof config.trackingTarget.addEventListener === 'function'
                ? config.trackingTarget
                : globalScope && typeof globalScope.addEventListener === 'function'
                  ? globalScope
                  : surface;
        let activeGesture = null;
        let lastTouchInputAt = 0;

        function noteTouchInput() {
            lastTouchInputAt = Date.now();
        }

        function isTrustedEvent(event) {
            return !event || event.isTrusted !== false;
        }

        function isEmulatedTouchMouseEvent(event) {
            if (!isTrustedEvent(event)) return false;
            if (!event) return false;
            if (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) {
                return true;
            }
            return isTouchEmulationContext(globalScope);
        }

        function beginGesture(state) {
            activeGesture = {
                ...state,
                cancelled: false
            };
        }

        function releaseActivePointer() {
            if (!activeGesture) return;
            if (typeof surface.releasePointerCapture === 'function') {
                try {
                    surface.releasePointerCapture(activeGesture.pointerId);
                } catch (error) {
                    // Ignore release failures for pointers that were never captured.
                }
            }
            activeGesture = null;
        }

        function getGestureDirection(currentX, currentY) {
            if (!activeGesture) return '';

            const dx = (Number.isFinite(currentX) ? currentX : activeGesture.lastX) - activeGesture.startX;
            const dy = (Number.isFinite(currentY) ? currentY : activeGesture.lastY) - activeGesture.startY;
            return activeGesture.cancelled ? '' : getSwipeDirection(dx, dy);
        }

        function updateGesture(currentX, currentY) {
            if (!activeGesture) return;

            activeGesture.lastX = currentX;
            activeGesture.lastY = currentY;

            const dx = currentX - activeGesture.startX;
            const dy = currentY - activeGesture.startY;

            if (!activeGesture.cancelled && shouldCancelSwipe(dx, dy)) {
                activeGesture.cancelled = true;
                releaseActivePointer();
            }
        }

        function finishGesture(currentX, currentY, originalEvent) {
            if (!activeGesture) return;

            const direction = getGestureDirection(currentX, currentY);
            releaseActivePointer();

            if (!direction) return;

            if (originalEvent && originalEvent.cancelable) {
                originalEvent.preventDefault();
            }

            config.onNavigate(direction, originalEvent);
        }

        function findTouchByIdentifier(touchList, identifier) {
            if (!touchList || identifier == null) return null;
            for (let index = 0; index < touchList.length; index += 1) {
                if (touchList[index].identifier === identifier) {
                    return touchList[index];
                }
            }
            return null;
        }

        function handlePointerDown(event) {
            if (!isTrustedEvent(event) || !isSwipePointerType(event.pointerType, globalScope)) return;
            if (shouldIgnoreSwipeTarget(event.target, ignoreSelector)) return;
            if (Date.now() - lastTouchInputAt < TOUCH_POINTER_SUPPRESSION_MS) return;
            if (activeGesture) return;

            beginGesture({
                source: 'pointer',
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                lastX: event.clientX,
                lastY: event.clientY
            });

            if (typeof surface.setPointerCapture === 'function') {
                try {
                    surface.setPointerCapture(event.pointerId);
                } catch (error) {
                    // Ignore capture failures and continue with local tracking.
                }
            }
        }

        function handlePointerMove(event) {
            if (!activeGesture || activeGesture.source !== 'pointer' || event.pointerId !== activeGesture.pointerId)
                return;
            if (!isSwipePointerType(event.pointerType, globalScope)) return;
            if (Date.now() - lastTouchInputAt < TOUCH_POINTER_SUPPRESSION_MS) return;

            updateGesture(event.clientX, event.clientY);
        }

        function handlePointerUp(event) {
            if (!activeGesture || activeGesture.source !== 'pointer' || event.pointerId !== activeGesture.pointerId)
                return;
            if (!isSwipePointerType(event.pointerType, globalScope)) return;
            if (Date.now() - lastTouchInputAt < TOUCH_POINTER_SUPPRESSION_MS) return;

            finishGesture(event.clientX, event.clientY, event);
        }

        function handlePointerCancel(event) {
            if (!activeGesture || activeGesture.source !== 'pointer' || event.pointerId !== activeGesture.pointerId)
                return;
            releaseActivePointer();
        }

        function handleTouchStart(event) {
            if (!isTrustedEvent(event)) return;
            if (shouldIgnoreSwipeTarget(event.target, ignoreSelector)) return;
            if (activeGesture) return;

            const primaryTouch = event.changedTouches && event.changedTouches[0];
            if (!primaryTouch) return;

            noteTouchInput();
            beginGesture({
                source: 'touch',
                identifier: primaryTouch.identifier,
                startX: primaryTouch.clientX,
                startY: primaryTouch.clientY,
                lastX: primaryTouch.clientX,
                lastY: primaryTouch.clientY
            });
        }

        function handleTouchMove(event) {
            if (!activeGesture || activeGesture.source !== 'touch') return;
            noteTouchInput();

            const activeTouch =
                findTouchByIdentifier(event.touches, activeGesture.identifier) ||
                findTouchByIdentifier(event.changedTouches, activeGesture.identifier);
            if (!activeTouch) return;

            updateGesture(activeTouch.clientX, activeTouch.clientY);
        }

        function handleTouchEnd(event) {
            if (!activeGesture || activeGesture.source !== 'touch') return;
            noteTouchInput();

            const endedTouch = findTouchByIdentifier(event.changedTouches, activeGesture.identifier);
            if (!endedTouch) return;

            finishGesture(endedTouch.clientX, endedTouch.clientY, event);
        }

        function handleTouchCancel() {
            if (!activeGesture || activeGesture.source !== 'touch') return;
            releaseActivePointer();
        }

        function handleMouseDown(event) {
            if (!isEmulatedTouchMouseEvent(event)) return;
            if (event.button !== 0) return;
            if (shouldIgnoreSwipeTarget(event.target, ignoreSelector)) return;
            if (activeGesture) return;

            if (event.cancelable) {
                event.preventDefault();
            }

            beginGesture({
                source: 'mouse',
                pointerId: EMULATED_MOUSE_POINTER_ID,
                startX: event.clientX,
                startY: event.clientY,
                lastX: event.clientX,
                lastY: event.clientY
            });
        }

        function handleMouseMove(event) {
            if (!activeGesture || activeGesture.source !== 'mouse') return;
            if (!isEmulatedTouchMouseEvent(event)) return;

            if (event.cancelable) {
                event.preventDefault();
            }

            updateGesture(event.clientX, event.clientY);
        }

        function handleMouseUp(event) {
            if (!activeGesture || activeGesture.source !== 'mouse') return;
            if (!isEmulatedTouchMouseEvent(event)) return;

            finishGesture(event.clientX, event.clientY, event);
        }

        function handleMouseCancel() {
            if (!activeGesture || activeGesture.source !== 'mouse') return;
            releaseActivePointer();
        }

        function handleDragStart(event) {
            if (!activeGesture || activeGesture.source !== 'mouse') return;
            if (!isEmulatedTouchMouseEvent(event)) return;
            if (event.cancelable) {
                event.preventDefault();
            }
        }

        surface.addEventListener('touchstart', handleTouchStart, { passive: true });
        surface.addEventListener('touchmove', handleTouchMove, { passive: true });
        surface.addEventListener('touchend', handleTouchEnd, { passive: false });
        surface.addEventListener('touchcancel', handleTouchCancel, { passive: true });
        surface.addEventListener('pointerdown', handlePointerDown);
        surface.addEventListener('pointermove', handlePointerMove);
        surface.addEventListener('pointerup', handlePointerUp);
        surface.addEventListener('pointercancel', handlePointerCancel);
        surface.addEventListener('mousedown', handleMouseDown);
        surface.addEventListener('dragstart', handleDragStart);
        trackingTarget.addEventListener('mousemove', handleMouseMove);
        trackingTarget.addEventListener('mouseup', handleMouseUp);
        trackingTarget.addEventListener('mouseleave', handleMouseCancel);
        trackingTarget.addEventListener('blur', handleMouseCancel);

        return {
            destroy() {
                releaseActivePointer();
                surface.removeEventListener('touchstart', handleTouchStart, { passive: true });
                surface.removeEventListener('touchmove', handleTouchMove, { passive: true });
                surface.removeEventListener('touchend', handleTouchEnd, { passive: false });
                surface.removeEventListener('touchcancel', handleTouchCancel, { passive: true });
                surface.removeEventListener('pointerdown', handlePointerDown);
                surface.removeEventListener('pointermove', handlePointerMove);
                surface.removeEventListener('pointerup', handlePointerUp);
                surface.removeEventListener('pointercancel', handlePointerCancel);
                surface.removeEventListener('mousedown', handleMouseDown);
                surface.removeEventListener('dragstart', handleDragStart);
                trackingTarget.removeEventListener('mousemove', handleMouseMove);
                trackingTarget.removeEventListener('mouseup', handleMouseUp);
                trackingTarget.removeEventListener('mouseleave', handleMouseCancel);
                trackingTarget.removeEventListener('blur', handleMouseCancel);
            }
        };
    }

    const api = {
        SWIPE_MIN_X,
        SWIPE_HORIZONTAL_RATIO,
        SWIPE_CANCEL_Y,
        DEFAULT_IGNORE_SELECTOR,
        TOUCH_POINTER_SUPPRESSION_MS,
        isTouchLikePointer,
        isTouchEmulationContext,
        isSwipePointerType,
        shouldIgnoreSwipeTarget,
        shouldCancelSwipe,
        getSwipeDirection,
        setupSwipeNavigation
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (globalScope) {
        globalScope.SwipeNavigation = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
