(function (global) {
    function stripHtml(html) {
        return String(html || '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
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
                title: milestone.title || '',
                source: 'External'
            };
        }

        return null;
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
        const quoteHtml = String(milestone.quote || '').trim();

        if (quoteHtml && quoteHtml !== '待补充') {
            sections.push({
                label: '引言摘录',
                html: quoteHtml
            });
        }

        splitDescription(milestone.description).forEach((paragraph, index) => {
            sections.push({
                label: index === 0 ? '背景解读' : '延展说明',
                html: paragraph
            });
        });

        if (sections.length === 0) {
            sections.push({
                label: '内容整理中',
                html: '暂无补充说明'
            });
        }

        return sections.slice(0, 3);
    }

    function toTimelineItems(allMilestones, currentIndex) {
        return allMilestones.map((item, index) => ({
            year: item.year,
            title: item.title,
            active: index === currentIndex
        }));
    }

    function normalizeMilestone(milestone, currentIndex, allMilestones) {
        const figures = Array.isArray(milestone.figures) ? milestone.figures : [];
        const photos = collectPhotos(milestone, 5);
        const timeline = Array.isArray(allMilestones) ? toTimelineItems(allMilestones, currentIndex) : [];
        const commentarySections = buildCommentarySections(milestone);
        const primaryVideo = getPrimaryVideo(milestone);

        return {
            raw: milestone,
            year: milestone.year,
            title: milestone.title || '',
            category: milestone.category || milestone.subtitle || '',
            subtitle: milestone.subtitle || milestone.category || '',
            location: milestone.location || { name: '', country: '', coordinates: [] },
            descriptionHtml: milestone.description || '',
            descriptionText: stripHtml(milestone.description || ''),
            figures,
            photos,
            primaryPhoto: photos[0] || '',
            archivePhotos: photos.slice(1),
            primaryVideo,
            videoEmbedUrl: primaryVideo ? primaryVideo.embed_url : '',
            quoteHtml: String(milestone.quote || '').trim() && milestone.quote !== '待补充'
                ? String(milestone.quote || '').trim()
                : '',
            quotePage: String(milestone.quotePage || '').trim(),
            commentarySections,
            timeline
        };
    }

    global.MilestoneView = {
        normalizeMilestone,
        collectPhotos,
        splitDescription,
        stripHtml
    };
})(window);
