#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const videoPlayer = require('../shared/video-player.js');

function createFakeVideo(source = 'https://media.example/demo.mp4') {
    const attributes = new Map();
    const listeners = new Map();
    return {
        dataset: { videoSrc: source },
        hidden: false,
        preload: 'none',
        readyState: 1,
        currentTime: 12,
        loadCount: 0,
        pauseCount: 0,
        playCount: 0,
        nextElementSibling: { hidden: true },
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        dispatch(type) {
            const listener = listeners.get(type);
            if (listener) listener();
        },
        getAttribute(name) {
            return attributes.get(name) || null;
        },
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        removeAttribute(name) {
            attributes.delete(name);
        },
        load() {
            this.loadCount += 1;
        },
        pause() {
            this.pauseCount += 1;
        },
        play() {
            this.playCount += 1;
            return Promise.resolve();
        }
    };
}

assert.equal(videoPlayer.isDirectVideoMedia('https://media.example/demo.mp4?version=1'), true);
assert.equal(videoPlayer.isDirectVideoMedia('https://media.example/embed/123'), false);
assert.match(videoPlayer.appendPlaybackRestartToken('demo.gif'), /^demo\.gif\?_restart=\d+$/);

(async () => {
    assert.equal(await videoPlayer.canLoad('demo.mp4', { hasFallback: false }), true);
    assert.equal(
        await videoPlayer.canLoad('demo.mp4', {
            hasFallback: true,
            fetchImpl: async (_url, options) => ({ ok: options.method === 'HEAD', status: 200 })
        }),
        true
    );
    const methods = [];
    assert.equal(
        await videoPlayer.canLoad('demo.mp4', {
            hasFallback: true,
            fetchImpl: async (_url, options) => {
                methods.push(options.method);
                return options.method === 'HEAD' ? { ok: false, status: 405 } : { ok: true, status: 206 };
            }
        }),
        true
    );
    assert.deepEqual(methods, ['HEAD', 'GET']);

    const video = createFakeVideo();
    assert.equal(video.getAttribute('src'), null, 'lazy video must start without a src');
    assert.equal(videoPlayer.activate(video, { autoplay: true, restart: true }), true);
    assert.equal(video.getAttribute('src'), 'https://media.example/demo.mp4');
    assert.equal(video.preload, 'metadata');
    assert.equal(video.currentTime, 0);
    assert.equal(video.playCount, 1);

    video.dispatch('error');
    assert.equal(video.hidden, true);
    assert.equal(video.nextElementSibling.hidden, false);

    videoPlayer.unload(video);
    assert.equal(video.getAttribute('src'), null);
    assert.equal(video.preload, 'none');
    assert.equal(video.pauseCount, 1);

    const lazyVideo = createFakeVideo('https://media.example/lazy.webm');
    let observerCallback;
    const observed = [];
    class FakeIntersectionObserver {
        constructor(callback) {
            observerCallback = callback;
        }
        observe(target) {
            observed.push(target);
        }
        unobserve() {}
        disconnect() {}
    }
    const root = {
        querySelectorAll(selector) {
            return selector === 'video[data-video-src]' ? [lazyVideo] : [];
        }
    };
    const hydration = videoPlayer.hydrate(root, { IntersectionObserver: FakeIntersectionObserver });
    assert.equal(hydration.count, 1);
    assert.deepEqual(observed, [lazyVideo]);
    assert.equal(lazyVideo.getAttribute('src'), null, 'observing a video must not load it immediately');
    observerCallback([{ target: lazyVideo, isIntersecting: true }]);
    assert.equal(lazyVideo.getAttribute('src'), 'https://media.example/lazy.webm');

    console.log('Video player lazy-loading checks passed.');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
