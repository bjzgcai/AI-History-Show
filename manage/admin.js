'use strict';

const state = {
    type: 'events',
    entities: [],
    entityId: '',
    file: '',
    eventSection: 'basic',
    document: null,
    revision: '',
    creatingFigure: false,
    figureOptions: [],
    eventOptions: [],
    figureListRevision: '',
    figureAssets: [],
    figureUsage: null,
    assetMergeSelection: new Set(),
    assetMergeCanonical: '',
    eventDisplayTargets: [],
    eventPresentationOpen: false,
    mergePreview: null,
    taskRunning: false
};

const structuredEventFiles = new Set(['event.json', 'claims.json', 'sources.json', 'assets.json', 'quizzes.json']);

const elements = Object.fromEntries(
    [
        'entityType',
        'entityList',
        'figureAlphabet',
        'entitySearch',
        'entityCount',
        'newFigureBtn',
        'fileSelect',
        'eventDisplayActions',
        'eventDisplayTarget',
        'inspectEventPresentationBtn',
        'restorePresentationInheritanceBtn',
        'openEventDisplayBtn',
        'eventPresentationPanel',
        'eventPresentationSummary',
        'eventPresentationPreview',
        'editor',
        'status',
        'currentEntity',
        'workspaceToolbar',
        'validationOutput',
        'figurePanel',
        'relationPanel',
        'structuredPanel',
        'structuredTitle',
        'structuredSummary',
        'structuredFieldHint',
        'structuredEditor',
        'eventContext',
        'eventContextYear',
        'eventContextUsage',
        'eventContextTitle',
        'eventContextSummary',
        'eventContextTags',
        'eventSectionNav',
        'eventVariantSelect',
        'storylineOverviewPanel',
        'storylineOverviewKicker',
        'storylineOverviewTitle',
        'storylineOverviewSummary',
        'storylineOverviewStats',
        'storylineTimeline',
        'auditPanel',
        'jsonPanel',
        'figureUsage',
        'figureAssetCount',
        'figureAssetMergeSummary',
        'figureAssetMergeBtn',
        'figureAssetGallery',
        'figureAssetEmpty',
        'figureEventCount',
        'figureEventList',
        'figureEventEmpty',
        'relationRows',
        'addFigureSelect',
        'auditSummary',
        'auditCategories',
        'emptyState',
        'figureReviewBadge',
        'avatarPreview',
        'avatarPlaceholder',
        'loadBtn',
        'saveBtn',
        'saveValidateBtn',
        'validateBtn',
        'generateBtn',
        'addFigureBtn',
        'mergeTargetSelect',
        'mergePreview',
        'mergePreviewBtn',
        'mergeExecuteBtn',
        'imageImportFile',
        'imageImportPreview',
        'imageImportPlaceholder',
        'imageImportEvent',
        'imageImportAssetId',
        'imageImportSourceId',
        'imageImportRole',
        'imageImportCaptionEn',
        'imageImportCaptionZh',
        'imageImportSubcaptionEn',
        'imageImportSubcaptionZh',
        'imageImportSourceNameEn',
        'imageImportSourceNameZh',
        'imageImportSourceUrl',
        'imageImportRightsStatus',
        'imageImportSetDefault',
        'imageImportLicenseEn',
        'imageImportLicenseZh',
        'imageImportUsageEn',
        'imageImportUsageZh',
        'imageImportBtn',
        'figureAliasesField',
        'figureDisambiguationEnField',
        'figureDisambiguationZhField',
        'figureOrganizationsField',
        'figureProfileSourcesField',
        'figureAvatarHeading',
        'figureAvatarEditor',
        'avatarStyleField'
    ].map((id) => [id, document.getElementById(id)])
);

const figureFieldIds = [
    'figureId',
    'figureType',
    'figureNameEn',
    'figureNameZh',
    'figureAliases',
    'figureDisambiguationEn',
    'figureDisambiguationZh',
    'figureOrganizations',
    'figureProfileSources',
    'avatarPath',
    'avatarSourceNameEn',
    'avatarSourceNameZh',
    'avatarSourceUrl',
    'avatarRightsStatus',
    'avatarStyle',
    'avatarLicenseEn',
    'avatarLicenseZh',
    'avatarUsageEn',
    'avatarUsageZh',
    'reviewStatus',
    'reviewedAt',
    'reviewer',
    'reviewNotesEn',
    'reviewNotesZh'
];
for (const id of figureFieldIds) elements[id] = document.getElementById(id);

function setStatus(text, className = '') {
    elements.status.textContent = text;
    elements.status.className = `status ${className}`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(
        /[&<>"']/g,
        (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
    );
}

async function api(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({ error: response.statusText }));
    if (!response.ok || data.error) {
        const error = new Error(data.error || response.statusText);
        error.status = response.status;
        throw error;
    }
    return data;
}

function splitLines(value) {
    return String(value || '')
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function localize(value, locale) {
    if (!value || typeof value !== 'object') return '';
    return value[locale] || value[locale === 'en' ? 'zh' : 'en'] || '';
}

function figureLabel(figure) {
    const name = `${localize(figure.name, 'zh')} / ${localize(figure.name, 'en')}`.replace(/^\s*\/\s*|\s*\/\s*$/g, '');
    return `${name || figure.id} · ${figure.id}`;
}

function figureSortName(figure) {
    return localize(figure.name, 'en') || localize(figure.name, 'zh') || figure.id;
}

function figureInitial(figure) {
    const normalized = figureSortName(figure)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    const match = normalized.match(/[a-z]/i);
    return match ? match[0].toUpperCase() : '#';
}

function eventYear(event) {
    return String(event.year || '').trim() || '#';
}

function entityIndexKey(entity) {
    if (state.type === 'figures') return figureInitial(entity);
    if (state.type === 'events') return eventYear(entity);
    return '';
}

function isVariantFile() {
    return state.type === 'events' && state.file.startsWith('variants/');
}

function isStructuredEventFile() {
    return state.type === 'events' && (structuredEventFiles.has(state.file) || isVariantFile());
}

function updatePanelVisibility() {
    const eventLoaded = state.type === 'events' && Boolean(state.document);
    const structuredSections = new Set(['basic', 'presentation', 'claims', 'sources', 'assets', 'quizzes']);
    elements.figurePanel.hidden = state.type !== 'figures' || !state.document;
    elements.relationPanel.hidden = !eventLoaded || state.eventSection !== 'people';
    elements.structuredPanel.hidden = !eventLoaded || !structuredSections.has(state.eventSection);
    elements.eventPresentationPanel.hidden =
        !eventLoaded || state.eventSection !== 'presentation' || !state.eventPresentationOpen;
    elements.auditPanel.hidden = state.type !== 'audit';
    elements.jsonPanel.hidden =
        state.type === 'audit' || !state.document || (state.type === 'events' && state.eventSection !== 'advanced');
    if (state.type === 'events') elements.jsonPanel.open = state.eventSection === 'advanced';
    elements.fileSelect.hidden = true;
    elements.eventContext.hidden = state.type !== 'events' || !state.entityId;
    elements.eventSectionNav.hidden = state.type !== 'events' || !state.document;
    elements.storylineOverviewPanel.hidden = state.type !== 'storylines' || !state.entityId;
    elements.eventDisplayActions.hidden = state.type !== 'events' || !state.document;
    elements.newFigureBtn.hidden = state.type !== 'figures';
    elements.loadBtn.hidden = state.type === 'audit';
    elements.saveBtn.hidden = state.type === 'audit';
    elements.saveValidateBtn.hidden = state.type === 'audit';
    elements.emptyState.hidden =
        state.type === 'audit' || Boolean(state.document) || (state.type === 'storylines' && Boolean(state.entityId));
    elements.loadBtn.disabled = state.type !== 'audit' && !state.entityId;
    elements.saveBtn.disabled = state.type !== 'audit' && !state.document;
    elements.saveValidateBtn.disabled = state.type !== 'audit' && !state.document;
}

function updateStickyOffsets() {
    const header = document.querySelector('header');
    const headerStyle = window.getComputedStyle(header);
    const headerOffset = headerStyle.position === 'sticky' ? header.offsetHeight : 0;
    const toolbarOffset = elements.workspaceToolbar.offsetHeight;
    document.documentElement.style.setProperty('--event-nav-sticky-top', `${headerOffset + toolbarOffset}px`);
}

function eventSectionForFile(file) {
    const normalizedFile = String(file || '');
    return (
        {
            'event.json': 'basic',
            'claims.json': 'claims',
            'sources.json': 'sources',
            'assets.json': 'assets',
            'quizzes.json': 'quizzes'
        }[normalizedFile] || (normalizedFile.startsWith('variants/') ? 'presentation' : 'basic')
    );
}

function eventFileLabel(file) {
    if (file === 'event.json') return '基本资料';
    if (file === 'claims.json') return '事实主张';
    if (file === 'sources.json') return '来源';
    if (file === 'assets.json') return '资产与音频';
    if (file === 'quizzes.json') return 'Quiz';
    if (file.startsWith('variants/')) return `展示覆盖 · ${file.slice('variants/'.length, -'.json'.length)}`;
    return file;
}

function selectEventFile(file, section = eventSectionForFile(file)) {
    const entity = state.entities.find((item) => item.id === state.entityId);
    if (!entity || !entity.files.includes(file)) return;
    state.eventSection = section;
    state.file = file;
    elements.fileSelect.value = file;
    loadEntity().catch((error) => setStatus(error.message, 'bad'));
}

async function activateEventSection(section) {
    if (state.type !== 'events' || !state.entityId) return;
    const entity = state.entities.find((item) => item.id === state.entityId);
    const files = (entity && entity.files) || [];
    let file = state.file;
    if (section === 'basic' || section === 'people') file = 'event.json';
    else if (section === 'presentation') {
        const variantFiles = files.filter((candidate) => candidate.startsWith('variants/'));
        file = elements.eventVariantSelect.value || variantFiles[0] || 'event.json';
    } else if (section === 'advanced') {
        state.eventSection = 'advanced';
        updatePanelVisibility();
        renderEventSectionNav();
        return;
    } else {
        file = {
            claims: 'claims.json',
            sources: 'sources.json',
            assets: 'assets.json',
            quizzes: 'quizzes.json'
        }[section];
    }
    if (!file || !files.includes(file)) return;
    state.eventSection = section;
    if (state.file !== file || !state.document) {
        state.file = file;
        elements.fileSelect.value = file;
        await loadEntity();
        return;
    }
    updatePanelVisibility();
    renderEventSectionNav();
    renderStructuredEditor();
    if (section === 'people') await renderRelations();
}

function renderEventContext() {
    if (state.type !== 'events' || !state.entityId) {
        elements.eventContext.hidden = true;
        return;
    }
    const entity = state.entities.find((item) => item.id === state.entityId) || {};
    const title = localize(entity.title, 'zh') || localize(entity.title, 'en') || state.entityId;
    const rawDescription =
        localize(entity.summary, 'zh') ||
        localize(entity.summary, 'en') ||
        localize(entity.description, 'zh') ||
        localize(entity.description, 'en') ||
        '事件内容维护';
    const description = rawDescription
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    elements.eventContextYear.textContent = entity.year ? String(entity.year) : '未设置年份';
    elements.eventContextUsage.textContent = entity.usageCount ? `${entity.usageCount} 条故事线引用` : '尚未加入故事线';
    elements.eventContextTitle.textContent = title;
    elements.eventContextSummary.textContent = description;
    elements.eventContextTags.innerHTML = [
        `<span class="context-tag">${escapeHtml(state.entityId)}</span>`,
        `<span class="context-tag">${escapeHtml(entity.files ? `${entity.files.length} 个内容文件` : '')}</span>`,
        ...(entity.variants || []).map(
            (variant) => `<span class="context-tag is-soft">variant: ${escapeHtml(variant)}</span>`
        )
    ].join('');
    elements.eventContext.hidden = false;
}

function renderEventSectionNav() {
    if (state.type !== 'events' || !state.document) {
        elements.eventSectionNav.hidden = true;
        return;
    }
    const entity = state.entities.find((item) => item.id === state.entityId);
    const files = (entity && entity.files) || [];
    const variantFiles = files.filter((file) => file.startsWith('variants/'));
    const variantNav = elements.eventSectionNav.querySelector('[data-event-file="variants"]');
    const variantSelect = elements.eventVariantSelect;
    if (variantNav) variantNav.hidden = !files.includes('event.json') && variantFiles.length === 0;
    if (variantSelect) {
        const presentationFiles = [
            ...(files.includes('event.json') ? [['event.json', '默认展示配置']] : []),
            ...variantFiles.map((file) => [file, eventFileLabel(file)])
        ];
        variantSelect.innerHTML = presentationFiles
            .map(([file, label]) => `<option value="${escapeHtml(file)}">${escapeHtml(label)}</option>`)
            .join('');
        variantSelect.value =
            state.eventSection === 'presentation' && presentationFiles.some(([file]) => file === state.file)
                ? state.file
                : presentationFiles[0]?.[0] || '';
        variantSelect.hidden = presentationFiles.length < 2;
    }
    for (const button of elements.eventSectionNav.querySelectorAll('button[data-event-section]')) {
        const target = button.dataset.eventFile;
        const section = button.dataset.eventSection;
        if (section === 'presentation') {
            button.hidden = false;
        } else if (section === 'people') {
            button.hidden = !files.includes('event.json');
        } else {
            button.hidden = target === 'advanced' ? false : !files.includes(target);
        }
        button.classList.toggle('is-active', state.eventSection === section);
    }
    elements.eventSectionNav.hidden = false;
}

function renderStorylineOverview() {
    if (!elements.storylineOverviewPanel) return;
    const entity = state.entities.find((item) => item.id === state.entityId);
    if (state.type !== 'storylines' || !entity || !state.entityId) {
        elements.storylineOverviewPanel.hidden = true;
        elements.storylineTimeline.innerHTML = '';
        return;
    }
    const title = localize(entity.title, 'zh') || localize(entity.title, 'en') || entity.id;
    const subtitle = localize(entity.subtitle, 'zh') || localize(entity.subtitle, 'en') || '按 Storyline 顺序维护事件';
    const events = [...(entity.events || [])].sort(
        (left, right) => Number(left.order) - Number(right.order) || left.eventId.localeCompare(right.eventId)
    );
    elements.storylineOverviewKicker.textContent = `STORYLINE · ${entity.id}`;
    elements.storylineOverviewTitle.textContent = title;
    elements.storylineOverviewSummary.textContent = subtitle;
    elements.storylineOverviewStats.innerHTML = [
        `<span class="storyline-stat"><strong>${entity.enabledEventCount || 0}</strong><small>启用事件</small></span>`,
        `<span class="storyline-stat"><strong>${entity.totalEventCount || 0}</strong><small>全部事件</small></span>`
    ].join('');
    elements.storylineTimeline.innerHTML = events.length
        ? events
              .map((event, index) => {
                  const eventTitle = localize(event.title, 'zh') || localize(event.title, 'en') || event.eventId;
                  const status = event.enabled ? '启用' : '停用';
                  const stateClass = event.enabled ? 'is-enabled' : 'is-disabled';
                  const variant = event.variant
                      ? `<span class="storyline-timeline-variant">variant: ${escapeHtml(event.variant)}</span>`
                      : '';
                  return `<button type="button" class="storyline-timeline-item ${stateClass}" data-open-event="${escapeHtml(event.eventId)}" data-open-file="event.json">
                      <span class="storyline-timeline-marker"><span>${String(index + 1).padStart(2, '0')}</span></span>
                      <span class="storyline-timeline-content">
                          <span class="storyline-timeline-meta"><span>${escapeHtml(event.year || '未设置年份')}</span><span>${escapeHtml(event.eventId)}</span>${variant}</span>
                          <strong>${escapeHtml(eventTitle)}</strong>
                          <span class="storyline-timeline-status">${status}</span>
                      </span>
                      <span class="entity-chevron">›</span>
                  </button>`;
              })
              .join('')
        : '<div class="storyline-empty">当前 Storyline 尚未配置事件。</div>';
    elements.storylineOverviewPanel.hidden = false;
}

function entityMatchesSearch(entity, query) {
    if (!query) return true;
    if (state.type === 'figures') {
        const text = [entity.id, localize(entity.name, 'en'), localize(entity.name, 'zh'), ...(entity.aliases || [])]
            .join(' ')
            .toLowerCase();
        return text.includes(query);
    }
    const id = typeof entity === 'string' ? entity : entity.id;
    if (state.type === 'events') {
        return [id, entity.year, localize(entity.title, 'zh'), localize(entity.title, 'en')]
            .join(' ')
            .toLowerCase()
            .includes(query);
    }
    if (state.type !== 'storylines') return id.toLowerCase().includes(query);
    const searchable = [
        id,
        localize(entity.title, 'zh'),
        localize(entity.title, 'en'),
        localize(entity.subtitle, 'zh'),
        localize(entity.subtitle, 'en')
    ];
    return searchable.join(' ').toLowerCase().includes(query);
}

function renderEntities() {
    const query = elements.entitySearch.value.trim().toLowerCase();
    const visible = state.entities.filter((entity) => entityMatchesSearch(entity, query));
    if (state.type === 'figures') {
        visible.sort(
            (left, right) =>
                figureInitial(left).localeCompare(figureInitial(right), 'en') ||
                figureSortName(left).localeCompare(figureSortName(right), 'en', {
                    sensitivity: 'base',
                    numeric: true
                }) ||
                left.id.localeCompare(right.id)
        );
    } else if (state.type === 'events') {
        visible.sort(
            (left, right) =>
                eventYear(left).localeCompare(eventYear(right), 'en', { numeric: true }) ||
                left.id.localeCompare(right.id)
        );
    }
    elements.entityCount.textContent = String(visible.length);
    const indexKeys = ['events', 'figures'].includes(state.type) ? [...new Set(visible.map(entityIndexKey))] : [];
    elements.figureAlphabet.hidden = indexKeys.length === 0;
    elements.figureAlphabet.setAttribute('aria-label', state.type === 'events' ? '事件年份索引' : '人物首字母索引');
    elements.figureAlphabet.classList.toggle('is-years', state.type === 'events');
    elements.figureAlphabet.innerHTML = indexKeys
        .map(
            (indexKey) =>
                `<button type="button" data-entity-index="${escapeHtml(indexKey)}" title="跳转到 ${escapeHtml(indexKey)}">${escapeHtml(indexKey)}</button>`
        )
        .join('');
    elements.entityList.classList.toggle('has-alphabet', state.type === 'figures' && indexKeys.length > 0);
    elements.entityList.classList.toggle('has-year-index', state.type === 'events' && indexKeys.length > 0);
    let previousIndexKey = '';
    elements.entityList.innerHTML = visible
        .map((entity) => {
            const id = typeof entity === 'string' ? entity : entity.id;
            if (state.type === 'storylines') {
                const storylineTitle = localize(entity.title, 'zh') || localize(entity.title, 'en') || id;
                const storylineSubtitle = localize(entity.subtitle, 'zh') || localize(entity.subtitle, 'en') || '';
                return `<button type="button" class="storyline-picker-card${id === state.entityId ? ' active' : ''}" data-storyline-id="${escapeHtml(id)}">
                    <span class="storyline-picker-icon">${escapeHtml(storylineTitle.slice(0, 1))}</span>
                    <span class="storyline-picker-copy">
                        <span class="storyline-picker-title">${escapeHtml(storylineTitle)}</span>
                        <span class="storyline-picker-id">${escapeHtml(id)}</span>
                        ${storylineSubtitle ? `<span class="storyline-picker-subtitle">${escapeHtml(storylineSubtitle)}</span>` : ''}
                    </span>
                    <span class="storyline-picker-count">${entity.enabledEventCount}/${entity.totalEventCount}</span>
                    <span class="entity-chevron">›</span>
                </button>`;
            }
            const indexKey = entityIndexKey(entity);
            const letterDivider =
                indexKey && indexKey !== previousIndexKey
                    ? `<div class="entity-letter-divider" data-index-group="${escapeHtml(indexKey)}"><span>${escapeHtml(indexKey)}</span></div>`
                    : '';
            previousIndexKey = indexKey;
            let title = id;
            let detail = '';
            let preview = '';
            if (state.type === 'events') {
                title = localize(entity.title, 'zh') || localize(entity.title, 'en') || id;
                detail = `${entity.year || '未设置年份'} · ${id} · ${entity.usageCount} 个故事线`;
            }
            if (state.type === 'figures') {
                title = `${localize(entity.name, 'zh') || localize(entity.name, 'en')} · ${id}`;
                detail = `${entity.type} · ${entity.reviewStatus || 'draft'} · ${entity.usedEventCount} 个展示事件 · ${entity.assetCount} 个唯一资产`;
                if (entity.defaultAvatar) {
                    const source = /^https?:\/\//i.test(entity.defaultAvatar)
                        ? entity.defaultAvatar
                        : `/${entity.defaultAvatar}`;
                    preview = `<span class="entity-avatar-frame"><img class="entity-avatar" src="${escapeHtml(source)}" alt="" loading="lazy" data-avatar-style="${escapeHtml(entity.defaultAvatarStyle || '')}"></span>`;
                }
            }
            const fallbackSource =
                state.type === 'events'
                    ? id.slice(0, 4)
                    : localize(entity.name, 'zh') || localize(entity.name, 'en') || id;
            const fallback = fallbackSource
                .replace(/[^a-z0-9\u3400-\u9fff]/gi, '')
                .slice(0, state.type === 'events' ? 4 : 2)
                .toUpperCase();
            const thumb = preview || `<span class="entity-placeholder">${escapeHtml(fallback || 'A')}</span>`;
            const usageLabel = entity.used ? '已使用' : '未使用';
            const usageTitle = entity.used
                ? `${state.type === 'figures' ? `${entity.usageCount} 个事件正在使用该人物` : `${entity.usageCount} 个展示成员`}`
                : '当前未进入实际展示链路';
            const alphaBadge =
                state.type === 'figures' ? `<span class="entity-alpha">${escapeHtml(indexKey)}</span>` : '';
            return `${letterDivider}<button class="entity${id === state.entityId ? ' active' : ''}" data-id="${escapeHtml(id)}">${thumb}<span class="entity-copy"><span class="entity-name-row"><span class="entity-name-group">${alphaBadge}<span class="entity-name">${escapeHtml(title)}</span></span><span class="entity-usage ${entity.used ? 'is-used' : 'is-unused'}" title="${escapeHtml(usageTitle)}"><span class="entity-usage-dot"></span>${usageLabel}</span></span><span class="entity-meta">${escapeHtml(detail)}</span></span><span class="entity-chevron">›</span></button>`;
        })
        .join('');
    for (const image of elements.entityList.querySelectorAll('.entity-avatar[data-avatar-style]')) {
        image.style.cssText = image.dataset.avatarStyle || '';
    }
}

async function loadFigureOptions(force = false) {
    if (!force && state.figureOptions.length) return;
    state.figureOptions = await api('/api/archive/figure-options');
    state.figureOptions.sort((left, right) => figureLabel(left).localeCompare(figureLabel(right), 'zh-CN'));
}

async function loadEventOptions(force = false) {
    if (!force && state.eventOptions.length) return;
    state.eventOptions = await api('/api/archive/events');
}

async function refresh() {
    state.entityId = '';
    state.document = null;
    state.revision = '';
    state.creatingFigure = false;
    state.figureAssets = [];
    state.figureUsage = null;
    state.eventDisplayTargets = [];
    if (state.type === 'events') state.eventSection = 'basic';
    elements.currentEntity.textContent = '尚未选择实体';
    elements.editor.value = '';
    elements.structuredEditor.innerHTML = '';
    if (state.type === 'events') state.entities = await api('/api/archive/events');
    if (state.type === 'storylines') state.entities = await api('/api/archive/storylines');
    if (state.type === 'figures') {
        const result = await api('/api/archive/figures');
        state.entities = result.items;
        state.figureListRevision = result.revision;
        state.figureOptions = result.items;
    }
    if (state.type === 'audit') {
        state.entities = [];
        await loadAudit();
    }
    renderEntities();
    updatePanelVisibility();
    renderEventContext();
    renderEventSectionNav();
    renderStorylineOverview();
}

function selectEntity(id) {
    state.entityId = id;
    state.document = null;
    state.revision = '';
    state.creatingFigure = false;
    state.assetMergeSelection.clear();
    state.assetMergeCanonical = '';
    state.eventPresentationOpen = false;
    if (state.type === 'events') {
        const entity = state.entities.find((item) => item.id === id);
        const files = entity ? entity.files : [];
        elements.fileSelect.innerHTML = files
            .map((file) => `<option value="${escapeHtml(file)}">${escapeHtml(file)}</option>`)
            .join('');
        state.file = files.includes('event.json') ? 'event.json' : files[0] || '';
        state.eventSection = eventSectionForFile(state.file);
        elements.fileSelect.value = state.file;
        state.eventDisplayTargets = [];
    } else {
        state.file = '';
    }
    renderEntities();
    updatePanelVisibility();
    renderStorylineOverview();
}

function syncEditor() {
    elements.editor.value = state.document ? JSON.stringify(state.document, null, 2) : '';
}

function cloneJson(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function setPath(value, path, nextValue) {
    const keys = String(path).split('.');
    const lastKey = keys.pop();
    let current = value;
    for (const key of keys) {
        if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
            current[key] = /^\d+$/.test(key) ? [] : {};
        }
        current = current[key];
    }
    current[lastKey] = nextValue;
}

function localizedValue(value, locale) {
    return localize(value, locale);
}

function formInput(label, path, value, options = {}) {
    const type = options.type || 'text';
    const format = options.format || 'text';
    const classes = [options.span ? 'span-2' : '', type === 'checkbox' ? 'structured-checkbox-field' : ''].filter(
        Boolean
    );
    const className = classes.length ? ` class="${classes.join(' ')}"` : '';
    const checked = type === 'checkbox' && value === true ? ' checked' : '';
    const disabled = options.disabled ? ' disabled' : '';
    const inputValue = type === 'checkbox' ? '' : ` value="${escapeHtml(value ?? '')}"`;
    return `<label${className}>${escapeHtml(label)}<input type="${type}" data-structured-field="${escapeHtml(path)}" data-structured-format="${format}"${inputValue}${checked}${disabled}></label>`;
}

function formTextarea(label, path, value, options = {}) {
    const className = options.span ? ' class="span-2"' : '';
    const textareaClass = options.className || '';
    return `<label${className}>${escapeHtml(label)}<textarea class="${textareaClass}" data-structured-field="${escapeHtml(path)}" data-structured-format="${escapeHtml(options.format || 'text')}">${escapeHtml(value ?? '')}</textarea></label>`;
}

function formSelect(label, path, value, options, config = {}) {
    const className = config.span ? ' class="span-2"' : '';
    const selectedOptions = options
        .map(
            ([optionValue, optionLabel]) =>
                `<option value="${escapeHtml(optionValue)}"${String(optionValue) === String(value ?? '') ? ' selected' : ''}>${escapeHtml(optionLabel)}</option>`
        )
        .join('');
    return `<label${className}>${escapeHtml(label)}<select data-structured-field="${escapeHtml(path)}" data-structured-format="${escapeHtml(config.format || 'text')}">${selectedOptions}</select></label>`;
}

function localizedFields(prefix, value, options = {}) {
    return `${formTextarea(`${options.label || '内容'}（中文）`, `${prefix}.zh`, localizedValue(value, 'zh'), { className: options.className || 'short', span: options.span })}${formTextarea(`${options.label || '内容'}（英文）`, `${prefix}.en`, localizedValue(value, 'en'), { className: options.className || 'short', span: options.span })}`;
}

function hasLocalizedValue(value) {
    return Boolean(localizedValue(value, 'zh').trim() || localizedValue(value, 'en').trim());
}

function renderEventForm(event) {
    const location = event.location || {};
    const coordinates = Array.isArray(location.coordinates) ? location.coordinates : [];
    const review = event.review || {};
    const notes = review.notes || {};
    return `<section class="structured-section"><div class="section-heading"><div><h3>事件基本信息</h3><p class="muted">维护事件事实和页面基础资料。人物关系仍在下方单独编辑。</p></div></div><div class="form-grid">
        ${formInput('事件 ID', 'id', event.id, { disabled: true })}
        ${formInput('年份', 'year', event.year, { format: 'year' })}
        ${formInput('日期', 'date', event.date)}
        ${formInput('正式事件', 'canonical', event.canonical, { type: 'checkbox', format: 'boolean' })}
        ${localizedFields('title', event.title, { label: '标题', className: 'short' })}
        ${hasLocalizedValue(event.summary) ? localizedFields('summary', event.summary, { label: '摘要', className: 'short' }) : ''}
        ${localizedFields('description', event.description, { label: '描述', className: 'medium', span: true })}
        ${formInput('地区 ID', 'location.regionId', location.regionId)}
        ${formInput('地点（中文）', 'location.place.zh', localizedValue(location.place, 'zh'))}
        ${formInput('地点（英文）', 'location.place.en', localizedValue(location.place, 'en'))}
        ${formInput('国家（中文）', 'location.country.zh', localizedValue(location.country, 'zh'))}
        ${formInput('国家（英文）', 'location.country.en', localizedValue(location.country, 'en'))}
        ${formInput('纬度', 'location.coordinates.0', coordinates[0], { format: 'number' })}
        ${formInput('经度', 'location.coordinates.1', coordinates[1], { format: 'number' })}
        ${formTextarea('主题 ID（每行一个）', 'topics', (event.topics || []).join('\n'), { className: 'short', format: 'lines' })}
        ${formTextarea('成就类型 ID（每行一个）', 'achievementTypeIds', (event.achievementTypeIds || []).join('\n'), { className: 'short', format: 'lines' })}
    </div></section><section class="structured-section"><h3>审核状态</h3><div class="form-grid">
        ${formSelect('状态', 'review.status', review.status || 'draft', [
            ['draft', 'draft'],
            ['needs-source', 'needs-source'],
            ['verified', 'verified'],
            ['disputed', 'disputed'],
            ['deprecated', 'deprecated']
        ])}
        ${localizedFields('review.notes', notes, { label: '审核备注', className: 'short' })}
    </div></section>`;
}

function presentationFieldPath(prefix, path) {
    return prefix ? `${prefix}.${path}` : path;
}

function renderCommentarySections(sections, prefix) {
    const items = Array.isArray(sections) ? sections : [];
    return `<div class="presentation-sections"><div class="subsection-heading"><div><strong>Commentary sections</strong><p class="muted">每个段落维护双语正文和来源绑定。</p></div><button type="button" data-presentation-action="add-section">新增段落</button></div>${
        items.length
            ? items
                  .map((section, index) => {
                      const label = section.label || {};
                      const html = section.html || {};
                      return `<article class="presentation-section-item" data-presentation-section-index="${index}"><div class="collection-item-heading"><div><strong>段落 ${index + 1}</strong><span class="muted">${escapeHtml(section.id || '未命名')}</span></div><div class="collection-actions"><button type="button" data-presentation-action="up-section">↑</button><button type="button" data-presentation-action="down-section">↓</button><button type="button" class="danger" data-presentation-action="remove-section">移除</button></div></div><div class="form-grid">
            ${formInput('段落 ID', presentationFieldPath(prefix, `commentarySections.${index}.id`), section.id)}
            ${formInput('中文标题', presentationFieldPath(prefix, `commentarySections.${index}.label.zh`), localizedValue(label, 'zh'))}
            ${formInput('英文标题', presentationFieldPath(prefix, `commentarySections.${index}.label.en`), localizedValue(label, 'en'))}
            ${formTextarea('中文正文', presentationFieldPath(prefix, `commentarySections.${index}.html.zh`), localizedValue(html, 'zh'), { className: 'medium' })}
            ${formTextarea('英文正文', presentationFieldPath(prefix, `commentarySections.${index}.html.en`), localizedValue(html, 'en'), { className: 'medium' })}
            ${formTextarea('来源 ID（每行一个）', presentationFieldPath(prefix, `commentarySections.${index}.sourceIds`), collectionOptions(section.sourceIds).join('\n'), { className: 'short', format: 'lines', span: true })}
        </div></article>`;
                  })
                  .join('')
            : '<div class="collection-empty">暂无 commentary section。</div>'
    }</div>`;
}

function renderPresentationForm(presentation, prefix, title) {
    const review = presentation.review || {};
    const reviewNotes = review.notes || {};
    return `<section class="structured-section presentation-editor"><div class="section-heading"><div><h3>${escapeHtml(title)}</h3><p class="muted">常用展示字段已结构化；未接入的特殊模块仍可在高级 JSON 中维护。</p></div></div><div class="form-grid">
        ${localizedFields(presentationFieldPath(prefix, 'displayTitle'), presentation.displayTitle, { label: '展示标题', className: 'short' })}
        ${localizedFields(presentationFieldPath(prefix, 'displaySummary'), presentation.displaySummary, { label: '展示摘要', className: 'short' })}
        ${localizedFields(presentationFieldPath(prefix, 'displaySubtitle'), presentation.displaySubtitle, { label: '展示副标题', className: 'short' })}
        ${localizedFields(presentationFieldPath(prefix, 'displayDescription'), presentation.displayDescription, { label: '展示描述', className: 'medium', span: true })}
        ${formSelect(
            '展示模式',
            presentationFieldPath(prefix, 'presentationMode'),
            presentation.presentationMode || 'preserve-legacy',
            [
                ['preserve-legacy', 'preserve-legacy'],
                ['archive', 'archive']
            ]
        )}
        ${formInput('视觉类型', presentationFieldPath(prefix, 'visual'), presentation.visual)}
        ${formInput('首图资产 ID', presentationFieldPath(prefix, 'overviewImageAssetId'), presentation.overviewImageAssetId)}
        ${formInput('Quiz ID', presentationFieldPath(prefix, 'quizId'), presentation.quizId)}
        ${formTextarea('强调项 ID（每行一个）', presentationFieldPath(prefix, 'emphasis'), collectionOptions(presentation.emphasis).join('\n'), { className: 'short', format: 'lines' })}
        ${formTextarea('资产 ID（每行一个）', presentationFieldPath(prefix, 'assetIds'), collectionOptions(presentation.assetIds).join('\n'), { className: 'short', format: 'lines' })}
        ${formTextarea('来源 ID（每行一个）', presentationFieldPath(prefix, 'sourceIds'), collectionOptions(presentation.sourceIds).join('\n'), { className: 'short', format: 'lines' })}
        ${formTextarea('Claim ID（每行一个）', presentationFieldPath(prefix, 'claimIds'), collectionOptions(presentation.claimIds).join('\n'), { className: 'short', format: 'lines' })}
        ${formSelect('审核状态', presentationFieldPath(prefix, 'review.status'), review.status || 'draft', [
            ['draft', 'draft'],
            ['needs-source', 'needs-source'],
            ['verified', 'verified'],
            ['disputed', 'disputed'],
            ['deprecated', 'deprecated']
        ])}
        ${formInput('审核人', presentationFieldPath(prefix, 'review.reviewer'), review.reviewer)}
        ${localizedFields(presentationFieldPath(prefix, 'review.notes'), reviewNotes, { label: '审核备注', className: 'short' })}
    </div>${renderCommentarySections(presentation.commentarySections, prefix)}</section>`;
}

function collectionOptions(value, fallback = []) {
    return Array.isArray(value) ? value : fallback;
}

function collectionField(label, path, value, options = {}) {
    if (options.kind === 'textarea')
        return formTextarea(label, path, value, {
            className: options.className || 'short',
            format: options.format,
            span: options.span
        });
    if (options.kind === 'select')
        return formSelect(label, path, value, options.options || [], { span: options.span, format: options.format });
    return formInput(label, path, value, { format: options.format, type: options.type, span: options.span });
}

function sourceItemForm(item, index) {
    const source = item || {};
    const notes = source.notes || {};
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>来源 ${index + 1}</strong><span class="muted">${escapeHtml(source.id || '未命名')}</span></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div><div class="form-grid">
        ${collectionField('来源 ID', 'id', source.id)}
        ${collectionField('类型', 'type', source.type, {
            kind: 'select',
            options: [
                ['paper', 'paper'],
                ['paper-page', 'paper-page'],
                ['book', 'book'],
                ['documentation', 'documentation'],
                ['code', 'code'],
                ['project-page', 'project-page'],
                ['official-page', 'official-page'],
                ['profile', 'profile'],
                ['archive', 'archive'],
                ['article', 'article'],
                ['news', 'news'],
                ['report', 'report'],
                ['image-source', 'image-source'],
                ['dataset', 'dataset'],
                ['statement', 'statement'],
                ['thesis', 'thesis'],
                ['internal-record', 'internal-record']
            ]
        })}
        ${localizedFields('label', source.label, { label: '标签', className: 'short' })}
        ${localizedFields('title', source.title, { label: '标题', className: 'short' })}
        ${collectionField('作者（每行一个）', 'authors', collectionOptions(source.authors).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('年份', 'year', source.year)}
        ${collectionField('语言', 'language', source.language)}
        ${collectionField('URL', 'url', source.url, { span: true })}
        ${collectionField('DOI', 'doi', source.doi)}
        ${collectionField('档案地址', 'archiveUrl', source.archiveUrl)}
        ${collectionField('用途', 'purpose', source.purpose, {
            kind: 'select',
            options: [
                ['core-evidence', 'core-evidence'],
                ['precursor', 'precursor'],
                ['follow-up', 'follow-up'],
                ['alternate-access', 'alternate-access'],
                ['background', 'background'],
                ['historical-context', 'historical-context'],
                ['biography', 'biography'],
                ['image-provenance', 'image-provenance'],
                ['implementation', 'implementation'],
                ['dataset-access', 'dataset-access'],
                ['contemporary-reporting', 'contemporary-reporting'],
                ['official-statement', 'official-statement'],
                ['reporting', 'reporting'],
                ['bibliographic-verification', 'bibliographic-verification'],
                ['migration-only', 'migration-only']
            ]
        })}
        ${collectionField('可靠性', 'reliability', source.reliability, {
            kind: 'select',
            options: [
                ['primary', 'primary'],
                ['secondary', 'secondary'],
                ['tertiary', 'tertiary'],
                ['reference-only', 'reference-only']
            ]
        })}
        ${localizedFields('notes', notes, { label: '备注', className: 'short', span: true })}
    </div></article>`;
}

function claimItemForm(item, index) {
    const claim = item || {};
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>事实主张 ${index + 1}</strong><span class="muted">${escapeHtml(claim.id || '未命名')}</span></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div><div class="form-grid">
        ${collectionField('主张 ID', 'id', claim.id)}
        ${collectionField('重要级别', 'importance', claim.importance, {
            kind: 'select',
            options: [
                ['core', 'core'],
                ['context', 'context'],
                ['detail', 'detail'],
                ['display', 'display']
            ]
        })}
        ${localizedFields('text', claim.text, { label: '事实内容', className: 'medium', span: true })}
        ${collectionField('来源 ID（每行一个）', 'sourceIds', collectionOptions(claim.sourceIds).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('状态', 'status', claim.status || 'draft', {
            kind: 'select',
            options: [
                ['draft', 'draft'],
                ['needs-source', 'needs-source'],
                ['verified', 'verified'],
                ['disputed', 'disputed'],
                ['deprecated', 'deprecated']
            ]
        })}
    </div></article>`;
}

function assetItemForm(item, index) {
    const asset = item || {};
    const rights = asset.rights || {};
    const license = rights.license || {};
    const usage = rights.usage || {};
    const storage = asset.storage || {};
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>资产 ${index + 1}</strong><span class="muted">${escapeHtml(asset.id || '未命名')}</span></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div><div class="form-grid">
        ${collectionField('资产 ID', 'id', asset.id)}
        ${collectionField('类型', 'type', asset.type, {
            kind: 'select',
            options: [
                ['image', 'image'],
                ['svg', 'svg'],
                ['gif', 'gif'],
                ['audio', 'audio'],
                ['video', 'video']
            ]
        })}
        ${collectionField('角色', 'role', asset.role)}
        ${collectionField('资源路径', 'path', asset.path, { span: true })}
        ${localizedFields('caption', asset.caption, { label: '标题', className: 'short' })}
        ${localizedFields('subcaption', asset.subcaption, { label: '副标题', className: 'short' })}
        ${collectionField('语言', 'language', asset.language)}
        ${collectionField('来源 ID', 'sourceId', asset.sourceId)}
        ${collectionField('来源 ID（多个）', 'sourceIds', collectionOptions(asset.sourceIds).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('人物 ID（每行一个）', 'figureIds', collectionOptions(asset.figureIds).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('delivery URL', 'deliveryUrl', asset.deliveryUrl, { span: true })}
        ${collectionField('使用位置（每行一个）', 'usage', collectionOptions(asset.usage).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('版权状态', 'rights.status', rights.status)}
        ${localizedFields('rights.license', license, { label: '许可', className: 'short' })}
        ${localizedFields('rights.usage', usage, { label: '使用说明', className: 'short' })}
        <div class="asset-storage-fields span-2"><h4>音频 / 视频存储（按需填写）</h4><div class="form-grid">
            ${collectionField('存储 profile', 'storage.profileId', storage.profileId)}
            ${collectionField('provider', 'storage.provider', storage.provider)}
            ${collectionField('bucket', 'storage.bucket', storage.bucket)}
            ${collectionField('object key', 'storage.objectKey', storage.objectKey)}
            ${collectionField('content type', 'storage.contentType', storage.contentType)}
            ${collectionField('public URL', 'storage.publicUrl', storage.publicUrl, { span: true })}
        </div></div>
    </div></article>`;
}

function quizItemForm(item, index) {
    const quiz = item || {};
    const options = Array.isArray(quiz.options) ? quiz.options : [];
    const answerOptions = options.map((option, optionIndex) => [
        String(optionIndex),
        `选项 ${optionIndex + 1} · ${localizedValue(option.text || option, 'zh') || localizedValue(option.text || option, 'en') || '未填写'}`
    ]);
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>Quiz ${index + 1}</strong><span class="muted">${escapeHtml(quiz.id || '未命名')}</span></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div><div class="form-grid">
        ${collectionField('Quiz ID', 'id', quiz.id)}
        ${localizedFields('question', quiz.question, { label: '题目', className: 'medium', span: true })}
        ${localizedFields('explanation', quiz.explanation, { label: '解析', className: 'short', span: true })}
        ${collectionField('来源 ID（每行一个）', 'sourceIds', collectionOptions(quiz.sourceIds).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('资产 ID（每行一个）', 'assetIds', collectionOptions(quiz.assetIds).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${formSelect('正确答案', 'answer', String(Number.isInteger(quiz.answer) ? quiz.answer : 0), answerOptions, { format: 'number' })}
        <div class="quiz-options span-2"><div class="subsection-heading"><strong>选项</strong><button type="button" data-quiz-action="add-option">添加选项</button></div>${options
            .map((option, optionIndex) => {
                const optionText = option && typeof option === 'object' && option.text ? option.text : option;
                const optionPath =
                    option && typeof option === 'object' && option.text
                        ? `options.${optionIndex}.text`
                        : `options.${optionIndex}`;
                return `<div class="quiz-option-row" data-option-index="${optionIndex}"><span class="muted">${optionIndex + 1}</span>${formInput('中文', `${optionPath}.zh`, localizedValue(optionText, 'zh'))}${formInput('英文', `${optionPath}.en`, localizedValue(optionText, 'en'))}<button type="button" data-quiz-action="remove-option">移除</button></div>`;
            })
            .join('')}</div>
    </div></article>`;
}

function collectionConfig(file) {
    return {
        'sources.json': {
            title: '来源维护',
            summary: '编辑来源记录、可靠性和用途，引用关系会原样保留。',
            create: () => ({
                id: '',
                type: 'article',
                label: { zh: '', en: '' },
                title: { zh: '', en: '' },
                purpose: 'background',
                reliability: 'secondary'
            }),
            render: sourceItemForm
        },
        'claims.json': {
            title: '事实主张',
            summary: '将可追溯事实拆成独立主张，并绑定来源。',
            create: () => ({ id: '', importance: 'context', text: { zh: '', en: '' }, sourceIds: [], status: 'draft' }),
            render: claimItemForm
        },
        'assets.json': {
            title: '资产与音频',
            summary: '维护图片、音频、视频元数据和展示顺序。',
            create: () => ({
                id: '',
                type: 'image',
                role: 'supporting',
                path: '',
                caption: { zh: '', en: '' },
                rights: { status: 'needs-source', license: { zh: '', en: '' }, usage: { zh: '', en: '' } }
            }),
            render: assetItemForm
        },
        'quizzes.json': {
            title: 'Quiz 题库',
            summary: '维护双语题目、选项、正确答案和关联资料。',
            create: () => ({
                id: '',
                question: { zh: '', en: '' },
                options: [
                    { zh: '', en: '' },
                    { zh: '', en: '' }
                ],
                answer: 0,
                explanation: { zh: '', en: '' },
                sourceIds: [],
                assetIds: []
            }),
            render: quizItemForm
        }
    }[file];
}

function renderCollectionEditor(file, data) {
    const config = collectionConfig(file);
    const items = Array.isArray(data) ? data : [];
    return `<section class="structured-section"><div class="collection-toolbar"><div><h3>${escapeHtml(config.title)}</h3><p class="muted">${escapeHtml(config.summary)}</p></div><button type="button" class="primary" data-collection-action="add">新增条目</button></div><div class="collection-list">${items.length ? items.map(config.render).join('') : '<div class="collection-empty">暂无条目，点击“新增条目”开始维护。</div>'}</div></section>`;
}

function renderStructuredEditor() {
    if (!isStructuredEventFile() || !state.document || ['people', 'advanced'].includes(state.eventSection)) {
        elements.structuredEditor.innerHTML = '';
        elements.structuredTitle.textContent = '结构化编辑';
        elements.structuredSummary.textContent = '当前文件暂未接入结构化编辑器，请使用高级 JSON 模式。';
        elements.structuredFieldHint.textContent = '';
        return;
    }
    const isPresentation = state.eventSection === 'presentation';
    const config = isPresentation
        ? { title: '展示配置', summary: '维护当前事件或 Storyline 的展示内容。' }
        : state.file === 'event.json'
          ? { title: '事件基本资料', summary: '通过表单维护事件事实、地点和审核信息。' }
          : collectionConfig(state.file) || { title: '展示配置', summary: '维护当前 storyline 的展示覆盖字段。' };
    elements.structuredTitle.textContent = config.title;
    elements.structuredSummary.textContent = config.summary;
    elements.structuredFieldHint.textContent = state.file;
    if (isPresentation) {
        elements.structuredEditor.innerHTML =
            state.file === 'event.json'
                ? renderPresentationForm(
                      state.document.defaultPresentation || {},
                      'defaultPresentation',
                      '默认展示配置'
                  )
                : renderPresentationForm(state.document, '', '故事线展示覆盖');
    } else {
        elements.structuredEditor.innerHTML =
            state.file === 'event.json'
                ? renderEventForm(state.document)
                : collectionConfig(state.file)
                  ? renderCollectionEditor(state.file, state.document)
                  : '';
    }
}

function structuredFieldValue(target) {
    const format = target.dataset.structuredFormat || 'text';
    if (target.type === 'checkbox' || format === 'boolean') return target.checked;
    if (format === 'lines') return splitLines(target.value);
    if (format === 'number' || format === 'year') {
        if (target.value.trim() === '') return format === 'year' ? '' : undefined;
        const parsed = Number(target.value);
        return Number.isNaN(parsed) ? target.value : parsed;
    }
    return target.value;
}

function updateStructuredField(target) {
    if (!state.document || !target.dataset.structuredField) return;
    const nextValue = structuredFieldValue(target);
    setPath(state.document, target.dataset.structuredField, nextValue);
    syncEditor();
    setStatus('已修改结构化字段，尚未保存', '');
}

function moveCollectionItem(index, offset) {
    if (!Array.isArray(state.document)) return;
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= state.document.length) return;
    [state.document[index], state.document[nextIndex]] = [state.document[nextIndex], state.document[index]];
}

function handleCollectionAction(target) {
    const action = target.dataset.collectionAction;
    const config = collectionConfig(state.file);
    if (!config || !state.document) return;
    if (action === 'add') state.document.push(config.create());
    else {
        const item = target.closest('[data-collection-index]');
        if (!item) return;
        const index = Number(item.dataset.collectionIndex);
        if (action === 'remove') state.document.splice(index, 1);
        if (action === 'duplicate') state.document.splice(index + 1, 0, cloneJson(state.document[index]));
        if (action === 'up') moveCollectionItem(index, -1);
        if (action === 'down') moveCollectionItem(index, 1);
    }
    syncEditor();
    renderStructuredEditor();
    setStatus('已修改条目，尚未保存', '');
}

function addQuizOption(item) {
    const quiz = state.document[item];
    if (!quiz || !Array.isArray(quiz.options)) return;
    quiz.options.push({ zh: '', en: '' });
    syncEditor();
    renderStructuredEditor();
}

function removeQuizOption(item, optionIndex) {
    const quiz = state.document[item];
    if (!quiz || !Array.isArray(quiz.options) || quiz.options.length <= 2) return;
    quiz.options.splice(optionIndex, 1);
    if (Number.isInteger(quiz.answer) && quiz.answer >= quiz.options.length) quiz.answer = quiz.options.length - 1;
    syncEditor();
    renderStructuredEditor();
}

function updateCollectionField(target) {
    const item = target.closest('[data-collection-index]');
    if (!item || !Array.isArray(state.document)) return;
    const index = Number(item.dataset.collectionIndex);
    if (!Number.isInteger(index) || !state.document[index] || typeof state.document[index] !== 'object') return;
    const value = structuredFieldValue(target);
    setPath(state.document[index], target.dataset.structuredField, value);
    syncEditor();
    setStatus('已修改结构化字段，尚未保存', '');
}

function presentationDocument() {
    if (state.file === 'event.json') {
        if (!state.document.defaultPresentation || typeof state.document.defaultPresentation !== 'object') {
            state.document.defaultPresentation = {};
        }
        return state.document.defaultPresentation;
    }
    return state.document;
}

function movePresentationSection(index, offset) {
    const presentation = presentationDocument();
    if (!Array.isArray(presentation.commentarySections)) presentation.commentarySections = [];
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= presentation.commentarySections.length) return;
    [presentation.commentarySections[index], presentation.commentarySections[nextIndex]] = [
        presentation.commentarySections[nextIndex],
        presentation.commentarySections[index]
    ];
}

function handlePresentationAction(target) {
    const action = target.dataset.presentationAction;
    const presentation = presentationDocument();
    if (!Array.isArray(presentation.commentarySections)) presentation.commentarySections = [];
    if (action === 'add-section') {
        presentation.commentarySections.push({
            id: `section-${presentation.commentarySections.length + 1}`,
            label: { zh: '', en: '' },
            html: { zh: '', en: '' },
            sourceIds: []
        });
    } else {
        const section = target.closest('[data-presentation-section-index]');
        if (!section) return;
        const index = Number(section.dataset.presentationSectionIndex);
        if (action === 'remove-section') presentation.commentarySections.splice(index, 1);
        if (action === 'up-section') movePresentationSection(index, -1);
        if (action === 'down-section') movePresentationSection(index, 1);
    }
    syncEditor();
    renderStructuredEditor();
    setStatus('已修改展示段落，尚未保存', '');
}

async function loadEntity() {
    if (!state.entityId) {
        setStatus('请先选择实体', 'bad');
        return;
    }
    let result;
    if (state.type === 'events') {
        state.file = elements.fileSelect.value;
        if (!state.file) throw new Error('请先选择事件文件');
        result = await api(
            `/api/archive/file?eventId=${encodeURIComponent(state.entityId)}&file=${encodeURIComponent(state.file)}`
        );
    } else if (state.type === 'storylines') {
        result = await api(`/api/archive/storyline?storylineId=${encodeURIComponent(state.entityId)}`);
    } else if (state.type === 'figures') {
        result = await api(`/api/archive/figure?figureId=${encodeURIComponent(state.entityId)}`);
    } else {
        return;
    }
    state.document = result.data;
    state.revision = result.revision || '';
    state.creatingFigure = false;
    syncEditor();
    elements.currentEntity.textContent = `${state.type === 'events' ? `${state.entityId} / ${state.file}` : state.entityId}`;
    updatePanelVisibility();
    renderEventContext();
    renderEventSectionNav();
    renderStorylineOverview();
    renderStructuredEditor();
    if (state.type === 'events') await renderEventDisplayActions();
    if (state.type === 'figures') {
        renderFigureForm();
        await renderFigureAssets();
        await renderFigureUsage();
        await renderAdvancedFigureTools();
    }
    if (state.type === 'events' && state.eventSection === 'people') await renderRelations();
    setStatus(`已加载 ${state.entityId}${state.file ? ` / ${state.file}` : ''}`, 'ok');
}

function setValue(id, value) {
    elements[id].value = value ?? '';
}

function renderAvatarPreview() {
    const avatarPath = elements.avatarPath.value.trim();
    elements.avatarPreview.style.cssText = elements.avatarStyle.value.trim();
    if (!avatarPath) {
        elements.avatarPreview.hidden = true;
        elements.avatarPlaceholder.hidden = false;
        return;
    }
    elements.avatarPreview.hidden = false;
    elements.avatarPlaceholder.hidden = true;
    elements.avatarPreview.src = /^https?:\/\//i.test(avatarPath) ? avatarPath : `/${avatarPath}`;
}

function renderFigureForm() {
    const figure = state.document || {};
    const avatar = figure.defaultAvatar || {};
    const rights = avatar.rights || {};
    const review = figure.review || {};
    setValue('figureId', figure.id);
    elements.figureId.disabled = !state.creatingFigure;
    setValue('figureType', figure.type || 'person');
    setValue('figureNameEn', localize(figure.name, 'en'));
    setValue('figureNameZh', localize(figure.name, 'zh'));
    setValue('figureAliases', (figure.aliases || []).join('\n'));
    setValue('figureDisambiguationEn', localize(figure.disambiguation, 'en'));
    setValue('figureDisambiguationZh', localize(figure.disambiguation, 'zh'));
    setValue('figureOrganizations', (figure.organizationIds || []).join('\n'));
    setValue('figureProfileSources', JSON.stringify(figure.profileSources || [], null, 2));
    setValue('avatarPath', avatar.path);
    setValue('avatarSourceNameEn', localize(avatar.sourceName, 'en'));
    setValue('avatarSourceNameZh', localize(avatar.sourceName, 'zh'));
    setValue('avatarSourceUrl', avatar.sourceUrl);
    setValue('avatarRightsStatus', rights.status);
    setValue('avatarStyle', avatar.avatarStyle);
    setValue('avatarLicenseEn', localize(rights.license, 'en'));
    setValue('avatarLicenseZh', localize(rights.license, 'zh'));
    setValue('avatarUsageEn', localize(rights.usage, 'en'));
    setValue('avatarUsageZh', localize(rights.usage, 'zh'));
    setValue('reviewStatus', review.status || 'draft');
    setValue('reviewedAt', review.reviewedAt || new Date().toISOString().slice(0, 10));
    setValue('reviewer', review.reviewer || 'archive-admin');
    setValue('reviewNotesEn', localize(review.notes, 'en'));
    setValue('reviewNotesZh', localize(review.notes, 'zh'));
    elements.figureReviewBadge.textContent = review.status || 'draft';
    elements.figureReviewBadge.className = `badge ${review.status || 'draft'}`;
    elements.figureAliasesField.hidden = !(figure.aliases || []).length;
    const hasDisambiguation = hasLocalizedValue(figure.disambiguation);
    elements.figureDisambiguationEnField.hidden = !hasDisambiguation;
    elements.figureDisambiguationZhField.hidden = !hasDisambiguation;
    elements.figureOrganizationsField.hidden = !(figure.organizationIds || []).length;
    elements.figureProfileSourcesField.hidden = !(figure.profileSources || []).length;
    elements.figureAvatarHeading.hidden = !avatar.path;
    elements.figureAvatarEditor.hidden = !avatar.path;
    elements.avatarStyleField.hidden = !avatar.avatarStyle;
    renderAvatarPreview();
}

function resetMergePreview() {
    state.mergePreview = null;
    elements.mergePreview.textContent = '先选择目标并检查影响范围。';
    elements.mergeExecuteBtn.disabled = true;
}

function resetImageImport() {
    elements.imageImportFile.value = '';
    elements.imageImportPreview.removeAttribute('src');
    elements.imageImportPreview.hidden = true;
    elements.imageImportPlaceholder.hidden = false;
    elements.imageImportEvent.value = '';
    elements.imageImportAssetId.value = '';
    elements.imageImportSourceId.innerHTML = '<option value="">先选择事件</option>';
    elements.imageImportCaptionEn.value = `${localize(state.document && state.document.name, 'en')} portrait`.trim();
    elements.imageImportCaptionZh.value = `${localize(state.document && state.document.name, 'zh')}肖像`.trim();
    elements.imageImportSubcaptionEn.value = '';
    elements.imageImportSubcaptionZh.value = '';
    elements.imageImportSourceNameEn.value = '';
    elements.imageImportSourceNameZh.value = '';
    elements.imageImportSourceUrl.value = '';
    elements.imageImportRightsStatus.value = 'needs-source';
    elements.imageImportSetDefault.checked = false;
    elements.imageImportLicenseEn.value = '';
    elements.imageImportLicenseZh.value = '';
    elements.imageImportUsageEn.value = '';
    elements.imageImportUsageZh.value = '';
}

async function renderAdvancedFigureTools() {
    if (state.creatingFigure || !state.document) {
        elements.mergeTargetSelect.innerHTML = '<option value="">保存身份后可使用高级操作</option>';
        elements.imageImportEvent.innerHTML = '<option value="">保存身份后可导入图片</option>';
        elements.mergePreviewBtn.disabled = true;
        elements.imageImportBtn.disabled = true;
        resetMergePreview();
        return;
    }
    await Promise.all([loadFigureOptions(), loadEventOptions()]);
    const currentType = state.document.type;
    elements.mergeTargetSelect.innerHTML = `<option value="">选择目标身份</option>${state.figureOptions
        .filter((figure) => figure.id !== state.entityId && figure.type === currentType)
        .map((figure) => `<option value="${escapeHtml(figure.id)}">${escapeHtml(figureLabel(figure))}</option>`)
        .join('')}`;
    elements.imageImportEvent.innerHTML = `<option value="">选择事件</option>${state.eventOptions
        .map((event) => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.id)}</option>`)
        .join('')}`;
    elements.mergePreviewBtn.disabled = false;
    elements.imageImportBtn.disabled = false;
    resetMergePreview();
    resetImageImport();
}

async function loadImageImportSources() {
    const eventId = elements.imageImportEvent.value;
    elements.imageImportSourceId.innerHTML = '<option value="">加载来源...</option>';
    if (!eventId) {
        elements.imageImportSourceId.innerHTML = '<option value="">先选择事件</option>';
        elements.imageImportAssetId.value = '';
        return;
    }
    const result = await api(
        `/api/archive/file?eventId=${encodeURIComponent(eventId)}&file=${encodeURIComponent('sources.json')}`
    );
    elements.imageImportSourceId.innerHTML = `<option value="">选择来源记录</option>${result.data
        .map(
            (source) =>
                `<option value="${escapeHtml(source.id)}" data-label-en="${escapeHtml(localize(source.label, 'en'))}" data-label-zh="${escapeHtml(localize(source.label, 'zh'))}" data-url="${escapeHtml(source.url || '')}">${escapeHtml(localize(source.label, 'zh') || localize(source.label, 'en') || source.id)} · ${escapeHtml(source.id)}</option>`
        )
        .join('')}`;
    elements.imageImportAssetId.value = `asset-${eventId}-portrait-${state.entityId}`;
}

function syncImageSourceMetadata() {
    const option = elements.imageImportSourceId.selectedOptions[0];
    if (!option || !option.value) return;
    elements.imageImportSourceNameEn.value = option.dataset.labelEn || '';
    elements.imageImportSourceNameZh.value = option.dataset.labelZh || '';
    elements.imageImportSourceUrl.value = option.dataset.url || '';
}

async function previewFigureMerge() {
    const targetFigureId = elements.mergeTargetSelect.value;
    if (!targetFigureId) throw new Error('请选择目标身份');
    const preview = await api(
        `/api/archive/figure-merge-preview?sourceFigureId=${encodeURIComponent(state.entityId)}&targetFigureId=${encodeURIComponent(targetFigureId)}`
    );
    state.mergePreview = preview;
    const impact = preview.impact;
    elements.mergePreview.innerHTML = `将删除 <code>${escapeHtml(preview.source.id)}</code>，迁移到 <code>${escapeHtml(preview.target.id)}</code>：<strong>${impact.events}</strong> 个事件、<strong>${impact.eventRelations}</strong> 条 canonical 关系、<strong>${impact.variantRelations}</strong> 条 variant 关系、<strong>${impact.assets}</strong> 个资产、<strong>${impact.organizationReferences}</strong> 条机构引用。`;
    elements.mergeExecuteBtn.disabled = false;
}

async function executeFigureMerge() {
    if (!state.mergePreview) throw new Error('请先预览合并影响');
    const { source, target, revision } = state.mergePreview;
    if (
        !window.confirm(
            `确认将 ${source.id} 合并到 ${target.id}？\n\n源身份将从人物库移除，所有引用会改写。此操作不会删除图片文件。`
        )
    )
        return;
    const result = await api('/api/archive/figure-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sourceFigureId: source.id,
            targetFigureId: target.id,
            expectedRevision: revision
        })
    });
    setStatus(`已合并身份，改写 ${result.changedFiles.length} 个文件`, 'ok');
    await refresh();
    selectEntity(target.id);
    await loadEntity();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new window.FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('无法读取图片'));
        reader.readAsDataURL(file);
    });
}

async function importFigureImage() {
    const file = elements.imageImportFile.files[0];
    if (!file) throw new Error('请选择图片文件');
    if (file.size > 10 * 1024 * 1024) throw new Error('图片不能超过 10 MB');
    const eventId = elements.imageImportEvent.value;
    const assetId = elements.imageImportAssetId.value.trim();
    const sourceId = elements.imageImportSourceId.value;
    if (!eventId || !assetId || !sourceId) throw new Error('事件、资产 ID 和来源记录不能为空');
    const imageBase64 = await readFileAsDataUrl(file);
    const result = await api('/api/archive/figure-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            figureId: state.entityId,
            eventId,
            assetId,
            sourceId,
            imageBase64,
            role: elements.imageImportRole.value,
            caption: {
                en: elements.imageImportCaptionEn.value.trim(),
                zh: elements.imageImportCaptionZh.value.trim()
            },
            subcaption: {
                en: elements.imageImportSubcaptionEn.value.trim(),
                zh: elements.imageImportSubcaptionZh.value.trim()
            },
            sourceName: {
                en: elements.imageImportSourceNameEn.value.trim(),
                zh: elements.imageImportSourceNameZh.value.trim()
            },
            sourceUrl: elements.imageImportSourceUrl.value.trim(),
            rights: {
                status: elements.imageImportRightsStatus.value.trim(),
                license: {
                    en: elements.imageImportLicenseEn.value.trim(),
                    zh: elements.imageImportLicenseZh.value.trim()
                },
                usage: {
                    en: elements.imageImportUsageEn.value.trim(),
                    zh: elements.imageImportUsageZh.value.trim()
                }
            },
            setAsDefaultAvatar: elements.imageImportSetDefault.checked,
            expectedRevision: state.revision
        })
    });
    setStatus(`已导入 ${result.asset.path}`, 'ok');
    await loadEntity();
}

function collectFigureForm() {
    let profileSources;
    try {
        profileSources = JSON.parse(elements.figureProfileSources.value || '[]');
    } catch (error) {
        throw new Error(`Profile sources JSON 无效：${error.message}`);
    }
    if (!Array.isArray(profileSources)) throw new Error('Profile sources 必须是 JSON 数组');

    const disambiguation = {
        en: elements.figureDisambiguationEn.value.trim(),
        zh: elements.figureDisambiguationZh.value.trim()
    };
    const notes = {
        en: elements.reviewNotesEn.value.trim(),
        zh: elements.reviewNotesZh.value.trim()
    };
    const figure = {
        id: elements.figureId.value.trim(),
        name: {
            en: elements.figureNameEn.value.trim(),
            zh: elements.figureNameZh.value.trim()
        },
        aliases: splitLines(elements.figureAliases.value),
        ...(disambiguation.en || disambiguation.zh ? { disambiguation } : {}),
        type: elements.figureType.value,
        organizationIds: splitLines(elements.figureOrganizations.value),
        profileSources,
        review: {
            status: elements.reviewStatus.value,
            reviewedAt: elements.reviewedAt.value.trim(),
            reviewer: elements.reviewer.value.trim(),
            ...(notes.en || notes.zh ? { notes } : {})
        }
    };
    const avatarPath = elements.avatarPath.value.trim();
    if (avatarPath) {
        figure.defaultAvatar = {
            path: avatarPath,
            sourceName: {
                en: elements.avatarSourceNameEn.value.trim(),
                zh: elements.avatarSourceNameZh.value.trim()
            },
            sourceUrl: elements.avatarSourceUrl.value.trim(),
            rights: {
                status: elements.avatarRightsStatus.value.trim(),
                license: {
                    en: elements.avatarLicenseEn.value.trim(),
                    zh: elements.avatarLicenseZh.value.trim()
                },
                usage: {
                    en: elements.avatarUsageEn.value.trim(),
                    zh: elements.avatarUsageZh.value.trim()
                }
            },
            ...(elements.avatarStyle.value.trim() ? { avatarStyle: elements.avatarStyle.value.trim() } : {})
        };
    }
    return figure;
}

async function renderFigureUsage() {
    if (!state.entityId || state.creatingFigure) {
        state.figureUsage = null;
        elements.figureUsage.innerHTML = '';
        renderFigureEvents();
        return;
    }
    state.figureUsage = await api(`/api/archive/figure-usage?figureId=${encodeURIComponent(state.entityId)}`);
    const usage = state.figureUsage;
    const cards = [
        ['关联事件', usage.events.length],
        ['唯一资产', groupFigureAssets().length],
        ['Canonical 关系', usage.eventRelations.length],
        ['Variant 关系', usage.variantRelations.length],
        ['资产引用', usage.assets.length]
    ];
    elements.figureUsage.innerHTML = cards
        .map(([label, value]) => `<div class="usage-card"><strong>${value}</strong>${escapeHtml(label)}</div>`)
        .join('');
    renderFigureEvents();
}

function assetImageSource(asset) {
    return /^https?:\/\//i.test(asset.path) ? asset.path : `/${asset.path}`;
}

function groupFigureAssets() {
    const groups = new Map();
    for (const asset of state.figureAssets) {
        const key = asset.path || `${asset.eventId}:${asset.id}`;
        if (!groups.has(key)) groups.set(key, { key, path: asset.path, associations: [] });
        groups.get(key).associations.push(asset);
    }
    return [...groups.values()]
        .map((group) => {
            const representative =
                group.associations.find((asset) => asset.isDefaultAvatar) ||
                group.associations.find((asset) => asset.canSetAsDefaultAvatar) ||
                group.associations[0];
            const metadataSignatures = new Set(
                group.associations.map((asset) =>
                    JSON.stringify({ source: asset.source || {}, rights: asset.rights || {} })
                )
            );
            return {
                ...group,
                representative,
                eventIds: [...new Set(group.associations.map((asset) => asset.eventId))].sort(),
                assetIds: [...new Set(group.associations.map((asset) => asset.id))],
                roles: [...new Set(group.associations.map((asset) => asset.role).filter(Boolean))],
                isDefaultAvatar: group.associations.some((asset) => asset.isDefaultAvatar),
                usedByRelations: group.associations.some((asset) => asset.usedByRelations),
                metadataConflict: metadataSignatures.size > 1
            };
        })
        .sort(
            (left, right) =>
                Number(right.isDefaultAvatar) - Number(left.isDefaultAvatar) || left.path.localeCompare(right.path)
        );
}

function updateAssetMergeControls() {
    const selectedCount = state.assetMergeSelection.size;
    const hasCanonical = Boolean(state.assetMergeCanonical && state.assetMergeSelection.has(state.assetMergeCanonical));
    elements.figureAssetMergeSummary.textContent = hasCanonical
        ? `已选择 ${selectedCount} 张 · 保留路径已指定`
        : selectedCount > 0
          ? `已选择 ${selectedCount} 张 · 请选择保留路径`
          : '选择至少两张图片';
    elements.figureAssetMergeBtn.disabled = selectedCount < 2 || !hasCanonical;
}

function resetAssetMergeSelection() {
    state.assetMergeSelection.clear();
    state.assetMergeCanonical = '';
    updateAssetMergeControls();
}

async function mergeSelectedFigureAssets() {
    const selectedPaths = [...state.assetMergeSelection];
    const canonicalPath = state.assetMergeCanonical;
    const duplicatePaths = selectedPaths.filter((assetPath) => assetPath !== canonicalPath);
    if (!canonicalPath || duplicatePaths.length === 0) throw new Error('请选择至少两张图片并指定保留路径');

    const request = {
        figureId: state.entityId,
        canonicalPath,
        duplicatePaths
    };
    const preview = await api('/api/archive/figure-asset-merge-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
    });
    const impact = preview.impact;
    const contentWarning = preview.contentMatch
        ? '所选本地文件内容哈希一致。'
        : '所选文件内容哈希不完全一致，请确认它们确实是同一图片。';
    const otherFigureWarning = impact.otherFigures.length
        ? `\n同时影响其他人物：${impact.otherFigures.join('、')}`
        : '';
    if (
        !window.confirm(
            `确认将 ${duplicatePaths.length} 个路径合并到：\n${canonicalPath}\n\n将改写 ${impact.assets} 个资产记录、${impact.events} 个事件、${impact.defaultAvatars} 个默认头像。\n${contentWarning}${otherFigureWarning}\n\n旧图片文件不会删除。`
        )
    )
        return;

    const result = await api('/api/archive/figure-asset-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, expectedRevision: preview.revision })
    });
    resetAssetMergeSelection();
    await loadEntity();
    setStatus(`图片路径已合并，改写 ${result.changedFiles.length} 个文件`, 'ok');
}

function renderFigureAssetCards() {
    const assetGroups = groupFigureAssets();
    elements.figureAssetCount.textContent = `${assetGroups.length} 个唯一文件`;
    elements.figureAssetEmpty.hidden = assetGroups.length > 0;
    elements.figureAssetGallery.innerHTML = assetGroups
        .map((group) => {
            const asset = group.representative;
            const caption = localize(asset.caption, 'zh') || localize(asset.caption, 'en') || asset.id;
            const subcaption = localize(asset.subcaption, 'zh') || localize(asset.subcaption, 'en');
            const sourceName =
                localize(asset.source && asset.source.name, 'zh') ||
                localize(asset.source && asset.source.name, 'en') ||
                (asset.source && asset.source.id) ||
                '未记录来源';
            const preview =
                asset.type === 'image'
                    ? `<img class="figure-asset-image" src="${escapeHtml(assetImageSource(asset))}" alt="${escapeHtml(caption)}" loading="lazy">`
                    : `<div class="figure-asset-filetype">${escapeHtml(String(asset.type || 'file').toUpperCase())}</div>`;
            const defaultTitle = asset.canSetAsDefaultAvatar
                ? '将这张图片设为人物全局默认头像'
                : (asset.defaultAvatarIssues || []).join('；');
            const defaultActionLabel = group.isDefaultAvatar ? '当前默认头像' : '设为默认头像';
            const selectedForMerge = state.assetMergeSelection.has(group.path);
            const canonicalForMerge = state.assetMergeCanonical === group.path;
            const mergeControls =
                asset.type === 'image'
                    ? `<div class="asset-merge-controls"><label><input type="checkbox" data-asset-merge-select value="${escapeHtml(group.path)}"${selectedForMerge ? ' checked' : ''}>参与合并</label><label><input type="radio" name="figureAssetMergeCanonical" data-asset-merge-canonical value="${escapeHtml(group.path)}"${canonicalForMerge ? ' checked' : ''}>保留此路径</label></div>`
                    : '';
            return `<article class="figure-asset-card${group.isDefaultAvatar ? ' is-default' : ''}${selectedForMerge ? ' is-merge-selected' : ''}" data-event-id="${escapeHtml(asset.eventId)}" data-asset-id="${escapeHtml(asset.id)}">
                <div class="figure-asset-preview">${preview}<div class="figure-asset-overlay"><span>${group.eventIds.length} 个事件</span><span>${escapeHtml(group.roles.join(' / ') || asset.type)}</span></div></div>
                <div class="figure-asset-body">
                    <div class="figure-asset-title-row"><strong>${escapeHtml(caption)}</strong>${group.isDefaultAvatar ? '<span class="badge verified">默认头像</span>' : ''}</div>
                    ${mergeControls}
                    ${subcaption ? `<p>${escapeHtml(subcaption)}</p>` : ''}
                    <dl class="figure-asset-meta">
                        <div><dt>文件路径</dt><dd>${escapeHtml(group.path)}</dd></div>
                        <div><dt>来源</dt><dd>${escapeHtml(sourceName)}</dd></div>
                        <div><dt>授权</dt><dd>${escapeHtml((asset.rights && asset.rights.status) || '未标记')}</dd></div>
                        <div><dt>引用记录</dt><dd>${group.associations.length} 条 · ${group.assetIds.length} 个资产 ID</dd></div>
                    </dl>
                    <div class="figure-asset-tags">
                        ${group.usedByRelations ? '<span class="asset-tag active">被事件关系选作头像</span>' : '<span class="asset-tag">未被事件关系选用</span>'}
                        ${group.metadataConflict ? '<span class="asset-tag warning">来源或授权元数据不一致</span>' : ''}
                        ${group.eventIds.map((eventId) => `<span class="asset-tag">${escapeHtml(eventId)}</span>`).join('')}
                    </div>
                    <div class="figure-asset-actions">
                        <button data-asset-action="view">查看原图</button>
                        <button data-asset-action="copy-path">复制路径</button>
                        <button class="primary" data-asset-action="set-default" title="${escapeHtml(defaultTitle)}"${group.isDefaultAvatar || !asset.canSetAsDefaultAvatar ? ' disabled' : ''}>${defaultActionLabel}</button>
                    </div>
                </div>
            </article>`;
        })
        .join('');
    updateAssetMergeControls();
}

async function renderFigureAssets() {
    if (!state.entityId || state.creatingFigure) {
        state.figureAssets = [];
        resetAssetMergeSelection();
        elements.figureAssetCount.textContent = '0';
        elements.figureAssetGallery.innerHTML = '';
        elements.figureAssetEmpty.hidden = false;
        return;
    }
    state.figureAssets = await api(`/api/archive/figure-assets?figureId=${encodeURIComponent(state.entityId)}`);
    renderFigureAssetCards();
}

function relationRoleText(relation) {
    return localize(relation.role, 'zh') || localize(relation.role, 'en') || '未填写角色';
}

function renderFigureEvents() {
    const eventDetails = (state.figureUsage && state.figureUsage.eventDetails) || [];
    elements.figureEventCount.textContent = `${eventDetails.length} 个事件`;
    elements.figureEventEmpty.hidden = eventDetails.length > 0;
    elements.figureEventList.innerHTML = eventDetails
        .map((detail) => {
            const title = localize(detail.title, 'zh') || localize(detail.title, 'en') || detail.eventId;
            const canonical = detail.eventRelations.length
                ? detail.eventRelations
                      .map(
                          (relation) =>
                              `<span class="event-relation-chip${relation.primary ? ' primary' : ''}">${escapeHtml(relationRoleText(relation))}${relation.primary ? ' · 主要' : ''}</span>`
                      )
                      .join('')
                : '<span class="muted">无 Canonical 关系</span>';
            const variants = detail.variantRelations.length
                ? detail.variantRelations
                      .map(
                          (relation) =>
                              `<span class="event-relation-chip">${escapeHtml(relation.storylineId || 'variant')} · ${escapeHtml(relationRoleText(relation))}</span>`
                      )
                      .join('')
                : '<span class="muted">无 Variant 关系</span>';
            const eventAssets = state.figureAssets.filter((asset) => asset.eventId === detail.eventId);
            const uniquePaths = new Set(eventAssets.map((asset) => asset.path));
            const avatarIds = [
                ...detail.eventRelations.map((relation) => relation.avatarAssetId),
                ...detail.variantRelations.map((relation) => relation.avatarAssetId)
            ].filter(Boolean);
            const displayTargets = detail.displayTargets || [];
            const displayOptions = displayTargets
                .map((target, index) => {
                    const storylineTitle =
                        localize(target.storylineTitle, 'zh') ||
                        localize(target.storylineTitle, 'en') ||
                        target.storylineId;
                    return `<option value="${index}">${escapeHtml(storylineTitle)} · ${escapeHtml(target.storylineId)}</option>`;
                })
                .join('');
            return `<article class="figure-event-row" data-event-id="${escapeHtml(detail.eventId)}">
                <div class="figure-event-identity"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail.eventId)}</span></div>
                <div class="figure-event-cell"><span class="figure-event-label">Canonical</span><div class="event-relation-chips">${canonical}</div></div>
                <div class="figure-event-cell"><span class="figure-event-label">Variants</span><div class="event-relation-chips">${variants}</div></div>
                <div class="figure-event-cell"><span class="figure-event-label">资产引用</span><div>${eventAssets.length} 条记录 · ${uniquePaths.size} 个文件</div>${avatarIds.length ? `<div class="event-avatar-ids">头像：${escapeHtml([...new Set(avatarIds)].join('、'))}</div>` : ''}</div>
                <div class="figure-event-actions">
                    <button data-event-action="open-admin">后台事件</button>
                    ${displayTargets.length ? `<span class="figure-event-label">展示版本</span><select data-display-target aria-label="选择展示 Storyline">${displayOptions}</select><button class="primary" data-event-action="open-display">展示事件 ↗</button>` : '<button data-event-action="open-display" disabled title="该事件未加入启用的 Storyline">暂无展示页</button>'}
                </div>
            </article>`;
        })
        .join('');
}

async function openAdminEvent(eventId, file = 'event.json') {
    state.type = 'events';
    elements.entityType.value = 'events';
    await refresh();
    selectEntity(eventId);
    if (![...elements.fileSelect.options].some((option) => option.value === file)) {
        throw new Error(`${eventId} 没有 ${file}`);
    }
    state.file = file;
    elements.fileSelect.value = state.file;
    await loadEntity();
}

function buildPresentationEventUrl(target) {
    const url = new window.URL(window.location.href);
    url.port = '8000';
    url.pathname = '/index.html';
    url.search = '';
    url.hash = '';
    url.searchParams.set('storyline', target.storylineId);
    url.searchParams.set('uiMode', 'detail');
    url.searchParams.set('event', target.milestoneId);
    return url.href;
}

async function renderEventDisplayActions() {
    if (state.type !== 'events' || !state.entityId || !state.document) {
        state.eventDisplayTargets = [];
        elements.eventDisplayTarget.innerHTML = '';
        elements.openEventDisplayBtn.disabled = true;
        elements.inspectEventPresentationBtn.disabled = true;
        elements.restorePresentationInheritanceBtn.disabled = true;
        state.eventPresentationOpen = false;
        elements.eventPresentationPreview.textContent = '';
        return;
    }
    state.eventDisplayTargets = await api(
        `/api/archive/event-presentation-targets?eventId=${encodeURIComponent(state.entityId)}`
    );
    elements.eventDisplayTarget.innerHTML = state.eventDisplayTargets
        .map((target, index) => {
            const storylineTitle =
                localize(target.storylineTitle, 'zh') || localize(target.storylineTitle, 'en') || target.storylineId;
            const sourceLabel = target.hasOverride ? '覆盖' : '继承';
            return `<option value="${index}">${escapeHtml(storylineTitle)} · ${escapeHtml(target.storylineId)} · ${sourceLabel}</option>`;
        })
        .join('');
    elements.openEventDisplayBtn.disabled = state.eventDisplayTargets.length === 0;
    elements.openEventDisplayBtn.title = state.eventDisplayTargets.length
        ? '在展示页打开当前事件'
        : '该事件未加入启用的 Storyline';
    updateEventPresentationControls();
}

function selectedEventPresentationTarget() {
    return state.eventDisplayTargets[Number(elements.eventDisplayTarget.value)] || null;
}

function updateEventPresentationControls() {
    const target = selectedEventPresentationTarget();
    const canInspect = Boolean(target);
    const canRestore = Boolean(target && (target.hasOverride || target.refVariant));
    elements.inspectEventPresentationBtn.disabled = !canInspect;
    elements.restorePresentationInheritanceBtn.disabled = !canRestore;
    elements.restorePresentationInheritanceBtn.title = canRestore
        ? '删除当前覆盖并回到 event.defaultPresentation'
        : '当前展示已继承默认值';
    if (state.eventPresentationOpen && target) renderEventPresentationPanel(target);
}

function renderEventPresentationPanel(target) {
    state.eventPresentationOpen = true;
    elements.eventPresentationPanel.hidden = false;
    const source = target.hasOverride ? `使用覆盖文件 ${target.overrideFile}` : '继承 event.defaultPresentation';
    const variantNote = target.refVariant ? `，Storyline 显式指定 ${target.refVariant}` : '';
    elements.eventPresentationSummary.textContent = `${target.storylineId}：${source}${variantNote}。`;
    elements.eventPresentationPreview.textContent = JSON.stringify(
        {
            effectivePresentation: target.effectivePresentation,
            override: target.override,
            defaultPresentation: target.defaultPresentation
        },
        null,
        2
    );
}

async function restorePresentationInheritance() {
    const target = selectedEventPresentationTarget();
    if (!target) throw new Error('请选择展示 Storyline');
    if (!target.hasOverride && !target.refVariant) throw new Error('当前展示已经继承默认值');
    const source = target.hasOverride ? target.overrideFile : target.refVariant;
    if (!window.confirm(`确认让 ${state.entityId} / ${target.storylineId} 恢复继承默认展示？\n\n将清除：${source}`))
        return;
    const eventId = state.entityId;
    const result = await api('/api/archive/event-presentation-restore-inheritance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventId,
            storylineId: target.storylineId,
            milestoneId: target.milestoneId,
            expectedOverrideRevision: target.overrideRevision,
            expectedStorylineRevision: target.storylineRevision
        })
    });
    const keptNote = result.keptOverrideDueToReferences ? '，共享覆盖文件已保留' : '';
    setStatus(`已恢复继承，改写 ${result.changedFiles.length} 个文件${keptNote}`, 'ok');
    await refresh();
    selectEntity(eventId);
    await loadEntity();
}

async function setFigureDefaultAvatar(asset) {
    if (!window.confirm(`将 ${asset.id} 设为 ${state.entityId} 的全局默认头像？`)) return;
    const figureId = state.entityId;
    await api('/api/archive/figure-default-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            figureId,
            eventId: asset.eventId,
            assetId: asset.id,
            expectedRevision: state.revision
        })
    });
    await refresh();
    selectEntity(figureId);
    await loadEntity();
    setStatus(`已将 ${asset.id} 设为默认头像`, 'ok');
}

function currentRelations() {
    if (!Array.isArray(state.document.figures)) state.document.figures = [];
    return state.document.figures;
}

function relationFigure(figureId) {
    return (
        state.figureOptions.find((figure) => figure.id === figureId) || {
            id: figureId,
            name: { en: figureId, zh: figureId },
            type: 'person'
        }
    );
}

function figureTypeLabel(type) {
    return (
        {
            person: '人物',
            team: '团队',
            organization: '机构',
            product: '产品',
            system: '系统'
        }[type] ||
        type ||
        '人物'
    );
}

async function populateAvatarSelect(select, relation, figureId) {
    const assets = await api(
        `/api/archive/figure-assets?figureId=${encodeURIComponent(figureId)}&eventId=${encodeURIComponent(state.entityId)}`
    );
    const selected = relation.avatarAssetId || '';
    select.innerHTML = [
        '<option value="">使用默认头像 / 无事件覆盖</option>',
        ...assets.map(
            (asset) =>
                `<option value="${escapeHtml(asset.id)}">${escapeHtml(asset.id)} · ${escapeHtml(localize(asset.caption, 'zh') || asset.role)}</option>`
        )
    ].join('');
    select.value = selected;
    if (selected && select.value !== selected) {
        select.insertAdjacentHTML(
            'beforeend',
            `<option value="${escapeHtml(selected)}">${escapeHtml(selected)}（当前值）</option>`
        );
        select.value = selected;
    }
}

async function renderRelations() {
    await loadFigureOptions();
    const relations = currentRelations();
    const usedIds = new Set(relations.map((relation) => relation.figureId));
    elements.addFigureSelect.innerHTML = state.figureOptions
        .filter((figure) => !usedIds.has(figure.id))
        .map((figure) => `<option value="${escapeHtml(figure.id)}">${escapeHtml(figureLabel(figure))}</option>`)
        .join('');
    elements.relationRows.innerHTML = relations
        .map((relation, index) => {
            const figure = relationFigure(relation.figureId);
            return `<div class="relation-row" data-index="${index}">
              <div class="relation-title">
                <div><strong>${escapeHtml(localize(figure.name, 'zh') || localize(figure.name, 'en'))}</strong><div class="muted">${escapeHtml(relation.figureId)} · ${escapeHtml(figureTypeLabel(figure.type))}</div></div>
                <div class="relation-actions"><button class="relation-open-button" data-action="open-figure">打开人物资料</button><button data-action="up" title="上移">↑</button><button data-action="down" title="下移">↓</button><button data-action="remove">移除</button></div>
              </div>
              <div class="form-grid">
                <label class="role-field">英文角色<input data-field="role.en" value="${escapeHtml(localize(relation.role, 'en'))}"></label>
                <label class="role-field">中文角色<input data-field="role.zh" value="${escapeHtml(localize(relation.role, 'zh'))}"></label>
                <label class="span-2">事件头像<select data-field="avatarAssetId"><option value="">正在加载资产...</option></select></label>
                ${relation.avatarStyle ? `<label>头像样式<input data-field="avatarStyle" value="${escapeHtml(relation.avatarStyle)}"></label>` : ''}
                <div class="checks span-2"><label><input type="checkbox" data-field="primary"${relation.primary === true ? ' checked' : ''}>主要人物</label>${isVariantFile() ? `<label><input type="checkbox" data-field="useDefaultAvatar"${relation.useDefaultAvatar === true ? ' checked' : ''}>强制使用全局默认头像</label>` : ''}</div>
              </div>
            </div>`;
        })
        .join('');
    await Promise.all(
        [...elements.relationRows.querySelectorAll('.relation-row')].map((row) => {
            const index = Number(row.dataset.index);
            return populateAvatarSelect(
                row.querySelector('[data-field="avatarAssetId"]'),
                relations[index],
                relations[index].figureId
            );
        })
    );
}

function updateRelationField(index, field, target) {
    const relation = currentRelations()[index];
    if (!relation) return;
    if (field === 'role.en' || field === 'role.zh') {
        if (!relation.role) relation.role = { en: '', zh: '' };
        relation.role[field.endsWith('.en') ? 'en' : 'zh'] = target.value;
    } else if (field === 'primary' || field === 'useDefaultAvatar') {
        if (target.checked) relation[field] = true;
        else delete relation[field];
    } else if (field === 'avatarAssetId' || field === 'avatarStyle') {
        if (target.value) relation[field] = target.value;
        else delete relation[field];
    }
    syncEditor();
}

async function openFigureDetails(figureId) {
    state.type = 'figures';
    elements.entityType.value = 'figures';
    await refresh();
    if (!state.entities.some((figure) => figure.id === figureId)) {
        throw new Error(`Figure 不存在：${figureId}`);
    }
    selectEntity(figureId);
    await loadEntity();
}

async function saveEntity(runValidation = false) {
    if (!state.document) throw new Error('请先加载或新建实体');
    let result;
    if (state.type === 'figures') {
        const figure = collectFigureForm();
        state.document = figure;
        state.entityId = figure.id;
        syncEditor();
        result = await api('/api/archive/figure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                figureId: figure.id,
                data: figure,
                create: state.creatingFigure,
                expectedRevision: state.revision || state.figureListRevision
            })
        });
        state.creatingFigure = false;
    } else {
        let documentValue;
        try {
            documentValue = JSON.parse(elements.editor.value);
        } catch (error) {
            throw new Error(`JSON 无效：${error.message}`);
        }
        state.document = documentValue;
        const request =
            state.type === 'events'
                ? {
                      url: '/api/archive/file',
                      body: {
                          eventId: state.entityId,
                          file: state.file,
                          data: state.document,
                          expectedRevision: state.revision
                      }
                  }
                : {
                      url: '/api/archive/storyline',
                      body: {
                          storylineId: state.entityId,
                          data: state.document,
                          expectedRevision: state.revision
                      }
                  };
        result = await api(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.body)
        });
    }
    state.revision = result.revision || state.revision;
    setStatus(`已保存 ${state.entityId}${state.file ? ` / ${state.file}` : ''}`, 'ok');
    if (state.type === 'figures') {
        const selectedId = state.entityId;
        const list = await api('/api/archive/figures');
        state.entities = list.items;
        state.figureOptions = list.items;
        state.figureListRevision = list.revision;
        renderEntities();
        await renderFigureUsage();
        elements.figureId.disabled = true;
        state.entityId = selectedId;
    }
    if (runValidation) await runTask('validate');
}

async function runTask(task) {
    if (state.taskRunning) return;
    state.taskRunning = true;
    for (const button of [elements.validateBtn, elements.generateBtn, elements.saveValidateBtn]) button.disabled = true;
    elements.validationOutput.textContent = `${task === 'validate' ? '正在运行 Archive 校验' : '正在生成运行时数据'}...`;
    try {
        const result = await api(`/api/archive/${task}`, { method: 'POST' });
        elements.validationOutput.textContent =
            [result.stdout, result.stderr].filter(Boolean).join('\n') || `exitCode=${result.exitCode}`;
        setStatus(result.ok ? `${task} 已通过` : `${task} 失败`, result.ok ? 'ok' : 'bad');
    } finally {
        state.taskRunning = false;
        for (const button of [elements.validateBtn, elements.generateBtn, elements.saveValidateBtn])
            button.disabled = false;
    }
}

function auditItemHtml(item) {
    const actions = [];
    if (item.figureId)
        actions.push(
            `<button data-open-figure="${escapeHtml(item.figureId)}">人物 ${escapeHtml(item.figureId)}</button>`
        );
    if (item.eventId)
        actions.push(`<button data-open-event="${escapeHtml(item.eventId)}">事件 ${escapeHtml(item.eventId)}</button>`);
    return `<li><code>${escapeHtml(JSON.stringify(item))}</code>${actions.join(' ')}</li>`;
}

async function loadAudit() {
    const audit = await api('/api/archive/figure-audit');
    elements.currentEntity.textContent = `人物审计 · ${audit.generatedAt}`;
    elements.auditSummary.innerHTML = [
        ['身份', audit.summary.figures],
        ['错误', audit.summary.errors],
        ['警告', audit.summary.warnings],
        ['待审核', audit.summary.info]
    ]
        .map(([label, value]) => `<div class="summary-card"><strong>${value}</strong>${escapeHtml(label)}</div>`)
        .join('');
    elements.auditCategories.innerHTML = audit.categories.length
        ? audit.categories
              .map(
                  (category) =>
                      `<section class="audit-category ${escapeHtml(category.severity)}"><h3>${escapeHtml(category.title)} · ${category.items.length}</h3><div class="muted">${escapeHtml(category.code)} / ${escapeHtml(category.severity)}</div><ul class="audit-items">${category.items.map(auditItemHtml).join('')}</ul></section>`
              )
              .join('')
        : '<p class="muted">未发现人物身份问题。</p>';
    updatePanelVisibility();
    setStatus('人物审计已刷新', 'ok');
}

function createFigure() {
    state.type = 'figures';
    elements.entityType.value = 'figures';
    state.entityId = '';
    state.file = '';
    state.creatingFigure = true;
    state.revision = state.figureListRevision;
    state.document = {
        id: '',
        name: { en: '', zh: '' },
        aliases: [],
        type: 'person',
        organizationIds: [],
        profileSources: [],
        review: {
            status: 'draft',
            reviewedAt: new Date().toISOString().slice(0, 10),
            reviewer: 'archive-admin',
            notes: { en: '', zh: '' }
        }
    };
    elements.currentEntity.textContent = '新建全局人物 / 实体';
    syncEditor();
    updatePanelVisibility();
    renderFigureForm();
    renderAdvancedFigureTools().catch((error) => setStatus(error.message, 'bad'));
    elements.figureUsage.innerHTML = '';
    state.figureAssets = [];
    state.figureUsage = null;
    renderFigureAssets().catch((error) => setStatus(error.message, 'bad'));
    renderFigureEvents();
    elements.figureId.focus();
}

elements.entityList.addEventListener('click', async (event) => {
    const eventLink = event.target.closest('[data-open-event]');
    if (eventLink) {
        await openAdminEvent(eventLink.dataset.openEvent, eventLink.dataset.openFile || 'event.json').catch((error) =>
            setStatus(error.message, 'bad')
        );
        return;
    }
    const storylineCard = event.target.closest('[data-storyline-id]');
    if (storylineCard && state.type === 'storylines') {
        selectEntity(storylineCard.dataset.storylineId);
        await loadEntity().catch((error) => setStatus(error.message, 'bad'));
        return;
    }
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    selectEntity(button.dataset.id);
    await loadEntity().catch((error) => setStatus(error.message, 'bad'));
});
elements.storylineTimeline.addEventListener('click', async (event) => {
    const eventLink = event.target.closest('[data-open-event]');
    if (!eventLink) return;
    await openAdminEvent(eventLink.dataset.openEvent, eventLink.dataset.openFile || 'event.json').catch((error) =>
        setStatus(error.message, 'bad')
    );
});
elements.figureAlphabet.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-entity-index]');
    if (!button) return;
    const group = [...elements.entityList.querySelectorAll('[data-index-group]')].find(
        (candidate) => candidate.dataset.indexGroup === button.dataset.entityIndex
    );
    if (!group) return;
    elements.entityList.scrollTop = Math.max(0, group.offsetTop - 2);
    for (const candidate of elements.figureAlphabet.querySelectorAll('button')) {
        candidate.classList.toggle('is-active', candidate === button);
    }
});
elements.entityList.addEventListener('scroll', () => {
    if (!['events', 'figures'].includes(state.type) || elements.figureAlphabet.hidden) return;
    const dividers = [...elements.entityList.querySelectorAll('[data-index-group]')];
    const active = dividers.reduce(
        (current, divider) => (divider.offsetTop <= elements.entityList.scrollTop + 8 ? divider : current),
        dividers[0]
    );
    if (!active) return;
    for (const button of elements.figureAlphabet.querySelectorAll('button')) {
        button.classList.toggle('is-active', button.dataset.entityIndex === active.dataset.indexGroup);
    }
});

elements.entityType.addEventListener('change', () => {
    state.type = elements.entityType.value;
    elements.entitySearch.value = '';
    refresh().catch((error) => setStatus(error.message, 'bad'));
});
elements.entitySearch.addEventListener('input', renderEntities);
elements.fileSelect.addEventListener('change', () => {
    state.file = elements.fileSelect.value;
    loadEntity().catch((error) => setStatus(error.message, 'bad'));
});
elements.eventSectionNav.addEventListener('click', (event) => {
    const sectionButton = event.target.closest('[data-event-section]');
    if (!sectionButton) return;
    activateEventSection(sectionButton.dataset.eventSection).catch((error) => setStatus(error.message, 'bad'));
});
elements.eventVariantSelect.addEventListener('change', () => {
    if (elements.eventVariantSelect.value) selectEventFile(elements.eventVariantSelect.value, 'presentation');
});
document
    .getElementById('refreshBtn')
    .addEventListener('click', () => refresh().catch((error) => setStatus(error.message, 'bad')));
elements.loadBtn.addEventListener('click', () => loadEntity().catch((error) => setStatus(error.message, 'bad')));
elements.saveBtn.addEventListener('click', () => saveEntity(false).catch((error) => setStatus(error.message, 'bad')));
elements.saveValidateBtn.addEventListener('click', () =>
    saveEntity(true).catch((error) => setStatus(error.message, 'bad'))
);
elements.validateBtn.addEventListener('click', () =>
    runTask('validate').catch((error) => setStatus(error.message, 'bad'))
);
elements.generateBtn.addEventListener('click', () => {
    if (window.confirm('生成将更新 milestones-data.js 与 milestones-data-default.js。继续吗？')) {
        runTask('generate').catch((error) => setStatus(error.message, 'bad'));
    }
});
document.getElementById('auditBtn').addEventListener('click', () => {
    state.type = 'audit';
    elements.entityType.value = 'audit';
    refresh().catch((error) => setStatus(error.message, 'bad'));
});
elements.newFigureBtn.addEventListener('click', createFigure);

for (const id of figureFieldIds) {
    elements[id].addEventListener('change', () => {
        if (state.type !== 'figures' || !state.document) return;
        try {
            state.document = collectFigureForm();
            state.entityId = state.document.id;
            syncEditor();
            renderAvatarPreview();
            elements.figureReviewBadge.textContent = state.document.review.status;
            elements.figureReviewBadge.className = `badge ${state.document.review.status}`;
        } catch (error) {
            setStatus(error.message, 'bad');
        }
    });
}
elements.avatarPath.addEventListener('input', renderAvatarPreview);
elements.avatarStyle.addEventListener('input', renderAvatarPreview);
elements.openEventDisplayBtn.addEventListener('click', () => {
    const target = selectedEventPresentationTarget();
    if (target) window.open(buildPresentationEventUrl(target), '_blank', 'noopener');
});
elements.eventDisplayTarget.addEventListener('change', updateEventPresentationControls);
elements.inspectEventPresentationBtn.addEventListener('click', () => {
    activateEventSection('presentation')
        .then(() => {
            const target = selectedEventPresentationTarget();
            if (!target) return;
            renderEventPresentationPanel(target);
            updatePanelVisibility();
            renderEventSectionNav();
        })
        .catch((error) => setStatus(error.message, 'bad'));
});
elements.restorePresentationInheritanceBtn.addEventListener('click', () =>
    restorePresentationInheritance().catch((error) => setStatus(error.message, 'bad'))
);
elements.figureAssetGallery.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-asset-action]');
    const card = event.target.closest('.figure-asset-card');
    if (!button || !card) return;
    const asset = state.figureAssets.find(
        (candidate) => candidate.eventId === card.dataset.eventId && candidate.id === card.dataset.assetId
    );
    if (!asset) return;
    const action = button.dataset.assetAction;
    if (action === 'view') window.open(assetImageSource(asset), '_blank', 'noopener');
    if (action === 'copy-path') {
        navigator.clipboard
            .writeText(asset.path)
            .then(() => setStatus(`已复制 ${asset.path}`, 'ok'))
            .catch((error) => setStatus(`复制失败：${error.message}`, 'bad'));
    }
    if (action === 'set-default') {
        setFigureDefaultAvatar(asset).catch((error) => setStatus(error.message, 'bad'));
    }
});
elements.figureAssetGallery.addEventListener('change', (event) => {
    const mergeSelect = event.target.closest('[data-asset-merge-select]');
    const mergeCanonical = event.target.closest('[data-asset-merge-canonical]');
    if (mergeSelect) {
        if (mergeSelect.checked) state.assetMergeSelection.add(mergeSelect.value);
        else {
            state.assetMergeSelection.delete(mergeSelect.value);
            if (state.assetMergeCanonical === mergeSelect.value) state.assetMergeCanonical = '';
        }
        renderFigureAssetCards();
        return;
    }
    if (mergeCanonical) {
        state.assetMergeCanonical = mergeCanonical.value;
        state.assetMergeSelection.add(mergeCanonical.value);
        renderFigureAssetCards();
    }
});
elements.figureAssetMergeBtn.addEventListener('click', () =>
    mergeSelectedFigureAssets().catch((error) => setStatus(error.message, 'bad'))
);
elements.figureEventList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-event-action]');
    const row = event.target.closest('.figure-event-row');
    if (!button || !row) return;
    if (button.dataset.eventAction === 'open-admin') {
        openAdminEvent(row.dataset.eventId).catch((error) => setStatus(error.message, 'bad'));
    }
    if (button.dataset.eventAction === 'open-display') {
        const detail = ((state.figureUsage && state.figureUsage.eventDetails) || []).find(
            (candidate) => candidate.eventId === row.dataset.eventId
        );
        const select = row.querySelector('[data-display-target]');
        const target = detail && select ? detail.displayTargets[Number(select.value)] : null;
        if (target) window.open(buildPresentationEventUrl(target), '_blank', 'noopener');
    }
});
elements.mergeTargetSelect.addEventListener('change', resetMergePreview);
elements.mergePreviewBtn.addEventListener('click', () =>
    previewFigureMerge().catch((error) => setStatus(error.message, 'bad'))
);
elements.mergeExecuteBtn.addEventListener('click', () =>
    executeFigureMerge().catch((error) => setStatus(error.message, 'bad'))
);
elements.imageImportEvent.addEventListener('change', () =>
    loadImageImportSources().catch((error) => setStatus(error.message, 'bad'))
);
elements.imageImportSourceId.addEventListener('change', syncImageSourceMetadata);
elements.imageImportFile.addEventListener('change', async () => {
    const file = elements.imageImportFile.files[0];
    if (!file) {
        elements.imageImportPreview.hidden = true;
        elements.imageImportPlaceholder.hidden = false;
        return;
    }
    try {
        elements.imageImportPreview.src = await readFileAsDataUrl(file);
        elements.imageImportPreview.hidden = false;
        elements.imageImportPlaceholder.hidden = true;
    } catch (error) {
        setStatus(error.message, 'bad');
    }
});
elements.imageImportBtn.addEventListener('click', () =>
    importFigureImage().catch((error) => setStatus(error.message, 'bad'))
);

elements.editor.addEventListener('change', () => {
    if (state.type === 'audit') return;
    try {
        state.document = JSON.parse(elements.editor.value);
        if (state.type === 'figures') renderFigureForm();
        if (state.type === 'events' && state.eventSection === 'people')
            renderRelations().catch((error) => setStatus(error.message, 'bad'));
        renderStructuredEditor();
        setStatus('JSON 已同步到结构化编辑器', 'ok');
    } catch (error) {
        setStatus(`JSON 无效：${error.message}`, 'bad');
    }
});

elements.structuredEditor.addEventListener('input', (event) => {
    const target = event.target.closest('[data-structured-field]');
    if (!target) return;
    if (target.closest('[data-collection-index]')) updateCollectionField(target);
    else updateStructuredField(target);
});
elements.structuredEditor.addEventListener('change', (event) => {
    const target = event.target.closest('[data-structured-field]');
    if (target) {
        if (target.closest('[data-collection-index]')) updateCollectionField(target);
        else updateStructuredField(target);
        return;
    }
    const actionTarget = event.target.closest('[data-quiz-action]');
    if (!actionTarget) return;
    const item = actionTarget.closest('[data-collection-index]');
    if (actionTarget.dataset.quizAction === 'remove-option') {
        removeQuizOption(
            Number(item.dataset.collectionIndex),
            Number(actionTarget.closest('[data-option-index]').dataset.optionIndex)
        );
    }
});
elements.structuredEditor.addEventListener('click', (event) => {
    const presentationAction = event.target.closest('[data-presentation-action]');
    if (presentationAction) {
        handlePresentationAction(presentationAction);
        return;
    }
    const collectionAction = event.target.closest('[data-collection-action]');
    if (collectionAction) {
        handleCollectionAction(collectionAction);
        return;
    }
    const quizAction = event.target.closest('[data-quiz-action]');
    if (!quizAction) return;
    const item = quizAction.closest('[data-collection-index]');
    if (quizAction.dataset.quizAction === 'add-option') addQuizOption(Number(item.dataset.collectionIndex));
    if (quizAction.dataset.quizAction === 'remove-option') {
        removeQuizOption(
            Number(item.dataset.collectionIndex),
            Number(quizAction.closest('[data-option-index]').dataset.optionIndex)
        );
    }
});

elements.addFigureBtn.addEventListener('click', () => {
    const figureId = elements.addFigureSelect.value;
    if (!figureId) return;
    currentRelations().push({ figureId, role: { en: '', zh: '' } });
    syncEditor();
    renderRelations().catch((error) => setStatus(error.message, 'bad'));
});

elements.relationRows.addEventListener('input', (event) => {
    const row = event.target.closest('.relation-row');
    const field = event.target.dataset.field;
    if (!row || !field) return;
    updateRelationField(Number(row.dataset.index), field, event.target);
});
elements.relationRows.addEventListener('change', (event) => {
    const row = event.target.closest('.relation-row');
    const field = event.target.dataset.field;
    if (!row || !field) return;
    updateRelationField(Number(row.dataset.index), field, event.target);
});
elements.relationRows.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    const row = event.target.closest('.relation-row');
    if (!button || !row) return;
    const relations = currentRelations();
    const index = Number(row.dataset.index);
    if (button.dataset.action === 'open-figure') {
        const relation = relations[index];
        if (relation && relation.figureId) {
            openFigureDetails(relation.figureId).catch((error) => setStatus(error.message, 'bad'));
        }
        return;
    }
    if (button.dataset.action === 'remove') relations.splice(index, 1);
    if (button.dataset.action === 'up' && index > 0)
        [relations[index - 1], relations[index]] = [relations[index], relations[index - 1]];
    if (button.dataset.action === 'down' && index < relations.length - 1)
        [relations[index], relations[index + 1]] = [relations[index + 1], relations[index]];
    syncEditor();
    renderRelations().catch((error) => setStatus(error.message, 'bad'));
});

window.addEventListener('resize', updateStickyOffsets);
if ('ResizeObserver' in window) {
    const stickyObserver = new window.ResizeObserver(updateStickyOffsets);
    stickyObserver.observe(document.querySelector('header'));
    stickyObserver.observe(elements.workspaceToolbar);
}
updateStickyOffsets();

elements.auditCategories.addEventListener('click', (event) => {
    const figureButton = event.target.closest('[data-open-figure]');
    const eventButton = event.target.closest('[data-open-event]');
    if (figureButton) {
        state.type = 'figures';
        elements.entityType.value = 'figures';
        refresh()
            .then(() => {
                selectEntity(figureButton.dataset.openFigure);
                return loadEntity();
            })
            .catch((error) => setStatus(error.message, 'bad'));
    }
    if (eventButton) {
        state.type = 'events';
        elements.entityType.value = 'events';
        refresh()
            .then(() => {
                selectEntity(eventButton.dataset.openEvent);
                return loadEntity();
            })
            .catch((error) => setStatus(error.message, 'bad'));
    }
});

loadFigureOptions()
    .then(refresh)
    .catch((error) => setStatus(error.message, 'bad'));
