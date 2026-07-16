(function (globalScope) {
    const DEEP_STORYLINE_ID = 'deep-learning-history';
    const STORYLINE_ID_ALIASES = {
        'deep-learning': DEEP_STORYLINE_ID
    };

    function normalizeStorylineId(value) {
        const storylineId = String(value || '').trim();
        return STORYLINE_ID_ALIASES[storylineId] || storylineId;
    }

    function getMilestoneStorylineId(milestone, fallbackStorylineId) {
        const fallback = normalizeStorylineId(fallbackStorylineId) || DEEP_STORYLINE_ID;
        const storyline = milestone && milestone.storyline;

        if (typeof storyline === 'string') {
            return normalizeStorylineId(storyline) || fallback;
        }
        if (storyline && typeof storyline === 'object' && storyline.id) {
            return normalizeStorylineId(storyline.id);
        }
        return fallback;
    }

    const api = {
        DEEP_STORYLINE_ID,
        normalizeStorylineId,
        getMilestoneStorylineId
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (globalScope) {
        globalScope.StorylineRouting = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
