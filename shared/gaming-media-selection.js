(function (globalScope) {
    const GAMEPLAY_ROLE_PATTERN =
        /^(?:game-(?:record|analysis|comparison)(?:-image|-animation)?|gameplay(?:-image)?)$/i;

    function isGameplayRole(role) {
        return GAMEPLAY_ROLE_PATTERN.test(String(role || '').trim());
    }

    function findGameplayMedia(images, getRole) {
        const candidates = Array.isArray(images) ? images : [];
        const resolveRole = typeof getRole === 'function' ? getRole : () => '';
        return candidates.find((url) => isGameplayRole(resolveRole(url))) || '';
    }

    function excludeSelectedMedia(images, selectedUrl) {
        const candidates = Array.isArray(images) ? images : [];
        return selectedUrl ? candidates.filter((url) => url !== selectedUrl) : candidates.slice();
    }

    const api = {
        isGameplayRole,
        findGameplayMedia,
        excludeSelectedMedia
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (globalScope) {
        globalScope.GamingMediaSelection = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
