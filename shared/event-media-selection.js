(function (globalScope) {
    const ARCHITECTURE_ROLE_PATTERN = /^(?:architecture-explainer|historical-diagram)$/i;
    const EXPLANATION_ROLE_PATTERN = /^algorithm-explainer$/i;
    const PORTRAIT_ROLE_PATTERN = /(?:portrait|person|people|team-photo|hero-image)/i;
    const NON_STRUCTURAL_MEDIA_ROLE_PATTERN = /(?:game-record|gameplay|replay|video)/i;
    const STRUCTURAL_PATH_PATTERN = /(?:^|\/)(?:architecture|explainers)(?:\/|$)|diagram|flow|pipeline/i;

    function isArchitectureRole(role) {
        return ARCHITECTURE_ROLE_PATTERN.test(String(role || '').trim());
    }

    function isExplanationRole(role) {
        return EXPLANATION_ROLE_PATTERN.test(String(role || '').trim());
    }

    function isCommentaryMediaCandidate(url, role) {
        const normalizedRole = String(role || '').trim();
        if (isArchitectureRole(normalizedRole) || isExplanationRole(normalizedRole)) return true;
        if (PORTRAIT_ROLE_PATTERN.test(normalizedRole) || NON_STRUCTURAL_MEDIA_ROLE_PATTERN.test(normalizedRole)) {
            return false;
        }
        return STRUCTURAL_PATH_PATTERN.test(String(url || '').trim());
    }

    function findCommentaryMedia(images, getRole) {
        const candidates = Array.isArray(images) ? images : [];
        const resolveRole = typeof getRole === 'function' ? getRole : () => '';
        return candidates.find((url) => isCommentaryMediaCandidate(url, resolveRole(url))) || '';
    }

    function excludeSelectedMedia(images, selectedUrl) {
        const candidates = Array.isArray(images) ? images : [];
        return selectedUrl ? candidates.filter((url) => url !== selectedUrl) : candidates.slice();
    }

    const api = {
        excludeSelectedMedia,
        findCommentaryMedia,
        isArchitectureRole,
        isCommentaryMediaCandidate,
        isExplanationRole
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (globalScope) {
        globalScope.EventMediaSelection = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
