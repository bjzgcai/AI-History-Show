(function (globalScope) {
    'use strict';

    const DEFAULT_CONFIG = {
        provider: 'none',
        enabled: false,
        scriptUrl: '',
        websiteId: '',
        autoTrack: true,
        domains: [],
        minMilestoneViewMs: 1000,
        engagementTimeoutMs: 60 * 1000,
        sessionTimeoutMs: 30 * 60 * 1000,
        maxQueueSize: 100,
        context: {}
    };

    function createSessionId(scope) {
        try {
            if (scope.crypto && typeof scope.crypto.randomUUID === 'function') {
                return scope.crypto.randomUUID();
            }
        } catch (_) {}
        return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizeConfig(value) {
        const input = value && typeof value === 'object' ? value : {};
        const provider =
            String(input.provider || DEFAULT_CONFIG.provider)
                .trim()
                .toLowerCase() || 'none';
        return {
            ...DEFAULT_CONFIG,
            ...input,
            provider,
            enabled: input.enabled === undefined ? provider !== 'none' : Boolean(input.enabled),
            domains: Array.isArray(input.domains) ? input.domains.filter(Boolean).map(String) : [],
            context: input.context && typeof input.context === 'object' ? { ...input.context } : {}
        };
    }

    function normalizeEventData(value) {
        if (!value || typeof value !== 'object') return {};
        const normalized = {};
        Object.entries(value).forEach(([key, item]) => {
            if (item === undefined || item === null || item === '') return;
            if (typeof item === 'string') {
                normalized[key] = item.slice(0, 500);
                return;
            }
            if (typeof item === 'number' && Number.isFinite(item)) {
                normalized[key] = item;
                return;
            }
            if (typeof item === 'boolean') {
                normalized[key] = item;
                return;
            }
            if (Array.isArray(item)) {
                normalized[key] = item.map(String).join(',').slice(0, 500);
                return;
            }
            try {
                normalized[key] = JSON.stringify(item).slice(0, 500);
            } catch (_) {}
        });
        return normalized;
    }

    function createNoopAdapter() {
        return {
            init() {},
            track() {
                return false;
            }
        };
    }

    function createUmamiAdapter(scope, config, onReady) {
        let readinessAttempts = 0;

        function isReady() {
            return Boolean(scope.umami && typeof scope.umami.track === 'function');
        }

        function notifyWhenReady() {
            if (isReady()) {
                onReady();
                return;
            }
            readinessAttempts += 1;
            if (readinessAttempts < 40 && typeof scope.setTimeout === 'function') {
                scope.setTimeout(notifyWhenReady, 250);
            }
        }

        function loadScript() {
            if (!scope.document || !config.scriptUrl || !config.websiteId) {
                notifyWhenReady();
                return;
            }

            const existing = scope.document.querySelector('script[data-ai-history-analytics="umami"]');
            if (existing) {
                notifyWhenReady();
                return;
            }

            const script = scope.document.createElement('script');
            script.defer = true;
            script.src = config.scriptUrl;
            script.dataset.aiHistoryAnalytics = 'umami';
            script.dataset.websiteId = config.websiteId;
            if (config.autoTrack === false) script.dataset.autoTrack = 'false';
            if (config.domains.length) script.dataset.domains = config.domains.join(',');
            if (config.hostUrl) script.dataset.hostUrl = String(config.hostUrl);
            script.addEventListener('load', notifyWhenReady, { once: true });
            script.addEventListener('error', () => {}, { once: true });
            (scope.document.head || scope.document.documentElement).appendChild(script);
        }

        return {
            init: loadScript,
            track(eventName, eventData) {
                if (!isReady()) return false;
                try {
                    scope.umami.track(eventName, eventData);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        };
    }

    function createAnalytics(scope, initialConfig) {
        let config = normalizeConfig(initialConfig);
        let adapter = createNoopAdapter();
        let currentView = null;
        let currentStorylineView = null;
        let hasInteraction = false;
        let sessionStarted = false;
        let lifecycleBound = false;
        let destroyed = false;
        let sessionId = createSessionId(scope);
        let lastInteractionAt = null;
        let engagementTimerId = null;
        const queue = [];
        const onceKeys = new Set();
        const adapterFactories = new Map([
            ['none', () => createNoopAdapter()],
            ['umami', (nextConfig, onReady) => createUmamiAdapter(scope, nextConfig, onReady)]
        ]);

        function isEnabled() {
            return !destroyed && config.enabled && config.provider !== 'none';
        }

        function now() {
            return scope.performance && typeof scope.performance.now === 'function'
                ? scope.performance.now()
                : Date.now();
        }

        function isDocumentVisible() {
            return !scope.document || scope.document.visibilityState !== 'hidden';
        }

        function isActivelyEngaged() {
            return lastInteractionAt !== null && now() - lastInteractionAt < config.engagementTimeoutMs;
        }

        function commonData() {
            return normalizeEventData({
                ...config.context,
                session_id: sessionId,
                locale:
                    scope.document && scope.document.documentElement ? scope.document.documentElement.lang || '' : ''
            });
        }

        function enqueue(eventName, eventData) {
            queue.push({ eventName, eventData });
            if (queue.length > config.maxQueueSize) queue.shift();
        }

        function send(eventName, eventData, allowQueue = true) {
            if (!isEnabled()) return false;
            const data = normalizeEventData({ ...commonData(), ...eventData });
            if (adapter.track(eventName, data)) return true;
            if (allowQueue) enqueue(eventName, data);
            return allowQueue;
        }

        function flush() {
            if (!isEnabled() || !queue.length) return;
            const pending = queue.splice(0, queue.length);
            pending.forEach(({ eventName, eventData }) => {
                if (!adapter.track(eventName, eventData)) enqueue(eventName, eventData);
            });
        }

        function clearViewTimer(view) {
            if (!view || !view.timerId || typeof scope.clearTimeout !== 'function') return;
            scope.clearTimeout(view.timerId);
            view.timerId = null;
        }

        function clearEngagementTimer() {
            if (!engagementTimerId || typeof scope.clearTimeout !== 'function') return;
            scope.clearTimeout(engagementTimerId);
            engagementTimerId = null;
        }

        function scheduleEngagementPause() {
            clearEngagementTimer();
            if (typeof scope.setTimeout !== 'function') return;
            engagementTimerId = scope.setTimeout(() => {
                engagementTimerId = null;
                pauseMilestoneView();
                pauseStorylineView();
            }, config.engagementTimeoutMs);
        }

        function getViewDuration(view) {
            if (!view) return 0;
            const activeDuration = view.segmentStartedAt === null ? 0 : Math.max(0, now() - view.segmentStartedAt);
            return Math.max(0, view.accumulatedMs + activeDuration);
        }

        function emitMilestoneImpression(view) {
            if (!view || view.impressionTracked || getViewDuration(view) < config.minMilestoneViewMs) return false;
            view.impressionTracked = true;
            send('milestone_view', view.metadata);
            return true;
        }

        function scheduleMilestoneImpression(view) {
            clearViewTimer(view);
            if (!view || view.impressionTracked || view.segmentStartedAt === null) return;
            const remaining = Math.max(0, config.minMilestoneViewMs - getViewDuration(view));
            if (remaining === 0) {
                emitMilestoneImpression(view);
                return;
            }
            if (typeof scope.setTimeout === 'function') {
                view.timerId = scope.setTimeout(() => {
                    view.timerId = null;
                    emitMilestoneImpression(view);
                }, remaining);
            }
        }

        function pauseMilestoneView() {
            if (!currentView || currentView.segmentStartedAt === null) return;
            currentView.accumulatedMs = getViewDuration(currentView);
            currentView.segmentStartedAt = null;
            clearViewTimer(currentView);
            emitMilestoneImpression(currentView);
        }

        function resumeMilestoneView() {
            if (
                !currentView ||
                currentView.segmentStartedAt !== null ||
                !hasInteraction ||
                !isActivelyEngaged() ||
                !isDocumentVisible()
            )
                return;
            currentView.segmentStartedAt = now();
            scheduleMilestoneImpression(currentView);
        }

        function endMilestoneView(reason = 'change') {
            if (!currentView) return;
            pauseMilestoneView();
            emitMilestoneImpression(currentView);
            if (currentView.impressionTracked) {
                send('milestone_leave', {
                    ...currentView.metadata,
                    duration_seconds: Math.max(1, Math.round(getViewDuration(currentView) / 1000)),
                    leave_reason: reason
                });
            }
            clearViewTimer(currentView);
            currentView = null;
        }

        function startMilestoneView(metadata, options = {}) {
            if (!isEnabled()) return;
            const normalizedMetadata = normalizeEventData(metadata);
            const viewKey = [
                normalizedMetadata.milestone_id || normalizedMetadata.archive_event_id || '',
                normalizedMetadata.storyline_id || '',
                normalizedMetadata.layout || config.context.layout || ''
            ].join(':');
            if (currentView && currentView.key === viewKey) return;

            endMilestoneView(options.changeReason || 'change');
            currentView = {
                key: viewKey,
                metadata: normalizedMetadata,
                accumulatedMs: 0,
                segmentStartedAt: null,
                impressionTracked: false,
                timerId: null
            };

            if (options.eligible === false) return;
            resumeMilestoneView();
        }

        function pauseStorylineView() {
            if (!currentStorylineView || currentStorylineView.segmentStartedAt === null) return;
            currentStorylineView.accumulatedMs = getViewDuration(currentStorylineView);
            currentStorylineView.segmentStartedAt = null;
        }

        function resumeStorylineView() {
            if (
                !currentStorylineView ||
                currentStorylineView.segmentStartedAt !== null ||
                !hasInteraction ||
                !isActivelyEngaged() ||
                !isDocumentVisible()
            )
                return;
            currentStorylineView.segmentStartedAt = now();
        }

        function endStorylineView(reason = 'change') {
            if (!currentStorylineView) return;
            pauseStorylineView();
            send('storyline_leave', {
                ...currentStorylineView.metadata,
                duration_seconds: Math.max(0, Math.round(getViewDuration(currentStorylineView) / 1000)),
                leave_reason: reason
            });
            currentStorylineView = null;
        }

        function startStorylineView(metadata, options = {}) {
            if (!isEnabled()) return;
            const normalizedMetadata = normalizeEventData(metadata);
            const viewKey = [
                normalizedMetadata.storyline_id || '',
                normalizedMetadata.storyline_layout || '',
                normalizedMetadata.layout || config.context.layout || ''
            ].join(':');
            if (currentStorylineView && currentStorylineView.key === viewKey) return;

            endStorylineView(options.changeReason || 'change');
            currentStorylineView = {
                key: viewKey,
                metadata: normalizedMetadata,
                accumulatedMs: 0,
                segmentStartedAt: null
            };
            send('storyline_view', normalizedMetadata);
            if (options.eligible === false) return;
            resumeStorylineView();
        }

        function markInteraction() {
            if (!isEnabled()) return;
            const interactionAt = now();
            const sessionExpired =
                lastInteractionAt === null || interactionAt - lastInteractionAt >= config.sessionTimeoutMs;
            if (!hasInteraction) {
                hasInteraction = true;
            }
            if (!sessionStarted || sessionExpired) {
                sessionStarted = true;
                sessionId = createSessionId(scope);
                send('session_start', {
                    entry_path: scope.location ? scope.location.pathname : '',
                    session_reason: lastInteractionAt === null ? 'first_interaction' : 'inactivity_timeout'
                });
            }
            lastInteractionAt = interactionAt;
            scheduleEngagementPause();
            resumeMilestoneView();
            resumeStorylineView();
        }

        function handleVisibilityChange() {
            if (isDocumentVisible()) {
                resumeMilestoneView();
                resumeStorylineView();
            } else {
                pauseMilestoneView();
                pauseStorylineView();
            }
        }

        function handlePageHide() {
            clearEngagementTimer();
            endMilestoneView('pagehide');
            endStorylineView('pagehide');
            flush();
        }

        function bindLifecycle() {
            if (lifecycleBound || !scope.document || !scope.addEventListener) return;
            lifecycleBound = true;
            scope.document.addEventListener('visibilitychange', handleVisibilityChange);
            scope.addEventListener('pagehide', handlePageHide);
        }

        function activateProvider() {
            if (!isEnabled()) {
                adapter = createNoopAdapter();
                return;
            }
            const factory = adapterFactories.get(config.provider);
            adapter = factory ? factory(config, flush) : createNoopAdapter();
            bindLifecycle();
            try {
                adapter.init();
            } catch (_) {}
            flush();
        }

        function configure(nextConfig) {
            const previousProvider = config.provider;
            config = normalizeConfig({ ...config, ...(nextConfig || {}) });
            if (previousProvider !== config.provider || nextConfig) activateProvider();
            return api;
        }

        function setContext(nextContext) {
            config.context = {
                ...config.context,
                ...(nextContext && typeof nextContext === 'object' ? nextContext : {})
            };
            return api;
        }

        function registerAdapter(name, factory) {
            const adapterName = String(name || '')
                .trim()
                .toLowerCase();
            if (!adapterName || typeof factory !== 'function') return api;
            adapterFactories.set(adapterName, factory);
            if (config.provider === adapterName) activateProvider();
            return api;
        }

        function track(eventName, eventData) {
            const name = String(eventName || '').trim();
            if (!name) return false;
            return send(name, eventData);
        }

        function trackOnce(key, eventName, eventData) {
            const normalizedKey = String(key || `${eventName}:${JSON.stringify(eventData || {})}`);
            if (onceKeys.has(normalizedKey)) return false;
            const accepted = track(eventName, eventData);
            if (accepted) onceKeys.add(normalizedKey);
            return accepted;
        }

        function destroy() {
            clearEngagementTimer();
            endMilestoneView('destroy');
            endStorylineView('destroy');
            destroyed = true;
            queue.length = 0;
        }

        const api = {
            configure,
            destroy,
            endMilestoneView,
            endStorylineView,
            flush,
            markInteraction,
            pauseMilestoneView,
            pauseStorylineView,
            registerAdapter,
            resumeMilestoneView,
            resumeStorylineView,
            setContext,
            startMilestoneView,
            startStorylineView,
            track,
            trackOnce
        };

        activateProvider();
        return api;
    }

    const exported = {
        createAnalytics,
        normalizeConfig,
        normalizeEventData
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }

    if (globalScope && globalScope.document) {
        globalScope.AIHistoryAnalytics = createAnalytics(
            globalScope,
            globalScope.AI_HISTORY_ANALYTICS_CONFIG || DEFAULT_CONFIG
        );
    }
})(typeof window !== 'undefined' ? window : globalThis);
