(function (global) {
    function t(key) {
        return global.I18n && typeof global.I18n.t === 'function' ? global.I18n.t(key) : key;
    }

    function localize(value) {
        return global.I18n && typeof global.I18n.localize === 'function'
            ? global.I18n.localize(value)
            : value == null
              ? ''
              : value;
    }

    function localizeObject(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
        const localized = localize(value);
        if (localized !== value) return localized;
        const result = {};
        for (const [key, item] of Object.entries(value)) {
            if (key === 'coordinates') result[key] = item;
            else if (Array.isArray(item)) result[key] = item.map(localizeObject);
            else if (item && typeof item === 'object') result[key] = localizeObject(item);
            else result[key] = item;
        }
        return result;
    }

    function stripHtml(html) {
        return String(html || '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isWorkAttribution(value) {
        const text = String(value || '').trim();
        return text.startsWith('《') || /^<em\b[^>]*>/i.test(text);
    }

    function splitDescription(description) {
        const text = stripHtml(description);
        if (!text) return [];

        const sentences = text
            .split(/(?<=[。！？.!?])\s+/)
            .map((item) => item.trim())
            .filter(Boolean);

        if (sentences.length <= 2) return sentences;

        const chunks = [];
        for (let i = 0; i < sentences.length; i += 2) {
            chunks.push(sentences.slice(i, i + 2).join(' '));
        }
        return chunks;
    }

    function getPrimaryVideo(milestone) {
        if (milestone.resources && Array.isArray(milestone.resources.videos) && milestone.resources.videos.length > 0) {
            return milestone.resources.videos[0];
        }

        if (milestone.videoUrl && milestone.videoUrl.trim()) {
            return {
                embed_url: milestone.videoUrl.trim(),
                title: localize(milestone.title) || '',
                source: 'External'
            };
        }

        return null;
    }

    function audioCandidateUrl(candidate) {
        if (typeof candidate === 'string') return candidate.trim();
        return candidate ? String(candidate.url || candidate.src || candidate.path || candidate.file || '').trim() : '';
    }

    function isPreferredS3Audio(candidate) {
        const url = audioCandidateUrl(candidate);
        if (!/^https:\/\//i.test(url)) return false;
        const provider =
            candidate && typeof candidate === 'object' ? String(candidate.storage?.provider || '').trim() : '';
        return provider === 'bza-s3' || /^https:\/\/s3\.inner\.bza\.edu\.cn(?:\/|$)/i.test(url);
    }

    function getPrimaryAudio(milestone) {
        const candidates = [];
        if (milestone && milestone.audio) {
            candidates.push(...(Array.isArray(milestone.audio) ? milestone.audio : [milestone.audio]));
        }
        if (milestone && milestone.resources) {
            const resources = milestone.resources;
            if (resources.audio) {
                candidates.push(...(Array.isArray(resources.audio) ? resources.audio : [resources.audio]));
            }
            if (resources.audios) {
                candidates.push(...(Array.isArray(resources.audios) ? resources.audios : [resources.audios]));
            }
        }
        if (milestone && milestone.audioUrl) candidates.push({ url: milestone.audioUrl });

        const validCandidates = candidates.filter((candidate) => {
            if (typeof candidate === 'string') return candidate.trim();
            return candidate && String(candidate.url || candidate.src || candidate.path || candidate.file || '').trim();
        });
        const locale =
            global.I18n && typeof global.I18n.getLocale === 'function' ? global.I18n.getLocale() : global.currentLocale;
        const localizedCandidates = validCandidates.filter(
            (candidate) => candidate && typeof candidate === 'object' && String(candidate.language || '').trim()
        );
        const matchingLocaleCandidates = localizedCandidates.filter(
            (candidate) => String(candidate.language || '').trim() === locale
        );
        const item =
            matchingLocaleCandidates.find(isPreferredS3Audio) ||
            matchingLocaleCandidates[0] ||
            (localizedCandidates.length === 0 ? validCandidates.find(isPreferredS3Audio) || validCandidates[0] : null);
        if (!item) return null;
        if (typeof item === 'string') return { url: item.trim(), title: '', source: '' };

        return {
            ...item,
            url: String(item.url || item.src || item.path || item.file || '').trim(),
            title: localize(item.title || item.label || item.name) || '',
            source: localize(item.source || item.credit) || ''
        };
    }

    function collectPhotos(milestone, limit) {
        const photos = [];
        const seen = new Set();
        const maxCount = typeof limit === 'number' ? limit : 5;

        const pushPhoto = (url) => {
            if (!url || seen.has(url)) return;
            seen.add(url);
            photos.push(url);
        };

        (milestone.photos || []).forEach(pushPhoto);
        if (milestone.resources && Array.isArray(milestone.resources.images)) {
            milestone.resources.images.forEach(pushPhoto);
        }

        return photos.slice(0, maxCount);
    }

    function buildCommentarySections(milestone) {
        const sections = [];
        const quoteHtml = String(localize(milestone.quote) || '').trim();
        const quoteAttribution = String(localize(milestone.quoteAttribution) || '').trim();
        const quoteLabel = String(localize(milestone.quoteLabel) || '').trim();
        const customSections = Array.isArray(milestone.commentarySections)
            ? milestone.commentarySections.filter((section) => stripHtml(localize(section && section.html)))
            : [];

        if (quoteHtml && quoteHtml !== '待补充') {
            const attributionPrefix =
                quoteAttribution && isWorkAttribution(quoteAttribution) ? `${t('source')}：` : `${t('attribution')}：`;
            sections.push({
                label: quoteLabel || t('quoteExcerpt'),
                html: quoteAttribution ? `${quoteHtml}<br>${attributionPrefix}${quoteAttribution}` : quoteHtml
            });
        }

        if (customSections.length > 0) {
            customSections.forEach((section) => {
                sections.push({
                    label: localize(section.label) || t('contentInterpretation'),
                    html: localize(section.html),
                    link: section.link || null
                });
            });
        } else {
            splitDescription(localize(milestone.description)).forEach((paragraph, index) => {
                sections.push({
                    label: index === 0 ? t('background') : t('extension'),
                    html: paragraph
                });
            });
        }

        if (sections.length === 0) {
            sections.push({
                label: t('contentPending'),
                html: t('noAdditionalInfo')
            });
        }

        return sections.slice(0, sections.length > 3 ? 4 : 3);
    }

    function toTimelineItems(allMilestones, currentIndex) {
        return allMilestones.map((item, index) => ({
            year: item.year,
            title: localize(item.title),
            active: index === currentIndex
        }));
    }

    function collectQuizzes(milestone) {
        if (Array.isArray(milestone.quizzes)) return milestone.quizzes;
        if (milestone.quiz) return [milestone.quiz];
        return [];
    }

    function normalizeMilestone(milestone, currentIndex, allMilestones) {
        const figures = Array.isArray(milestone.figures) ? milestone.figures.map(localizeObject) : [];
        const photos = collectPhotos(milestone, 20);
        const timeline = Array.isArray(allMilestones) ? toTimelineItems(allMilestones, currentIndex) : [];
        const quizzes = collectQuizzes(milestone);
        const commentarySections = buildCommentarySections(milestone);
        const primaryVideo = getPrimaryVideo(milestone);
        const primaryAudio = getPrimaryAudio(milestone);
        const description = localize(milestone.description) || '';
        const location = localizeObject(milestone.location || { name: '', country: '', coordinates: [] });
        const quote = String(localize(milestone.quote) || '').trim();

        return {
            raw: milestone,
            year: milestone.year,
            title: localize(milestone.title) || '',
            category: localize(milestone.category) || localize(milestone.subtitle) || '',
            subtitle: localize(milestone.subtitle) || localize(milestone.category) || '',
            location,
            descriptionHtml: description,
            descriptionText: stripHtml(description),
            figures,
            photos,
            primaryPhoto: photos[0] || '',
            archivePhotos: photos.slice(1),
            primaryVideo,
            videoEmbedUrl: primaryVideo ? primaryVideo.embed_url : '',
            primaryAudio,
            audioUrl: primaryAudio ? primaryAudio.url : '',
            quoteHtml: quote && quote !== '待补充' ? quote : '',
            quoteAttribution: String(localize(milestone.quoteAttribution) || '').trim(),
            quoteLabel: String(localize(milestone.quoteLabel) || '').trim(),
            quotePage: String(localize(milestone.quotePage) || '').trim(),
            commentaryOverrideSections: Array.isArray(milestone.commentarySections) ? milestone.commentarySections : [],
            commentarySections,
            quizzes,
            timeline
        };
    }

    global.MilestoneView = {
        normalizeMilestone,
        collectPhotos,
        getPrimaryAudio,
        isWorkAttribution,
        splitDescription,
        stripHtml
    };
})(window);
