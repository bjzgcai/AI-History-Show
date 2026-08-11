(function (globalScope, factory) {
    const api = factory(globalScope);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (globalScope) globalScope.VideoPlayer = api;
})(typeof window !== 'undefined' ? window : globalThis, function (globalScope) {
    const fallbackBoundVideos = new WeakSet();
    const observedVideos = new WeakSet();

    function normalizeUrl(url) {
        return String(url || '').trim();
    }

    function isDirectVideoMedia(url) {
        return /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(normalizeUrl(url));
    }

    function appendPlaybackRestartToken(url) {
        const value = normalizeUrl(url);
        if (!value) return '';
        const separator = value.includes('?') ? '&' : '?';
        return `${value}${separator}_restart=${Date.now()}`;
    }

    async function canLoad(url, options = {}) {
        const value = normalizeUrl(url);
        if (!value) return false;
        if (!options.hasFallback) return true;

        const fetchImpl = options.fetchImpl || (globalScope && globalScope.fetch);
        if (typeof fetchImpl !== 'function') return false;

        try {
            const response = await fetchImpl(value, { method: 'HEAD', cache: 'no-store' });
            if (response.ok) return true;
            if (response.status !== 405) return false;
        } catch (_) {
            return false;
        }

        try {
            const response = await fetchImpl(value, {
                method: 'GET',
                headers: { Range: 'bytes=0-0' },
                cache: 'no-store'
            });
            return response.ok || response.status === 206;
        } catch (_) {
            return false;
        }
    }

    function getFallback(video) {
        const selector = video && video.dataset ? normalizeUrl(video.dataset.videoFallback) : '';
        if (selector && video.parentElement) return video.parentElement.querySelector(selector);
        return video ? video.nextElementSibling : null;
    }

    function revealFallback(video) {
        const fallback = getFallback(video);
        if (video) video.hidden = true;
        if (fallback) fallback.hidden = false;
    }

    function bindFallback(video) {
        if (!video || fallbackBoundVideos.has(video)) return;
        fallbackBoundVideos.add(video);
        video.addEventListener('error', () => revealFallback(video));
    }

    function activate(video, options = {}) {
        if (!video) return false;
        const source = normalizeUrl(
            options.url || (video.dataset && video.dataset.videoSrc) || video.getAttribute('src')
        );
        if (!source) return false;

        bindFallback(video);
        video.hidden = false;
        video.preload = options.preload || 'metadata';
        if (video.getAttribute('src') !== source) {
            video.setAttribute('src', source);
            if (typeof video.load === 'function') video.load();
        }

        const shouldPlay = options.autoplay === true || (video.dataset && video.dataset.videoAutoplay === 'true');
        const restart = options.restart === true;
        const startPlayback = () => {
            if (restart) {
                try {
                    video.currentTime = 0;
                } catch (_) {}
            }
            if (shouldPlay && typeof video.play === 'function') {
                const playback = video.play();
                if (playback && typeof playback.catch === 'function') playback.catch(() => {});
            }
        };

        if (restart && Number(video.readyState || 0) < 1) {
            video.addEventListener('loadedmetadata', startPlayback, { once: true });
        } else {
            startPlayback();
        }
        return true;
    }

    function unload(video) {
        if (!video) return;
        if (typeof video.pause === 'function') video.pause();
        video.removeAttribute('src');
        video.preload = 'none';
        if (typeof video.load === 'function') video.load();
    }

    function collectLazyVideos(root) {
        if (!root) return [];
        const videos = [];
        if (typeof root.matches === 'function' && root.matches('video[data-video-src]')) videos.push(root);
        if (typeof root.querySelectorAll === 'function') videos.push(...root.querySelectorAll('video[data-video-src]'));
        return videos;
    }

    function hydrate(root, options = {}) {
        const videos = collectLazyVideos(root).filter((video) => !observedVideos.has(video));
        if (videos.length === 0) return { count: 0, disconnect() {} };

        const Observer = options.IntersectionObserver || (globalScope && globalScope.IntersectionObserver);
        if (typeof Observer !== 'function') {
            videos.forEach((video) => {
                observedVideos.add(video);
                activate(video);
            });
            return { count: videos.length, disconnect() {} };
        }

        const observer = new Observer(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(entry.target);
                    activate(entry.target);
                });
            },
            { rootMargin: options.rootMargin || '240px 0px', threshold: 0.01 }
        );
        videos.forEach((video) => {
            observedVideos.add(video);
            observer.observe(video);
        });
        return { count: videos.length, disconnect: () => observer.disconnect() };
    }

    function resetContainer(container) {
        if (!container) return;
        container.querySelectorAll('video').forEach((video) => {
            unload(video);
            video.remove();
        });
        container.querySelectorAll('iframe').forEach((iframe) => {
            iframe.src = 'about:blank';
            iframe.remove();
        });
        container.classList.remove('is-playing');
    }

    function playInContainer(container, url, options = {}) {
        const value = normalizeUrl(url);
        if (!container || !value) return null;
        resetContainer(container);
        container.classList.add('is-playing');

        if (isDirectVideoMedia(value)) {
            const video = container.ownerDocument.createElement('video');
            video.controls = true;
            video.playsInline = true;
            video.dataset.videoSrc = value;
            container.appendChild(video);
            activate(video, { autoplay: options.autoplay !== false, restart: options.restart === true });
            return video;
        }

        const iframe = container.ownerDocument.createElement('iframe');
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.src = value;
        container.appendChild(iframe);
        return iframe;
    }

    return {
        activate,
        appendPlaybackRestartToken,
        canLoad,
        hydrate,
        isDirectVideoMedia,
        playInContainer,
        resetContainer,
        unload
    };
});
