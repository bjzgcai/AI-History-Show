(function (globalScope) {
    'use strict';

    const DEFAULT_STORYLINE_STYLES = {
        'bench-council-ai100': { color: '#ff8833', order: 1 },
        'gaming-ai': { color: '#33b0ff', order: 2 },
        'humanistic-cycle': { color: '#44dd88', order: 3 },
        'deep-learning': { color: '#b088ff', order: 4 }
    };
    const PORTRAIT_HINT_PATTERN =
        /\bportrait\b|\/people\/|(?:^|[_/-])portrait(?:[._/-]|$)|人物(?:肖像|照片|图|资料)?|肖像/i;
    const PORTRAIT_EXCLUSION_PATTERN = /not a portrait|不是人物肖像/i;
    const NON_PHOTO_ROLE_PATTERN = /architecture|paper-page/i;
    const ALL_EVENTS_COLOR = '#e8e3da';
    const VIEWPORT_BREAKPOINTS = {
        compactWidth: 700,
        responsiveWidth: 1199,
        shortLandscapeWidth: 932,
        shortLandscapeHeight: 600,
        mediumLandscapeHeight: 700
    };
    const OVERVIEW_CHROME_HEIGHT = {
        default: 48 + 72,
        responsive: 45 + 60,
        shortLandscape: 45 + 44
    };
    const TIMELINE_LAYOUT_MODES = {
        default: {
            cardWidth: 264,
            cardHeight: 250,
            cardGap: 17,
            edgePadding: 58,
            minimumGroupWidth: 302,
            axisGap: 38,
            minimumHeight: 710,
            staggerPattern: [0, 44, 14, 60, 28, 8]
        },
        compact: {
            cardWidth: 228,
            cardHeight: 220,
            cardGap: 14,
            edgePadding: 34,
            minimumGroupWidth: 262,
            axisGap: 44,
            minimumHeight: 480,
            staggerPattern: [0, 22, 8, 30, 14]
        },
        mediumLandscape: {
            cardWidth: 212,
            cardHeight: 180,
            cardGap: 12,
            edgePadding: 28,
            minimumGroupWidth: 242,
            axisGap: 22,
            minimumHeight: 455,
            staggerPattern: [0, 10, 4, 18, 8]
        },
        shortLandscape: {
            cardWidth: 196,
            cardHeight: 170,
            cardGap: 12,
            edgePadding: 28,
            minimumGroupWidth: 226,
            axisGap: 24,
            minimumHeight: 432,
            staggerPattern: [0, 12, 5, 18, 8]
        }
    };
    const TIMELINE_LANE_COUNT = 1;
    const CARDS_PER_COLUMN = TIMELINE_LANE_COUNT * 2;
    const TIMELINE_VERTICAL_PADDING = 52;
    const DENSITY_CHART_WIDTH = 1000;
    const DENSITY_CHART_HEIGHT = 56;
    const DENSITY_BASELINE_PADDING = 5;
    const CHRONOLOGY_DRAG_THRESHOLD = 8;
    const CHRONOLOGY_DRAG_INTENT_RATIO = 1.2;
    const CHRONOLOGY_CLICK_SUPPRESS_MS = 320;

    function getSortYear(milestone) {
        const value = milestone && milestone.year != null ? milestone.year : milestone;
        const match = String(value || '').match(/\d{3,4}/);
        return match ? Number(match[0]) : Number.NaN;
    }

    function getStorylineId(milestone) {
        const storyline = milestone && milestone.storyline;
        if (typeof storyline === 'string') return storyline;
        return storyline && storyline.id ? String(storyline.id) : '';
    }

    function getCanonicalEventId(milestone) {
        return String((milestone && (milestone.canonicalEventId || milestone.archiveEventId || milestone.id)) || '');
    }

    function getMilestoneVariants(milestone) {
        const variants = milestone && milestone.storylineVariants;
        if (variants && typeof variants === 'object' && !Array.isArray(variants)) {
            return Object.values(variants).filter(Boolean);
        }
        return milestone ? [milestone] : [];
    }

    function getStorylineMemberships(milestone) {
        if (Array.isArray(milestone && milestone.storylineMemberships)) {
            return milestone.storylineMemberships.filter((membership) => membership && membership.id);
        }
        const seen = new Set();
        return getMilestoneVariants(milestone).flatMap((variant) => {
            const id = getStorylineId(variant);
            if (!id || seen.has(id)) return [];
            seen.add(id);
            const storyline = variant.storyline && typeof variant.storyline === 'object' ? variant.storyline : {};
            return [{ id, name: storyline.name || id }];
        });
    }

    function localizeFallback(value, locale = 'zh') {
        if (value == null) return '';
        if (typeof value !== 'object' || Array.isArray(value)) return String(value);
        return String(value[locale] ?? value.zh ?? value.en ?? '');
    }

    function compareMilestones(a, b, localize = localizeFallback) {
        const yearA = getSortYear(a);
        const yearB = getSortYear(b);
        const safeYearA = Number.isFinite(yearA) ? yearA : Number.MAX_SAFE_INTEGER;
        const safeYearB = Number.isFinite(yearB) ? yearB : Number.MAX_SAFE_INTEGER;
        const storylineA = DEFAULT_STORYLINE_STYLES[getStorylineId(a)] || { order: 99 };
        const storylineB = DEFAULT_STORYLINE_STYLES[getStorylineId(b)] || { order: 99 };
        return (
            safeYearA - safeYearB ||
            storylineA.order - storylineB.order ||
            Number((a && a.order) || 0) - Number((b && b.order) || 0) ||
            localize(a && a.title).localeCompare(localize(b && b.title))
        );
    }

    function buildCanonicalMilestones(milestones, options = {}) {
        const styles = options.storylineStyles || DEFAULT_STORYLINE_STYLES;
        const defaultPriority = Object.keys(styles).sort(
            (left, right) => Number(styles[left].order || 99) - Number(styles[right].order || 99)
        );
        const storylinePriority = Array.isArray(options.storylinePriority)
            ? options.storylinePriority
            : defaultPriority;
        const priorityById = new Map(storylinePriority.map((id, index) => [id, index]));
        const groups = new Map();

        for (const milestone of milestones || []) {
            const canonicalEventId = getCanonicalEventId(milestone);
            if (!canonicalEventId) continue;
            if (!groups.has(canonicalEventId)) groups.set(canonicalEventId, []);
            groups.get(canonicalEventId).push(milestone);
        }

        return Array.from(groups, ([canonicalEventId, variants]) => {
            const sortedVariants = [...variants].sort((left, right) => {
                const leftPriority = priorityById.get(getStorylineId(left)) ?? Number.MAX_SAFE_INTEGER;
                const rightPriority = priorityById.get(getStorylineId(right)) ?? Number.MAX_SAFE_INTEGER;
                return leftPriority - rightPriority || compareMilestones(left, right, options.localize);
            });
            const storylineVariants = {};
            const storylineMemberships = [];
            for (const variant of sortedVariants) {
                const storylineId = getStorylineId(variant);
                if (!storylineId || storylineVariants[storylineId]) continue;
                storylineVariants[storylineId] = variant;
                const storyline = variant.storyline && typeof variant.storyline === 'object' ? variant.storyline : {};
                storylineMemberships.push({ id: storylineId, name: storyline.name || storylineId });
            }
            return {
                ...sortedVariants[0],
                canonicalEventId,
                storylineMemberships,
                storylineVariants
            };
        }).sort((left, right) => compareMilestones(left, right, options.localize));
    }

    function selectMilestoneVariant(milestone, storylineId) {
        if (!storylineId || storylineId === 'all') return milestone;
        const variant = milestone && milestone.storylineVariants && milestone.storylineVariants[storylineId];
        if (!variant) return null;
        return {
            ...variant,
            canonicalEventId: getCanonicalEventId(milestone),
            storylineMemberships: getStorylineMemberships(milestone),
            storylineVariants: milestone.storylineVariants
        };
    }

    function selectMilestonesByStoryline(milestones, storylineId) {
        if (!storylineId || storylineId === 'all') return milestones || [];
        return (milestones || []).map((milestone) => selectMilestoneVariant(milestone, storylineId)).filter(Boolean);
    }

    function summarizeStorylines(milestones, localize = localizeFallback, styles = DEFAULT_STORYLINE_STYLES) {
        const summaries = new Map();
        for (const canonicalMilestone of milestones || []) {
            for (const milestone of getMilestoneVariants(canonicalMilestone)) {
                const id = getStorylineId(milestone);
                if (!id) continue;
                const year = getSortYear(milestone);
                const storyline =
                    milestone.storyline && typeof milestone.storyline === 'object' ? milestone.storyline : {};
                const summary = summaries.get(id) || {
                    id,
                    name: localize(storyline.name) || id,
                    count: 0,
                    minYear: Number.POSITIVE_INFINITY,
                    maxYear: Number.NEGATIVE_INFINITY,
                    color: (styles[id] && styles[id].color) || '#f68900',
                    order: (styles[id] && styles[id].order) || 99
                };
                summary.count += 1;
                if (Number.isFinite(year)) {
                    summary.minYear = Math.min(summary.minYear, year);
                    summary.maxYear = Math.max(summary.maxYear, year);
                }
                summaries.set(id, summary);
            }
        }
        return Array.from(summaries.values())
            .map((summary) => ({
                ...summary,
                minYear: Number.isFinite(summary.minYear) ? summary.minYear : '',
                maxYear: Number.isFinite(summary.maxYear) ? summary.maxYear : ''
            }))
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }

    function buildTimelineLayout(milestones, options = {}) {
        const requestedMode = String(options.mode || '');
        const mode = TIMELINE_LAYOUT_MODES[requestedMode] ? requestedMode : options.compact ? 'compact' : 'default';
        const {
            cardWidth,
            cardHeight,
            cardGap,
            edgePadding,
            minimumGroupWidth,
            axisGap,
            minimumHeight,
            staggerPattern
        } = TIMELINE_LAYOUT_MODES[mode];
        const maxStagger = Math.max(...staggerPattern);
        const availableHeight = Math.max(0, Number(options.viewportHeight) || 0);
        const sorted = [...(milestones || [])].sort((a, b) => compareMilestones(a, b, options.localize));
        const groups = [];
        const groupMap = new Map();

        for (const milestone of sorted) {
            const year = getSortYear(milestone);
            if (!Number.isFinite(year)) continue;
            if (!groupMap.has(year)) {
                const group = { year, milestones: [] };
                groupMap.set(year, group);
                groups.push(group);
            }
            groupMap.get(year).milestones.push(milestone);
        }

        let cursor = edgePadding;
        let previousYear = null;
        const cards = [];
        const years = [];
        const gaps = [];
        const sideIndexes = { top: 0, bottom: 0 };
        let nextSide = 'top';

        for (const group of groups) {
            const yearGap = previousYear == null ? 0 : group.year - previousYear;
            const interGroupGap = previousYear == null ? 0 : Math.min(120, Math.max(24, yearGap * 7));
            if (previousYear != null && yearGap > 5) {
                gaps.push({
                    years: yearGap,
                    x: cursor + interGroupGap / 2
                });
            }
            cursor += interGroupGap;
            const columns = Math.max(1, Math.ceil(group.milestones.length / CARDS_PER_COLUMN));
            const groupWidth = Math.max(minimumGroupWidth, columns * (cardWidth + cardGap) - cardGap);
            const groupStart = cursor;
            const yearX = groupStart + groupWidth / 2;

            group.milestones.forEach((milestone, index) => {
                const column = Math.floor(index / CARDS_PER_COLUMN);
                const side = nextSide;
                nextSide = nextSide === 'top' ? 'bottom' : 'top';
                const x = groupStart + column * (cardWidth + cardGap);
                const staggerIndex = sideIndexes[side];
                sideIndexes[side] += 1;
                cards.push({ milestone, year: group.year, yearX, x, side, staggerIndex });
            });

            years.push({ year: group.year, x: yearX, count: group.milestones.length });
            cursor += groupWidth;
            previousYear = group.year;
        }

        const sideHeight = axisGap + cardHeight + maxStagger;
        const height = Math.max(minimumHeight, sideHeight * 2 + TIMELINE_VERTICAL_PADDING, availableHeight);
        const axisY = availableHeight > 0 ? availableHeight / 2 : height / 2;

        for (const card of cards) {
            const staggerOffset = staggerPattern[card.staggerIndex % staggerPattern.length];
            card.y =
                card.side === 'top' ? axisY - axisGap - cardHeight - staggerOffset : axisY + axisGap + staggerOffset;
            card.staggerOffset = staggerOffset;
            card.anchorY = card.side === 'top' ? card.y + cardHeight : card.y;
            card.anchorX = card.x + cardWidth / 2;
        }

        return {
            width: Math.max(Number(options.viewportWidth) || 0, cursor + edgePadding),
            height,
            axisY,
            cardWidth,
            cardHeight,
            laneCount: TIMELINE_LANE_COUNT,
            cards,
            years,
            gaps
        };
    }

    function getDensityTargetYear(years, ratio) {
        if (!Array.isArray(years) || !years.length) return null;
        const boundedRatio = Math.min(1, Math.max(0, Number(ratio) || 0));
        const minYear = years[0].year;
        const maxYear = years[years.length - 1].year;
        const targetYear = minYear + (maxYear - minYear) * boundedRatio;
        return years.reduce((closest, item) =>
            Math.abs(item.year - targetYear) < Math.abs(closest.year - targetYear) ? item : closest
        );
    }

    function getCenteredScrollLeft(yearX, viewportWidth, scrollWidth) {
        const maxScrollLeft = Math.max(0, Number(scrollWidth) - Number(viewportWidth));
        return Math.min(maxScrollLeft, Math.max(0, Number(yearX) - Number(viewportWidth) / 2));
    }

    function getNearestVisibleYear(years, scrollLeft, viewportWidth) {
        if (!Array.isArray(years) || !years.length) return null;
        const viewportCenter = Number(scrollLeft) + Number(viewportWidth) / 2;
        return years.reduce((closest, item) =>
            Math.abs(item.x - viewportCenter) < Math.abs(closest.x - viewportCenter) ? item : closest
        );
    }

    function getChronologyScaleX(element) {
        if (!element || !element.clientWidth || typeof element.getBoundingClientRect !== 'function') return 1;
        const bounds = element.getBoundingClientRect();
        const scale = Number(bounds && bounds.width) / Number(element.clientWidth);
        return Number.isFinite(scale) && scale > 0 ? scale : 1;
    }

    function getChronologyWheelDelta(event, scroller, options = {}) {
        const deltaX = Number.isFinite(event && event.deltaX) ? event.deltaX : 0;
        const deltaY = Number.isFinite(event && event.deltaY) ? event.deltaY : 0;
        const useHorizontal = Math.abs(deltaX) >= Math.abs(deltaY) && deltaX !== 0;
        if (!useHorizontal && options.convertVertical === false) return 0;

        let delta = useHorizontal ? deltaX : deltaY;
        if (!delta) return 0;
        if (event.deltaMode === 1) delta *= 48;
        if (event.deltaMode === 2) delta *= Math.max(320, Number(scroller && scroller.clientWidth) || 0);
        return delta / getChronologyScaleX(scroller);
    }

    function hasChronologyHorizontalDragIntent(deltaX, deltaY) {
        const absX = Math.abs(Number(deltaX) || 0);
        const absY = Math.abs(Number(deltaY) || 0);
        return (
            absX >= CHRONOLOGY_DRAG_THRESHOLD &&
            (absY < CHRONOLOGY_DRAG_THRESHOLD || absX >= absY * CHRONOLOGY_DRAG_INTENT_RATIO)
        );
    }

    function getChronologyDragScrollLeft(startScrollLeft, startX, currentX, scale = 1) {
        const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
        return Number(startScrollLeft || 0) - (Number(currentX || 0) - Number(startX || 0)) / safeScale;
    }

    function getChronologyScrollTarget(scrollLeft, scrollWidth, clientWidth, delta) {
        const maxScroll = Math.max(0, Number(scrollWidth || 0) - Number(clientWidth || 0));
        return Math.min(maxScroll, Math.max(0, Number(scrollLeft || 0) + Number(delta || 0)));
    }

    function getOverviewViewport(root, scope) {
        const viewportWidth = scope.innerWidth || root.clientWidth || 0;
        const viewportHeight = scope.innerHeight || root.clientHeight || 0;
        const width = root.clientWidth || viewportWidth;
        const height = root.clientHeight || viewportHeight;
        const responsive = viewportWidth <= VIEWPORT_BREAKPOINTS.responsiveWidth;
        const landscape = viewportWidth > viewportHeight;
        const narrowLandscape = viewportWidth <= VIEWPORT_BREAKPOINTS.shortLandscapeWidth && landscape;
        const shortLandscape = narrowLandscape && viewportHeight <= VIEWPORT_BREAKPOINTS.shortLandscapeHeight;
        const mediumLandscape = narrowLandscape && viewportHeight <= VIEWPORT_BREAKPOINTS.mediumLandscapeHeight;
        const mode = shortLandscape
            ? 'shortLandscape'
            : mediumLandscape
              ? 'mediumLandscape'
              : viewportWidth <= VIEWPORT_BREAKPOINTS.compactWidth
                ? 'compact'
                : 'default';
        const chromeHeight = shortLandscape
            ? OVERVIEW_CHROME_HEIGHT.shortLandscape
            : responsive
              ? OVERVIEW_CHROME_HEIGHT.responsive
              : OVERVIEW_CHROME_HEIGHT.default;
        return {
            width,
            compact: mode !== 'default',
            mode,
            timelineHeight: Math.max(0, height - chromeHeight)
        };
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(
            /[&<>"']/g,
            (character) =>
                ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                })[character]
        );
    }

    function renderStackedLabel(value) {
        const label = String(value || '').trim();
        if (!label) return '';
        const words = label.split(/\s+/).filter(Boolean);
        let lines;
        if (words.length > 1) {
            const midpoint = Math.ceil(words.length / 2);
            lines = [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
        } else {
            const characters = Array.from(label);
            const midpoint = Math.ceil(characters.length / 2);
            lines = [characters.slice(0, midpoint).join(''), characters.slice(midpoint).join('')];
        }
        return lines
            .filter(Boolean)
            .map((line) => `<span>${escapeHtml(line)}</span>`)
            .join('');
    }

    function getPrimaryImage(milestone) {
        const configuredImage =
            milestone && milestone.resources ? String(milestone.resources.overviewImage || '').trim() : '';
        if (configuredImage) return configuredImage;
        const images =
            milestone && milestone.resources && Array.isArray(milestone.resources.images)
                ? milestone.resources.images
                : [];
        return images[0] || '';
    }

    function getImageMeta(milestone, imageUrl) {
        const resourceMeta = (milestone && milestone.resources && milestone.resources.imageMeta) || {};
        const imageMeta = (milestone && milestone.imageMeta) || {};
        return imageMeta[imageUrl] || resourceMeta[imageUrl] || {};
    }

    function getImageAlt(milestone, imageUrl, localize) {
        const meta = getImageMeta(milestone, imageUrl);
        return localize(meta.caption) || localize(milestone && milestone.title);
    }

    function textValues(value) {
        if (value == null) return [];
        if (value && typeof value === 'object' && !Array.isArray(value)) return Object.values(value);
        return [value];
    }

    function joinSearchText(values) {
        return values.flatMap(textValues).filter(Boolean).join(' ').toLowerCase();
    }

    function imageNamesPerson(milestone, imageUrl, caption) {
        const imageText = joinSearchText([imageUrl, caption]);
        const figures = Array.isArray(milestone && milestone.figures) ? milestone.figures : [];
        return figures.some((figure) => {
            if (!figure || figure.figureType !== 'person') return false;
            if (figure.avatar && figure.avatar === imageUrl) return true;
            return textValues(figure.name).some((name) => name && imageText.includes(String(name).toLowerCase()));
        });
    }

    function isPortraitImage(milestone, imageUrl) {
        const meta = getImageMeta(milestone, imageUrl);
        const role = String(meta.role || '').toLowerCase();
        if (role === 'portrait') return true;
        const metadataText = joinSearchText([imageUrl, role, meta.caption, meta.subcaption]);
        if (PORTRAIT_EXCLUSION_PATTERN.test(metadataText)) return false;
        if (NON_PHOTO_ROLE_PATTERN.test(role) || /\.svg(?:$|[?#])/i.test(imageUrl)) return false;
        return PORTRAIT_HINT_PATTERN.test(metadataText) || imageNamesPerson(milestone, imageUrl, meta.caption);
    }

    function canPortraitCoverWithoutVerticalCrop(imageWidth, imageHeight, frameWidth, frameHeight) {
        const safeImageWidth = Number(imageWidth) || 0;
        const safeImageHeight = Number(imageHeight) || 0;
        const safeFrameWidth = Number(frameWidth) || 0;
        const safeFrameHeight = Number(frameHeight) || 0;
        if (!safeImageWidth || !safeImageHeight || !safeFrameWidth || !safeFrameHeight) return false;
        return safeImageWidth / safeImageHeight >= safeFrameWidth / safeFrameHeight;
    }

    function buildDensityPaths(milestones, summaries, storylineId = 'all') {
        const activeSummaries =
            storylineId === 'all' ? summaries : summaries.filter((summary) => summary.id === storylineId);
        const variants = (milestones || [])
            .flatMap(getMilestoneVariants)
            .filter((milestone) => storylineId === 'all' || getStorylineId(milestone) === storylineId);
        const years = variants.map(getSortYear).filter(Number.isFinite);
        if (!years.length) return '';
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const range = Math.max(1, maxYear - minYear);
        const width = DENSITY_CHART_WIDTH;
        const height = DENSITY_CHART_HEIGHT;
        const countsByStoryline = new Map();
        let maxCount = 1;

        for (const milestone of variants) {
            const year = getSortYear(milestone);
            const storylineId = getStorylineId(milestone);
            if (!Number.isFinite(year) || !storylineId) continue;
            if (!countsByStoryline.has(storylineId)) countsByStoryline.set(storylineId, new Map());
            const counts = countsByStoryline.get(storylineId);
            counts.set(year, (counts.get(year) || 0) + 1);
            maxCount = Math.max(maxCount, counts.get(year));
        }

        return activeSummaries
            .map((summary) => {
                const counts = countsByStoryline.get(summary.id) || new Map();
                const points = [];
                for (let year = minYear; year <= maxYear; year += 1) {
                    const x = ((year - minYear) / range) * width;
                    const y = height - ((counts.get(year) || 0) / maxCount) * (height - DENSITY_BASELINE_PADDING);
                    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
                }
                return `<polyline points="${points.join(' ')}" fill="none" stroke="${summary.color}" stroke-width="1.4" stroke-opacity="0.78" vector-effect="non-scaling-stroke"></polyline>`;
            })
            .join('');
    }

    function create(root, initialConfig = {}) {
        if (!root) throw new Error('ChronologyOverview requires a root element.');
        let config = initialConfig;
        let state = { storylineId: 'all', scrollLeft: 0 };
        let imageObserver = null;
        let resizeTimer = 0;
        let suppressedCardClick = { eventId: '', until: 0 };

        const localize = (value) => {
            if (typeof config.localize === 'function') return String(config.localize(value) || '');
            return localizeFallback(value, config.locale || 'zh');
        };

        function labels() {
            return {
                title: 'AI History',
                all: 'All',
                eventDensity: 'Event density',
                noResults: 'No matching events',
                openEvent: 'Open event',
                storylines: 'Storylines',
                ...config.labels
            };
        }

        function getCanonicalMilestones() {
            return Array.isArray(config.milestones) ? config.milestones : [];
        }

        function getVisibleMilestones() {
            return selectMilestonesByStoryline(getCanonicalMilestones(), state.storylineId);
        }

        function getStorylineSummaries() {
            return summarizeStorylines(
                getCanonicalMilestones(),
                localize,
                config.storylineStyles || DEFAULT_STORYLINE_STYLES
            );
        }

        function isActive() {
            return typeof config.isActive !== 'function' || config.isActive();
        }

        function getMembershipDetails(milestone, summaryById) {
            const memberships = getStorylineMemberships(milestone);
            const visibleMemberships =
                state.storylineId === 'all'
                    ? memberships
                    : memberships.filter((membership) => membership.id === state.storylineId);
            return visibleMemberships.map((membership) => {
                const summary = summaryById.get(membership.id) || {};
                return {
                    ...membership,
                    color: summary.color || '#f68900',
                    name: localize(membership.name) || summary.name || membership.id
                };
            });
        }

        function renderCard(card, summaryById, layout, text) {
            const milestone = card.milestone;
            const storylineId = getStorylineId(milestone);
            const summary = summaryById.get(storylineId) || { color: '#f68900', name: storylineId };
            const title = localize(milestone.title);
            const location = [
                localize(milestone.location && milestone.location.name),
                localize(milestone.location && milestone.location.country)
            ]
                .filter(Boolean)
                .join(' · ');
            const imageUrl = getPrimaryImage(milestone);
            const imageAlt = getImageAlt(milestone, imageUrl, localize);
            const portraitImage = isPortraitImage(milestone, imageUrl);
            const selected = config.selectedEventId && config.selectedEventId === milestone.id;
            const memberships = getMembershipDetails(milestone, summaryById);
            const multiStoryline = state.storylineId === 'all' && memberships.length > 1;
            const membershipNames = memberships.map((membership) => membership.name).join(', ');
            const accentColor = multiStoryline ? ALL_EVENTS_COLOR : summary.color;
            const accessibleLabel = `${text.openEvent}: ${title}${membershipNames ? `; ${text.storylines}: ${membershipNames}` : ''}`;
            return `
                <button class="chrono-event-card${multiStoryline ? ' is-multi-storyline' : ''}${selected ? ' is-selected' : ''}" type="button"
                    data-event-id="${escapeHtml(milestone.id)}" data-canonical-event-id="${escapeHtml(getCanonicalEventId(milestone))}" data-storyline-id="${escapeHtml(storylineId)}"
                    style="left:${card.x}px;top:${card.y}px;width:${layout.cardWidth}px;height:${layout.cardHeight}px;--story-color:${accentColor}"
                    aria-label="${escapeHtml(accessibleLabel)}">
                    <span class="chrono-card-strip" aria-hidden="true">
                        ${memberships.map((membership) => `<i style="background:${escapeHtml(membership.color)}"></i>`).join('')}
                    </span>
                    <span class="chrono-card-media${portraitImage ? ' is-portrait' : ''}">
                        ${
                            imageUrl
                                ? `<img data-src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" decoding="async">`
                                : '<span class="chrono-card-placeholder" aria-hidden="true"></span>'
                        }
                    </span>
                    ${
                        multiStoryline
                            ? `<span class="chrono-card-memberships" role="img" aria-label="${escapeHtml(`${text.storylines}: ${membershipNames}`)}">${memberships.map((membership) => `<i style="--membership-color:${escapeHtml(membership.color)}" title="${escapeHtml(membership.name)}"></i>`).join('')}</span>`
                            : ''
                    }
                    <span class="chrono-card-copy">
                        <span class="chrono-card-year">${escapeHtml(milestone.year)}</span>
                        <span class="chrono-card-title">${escapeHtml(title)}</span>
                        <span class="chrono-card-meta">${escapeHtml(location || membershipNames || summary.name)}</span>
                    </span>
                </button>
            `;
        }

        function renderSvg(layout, summaryById) {
            const lineStart = layout.years[0] ? layout.years[0].x : 0;
            const lineEnd = layout.years.length ? layout.years[layout.years.length - 1].x : 0;
            const axis =
                lineEnd > lineStart
                    ? `<line class="chrono-axis-glow" x1="${lineStart}" y1="${layout.axisY}" x2="${lineEnd}" y2="${layout.axisY}"></line>
                   <line class="chrono-axis-line" x1="${lineStart}" y1="${layout.axisY}" x2="${lineEnd}" y2="${layout.axisY}"></line>`
                    : '';
            const connectors = layout.cards
                .map((card) => {
                    const storylineId = getStorylineId(card.milestone);
                    const summary = summaryById.get(storylineId) || { color: '#f68900' };
                    const multiStoryline =
                        state.storylineId === 'all' && getStorylineMemberships(card.milestone).length > 1;
                    const controlY = (layout.axisY + card.anchorY) / 2;
                    return `<path class="chrono-connector${multiStoryline ? ' is-multi-storyline' : ''}" d="M ${card.yearX} ${layout.axisY} Q ${card.yearX} ${controlY} ${card.anchorX} ${card.anchorY}" stroke="${multiStoryline ? ALL_EVENTS_COLOR : summary.color}"></path>`;
                })
                .join('');
            const nodes = layout.years
                .map(
                    (year) => `
                <circle class="chrono-year-halo" cx="${year.x}" cy="${layout.axisY}" r="10"></circle>
                <circle class="chrono-year-node" cx="${year.x}" cy="${layout.axisY}" r="4.5"></circle>
            `
                )
                .join('');
            return `${axis}${connectors}${nodes}`;
        }

        function render() {
            if (!isActive()) return;
            const oldScroller = root.querySelector('.chrono-scroll');
            if (oldScroller) state.scrollLeft = oldScroller.scrollLeft;
            if (imageObserver) imageObserver.disconnect();

            let visibleMilestones = getVisibleMilestones();
            const summaries = getStorylineSummaries();
            if (state.storylineId !== 'all' && !summaries.some((summary) => summary.id === state.storylineId)) {
                state.storylineId = 'all';
                visibleMilestones = getVisibleMilestones();
            }
            const summaryById = new Map(summaries.map((summary) => [summary.id, summary]));
            const viewport = getOverviewViewport(root, globalScope);
            const layout = buildTimelineLayout(visibleMilestones, {
                mode: viewport.mode,
                viewportWidth: viewport.width,
                viewportHeight: viewport.timelineHeight,
                localize
            });
            const text = labels();
            const filters = [
                { id: 'all', name: text.all, count: getCanonicalMilestones().length, color: ALL_EVENTS_COLOR },
                ...summaries
            ];

            root.innerHTML = `
                <section class="chronology-overview" aria-label="${escapeHtml(text.title)}">
                    <div class="chrono-storyline-strip" aria-label="${escapeHtml(text.storylineFilter || 'Storyline filter')}">
                        ${filters
                            .map(
                                (filter) => `
                            <button class="chrono-storyline-segment${state.storylineId === filter.id ? ' is-active' : ''}" type="button"
                                data-filter-id="${escapeHtml(filter.id)}" style="--story-color:${filter.color}" aria-pressed="${state.storylineId === filter.id ? 'true' : 'false'}">
                                ${
                                    filter.id === 'all'
                                        ? `<span class="chrono-storyline-all-mark" aria-hidden="true">${summaries.map((summary) => `<i style="background:${summary.color}"></i>`).join('')}</span>`
                                        : '<span class="chrono-storyline-dot" aria-hidden="true"></span>'
                                }
                                <strong>${escapeHtml(filter.name)}</strong>
                                ${
                                    filter.id === 'all'
                                        ? `<span>${filter.count}</span>`
                                        : `<span>${filter.minYear}${filter.maxYear && filter.maxYear !== filter.minYear ? `–${filter.maxYear}` : ''}</span><span>${filter.count}</span>`
                                }
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                    <div class="chrono-canvas">
                        ${
                            visibleMilestones.length
                                ? `
                            <div class="chrono-scroll" tabindex="0" aria-label="${escapeHtml(text.timelineLabel || text.title)}">
                                <div class="chrono-inner" style="width:${layout.width}px;height:${layout.height}px;--chrono-card-width:${layout.cardWidth}px;--chrono-card-height:${layout.cardHeight}px">
                                    <svg class="chrono-axis" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" aria-hidden="true">${renderSvg(layout, summaryById)}</svg>
                                    <div class="chrono-year-labels" aria-hidden="true">
                                        ${layout.years.map((year) => `<span class="chrono-year-label" style="left:${year.x}px;top:${layout.axisY + 16}px">${year.year}</span>`).join('')}
                                        ${layout.gaps.map((gap) => `<span class="chrono-gap-label" style="left:${gap.x}px;top:${layout.axisY - 5}px">≈${gap.years}y</span>`).join('')}
                                    </div>
                                    ${layout.cards.map((card) => renderCard(card, summaryById, layout, text)).join('')}
                                </div>
                            </div>
                        `
                                : `<div class="chrono-empty">${escapeHtml(text.noResults)}</div>`
                        }
                    </div>
                    <div class="chrono-density">
                        <span class="chrono-density-label">${renderStackedLabel(text.eventDensity)}</span>
                        <div class="chrono-density-legend">
                            ${summaries
                                .map(
                                    (summary) =>
                                        `<span class="${state.storylineId !== 'all' && state.storylineId !== summary.id ? 'is-muted' : ''}" data-density-storyline-id="${escapeHtml(summary.id)}"><i style="--density-story-color:${summary.color}"></i>${escapeHtml(summary.name)}</span>`
                                )
                                .join('')}
                        </div>
                        ${
                            layout.years.length
                                ? `<div class="chrono-density-navigator" role="slider" tabindex="0"
                                    aria-label="${escapeHtml(text.eventDensity)}" aria-orientation="horizontal"
                                    aria-valuemin="${layout.years[0].year}" aria-valuemax="${layout.years[layout.years.length - 1].year}"
                                    aria-valuenow="${layout.years[0].year}" aria-valuetext="${layout.years[0].year}">
                                    <svg viewBox="0 0 ${DENSITY_CHART_WIDTH} ${DENSITY_CHART_HEIGHT}" preserveAspectRatio="none" aria-hidden="true">${buildDensityPaths(visibleMilestones, summaries, state.storylineId)}</svg>
                                    <span class="chrono-density-cursor" aria-hidden="true"></span>
                                </div>`
                                : ''
                        }
                    </div>
                </section>
            `;

            const scroller = root.querySelector('.chrono-scroll');
            if (scroller) {
                scroller.scrollLeft = Math.min(
                    state.scrollLeft,
                    Math.max(0, scroller.scrollWidth - scroller.clientWidth)
                );
                bindScroller(scroller, layout);
                bindDensityNavigator(scroller, layout);
                observeImages(scroller);
            }
            bindControls();
        }

        function observeImages(scroller) {
            const images = Array.from(root.querySelectorAll('img[data-src]'));
            if (!images.length) return;

            const loadImage = (image) => {
                const media = image.closest('.chrono-card-media.is-portrait');
                const imageUrl = image.dataset.src;
                image.src = imageUrl;
                if (media && imageUrl) {
                    const escapedUrl = image.src.replace(/["\\]/g, '\\$&');
                    media.style.setProperty('--portrait-backdrop-image', `url("${escapedUrl}")`);
                }
                const updatePortraitFit = () => {
                    if (!media) return;
                    media.classList.toggle(
                        'is-cover-safe',
                        canPortraitCoverWithoutVerticalCrop(
                            image.naturalWidth,
                            image.naturalHeight,
                            media.clientWidth,
                            media.clientHeight
                        )
                    );
                };
                image.addEventListener('load', updatePortraitFit, { once: true });
                delete image.dataset.src;
                if (image.complete && image.naturalWidth) updatePortraitFit();
            };

            if (typeof globalScope.IntersectionObserver !== 'function') {
                images.forEach(loadImage);
                return;
            }
            imageObserver = new globalScope.IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        const image = entry.target;
                        loadImage(image);
                        observer.unobserve(image);
                    });
                },
                { root: scroller, rootMargin: '480px 720px' }
            );
            images.forEach((image) => imageObserver.observe(image));
        }

        function bindScroller(scroller, layout) {
            let dragState = null;
            scroller.addEventListener('pointerdown', (event) => {
                if (event.button !== undefined && event.button !== 0) return;
                if (event.isPrimary === false) return;
                if (event.pointerType === 'touch') return;
                const card =
                    event.target && typeof event.target.closest === 'function'
                        ? event.target.closest('.chrono-event-card')
                        : null;
                dragState = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    scrollLeft: scroller.scrollLeft,
                    scale: getChronologyScaleX(scroller),
                    dragging: false,
                    eventId: (card && card.dataset.eventId) || ''
                };
            });
            scroller.addEventListener('pointermove', (event) => {
                if (!dragState || event.pointerId !== dragState.pointerId) return;
                if (event.pointerType !== 'touch' && event.buttons === 0) {
                    release(event);
                    return;
                }
                const deltaX = event.clientX - dragState.startX;
                const deltaY = event.clientY - dragState.startY;
                if (!dragState.dragging) {
                    if (!hasChronologyHorizontalDragIntent(deltaX, deltaY)) {
                        if (Math.abs(deltaY) >= CHRONOLOGY_DRAG_THRESHOLD) dragState = null;
                        return;
                    }
                    dragState.dragging = true;
                    scroller.classList.add('is-dragging');
                    if (typeof scroller.setPointerCapture === 'function') {
                        scroller.setPointerCapture(event.pointerId);
                    }
                }
                scroller.scrollLeft = getChronologyDragScrollLeft(
                    dragState.scrollLeft,
                    dragState.startX,
                    event.clientX,
                    dragState.scale
                );
                state.scrollLeft = scroller.scrollLeft;
                if (event.cancelable) event.preventDefault();
            });
            function release(event) {
                if (event && dragState && event.pointerId !== dragState.pointerId) return;
                if (dragState && dragState.dragging) {
                    suppressedCardClick = {
                        eventId: dragState.eventId,
                        until: Date.now() + CHRONOLOGY_CLICK_SUPPRESS_MS
                    };
                }
                dragState = null;
                scroller.classList.remove('is-dragging');
                state.scrollLeft = scroller.scrollLeft;
            }
            scroller.addEventListener('pointerup', release);
            scroller.addEventListener('pointercancel', release);
            scroller.addEventListener('lostpointercapture', release);
            scroller.addEventListener('dragstart', (event) => event.preventDefault());
            scroller.addEventListener(
                'wheel',
                (event) => {
                    if (event.ctrlKey) return;
                    const delta = getChronologyWheelDelta(event, scroller, {
                        convertVertical: globalScope.innerWidth > VIEWPORT_BREAKPOINTS.responsiveWidth
                    });
                    if (!delta) return;
                    const nextScrollLeft = getChronologyScrollTarget(
                        scroller.scrollLeft,
                        scroller.scrollWidth,
                        scroller.clientWidth,
                        delta
                    );
                    if (nextScrollLeft === scroller.scrollLeft) return;
                    if (event.cancelable) event.preventDefault();
                    scroller.scrollLeft = nextScrollLeft;
                },
                { passive: false }
            );
            scroller.addEventListener(
                'scroll',
                () => {
                    state.scrollLeft = scroller.scrollLeft;
                    syncDensityNavigator(scroller, layout);
                },
                { passive: true }
            );
            scroller.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowRight') scroller.scrollBy({ left: 220, behavior: 'smooth' });
                else if (event.key === 'ArrowLeft') scroller.scrollBy({ left: -220, behavior: 'smooth' });
                else if (event.key === 'Home') scroller.scrollTo({ left: 0, behavior: 'smooth' });
                else if (event.key === 'End') scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' });
                else return;
                event.preventDefault();
            });
        }

        function syncDensityNavigator(scroller, layout) {
            const navigator = root.querySelector('.chrono-density-navigator');
            if (!navigator) return;
            const years = layout.years;
            const current = getNearestVisibleYear(years, scroller.scrollLeft, scroller.clientWidth);
            if (!current) return;
            const minYear = years[0].year;
            const maxYear = years[years.length - 1].year;
            const ratio = maxYear === minYear ? 0 : (current.year - minYear) / (maxYear - minYear);
            navigator.style.setProperty('--density-position', `${ratio * 100}%`);
            navigator.setAttribute('aria-valuenow', String(current.year));
            navigator.setAttribute('aria-valuetext', String(current.year));
        }

        function bindDensityNavigator(scroller, layout) {
            const navigator = root.querySelector('.chrono-density-navigator');
            if (!navigator || !layout.years.length) return;

            const moveToYear = (year) => {
                if (!year) return;
                const left = getCenteredScrollLeft(year.x, scroller.clientWidth, scroller.scrollWidth);
                scroller.scrollTo({ left, behavior: 'smooth' });
            };
            const moveToRatio = (ratio) => moveToYear(getDensityTargetYear(layout.years, ratio));

            navigator.addEventListener('click', (event) => {
                const bounds = navigator.getBoundingClientRect();
                if (!bounds.width) return;
                moveToRatio((event.clientX - bounds.left) / bounds.width);
            });
            navigator.addEventListener('keydown', (event) => {
                const current = getNearestVisibleYear(layout.years, scroller.scrollLeft, scroller.clientWidth);
                const currentIndex = Math.max(0, layout.years.indexOf(current));
                let target = null;
                if (event.key === 'ArrowRight')
                    target = layout.years[Math.min(layout.years.length - 1, currentIndex + 1)];
                else if (event.key === 'ArrowLeft') target = layout.years[Math.max(0, currentIndex - 1)];
                else if (event.key === 'Home') target = layout.years[0];
                else if (event.key === 'End') target = layout.years[layout.years.length - 1];
                else return;
                event.preventDefault();
                moveToYear(target);
            });
            syncDensityNavigator(scroller, layout);
        }

        function bindControls() {
            root.querySelectorAll('[data-filter-id]').forEach((button) => {
                button.addEventListener('click', () => {
                    state.storylineId = button.dataset.filterId || 'all';
                    state.scrollLeft = 0;
                    if (typeof config.onFilterChange === 'function') config.onFilterChange(state.storylineId);
                    render();
                });
            });
            root.querySelectorAll('.chrono-event-card').forEach((button) => {
                button.addEventListener('click', (event) => {
                    if (
                        button.dataset.eventId === suppressedCardClick.eventId &&
                        Date.now() < suppressedCardClick.until
                    ) {
                        suppressedCardClick = { eventId: '', until: 0 };
                        event.preventDefault();
                        return;
                    }
                    if (typeof config.onOpenMilestone === 'function') {
                        config.onOpenMilestone(button.dataset.eventId || '');
                    }
                });
            });
        }

        function update(nextConfig = {}) {
            config = { ...config, ...nextConfig };
            render();
        }

        function getState() {
            const scroller = root.querySelector('.chrono-scroll');
            return {
                ...state,
                scrollLeft: scroller ? scroller.scrollLeft : state.scrollLeft
            };
        }

        function setState(nextState = {}) {
            state = { ...state, ...nextState };
        }

        function scroll(direction) {
            const scroller = root.querySelector('.chrono-scroll');
            if (!scroller) return;
            const delta = Math.max(360, scroller.clientWidth * 0.72);
            scroller.scrollBy({ left: direction === 'prev' ? -delta : delta, behavior: 'smooth' });
        }

        function handleResize() {
            globalScope.clearTimeout(resizeTimer);
            resizeTimer = globalScope.setTimeout(() => {
                if (isActive()) render();
            }, 120);
        }

        function destroy() {
            if (imageObserver) imageObserver.disconnect();
            globalScope.clearTimeout(resizeTimer);
            if (globalScope && typeof globalScope.removeEventListener === 'function') {
                globalScope.removeEventListener('resize', handleResize);
            }
            root.replaceChildren();
        }

        if (globalScope && typeof globalScope.addEventListener === 'function') {
            globalScope.addEventListener('resize', handleResize);
        }

        return { update, render, getState, setState, scroll, destroy };
    }

    const api = {
        DEFAULT_STORYLINE_STYLES,
        buildCanonicalMilestones,
        buildDensityPaths,
        buildTimelineLayout,
        compareMilestones,
        create,
        getCenteredScrollLeft,
        getCanonicalEventId,
        getChronologyDragScrollLeft,
        getChronologyScaleX,
        getChronologyScrollTarget,
        getChronologyWheelDelta,
        getDensityTargetYear,
        getMilestoneVariants,
        getNearestVisibleYear,
        getOverviewViewport,
        getPrimaryImage,
        getSortYear,
        getStorylineId,
        getStorylineMemberships,
        hasChronologyHorizontalDragIntent,
        canPortraitCoverWithoutVerticalCrop,
        isPortraitImage,
        selectMilestonesByStoryline,
        selectMilestoneVariant,
        summarizeStorylines
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (globalScope) globalScope.ChronologyOverview = api;
})(typeof window !== 'undefined' ? window : globalThis);
