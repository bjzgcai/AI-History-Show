'use strict';

const state = {
    type: 'events',
    entities: [],
    entityId: '',
    file: '',
    eventSection: 'basic',
    figureSection: 'basic',
    document: null,
    revision: '',
    creatingFigure: false,
    figureOptions: [],
    eventOptions: [],
    figureListRevision: '',
    figureAssets: [],
    existingImageAssets: [],
    existingImageAssetsRevision: '',
    figureUsage: null,
    eventDisplayTargets: [],
    presentationReferences: { assets: [], sources: [], quizzes: [] },
    presentationReferenceEventId: '',
    assetSources: [],
    assetSourceEventId: '',
    pendingAssetIds: new Set(),
    pendingAssetPaths: new Set(),
    taskRunning: false,
    publishStatus: null,
    publishOperation: null,
    publishView: 'changes',
    historyVersions: [],
    historyLoaded: false,
    selectedHistoryVersionId: '',
    selectedHistoryVersion: null,
    draftSaving: false
};

const structuredEventFiles = new Set(['event.json', 'sources.json', 'assets.json', 'quizzes.json']);

const archiveTaskConfig = {
    validate: {
        title: '校验结果',
        pendingMessage: '正在运行 Archive 校验...',
        successMessage: 'Archive 校验已通过',
        failureMessage: 'Archive 校验失败'
    },
    generate: {
        title: '生成结果',
        pendingMessage: '正在生成运行时数据...',
        successMessage: '运行时数据生成成功',
        failureMessage: '运行时数据生成失败'
    }
};

const elements = Object.fromEntries(
    [
        'entityType',
        'entityTypeNav',
        'entityList',
        'figureAlphabet',
        'entitySearch',
        'entityCount',
        'newFigureBtn',
        'fileSelect',
        'eventDisplayActions',
        'eventDisplayTarget',
        'openEventDisplayBtn',
        'editor',
        'status',
        'currentEntity',
        'workspaceToolbar',
        'taskOutputPanel',
        'taskOutputTitle',
        'closeTaskOutputBtn',
        'validationOutput',
        'validateDraftBtn',
        'figurePanel',
        'relationPanel',
        'structuredPanel',
        'structuredTitle',
        'structuredSummary',
        'structuredFieldHint',
        'structuredAddBtn',
        'structuredEditor',
        'relationFileLink',
        'advancedJsonFiles',
        'advancedJsonEditorShell',
        'eventSectionNav',
        'figureSectionNav',
        'figureSectionTitle',
        'figureSectionSummary',
        'storylineOverviewPanel',
        'storylineOverviewKicker',
        'storylineOverviewTitle',
        'storylineOverviewSummary',
        'storylineOverviewStats',
        'storylineEventSelect',
        'addStorylineEventBtn',
        'storylineTimeline',
        'auditPanel',
        'publishPanel',
        'publishHeadingActions',
        'publishChangesTab',
        'publishHistoryTab',
        'publishChangesPane',
        'publishHistoryPane',
        'refreshPublishBtn',
        'refreshHistoryBtn',
        'generateTestPreviewBtn',
        'preparePublishBtn',
        'publishValidateBtn',
        'publishApplyBtn',
        'publishSavedValidateBtn',
        'publishGenerateBtn',
        'publishBuildBtn',
        'keepAllDraftsBtn',
        'discardAllDraftsBtn',
        'publishChangeCount',
        'publishArchiveChangeCount',
        'publishRuntimeStatus',
        'publishBundleStatus',
        'publishTestPreviewStatus',
        'publishChangeSummary',
        'publishChangeList',
        'publishTestPreviewDetails',
        'publishBundleDetails',
        'openTestPreview',
        'openPublishPreview',
        'publishOperationPanel',
        'publishOperationSummary',
        'publishOperationSteps',
        'historyVersionCount',
        'historyVersionList',
        'historyDetailEmpty',
        'historyVersionDetail',
        'historyDetailTitle',
        'historyDetailMeta',
        'historyDetailNote',
        'historyDetailSummary',
        'historyChangeList',
        'createRollbackDraftBtn',
        'jsonPanel',
        'figureUsage',
        'figureAssetCount',
        'openExistingFigureImageBtn',
        'openFigureImageUploadBtn',
        'existingFigureImageDialog',
        'closeExistingFigureImageBtn',
        'cancelExistingFigureImageBtn',
        'existingImageEvent',
        'existingImageAsset',
        'existingImagePreview',
        'existingImagePlaceholder',
        'existingImagePreviewImg',
        'existingImageDetails',
        'linkExistingFigureImageBtn',
        'figureImageUploadDialog',
        'closeFigureImageUploadBtn',
        'cancelFigureImageUploadBtn',
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
        'openDefaultAvatarAssetBtn',
        'replaceDefaultAvatarBtn',
        'removeDefaultAvatarBtn',
        'figureIdentityDetails',
        'loadBtn',
        'saveBtn',
        'validateBtn',
        'generateBtn',
        'addFigureBtn',
        'imageImportFile',
        'imageImportUrl',
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
        'figureProfileSourcesList',
        'figureProfileSourceCount',
        'addFigureProfileSourceBtn',
        'figureAvatarHeading',
        'figureAvatarEditor',
        'avatarStyleField',
        'figureIdField'
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
    'reviewNotesZh'
];
for (const id of figureFieldIds) elements[id] = document.getElementById(id);

function setStatus(text, className = '') {
    elements.status.textContent = text;
    elements.status.className = `status ${className}`;
    if (text.includes('尚未保存')) scheduleDraftSave();
}

function showError(error, prefix = '') {
    const detail = error instanceof Error ? error.message : String(error || '操作失败');
    const message = prefix ? `${prefix}：${detail}` : detail;
    elements.status.textContent = '';
    elements.status.className = 'status';
    window.alert(message);
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

async function loadPresentationReferences(force = false) {
    if (!force && state.presentationReferenceEventId === state.entityId) return;
    const entity = state.entities.find((item) => item.id === state.entityId);
    const files = new Set((entity && entity.files) || []);
    const definitions = [
        ['assets', 'assets.json'],
        ['sources', 'sources.json'],
        ['quizzes', 'quizzes.json']
    ];
    const entries = await Promise.all(
        definitions.map(async ([key, file]) => {
            if (!files.has(file)) return [key, []];
            const result = await api(
                `/api/archive/file?eventId=${encodeURIComponent(state.entityId)}&file=${encodeURIComponent(file)}`
            );
            return [key, Array.isArray(result.data) ? result.data : []];
        })
    );
    state.presentationReferences = Object.fromEntries(entries);
    state.presentationReferenceEventId = state.entityId;
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
    return name || '未命名人物';
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

function reviewStatusLabel(status) {
    return (
        {
            draft: '草稿',
            'needs-source': '待补来源',
            verified: '已核验',
            disputed: '有争议',
            deprecated: '已停用'
        }[status] ||
        status ||
        '草稿'
    );
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

function syncEntityTypeNavigation() {
    elements.entityType.value = state.type;
    for (const button of elements.entityTypeNav.querySelectorAll('[data-entity-type]')) {
        const isActive = button.dataset.entityType === state.type;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
}

function updatePanelVisibility() {
    syncEntityTypeNavigation();
    const publishMode = state.type === 'publish';
    document.body.classList.toggle('is-publish-mode', publishMode);
    const eventLoaded = state.type === 'events' && Boolean(state.document);
    const figureLoaded = state.type === 'figures' && Boolean(state.document);
    const structuredSections = new Set(['basic', 'presentation', 'sources', 'assets', 'quizzes']);
    elements.figurePanel.hidden = !figureLoaded || state.figureSection === 'advanced';
    elements.relationPanel.hidden = !eventLoaded || state.eventSection !== 'people';
    elements.structuredPanel.hidden = !eventLoaded || !structuredSections.has(state.eventSection);
    elements.auditPanel.hidden = state.type !== 'audit';
    elements.publishPanel.hidden = !publishMode;
    elements.jsonPanel.hidden =
        state.type === 'audit' ||
        publishMode ||
        !state.document ||
        (state.type === 'events' && state.eventSection !== 'advanced') ||
        (state.type === 'figures' && state.figureSection !== 'advanced');
    if (state.type === 'events') elements.jsonPanel.open = state.eventSection === 'advanced';
    if (state.type === 'figures') elements.jsonPanel.open = state.figureSection === 'advanced';
    elements.fileSelect.hidden = true;
    elements.eventSectionNav.hidden = state.type !== 'events' || !state.document;
    elements.figureSectionNav.hidden = !figureLoaded;
    elements.storylineOverviewPanel.hidden = state.type !== 'storylines' || !state.entityId;
    elements.eventDisplayActions.hidden = state.type !== 'events' || !state.document;
    elements.newFigureBtn.hidden = state.type !== 'figures';
    elements.entitySearch.hidden = state.type === 'audit' || publishMode;
    elements.loadBtn.hidden = state.type === 'audit' || publishMode;
    elements.validateDraftBtn.hidden = true;
    elements.saveBtn.hidden = true;
    elements.workspaceToolbar.hidden = publishMode;
    elements.emptyState.hidden =
        state.type === 'audit' ||
        publishMode ||
        Boolean(state.document) ||
        (state.type === 'storylines' && Boolean(state.entityId));
    elements.loadBtn.disabled = state.type !== 'audit' && !state.entityId;
    syncTaskActionAvailability();
}

const figureSectionConfig = {
    basic: {
        title: '基础信息',
        summary: '维护正式页面使用的名称与默认头像；内部身份资料按需展开。'
    },
    sources: {
        title: '资料来源（内部）',
        summary: '维护用于身份核验和资料追溯的来源记录，不直接显示在正式页面。'
    },
    assets: {
        title: '图片资产',
        summary: '管理默认头像的来源版权、查看关联图片，并合并重复的资产引用。'
    },
    events: {
        title: '关联事件',
        summary: '查看人物在事件基础信息和故事线展示版本中的角色及头像引用。'
    },
    review: {
        title: '审核信息（内部）',
        summary: '维护人物或实体的内部审核状态、审核日期与审核备注。'
    },
    advanced: {
        title: '高级 JSON',
        summary: '直接查看和编辑当前人物实体的完整原始 JSON。'
    }
};

function renderFigureSectionNav() {
    const visible = state.type === 'figures' && Boolean(state.document);
    elements.figureSectionNav.hidden = !visible;
    if (!visible) return;
    for (const button of elements.figureSectionNav.querySelectorAll('[data-figure-section]')) {
        button.classList.toggle('is-active', button.dataset.figureSection === state.figureSection);
    }
    const config = figureSectionConfig[state.figureSection] || figureSectionConfig.basic;
    elements.figureSectionTitle.textContent = config.title;
    elements.figureSectionSummary.textContent = config.summary;
    for (const panel of elements.figurePanel.querySelectorAll('[data-figure-section-panel]')) {
        panel.hidden = panel.dataset.figureSectionPanel !== state.figureSection;
    }
}

function activateFigureSection(section) {
    if (!figureSectionConfig[section] || state.type !== 'figures' || !state.document) return;
    state.figureSection = section;
    updatePanelVisibility();
    renderFigureSectionNav();
}

function updateStickyOffsets() {
    const header = document.querySelector('header');
    const headerStyle = window.getComputedStyle(header);
    const headerOffset = headerStyle.position === 'sticky' ? header.offsetHeight : 0;
    const toolbarOffset = elements.workspaceToolbar.offsetHeight;
    document.documentElement.style.setProperty('--admin-header-sticky-height', `${headerOffset}px`);
    document.documentElement.style.setProperty('--event-nav-sticky-top', `${headerOffset + toolbarOffset}px`);
}

function eventSectionForFile(file) {
    const normalizedFile = String(file || '');
    return (
        {
            'event.json': 'basic',
            'sources.json': 'sources',
            'assets.json': 'assets',
            'quizzes.json': 'quizzes'
        }[normalizedFile] || (normalizedFile.startsWith('variants/') ? 'presentation' : 'basic')
    );
}

function eventFileLabel(file) {
    if (file === 'event.json') return '基本资料';
    if (file === 'sources.json') return '来源';
    if (file === 'assets.json') return '图片与音视频';
    if (file === 'quizzes.json') return 'Quiz';
    if (file.startsWith('variants/')) return `展示覆盖 · ${file.slice('variants/'.length, -'.json'.length)}`;
    return file;
}

function advancedEventFileLabel(file) {
    if (file === 'event.json') return '事件与默认展示配置';
    if (file === 'claims.json') return '事实主张';
    return eventFileLabel(file);
}

function orderedEventFiles(files) {
    const preferred = ['event.json', 'claims.json', 'sources.json', 'assets.json', 'quizzes.json'];
    return [...files].sort((left, right) => {
        const leftIndex = preferred.indexOf(left);
        const rightIndex = preferred.indexOf(right);
        if (leftIndex !== -1 || rightIndex !== -1) {
            if (leftIndex === -1) return 1;
            if (rightIndex === -1) return -1;
            return leftIndex - rightIndex;
        }
        return left.localeCompare(right);
    });
}

function renderAdvancedJsonFiles() {
    if (elements.advancedJsonEditorShell.parentElement !== elements.jsonPanel) {
        elements.jsonPanel.append(elements.advancedJsonEditorShell);
    }
    if (state.type !== 'events' || !state.entityId || state.eventSection !== 'advanced') {
        elements.advancedJsonFiles.hidden = true;
        elements.advancedJsonFiles.innerHTML = '';
        elements.advancedJsonEditorShell.hidden = false;
        return;
    }
    const entity = state.entities.find((item) => item.id === state.entityId);
    const files = orderedEventFiles((entity && entity.files) || []);
    elements.advancedJsonFiles.innerHTML = files
        .map(
            (file) =>
                `<details class="advanced-json-file" data-advanced-json-file="${escapeHtml(file)}"${file === state.file ? ' open' : ''}><summary><code>${escapeHtml(file)}</code><span>${escapeHtml(advancedEventFileLabel(file))}</span></summary><div class="advanced-json-file-content"></div></details>`
        )
        .join('');
    elements.advancedJsonFiles.hidden = false;
    const activeFile = [...elements.advancedJsonFiles.querySelectorAll('[data-advanced-json-file]')].find(
        (item) => item.dataset.advancedJsonFile === state.file
    );
    if (activeFile) {
        activeFile.open = true;
        activeFile.querySelector('.advanced-json-file-content').append(elements.advancedJsonEditorShell);
    }
    elements.advancedJsonEditorShell.hidden = !activeFile;
}

async function openAdvancedJsonFile(file) {
    if (state.type !== 'events' || !state.entityId) return;
    const entity = state.entities.find((item) => item.id === state.entityId);
    if (!entity || !entity.files.includes(file)) throw new Error(`${state.entityId} 没有 ${file}`);
    state.eventSection = 'advanced';
    if (state.file !== file || !state.document) {
        await flushDraftSave();
        state.file = file;
        elements.fileSelect.value = file;
        await loadEntity();
        return;
    }
    updatePanelVisibility();
    renderEventSectionNav();
    renderFigureSectionNav();
    renderAdvancedJsonFiles();
}

async function activateEventSection(section) {
    if (state.type !== 'events' || !state.entityId) return;
    const entity = state.entities.find((item) => item.id === state.entityId);
    const files = (entity && entity.files) || [];
    let file = state.file;
    if (section === 'basic' || section === 'people') file = 'event.json';
    else if (section === 'presentation') file = 'event.json';
    else if (section === 'advanced') {
        state.eventSection = 'advanced';
        updatePanelVisibility();
        renderEventSectionNav();
        renderAdvancedJsonFiles();
        return;
    } else {
        file = {
            sources: 'sources.json',
            assets: 'assets.json',
            quizzes: 'quizzes.json'
        }[section];
    }
    if (!file || !files.includes(file)) return;
    state.eventSection = section;
    if (state.file !== file || !state.document) {
        await flushDraftSave();
        state.file = file;
        elements.fileSelect.value = file;
        await loadEntity();
        return;
    }
    if (section === 'presentation') await loadPresentationReferences(true);
    updatePanelVisibility();
    renderEventSectionNav();
    renderStructuredEditor();
    if (section === 'people') await renderRelations();
}

function renderEventSectionNav() {
    if (state.type !== 'events' || !state.document) {
        elements.eventSectionNav.hidden = true;
        return;
    }
    const entity = state.entities.find((item) => item.id === state.entityId);
    const files = (entity && entity.files) || [];
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

function storylineYearValue(year) {
    const value = Number.parseFloat(String(year || '').trim());
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function storylineEventDetails(membership) {
    const eventId = membership.eventId || membership.id;
    const event = state.eventOptions.find((candidate) => candidate.id === eventId) || membership;
    return {
        ...membership,
        eventId,
        year: event.year || '',
        title: event.title || {},
        variants: event.variants || [],
        hasDefaultPresentation: event.hasDefaultPresentation !== false
    };
}

function compareStorylineEvents(left, right) {
    const leftDetails = storylineEventDetails(left);
    const rightDetails = storylineEventDetails(right);
    return (
        storylineYearValue(leftDetails.year) - storylineYearValue(rightDetails.year) ||
        String(leftDetails.year).localeCompare(String(rightDetails.year), 'en', { numeric: true }) ||
        leftDetails.eventId.localeCompare(rightDetails.eventId)
    );
}

function normalizeStorylineEventOrder() {
    if (state.type !== 'storylines' || !state.document || !Array.isArray(state.document.events)) return;
    state.document.events = [...state.document.events]
        .sort(compareStorylineEvents)
        .map((membership, index) => ({ ...membership, order: (index + 1) * 10 }));
}

function syncSelectedStorylineSummary() {
    const entity = state.entities.find((item) => item.id === state.entityId);
    if (!entity || !state.document || !Array.isArray(state.document.events)) return;
    entity.title = state.document.title || entity.title;
    entity.subtitle = state.document.subtitle || entity.subtitle;
    entity.events = state.document.events.map(storylineEventDetails);
    entity.totalEventCount = entity.events.length;
    entity.enabledEventCount = entity.events.filter((event) => event.enabled !== false).length;
    entity.usageCount = entity.enabledEventCount;
    entity.used = entity.enabledEventCount > 0;
}

function storylineMilestoneId(eventId) {
    const base = `milestone-${state.entityId}-${eventId}`;
    const usedIds = new Set(
        state.entities.flatMap((storyline) =>
            (storyline.events || [])
                .filter((membership) => storyline.id !== state.entityId || membership.eventId !== eventId)
                .map((membership) => membership.milestoneId)
                .filter(Boolean)
        )
    );
    if (!usedIds.has(base)) return base;
    let suffix = 2;
    while (usedIds.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

function renderStorylineEventPicker(memberships) {
    const memberIds = new Set(memberships.map((membership) => membership.eventId));
    const availableEvents = state.eventOptions.filter((event) => !memberIds.has(event.id)).sort(compareStorylineEvents);
    elements.storylineEventSelect.innerHTML = availableEvents.length
        ? `<option value="">选择事件</option>${availableEvents
              .map((event) => {
                  const title = localize(event.title, 'zh') || localize(event.title, 'en') || event.id;
                  return `<option value="${escapeHtml(event.id)}">${escapeHtml(`${event.year || '未设置年份'} · ${title} · ${event.id}`)}</option>`;
              })
              .join('')}`
        : '<option value="">没有可添加的事件</option>';
    elements.storylineEventSelect.disabled = !state.document || availableEvents.length === 0;
    elements.addStorylineEventBtn.disabled = !state.document || availableEvents.length === 0;
}

function renderStorylineOverview() {
    if (!elements.storylineOverviewPanel) return;
    const entity = state.entities.find((item) => item.id === state.entityId);
    if (state.type !== 'storylines' || !entity || !state.entityId) {
        elements.storylineOverviewPanel.hidden = true;
        elements.storylineTimeline.innerHTML = '';
        return;
    }
    const storyline = state.document || entity;
    const memberships = Array.isArray(storyline.events) ? storyline.events : [];
    const events = [...memberships].sort(compareStorylineEvents).map(storylineEventDetails);
    const title = localize(storyline.title, 'zh') || localize(storyline.title, 'en') || entity.id;
    const subtitle =
        localize(storyline.subtitle, 'zh') || localize(storyline.subtitle, 'en') || '按时间顺序维护故事线事件';
    const enabledEventCount = memberships.filter((membership) => membership.enabled !== false).length;
    elements.storylineOverviewKicker.textContent = 'STORYLINE';
    elements.storylineOverviewTitle.textContent = title;
    elements.storylineOverviewSummary.textContent = subtitle;
    elements.storylineOverviewStats.innerHTML = [
        `<span class="storyline-stat"><strong>${enabledEventCount}</strong><small>启用事件</small></span>`,
        `<span class="storyline-stat"><strong>${memberships.length}</strong><small>全部事件</small></span>`
    ].join('');
    renderStorylineEventPicker(memberships);
    elements.storylineTimeline.innerHTML = events.length
        ? events
              .map((event, index) => {
                  const eventTitle = localize(event.title, 'zh') || localize(event.title, 'en') || event.eventId;
                  const enabled = event.enabled !== false;
                  const status = enabled ? '启用' : '停用';
                  const stateClass = enabled ? 'is-enabled' : 'is-disabled';
                  return `<div class="storyline-timeline-item ${stateClass}" data-storyline-event-id="${escapeHtml(event.eventId)}">
                      <button type="button" class="storyline-timeline-open" data-open-event="${escapeHtml(event.eventId)}" data-open-file="event.json">
                          <span class="storyline-timeline-marker"><span>${String(index + 1).padStart(2, '0')}</span></span>
                          <span class="storyline-timeline-content">
                              <span class="storyline-timeline-meta"><span>${escapeHtml(event.year || '未设置年份')}</span><span>${escapeHtml(event.eventId)}</span></span>
                              <strong>${escapeHtml(eventTitle)}</strong>
                              <span class="storyline-timeline-status">${status}</span>
                          </span>
                          <span class="entity-chevron">›</span>
                      </button>
                      <button type="button" class="storyline-remove-button" data-remove-storyline-event="${escapeHtml(event.eventId)}" title="从故事线移除" aria-label="从故事线移除 ${escapeHtml(eventTitle)}">×</button>
                  </div>`;
              })
              .join('')
        : '<div class="storyline-empty">当前 Storyline 尚未配置事件。</div>';
    elements.storylineOverviewPanel.hidden = false;
}

function addStorylineEvent() {
    if (state.type !== 'storylines' || !state.document) return;
    const eventId = elements.storylineEventSelect.value;
    if (!eventId) {
        showError('请先选择要添加的事件');
        return;
    }
    if (!Array.isArray(state.document.events)) state.document.events = [];
    if (state.document.events.some((membership) => membership.eventId === eventId)) {
        showError('该事件已在当前故事线中');
        return;
    }
    const event = state.eventOptions.find((candidate) => candidate.id === eventId);
    if (!event) {
        showError('未找到所选事件');
        return;
    }
    const membership = {
        eventId,
        order: 0,
        enabled: true,
        milestoneId: storylineMilestoneId(eventId)
    };
    if (!event.hasDefaultPresentation) {
        if ((event.variants || []).includes(state.entityId)) {
            // The storyline-specific variant is resolved implicitly.
        } else if ((event.variants || []).length === 1) {
            membership.variant = event.variants[0];
        } else {
            showError('该事件没有默认展示配置，请先在高级 JSON 中指定 variant');
            return;
        }
    }
    state.document.events.push(membership);
    normalizeStorylineEventOrder();
    syncSelectedStorylineSummary();
    syncEditor();
    renderEntities();
    renderStorylineOverview();
    focusNewEntry(
        elements.storylineTimeline.querySelector(`[data-storyline-event-id="${window.CSS.escape(eventId)}"]`),
        '.storyline-timeline-open'
    );
    setStatus('事件已加入故事线，尚未保存', '');
}

function removeStorylineEvent(eventId) {
    if (state.type !== 'storylines' || !state.document || !Array.isArray(state.document.events)) return;
    const event = state.eventOptions.find((candidate) => candidate.id === eventId);
    const title = localize(event && event.title, 'zh') || localize(event && event.title, 'en') || eventId;
    if (!window.confirm(`确认从当前故事线移除“${title}”？\n\n事件本身及其资料不会被删除。`)) return;
    state.document.events = state.document.events.filter((membership) => membership.eventId !== eventId);
    normalizeStorylineEventOrder();
    syncSelectedStorylineSummary();
    syncEditor();
    renderEntities();
    renderStorylineOverview();
    setStatus('事件已从故事线移除，尚未保存', '');
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
                detail = `${entity.year || '未设置年份'} · ${entity.usageCount} 个故事线`;
            }
            if (state.type === 'figures') {
                title = localize(entity.name, 'zh') || localize(entity.name, 'en') || '未命名人物';
                detail = `${figureTypeLabel(entity.type)} · ${reviewStatusLabel(entity.reviewStatus)} · ${entity.usedEventCount} 个展示事件 · ${entity.assetCount} 个图片资产`;
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
    setTaskOutputVisible(false);
    state.entityId = '';
    state.document = null;
    state.revision = '';
    state.creatingFigure = false;
    state.figureAssets = [];
    state.existingImageAssets = [];
    state.existingImageAssetsRevision = '';
    state.figureUsage = null;
    state.eventDisplayTargets = [];
    state.presentationReferences = { assets: [], sources: [], quizzes: [] };
    state.presentationReferenceEventId = '';
    state.assetSources = [];
    state.assetSourceEventId = '';
    state.pendingAssetIds = new Set();
    state.pendingAssetPaths = new Set();
    if (state.type === 'events') state.eventSection = 'basic';
    if (state.type === 'figures') state.figureSection = 'basic';
    elements.currentEntity.textContent = '尚未选择实体';
    elements.editor.value = '';
    elements.structuredEditor.innerHTML = '';
    if (state.type === 'events') state.entities = await api('/api/archive/events');
    if (state.type === 'storylines') {
        [state.entities, state.eventOptions] = await Promise.all([
            api('/api/archive/storylines'),
            api('/api/archive/events')
        ]);
    }
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
    if (state.type === 'publish') {
        state.entities = [];
        elements.currentEntity.textContent = '发布管理';
        await loadPublishStatus();
        renderPublishView();
        if (state.publishView === 'history') await loadPublishHistory();
    }
    renderEntities();
    updatePanelVisibility();
    renderAdvancedJsonFiles();
    renderEventSectionNav();
    renderFigureSectionNav();
    renderStorylineOverview();
}

function selectEntity(id) {
    state.entityId = id;
    state.document = null;
    state.revision = '';
    state.creatingFigure = false;
    state.figureAssets = [];
    state.existingImageAssets = [];
    state.existingImageAssetsRevision = '';
    state.presentationReferences = { assets: [], sources: [], quizzes: [] };
    state.presentationReferenceEventId = '';
    state.assetSources = [];
    state.assetSourceEventId = '';
    state.pendingAssetIds = new Set();
    state.pendingAssetPaths = new Set();
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
        if (state.type === 'figures') state.figureSection = 'basic';
    }
    renderEntities();
    updatePanelVisibility();
    renderFigureSectionNav();
    renderStorylineOverview();
}

function syncEditor() {
    elements.editor.value = state.document ? JSON.stringify(state.document, null, 2) : '';
}

function cloneJson(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function focusNewEntry(entry, focusSelector) {
    if (!entry || !entry.isConnected) return;
    const focusTarget = focusSelector ? entry.querySelector(focusSelector) : null;
    entry.scrollIntoView({ behavior: 'auto', block: 'start' });
    entry.classList.add('is-new-entry');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    window.requestAnimationFrame(() => {
        if (!entry || !entry.isConnected) return;
        entry.scrollIntoView({ behavior: 'auto', block: 'start' });
        if (focusTarget) {
            focusTarget.focus({ preventScroll: true });
            window.setTimeout(() => {
                if (focusTarget.isConnected && document.activeElement !== focusTarget) {
                    focusTarget.focus({ preventScroll: true });
                }
            }, 0);
        }
        window.setTimeout(() => entry.classList.remove('is-new-entry'), 1600);
    });
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

function getPath(value, path) {
    return String(path)
        .split('.')
        .reduce((current, key) => (current === undefined || current === null ? undefined : current[key]), value);
}

function localizedValue(value, locale) {
    return localize(value, locale);
}

function fieldLabel(label, required = false, requiredTitle = '必填') {
    return `${escapeHtml(label)}${required ? ` <span class="required-mark" title="${escapeHtml(requiredTitle)}" aria-label="${escapeHtml(requiredTitle)}">*</span>` : ''}`;
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
    const readOnly = options.readOnly ? ' readonly' : '';
    const required = options.required ? ' required' : '';
    const pattern = options.pattern ? ` pattern="${escapeHtml(options.pattern)}"` : '';
    const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : '';
    const inputValue = type === 'checkbox' ? '' : ` value="${escapeHtml(value ?? '')}"`;
    return `<label${className}>${fieldLabel(label, options.required || options.requiredMark, options.requiredTitle)}<input type="${type}" data-structured-field="${escapeHtml(path)}" data-structured-format="${format}"${inputValue}${checked}${disabled}${readOnly}${required}${pattern}${placeholder}></label>`;
}

function formTextarea(label, path, value, options = {}) {
    const className = options.span ? ' class="span-2"' : '';
    const textareaClass = options.className || '';
    const required = options.required ? ' required' : '';
    return `<label${className}>${fieldLabel(label, options.required || options.requiredMark, options.requiredTitle)}<textarea class="${textareaClass}" data-structured-field="${escapeHtml(path)}" data-structured-format="${escapeHtml(options.format || 'text')}"${required}>${escapeHtml(value ?? '')}</textarea></label>`;
}

function formSelect(label, path, value, options, config = {}) {
    const className = config.span ? ' class="span-2"' : '';
    const selectedOptions = options
        .map(
            ([optionValue, optionLabel]) =>
                `<option value="${escapeHtml(optionValue)}"${String(optionValue) === String(value ?? '') ? ' selected' : ''}>${escapeHtml(optionLabel)}</option>`
        )
        .join('');
    const required = config.required ? ' required' : '';
    return `<label${className}>${fieldLabel(label, config.required || config.requiredMark, config.requiredTitle)}<select data-structured-field="${escapeHtml(path)}" data-structured-format="${escapeHtml(config.format || 'text')}"${required}>${selectedOptions}</select></label>`;
}

function localizedFields(prefix, value, options = {}) {
    return `${formTextarea(`${options.label || '内容'}（中文）`, `${prefix}.zh`, localizedValue(value, 'zh'), { className: options.className || 'short', span: options.span, required: options.required })}${formTextarea(`${options.label || '内容'}（英文）`, `${prefix}.en`, localizedValue(value, 'en'), { className: options.className || 'short', span: options.span, required: options.required })}`;
}

function internalNoteField(prefix, value, options = {}) {
    return formTextarea(options.label || '备注', `${prefix}.zh`, localizedValue(value, 'zh'), {
        className: options.className || 'short',
        span: options.span
    });
}

function hasLocalizedValue(value) {
    return Boolean(localizedValue(value, 'zh').trim() || localizedValue(value, 'en').trim());
}

function renderEventForm(event) {
    const location = event.location || {};
    const coordinates = Array.isArray(location.coordinates) ? location.coordinates : [];
    const review = event.review || {};
    const notes = review.notes || {};
    return `<section class="structured-section"><div class="form-grid">
        ${formInput('年份', 'year', event.year, { format: 'year' })}
        ${formInput('日期', 'date', event.date)}
        ${hasLocalizedValue(event.summary) ? localizedFields('summary', event.summary, { label: '摘要', className: 'short' }) : ''}
        ${formInput('地点（中文）', 'location.place.zh', localizedValue(location.place, 'zh'))}
        ${formInput('地点（英文）', 'location.place.en', localizedValue(location.place, 'en'))}
        ${formInput('国家（中文）', 'location.country.zh', localizedValue(location.country, 'zh'))}
        ${formInput('国家（英文）', 'location.country.en', localizedValue(location.country, 'en'))}
        ${formInput('纬度', 'location.coordinates.0', coordinates[0], { format: 'number' })}
        ${formInput('经度', 'location.coordinates.1', coordinates[1], { format: 'number' })}
    </div></section><details class="collection-more event-review-more"><summary>更多（内部用途）</summary><div class="form-grid">
        ${formSelect('状态', 'review.status', review.status || 'draft', [
            ['draft', '草稿'],
            ['needs-source', '待补来源'],
            ['verified', '已核验'],
            ['disputed', '有争议'],
            ['deprecated', '已停用']
        ])}
        ${internalNoteField('review.notes', notes, { label: '审核备注', className: 'short', span: true })}
    </div></details>`;
}

function presentationFieldPath(prefix, path) {
    return prefix ? `${prefix}.${path}` : path;
}

function adminMediaUrl(value) {
    const url = String(value || '').trim();
    if (!url || /^(?:https?:|data:|blob:)/i.test(url)) return url;
    return `/${url.replace(/^\/+/, '')}`;
}

function renderAssetMedia(asset, compact = false) {
    const type = String((asset && asset.type) || '').trim();
    const className = compact ? ' asset-media-preview-compact' : '';
    if (asset && state.pendingAssetPaths.has(asset.path)) {
        return `<div class="asset-media-preview asset-media-pending${className}"><span>文件尚未放入自动生成的资源路径</span></div>`;
    }
    if (['image', 'svg', 'gif'].includes(type) && asset.path) {
        const alt = localizedValue(asset.caption, 'zh') || localizedValue(asset.caption, 'en') || '资产预览';
        return `<figure class="asset-media-preview${className}"><img src="${escapeHtml(adminMediaUrl(asset.path))}" alt="${escapeHtml(alt)}" loading="lazy"></figure>`;
    }
    if (type === 'audio') {
        const audioUrl =
            asset.deliveryUrl || (asset.storage && (asset.storage.publicUrl || asset.storage.sourcePath)) || asset.path;
        return audioUrl
            ? `<div class="asset-media-preview asset-audio-preview${className}"><audio controls preload="none" src="${escapeHtml(adminMediaUrl(audioUrl))}"></audio></div>`
            : '';
    }
    if (type === 'video') {
        const videoUrl =
            asset.deliveryUrl || (asset.storage && (asset.storage.publicUrl || asset.storage.sourcePath)) || asset.path;
        return videoUrl
            ? `<div class="asset-media-preview asset-video-preview${className}"><video controls preload="none" src="${escapeHtml(adminMediaUrl(videoUrl))}"></video></div>`
            : '';
    }
    return '';
}

function isPresentationImageAsset(asset) {
    return !asset || ['image', 'svg', 'gif'].includes(String(asset.type || '').trim());
}

function isPresentationAudioVideoAsset(asset) {
    return Boolean(asset && ['audio', 'video'].includes(String(asset.type || '').trim()));
}

function presentationReferenceItem(kind, id) {
    const key = kind === 'quiz' ? 'quizzes' : `${kind}s`;
    return (state.presentationReferences[key] || []).find((item) => item.id === id) || null;
}

function presentationReferenceName(kind, item) {
    if (!item) return '';
    if (kind === 'asset') {
        return localizedValue(item.caption, 'zh') || localizedValue(item.caption, 'en') || item.path || '未命名资产';
    }
    if (kind === 'source') {
        return localizedValue(item.title, 'zh') || localizedValue(item.title, 'en') || item.url || '未命名来源';
    }
    return localizedValue(item.question, 'zh') || localizedValue(item.question, 'en') || '未命名 Quiz';
}

function referenceMetaRow(label, value) {
    const text = String(value || '').trim();
    return text
        ? `<div class="reference-meta-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(text)}</strong></div>`
        : '';
}

function renderPresentationReferenceCard(kind, id) {
    const item = presentationReferenceItem(kind, id);
    if (!item) {
        return `<article class="presentation-reference-card is-missing"><strong>未找到对应记录</strong><span>${escapeHtml(id)}</span></article>`;
    }
    const title = presentationReferenceName(kind, item);
    const englishTitle =
        kind === 'asset'
            ? localizedValue(item.caption, 'en')
            : kind === 'source'
              ? localizedValue(item.title, 'en')
              : localizedValue(item.question, 'en');
    if (kind === 'asset') {
        return `<article class="presentation-reference-card">${renderAssetMedia(item, true)}<div class="presentation-reference-copy"><strong>${escapeHtml(title)}</strong>${englishTitle && englishTitle !== title ? `<p>${escapeHtml(englishTitle)}</p>` : ''}<div class="reference-meta-grid">${referenceMetaRow('类型', item.type)}${referenceMetaRow('角色', item.role)}${referenceMetaRow('语言', item.language)}${referenceMetaRow('路径', item.path)}</div></div></article>`;
    }
    if (kind === 'source') {
        const label = localizedValue(item.label, 'zh') || localizedValue(item.label, 'en');
        return `<article class="presentation-reference-card"><div class="presentation-reference-copy"><strong>${escapeHtml(title)}</strong>${englishTitle && englishTitle !== title ? `<p>${escapeHtml(englishTitle)}</p>` : ''}<div class="reference-meta-grid">${referenceMetaRow('标签', label)}${referenceMetaRow('类型', item.type)}</div>${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">打开来源页面</a>` : ''}</div></article>`;
    }
    const options = Array.isArray(item.options) ? item.options : [];
    return `<article class="presentation-reference-card"><div class="presentation-reference-copy"><strong>${escapeHtml(title)}</strong>${englishTitle && englishTitle !== title ? `<p>${escapeHtml(englishTitle)}</p>` : ''}${options.length ? `<ol class="reference-quiz-options">${options.map((option, optionIndex) => `<li class="${optionIndex === item.answer ? 'is-answer' : ''}">${escapeHtml(localizedValue(option.text || option, 'zh') || localizedValue(option.text || option, 'en') || '未填写')}</li>`).join('')}</ol>` : ''}${localizedValue(item.explanation, 'zh') ? `<p>${escapeHtml(localizedValue(item.explanation, 'zh'))}</p>` : ''}</div></article>`;
}

function renderPresentationReferenceField(label, path, value, kind, options = {}) {
    const ids = options.multiple ? collectionOptions(value) : String(value || '').trim() ? [String(value).trim()] : [];
    const firstItem = ids.length === 1 ? presentationReferenceItem(kind, ids[0]) : null;
    const summary =
        ids.length === 0
            ? options.emptySummary || '未选择'
            : ids.length === 1
              ? presentationReferenceName(kind, firstItem) || '记录未找到'
              : `${ids.length} 项`;
    const editor = options.multiple
        ? formTextarea('引用 ID（每行一个）', path, ids.join('\n'), { className: 'short', format: 'lines', span: true })
        : formInput('引用 ID', path, ids[0] || '', { span: true });
    return `<details class="presentation-reference-field span-2"><summary><span>${escapeHtml(label)}</span><span class="presentation-reference-summary">${escapeHtml(summary)}</span></summary><div class="presentation-reference-content"><div class="form-grid">${editor}</div><div class="presentation-reference-list">${ids.length ? ids.map((id) => renderPresentationReferenceCard(kind, id)).join('') : `<div class="collection-empty">${escapeHtml(options.emptyText || '尚未选择引用。')}</div>`}</div></div></details>`;
}

function renderPresentationReferenceList(label, field, value, kind, config = {}) {
    const allIds = collectionOptions(value);
    const filter = typeof config.filter === 'function' ? config.filter : () => true;
    const references = allIds
        .map((id, index) => ({ id, index, item: presentationReferenceItem(kind, id) }))
        .filter(({ id, item }) => filter(item, id));
    const ids = references.map(({ id }) => id);
    const available = (state.presentationReferences[kind === 'asset' ? 'assets' : 'sources'] || []).filter(
        (item) => filter(item, item.id) && !allIds.includes(item.id)
    );
    const options = available
        .map(
            (item) =>
                `<option value="${escapeHtml(item.id)}">${escapeHtml(presentationReferenceName(kind, item))}</option>`
        )
        .join('');
    const items = ids.length
        ? references
              .map(({ id, index, item }, visibleIndex) => {
                  const title = presentationReferenceName(kind, item) || '记录未找到';
                  const previousIndex = visibleIndex > 0 ? references[visibleIndex - 1].index : '';
                  const nextIndex = visibleIndex < references.length - 1 ? references[visibleIndex + 1].index : '';
                  return `<div class="presentation-reference-list-item" data-reference-index="${index}"><details><summary>${escapeHtml(title)}</summary><div class="presentation-reference-item-detail">${renderPresentationReferenceCard(kind, id)}</div></details><div class="collection-actions"><button type="button" data-presentation-reference-action="up" data-reference-swap-index="${previousIndex}" title="上移"${visibleIndex === 0 ? ' disabled' : ''}>↑</button><button type="button" data-presentation-reference-action="down" data-reference-swap-index="${nextIndex}" title="下移"${visibleIndex === references.length - 1 ? ' disabled' : ''}>↓</button><button type="button" class="danger" data-presentation-reference-action="remove">移除</button></div></div>`;
              })
              .join('')
        : `<div class="collection-empty">${escapeHtml(config.emptyText || '尚未选择内容。')}</div>`;
    const className = config.className ? ` ${escapeHtml(config.className)}` : '';
    return `<section class="presentation-reference-manager span-2${className}" data-presentation-reference-field="${escapeHtml(field)}"><div class="presentation-reference-manager-heading"><div><strong>${escapeHtml(label)}</strong><span class="badge">${ids.length}</span></div><div class="inline-actions"><select data-presentation-reference-select aria-label="选择要添加的${escapeHtml(label)}"><option value="">${available.length ? '选择内容' : '没有更多可添加内容'}</option>${options}</select><button type="button" data-presentation-reference-action="add"${available.length ? '' : ' disabled'}>添加</button></div></div><div class="presentation-reference-list">${items}</div></section>`;
}

function renderCommentarySections(sections, prefix) {
    const items = Array.isArray(sections) ? sections : [];
    return `<div class="presentation-sections"><div class="subsection-heading"><div><strong>Commentary sections</strong><p class="muted">每个段落维护双语正文和来源绑定。</p></div><button type="button" data-presentation-action="add-section">新增段落</button></div>${
        items.length
            ? items
                  .map((section, index) => {
                      const label = section.label || {};
                      const html = section.html || {};
                      return `<article class="presentation-section-item" data-presentation-section-index="${index}"><div class="collection-item-heading"><div><strong>段落 ${index + 1}</strong></div><div class="collection-actions"><button type="button" data-presentation-action="up-section">↑</button><button type="button" data-presentation-action="down-section">↓</button><button type="button" class="danger" data-presentation-action="remove-section">移除</button></div></div><div class="form-grid">
            ${formInput('中文标题', presentationFieldPath(prefix, `commentarySections.${index}.label.zh`), localizedValue(label, 'zh'), { required: true })}
            ${formInput('英文标题', presentationFieldPath(prefix, `commentarySections.${index}.label.en`), localizedValue(label, 'en'), { required: true })}
            ${formTextarea('中文正文', presentationFieldPath(prefix, `commentarySections.${index}.html.zh`), localizedValue(html, 'zh'), { className: 'medium', required: true })}
            ${formTextarea('英文正文', presentationFieldPath(prefix, `commentarySections.${index}.html.en`), localizedValue(html, 'en'), { className: 'medium', required: true })}
            ${renderPresentationReferenceList('段落来源（内部用途）', `commentarySections.${index}.sourceIds`, section.sourceIds, 'source')}
        </div></article>`;
                  })
                  .join('')
            : '<div class="collection-empty">暂无 commentary section。</div>'
    }</div>`;
}

function renderPresentationReview(review, prefix) {
    const notes = review.notes || {};
    return `<section class="presentation-review-card"><div><h3>审核信息</h3><p class="muted">仅用于内容维护，不在展示页中出现。</p></div><div class="form-grid">
        ${formSelect('审核状态', presentationFieldPath(prefix, 'review.status'), review.status || 'draft', [
            ['draft', '草稿'],
            ['needs-source', '待补来源'],
            ['verified', '已核验'],
            ['disputed', '有争议'],
            ['deprecated', '已停用']
        ])}
        ${formInput('审核人', presentationFieldPath(prefix, 'review.reviewer'), review.reviewer)}
        ${internalNoteField(presentationFieldPath(prefix, 'review.notes'), notes, { label: '审核备注', className: 'short', span: true })}
    </div></section>`;
}

function renderPresentationForm(presentation, prefix) {
    const review = presentation.review || {};
    return `<section class="structured-section presentation-editor"><div class="form-grid">
        ${localizedFields(presentationFieldPath(prefix, 'displayTitle'), presentation.displayTitle, { label: '展示标题', className: 'short' })}
        ${localizedFields(presentationFieldPath(prefix, 'displaySummary'), presentation.displaySummary, { label: '展示摘要', className: 'short' })}
        ${localizedFields(presentationFieldPath(prefix, 'displayDescription'), presentation.displayDescription, { label: '展示描述', className: 'medium', span: true })}
        ${renderPresentationReferenceField(
            '首图资产',
            presentationFieldPath(prefix, 'overviewImageAssetId'),
            presentation.overviewImageAssetId,
            'asset',
            {
                emptySummary: '未设置，默认使用展示图片第一张',
                emptyText: '未设置首图资产时，将默认使用“展示图片”中的第一张图片。'
            }
        )}
        ${renderPresentationReferenceField('Quiz', presentationFieldPath(prefix, 'quizId'), presentation.quizId, 'quiz')}
        ${renderPresentationReferenceList('展示图片', 'assetIds', presentation.assetIds, 'asset', {
            filter: isPresentationImageAsset,
            className: 'is-image-assets',
            emptyText: '尚未选择展示图片。'
        })}
        ${renderPresentationReferenceList('展示音视频', 'assetIds', presentation.assetIds, 'asset', {
            filter: isPresentationAudioVideoAsset,
            className: 'is-audio-video-assets',
            emptyText: '尚未选择展示音频或视频。'
        })}
        ${renderPresentationReferenceList('展示来源', 'sourceIds', presentation.sourceIds, 'source')}
    </div>${renderCommentarySections(presentation.commentarySections, prefix)}${renderPresentationReview(review, prefix)}</section>`;
}

function collectionOptions(value, fallback = []) {
    return Array.isArray(value) ? value : fallback;
}

function collectionField(label, path, value, options = {}) {
    if (options.kind === 'textarea')
        return formTextarea(label, path, value, {
            className: options.className || 'short',
            format: options.format,
            span: options.span,
            required: options.required,
            requiredMark: options.requiredMark,
            requiredTitle: options.requiredTitle
        });
    if (options.kind === 'select')
        return formSelect(label, path, value, options.options || [], {
            span: options.span,
            format: options.format,
            required: options.required,
            requiredMark: options.requiredMark,
            requiredTitle: options.requiredTitle
        });
    return formInput(label, path, value, {
        format: options.format,
        type: options.type,
        span: options.span,
        required: options.required,
        requiredMark: options.requiredMark,
        requiredTitle: options.requiredTitle,
        disabled: options.disabled,
        readOnly: options.readOnly,
        pattern: options.pattern,
        placeholder: options.placeholder
    });
}

function sourceItemForm(item, index) {
    const source = item || {};
    const notes = source.notes || {};
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>来源 ${index + 1}</strong><span class="muted">${escapeHtml(source.id || '保存时生成 ID')}</span></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div><div class="form-grid">
        ${localizedFields('label', source.label, { label: '标签', className: 'short', required: true })}
        ${localizedFields('title', source.title, { label: '标题', className: 'short', required: true })}
        ${collectionField('URL（与 DOI 至少填写一项）', 'url', source.url, { span: true, requiredMark: true, requiredTitle: 'URL 或 DOI 至少填写一项' })}
    </div><details class="collection-more"><summary>更多（内部用途）</summary><div class="form-grid">
        ${collectionField('类型', 'type', source.type, {
            kind: 'select',
            required: true,
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
                ['encyclopedia-entry', 'encyclopedia-entry'],
                ['personal-page', 'personal-page'],
                ['paper-index', 'paper-index'],
                ['paper-file', 'paper-file'],
                ['book-page', 'book-page'],
                ['news', 'news'],
                ['report', 'report'],
                ['image-source', 'image-source'],
                ['dataset', 'dataset'],
                ['statement', 'statement'],
                ['thesis', 'thesis'],
                ['internal-record', 'internal-record']
            ]
        })}
        ${collectionField('作者（每行一个）', 'authors', collectionOptions(source.authors).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('年份', 'year', source.year)}
        ${collectionField('语言', 'language', source.language)}
        ${collectionField('DOI（与 URL 至少填写一项）', 'doi', source.doi, { requiredMark: true, requiredTitle: 'URL 或 DOI 至少填写一项' })}
        ${collectionField('用途', 'purpose', source.purpose, {
            kind: 'select',
            required: true,
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
            required: true,
            options: [
                ['primary', 'primary'],
                ['secondary', 'secondary'],
                ['tertiary', 'tertiary'],
                ['reference-only', 'reference-only']
            ]
        })}
        ${internalNoteField('notes', notes, { label: '备注', className: 'short', span: true })}
    </div></details></article>`;
}

function assetSourceIds(asset) {
    if (Array.isArray(asset.sourceIds)) return asset.sourceIds.filter(Boolean);
    return asset.sourceId ? [asset.sourceId] : [];
}

function assetSourceName(source) {
    return (
        localizedValue(source && source.title, 'zh') ||
        localizedValue(source && source.title, 'en') ||
        localizedValue(source && source.label, 'zh') ||
        localizedValue(source && source.label, 'en') ||
        (source && source.id) ||
        '未命名来源'
    );
}

const assetRoleOptionsByType = {
    image: [
        ['portrait', '人物肖像 · portrait'],
        ['supporting-portrait', '补充人物肖像 · supporting-portrait'],
        ['team-photo', '团队照片 · team-photo'],
        ['team-portrait', '团队肖像 · team-portrait'],
        ['hero-image', '首图 · hero-image'],
        ['supporting-image', '补充图片 · supporting-image'],
        ['architecture-explainer', '架构解释图 · architecture-explainer'],
        ['algorithm-explainer', '算法解释图 · algorithm-explainer'],
        ['annual-achievement-explainer', '年度成就解释图 · annual-achievement-explainer'],
        ['paper-page', '论文页面 · paper-page'],
        ['paper-figure', '论文图表 · paper-figure'],
        ['paper-reference', '论文资料 · paper-reference'],
        ['primary-source', '一手资料 · primary-source'],
        ['source-card', '来源卡片 · source-card'],
        ['research-result', '研究结果 · research-result'],
        ['historical-photo', '历史照片 · historical-photo'],
        ['historical-diagram', '历史图示 · historical-diagram'],
        ['historical-reconstruction', '历史重建图 · historical-reconstruction'],
        ['event-reference', '事件资料 · event-reference'],
        ['artifact-reference', '实物资料 · artifact-reference'],
        ['book-cover', '书籍封面 · book-cover'],
        ['title-reference', '标题资料 · title-reference'],
        ['venue-photo', '场地照片 · venue-photo'],
        ['project-identity', '项目标识 · project-identity'],
        ['film-still', '影片剧照 · film-still'],
        ['promotional-still', '宣传剧照 · promotional-still'],
        ['movie-poster', '电影海报 · movie-poster'],
        ['film-poster', '影片海报 · film-poster'],
        ['film-production', '影片制作资料 · film-production'],
        ['game-record-image', '对局记录图 · game-record-image'],
        ['game-analysis-image', '对局分析图 · game-analysis-image'],
        ['game-comparison-image', '对局对比图 · game-comparison-image'],
        ['gameplay-image', '游戏画面 · gameplay-image'],
        ['game-evolution-poster', '对局演化封面 · game-evolution-poster'],
        ['paper-case-poster', '论文案例封面 · paper-case-poster'],
        ['work-illustration', '作品插图 · work-illustration']
    ],
    svg: [
        ['architecture-explainer', '架构解释图 · architecture-explainer'],
        ['algorithm-explainer', '算法解释图 · algorithm-explainer'],
        ['annual-achievement-explainer', '年度成就解释图 · annual-achievement-explainer'],
        ['paper-page', '论文页面 · paper-page'],
        ['historical-diagram', '历史图示 · historical-diagram'],
        ['title-reference', '标题资料 · title-reference'],
        ['game-analysis-image', '对局分析图 · game-analysis-image'],
        ['supporting-image', '补充图片 · supporting-image']
    ],
    gif: [
        ['game-record-animation', '对局动画 · game-record-animation'],
        ['portrait', '人物肖像 · portrait'],
        ['hero-image', '首图 · hero-image'],
        ['supporting-image', '补充图片 · supporting-image']
    ],
    audio: [['audio-narration', '事件讲解音频 · audio-narration']],
    video: [
        ['game-evolution-video', '对局演化视频 · game-evolution-video'],
        ['paper-case-video', '论文案例视频 · paper-case-video']
    ]
};

function assetRoleOptions(type, currentRole = '') {
    const options = assetRoleOptionsByType[type] || assetRoleOptionsByType.image;
    if (!currentRole || options.some(([value]) => value === currentRole)) return options;
    return [[currentRole, `${currentRole}（历史值）`], ...options];
}

function defaultAssetRole(type) {
    return {
        image: 'supporting-image',
        svg: 'architecture-explainer',
        gif: 'game-record-animation',
        audio: 'audio-narration',
        video: 'game-evolution-video'
    }[type];
}

function generatedAssetPath(assetId, type) {
    const config = {
        image: ['images', 'png'],
        svg: ['images', 'svg'],
        gif: ['images', 'gif'],
        video: ['videos', 'mp4']
    }[type];
    if (!assetId || !config || !state.entityId) return '';
    return `resources/${config[0]}/${state.entityId}/${assetId}.${config[1]}`;
}

function isGeneratedAssetPath(assetId, value) {
    if (!assetId || !value || !state.entityId) return false;
    const escapedEventId = state.entityId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedAssetId = assetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(
        `^resources\\/(?:images|audio|videos)\\/${escapedEventId}\\/${escapedAssetId}\\.[a-z0-9]+$`,
        'i'
    ).test(value);
}

function audioUrlValue(asset) {
    if (asset.deliveryUrl) return asset.deliveryUrl;
    if (/^https:\/\//i.test(String(asset.path || ''))) return asset.path;
    return (asset.storage && asset.storage.publicUrl) || '';
}

function audioContentTypeForUrl(value) {
    const extension = String(value || '')
        .split(/[?#]/, 1)[0]
        .split('.')
        .pop()
        .toLowerCase();
    return (
        {
            aac: 'audio/aac',
            m4a: 'audio/mp4',
            mp3: 'audio/mpeg',
            ogg: 'audio/ogg',
            wav: 'audio/wav'
        }[extension] || 'audio/mpeg'
    );
}

function audioObjectNameForUrl(value, assetId) {
    try {
        const url = new window.URL(value);
        const releasePrefix = '/audio/ai-history/releases/';
        const prefixIndex = url.pathname.indexOf(releasePrefix);
        const relativePath = prefixIndex >= 0 ? url.pathname.slice(prefixIndex + releasePrefix.length) : '';
        const fileName = relativePath || url.pathname.split('/').filter(Boolean).pop();
        return decodeURIComponent(fileName || `${assetId}.mp3`);
    } catch {
        return `${assetId}.mp3`;
    }
}

function applyAudioDeliveryUrl(asset, value) {
    const url = String(value || '').trim();
    asset.deliveryUrl = url;
    asset.path = url;
    const profileId = asset.storage && (asset.storage.profileId || asset.storage.profile);
    asset.storage = {
        ...(profileId ? { profileId } : {}),
        objectName: audioObjectNameForUrl(url, asset.id),
        contentType: audioContentTypeForUrl(url)
    };
}

function validatePendingAssetRequirements() {
    if (state.type !== 'events' || state.file !== 'assets.json' || !Array.isArray(state.document)) return;
    for (const assetId of state.pendingAssetIds) {
        const asset = state.document.find((candidate) => candidate && candidate.id === assetId);
        if (!asset) continue;
        if (['image', 'gif'].includes(asset.type) && (!asset.path || state.pendingAssetPaths.has(asset.path))) {
            throw new Error(`请先为新增图片“${asset.id}”上传文件或填写图片 URL 并导入`);
        }
        if (asset.type === 'audio' && !/^https:\/\/\S+$/i.test(audioUrlValue(asset))) {
            throw new Error(`新增音频“${asset.id}”必须填写 HTTPS OSS 音频 URL`);
        }
    }
}

function renderAssetImageImport(asset) {
    if (!state.pendingAssetPaths.has(asset.path) || !['image', 'gif'].includes(asset.type)) return '';
    return `<section class="asset-image-import" data-asset-image-import><strong>${fieldLabel('导入图片', true, '上传文件或填写图片 URL')}</strong><label><span>本地图片</span><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-asset-image-file></label><div class="asset-image-import-separator">或</div><label><span>图片 URL</span><input type="url" placeholder="https://..." data-asset-image-url></label><button type="button" class="primary" data-asset-image-action="import">导入到内部资源</button><p class="muted">支持 PNG、JPEG、GIF、WebP，最大 10 MB。URL 图片将由 Admin 下载并保存到自动生成的内部路径。</p></section>`;
}

function renderAssetSourceManager(asset) {
    const selectedIds = assetSourceIds(asset);
    const sourceMap = new Map(state.assetSources.map((source) => [source.id, source]));
    const available = state.assetSources.filter((source) => !selectedIds.includes(source.id));
    const availableOptions = available
        .map(
            (source) =>
                `<option value="${escapeHtml(source.id)}">${escapeHtml(assetSourceName(source))} · ${escapeHtml(source.id)}</option>`
        )
        .join('');
    const selectedItems = selectedIds.length
        ? selectedIds
              .map((sourceId) => {
                  const source = sourceMap.get(sourceId);
                  const name = source ? assetSourceName(source) : `${sourceId}（当前来源列表中不存在）`;
                  return `<div class="asset-source-item" data-asset-source-value="${escapeHtml(sourceId)}"><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(sourceId)}</span></div><button type="button" class="danger" data-asset-source-action="remove" data-asset-source-id="${escapeHtml(sourceId)}">移除</button></div>`;
              })
              .join('')
        : '<div class="asset-source-empty">尚未选择来源，保存校验不会通过。</div>';
    const emptyOption = state.assetSources.length ? '选择当前事件的已有来源' : '当前事件暂无来源，请先到“来源”Tab 创建';
    return `<section class="asset-source-manager span-2" data-asset-source-manager aria-required="true"><div class="asset-source-manager-heading"><div><strong>${fieldLabel('来源', true)}</strong><span class="badge">${selectedIds.length}</span></div><div class="inline-actions"><select data-asset-source-select aria-label="选择资产来源"${available.length ? '' : ' disabled'}><option value="">${emptyOption}</option>${availableOptions}</select><button type="button" data-asset-source-action="add" disabled>添加</button></div></div><div class="asset-source-list">${selectedItems}</div><p class="muted">这里只能添加当前事件已有的来源信息；如需新增来源，请先到“来源”Tab 创建并保存。每个资产至少选择一项来源。</p></section>`;
}

function assetItemForm(item, index) {
    const asset = item || {};
    const rights = asset.rights || {};
    const license = rights.license || {};
    const usage = rights.usage || {};
    const isImage = asset.type === 'image';
    const isImportableImage = ['image', 'gif'].includes(asset.type);
    const isPendingImage = isImportableImage && state.pendingAssetPaths.has(asset.path);
    const isAudio = asset.type === 'audio';
    const resourceField = isAudio
        ? collectionField('OSS 音频 URL', 'deliveryUrl', audioUrlValue(asset), {
              type: 'url',
              span: true,
              required: true,
              pattern: 'https://.*',
              placeholder: 'https://...'
          })
        : isPendingImage
          ? ''
          : collectionField(isImportableImage ? '内部资源路径（导入后自动回填）' : '资源路径', 'path', asset.path, {
                span: true,
                required: true,
                readOnly: isImportableImage
            });
    const technicalFields = `${collectionField('类型', 'type', asset.type, {
        kind: 'select',
        required: true,
        options: [
            ['image', 'image'],
            ['svg', 'svg'],
            ['gif', 'gif'],
            ['audio', 'audio'],
            ['video', 'video']
        ]
    })}${collectionField('角色', 'role', asset.role, {
        kind: 'select',
        required: true,
        options: assetRoleOptions(asset.type, asset.role)
    })}${resourceField}${renderAssetSourceManager(asset)}`;
    const descriptionFields = `${localizedFields('caption', asset.caption, { label: '标题', className: 'short', required: true })}
        ${localizedFields('subcaption', asset.subcaption, { label: '副标题', className: 'short' })}`;
    const internalUsageFields = `${collectionField('使用位置（每行一个）', 'usage', collectionOptions(asset.usage).join('\n'), { kind: 'textarea', format: 'lines' })}
        ${collectionField('版权状态', 'rights.status', rights.status)}
        ${internalNoteField('rights.license', license, { label: '许可', className: 'short' })}
        ${internalNoteField('rights.usage', usage, { label: '使用说明', className: 'short' })}`;
    const internalUsagePanel = `<details class="collection-more asset-internal-usage"><summary>更多（内部用途）</summary><div class="form-grid">${internalUsageFields}</div></details>`;
    const content = isImage
        ? `<div class="asset-image-layout"><div class="asset-image-sidebar">${renderAssetMedia(asset)}${renderAssetImageImport(asset)}</div><div class="form-grid asset-image-primary-fields">${technicalFields}${descriptionFields}</div><div class="form-grid asset-image-supplemental-fields" hidden></div></div>`
        : `${renderAssetMedia(asset)}${renderAssetImageImport(asset)}<div class="form-grid">${technicalFields}${isAudio ? collectionField('语言', 'language', asset.language || 'zh', { required: true }) : ''}${descriptionFields}</div>`;
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>资产 ${index + 1}</strong></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div>${content}${internalUsagePanel}</article>`;
}

let imageAssetLayoutFrame = 0;

function balanceImageAssetLayout(layout) {
    const primary = layout.querySelector('.asset-image-primary-fields');
    const supplemental = layout.querySelector('.asset-image-supplemental-fields');
    const preview = layout.querySelector('.asset-image-sidebar .asset-media-preview');
    if (!primary || !supplemental || !preview) return;
    const fields = [...primary.children, ...supplemental.children]
        .map((field, index) => {
            if (!field.dataset.assetFieldOrder) field.dataset.assetFieldOrder = String(index + 1);
            return field;
        })
        .sort((left, right) => Number(left.dataset.assetFieldOrder) - Number(right.dataset.assetFieldOrder));
    fields.forEach((field) => primary.append(field));
    supplemental.hidden = true;
    const columns = window.getComputedStyle(layout).gridTemplateColumns.split(' ').filter(Boolean);
    if (columns.length < 2) return;
    const availableHeight = preview.getBoundingClientRect().height;
    const rowGap = Number.parseFloat(window.getComputedStyle(primary).rowGap) || 0;
    let usedHeight = 0;
    let visibleCount = 0;
    for (const field of fields) {
        const fieldHeight = field.getBoundingClientRect().height;
        const nextHeight = usedHeight + (visibleCount ? rowGap : 0) + fieldHeight;
        if (visibleCount > 0 && nextHeight > availableHeight) break;
        usedHeight = nextHeight;
        visibleCount += 1;
    }
    fields.slice(Math.max(visibleCount, 1)).forEach((field) => supplemental.append(field));
    supplemental.hidden = supplemental.children.length === 0;
}

function balanceImageAssetLayouts() {
    elements.structuredEditor.querySelectorAll('.asset-image-layout').forEach((layout) => {
        const image = layout.querySelector('.asset-image-sidebar img');
        if (image && !image.complete) {
            image.addEventListener('load', scheduleImageAssetLayout, { once: true });
            image.addEventListener('error', scheduleImageAssetLayout, { once: true });
        }
        balanceImageAssetLayout(layout);
    });
}

function scheduleImageAssetLayout() {
    window.cancelAnimationFrame(imageAssetLayoutFrame);
    imageAssetLayoutFrame = window.requestAnimationFrame(balanceImageAssetLayouts);
}

function quizItemForm(item, index) {
    const quiz = item || {};
    const options = Array.isArray(quiz.options) ? quiz.options : [];
    const answerOptions = options.map((option, optionIndex) => [
        String(optionIndex),
        `选项 ${optionIndex + 1} · ${localizedValue(option.text || option, 'zh') || localizedValue(option.text || option, 'en') || '未填写'}`
    ]);
    return `<article class="collection-item" data-collection-index="${index}"><div class="collection-item-heading"><div><strong>Quiz ${index + 1}</strong></div><div class="collection-actions"><button type="button" data-collection-action="up">↑</button><button type="button" data-collection-action="down">↓</button><button type="button" data-collection-action="duplicate">复制</button><button type="button" class="danger" data-collection-action="remove">移除</button></div></div><div class="form-grid">
        ${localizedFields('question', quiz.question, { label: '题目', className: 'medium', span: true, required: true })}
        ${localizedFields('explanation', quiz.explanation, { label: '解析', className: 'short', span: true })}
        ${formSelect('正确答案', 'answer', String(Number.isInteger(quiz.answer) ? quiz.answer : 0), answerOptions, { format: 'number', required: true })}
        <div class="quiz-options span-2"><div class="subsection-heading"><strong>选项</strong><button type="button" data-quiz-action="add-option">添加选项</button></div>${options
            .map((option, optionIndex) => {
                const optionText = option && typeof option === 'object' && option.text ? option.text : option;
                const optionPath =
                    option && typeof option === 'object' && option.text
                        ? `options.${optionIndex}.text`
                        : `options.${optionIndex}`;
                return `<div class="quiz-option-row" data-option-index="${optionIndex}"><span class="muted">${optionIndex + 1}</span>${formInput('中文', `${optionPath}.zh`, localizedValue(optionText, 'zh'), { required: true })}${formInput('英文', `${optionPath}.en`, localizedValue(optionText, 'en'), { required: true })}<button type="button" data-quiz-action="remove-option">移除</button></div>`;
            })
            .join('')}</div>
    </div></article>`;
}

function nextCollectionId(prefix) {
    const base = `${prefix}-${state.entityId || 'item'}`;
    const existingIds = new Set(
        (Array.isArray(state.document) ? state.document : []).map((item) => String((item && item.id) || ''))
    );
    if (!existingIds.has(base)) return base;
    let suffix = 2;
    while (existingIds.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

function collectionConfig(file) {
    return {
        'sources.json': {
            title: '来源维护',
            summary: '编辑来源记录、可靠性和用途，引用关系会原样保留。',
            idPrefix: 'source',
            create: () => ({
                id: nextCollectionId('source'),
                type: 'article',
                label: { zh: '', en: '' },
                title: { zh: '', en: '' },
                purpose: 'background',
                reliability: 'secondary'
            }),
            focusField: '[data-structured-field="label.zh"]',
            render: sourceItemForm
        },
        'assets.json': {
            title: '图片与音视频',
            summary: '维护图片、音频、视频元数据和展示顺序。',
            idPrefix: 'asset',
            create: () => {
                const id = nextCollectionId('asset');
                return {
                    id,
                    type: 'image',
                    role: defaultAssetRole('image'),
                    path: generatedAssetPath(id, 'image'),
                    caption: { zh: '', en: '' },
                    sourceIds: [],
                    rights: { status: 'needs-source', license: { zh: '', en: '' }, usage: { zh: '', en: '' } }
                };
            },
            focusField: '[data-structured-field="caption.zh"]',
            render: assetItemForm
        },
        'quizzes.json': {
            title: 'Quiz 题库',
            summary: '维护双语题目、选项、正确答案和关联资料。',
            idPrefix: 'quiz',
            create: () => ({
                id: nextCollectionId('quiz'),
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
            focusField: '[data-structured-field="question.zh"]',
            render: quizItemForm
        }
    }[file];
}

function renderCollectionEditor(file, data) {
    const config = collectionConfig(file);
    const items = Array.isArray(data) ? data : [];
    return `<section class="structured-section"><div class="collection-list">${items.length ? items.map(config.render).join('') : '<div class="collection-empty">暂无条目，点击“新增条目”开始维护。</div>'}</div></section>`;
}

function renderStructuredEditor() {
    if (!isStructuredEventFile() || !state.document || ['people', 'advanced'].includes(state.eventSection)) {
        elements.structuredEditor.innerHTML = '';
        elements.structuredTitle.textContent = '结构化编辑';
        elements.structuredSummary.textContent = '当前文件暂未接入结构化编辑器，请使用高级 JSON 模式。';
        elements.structuredFieldHint.textContent = '';
        elements.structuredFieldHint.hidden = true;
        elements.structuredAddBtn.hidden = true;
        return;
    }
    const isPresentation = state.eventSection === 'presentation';
    const config = isPresentation
        ? {
              title: state.file === 'event.json' ? '默认展示配置' : '故事线展示覆盖',
              summary: '常用展示字段已结构化；未接入的特殊模块仍可在高级 JSON 中维护。'
          }
        : state.file === 'event.json'
          ? { title: '事件基本信息', summary: '维护事件时间、地点和审核信息。页面标题与描述在展示配置中编辑。' }
          : collectionConfig(state.file) || { title: '展示配置', summary: '维护当前 storyline 的展示覆盖字段。' };
    elements.structuredTitle.textContent = config.title;
    elements.structuredSummary.textContent = config.summary;
    elements.structuredFieldHint.textContent = state.file;
    elements.structuredFieldHint.dataset.openAdvancedFile = state.file;
    elements.structuredFieldHint.hidden = false;
    elements.structuredAddBtn.hidden = !collectionConfig(state.file);
    if (isPresentation) {
        elements.structuredEditor.innerHTML =
            state.file === 'event.json'
                ? renderPresentationForm(state.document.defaultPresentation || {}, 'defaultPresentation')
                : renderPresentationForm(state.document, '');
    } else {
        elements.structuredEditor.innerHTML =
            state.file === 'event.json'
                ? renderEventForm(state.document)
                : collectionConfig(state.file)
                  ? renderCollectionEditor(state.file, state.document)
                  : '';
    }
    scheduleImageAssetLayout();
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
    let focusIndex = -1;
    if (action === 'add') {
        focusIndex = state.document.length;
        const created = config.create();
        state.document.push(created);
        if (state.file === 'assets.json') state.pendingAssetIds.add(created.id);
        if (state.file === 'assets.json' && created.path) state.pendingAssetPaths.add(created.path);
    } else {
        const item = target.closest('[data-collection-index]');
        if (!item) return;
        const index = Number(item.dataset.collectionIndex);
        if (action === 'remove') state.document.splice(index, 1);
        if (action === 'duplicate') {
            const duplicate = cloneJson(state.document[index]);
            if (config.idPrefix) {
                duplicate.id = nextCollectionId(config.idPrefix);
                if (state.file === 'assets.json') state.pendingAssetIds.add(duplicate.id);
                if (state.file === 'assets.json' && !/^https?:\/\//i.test(duplicate.path || '')) {
                    duplicate.path = generatedAssetPath(duplicate.id, duplicate.type);
                    if (duplicate.path) state.pendingAssetPaths.add(duplicate.path);
                }
            }
            state.document.splice(index + 1, 0, duplicate);
            focusIndex = index + 1;
        }
        if (action === 'up') moveCollectionItem(index, -1);
        if (action === 'down') moveCollectionItem(index, 1);
    }
    syncEditor();
    renderStructuredEditor();
    if (focusIndex >= 0) {
        focusNewEntry(
            elements.structuredEditor.querySelector(`[data-collection-index="${focusIndex}"]`),
            config.focusField
        );
    }
    setStatus('已修改条目，尚未保存', '');
}

function addQuizOption(item) {
    const quiz = state.document[item];
    if (!quiz || !Array.isArray(quiz.options)) return;
    const optionIndex = quiz.options.length;
    quiz.options.push({ zh: '', en: '' });
    syncEditor();
    renderStructuredEditor();
    focusNewEntry(
        elements.structuredEditor.querySelector(
            `[data-collection-index="${item}"] [data-option-index="${optionIndex}"]`
        ),
        '[data-structured-field$=".zh"]'
    );
    setStatus('已修改 Quiz 选项，尚未保存', '');
}

function removeQuizOption(item, optionIndex) {
    const quiz = state.document[item];
    if (!quiz || !Array.isArray(quiz.options) || quiz.options.length <= 2) return;
    quiz.options.splice(optionIndex, 1);
    if (Number.isInteger(quiz.answer) && quiz.answer >= quiz.options.length) quiz.answer = quiz.options.length - 1;
    syncEditor();
    renderStructuredEditor();
    setStatus('已修改 Quiz 选项，尚未保存', '');
}

function updateCollectionField(target) {
    const item = target.closest('[data-collection-index]');
    if (!item || !Array.isArray(state.document)) return;
    const index = Number(item.dataset.collectionIndex);
    if (!Number.isInteger(index) || !state.document[index] || typeof state.document[index] !== 'object') return;
    const asset = state.file === 'assets.json' ? state.document[index] : null;
    const previousType = asset && asset.type;
    const previousPath = asset && asset.path;
    const value = structuredFieldValue(target);
    setPath(state.document[index], target.dataset.structuredField, value);
    if (asset && target.dataset.structuredField === 'path') state.pendingAssetPaths.delete(previousPath);
    if (asset && target.dataset.structuredField === 'deliveryUrl') applyAudioDeliveryUrl(asset, value);
    if (asset && target.dataset.structuredField === 'type') {
        if (value === 'audio') {
            state.pendingAssetPaths.delete(previousPath);
            asset.path = '';
            asset.deliveryUrl = '';
            asset.language = asset.language || 'zh';
            asset.storage = {
                objectName: `${asset.id}.mp3`,
                contentType: 'audio/mpeg'
            };
        } else {
            if (previousType === 'audio') {
                delete asset.deliveryUrl;
                delete asset.storage;
            }
            if (previousType === 'audio' || !previousPath || isGeneratedAssetPath(asset.id, previousPath)) {
                state.pendingAssetPaths.delete(previousPath);
                asset.path = generatedAssetPath(asset.id, value);
                if (asset.path) state.pendingAssetPaths.add(asset.path);
            }
        }
        const previousOptions = assetRoleOptionsByType[previousType] || [];
        const nextOptions = assetRoleOptionsByType[value] || [];
        if (
            !asset.role ||
            (previousOptions.some(([role]) => role === asset.role) &&
                !nextOptions.some(([role]) => role === asset.role))
        ) {
            asset.role = defaultAssetRole(value);
        }
    }
    syncEditor();
    if (state.file === 'assets.json' && target.dataset.structuredField === 'type') renderStructuredEditor();
    setStatus('已修改结构化字段，尚未保存', '');
}

async function importAssetImage(target) {
    const item = target.closest('[data-collection-index]');
    const panel = target.closest('[data-asset-image-import]');
    if (!item || !panel || !Array.isArray(state.document)) return;
    const index = Number(item.dataset.collectionIndex);
    const asset = state.document[index];
    if (!asset || !asset.id) return;
    const file = panel.querySelector('[data-asset-image-file]').files[0];
    const imageUrl = panel.querySelector('[data-asset-image-url]').value.trim();
    if (!file && !imageUrl) {
        panel.querySelector('[data-asset-image-file]').focus();
        showError('请上传图片或填写图片 URL');
        return;
    }
    if (file && imageUrl) {
        showError('本地图片和图片 URL 只能选择一种');
        return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
        showError('图片不能超过 10 MB');
        return;
    }
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
        showError('图片 URL 必须使用 HTTP 或 HTTPS');
        return;
    }
    const originalText = target.textContent;
    target.disabled = true;
    target.textContent = imageUrl ? '正在下载...' : '正在上传...';
    try {
        const result = await api('/api/archive/event-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId: state.entityId,
                assetId: asset.id,
                ...(file ? { imageBase64: await readFileAsDataUrl(file) } : { imageUrl })
            })
        });
        state.pendingAssetPaths.delete(asset.path);
        asset.path = result.path;
        asset.type = result.type;
        if (!assetRoleOptions(result.type, asset.role).some(([role]) => role === asset.role)) {
            asset.role = defaultAssetRole(result.type);
        }
        syncEditor();
        renderStructuredEditor();
        const nextItem = elements.structuredEditor.querySelector(`[data-collection-index="${index}"]`);
        focusNewEntry(nextItem && nextItem.querySelector('.asset-media-preview'));
        setStatus(`图片已导入草稿：${result.path}，请继续填写资产信息`, 'ok');
        scheduleDraftSave(0);
    } finally {
        if (target.isConnected) {
            target.disabled = false;
            target.textContent = originalText;
        }
    }
}

function handleAssetSourceAction(target) {
    const item = target.closest('[data-collection-index]');
    const manager = target.closest('[data-asset-source-manager]');
    if (!item || !manager || !Array.isArray(state.document)) return;
    const index = Number(item.dataset.collectionIndex);
    const asset = state.document[index];
    if (!asset || typeof asset !== 'object') return;
    const ids = assetSourceIds(asset);
    let addedSourceId = '';
    if (target.dataset.assetSourceAction === 'add') {
        const select = manager.querySelector('[data-asset-source-select]');
        if (!select || !select.value) {
            if (select) select.focus();
            showError('请先选择需要添加的来源');
            return;
        }
        if (!ids.includes(select.value)) {
            addedSourceId = select.value;
            ids.push(select.value);
        }
    }
    if (target.dataset.assetSourceAction === 'remove') {
        const sourceIndex = ids.indexOf(target.dataset.assetSourceId);
        if (sourceIndex >= 0) ids.splice(sourceIndex, 1);
    }
    asset.sourceIds = ids;
    delete asset.sourceId;
    syncEditor();
    renderStructuredEditor();
    if (addedSourceId) {
        const nextItem = elements.structuredEditor.querySelector(`[data-collection-index="${index}"]`);
        const addedItem = [...nextItem.querySelectorAll('[data-asset-source-value]')].find(
            (candidate) => candidate.dataset.assetSourceValue === addedSourceId
        );
        focusNewEntry(addedItem);
    }
    setStatus('已修改资产来源，尚未保存', '');
}

function syncAssetSourceAddButton(select) {
    const manager = select.closest('[data-asset-source-manager]');
    const button = manager && manager.querySelector('[data-asset-source-action="add"]');
    if (button) button.disabled = !select.value;
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
    let focusIndex = -1;
    if (action === 'add-section') {
        focusIndex = presentation.commentarySections.length;
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
    if (focusIndex >= 0) {
        focusNewEntry(
            elements.structuredEditor.querySelector(`[data-presentation-section-index="${focusIndex}"]`),
            '[data-structured-field$=".label.zh"]'
        );
    }
    setStatus('已修改展示段落，尚未保存', '');
}

function handlePresentationReferenceAction(target) {
    const manager = target.closest('[data-presentation-reference-field]');
    if (!manager) return;
    const field = manager.dataset.presentationReferenceField;
    const presentation = presentationDocument();
    if (!Array.isArray(getPath(presentation, field))) setPath(presentation, field, []);
    const items = getPath(presentation, field);
    const action = target.dataset.presentationReferenceAction;
    let focusIndex = -1;
    if (action === 'add') {
        const select = manager.querySelector('[data-presentation-reference-select]');
        if (select && select.value && !items.includes(select.value)) {
            focusIndex = items.length;
            items.push(select.value);
        }
    } else {
        const row = target.closest('[data-reference-index]');
        if (!row) return;
        const index = Number(row.dataset.referenceIndex);
        const swapIndexValue = target.dataset.referenceSwapIndex;
        const swapIndex = swapIndexValue === undefined || swapIndexValue === '' ? Number.NaN : Number(swapIndexValue);
        if (action === 'remove') items.splice(index, 1);
        if (
            ['up', 'down'].includes(action) &&
            Number.isInteger(swapIndex) &&
            swapIndex >= 0 &&
            swapIndex < items.length
        ) {
            [items[swapIndex], items[index]] = [items[index], items[swapIndex]];
        }
    }
    syncEditor();
    renderStructuredEditor();
    if (focusIndex >= 0) {
        const addedRow = [...elements.structuredEditor.querySelectorAll('[data-presentation-reference-field]')]
            .filter((candidate) => candidate.dataset.presentationReferenceField === field)
            .map((candidate) => candidate.querySelector(`[data-reference-index="${focusIndex}"]`))
            .find(Boolean);
        focusNewEntry(addedRow, 'summary');
    }
    setStatus('已修改展示引用，尚未保存', '');
}

async function loadEntity() {
    if (!state.entityId) {
        showError('请先选择实体');
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
    state.pendingAssetIds = new Set();
    state.pendingAssetPaths = new Set();
    if (state.type === 'events' && state.eventSection === 'presentation') await loadPresentationReferences(true);
    if (state.type === 'events' && state.file === 'assets.json') await loadAssetSources(true);
    syncEditor();
    const selectedEntity = state.entities.find((entity) => entity.id === state.entityId) || {};
    elements.currentEntity.textContent =
        state.type === 'events'
            ? localize(selectedEntity.title, 'zh') || localize(selectedEntity.title, 'en') || '事件编辑'
            : state.type === 'storylines'
              ? localize(selectedEntity.title, 'zh') || localize(selectedEntity.title, 'en') || '故事线编辑'
              : localize(selectedEntity.name, 'zh') || localize(selectedEntity.name, 'en') || '人物编辑';
    updatePanelVisibility();
    renderEventSectionNav();
    renderFigureSectionNav();
    renderAdvancedJsonFiles();
    renderStorylineOverview();
    renderStructuredEditor();
    if (state.type === 'events') await renderEventDisplayActions();
    if (state.type === 'figures') {
        renderFigureForm();
        await renderFigureAssets();
        await renderFigureUsage();
    }
    if (state.type === 'events' && state.eventSection === 'people') await renderRelations();
    setStatus('内容已加载', 'ok');
}

async function loadAssetSources(force = false) {
    if (state.type !== 'events' || !state.entityId) {
        state.assetSources = [];
        state.assetSourceEventId = '';
        return;
    }
    if (!force && state.assetSourceEventId === state.entityId) return;
    const entity = state.entities.find((candidate) => candidate.id === state.entityId);
    if (!entity || !(entity.files || []).includes('sources.json')) {
        state.assetSources = [];
        state.assetSourceEventId = state.entityId;
        return;
    }
    const result = await api(
        `/api/archive/file?eventId=${encodeURIComponent(state.entityId)}&file=${encodeURIComponent('sources.json')}`
    );
    state.assetSources = Array.isArray(result.data) ? result.data : [];
    state.assetSourceEventId = state.entityId;
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
        updateDefaultAvatarAssetLink();
        return;
    }
    elements.avatarPreview.hidden = false;
    elements.avatarPlaceholder.hidden = true;
    elements.avatarPreview.src = /^https?:\/\//i.test(avatarPath) ? avatarPath : `/${avatarPath}`;
    updateDefaultAvatarAssetLink();
}

function clearDefaultAvatarFields() {
    for (const id of [
        'avatarPath',
        'avatarSourceNameEn',
        'avatarSourceNameZh',
        'avatarSourceUrl',
        'avatarRightsStatus',
        'avatarStyle',
        'avatarLicenseEn',
        'avatarLicenseZh',
        'avatarUsageEn',
        'avatarUsageZh'
    ]) {
        elements[id].value = '';
    }
}

function figureProfileSourceLabel(source, index) {
    return (
        localize(source && source.label, 'zh') ||
        localize(source && source.label, 'en') ||
        String((source && source.url) || '').trim() ||
        `来源 ${index + 1}`
    );
}

function renderFigureProfileSources() {
    const sources = Array.isArray(state.document && state.document.profileSources) ? state.document.profileSources : [];
    elements.figureProfileSourceCount.textContent = String(sources.length);
    elements.figureProfileSourcesList.innerHTML = sources.length
        ? sources
              .map(
                  (source, index) => `<article class="figure-profile-source" data-profile-source-index="${index}">
                    <div class="collection-item-heading">
                        <div><strong>${escapeHtml(figureProfileSourceLabel(source, index))}</strong><span class="muted">身份核验来源</span></div>
                        <div class="collection-actions">
                            <button type="button" data-profile-source-action="up" title="上移"${index === 0 ? ' disabled' : ''}>↑</button>
                            <button type="button" data-profile-source-action="down" title="下移"${index === sources.length - 1 ? ' disabled' : ''}>↓</button>
                            <button type="button" class="danger" data-profile-source-action="remove">移除</button>
                        </div>
                    </div>
                    <div class="form-grid">
                        <label>${fieldLabel('来源类型', true)}<input data-profile-source-field="type" value="${escapeHtml(source.type || '')}" placeholder="paper / profile / official-page" required /></label>
                        <label class="span-2">${fieldLabel('中文标题', true)}<input data-profile-source-field="label.zh" value="${escapeHtml(localize(source.label, 'zh'))}" required /></label>
                        <label class="span-2">${fieldLabel('英文标题', true)}<input data-profile-source-field="label.en" value="${escapeHtml(localize(source.label, 'en'))}" required /></label>
                        <label class="span-2">${fieldLabel('URL', true)}<input data-profile-source-field="url" value="${escapeHtml(source.url || '')}" required /></label>
                    </div>
                </article>`
              )
              .join('')
        : '<div class="collection-empty">暂无人物资料来源。</div>';
}

function collectFigureProfileSources() {
    return [...elements.figureProfileSourcesList.querySelectorAll('[data-profile-source-index]')].map((item) => {
        const value = (field) => item.querySelector(`[data-profile-source-field="${field}"]`).value.trim();
        return {
            type: value('type'),
            label: {
                en: value('label.en'),
                zh: value('label.zh')
            },
            url: value('url')
        };
    });
}

function updateFigureProfileSourcesFromEditor() {
    if (state.type !== 'figures' || !state.document) return;
    state.document.profileSources = collectFigureProfileSources();
    syncEditor();
    setStatus('已修改资料来源，尚未保存', '');
}

function handleFigureProfileSourceAction(button) {
    state.document = collectFigureForm();
    const item = button.closest('[data-profile-source-index]');
    const index = item ? Number(item.dataset.profileSourceIndex) : -1;
    const sources = state.document.profileSources;
    if (button.dataset.profileSourceAction === 'remove' && index >= 0) sources.splice(index, 1);
    if (button.dataset.profileSourceAction === 'up' && index > 0) {
        [sources[index - 1], sources[index]] = [sources[index], sources[index - 1]];
    }
    if (button.dataset.profileSourceAction === 'down' && index >= 0 && index < sources.length - 1) {
        [sources[index], sources[index + 1]] = [sources[index + 1], sources[index]];
    }
    renderFigureProfileSources();
    syncEditor();
    setStatus('已修改资料来源，尚未保存', '');
}

function renderFigureForm() {
    const figure = state.document || {};
    const avatar = figure.defaultAvatar || {};
    const rights = avatar.rights || {};
    const review = figure.review || {};
    setValue('figureId', figure.id);
    elements.figureId.disabled = !state.creatingFigure;
    elements.figureIdField.hidden = !state.creatingFigure;
    setValue('figureType', figure.type || 'person');
    setValue('figureNameEn', localize(figure.name, 'en'));
    setValue('figureNameZh', localize(figure.name, 'zh'));
    setValue('figureAliases', (figure.aliases || []).join('\n'));
    setValue('figureDisambiguationEn', localize(figure.disambiguation, 'en'));
    setValue('figureDisambiguationZh', localize(figure.disambiguation, 'zh'));
    setValue('figureOrganizations', (figure.organizationIds || []).join('\n'));
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
    setValue('reviewNotesZh', localize(review.notes, 'zh'));
    elements.figureReviewBadge.textContent = reviewStatusLabel(review.status);
    elements.figureReviewBadge.className = `badge ${review.status || 'draft'}`;
    elements.openFigureImageUploadBtn.disabled = state.creatingFigure;
    elements.openFigureImageUploadBtn.title = state.creatingFigure ? '请先保存人物，再上传图片' : '';
    elements.openExistingFigureImageBtn.disabled = state.creatingFigure;
    elements.openExistingFigureImageBtn.title = state.creatingFigure ? '请先保存人物，再关联已有图片' : '';
    elements.figureAvatarEditor.open = false;
    if (!state.creatingFigure) elements.figureIdentityDetails.open = false;
    renderFigureProfileSources();
    renderAvatarPreview();
}

function resetExistingImageLink() {
    state.existingImageAssets = [];
    state.existingImageAssetsRevision = '';
    elements.existingImageEvent.value = '';
    elements.existingImageAsset.innerHTML = '<option value="">先选择事件</option>';
    elements.existingImagePreviewImg.removeAttribute('src');
    elements.existingImagePreviewImg.hidden = true;
    elements.existingImagePlaceholder.hidden = false;
    elements.existingImagePlaceholder.textContent = '选择图片后显示预览';
    elements.existingImageDetails.innerHTML = '';
    elements.linkExistingFigureImageBtn.disabled = true;
}

function updateExistingImagePreview() {
    const asset = state.existingImageAssets.find((candidate) => candidate.id === elements.existingImageAsset.value);
    elements.linkExistingFigureImageBtn.disabled = !asset;
    if (!asset) {
        elements.existingImagePreviewImg.removeAttribute('src');
        elements.existingImagePreviewImg.hidden = true;
        elements.existingImagePlaceholder.hidden = false;
        elements.existingImageDetails.innerHTML = '';
        return;
    }
    const caption = localize(asset.caption, 'zh') || localize(asset.caption, 'en') || asset.id;
    elements.existingImagePreviewImg.src = assetImageSource(asset);
    elements.existingImagePreviewImg.alt = caption;
    elements.existingImagePreviewImg.hidden = false;
    elements.existingImagePlaceholder.hidden = true;
    elements.existingImageDetails.innerHTML = `<strong>${escapeHtml(caption)}</strong><span>${escapeHtml(asset.id)}</span><span>${escapeHtml(asset.path)}</span>`;
}

async function loadExistingImageAssets() {
    const eventId = elements.existingImageEvent.value;
    state.existingImageAssets = [];
    state.existingImageAssetsRevision = '';
    elements.existingImageAsset.innerHTML = '<option value="">加载图片资产...</option>';
    elements.linkExistingFigureImageBtn.disabled = true;
    if (!eventId) {
        elements.existingImageAsset.innerHTML = '<option value="">先选择事件</option>';
        updateExistingImagePreview();
        return;
    }
    const result = await api(
        `/api/archive/file?eventId=${encodeURIComponent(eventId)}&file=${encodeURIComponent('assets.json')}`
    );
    state.existingImageAssetsRevision = result.revision || '';
    state.existingImageAssets = result.data
        .filter(
            (asset) =>
                asset.type === 'image' &&
                asset.path &&
                !(Array.isArray(asset.figureIds) && asset.figureIds.includes(state.entityId))
        )
        .sort((left, right) => {
            const leftLabel = localize(left.caption, 'zh') || localize(left.caption, 'en') || left.id;
            const rightLabel = localize(right.caption, 'zh') || localize(right.caption, 'en') || right.id;
            return leftLabel.localeCompare(rightLabel, 'zh-CN');
        });
    if (!state.existingImageAssets.length) {
        elements.existingImageAsset.innerHTML = '<option value="">该事件没有可关联的已有图片</option>';
        elements.existingImagePlaceholder.textContent = '该事件中的图片均已关联，或没有 image 类型资产';
        updateExistingImagePreview();
        return;
    }
    elements.existingImageAsset.innerHTML = state.existingImageAssets
        .map((asset) => {
            const caption = localize(asset.caption, 'zh') || localize(asset.caption, 'en') || asset.id;
            return `<option value="${escapeHtml(asset.id)}">${escapeHtml(caption)} · ${escapeHtml(asset.id)}</option>`;
        })
        .join('');
    updateExistingImagePreview();
}

async function openExistingFigureImage() {
    if (state.creatingFigure || !state.entityId) {
        showError('请先保存人物，再关联已有图片');
        return;
    }
    await loadEventOptions();
    resetExistingImageLink();
    const eventsWithAssets = state.eventOptions.filter((event) => (event.files || []).includes('assets.json'));
    elements.existingImageEvent.innerHTML = `<option value="">选择事件</option>${eventsWithAssets
        .map((event) => {
            const title = localize(event.title, 'zh') || localize(event.title, 'en') || event.id;
            return `<option value="${escapeHtml(event.id)}">${escapeHtml(title)} · ${escapeHtml(event.id)}</option>`;
        })
        .join('')}`;
    const relatedEventId = ((state.figureUsage && state.figureUsage.events) || []).find((eventId) =>
        eventsWithAssets.some((event) => event.id === eventId)
    );
    const initialEvent = relatedEventId || (eventsWithAssets[0] && eventsWithAssets[0].id) || '';
    if (initialEvent) {
        elements.existingImageEvent.value = initialEvent;
        await loadExistingImageAssets();
    }
    elements.existingFigureImageDialog.showModal();
}

function closeExistingFigureImage() {
    elements.existingFigureImageDialog.close();
}

function focusFigureAsset(assetPath) {
    const card = elements.figureAssetGallery.querySelector(
        `.figure-asset-card[data-asset-path="${window.CSS.escape(assetPath)}"]`
    );
    focusNewEntry(card, '[data-asset-action="view"]');
}

async function linkExistingFigureImage() {
    const eventId = elements.existingImageEvent.value;
    const assetId = elements.existingImageAsset.value;
    if (!eventId || !assetId) throw new Error('请选择需要关联的已有图片');
    elements.linkExistingFigureImageBtn.disabled = true;
    try {
        const result = await api('/api/archive/figure-asset-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                figureId: state.entityId,
                eventId,
                assetId,
                expectedRevision: state.existingImageAssetsRevision
            })
        });
        closeExistingFigureImage();
        await loadEntity();
        focusFigureAsset(result.asset.path);
        setStatus(result.changed ? `已将 ${assetId} 关联到当前人物草稿` : `${assetId} 已关联到当前人物草稿`, 'ok');
    } finally {
        elements.linkExistingFigureImageBtn.disabled = false;
    }
}

function resetImageImport() {
    elements.imageImportFile.value = '';
    elements.imageImportUrl.value = '';
    elements.imageImportUrl.dataset.syncedSourceUrl = '';
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
    elements.imageImportBtn.disabled = false;
}

async function loadImageImportSources() {
    const eventId = elements.imageImportEvent.value;
    elements.imageImportSourceId.innerHTML = '<option value="">加载来源...</option>';
    if (!eventId) {
        elements.imageImportSourceId.innerHTML = '<option value="">先选择事件</option>';
        elements.imageImportAssetId.value = '';
        return;
    }
    const [sourceResult, assetResult] = await Promise.all([
        api(`/api/archive/file?eventId=${encodeURIComponent(eventId)}&file=${encodeURIComponent('sources.json')}`),
        api(`/api/archive/file?eventId=${encodeURIComponent(eventId)}&file=${encodeURIComponent('assets.json')}`)
    ]);
    elements.imageImportSourceId.innerHTML = `<option value="">选择来源记录</option>${sourceResult.data
        .map(
            (source) =>
                `<option value="${escapeHtml(source.id)}" data-label-en="${escapeHtml(localize(source.label, 'en'))}" data-label-zh="${escapeHtml(localize(source.label, 'zh'))}">${escapeHtml(localize(source.label, 'zh') || localize(source.label, 'en') || source.id)}</option>`
        )
        .join('')}`;
    if (sourceResult.data.length) {
        elements.imageImportSourceId.selectedIndex = 1;
        syncImageSourceMetadata();
    }
    const baseAssetId = `asset-${eventId}-portrait-${state.entityId}`;
    const existingAssetIds = new Set(assetResult.data.map((asset) => asset.id));
    let assetId = baseAssetId;
    let suffix = 2;
    while (existingAssetIds.has(assetId)) {
        assetId = `${baseAssetId}-${suffix}`;
        suffix += 1;
    }
    elements.imageImportAssetId.value = assetId;
}

function syncImageSourceMetadata() {
    const option = elements.imageImportSourceId.selectedOptions[0];
    if (!option || !option.value) return;
    elements.imageImportSourceNameEn.value = option.dataset.labelEn || '';
    elements.imageImportSourceNameZh.value = option.dataset.labelZh || '';
}

function showImageImportPreview(source) {
    if (!source) {
        elements.imageImportPreview.removeAttribute('src');
        elements.imageImportPreview.hidden = true;
        elements.imageImportPlaceholder.hidden = false;
        return;
    }
    elements.imageImportPreview.src = source;
    elements.imageImportPreview.hidden = false;
    elements.imageImportPlaceholder.hidden = true;
}

function syncRemoteFigureImage() {
    const imageUrl = elements.imageImportUrl.value.trim();
    const previousSyncedUrl = elements.imageImportUrl.dataset.syncedSourceUrl || '';
    if (!imageUrl) {
        if (!elements.imageImportFile.files[0]) showImageImportPreview('');
        if (elements.imageImportSourceUrl.value.trim() === previousSyncedUrl) {
            elements.imageImportSourceUrl.value = '';
        }
        elements.imageImportUrl.dataset.syncedSourceUrl = '';
        return;
    }
    elements.imageImportFile.value = '';
    showImageImportPreview(imageUrl);
    if (
        !elements.imageImportSourceUrl.value.trim() ||
        elements.imageImportSourceUrl.value.trim() === previousSyncedUrl
    ) {
        elements.imageImportSourceUrl.value = imageUrl;
    }
    elements.imageImportUrl.dataset.syncedSourceUrl = imageUrl;
}

async function openFigureImageUpload() {
    if (state.creatingFigure || !state.entityId) {
        showError('请先保存人物，再上传图片');
        return;
    }
    await loadEventOptions();
    resetImageImport();
    elements.imageImportEvent.innerHTML = `<option value="">选择事件</option>${state.eventOptions
        .map((event) => {
            const title = localize(event.title, 'zh') || localize(event.title, 'en') || event.id;
            return `<option value="${escapeHtml(event.id)}">${escapeHtml(title)}</option>`;
        })
        .join('')}`;
    const relatedEventId = ((state.figureUsage && state.figureUsage.events) || [])[0];
    if (relatedEventId) {
        elements.imageImportEvent.value = relatedEventId;
        await loadImageImportSources();
    }
    elements.figureImageUploadDialog.showModal();
}

function closeFigureImageUpload() {
    elements.figureImageUploadDialog.close();
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
    const invalidField = [...elements.figureImageUploadDialog.querySelectorAll('[required]')].find(
        (field) => !field.checkValidity()
    );
    if (invalidField) {
        const details = invalidField.closest('details');
        if (details) details.open = true;
        invalidField.reportValidity();
        throw new Error('请填写所有带 * 的必填项');
    }
    const file = elements.imageImportFile.files[0];
    const imageUrl = elements.imageImportUrl.value.trim();
    if (!file && !imageUrl) throw new Error('请上传图片或填写图片 URL');
    if (file && imageUrl) throw new Error('本地图片和图片 URL 只能选择一种');
    if (file && file.size > 10 * 1024 * 1024) throw new Error('图片不能超过 10 MB');
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) throw new Error('图片 URL 必须使用 HTTP 或 HTTPS');
    const eventId = elements.imageImportEvent.value;
    const assetId = elements.imageImportAssetId.value.trim();
    const sourceId = elements.imageImportSourceId.value;
    if (!eventId || !assetId || !sourceId) {
        throw new Error('当前人物没有可用于登记图片的关联事件或来源记录');
    }
    if (
        elements.imageImportSetDefault.checked &&
        (!elements.imageImportSourceNameZh.value.trim() ||
            !elements.imageImportSourceNameEn.value.trim() ||
            !elements.imageImportSourceUrl.value.trim() ||
            !elements.imageImportRightsStatus.value.trim() ||
            !elements.imageImportLicenseZh.value.trim() ||
            !elements.imageImportLicenseEn.value.trim() ||
            !elements.imageImportUsageZh.value.trim() ||
            !elements.imageImportUsageEn.value.trim())
    ) {
        throw new Error('设为默认头像时需要完整的双语来源与版权资料；普通图片上传不受影响');
    }
    const imageInput = file ? { imageBase64: await readFileAsDataUrl(file) } : { imageUrl };
    elements.imageImportBtn.disabled = true;
    try {
        const result = await api('/api/archive/figure-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                figureId: state.entityId,
                eventId,
                assetId,
                sourceId,
                ...imageInput,
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
        closeFigureImageUpload();
        await loadEntity();
        focusFigureAsset(result.asset.path);
        setStatus(`已导入并登记到草稿 ${result.asset.path}`, 'ok');
    } finally {
        elements.imageImportBtn.disabled = false;
    }
}

function collectFigureForm() {
    const disambiguation = {
        en: elements.figureDisambiguationEn.value.trim(),
        zh: elements.figureDisambiguationZh.value.trim()
    };
    const notes = { ...((state.document.review && state.document.review.notes) || {}) };
    const reviewNotesZh = elements.reviewNotesZh.value.trim();
    if (reviewNotesZh) notes.zh = reviewNotesZh;
    else delete notes.zh;
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
        profileSources: collectFigureProfileSources(),
        review: {
            status: elements.reviewStatus.value,
            reviewedAt: elements.reviewedAt.value.trim(),
            reviewer: elements.reviewer.value.trim(),
            ...(Object.keys(notes).length ? { notes } : {})
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
        ['图片资产', groupFigureAssets().length],
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
            return {
                ...group,
                representative,
                eventIds: [...new Set(group.associations.map((asset) => asset.eventId))].sort(),
                assetIds: [...new Set(group.associations.map((asset) => asset.id))],
                roles: [...new Set(group.associations.map((asset) => asset.role).filter(Boolean))],
                isDefaultAvatar: group.associations.some((asset) => asset.isDefaultAvatar),
                usedByRelations: group.associations.some((asset) => asset.usedByRelations)
            };
        })
        .sort(
            (left, right) =>
                Number(right.isDefaultAvatar) - Number(left.isDefaultAvatar) || left.path.localeCompare(right.path)
        );
}

function updateDefaultAvatarAssetLink() {
    const avatarPath = elements.avatarPath.value.trim();
    elements.openDefaultAvatarAssetBtn.hidden = !avatarPath;
    elements.removeDefaultAvatarBtn.hidden = !avatarPath;
    elements.replaceDefaultAvatarBtn.textContent = avatarPath ? '替换头像' : '选择头像';
    elements.replaceDefaultAvatarBtn.disabled = state.creatingFigure;
    elements.replaceDefaultAvatarBtn.title = state.creatingFigure ? '请先保存人物，再从图片资产中选择头像' : '';
    if (!avatarPath) return;
    const hasMatchingAsset = groupFigureAssets().some((group) => group.path === avatarPath);
    elements.openDefaultAvatarAssetBtn.textContent = hasMatchingAsset ? '查看对应图片资产' : '查看头像资产信息';
    elements.openDefaultAvatarAssetBtn.title = hasMatchingAsset
        ? '打开图片资产并定位当前默认头像'
        : '当前默认头像尚未登记为人物图片资产，打开头像引用信息';
    elements.openDefaultAvatarAssetBtn.dataset.hasMatchingAsset = String(hasMatchingAsset);
}

function openDefaultAvatarAsset() {
    const avatarPath = elements.avatarPath.value.trim();
    if (!avatarPath) return;
    activateFigureSection('assets');
    window.requestAnimationFrame(() => {
        const target = [...elements.figureAssetGallery.querySelectorAll('.figure-asset-card')].find(
            (card) => card.dataset.assetPath === avatarPath
        );
        if (!target) elements.figureAvatarEditor.open = true;
        const destination = target || elements.figureAvatarEditor;
        destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
        destination.classList.add('is-linked-target');
        window.setTimeout(() => destination.classList.remove('is-linked-target'), 1600);
        if (!target) setStatus('当前默认头像尚未登记为人物图片资产，请在此核对引用信息', '');
    });
}

function replaceDefaultAvatar() {
    if (state.creatingFigure) {
        showError('请先保存人物，再从图片资产中选择头像');
        return;
    }
    activateFigureSection('assets');
    window.requestAnimationFrame(() => {
        const assetGroups = groupFigureAssets();
        const destination = assetGroups.length ? elements.figureAssetGallery : elements.figureAssetEmpty;
        destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (assetGroups.length) {
            elements.figureAssetGallery.classList.add('is-choose-target');
            window.setTimeout(() => elements.figureAssetGallery.classList.remove('is-choose-target'), 1600);
            setStatus('请在图片资产卡片中选择“设为默认头像”', '');
        } else {
            setStatus('暂无可选图片资产', '');
        }
    });
}

function removeDefaultAvatar() {
    if (!elements.avatarPath.value.trim()) return;
    if (!window.confirm('仅移除当前人物的默认头像引用，不删除图片资产或文件。继续吗？')) return;
    clearDefaultAvatarFields();
    state.document = collectFigureForm();
    syncEditor();
    renderAvatarPreview();
    setStatus('已移除默认头像引用，保存后生效', '');
}

function renderFigureAssetCards() {
    const assetGroups = groupFigureAssets();
    elements.figureAssetCount.textContent = `${assetGroups.length} 个图片资产`;
    elements.figureAssetEmpty.hidden = assetGroups.length > 0;
    elements.figureAssetGallery.innerHTML = assetGroups
        .map((group) => {
            const asset = group.representative;
            const caption = localize(asset.caption, 'zh') || localize(asset.caption, 'en') || asset.id;
            const subcaption = localize(asset.subcaption, 'zh') || localize(asset.subcaption, 'en');
            const preview =
                asset.type === 'image'
                    ? `<img class="figure-asset-image" src="${escapeHtml(assetImageSource(asset))}" alt="${escapeHtml(caption)}" loading="lazy">`
                    : `<div class="figure-asset-filetype">${escapeHtml(String(asset.type || 'file').toUpperCase())}</div>`;
            const defaultTitle = asset.canSetAsDefaultAvatar
                ? '将这张图片设为人物全局默认头像'
                : (asset.defaultAvatarIssues || []).join('；');
            const defaultActionLabel = group.isDefaultAvatar ? '当前默认头像' : '设为默认头像';
            const unlinkBlockedReason = group.isDefaultAvatar
                ? '当前图片是默认头像，请先移除或替换默认头像'
                : group.usedByRelations
                  ? '当前图片被事件人物关系选作头像，请先移除或替换对应的头像引用'
                  : '';
            const unlinkTitle = unlinkBlockedReason || '解除当前人物与该图片的关联；图片资产记录和文件会保留';
            const editTarget =
                group.associations.length > 1
                    ? `<select data-asset-edit-target aria-label="选择要编辑的资产记录">${group.associations
                          .map(
                              (association, index) =>
                                  `<option value="${index}">${escapeHtml(association.eventId)} · ${escapeHtml(association.id)}</option>`
                          )
                          .join('')}</select>`
                    : '';
            return `<article class="figure-asset-card${group.isDefaultAvatar ? ' is-default' : ''}" data-event-id="${escapeHtml(asset.eventId)}" data-asset-id="${escapeHtml(asset.id)}" data-asset-path="${escapeHtml(group.path)}">
                <div class="figure-asset-preview">${preview}<div class="figure-asset-overlay"><span>${group.eventIds.length} 个事件</span><span>${escapeHtml(group.roles.join(' / ') || asset.type)}</span></div></div>
                <div class="figure-asset-body">
                    <div class="figure-asset-title-row"><strong>${escapeHtml(caption)}</strong>${group.isDefaultAvatar ? '<span class="badge verified">默认头像</span>' : ''}</div>
                    ${subcaption ? `<p>${escapeHtml(subcaption)}</p>` : ''}
                    <dl class="figure-asset-meta">
                        <div><dt>文件路径</dt><dd>${escapeHtml(group.path)}</dd></div>
                    </dl>
                    <div class="figure-asset-tags">
                        ${group.usedByRelations ? '<span class="asset-tag active">被事件关系选作头像</span>' : '<span class="asset-tag">未被事件关系选用</span>'}
                        ${group.eventIds.map((eventId) => `<span class="asset-tag">${escapeHtml(eventId)}</span>`).join('')}
                    </div>
                    <div class="figure-asset-actions">
                        <button data-asset-action="view">查看原图</button>
                        <button data-asset-action="copy-path">复制路径</button>
                        <span class="figure-asset-edit-action">${editTarget}<button data-asset-action="edit">编辑资产</button></span>
                        <button class="primary" data-asset-action="set-default" title="${escapeHtml(defaultTitle)}"${group.isDefaultAvatar || !asset.canSetAsDefaultAvatar ? ' disabled' : ''}>${defaultActionLabel}</button>
                        <button class="danger" data-asset-action="unlink" title="${escapeHtml(unlinkTitle)}"${unlinkBlockedReason ? ' disabled' : ''}>解除关联</button>
                    </div>
                </div>
            </article>`;
        })
        .join('');
    updateDefaultAvatarAssetLink();
}

async function renderFigureAssets() {
    if (!state.entityId || state.creatingFigure) {
        state.figureAssets = [];
        elements.figureAssetCount.textContent = '0';
        elements.figureAssetGallery.innerHTML = '';
        elements.figureAssetEmpty.hidden = false;
        updateDefaultAvatarAssetLink();
        return;
    }
    state.figureAssets = await api(`/api/archive/figure-assets?figureId=${encodeURIComponent(state.entityId)}`);
    renderFigureAssetCards();
}

function relationRoleText(relation) {
    return localize(relation.role, 'zh') || localize(relation.role, 'en') || '未填写角色';
}

function figureEventRoleChips(detail) {
    const roles = new Map();
    for (const relation of [...detail.eventRelations, ...detail.variantRelations]) {
        const text = relationRoleText(relation);
        const existing = roles.get(text);
        roles.set(text, { text, primary: relation.primary === true || (existing && existing.primary === true) });
    }
    return roles.size
        ? [...roles.values()]
              .map(
                  (role) =>
                      `<span class="event-relation-chip${role.primary ? ' primary' : ''}">${escapeHtml(role.text)}${role.primary ? ' · 主要' : ''}</span>`
              )
              .join('')
        : '<span class="muted">未填写角色</span>';
}

function renderFigureEvents() {
    const eventDetails = (state.figureUsage && state.figureUsage.eventDetails) || [];
    elements.figureEventCount.textContent = `${eventDetails.length} 个事件`;
    elements.figureEventEmpty.hidden = eventDetails.length > 0;
    elements.figureEventList.innerHTML = eventDetails
        .map((detail) => {
            const title = localize(detail.title, 'zh') || localize(detail.title, 'en') || detail.eventId;
            const roles = figureEventRoleChips(detail);
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
                <div class="figure-event-cell"><span class="figure-event-label">角色</span><div class="event-relation-chips">${roles}</div></div>
                <div class="figure-event-cell"><span class="figure-event-label">资产引用</span><div>${eventAssets.length} 条记录 · ${uniquePaths.size} 个文件</div>${avatarIds.length ? `<div class="event-avatar-ids">头像：${escapeHtml([...new Set(avatarIds)].join('、'))}</div>` : ''}</div>
                <div class="figure-event-actions">
                    <button data-event-action="open-admin">后台事件</button>
                    ${displayTargets.length ? `<span class="figure-event-label">展示版本</span><select data-display-target aria-label="选择展示故事线">${displayOptions}</select><button class="primary" data-event-action="open-display">展示事件 ↗</button>` : '<button data-event-action="open-display" disabled title="该事件未加入启用的故事线">暂无展示页</button>'}
                </div>
            </article>`;
        })
        .join('');
}

async function openAdminEvent(eventId, file = 'event.json') {
    await flushDraftSave();
    state.type = 'events';
    elements.entityType.value = 'events';
    await refresh();
    selectEntity(eventId);
    if (![...elements.fileSelect.options].some((option) => option.value === file)) {
        throw new Error(`${eventId} 没有 ${file}`);
    }
    state.file = file;
    state.eventSection = eventSectionForFile(file);
    elements.fileSelect.value = state.file;
    await loadEntity();
}

async function openFigureAssetEditor(asset) {
    await openAdminEvent(asset.eventId, 'assets.json');
    const index = Array.isArray(state.document)
        ? state.document.findIndex((candidate) => candidate.id === asset.id)
        : -1;
    if (index < 0) throw new Error(`未找到资产：${asset.eventId} / ${asset.id}`);
    const item = elements.structuredEditor.querySelector(`[data-collection-index="${index}"]`);
    focusNewEntry(item, '[data-structured-field="caption.zh"]');
    setStatus(`已打开资产 ${asset.id}`, 'ok');
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
        return;
    }
    state.eventDisplayTargets = await api(
        `/api/archive/event-presentation-targets?eventId=${encodeURIComponent(state.entityId)}`
    );
    elements.eventDisplayTarget.innerHTML = state.eventDisplayTargets
        .map((target, index) => {
            const storylineTitle =
                localize(target.storylineTitle, 'zh') || localize(target.storylineTitle, 'en') || target.storylineId;
            return `<option value="${index}">${escapeHtml(storylineTitle)} · ${escapeHtml(target.storylineId)}</option>`;
        })
        .join('');
    elements.openEventDisplayBtn.disabled = state.eventDisplayTargets.length === 0;
    elements.openEventDisplayBtn.title = state.eventDisplayTargets.length
        ? '在展示页打开当前事件'
        : '该事件未加入启用的故事线';
}

function selectedEventPresentationTarget() {
    return state.eventDisplayTargets[Number(elements.eventDisplayTarget.value)] || null;
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
    setStatus(`已在草稿中将 ${asset.id} 设为默认头像`, 'ok');
}

async function unlinkFigureAssetGroup(group) {
    const associationCount = group.associations.length;
    const confirmation = `将解除当前人物与该图片的关联（共 ${associationCount} 条资产记录）。图片资产和文件会保留。继续吗？`;
    if (!window.confirm(confirmation)) return;
    const result = await api('/api/archive/figure-asset-unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            figureId: state.entityId,
            associations: group.associations.map((asset) => ({
                eventId: asset.eventId,
                assetId: asset.id,
                expectedRevision: asset.assetsRevision
            }))
        })
    });
    await loadEntity();
    setStatus(
        result.changed
            ? `已在草稿中解除图片与当前人物的关联，保留图片资产和文件（${result.unlinkedAssociations.length} 条记录）`
            : '该图片已未关联当前人物',
        'ok'
    );
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

const relationAvatarAssets = new WeakMap();

function relationAvatarSelection(relation, figure, assets) {
    if (relation.avatarAssetId) {
        const asset = assets.find((candidate) => candidate.id === relation.avatarAssetId);
        if (!asset) {
            return {
                kind: '事件头像不可用',
                detail: relation.avatarAssetId,
                path: '',
                style: ''
            };
        }
        return {
            kind: '事件头像',
            detail: `${localize(asset.caption, 'zh') || localize(asset.caption, 'en') || asset.id} · ${asset.id}`,
            path: asset.path || '',
            style: relation.avatarStyle || ''
        };
    }
    if (figure.defaultAvatar) {
        return {
            kind: '人物默认头像',
            detail: '来自人物资料',
            path: figure.defaultAvatar,
            style: Object.hasOwn(relation, 'avatarStyle') ? relation.avatarStyle || '' : figure.defaultAvatarStyle || ''
        };
    }
    return {
        kind: '未配置头像',
        detail: '当前人物没有默认头像或事件头像',
        path: '',
        style: ''
    };
}

function updateRelationAvatarPreview(row, relation, assets) {
    if (!row) return;
    const figure = relationFigure(relation.figureId);
    const selection = relationAvatarSelection(relation, figure, assets);
    const avatar = row.querySelector('[data-relation-avatar]');
    const kind = row.querySelector('[data-relation-avatar-kind]');
    const detail = row.querySelector('[data-relation-avatar-detail]');
    const path = row.querySelector('[data-relation-avatar-path]');
    avatar.replaceChildren();
    avatar.classList.toggle('is-empty', !selection.path);
    if (selection.path) {
        const image = document.createElement('img');
        image.src = adminMediaUrl(selection.path);
        image.alt = `${localize(figure.name, 'zh') || localize(figure.name, 'en')} ${selection.kind}`;
        image.loading = 'lazy';
        image.style.cssText = selection.style;
        avatar.append(image);
    } else {
        avatar.textContent = '无头像';
    }
    kind.textContent = selection.kind;
    detail.textContent = selection.detail;
    path.textContent = selection.path;
    path.hidden = !selection.path;
}

async function populateAvatarSelect(select, relation, figureId) {
    const assets = await api(
        `/api/archive/figure-assets?figureId=${encodeURIComponent(figureId)}&eventId=${encodeURIComponent(state.entityId)}`
    );
    const selected = relation.avatarAssetId || '';
    const figure = relationFigure(figureId);
    select.innerHTML = [
        `<option value="">${figure.defaultAvatar ? '使用人物默认头像' : '无事件头像覆盖'}</option>`,
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
    relationAvatarAssets.set(select, assets);
    updateRelationAvatarPreview(select.closest('.relation-row'), relation, assets);
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
            const initialAvatar = relation.avatarAssetId
                ? '<span class="relation-avatar is-empty" data-relation-avatar>加载中</span>'
                : figure.defaultAvatar
                  ? `<span class="relation-avatar" data-relation-avatar><img src="${escapeHtml(adminMediaUrl(figure.defaultAvatar))}" alt="${escapeHtml(localize(figure.name, 'zh') || localize(figure.name, 'en'))} 人物默认头像" loading="lazy" data-avatar-style="${escapeHtml(figure.defaultAvatarStyle || '')}"></span>`
                  : '<span class="relation-avatar is-empty" data-relation-avatar>无头像</span>';
            return `<div class="relation-row" data-index="${index}">
              <div class="relation-title">
                <div class="relation-identity">${initialAvatar}<div class="relation-identity-copy"><div class="relation-name-line"><strong>${escapeHtml(localize(figure.name, 'zh') || localize(figure.name, 'en'))}</strong><label class="relation-primary-toggle"><input type="checkbox" data-field="primary"${relation.primary === true ? ' checked' : ''}>主要人物</label></div><div class="muted">${escapeHtml(figureTypeLabel(figure.type))}</div><div class="relation-avatar-info"><span data-relation-avatar-kind>${relation.avatarAssetId ? '正在加载事件头像' : figure.defaultAvatar ? '人物默认头像' : '未配置头像'}</span><span data-relation-avatar-detail>${relation.avatarAssetId ? escapeHtml(relation.avatarAssetId) : figure.defaultAvatar ? '来自人物资料' : '当前人物没有默认头像或事件头像'}</span><code data-relation-avatar-path${figure.defaultAvatar && !relation.avatarAssetId ? '' : ' hidden'}>${figure.defaultAvatar && !relation.avatarAssetId ? escapeHtml(figure.defaultAvatar) : ''}</code></div></div></div>
                <div class="relation-actions"><button class="relation-open-button" data-action="open-figure">打开人物资料</button><button data-action="up" title="上移">↑</button><button data-action="down" title="下移">↓</button><button data-action="remove">移除</button></div>
              </div>
              <div class="form-grid">
                <label class="role-field">${fieldLabel('英文角色', true)}<input data-field="role.en" value="${escapeHtml(localize(relation.role, 'en'))}" required></label>
                <label class="role-field">${fieldLabel('中文角色', true)}<input data-field="role.zh" value="${escapeHtml(localize(relation.role, 'zh'))}" required></label>
                <label class="span-2">事件头像<select data-field="avatarAssetId"><option value="">正在加载资产...</option></select></label>
                ${relation.avatarStyle ? `<label>头像样式<input data-field="avatarStyle" value="${escapeHtml(relation.avatarStyle)}"></label>` : ''}
                ${isVariantFile() ? `<div class="checks span-2"><label><input type="checkbox" data-field="useDefaultAvatar"${relation.useDefaultAvatar === true ? ' checked' : ''}>强制使用全局默认头像</label></div>` : ''}
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
    for (const image of elements.relationRows.querySelectorAll('.relation-avatar img[data-avatar-style]')) {
        image.style.cssText = image.dataset.avatarStyle || '';
    }
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
    } else if (field === 'avatarAssetId') {
        if (target.value) {
            relation.avatarAssetId = target.value;
            delete relation.useDefaultAvatar;
        } else {
            delete relation.avatarAssetId;
            if (relationFigure(relation.figureId).defaultAvatar) relation.useDefaultAvatar = true;
            else delete relation.useDefaultAvatar;
        }
    } else if (field === 'avatarStyle') {
        if (target.value) relation.avatarStyle = target.value;
        else delete relation.avatarStyle;
    }
    if (['avatarAssetId', 'useDefaultAvatar', 'avatarStyle'].includes(field)) {
        const row = target.closest('.relation-row');
        const select = row && row.querySelector('[data-field="avatarAssetId"]');
        updateRelationAvatarPreview(row, relation, (select && relationAvatarAssets.get(select)) || []);
    }
    syncEditor();
    setStatus('已修改人物关系，尚未保存', '');
}

async function openFigureDetails(figureId) {
    await flushDraftSave();
    state.type = 'figures';
    elements.entityType.value = 'figures';
    await refresh();
    if (!state.entities.some((figure) => figure.id === figureId)) {
        throw new Error(`Figure 不存在：${figureId}`);
    }
    selectEntity(figureId);
    await loadEntity();
}

function currentEntitySaveRequest() {
    if (!state.document) throw new Error('请先加载或新建实体');
    if (state.type === 'figures') {
        const figure = collectFigureForm();
        state.document = figure;
        state.entityId = figure.id;
        syncEditor();
        return {
            url: '/api/archive/figure',
            body: {
                type: 'figures',
                figureId: figure.id,
                data: figure,
                create: state.creatingFigure,
                expectedRevision: state.revision || state.figureListRevision
            }
        };
    }
    let documentValue;
    try {
        documentValue = JSON.parse(elements.editor.value);
    } catch (error) {
        throw new Error(`JSON 无效：${error.message}`);
    }
    state.document = documentValue;
    return state.type === 'events'
        ? {
              url: '/api/archive/file',
              body: {
                  type: 'events',
                  eventId: state.entityId,
                  file: state.file,
                  data: state.document,
                  expectedRevision: state.revision
              }
          }
        : {
              url: '/api/archive/storyline',
              body: {
                  type: 'storylines',
                  storylineId: state.entityId,
                  data: state.document,
                  expectedRevision: state.revision
              }
          };
}

async function validateEntity() {
    const request = currentEntitySaveRequest();
    validatePendingAssetRequirements();
    state.taskRunning = true;
    elements.taskOutputTitle.textContent = '校验结果';
    elements.validationOutput.textContent = '正在校验当前编辑内容...';
    setTaskOutputVisible(true);
    syncTaskActionAvailability();
    try {
        const result = await api('/api/archive/validate-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.body)
        });
        elements.validationOutput.textContent =
            [result.stdout, result.stderr].filter(Boolean).join('\n') || `exitCode=${result.exitCode}`;
        if (result.ok) setStatus('当前编辑内容校验通过，尚未保存', 'ok');
        else showError('当前编辑内容校验失败，尚未保存');
    } catch (error) {
        elements.validationOutput.textContent = error.message;
        throw error;
    } finally {
        state.taskRunning = false;
        syncTaskActionAvailability();
    }
}

let draftSaveTimer = null;
let draftSavePromise = Promise.resolve();

function canAutoSaveDraft() {
    if (!state.document || !['events', 'storylines', 'figures'].includes(state.type)) return false;
    if (state.type === 'figures' && !/^[a-z0-9][a-z0-9._-]*$/.test(elements.figureId.value.trim())) return false;
    return true;
}

function scheduleDraftSave(delay = 450) {
    if (!canAutoSaveDraft()) return;
    window.clearTimeout(draftSaveTimer);
    draftSaveTimer = window.setTimeout(() => {
        draftSaveTimer = null;
        draftSavePromise = draftSavePromise
            .then(() => saveEntity({ automatic: true }))
            .catch((error) => showError(error, '草稿暂存失败'));
    }, delay);
}

async function flushDraftSave() {
    if (draftSaveTimer) {
        window.clearTimeout(draftSaveTimer);
        draftSaveTimer = null;
        if (canAutoSaveDraft()) {
            draftSavePromise = draftSavePromise.then(() => saveEntity({ automatic: true }));
        }
    }
    await draftSavePromise;
}

async function saveEntity({ automatic = false } = {}) {
    if (state.draftSaving) return;
    state.draftSaving = true;
    try {
        const request = currentEntitySaveRequest();
        const wasCreatingFigure = state.type === 'figures' && state.creatingFigure;
        const result = await api(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.body)
        });
        if (state.type === 'figures') state.creatingFigure = false;
        state.revision = result.revision || state.revision;
        state.pendingAssetIds = new Set();
        state.pendingAssetPaths = new Set();
        setStatus(automatic ? '变更已加入待处理草稿' : '变更已加入待处理草稿', 'ok');
        if (state.type === 'figures' && wasCreatingFigure) {
            const selectedId = state.entityId;
            const list = await api('/api/archive/figures');
            state.entities = list.items;
            state.figureOptions = list.items;
            state.figureListRevision = list.revision;
            state.entityId = selectedId;
            renderEntities();
            elements.figureId.disabled = true;
        }
        if (state.type === 'storylines') {
            const selectedId = state.entityId;
            state.entities = await api('/api/archive/storylines');
            state.entityId = selectedId;
            renderEntities();
            renderStorylineOverview();
        }
    } finally {
        state.draftSaving = false;
    }
}

async function runTask(task) {
    if (state.taskRunning) return;
    const config = archiveTaskConfig[task];
    if (!config) throw new Error(`不支持的 Archive 任务：${task}`);
    state.taskRunning = true;
    elements.taskOutputTitle.textContent = config.title;
    elements.validationOutput.textContent = config.pendingMessage;
    setTaskOutputVisible(true);
    syncTaskActionAvailability();
    try {
        const result = await api(`/api/archive/${task}`, { method: 'POST' });
        elements.validationOutput.textContent =
            [result.stdout, result.stderr].filter(Boolean).join('\n') || `exitCode=${result.exitCode}`;
        if (result.ok) setStatus(config.successMessage, 'ok');
        else showError(config.failureMessage);
    } catch (error) {
        elements.validationOutput.textContent = error.message;
        throw error;
    } finally {
        state.taskRunning = false;
        syncTaskActionAvailability();
    }
}

function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const amount = bytes / 1024 ** index;
    return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
}

function formatPublishTime(value) {
    if (!value) return '尚未生成';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('zh-CN', { hour12: false });
}

function setPublishMetric(element, text, tone = '') {
    element.textContent = text;
    element.classList.toggle('is-ok', tone === 'ok');
    element.classList.toggle('is-warn', tone === 'warn');
}

function renderPublishChanges(status) {
    const changes = status.draft?.active || [];
    const discarded = status.draft?.discarded || [];
    const summary = status.draft?.summary || {};
    elements.publishChangeList.replaceChildren();
    const rollbackPrefix =
        status.draft?.origin?.type === 'rollback' ? `回滚草稿，目标版本 ${status.draft.origin.versionId}。` : '';
    elements.publishChangeSummary.textContent = `${rollbackPrefix}待处理 ${summary.active || 0} 项：未决 ${summary.pending || 0}，已保留 ${summary.kept || 0}；已放弃 ${summary.discarded || 0}。`;
    if (!changes.length && !discarded.length) {
        const empty = document.createElement('p');
        empty.className = 'publish-empty';
        empty.textContent = '当前没有 Admin 待处理变更。';
        elements.publishChangeList.append(empty);
        return;
    }
    [...changes, ...discarded].forEach((change) => {
        const item = document.createElement('div');
        const badge = document.createElement('span');
        const body = document.createElement('div');
        const title = document.createElement('strong');
        const meta = document.createElement('span');
        const details = document.createElement('div');
        const actions = document.createElement('div');
        item.className = `publish-change-item is-${change.status}`;
        item.dataset.changeId = change.id;
        badge.className = 'publish-change-code';
        body.className = 'publish-change-body';
        meta.className = 'publish-change-group';
        details.className = 'publish-change-details';
        actions.className = 'publish-change-actions';
        badge.textContent = change.status === 'kept' ? '已保留' : change.status === 'discarded' ? '已放弃' : '未决';
        title.textContent = change.summary;
        meta.textContent = `${change.action} · ${change.group} · ${change.file}`;
        if (change.beforeText !== '无' || change.afterText !== '无') {
            details.textContent = `${change.beforeText} → ${change.afterText}`;
        }
        body.append(title, meta, details);
        if (change.status !== 'discarded') {
            const keepButton = document.createElement('button');
            const discardButton = document.createElement('button');
            keepButton.type = 'button';
            keepButton.dataset.draftDecision = 'kept';
            keepButton.textContent = change.status === 'kept' ? '已保留' : '保留';
            keepButton.disabled = change.status === 'kept' || state.taskRunning;
            discardButton.type = 'button';
            discardButton.className = 'danger';
            discardButton.dataset.draftDecision = 'discarded';
            discardButton.textContent = '放弃';
            discardButton.disabled = state.taskRunning;
            actions.append(keepButton, discardButton);
        }
        item.append(badge, body, actions);
        elements.publishChangeList.append(item);
    });
}

function historyActionLabel(action) {
    return (
        {
            initial: '初始版本',
            apply: '应用变更',
            rollback: '回滚版本',
            external: '外部变化'
        }[action] ||
        action ||
        '历史版本'
    );
}

function renderPublishView() {
    const historyMode = state.publishView === 'history';
    elements.publishChangesTab.classList.toggle('is-active', !historyMode);
    elements.publishChangesTab.setAttribute('aria-selected', historyMode ? 'false' : 'true');
    elements.publishHistoryTab.classList.toggle('is-active', historyMode);
    elements.publishHistoryTab.setAttribute('aria-selected', historyMode ? 'true' : 'false');
    elements.publishChangesPane.hidden = historyMode;
    elements.publishHistoryPane.hidden = !historyMode;
    elements.publishHeadingActions.hidden = historyMode;
}

function setPublishView(view) {
    state.publishView = view === 'history' ? 'history' : 'changes';
    renderPublishView();
    if (state.publishView === 'history') loadPublishHistory().catch((error) => showError(error, '历史版本加载失败'));
}

function renderHistoryVersionList() {
    elements.historyVersionList.replaceChildren();
    elements.historyVersionCount.textContent = `${state.historyVersions.length} 个版本`;
    if (!state.historyVersions.length) {
        const empty = document.createElement('p');
        empty.className = 'publish-empty';
        empty.textContent = state.historyLoaded ? '暂无历史版本。' : '正在读取历史版本...';
        elements.historyVersionList.append(empty);
        return;
    }
    for (const version of state.historyVersions) {
        const button = document.createElement('button');
        const heading = document.createElement('span');
        const action = document.createElement('strong');
        const time = document.createElement('time');
        const note = document.createElement('span');
        const meta = document.createElement('span');
        button.type = 'button';
        button.className = 'history-version-item';
        button.dataset.historyVersionId = version.id;
        button.classList.toggle('is-selected', version.id === state.selectedHistoryVersionId);
        action.textContent = historyActionLabel(version.action);
        time.textContent = formatPublishTime(version.createdAt);
        note.className = 'history-version-note';
        note.textContent = version.note || '未填写版本说明';
        meta.className = 'history-version-meta';
        meta.textContent = `${version.changeCount || 0} 个文件变化 · ${version.fileCount || 0} 个 Json`;
        heading.append(action, time);
        button.append(heading, note, meta);
        elements.historyVersionList.append(button);
    }
}

function appendHistorySummary(value, label) {
    const item = document.createElement('div');
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    strong.textContent = String(value);
    span.textContent = label;
    item.append(strong, span);
    elements.historyDetailSummary.append(item);
}

function renderHistoryVersionDetail(version) {
    state.selectedHistoryVersion = version;
    elements.historyDetailEmpty.hidden = true;
    elements.historyVersionDetail.hidden = false;
    elements.historyDetailTitle.textContent = `${historyActionLabel(version.action)} · ${version.id}`;
    const rollbackLabel = version.rollbackExact === false ? '部分回滚来源' : '回滚来源';
    elements.historyDetailMeta.textContent = `${formatPublishTime(version.createdAt)}${version.rollbackFromVersionId ? ` · ${rollbackLabel} ${version.rollbackFromVersionId}` : ''}`;
    elements.historyDetailNote.textContent = version.note || '未填写版本说明。';
    elements.historyDetailSummary.replaceChildren();
    appendHistorySummary(version.fileCount || 0, 'Json 文件');
    appendHistorySummary(formatBytes(version.totalBytes || 0), '快照大小');
    appendHistorySummary(version.changeCount || 0, '文件变化');
    appendHistorySummary((version.dataHash || '').slice(0, 10) || '-', '内容摘要');
    elements.historyChangeList.replaceChildren();
    const changes = version.changes || [];
    if (!changes.length) {
        const empty = document.createElement('p');
        empty.className = 'publish-empty';
        empty.textContent = version.action === 'initial' ? '这是历史版本基线。' : '相对上一版本没有文件变化。';
        elements.historyChangeList.append(empty);
    } else {
        changes.forEach((change) => {
            const item = document.createElement('div');
            const operation = document.createElement('span');
            const body = document.createElement('div');
            const file = document.createElement('code');
            const context = document.createElement('span');
            item.className = 'history-change-item';
            operation.textContent =
                { added: '新增', modified: '修改', deleted: '删除' }[change.operation] || change.operation;
            file.textContent = change.file;
            context.textContent = `${change.group} · ${change.objectId}`;
            body.append(file, document.createElement('br'), context);
            item.append(operation, body);
            elements.historyChangeList.append(item);
        });
    }
    syncTaskActionAvailability();
}

async function selectHistoryVersion(versionId) {
    state.selectedHistoryVersionId = versionId;
    renderHistoryVersionList();
    elements.historyDetailEmpty.hidden = false;
    elements.historyDetailEmpty.textContent = '正在读取版本详情...';
    elements.historyVersionDetail.hidden = true;
    const result = await api(`/api/archive/history-version?versionId=${encodeURIComponent(versionId)}`);
    if (state.selectedHistoryVersionId !== versionId) return;
    renderHistoryVersionDetail(result.version);
    renderHistoryVersionList();
}

async function loadPublishHistory(force = false) {
    if (state.historyLoaded && !force) {
        renderHistoryVersionList();
        if (state.selectedHistoryVersionId && !state.selectedHistoryVersion) {
            await selectHistoryVersion(state.selectedHistoryVersionId);
        }
        return;
    }
    state.historyLoaded = false;
    renderHistoryVersionList();
    const result = await api('/api/archive/history');
    state.historyVersions = result.versions || [];
    if (state.publishStatus) {
        state.publishStatus.history = {
            count: state.historyVersions.length,
            latest: state.historyVersions[0] || null
        };
    }
    state.historyLoaded = true;
    if (!state.historyVersions.some((version) => version.id === state.selectedHistoryVersionId)) {
        state.selectedHistoryVersionId = state.historyVersions[0]?.id || '';
        state.selectedHistoryVersion = null;
    }
    renderHistoryVersionList();
    if (state.selectedHistoryVersionId) await selectHistoryVersion(state.selectedHistoryVersionId);
}

async function createRollbackDraft() {
    const version = state.selectedHistoryVersion;
    if (!version || state.taskRunning) return;
    if (
        !window.confirm(
            `从历史版本 ${version.id} 创建回滚草稿？\n\n不会立即修改正式 Json，也不会删除图片、音视频或其他资料文件。`
        )
    ) {
        return;
    }
    state.taskRunning = true;
    syncTaskActionAvailability();
    try {
        const result = await api('/api/archive/history-restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ versionId: version.id })
        });
        state.publishView = 'changes';
        state.historyLoaded = false;
        await loadPublishStatus();
        renderPublishView();
        setStatus(
            result.draft?.summary?.active
                ? `已从版本 ${version.id} 创建回滚草稿，请逐项确认后应用`
                : `当前正式 Json 已与版本 ${version.id} 一致`,
            'ok'
        );
    } finally {
        state.taskRunning = false;
        syncTaskActionAvailability();
    }
}

function appendPublishDetail(label, value) {
    appendPublishDetailTo(elements.publishBundleDetails, label, value);
}

function appendPublishDetailTo(container, label, value) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    container.append(term, description);
}

function renderPublishStatus() {
    const status = state.publishStatus;
    if (!status) return;
    const summary = status.draft?.summary || {};
    setPublishMetric(elements.publishChangeCount, String(summary.active || 0), summary.pending ? 'warn' : 'ok');
    setPublishMetric(
        elements.publishArchiveChangeCount,
        `${summary.pending || 0} / ${summary.kept || 0} / ${summary.discarded || 0}`,
        summary.pending ? 'warn' : 'ok'
    );
    setPublishMetric(
        elements.publishRuntimeStatus,
        status.runtime?.ready ? '已同步' : '待生成',
        status.runtime?.ready ? 'ok' : 'warn'
    );
    setPublishMetric(
        elements.publishBundleStatus,
        status.bundle?.ready ? '可预览' : status.bundle?.exists ? '需重建' : '未构建',
        status.bundle?.ready ? 'ok' : 'warn'
    );
    setPublishMetric(
        elements.publishTestPreviewStatus,
        status.preview?.ready ? '可查看' : status.preview?.exists ? '已过期' : '未生成',
        status.preview?.ready ? 'ok' : 'warn'
    );
    renderPublishChanges(status);
    elements.publishTestPreviewDetails.replaceChildren();
    appendPublishDetailTo(
        elements.publishTestPreviewDetails,
        '当前状态',
        status.preview?.ready
            ? '与当前已保留草稿一致'
            : status.preview?.exists
              ? '草稿已变化，需要重新生成'
              : '尚未生成测试预览'
    );
    appendPublishDetailTo(elements.publishTestPreviewDetails, '生成时间', formatPublishTime(status.preview?.builtAt));
    appendPublishDetailTo(
        elements.publishTestPreviewDetails,
        '文件数量',
        status.preview?.exists ? String(status.preview.fileCount || 0) : '-'
    );
    appendPublishDetailTo(
        elements.publishTestPreviewDetails,
        '预览大小',
        status.preview?.exists ? formatBytes(status.preview.totalBytes) : '-'
    );
    elements.openTestPreview.hidden = !status.preview?.ready;
    elements.publishBundleDetails.replaceChildren();
    appendPublishDetail('输出目录', status.bundle?.relativePath || '.tmp/static-site/');
    appendPublishDetail('构建时间', formatPublishTime(status.bundle?.builtAt));
    appendPublishDetail('文件数量', status.bundle?.exists ? String(status.bundle.fileCount || 0) : '-');
    appendPublishDetail('发布包大小', status.bundle?.exists ? formatBytes(status.bundle.totalBytes) : '-');
    appendPublishDetail(
        '当前状态',
        status.bundle?.ready
            ? '发布包与当前源文件同步'
            : status.bundle?.exists
              ? '源文件已有更新，需要重新构建'
              : '尚未构建发布包'
    );
    elements.openPublishPreview.hidden = !status.bundle?.exists;
}

function publishStepLabel(name) {
    return (
        {
            'draft-validate': '校验保留变更',
            'validate-draft': '校验保留变更',
            apply: '应用到 Json',
            'saved-validate': '生效前先校验',
            validate: '生效前先校验',
            generate: '生成运行时数据',
            build: '构建发布包',
            'validate-preview': '校验预览草稿',
            'generate-preview': '生成预览数据',
            'build-preview': '构建测试预览'
        }[name] || name
    );
}

function renderPublishOperation() {
    const operation = state.publishOperation;
    elements.publishOperationPanel.hidden = !operation;
    if (!operation) return;
    elements.publishOperationSummary.textContent = `${operation.label} · ${operation.ok ? '操作成功' : '操作失败'} · ${formatPublishTime(operation.time)}`;
    elements.publishOperationSteps.replaceChildren();
    operation.steps.forEach((step) => {
        const item = document.createElement('div');
        const stateLabel = document.createElement('span');
        const body = document.createElement('div');
        const title = document.createElement('strong');
        const output = document.createElement('pre');
        item.className = `publish-operation-step${step.ok ? '' : step.skipped ? ' is-skipped' : ' is-error'}`;
        stateLabel.textContent = step.skipped ? '未执行' : step.ok ? '成功' : '失败';
        title.textContent = publishStepLabel(step.name);
        output.textContent = [step.stdout, step.stderr].filter(Boolean).join('\n') || step.message || '执行完成。';
        body.append(title, output);
        item.append(stateLabel, body);
        elements.publishOperationSteps.append(item);
    });
}

async function loadPublishStatus() {
    elements.publishChangeSummary.textContent = '正在读取发布状态...';
    const result = await api('/api/archive/publish-status');
    state.publishStatus = result;
    renderPublishStatus();
    renderPublishView();
    syncTaskActionAvailability();
}

async function decideDraftChange(changeId, decision, all = false) {
    if (state.taskRunning) return;
    state.taskRunning = true;
    syncTaskActionAvailability();
    try {
        await api('/api/archive/draft-decision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changeId, decision, all })
        });
        setStatus(decision === 'kept' ? '变更已保留' : '变更已放弃', 'ok');
        await loadPublishStatus();
    } finally {
        state.taskRunning = false;
        syncTaskActionAvailability();
    }
}

async function runPublishAction(action, label) {
    if (state.taskRunning) return;
    state.taskRunning = true;
    state.publishOperation = {
        label,
        ok: false,
        time: new Date().toISOString(),
        steps: [{ name: action, ok: false, message: '正在执行...' }]
    };
    renderPublishOperation();
    syncTaskActionAvailability();
    try {
        const endpoint =
            action === 'prepare'
                ? '/api/archive/prepare-publish'
                : action === 'draft-validate'
                  ? '/api/archive/draft-validate'
                  : action === 'apply'
                    ? '/api/archive/draft-apply'
                    : action === 'saved-validate'
                      ? '/api/archive/publish-validate'
                      : `/api/archive/publish-${action}`;
        const result = await api(endpoint, { method: 'POST' });
        const steps =
            action === 'apply'
                ? [
                      { name: 'validate-draft', ...(result.validation || {}), ok: result.validation?.ok === true },
                      {
                          name: 'apply',
                          ok: result.applied === true,
                          message: result.applied
                              ? `已写入 ${(result.result?.changedFiles || []).length} 个 Json 文件。`
                              : '草稿未应用。'
                      }
                  ]
                : result.steps || [{ name: action, ...result }];
        state.publishOperation = {
            label,
            ok: result.ok,
            time: new Date().toISOString(),
            steps
        };
        if (result.ok && (action === 'apply' || action === 'prepare')) {
            state.historyLoaded = false;
            state.selectedHistoryVersion = null;
        }
        if (result.ok) setStatus(`${label}成功`, 'ok');
        else showError(`${label}失败，请查看最近操作结果`);
    } catch (error) {
        state.publishOperation = {
            label,
            ok: false,
            time: new Date().toISOString(),
            steps: [{ name: action, ok: false, message: error.message }]
        };
        showError(error, `${label}失败`);
    } finally {
        state.taskRunning = false;
        renderPublishOperation();
        await loadPublishStatus().catch((error) => showError(error, '发布状态刷新失败'));
        syncTaskActionAvailability();
    }
}

async function generateTestPreview() {
    if (state.taskRunning) return;
    const previewWindow = window.open('about:blank', '_blank');
    if (previewWindow) previewWindow.opener = null;
    let previewUrl = '';
    state.taskRunning = true;
    state.publishOperation = {
        label: '生成测试预览',
        ok: false,
        time: new Date().toISOString(),
        steps: [{ name: 'validate-preview', ok: false, message: '正在执行...' }]
    };
    renderPublishOperation();
    syncTaskActionAvailability();
    try {
        const result = await api('/api/archive/test-preview', { method: 'POST' });
        state.publishOperation = {
            label: '生成测试预览',
            ok: result.ok,
            time: new Date().toISOString(),
            steps: result.steps || []
        };
        if (!result.ok) {
            if (previewWindow) previewWindow.close();
            showError('生成测试预览失败，请查看最近操作结果');
            return;
        }
        setStatus('测试预览已生成', 'ok');
        previewUrl = result.previewUrl;
    } catch (error) {
        if (previewWindow) previewWindow.close();
        state.publishOperation = {
            label: '生成测试预览',
            ok: false,
            time: new Date().toISOString(),
            steps: [{ name: 'validate-preview', ok: false, message: error.message }]
        };
        showError(error, '生成测试预览失败');
    } finally {
        state.taskRunning = false;
        renderPublishOperation();
        await loadPublishStatus().catch((error) => showError(error, '发布状态刷新失败'));
        syncTaskActionAvailability();
        if (previewWindow && previewUrl) {
            previewWindow.location.href = `${window.location.origin}${previewUrl}`;
        }
    }
}

function setTaskOutputVisible(visible) {
    elements.taskOutputPanel.hidden = !visible;
}

function syncTaskActionAvailability() {
    elements.validateBtn.disabled = state.taskRunning;
    elements.validateDraftBtn.disabled = state.taskRunning || state.type === 'audit' || !state.document;
    elements.generateBtn.disabled = state.taskRunning;
    elements.saveBtn.disabled = state.taskRunning || state.type === 'audit' || !state.document;
    elements.refreshPublishBtn.disabled = state.taskRunning;
    const draftSummary = state.publishStatus?.draft?.summary || {};
    const hasActiveDraft = Number(draftSummary.active || 0) > 0;
    const hasPendingDraft = Number(draftSummary.pending || 0) > 0;
    const hasKeptDraft = Number(draftSummary.kept || 0) > 0;
    elements.keepAllDraftsBtn.disabled = state.taskRunning || !hasPendingDraft;
    elements.discardAllDraftsBtn.disabled = state.taskRunning || !hasActiveDraft;
    elements.preparePublishBtn.disabled = state.taskRunning || hasPendingDraft;
    elements.generateTestPreviewBtn.disabled = state.taskRunning || hasPendingDraft || !hasKeptDraft;
    elements.publishValidateBtn.disabled = state.taskRunning || hasPendingDraft || !hasKeptDraft;
    elements.publishApplyBtn.disabled = state.taskRunning || hasPendingDraft || !hasKeptDraft;
    elements.publishSavedValidateBtn.disabled = state.taskRunning || hasActiveDraft;
    elements.publishGenerateBtn.disabled = state.taskRunning || hasActiveDraft;
    elements.publishBuildBtn.disabled = state.taskRunning || hasActiveDraft;
    const currentHash = state.publishStatus?.history?.latest?.dataHash || '';
    elements.createRollbackDraftBtn.disabled =
        state.taskRunning ||
        hasActiveDraft ||
        !state.selectedHistoryVersion ||
        state.selectedHistoryVersion.dataHash === currentHash;
    for (const button of elements.publishChangeList.querySelectorAll('[data-draft-decision]')) {
        const item = button.closest('.publish-change-item');
        const alreadyKept = item?.classList.contains('is-kept') && button.dataset.draftDecision === 'kept';
        button.disabled = state.taskRunning || alreadyKept;
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
    state.figureSection = 'basic';
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
    renderFigureSectionNav();
    renderAdvancedJsonFiles();
    renderFigureForm();
    elements.figureIdentityDetails.open = true;
    elements.figureUsage.innerHTML = '';
    state.figureAssets = [];
    state.existingImageAssets = [];
    state.existingImageAssetsRevision = '';
    state.figureUsage = null;
    renderFigureAssets().catch(showError);
    renderFigureEvents();
    elements.figureId.focus();
    setStatus('已创建人物草稿，尚未保存', '');
}

elements.entityList.addEventListener('click', async (event) => {
    const eventLink = event.target.closest('[data-open-event]');
    if (eventLink) {
        await openAdminEvent(eventLink.dataset.openEvent, eventLink.dataset.openFile || 'event.json').catch(showError);
        return;
    }
    const storylineCard = event.target.closest('[data-storyline-id]');
    if (storylineCard && state.type === 'storylines') {
        await flushDraftSave().catch(showError);
        selectEntity(storylineCard.dataset.storylineId);
        await loadEntity().catch(showError);
        return;
    }
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    await flushDraftSave().catch(showError);
    selectEntity(button.dataset.id);
    await loadEntity().catch(showError);
});
elements.storylineTimeline.addEventListener('click', async (event) => {
    const removeButton = event.target.closest('[data-remove-storyline-event]');
    if (removeButton) {
        removeStorylineEvent(removeButton.dataset.removeStorylineEvent);
        return;
    }
    const eventLink = event.target.closest('[data-open-event]');
    if (!eventLink) return;
    await openAdminEvent(eventLink.dataset.openEvent, eventLink.dataset.openFile || 'event.json').catch(showError);
});
elements.addStorylineEventBtn.addEventListener('click', addStorylineEvent);
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

elements.entityTypeNav.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-entity-type]');
    if (!button || button.dataset.entityType === state.type) return;
    await flushDraftSave().catch(showError);
    state.type = button.dataset.entityType;
    elements.entityType.value = state.type;
    elements.entitySearch.value = '';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    refresh().catch(showError);
});
elements.entitySearch.addEventListener('input', renderEntities);
elements.fileSelect.addEventListener('change', () => {
    flushDraftSave()
        .then(() => {
            state.file = elements.fileSelect.value;
            return loadEntity();
        })
        .catch(showError);
});
elements.eventSectionNav.addEventListener('click', (event) => {
    const sectionButton = event.target.closest('[data-event-section]');
    if (!sectionButton) return;
    activateEventSection(sectionButton.dataset.eventSection).catch(showError);
});
elements.figureSectionNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-figure-section]');
    if (!button) return;
    activateFigureSection(button.dataset.figureSection);
});
elements.structuredFieldHint.addEventListener('click', () => {
    openAdvancedJsonFile(elements.structuredFieldHint.dataset.openAdvancedFile).catch(showError);
});
elements.relationFileLink.addEventListener('click', () => {
    openAdvancedJsonFile(elements.relationFileLink.dataset.openAdvancedFile).catch(showError);
});
elements.advancedJsonFiles.addEventListener('click', (event) => {
    const summary = event.target.closest('summary');
    const item = summary && summary.closest('[data-advanced-json-file]');
    if (!item) return;
    event.preventDefault();
    if (item.open) {
        item.open = false;
        return;
    }
    if (item.dataset.advancedJsonFile === state.file) {
        for (const candidate of elements.advancedJsonFiles.querySelectorAll('[data-advanced-json-file]')) {
            candidate.open = candidate === item;
        }
        return;
    }
    openAdvancedJsonFile(item.dataset.advancedJsonFile).catch(showError);
});
document.getElementById('refreshBtn').addEventListener('click', () =>
    flushDraftSave()
        .then(() => refresh())
        .catch(showError)
);
elements.loadBtn.addEventListener('click', () =>
    flushDraftSave()
        .then(() => loadEntity())
        .catch(showError)
);
elements.saveBtn.addEventListener('click', () => saveEntity().catch(showError));
elements.validateDraftBtn.addEventListener('click', () => validateEntity().catch(showError));
elements.validateBtn.addEventListener('click', () => runTask('validate').catch(showError));
elements.generateBtn.addEventListener('click', () => {
    if (
        window.confirm(
            '生成只读取已经保存的 Archive，并更新 milestones-data.js 与 milestones-data-default.js；未保存的编辑不会包含。继续吗？'
        )
    ) {
        runTask('generate').catch(showError);
    }
});
elements.refreshPublishBtn.addEventListener('click', () =>
    loadPublishStatus().catch((error) => showError(error, '发布状态刷新失败'))
);
elements.publishChangesTab.addEventListener('click', () => setPublishView('changes'));
elements.publishHistoryTab.addEventListener('click', () => setPublishView('history'));
elements.refreshHistoryBtn.addEventListener('click', () =>
    loadPublishHistory(true).catch((error) => showError(error, '历史版本刷新失败'))
);
elements.historyVersionList.addEventListener('click', (event) => {
    const item = event.target.closest('[data-history-version-id]');
    if (!item) return;
    selectHistoryVersion(item.dataset.historyVersionId).catch((error) => showError(error, '版本详情加载失败'));
});
elements.createRollbackDraftBtn.addEventListener('click', () =>
    createRollbackDraft().catch((error) => showError(error, '创建回滚草稿失败'))
);
elements.publishChangeList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-draft-decision]');
    const item = event.target.closest('[data-change-id]');
    if (!button || !item) return;
    decideDraftChange(item.dataset.changeId, button.dataset.draftDecision).catch(showError);
});
elements.keepAllDraftsBtn.addEventListener('click', () => decideDraftChange('', 'kept', true).catch(showError));
elements.discardAllDraftsBtn.addEventListener('click', () => {
    if (window.confirm('放弃全部 Admin 草稿变更？正式 Json 不会被修改。')) {
        decideDraftChange('', 'discarded', true).catch(showError);
    }
});
elements.publishValidateBtn.addEventListener('click', () => runPublishAction('draft-validate', '校验保留变更'));
elements.publishApplyBtn.addEventListener('click', () => {
    if (window.confirm('将所有已保留变更事务化写入正式 Json，并移动暂存图片。继续吗？')) {
        runPublishAction('apply', '应用到 Json');
    }
});
elements.publishSavedValidateBtn.addEventListener('click', () => runPublishAction('saved-validate', '生效前先校验'));
elements.publishGenerateBtn.addEventListener('click', () => {
    if (window.confirm('生成运行时数据会读取当前正式 Json 并更新展示页数据文件。继续吗？')) {
        runPublishAction('generate', '生成运行时数据');
    }
});
elements.publishBuildBtn.addEventListener('click', () => runPublishAction('build', '构建发布包'));
elements.generateTestPreviewBtn.addEventListener('click', () => generateTestPreview());
elements.preparePublishBtn.addEventListener('click', () => {
    if (window.confirm('将依次校验并应用已保留变更，再校验正式 Json、生成运行时数据和构建发布包。继续吗？')) {
        runPublishAction('prepare', '准备发布');
    }
});
elements.closeTaskOutputBtn.addEventListener('click', () => {
    setTaskOutputVisible(false);
});
elements.newFigureBtn.addEventListener('click', createFigure);
elements.addFigureProfileSourceBtn.addEventListener('click', () => {
    if (state.type !== 'figures' || !state.document) return;
    state.document = collectFigureForm();
    state.document.profileSources.push({
        type: 'profile',
        label: { en: '', zh: '' },
        url: ''
    });
    renderFigureProfileSources();
    syncEditor();
    const items = elements.figureProfileSourcesList.querySelectorAll('[data-profile-source-index]');
    const lastItem = items[items.length - 1];
    focusNewEntry(lastItem, '[data-profile-source-field="label.zh"]');
    setStatus('已新增资料来源，尚未保存', '');
});
elements.figureProfileSourcesList.addEventListener('change', (event) => {
    if (!event.target.closest('[data-profile-source-field]')) return;
    updateFigureProfileSourcesFromEditor();
});
elements.figureProfileSourcesList.addEventListener('click', (event) => {
    const action = event.target.closest('[data-profile-source-action]');
    if (!action) return;
    handleFigureProfileSourceAction(action);
});

for (const id of figureFieldIds) {
    elements[id].addEventListener('change', () => {
        if (state.type !== 'figures' || !state.document) return;
        try {
            state.document = collectFigureForm();
            state.entityId = state.document.id;
            syncEditor();
            renderAvatarPreview();
            elements.figureReviewBadge.textContent = reviewStatusLabel(state.document.review.status);
            elements.figureReviewBadge.className = `badge ${state.document.review.status}`;
            setStatus('已修改人物资料，尚未保存', '');
        } catch (error) {
            showError(error);
        }
    });
}
elements.avatarPath.addEventListener('input', renderAvatarPreview);
elements.avatarStyle.addEventListener('input', renderAvatarPreview);
elements.openDefaultAvatarAssetBtn.addEventListener('click', openDefaultAvatarAsset);
elements.replaceDefaultAvatarBtn.addEventListener('click', replaceDefaultAvatar);
elements.removeDefaultAvatarBtn.addEventListener('click', removeDefaultAvatar);
elements.openExistingFigureImageBtn.addEventListener('click', () => openExistingFigureImage().catch(showError));
elements.closeExistingFigureImageBtn.addEventListener('click', closeExistingFigureImage);
elements.cancelExistingFigureImageBtn.addEventListener('click', closeExistingFigureImage);
elements.existingImageEvent.addEventListener('change', () => loadExistingImageAssets().catch(showError));
elements.existingImageAsset.addEventListener('change', updateExistingImagePreview);
elements.linkExistingFigureImageBtn.addEventListener('click', () => linkExistingFigureImage().catch(showError));
elements.openFigureImageUploadBtn.addEventListener('click', () => openFigureImageUpload().catch(showError));
elements.closeFigureImageUploadBtn.addEventListener('click', closeFigureImageUpload);
elements.cancelFigureImageUploadBtn.addEventListener('click', closeFigureImageUpload);
elements.imageImportEvent.addEventListener('change', () => loadImageImportSources().catch(showError));
elements.imageImportSourceId.addEventListener('change', syncImageSourceMetadata);
elements.imageImportFile.addEventListener('change', async () => {
    const file = elements.imageImportFile.files[0];
    if (!file) {
        if (!elements.imageImportUrl.value.trim()) showImageImportPreview('');
        return;
    }
    const previousSyncedUrl = elements.imageImportUrl.dataset.syncedSourceUrl || '';
    if (elements.imageImportSourceUrl.value.trim() === previousSyncedUrl) elements.imageImportSourceUrl.value = '';
    elements.imageImportUrl.value = '';
    elements.imageImportUrl.dataset.syncedSourceUrl = '';
    try {
        showImageImportPreview(await readFileAsDataUrl(file));
    } catch (error) {
        showError(error);
    }
});
elements.imageImportUrl.addEventListener('input', syncRemoteFigureImage);
elements.imageImportBtn.addEventListener('click', () => importFigureImage().catch(showError));
elements.openEventDisplayBtn.addEventListener('click', () => {
    const target = selectedEventPresentationTarget();
    if (target) window.open(buildPresentationEventUrl(target), '_blank', 'noopener');
});
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
            .catch((error) => showError(error, '复制失败'));
    }
    if (action === 'edit') {
        const group = groupFigureAssets().find((candidate) => candidate.path === card.dataset.assetPath);
        const selectedIndex = Number(card.querySelector('[data-asset-edit-target]')?.value || 0);
        const selectedAsset = (group && group.associations[selectedIndex]) || asset;
        openFigureAssetEditor(selectedAsset).catch(showError);
    }
    if (action === 'set-default') {
        setFigureDefaultAvatar(asset).catch((error) => showError(error, '设置默认头像失败'));
    }
    if (action === 'unlink') {
        const group = groupFigureAssets().find((candidate) => candidate.path === card.dataset.assetPath);
        if (group) unlinkFigureAssetGroup(group).catch(showError);
    }
});
elements.figureEventList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-event-action]');
    const row = event.target.closest('.figure-event-row');
    if (!button || !row) return;
    if (button.dataset.eventAction === 'open-admin') {
        openAdminEvent(row.dataset.eventId).catch(showError);
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
elements.editor.addEventListener('change', () => {
    if (state.type === 'audit') return;
    try {
        state.document = JSON.parse(elements.editor.value);
        if (state.type === 'figures') renderFigureForm();
        if (state.type === 'events' && state.eventSection === 'people') renderRelations().catch(showError);
        if (state.type === 'storylines') {
            syncSelectedStorylineSummary();
            renderEntities();
            renderStorylineOverview();
        }
        renderStructuredEditor();
        setStatus('JSON 已同步到结构化编辑器，尚未保存', '');
    } catch (error) {
        showError(error, 'JSON 无效');
    }
});

elements.structuredEditor.addEventListener('input', (event) => {
    const target = event.target.closest('[data-structured-field]');
    if (!target) return;
    if (target.closest('[data-collection-index]')) updateCollectionField(target);
    else updateStructuredField(target);
});
elements.structuredEditor.addEventListener('change', (event) => {
    const assetSourceSelect = event.target.closest('[data-asset-source-select]');
    if (assetSourceSelect) {
        syncAssetSourceAddButton(assetSourceSelect);
        return;
    }
    const target = event.target.closest('[data-structured-field]');
    if (target) {
        if (target.closest('[data-collection-index]')) updateCollectionField(target);
        else updateStructuredField(target);
        if (target.closest('.presentation-reference-field')) renderStructuredEditor();
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
    const assetImageAction = event.target.closest('[data-asset-image-action]');
    if (assetImageAction) {
        importAssetImage(assetImageAction).catch(showError);
        return;
    }
    const assetSourceAction = event.target.closest('[data-asset-source-action]');
    if (assetSourceAction) {
        handleAssetSourceAction(assetSourceAction);
        return;
    }
    const referenceAction = event.target.closest('[data-presentation-reference-action]');
    if (referenceAction) {
        handlePresentationReferenceAction(referenceAction);
        return;
    }
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
elements.structuredAddBtn.addEventListener('click', () => {
    handleCollectionAction(elements.structuredAddBtn);
});

elements.addFigureBtn.addEventListener('click', () => {
    const figureId = elements.addFigureSelect.value;
    if (!figureId) return;
    const figure = relationFigure(figureId);
    const relations = currentRelations();
    const newIndex = relations.length;
    relations.push({
        figureId,
        role: { en: '', zh: '' },
        ...(figure.defaultAvatar ? { useDefaultAvatar: true } : {})
    });
    syncEditor();
    renderRelations()
        .then(() => {
            focusNewEntry(elements.relationRows.querySelector(`[data-index="${newIndex}"]`), '[data-field="role.zh"]');
            setStatus('已添加人物关系，尚未保存', '');
        })
        .catch(showError);
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
            openFigureDetails(relation.figureId).catch(showError);
        }
        return;
    }
    if (button.dataset.action === 'remove') relations.splice(index, 1);
    if (button.dataset.action === 'up' && index > 0)
        [relations[index - 1], relations[index]] = [relations[index], relations[index - 1]];
    if (button.dataset.action === 'down' && index < relations.length - 1)
        [relations[index], relations[index + 1]] = [relations[index + 1], relations[index]];
    syncEditor();
    renderRelations()
        .then(() => setStatus('已修改人物关系，尚未保存', ''))
        .catch(showError);
});

window.addEventListener('resize', () => {
    updateStickyOffsets();
    scheduleImageAssetLayout();
});
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
            .catch(showError);
    }
    if (eventButton) {
        state.type = 'events';
        elements.entityType.value = 'events';
        refresh()
            .then(() => {
                selectEntity(eventButton.dataset.openEvent);
                return loadEntity();
            })
            .catch(showError);
    }
});

loadFigureOptions().then(refresh).catch(showError);
