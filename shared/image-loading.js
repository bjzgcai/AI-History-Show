(function (globalScope) {
    const IMAGE_ROOT = 'resources/images/';
    const THUMB_ROOT = 'resources/images/_thumbs/';
    const RASTER_EXTENSION_PATTERN = /\.(?:jpe?g|png|webp)$/i;
    const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|blob:)/i;
    const previewCache = new Map();
    const fullImageCache = new Map();

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
        return {
            raw,
            path,
            suffix,
            relativePath: path.slice(IMAGE_ROOT.length)
        };
    }

    function getPreviewUrl(url) {
        const parsed = splitUrl(url);
        if (!parsed) return String(url || '').trim();
        return `${THUMB_ROOT}${parsed.relativePath}.webp${parsed.suffix}`;
    }

    function hasPreview(url) {
        const raw = String(url || '').trim();
        return Boolean(raw) && getPreviewUrl(raw) !== raw;
    }

    function getStateElement(image, options = {}) {
        return options.stateElement || image.closest('.image-load-frame') || image.parentElement || null;
    }

    function setFrameState(frame, state) {
        if (!frame) return;
        if (state) frame.dataset.imageLoadState = state;
        else delete frame.dataset.imageLoadState;
        if (state === 'loading') frame.setAttribute('aria-busy', 'true');
        else frame.removeAttribute('aria-busy');
    }

    function createImage() {
        return typeof globalScope.Image === 'function' ? new globalScope.Image() : null;
    }

    function attachPreviewFallback(image, options = {}) {
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
            setFrameState(getStateElement(image, options), 'error');
        });
    }

    function setPreviewImage(image, fullSrc, alt, options = {}) {
        if (!image) return;
        const safeFullSrc = String(fullSrc || '').trim();
        const previewSrc = getPreviewUrl(safeFullSrc);
        if (alt != null) image.alt = alt;
        image.decoding = 'async';
        image.loading = options.loading || image.loading || 'lazy';

        if (safeFullSrc && previewSrc !== safeFullSrc) {
            image.dataset.fullSrc = safeFullSrc;
            image.dataset.previewSrc = previewSrc;
            attachPreviewFallback(image, options);
        } else {
            delete image.dataset.fullSrc;
            delete image.dataset.previewSrc;
        }

        if (image.getAttribute('src') !== previewSrc) image.src = previewSrc;
        setFrameState(getStateElement(image, options), '');
    }

    function preloadPreviewImage(url) {
        const previewSrc = getPreviewUrl(url);
        if (!previewSrc || previewCache.has(previewSrc)) return null;
        const image = createImage();
        if (!image) return null;
        image.decoding = 'async';
        image.loading = 'eager';
        image.src = previewSrc;
        previewCache.set(previewSrc, image);
        return image;
    }

    function loadFullImage(url) {
        const fullSrc = String(url || '').trim();
        if (!fullSrc) return Promise.reject(new Error('Missing image URL'));
        const cached = fullImageCache.get(fullSrc);
        if (cached && cached.state === 'loaded') return Promise.resolve(fullSrc);
        if (cached && cached.state === 'loading') return cached.promise;

        const image = createImage();
        if (!image) return Promise.reject(new Error('Image loading is not available'));
        image.decoding = 'async';
        image.loading = 'eager';
        const promise = new Promise((resolve, reject) => {
            image.onload = () => {
                fullImageCache.set(fullSrc, { state: 'loaded', promise: Promise.resolve(fullSrc) });
                resolve(fullSrc);
            };
            image.onerror = () => {
                fullImageCache.set(fullSrc, { state: 'error', promise: Promise.reject(new Error(`Failed to load ${fullSrc}`)) });
                fullImageCache.get(fullSrc).promise.catch(() => {});
                reject(new Error(`Failed to load ${fullSrc}`));
            };
        });
        fullImageCache.set(fullSrc, { state: 'loading', promise });
        image.src = fullSrc;
        return promise;
    }

    function getFullImageState(url) {
        const cached = fullImageCache.get(String(url || '').trim());
        return cached ? cached.state : 'idle';
    }

    function loadFullImageInto(image, options = {}) {
        if (!image) return Promise.resolve('');
        const fullSrc = String(options.fullSrc || image.dataset.fullSrc || image.getAttribute('src') || '').trim();
        if (!fullSrc) return Promise.resolve('');
        const frame = getStateElement(image, options);

        if (getFullImageState(fullSrc) === 'loaded') {
            image.src = fullSrc;
            setFrameState(frame, 'loaded');
            return Promise.resolve(fullSrc);
        }

        setFrameState(frame, 'loading');
        return loadFullImage(fullSrc)
            .then((loadedSrc) => {
                if (image.dataset.fullSrc && image.dataset.fullSrc !== loadedSrc) return loadedSrc;
                image.src = loadedSrc;
                setFrameState(frame, 'loaded');
                return loadedSrc;
            })
            .catch((error) => {
                setFrameState(frame, 'error');
                throw error;
            });
    }

    globalScope.AIHistoryImageLoading = {
        attachPreviewFallback,
        getFullImageState,
        getPreviewUrl,
        hasPreview,
        loadFullImage,
        loadFullImageInto,
        preloadPreviewImage,
        setFrameState,
        setPreviewImage
    };
})(typeof window !== 'undefined' ? window : globalThis);
