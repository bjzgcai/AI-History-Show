'use strict';

const DATA_URL = '/api/review-data';
const UI_STORAGE_KEY = 'ai-history-audio-review-ui-v1';
const POSITION_STORAGE_KEY = 'ai-history-audio-review-position-v1';

const state = {
    user: null,
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
    reviews: {},
    positions: loadStorage(POSITION_STORAGE_KEY, {}),
    currentAudioPath: null,
    reviewSaving: false
};

const elements = {
    loginScreen: document.querySelector('#login-screen'),
    loginForm: document.querySelector('#login-form'),
    loginToken: document.querySelector('#login-token'),
    loginError: document.querySelector('#login-error'),
    appShell: document.querySelector('#app-shell'),
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
    reviewerName: document.querySelector('#reviewer-name'),
    exportReview: document.querySelector('#export-review'),
    logout: document.querySelector('#logout'),
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

function createRequestId() {
    if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID();
    if (typeof window.crypto?.getRandomValues === 'function') {
        const bytes = window.crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    return `review-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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
    const revisionOptions = variant.revisionOptions || [];
    return revisionOptions.find((option) => option.revision?.kind === state.version) || revisionOptions[0] || variant;
}

function versionLabel(version) {
    return version === 'interactive' ? '互动增强版' : '原版';
}

function activeReview(event) {
    const variant = activeVariant(event);
    return (
        (variant && state.reviews[variant.candidateId]) || {
            status: 'pending',
            approved: false,
            passCount: 0,
            failCount: 0,
            recordCount: 0,
            records: []
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
    return { pending: '未审核', pass: '已通过', revise: '未通过' }[status];
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
    const variantsByCandidate = new Map(storylineVariants.map((variant) => [variant.candidateId, variant]));
    const validCandidateIds = new Set(variantsByCandidate.keys());
    const totalAssets = variantsByCandidate.size;
    const totalDurationSec = [...variantsByCandidate.values()].reduce(
        (total, variant) => total + variant.audio.durationSec,
        0
    );
    const reviewed = Object.entries(state.reviews).filter(
        ([candidateId, review]) => validCandidateIds.has(candidateId) && review.status === 'pass'
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
                ['pending', '未审核'],
                ['pass', '已通过'],
                ['revise', '未通过']
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
                                          `<button class="button button-secondary" type="button" data-preview-path="${escapeHtml(preview.path)}" data-preview-url="${escapeHtml(preview.reviewUrl)}" data-preview-locale="${preview.locale}">${localeLabel(preview.locale)} · ${formatDuration(preview.durationSec)}</button>`
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
                    <a class="button button-primary" href="${escapeHtml(variant.audio.reviewUrl)}" download>下载 MP3</a>
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
                'AI100 09–13 · 故事线版',
                button.dataset.previewUrl
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
    const records = review.records || [];
    root.innerHTML = `
        <section class="review-form">
            <div class="review-form-header">
                <div>
                    <h2>审核结论</h2>
                    <span class="autosave-label">任意一条有效通过记录即可使当前候选通过</span>
                </div>
                <span class="review-summary ${review.status}">${reviewStatusLabel(review.status)} · 通过 ${review.passCount} / 不通过 ${review.failCount}</span>
            </div>
            <div class="notes-field">
                <label for="review-notes">备注（可选）</label>
                <textarea id="review-notes" placeholder="可记录具体发音、时间点或修改建议"></textarea>
            </div>
            <div class="status-options">
                <button class="status-button" type="button" data-submit-review="fail" data-status="revise" ${state.reviewSaving ? 'disabled' : ''}>提交不通过</button>
                <button class="status-button" type="button" data-submit-review="pass" data-status="pass" ${state.reviewSaving ? 'disabled' : ''}>提交通过</button>
            </div>
            <div class="review-history">
                <div class="review-history-heading"><h3>审核历史</h3><span>${records.length} 条记录</span></div>
                ${
                    records.length
                        ? records
                              .map(
                                  (record) => `
                                    <article class="review-record ${record.invalidatedAt ? 'is-invalidated' : ''}">
                                        <div class="review-record-main">
                                            <span class="quality-badge ${record.result === 'pass' ? 'pass' : 'fail'}">${record.result === 'pass' ? '通过' : '不通过'}</span>
                                            <strong>${escapeHtml(record.reviewer.name)}</strong>
                                            <time>${new Date(record.createdAt).toLocaleString()}</time>
                                        </div>
                                        ${record.note ? `<p>${escapeHtml(record.note)}</p>` : ''}
                                        ${record.invalidatedAt ? `<span class="record-invalidated">已撤销：${escapeHtml(record.invalidationReason || '')}</span>` : ''}
                                        ${state.user?.role === 'admin' && !record.invalidatedAt ? `<button class="button button-secondary" type="button" data-invalidate-review="${record.id}">撤销记录</button>` : ''}
                                    </article>`
                              )
                              .join('')
                        : '<div class="empty-review-history">尚无审核记录</div>'
                }
            </div>
        </section>
    `;

    root.querySelectorAll('[data-submit-review]').forEach((button) => {
        button.addEventListener('click', () => submitReview(button.dataset.submitReview));
    });
    root.querySelectorAll('[data-invalidate-review]').forEach((button) => {
        button.addEventListener('click', () => invalidateReview(button.dataset.invalidateReview));
    });
}

async function submitReview(result) {
    const event = selectedEvent();
    if (!event || state.reviewSaving) return;
    const candidateId = activeVariant(event).candidateId;
    const note = document.querySelector('#review-notes')?.value || '';
    state.reviewSaving = true;
    renderReviewForm();
    try {
        const response = await apiFetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId, result, note, requestId: createRequestId() })
        });
        const payload = await response.json();
        state.reviews[candidateId] = payload.summary;
        renderReleaseSummary();
        renderEventList();
        const successMessage =
            result === 'pass'
                ? '已提交通过记录'
                : payload.summary.approved
                  ? '已记录不通过；已有通过记录，汇总仍为已通过'
                  : '已提交不通过记录';
        showToast(successMessage);
    } catch (error) {
        showToast(`提交失败：${error.message}`);
    } finally {
        state.reviewSaving = false;
        renderReviewForm();
    }
}

async function invalidateReview(recordId) {
    const reason = window.prompt('请输入撤销原因');
    if (!reason) return;
    try {
        const response = await apiFetch(`/api/reviews/${encodeURIComponent(recordId)}/invalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        const payload = await response.json();
        const candidateId = activeVariant(selectedEvent()).candidateId;
        state.reviews[candidateId] = payload.summary;
        renderReleaseSummary();
        renderEventList();
        renderReviewForm();
        showToast('审核记录已撤销');
    } catch (error) {
        showToast(`撤销失败：${error.message}`);
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

function loadAudioPath(path, title, subtitle, reviewUrl = '') {
    elements.playerTitle.textContent = title;
    elements.playerSubtitle.textContent = subtitle;
    if (state.currentAudioPath === path) return;

    if (state.currentAudioPath && Number.isFinite(elements.audio.currentTime)) {
        state.positions[state.currentAudioPath] = elements.audio.currentTime;
        saveStorage(POSITION_STORAGE_KEY, state.positions);
    }
    state.currentAudioPath = path;
    const candidate = selectedEvent() ? activeVariant(selectedEvent()) : null;
    elements.audio.src = reviewUrl || (candidate?.audio.path === path ? candidate.audio.reviewUrl : path);
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

async function apiFetch(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    if (response.ok) return response;
    let message = `HTTP ${response.status}`;
    try {
        message = (await response.json()).error || message;
    } catch (_) {}
    if (response.status === 401 && state.user) {
        showLoginScreen('会话已过期，请重新登录。');
    }
    throw new Error(message);
}

function showLoginScreen(message = '') {
    state.user = null;
    elements.audio.pause();
    elements.audio.removeAttribute('src');
    elements.appShell.hidden = true;
    elements.loginScreen.hidden = false;
    elements.loginError.textContent = message;
    elements.loginToken.focus();
}

async function exportReviews() {
    try {
        const response = await apiFetch('/api/reviews/export');
        const payload = await response.json();
        downloadJson(payload, `ai-history-audio-review-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (error) {
        showToast(`导出失败：${error.message}`);
    }
}

function downloadJson(payload, fileName) {
    const blob = new window.Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
}

async function login(token) {
    const response = await apiFetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return (await response.json()).user;
}

async function loadApplication(user) {
    state.user = user;
    elements.reviewerName.textContent = `${user.name}${user.role === 'admin' ? ' · 管理员' : ''}`;
    elements.loginScreen.hidden = true;
    elements.appShell.hidden = false;
    try {
        const [dataResponse, reviewsResponse] = await Promise.all([apiFetch(DATA_URL), apiFetch('/api/reviews')]);
        state.data = await dataResponse.json();
        state.reviews = (await reviewsResponse.json()).reviews || {};
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
    elements.logout.addEventListener('click', async () => {
        try {
            await apiFetch('/api/auth/session', { method: 'DELETE' });
        } finally {
            window.location.reload();
        }
    });
    elements.loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        elements.loginError.textContent = '';
        const submit = elements.loginForm.querySelector('button[type="submit"]');
        submit.disabled = true;
        try {
            const user = await login(elements.loginToken.value);
            elements.loginToken.value = '';
            await loadApplication(user);
        } catch (error) {
            elements.loginError.textContent = error.message;
        } finally {
            submit.disabled = false;
        }
    });
}

async function init() {
    bindGlobalEvents();
    try {
        const response = await apiFetch('/api/auth/session');
        const user = (await response.json()).user;
        if (!user) throw new Error('需要登录');
        await loadApplication(user);
    } catch (_) {
        showLoginScreen();
    }
}

init();
