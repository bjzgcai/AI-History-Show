(function (globalScope) {
    const IMAGE_ROOT = 'resources/images/';
    const THUMB_ROOT = 'resources/images/_thumbs/';
    const RASTER_EXTENSION_PATTERN = /\.(?:jpe?g|png|webp)$/i;
    const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|blob:)/i;

    function splitUrl(value) {
        const raw = String(value || '').trim();
        if (!raw || ABSOLUTE_URL_PATTERN.test(raw)) return null;
        const queryIndex = raw.indexOf('?');
        const hashIndex = raw.indexOf('#');
        const cutPoints = [queryIndex, hashIndex].filter((index) => index >= 0);
        const suffixIndex = cutPoints.length ? Math.min(...cutPoints) : raw.length;
        const path = raw.slice(0, suffixIndex).replace(/\\/g, '/').replace(/^\.\//, '');
        const suffix = raw.slice(suffixIndex);
        if (!path.startsWith(IMAGE_ROOT) || path.startsWith(THUMB_ROOT)) return null;
        if (!RASTER_EXTENSION_PATTERN.test(path)) return null;
        return { suffix, relativePath: path.slice(IMAGE_ROOT.length) };
    }

    function getPreviewUrl(url) {
        const parsed = splitUrl(url);
        if (!parsed) return String(url || '').trim();
        return `${THUMB_ROOT}${parsed.relativePath}.webp${parsed.suffix}`;
    }

    function attachPreviewFallback(image) {
        if (!image || image.dataset.previewFallbackBound === 'true') return;
        image.dataset.previewFallbackBound = 'true';
        image.addEventListener('error', () => {
            const previewSrc = image.dataset.previewSrc || '';
            const fullSrc = image.dataset.fullSrc || '';
            const currentSrc = image.getAttribute('src') || '';
            if (previewSrc && fullSrc && currentSrc === previewSrc) {
                image.src = fullSrc;
                return;
            }
        });
    }

    globalScope.AIHistoryImageLoading = {
        attachPreviewFallback,
        getPreviewUrl
    };
})(typeof window !== 'undefined' ? window : globalThis);
