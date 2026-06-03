(function (global) {
    const i18n = {
        supportedLocales: ['en', 'zh'],
        defaultLocale: 'zh',
        storageKey: 'ai-history-locale',
        dictionary: {
            en: {
                appTitleSingle: 'AI History Exhibition - Single Screen',
                appTitleDual: 'AI History Exhibition - Dual Screen',
                aiHistory: 'AI History',
                aiHistoryMode: 'AI HISTORY',
                aiHistoryReview: 'AI History Exhibition',
                switchLanguageToEnglish: 'Switch to English',
                switchLanguageToChinese: 'Switch to Chinese',
                previousPage: 'Previous',
                nextPage: 'Next',
                autoPlay: 'Auto Play',
                source: 'Source',
                attribution: 'Attribution',
                quoteExcerpt: 'Quote',
                background: 'Background',
                extension: 'Context',
                contentInterpretation: 'Commentary',
                contentPending: 'Content in progress',
                noAdditionalInfo: 'No additional information',
                noMilestones: 'No milestone data',
                locationPending: 'Location pending',
                locationInfoPending: 'Location details pending',
                eventSummaryPending: 'No event summary available',
                aiHistoryEvent: 'AI history event',
                keyFigure: 'Key figure',
                keyParticipant: 'Key participant',
                keyHistoricalFigure: 'Key historical figure',
                historicalEvent: 'Historical event',
                historicalArchive: 'Historical archive',
                archiveImage: 'Archive image',
                archiveMaterial: 'Event material',
                mainArchivePhoto: 'Main archive photo',
                previousArchive: 'Previous archive',
                nextArchive: 'Next archive',
                noArchivePhotos: 'No archive images available',
                noMedia: 'No media available',
                playVideo: 'Click to play video',
                portrait: 'Portrait',
                researcherPhoto: 'Researcher photo',
                architectureDiagram: 'Architecture',
                modelArchitecture: 'Model architecture',
                paperPage: 'Paper page',
                originalScreenshot: 'Original screenshot or abstract',
                signature: 'Attribution',
                keyFiguresArchiveNarrative: 'Key Figures & Archive Narrative',
                commentaryMedia: 'Commentary & Media'
            },
            zh: {
                appTitleSingle: 'AI 历史回顾展览 - 单屏模式',
                appTitleDual: 'AI 历史回顾展览 - 双屏模式',
                aiHistory: 'AI 历史',
                aiHistoryMode: '人工智能历史',
                aiHistoryReview: 'AI 历史回顾',
                switchLanguageToEnglish: '切换到英文',
                switchLanguageToChinese: '切换到中文',
                previousPage: '上一页',
                nextPage: '下一页',
                autoPlay: '自动播放',
                source: '来源',
                attribution: '署名',
                quoteExcerpt: '引言摘录',
                background: '背景解读',
                extension: '延展说明',
                contentInterpretation: '内容解读',
                contentPending: '内容整理中',
                noAdditionalInfo: '暂无补充说明',
                noMilestones: '暂无里程碑数据',
                locationPending: '地点待补充',
                locationInfoPending: '地点信息待补充',
                eventSummaryPending: '暂无事件摘要',
                aiHistoryEvent: 'AI 历史事件',
                keyFigure: '关键人物',
                keyParticipant: '关键参与者',
                keyHistoricalFigure: '关键历史人物',
                historicalEvent: '历史事件',
                historicalArchive: '历史档案',
                archiveImage: '档案图片',
                archiveMaterial: '事件相关资料',
                mainArchivePhoto: '主档案照片',
                previousArchive: '前一张档案',
                nextArchive: '后一张档案',
                noArchivePhotos: '暂无历史档案图像',
                noMedia: '暂无媒体资料',
                playVideo: '点击播放视频',
                portrait: '人物肖像',
                researcherPhoto: '相关研究者照片',
                architectureDiagram: '结构示意',
                modelArchitecture: '模型架构图',
                paperPage: '论文页面',
                originalScreenshot: '原文截图或摘要',
                signature: '署名',
                keyFiguresArchiveNarrative: '关键人物与档案叙事',
                commentaryMedia: '评论与媒体'
            }
        }
    };

    function getStoredLocale() {
        try {
            return global.localStorage && global.localStorage.getItem(i18n.storageKey);
        } catch (_) {
            return '';
        }
    }

    function normalizeLocale(locale) {
        return i18n.supportedLocales.includes(locale) ? locale : i18n.defaultLocale;
    }

    function getLocale() {
        return normalizeLocale(global.currentLocale || getStoredLocale() || i18n.defaultLocale);
    }

    function setLocale(locale) {
        const nextLocale = normalizeLocale(locale);
        const previousLocale = getLocale();
        global.currentLocale = nextLocale;
        try {
            if (global.localStorage) global.localStorage.setItem(i18n.storageKey, nextLocale);
        } catch (_) {}
        if (global.document && global.document.documentElement) {
            global.document.documentElement.lang = nextLocale === 'zh' ? 'zh-CN' : nextLocale;
        }
        updateToggle();
        if (previousLocale !== nextLocale) {
            global.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale: nextLocale } }));
        }
    }

    function t(key, locale = getLocale()) {
        return (
            (i18n.dictionary[locale] && i18n.dictionary[locale][key]) ||
            (i18n.dictionary[i18n.defaultLocale] && i18n.dictionary[i18n.defaultLocale][key]) ||
            key
        );
    }

    function isLocalizedObject(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        return i18n.supportedLocales.some((locale) => Object.prototype.hasOwnProperty.call(value, locale));
    }

    function localize(value, locale = getLocale()) {
        if (!isLocalizedObject(value)) return value == null ? '' : value;
        return value[locale] ?? value[i18n.defaultLocale] ?? value.en ?? value.zh ?? '';
    }

    function createToggle() {
        if (!global.document || global.document.getElementById('languageToggle')) return;
        const button = global.document.createElement('button');
        button.id = 'languageToggle';
        button.className = 'language-toggle';
        button.type = 'button';

        const modeChip = global.document.querySelector('.mode-chip');
        if (modeChip && modeChip.parentNode) {
            button.classList.add('topbar-language-toggle');
            modeChip.parentNode.insertBefore(button, modeChip);
        } else {
            button.style.cssText = [
                'position:fixed',
                'right:18px',
                'top:18px',
                'z-index:9999',
                'border:1px solid rgba(244,239,229,.28)',
                'background:rgba(0,0,0,.62)',
                'color:#f4efe5',
                'border-radius:8px',
                'padding:8px 12px',
                'font:700 13px/1.1 PingFang SC, Microsoft YaHei, Arial, sans-serif',
                'letter-spacing:0',
                'cursor:pointer',
                'backdrop-filter:blur(10px)'
            ].join(';');
            global.document.body.appendChild(button);
        }
        button.addEventListener('click', () => {
            const current = getLocale();
            const index = i18n.supportedLocales.indexOf(current);
            setLocale(i18n.supportedLocales[(index + 1) % i18n.supportedLocales.length]);
        });
        updateToggle();
    }

    function updateToggle() {
        if (!global.document) return;
        const button = global.document.getElementById('languageToggle');
        if (!button) return;
        const locale = getLocale();
        button.textContent = locale === 'zh' ? 'EN' : '中';
        button.setAttribute(
            'aria-label',
            locale === 'zh' ? t('switchLanguageToEnglish') : t('switchLanguageToChinese')
        );
    }

    global.i18n = i18n;
    global.currentLocale = getLocale();
    global.t = t;
    global.localize = localize;
    global.setLocale = setLocale;
    global.I18n = { t, localize, setLocale, getLocale, createToggle };

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', createToggle);
        } else {
            createToggle();
        }
        setLocale(global.currentLocale);
    }
})(window);
