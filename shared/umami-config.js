(function (globalScope) {
    'use strict';

    if (globalScope.AI_HISTORY_UMAMI_CONFIG) return;

    globalScope.AI_HISTORY_UMAMI_CONFIG = {
        enabled: true,
        websiteId: '6080b0e0-ea6d-459f-838d-8b4d446d0746',
        scriptUrl: 'https://museum.bza.edu.cn/umami/script.js',
        hostUrl: 'https://museum.bza.edu.cn/umami',
        autoTrack: true,
        domains: ['museum.bza.edu.cn']
    };
})(typeof window !== 'undefined' ? window : globalThis);
