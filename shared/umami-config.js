(function (globalScope) {
    'use strict';

    if (globalScope.AI_HISTORY_UMAMI_CONFIG) return;

    globalScope.AI_HISTORY_UMAMI_CONFIG = {
        enabled: false,
        websiteId: '',
        scriptUrl: 'https://museum.bza.edu.cn/umami/script.js',
        hostUrl: 'https://museum.bza.edu.cn/umami',
        autoTrack: true,
        domains: ['museum.bza.edu.cn']
    };
})(typeof window !== 'undefined' ? window : globalThis);
