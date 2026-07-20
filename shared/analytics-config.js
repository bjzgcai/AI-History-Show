(function (globalScope) {
    'use strict';

    if (globalScope.AI_HISTORY_ANALYTICS_CONFIG) return;

    const umami = globalScope.AI_HISTORY_UMAMI_CONFIG || {};
    const umamiEnabled = Boolean(umami.enabled && umami.websiteId);

    globalScope.AI_HISTORY_ANALYTICS_CONFIG = umamiEnabled
        ? {
              provider: 'umami',
              ...umami,
              enabled: true
          }
        : {
              provider: 'none',
              enabled: false
          };
})(typeof window !== 'undefined' ? window : globalThis);
