'use strict';

const DATA_URL = './review-data.json';
const REVIEW_STORAGE_KEY = 'ai-history-audio-review-v1';
const UI_STORAGE_KEY = 'ai-history-audio-review-ui-v1';
const POSITION_STORAGE_KEY = 'ai-history-audio-review-position-v1';
const SCORE_FIELDS = [
    ['pronunciation', '发音与专名'],
    ['naturalness', '自然度'],
    ['pacing', '节奏与停顿'],
    ['contentFit', '文稿匹配']
];
const ISSUE_LABELS = ['发音', '语速/停顿', '音色', '情绪', '文稿事实', '事件串联', '其他'];

const state = {
    data: null,
    query: '',
    scope: 'all',
    locale: 'zh',
    version: 'interactive',
    format: 'all',
    closing: 'all',
    reviewFilter: 'all',
    selectedKey: null,
    activeTab: 'script',
    autoNext: false,
    showTrace: true,
    reviews: loadStorage(REVIEW_STORAGE_KEY, {}),
    positions: loadStorage(POSITION_STORAGE_KEY, {}),
    currentAudioPath: null
};

const elements = {
    releaseSummary: document.querySelector('#release-summary'),
    filterPanel: document.querySelector('#filter-panel'),
    eventCount: document.querySelector('#event-count'),
    activeVariantLabel: document.querySelector('#active-variant-label'),
    eventList: document.querySelector('#event-list'),
    reviewPane: document.querySelector('#review-pane'),
    playerTitle: document.querySelector('#player-title'),
    playerSubtitle: document.querySelector('#player-subtitle'),
    audio: document.querySelector('#audio-player'),
    previousEvent: document.querySelector('#previous-event'),
    nextEvent: document.querySelector('#next-event'),
    autoNext: document.querySelector('#auto-next'),
    exportReview: document.querySelector('#export-review'),
    importReview: document.querySelector('#import-review'),
    importReviewFile: document.querySelector('#import-review-file'),
    toast: document.querySelector('#toast')
};

function loadStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (_) {
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDuration(seconds) {
    const rounded = Math.round(Number(seconds) || 0);
    const minutes = Math.floor(rounded / 60);
    const remainder = rounded % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function formatHours(seconds) {
    return `${(seconds / 3600).toFixed(2)} h`;
}

function formatBytes(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function eventKey(event) {
    return `${event.scopeId}:${event.sequenceIndex}`;
}

function selectedEvent() {
    return state.data.events.find((event) => eventKey(event) === state.selectedKey) || null;
}

function localeVariant(event, locale = state.locale) {
    return event.variants[locale]?.storyline || null;
}

function activeVariant(event) {
    const variant = localeVariant(event);
    if (!variant) return null;
    return variant.revisionOptions?.find((option) => option.revision?.kind === state.version) || variant;
}

function versionLabel(version) {
    return version === 'interactive' ? '互动增强版' : '原版';
}

function activeReview(event) {
    const variant = activeVariant(event);
    return (
        (variant && state.reviews[variant.audio.path]) || {
            status: 'pending',
            issues: [],
            scores: {},
            notes: '',
            updatedAt: null
        }
    );
}

function scopeLabel(scopeId) {
    return (
        {
            'bench-council-ai100': 'AI Achievements',
            'gaming-ai': 'AI 棋牌',
            'deep-learning': 'AI 70 年',
            'humanistic-cycle': 'AI 人文'
        }[scopeId] || scopeId
    );
}

function localeLabel(locale) {
    return locale === 'zh' ? '中文' : 'English';
}

function roleLabel(role, locale) {
    if (locale === 'en') {
        return (
            {
                A: 'Megan',
                B: 'Alberto',
                N: 'Alberto',
                Summary: 'Alberto',
                SUMMARY: 'Alberto'
            }[role] || role
        );
    }
    return (
        {
            A: '主持人 A',
            B: '讲述者 B',
            N: '旁白',
            Summary: '总结',
            SUMMARY: '总结'
        }[role] || role
    );
}

function reviewStatusLabel(status) {
    return { pending: '未审听', pass: '通过', revise: '需调整' }[status];
}

function getFilteredEvents() {
    const query = state.query.trim().toLocaleLowerCase();
    return state.data.events.filter((event) => {
        if (!localeVariant(event)) return false;
        const review = activeReview(event);
        const matchesQuery =
            !query || [event.title.zh, event.title.en, event.eventId].join(' ').toLocaleLowerCase().includes(query);
        return (
            matchesQuery &&
            (state.scope === 'all' || event.scopeId === state.scope) &&
            (state.format === 'all' || event.format === state.format) &&
            (state.closing === 'all' || event.closingType === state.closing) &&
            (state.reviewFilter === 'all' || review.status === state.reviewFilter)
        );
    });
}

function ensureSelection() {
    const filtered = getFilteredEvents();
    if (!filtered.some((event) => eventKey(event) === state.selectedKey)) {
        state.selectedKey = filtered.length ? eventKey(filtered[0]) : null;
    }
}

function persistUiState() {
    saveStorage(UI_STORAGE_KEY, {
        scope: state.scope,
        locale: state.locale,
        version: state.version,
        format: state.format,
        closing: state.closing,
        reviewFilter: state.reviewFilter,
        selectedKey: state.selectedKey,
        activeTab: state.activeTab,
        autoNext: state.autoNext,
        showTrace: state.showTrace
    });
}

function restoreUiState() {
    const saved = loadStorage(UI_STORAGE_KEY, {});
    Object.assign(state, {
        scope: saved.scope || state.scope,
        locale: saved.locale || state.locale,
        version: saved.version || state.version,
        format: saved.format || state.format,
        closing: saved.closing || state.closing,
        reviewFilter: saved.reviewFilter || state.reviewFilter,
        selectedKey: saved.selectedKey || state.selectedKey,
        activeTab: saved.activeTab || state.activeTab,
        autoNext: Boolean(saved.autoNext),
        showTrace: saved.showTrace !== false
    });
}

function renderReleaseSummary() {
    const storylineVariants = state.data.events.flatMap((event) =>
        Object.values(event.variants).flatMap(({ storyline: variant }) => {
            return variant.revisionOptions?.length ? variant.revisionOptions : [variant];
        })
    );
    const variantsByPath = new Map(storylineVariants.map((variant) => [variant.audio.path, variant]));
    const validPaths = new Set(variantsByPath.keys());
    const totalAssets = variantsByPath.size;
    const totalDurationSec = [...variantsByPath.values()].reduce(
        (total, variant) => total + variant.audio.durationSec,
        0
    );
    const reviewed = Object.entries(state.reviews).filter(
        ([path, review]) => validPaths.has(path) && review.status && review.status !== 'pending'
    ).length;
    const percent = totalAssets ? (reviewed / totalAssets) * 100 : 0;
    elements.releaseSummary.innerHTML = `
        <div class="summary-stat"><strong>${state.data.events.length}</strong><span>事件包</span></div>
        <div class="summary-stat"><strong>${totalAssets}</strong><span>MP3</span></div>
        <div class="summary-stat"><strong>${formatHours(totalDurationSec)}</strong><span>总时长</span></div>
        <div class="review-progress" title="${reviewed} / ${totalAssets} 已审听">
            <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
            <span>${reviewed}/${totalAssets}</span>
        </div>
    `;
}

function renderFilters() {
    const scopeOptions = [
        ['all', '全部'],
        ...Object.keys(state.data.scopes).map((scopeId) => [scopeId, scopeLabel(scopeId)])
    ];
    const localeOptions = [...new Set(state.data.events.flatMap((event) => Object.keys(event.variants)))].map(
        (locale) => [locale, localeLabel(locale)]
    );
    elements.filterPanel.innerHTML = `
        <div class="search-field">
            <input id="event-search" type="search" placeholder="搜索事件、标题或 ID" value="${escapeHtml(state.query)}">
        </div>
        <div class="filter-grid">
            ${renderSelect('scope-filter', '故事线', state.scope, scopeOptions)}
            ${renderSelect('locale-filter', '语言', state.locale, localeOptions)}
            ${renderSelect('review-filter', '审听状态', state.reviewFilter, [
                ['all', '全部'],
                ['pending', '未审听'],
                ['pass', '通过'],
                ['revise', '需调整']
            ])}
            ${renderSelect('format-filter', '讲述形式', state.format, [
                ['all', '全部'],
                ['dialogue', '双人问答'],
                ['narration', '单人讲述'],
                ['hybrid', '混合形式']
            ])}
            ${renderSelect('closing-filter', '收尾方式', state.closing, [
                ['all', '全部'],
                ['summary', '明确总结'],
                ['open-question', '开放问题'],
                ['forward-hook', '向后引出'],
                ['historical-echo', '历史回响']
            ])}
        </div>
    `;

    document.querySelector('#event-search').addEventListener('input', (event) => {
        state.query = event.target.value;
        ensureSelection();
        renderEventList();
        renderDetail();
        renderPlayer();
    });
    bindSelect('#scope-filter', 'scope');
    bindSelect('#locale-filter', 'locale');
    bindSelect('#review-filter', 'reviewFilter');
    bindSelect('#format-filter', 'format');
    bindSelect('#closing-filter', 'closing');
}

function renderSelect(id, label, value, options) {
    return `
        <div class="field">
            <label for="${id}">${label}</label>
            <select id="${id}">
                ${options
                    .map(
                        ([optionValue, optionLabel]) =>
                            `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${optionLabel}</option>`
                    )
                    .join('')}
            </select>
        </div>
    `;
}

function bindSelect(selector, key) {
    document.querySelector(selector).addEventListener('change', (event) => {
        state[key] = event.target.value;
        ensureSelection();
        persistUiState();
        renderEventList();
        renderDetail();
        renderPlayer();
    });
}

function renderEventList() {
    const events = getFilteredEvents();
    elements.eventCount.textContent = `${events.length} 个事件`;
    const hasComparison = events.some((event) => localeVariant(event).revisionOptions?.length > 1);
    elements.activeVariantLabel.textContent = `${localeLabel(state.locale)} · ${hasComparison ? versionLabel(state.version) : '故事线音频'}`;

    if (!events.length) {
        elements.eventList.innerHTML = `
            <div class="empty-state"><strong>没有匹配事件</strong><span>调整筛选条件后重试</span></div>
        `;
        return;
    }

    elements.eventList.innerHTML = events
        .map((event) => {
            const variant = activeVariant(event);
            const review = activeReview(event);
            const primaryTitle = event.title[state.locale];
            const secondaryTitle = event.title[state.locale === 'zh' ? 'en' : 'zh'];
            return `
                <button class="event-row ${eventKey(event) === state.selectedKey ? 'is-selected' : ''}" type="button" data-event-key="${eventKey(event)}">
                    <span class="sequence-number">${String(event.sequenceIndex).padStart(2, '0')}</span>
                    <span class="event-copy">
                        <span class="event-title-line">${escapeHtml(primaryTitle)}</span>
                        <span class="event-secondary-line">${escapeHtml(secondaryTitle)} · ${escapeHtml(event.formatLabel[state.locale])}</span>
                    </span>
                    <span class="event-meta">
                        <span>${formatDuration(variant.audio.durationSec)}</span>
                        <span class="review-dot ${review.status}" title="${reviewStatusLabel(review.status)}"></span>
                    </span>
                </button>
            `;
        })
        .join('');

    elements.eventList.querySelectorAll('[data-event-key]').forEach((button) => {
        button.addEventListener('click', () => {
            state.selectedKey = button.dataset.eventKey;
            persistUiState();
            renderEventList();
            renderDetail();
            renderPlayer();
        });
    });
}

function renderDetail() {
    const event = selectedEvent();
    if (!event) {
        elements.reviewPane.innerHTML = `
            <div class="empty-state"><strong>没有可显示的事件</strong><span>请调整左侧筛选条件</span></div>
        `;
        return;
    }

    const variant = activeVariant(event);
    const quality = variant.quality;
    const warningCount = event.archiveAudit.warnings.length;
    const revisionOptions = localeVariant(event).revisionOptions || [];
    const localeOptions = Object.keys(event.variants).map((locale) => [locale, localeLabel(locale)]);
    elements.reviewPane.innerHTML = `
        <div class="detail-shell">
            <header class="detail-header">
                <div class="detail-title-block">
                    <span class="detail-eyebrow">${escapeHtml(scopeLabel(event.scopeId))} · ${event.year} · ${escapeHtml(event.eventId)}</span>
                    <h1>${escapeHtml(event.title[state.locale])}</h1>
                    <p class="detail-subtitle">${escapeHtml(event.title[state.locale === 'zh' ? 'en' : 'zh'])}</p>
                    <div class="detail-chips">
                        <span class="chip">${escapeHtml(event.formatLabel[state.locale])}</span>
                        <span class="chip">${escapeHtml(event.narrativeStyleLabel[state.locale])}</span>
                        <span class="chip">${escapeHtml(event.closingLabel[state.locale])}</span>
                        <span class="chip ${warningCount ? 'warning' : ''}">${warningCount ? `${warningCount} 项 Archive 复核提示` : 'Archive 已复核'}</span>
                        ${variant.revision ? `<span class="chip warning">候选修订 · ${escapeHtml(variant.revision.id)}</span>` : ''}
                    </div>
                </div>
                <div class="detail-actions">
                    ${
                        revisionOptions.length > 1
                            ? renderSegmented('version', [
                                  ['previous', '原版'],
                                  ['interactive', '互动增强版']
                              ])
                            : ''
                    }
                    ${localeOptions.length > 1 ? renderSegmented('locale', localeOptions) : ''}
                </div>
            </header>

            <section class="audio-overview" aria-label="当前音频指标">
                <div class="metric"><span>实际时长</span><strong>${formatDuration(quality.durationSec)}</strong></div>
                <div class="metric"><span>综合响度</span><strong>${quality.integratedLufs.toFixed(2)} LUFS</strong></div>
                <div class="metric"><span>峰值</span><strong>${quality.truePeakDbtp.toFixed(2)} dBTP</strong></div>
                <div class="metric"><span>机器校验</span><strong>${quality.passed ? '通过' : '未通过'}</strong></div>
            </section>

            <nav class="tab-list" aria-label="事件资料">
                ${renderTab('script', '文稿')}
                ${renderTab('sources', `来源 ${event.sources.length}`)}
                ${renderTab('quality', '音频质量')}
                ${renderTab('metadata', '元数据')}
            </nav>
            <div class="tab-content" id="tab-content"></div>
            <div id="review-form-root"></div>
        </div>
    `;

    bindSegmentedControls();
    elements.reviewPane.querySelectorAll('[data-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            state.activeTab = button.dataset.tab;
            persistUiState();
            elements.reviewPane.querySelectorAll('[data-tab]').forEach((tab) => {
                tab.classList.toggle('is-active', tab.dataset.tab === state.activeTab);
            });
            renderTabContent();
        });
    });
    renderTabContent();
    renderReviewForm();
}

function renderSegmented(name, options) {
    return `
        <div class="segmented" data-segmented="${name}">
            ${options
                .map(
                    ([value, label]) =>
                        `<button class="${state[name] === value ? 'is-active' : ''}" type="button" data-value="${value}">${label}</button>`
                )
                .join('')}
        </div>
    `;
}

function bindSegmentedControls() {
    elements.reviewPane.querySelectorAll('[data-segmented]').forEach((group) => {
        group.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => {
                state[group.dataset.segmented] = button.dataset.value;
                persistUiState();
                renderReleaseSummary();
                renderFilters();
                renderEventList();
                renderDetail();
                renderPlayer();
            });
        });
    });
}

function renderTab(tab, label) {
    return `<button class="tab-button ${state.activeTab === tab ? 'is-active' : ''}" type="button" data-tab="${tab}">${label}</button>`;
}

function renderTabContent() {
    const root = document.querySelector('#tab-content');
    const event = selectedEvent();
    if (!root || !event) return;

    const renderers = {
        script: renderScriptTab,
        sources: renderSourcesTab,
        quality: renderQualityTab,
        metadata: renderMetadataTab
    };
    root.innerHTML = renderers[state.activeTab](event);
    bindTabActions(root, event);
}

function renderScriptTab(event) {
    const variant = activeVariant(event);
    const turns = variant.turns;
    return `
        <div class="section-toolbar">
            <h2>${escapeHtml(variant.revision?.label || '故事线')}文稿</h2>
            <div class="detail-actions">
                <button class="button button-secondary" type="button" data-action="toggle-trace">${state.showTrace ? '隐藏溯源' : '显示溯源'}</button>
                <button class="button button-secondary" type="button" data-action="copy-script">复制文稿</button>
            </div>
        </div>
        <div class="turn-list">
            ${turns
                .map(
                    (turn) => `
                        <article class="turn">
                            <div class="turn-role">${escapeHtml(roleLabel(turn.role, state.locale))}<span>${escapeHtml(turn.role)}</span></div>
                            <div class="turn-body">
                                <p class="turn-text" lang="${state.locale}">${escapeHtml(turn.text)}</p>
                                ${
                                    state.showTrace
                                        ? `<div class="turn-trace">
                                            <span class="source-tag">${escapeHtml(turn.contentOrigin)}</span>
                                            ${turn.sourceIds.map((id) => `<span class="source-tag">${escapeHtml(id)}</span>`).join('')}
                                        </div>`
                                        : ''
                                }
                            </div>
                        </article>
                    `
                )
                .join('')}
        </div>
    `;
}

function renderSourcesTab(event) {
    return `
        <div class="section-toolbar"><h2>权威来源</h2><span class="quality-badge ${event.archiveAudit.status === 'needs-review' ? 'warning' : 'pass'}">${escapeHtml(event.archiveAudit.status)}</span></div>
        <div class="source-list">
            ${event.sources
                .map(
                    (source) => `
                        <article class="source-item" id="${escapeHtml(source.id)}">
                            <div>
                                <h3>${escapeHtml(source.title[state.locale])}</h3>
                                <p>${escapeHtml(source.label[state.locale])} · ${escapeHtml(source.reliability)} · ${escapeHtml(source.purpose)}</p>
                            </div>
                            <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">打开来源</a>
                        </article>
                    `
                )
                .join('')}
        </div>
    `;
}

function renderQualityTab(event) {
    const variant = activeVariant(event);
    const quality = variant.quality;
    const sample = variant.sampleAudit;
    const previews = state.data.release.previews;
    return `
        <div class="quality-grid">
            <section class="data-block">
                <h3>媒体参数</h3>
                ${dataRow('编码', quality.codec)}
                ${dataRow('采样率', `${quality.sampleRate} Hz`)}
                ${dataRow('声道', quality.channels === 1 ? '单声道' : quality.channels)}
                ${dataRow('码率', `${Math.round(quality.bitrate / 1000)} kbps`)}
                ${dataRow('文件大小', formatBytes(quality.sizeBytes))}
            </section>
            <section class="data-block">
                <h3>响度参数</h3>
                ${dataRow('综合响度', `${quality.integratedLufs.toFixed(2)} LUFS`)}
                ${dataRow('真实峰值', `${quality.truePeakDbtp.toFixed(2)} dBTP`)}
                ${dataRow('响度范围', `${quality.loudnessRangeLu.toFixed(2)} LU`)}
                ${dataRow('校验结论', quality.passed ? 'passed' : 'failed')}
                ${dataRow('问题数', quality.issues.length)}
            </section>
            <section class="data-block wide">
                <h3>Whisper 抽检</h3>
                ${
                    sample
                        ? `${dataRow('抽检状态', sample.passed ? 'passed' : 'failed')}
                           ${dataRow('时间轴覆盖', `${(sample.coverageRatio * 100).toFixed(2)}%`)}
                           ${dataRow('文本相似度', `${(sample.textSimilarity * 100).toFixed(2)}%`)}
                           ${dataRow('填充词', sample.fillerCount)}`
                        : '<p class="detail-subtitle">当前文件不在 10 个双语机器转写抽检样本中。</p>'
                }
            </section>
            <section class="data-block wide">
                <h3>连续审听样本</h3>
                <div class="preview-links">
                    ${
                        previews.length
                            ? previews
                                  .map(
                                      (preview) =>
                                          `<button class="button button-secondary" type="button" data-preview-path="${escapeHtml(preview.path)}" data-preview-locale="${preview.locale}">${localeLabel(preview.locale)} · ${formatDuration(preview.durationSec)}</button>`
                                  )
                                  .join('')
                            : '<p class="detail-subtitle">当前激活的 revision 未配置连续审听样本。</p>'
                    }
                </div>
            </section>
        </div>
    `;
}

function renderMetadataTab(event) {
    const variant = activeVariant(event);
    const voice = variant.voiceProfile;
    return `
        <div class="metadata-grid">
            <section class="data-block">
                <h3>编排</h3>
                ${dataRow('事件 ID', event.eventId)}
                ${dataRow('Variant', event.variantId)}
                ${dataRow('Style authority', event.styleAuthority)}
                ${dataRow('形式', event.format)}
                ${dataRow('叙事风格', event.narrativeStyle)}
                ${dataRow('收尾', event.closingType)}
                ${dataRow('目标时长', `${event.targetDurationSec}s`)}
            </section>
            <section class="data-block">
                <h3>声音配置</h3>
                ${dataRow('A', voice.voiceA)}
                ${dataRow('B / N', voice.voiceB)}
                ${dataRow('Summary', voice.voiceSummary)}
                ${dataRow('模型', 'seed-tts-2.0')}
                ${dataRow('版本', variant.revision?.label || '故事线音频')}
                ${dataRow('修订', variant.revision ? variant.revision.id : '正式候选母版')}
                ${
                    variant.revision?.reusedFrom
                        ? dataRow(
                              '故事线复用',
                              `${scopeLabel(variant.revision.reusedFrom.sourceScopeId)} → ${scopeLabel(variant.revision.reusedFrom.targetScopeId)}`
                          )
                        : ''
                }
            </section>
            <section class="data-block wide">
                <h3>音频文件</h3>
                <div class="path-row">
                    <span class="path-value">${escapeHtml(variant.audio.path)}</span>
                    <button class="button button-secondary" type="button" data-action="copy-path">复制路径</button>
                    <a class="button button-primary" href="/${escapeHtml(variant.audio.path)}" download>下载 MP3</a>
                </div>
            </section>
            <section class="data-block wide">
                <h3>Archive 复核提示</h3>
                ${event.archiveAudit.warnings.length ? event.archiveAudit.warnings.map((warning) => `<span class="chip warning">${escapeHtml(warning)}</span>`).join(' ') : '<span class="quality-badge pass">无</span>'}
            </section>
        </div>
    `;
}

function dataRow(label, value) {
    return `<div class="data-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function bindTabActions(root, event) {
    root.querySelector('[data-action="toggle-trace"]')?.addEventListener('click', () => {
        state.showTrace = !state.showTrace;
        persistUiState();
        renderTabContent();
    });
    root.querySelector('[data-action="copy-script"]')?.addEventListener('click', () => {
        const text = activeVariant(event)
            .turns.map((turn) => `${turn.role}: ${turn.text}`)
            .join('\n');
        copyText(text, '文稿已复制');
    });
    root.querySelector('[data-action="copy-path"]')?.addEventListener('click', () => {
        copyText(activeVariant(event).audio.path, '资源路径已复制');
    });
    root.querySelectorAll('[data-preview-path]').forEach((button) => {
        button.addEventListener('click', () => {
            loadAudioPath(
                button.dataset.previewPath,
                `${localeLabel(button.dataset.previewLocale)}连续审听样本`,
                'AI100 09–13 · 故事线版'
            );
            elements.audio.play().catch(() => {});
        });
    });
}

function renderReviewForm() {
    const root = document.querySelector('#review-form-root');
    const event = selectedEvent();
    if (!root || !event) return;
    const review = activeReview(event);
    root.innerHTML = `
        <section class="review-form">
            <div class="review-form-header">
                <h2>本音频审听记录</h2>
                <span class="autosave-label">${review.updatedAt ? `更新于 ${new Date(review.updatedAt).toLocaleString()}` : '尚未记录'}</span>
            </div>
            <div class="status-options">
                ${['pending', 'pass', 'revise']
                    .map(
                        (status) =>
                            `<button class="status-button ${review.status === status ? 'is-active' : ''}" type="button" data-review-status="${status}" data-status="${status}">${reviewStatusLabel(status)}</button>`
                    )
                    .join('')}
            </div>
            <div class="score-grid">
                ${SCORE_FIELDS.map(([key, label]) => renderScoreField(key, label, review.scores[key])).join('')}
            </div>
            <div class="issue-options">
                ${ISSUE_LABELS.map(
                    (issue) =>
                        `<button class="issue-button ${review.issues.includes(issue) ? 'is-active' : ''}" type="button" data-issue="${escapeHtml(issue)}">${escapeHtml(issue)}</button>`
                ).join('')}
            </div>
            <div class="notes-field">
                <label for="review-notes">备注</label>
                <textarea id="review-notes" placeholder="记录具体发音、时间点或修改建议">${escapeHtml(review.notes)}</textarea>
            </div>
        </section>
    `;

    root.querySelectorAll('[data-review-status]').forEach((button) => {
        button.addEventListener('click', () => {
            updateReview({ status: button.dataset.reviewStatus });
        });
    });
    root.querySelectorAll('[data-score-field]').forEach((button) => {
        button.addEventListener('click', () => {
            const current = activeReview(selectedEvent());
            updateReview({
                scores: {
                    ...current.scores,
                    [button.dataset.scoreField]: Number(button.dataset.scoreValue)
                }
            });
        });
    });
    root.querySelectorAll('[data-issue]').forEach((button) => {
        button.addEventListener('click', () => {
            const current = activeReview(selectedEvent());
            const issues = new Set(current.issues);
            if (issues.has(button.dataset.issue)) issues.delete(button.dataset.issue);
            else issues.add(button.dataset.issue);
            updateReview({ issues: [...issues] });
        });
    });
    let notesTimer;
    root.querySelector('#review-notes').addEventListener('input', (eventObject) => {
        clearTimeout(notesTimer);
        notesTimer = setTimeout(() => {
            updateReview({ notes: eventObject.target.value }, false);
        }, 350);
    });
}

function renderScoreField(key, label, value) {
    return `
        <div class="score-field">
            <label>${label}</label>
            <div class="score-options">
                ${[1, 2, 3, 4, 5]
                    .map(
                        (score) =>
                            `<button class="score-button ${value === score ? 'is-active' : ''}" type="button" data-score-field="${key}" data-score-value="${score}" aria-label="${label} ${score} 分">${score}</button>`
                    )
                    .join('')}
            </div>
        </div>
    `;
}

function updateReview(patch, rerender = true) {
    const event = selectedEvent();
    if (!event) return;
    const previousSelection = state.selectedKey;
    const path = activeVariant(event).audio.path;
    const current = activeReview(event);
    state.reviews[path] = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString()
    };
    saveStorage(REVIEW_STORAGE_KEY, state.reviews);
    ensureSelection();
    persistUiState();
    renderReleaseSummary();
    renderEventList();
    if (previousSelection !== state.selectedKey) {
        renderDetail();
        renderPlayer();
    } else if (rerender) {
        renderReviewForm();
    }
}

function renderPlayer() {
    const event = selectedEvent();
    if (!event) {
        elements.playerTitle.textContent = '等待选择事件';
        elements.playerSubtitle.textContent = '';
        return;
    }
    const variant = activeVariant(event);
    loadAudioPath(
        variant.audio.path,
        event.title[state.locale],
        `${scopeLabel(event.scopeId)} · ${localeLabel(state.locale)} · ${variant.revision?.label || '故事线音频'} · ${formatDuration(variant.audio.durationSec)}`
    );
}

function loadAudioPath(path, title, subtitle) {
    elements.playerTitle.textContent = title;
    elements.playerSubtitle.textContent = subtitle;
    if (state.currentAudioPath === path) return;

    if (state.currentAudioPath && Number.isFinite(elements.audio.currentTime)) {
        state.positions[state.currentAudioPath] = elements.audio.currentTime;
        saveStorage(POSITION_STORAGE_KEY, state.positions);
    }
    state.currentAudioPath = path;
    elements.audio.src = `/${path}`;
    elements.audio.load();
}

function selectAdjacent(direction, autoplay = false) {
    const events = getFilteredEvents();
    if (!events.length) return;
    const currentIndex = events.findIndex((event) => eventKey(event) === state.selectedKey);
    const nextIndex = Math.min(events.length - 1, Math.max(0, currentIndex + direction));
    if (nextIndex === currentIndex) return;
    state.selectedKey = eventKey(events[nextIndex]);
    persistUiState();
    renderEventList();
    renderDetail();
    renderPlayer();
    if (autoplay) elements.audio.play().catch(() => {});
}

async function copyText(text, successMessage) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.append(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }
        showToast(successMessage);
    } catch (_) {
        showToast('复制失败，请手动选择文本');
    }
}

let toastTimer;
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        elements.toast.classList.remove('is-visible');
    }, 1800);
}

function exportReviews() {
    const payload = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        sourceRelease: state.data.release.status,
        reviews: state.reviews
    };
    const blob = new window.Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ai-history-audio-review-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
}

async function importReviews(file) {
    try {
        const payload = JSON.parse(await file.text());
        if (!payload.reviews || typeof payload.reviews !== 'object') {
            throw new Error('Invalid review file');
        }
        state.reviews = { ...state.reviews, ...payload.reviews };
        saveStorage(REVIEW_STORAGE_KEY, state.reviews);
        renderReleaseSummary();
        renderEventList();
        renderReviewForm();
        showToast('审听记录已导入');
    } catch (_) {
        showToast('导入失败：文件格式不正确');
    }
}

function bindGlobalEvents() {
    elements.previousEvent.addEventListener('click', () => selectAdjacent(-1));
    elements.nextEvent.addEventListener('click', () => selectAdjacent(1));
    elements.autoNext.addEventListener('change', (event) => {
        state.autoNext = event.target.checked;
        persistUiState();
    });
    elements.audio.addEventListener('loadedmetadata', () => {
        const saved = state.positions[state.currentAudioPath];
        if (saved && saved < elements.audio.duration - 1) {
            elements.audio.currentTime = saved;
        }
    });
    let lastPositionSaveAt = 0;
    elements.audio.addEventListener('timeupdate', () => {
        if (!state.currentAudioPath) return;
        const now = Date.now();
        if (now - lastPositionSaveAt < 2000) return;
        lastPositionSaveAt = now;
        state.positions[state.currentAudioPath] = elements.audio.currentTime;
        saveStorage(POSITION_STORAGE_KEY, state.positions);
    });
    elements.audio.addEventListener('ended', () => {
        if (state.autoNext) selectAdjacent(1, true);
    });
    elements.exportReview.addEventListener('click', exportReviews);
    elements.importReview.addEventListener('click', () => elements.importReviewFile.click());
    elements.importReviewFile.addEventListener('change', (event) => {
        const [file] = event.target.files;
        if (file) importReviews(file);
        event.target.value = '';
    });
}

async function init() {
    bindGlobalEvents();
    try {
        const response = await fetch(DATA_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.data = await response.json();
        restoreUiState();
        ensureSelection();
        elements.autoNext.checked = state.autoNext;
        renderReleaseSummary();
        renderFilters();
        renderEventList();
        renderDetail();
        renderPlayer();
    } catch (error) {
        elements.reviewPane.innerHTML = `
            <div class="error-state">
                <strong>审听资料加载失败</strong>
                <span>${escapeHtml(error.message)}</span>
            </div>
        `;
    }
}

init();
