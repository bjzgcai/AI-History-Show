(function (globalScope) {
    const SINGLE_MODE = 'single';
    const DUAL_MODE = 'dual';
    const LAYOUT_PARAM = 'layout';
    const SWITCH_TO_DUAL_MIN_WIDTH = 3600;
    const SWITCH_TO_DUAL_MIN_RATIO = 2.9;
    const KEEP_DUAL_MIN_WIDTH = 3000;
    const KEEP_DUAL_MIN_RATIO = 2.6;
    const HANDHELD_MAX_LONG_EDGE = 1600;
    const DUAL_ENTRY_FILE = 'dual-screen.html';

    function normalizeMode(value) {
        if (!value) return '';
        const normalized = String(value).trim().toLowerCase();
        if (normalized === SINGLE_MODE || normalized === DUAL_MODE) {
            return normalized;
        }
        return '';
    }

    function getCurrentModeFromRoot(root) {
        return root && root.dataset && root.dataset.layoutMode === DUAL_MODE
            ? DUAL_MODE
            : SINGLE_MODE;
    }

    function isHandheldViewport(options) {
        const config = options || {};
        const width = Number(config.width) || 0;
        const height = Math.max(Number(config.height) || 0, 0);
        const longEdge = Math.max(width, height);
        const hasCoarsePointer = Boolean(config.hasCoarsePointer);

        return hasCoarsePointer && longEdge > 0 && longEdge <= HANDHELD_MAX_LONG_EDGE;
    }

    function decideLayout(options) {
        const config = options || {};
        const currentMode = normalizeMode(config.currentMode) || SINGLE_MODE;
        const overrideMode = normalizeMode(config.overrideMode);
        const width = Number(config.width) || 0;
        const height = Math.max(Number(config.height) || 1, 1);
        const ratio = width / height;

        if (overrideMode) return overrideMode;
        if (isHandheldViewport(config)) return SINGLE_MODE;

        if (currentMode === DUAL_MODE) {
            return width >= KEEP_DUAL_MIN_WIDTH && ratio >= KEEP_DUAL_MIN_RATIO
                ? DUAL_MODE
                : SINGLE_MODE;
        }

        return width >= SWITCH_TO_DUAL_MIN_WIDTH && ratio >= SWITCH_TO_DUAL_MIN_RATIO
            ? DUAL_MODE
            : SINGLE_MODE;
    }

    function buildTargetUrl(currentHref, targetMode) {
        const currentUrl = new URL(currentHref);
        const pathname = currentUrl.pathname;
        const lastSlashIndex = pathname.lastIndexOf('/');
        const basePath = lastSlashIndex >= 0 ? pathname.slice(0, lastSlashIndex + 1) : '/';
        const normalizedTargetMode = normalizeMode(targetMode) === DUAL_MODE ? DUAL_MODE : SINGLE_MODE;
        const targetFile = normalizedTargetMode === DUAL_MODE ? 'dual-screen.html' : 'index.html';

        currentUrl.pathname = `${basePath}${targetFile}`;
        return currentUrl.toString();
    }

    function getPathFileName(value) {
        if (!value) return '';

        try {
            const parsedUrl = value.includes('://')
                ? new URL(value)
                : new URL(value, 'http://localhost');
            const pathname = parsedUrl.pathname || '';
            const segments = pathname.split('/').filter(Boolean);
            return segments.length ? segments[segments.length - 1] : '';
        } catch (error) {
            return '';
        }
    }

    function isStableDualEntry(options) {
        const config = options || {};
        const currentMode = normalizeMode(config.currentMode);
        if (currentMode !== DUAL_MODE) return false;
        return getPathFileName(config.pathname) === DUAL_ENTRY_FILE;
    }

    function syncBrowserLayout(browserWindow, root) {
        const currentMode = getCurrentModeFromRoot(root);
        const searchParams = new URLSearchParams(browserWindow.location.search);
        const overrideMode = searchParams.get(LAYOUT_PARAM);

        if (!overrideMode && isStableDualEntry({
            currentMode,
            pathname: browserWindow.location.pathname || browserWindow.location.href
        })) {
            return currentMode;
        }

        const targetMode = decideLayout({
            currentMode,
            overrideMode,
            width: browserWindow.innerWidth || (root && root.clientWidth) || 0,
            height: browserWindow.innerHeight || (root && root.clientHeight) || 1,
            hasCoarsePointer: typeof browserWindow.matchMedia === 'function'
                ? browserWindow.matchMedia('(pointer: coarse)').matches
                : false
        });

        if (targetMode === currentMode) return targetMode;

        browserWindow.location.replace(buildTargetUrl(browserWindow.location.href, targetMode));
        return targetMode;
    }

    const api = {
        SINGLE_MODE,
        DUAL_MODE,
        LAYOUT_PARAM,
        normalizeMode,
        isHandheldViewport,
        decideLayout,
        buildTargetUrl,
        getPathFileName,
        isStableDualEntry,
        syncBrowserLayout
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (globalScope) {
        globalScope.LayoutRouter = api;
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const root = document.documentElement;
        const searchParams = new URLSearchParams(window.location.search);
        const overrideMode = normalizeMode(searchParams.get(LAYOUT_PARAM));

        syncBrowserLayout(window, root);

        if (!overrideMode) {
            let resizeTimer = 0;
            window.addEventListener('resize', function () {
                window.clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(function () {
                    syncBrowserLayout(window, root);
                }, 180);
            }, { passive: true });
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
