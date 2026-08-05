'use strict';

const state = {
    type: 'events',
    entities: [],
    entityId: '',
    file: '',
    document: null,
    revision: '',
    creatingFigure: false,
    figureOptions: [],
    eventOptions: [],
    figureListRevision: '',
    mergePreview: null,
    taskRunning: false
};

const elements = Object.fromEntries(
    [
        'entityType',
        'entityList',
        'entitySearch',
        'entityCount',
        'newFigureBtn',
        'fileSelect',
        'editor',
        'status',
        'currentEntity',
        'validationOutput',
        'figurePanel',
        'relationPanel',
        'auditPanel',
        'jsonPanel',
        'figureUsage',
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
        'imageImportBtn'
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

function isRelationshipFile() {
    return state.type === 'events' && (state.file === 'event.json' || state.file.startsWith('variants/'));
}

function isVariantFile() {
    return state.type === 'events' && state.file.startsWith('variants/');
}

function updatePanelVisibility() {
    elements.figurePanel.hidden = state.type !== 'figures' || !state.document;
    elements.relationPanel.hidden = !isRelationshipFile() || !state.document;
    elements.auditPanel.hidden = state.type !== 'audit';
    elements.jsonPanel.hidden = state.type === 'audit' || !state.document;
    elements.fileSelect.hidden = state.type !== 'events';
    elements.newFigureBtn.hidden = state.type !== 'figures';
    elements.loadBtn.hidden = state.type === 'audit';
    elements.saveBtn.hidden = state.type === 'audit';
    elements.saveValidateBtn.hidden = state.type === 'audit';
    elements.emptyState.hidden = state.type === 'audit' || Boolean(state.document);
    elements.loadBtn.disabled = state.type !== 'audit' && !state.entityId;
    elements.saveBtn.disabled = state.type !== 'audit' && !state.document;
    elements.saveValidateBtn.disabled = state.type !== 'audit' && !state.document;
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
    return id.toLowerCase().includes(query);
}

function renderEntities() {
    const query = elements.entitySearch.value.trim().toLowerCase();
    const visible = state.entities.filter((entity) => entityMatchesSearch(entity, query));
    elements.entityCount.textContent = String(visible.length);
    elements.entityList.innerHTML = visible
        .map((entity) => {
            const id = typeof entity === 'string' ? entity : entity.id;
            let title = id;
            let detail = state.type === 'storylines' ? 'storyline JSON' : '';
            let preview = '';
            if (state.type === 'events') detail = `${entity.files.length} files · ${entity.variants.length} variants`;
            if (state.type === 'figures') {
                title = `${localize(entity.name, 'zh') || localize(entity.name, 'en')} · ${id}`;
                detail = `${entity.type} · ${entity.reviewStatus || 'draft'} · ${entity.eventCount} events · ${entity.assetCount} assets`;
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
            return `<button class="entity${id === state.entityId ? ' active' : ''}" data-id="${escapeHtml(id)}">${thumb}<span class="entity-copy"><span class="entity-name">${escapeHtml(title)}</span><span class="entity-meta">${escapeHtml(detail)}</span></span><span class="entity-chevron">›</span></button>`;
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
    elements.currentEntity.textContent = '尚未选择实体';
    elements.editor.value = '';
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
}

function selectEntity(id) {
    state.entityId = id;
    state.document = null;
    state.revision = '';
    state.creatingFigure = false;
    if (state.type === 'events') {
        const entity = state.entities.find((item) => item.id === id);
        const files = entity ? entity.files : [];
        elements.fileSelect.innerHTML = files
            .map((file) => `<option value="${escapeHtml(file)}">${escapeHtml(file)}</option>`)
            .join('');
        state.file = files.includes('event.json') ? 'event.json' : files[0] || '';
        elements.fileSelect.value = state.file;
    } else {
        state.file = '';
    }
    renderEntities();
}

function syncEditor() {
    elements.editor.value = state.document ? JSON.stringify(state.document, null, 2) : '';
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
    if (state.type === 'figures') {
        renderFigureForm();
        await renderFigureUsage();
        await renderAdvancedFigureTools();
    }
    if (isRelationshipFile()) await renderRelations();
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
        elements.figureUsage.innerHTML = '';
        return;
    }
    const usage = await api(`/api/archive/figure-usage?figureId=${encodeURIComponent(state.entityId)}`);
    const cards = [
        ['事件', usage.events.length],
        ['Canonical 关系', usage.eventRelations.length],
        ['Variant 关系', usage.variantRelations.length],
        ['人物资产', usage.assets.length]
    ];
    const details = [...usage.eventRelations, ...usage.variantRelations, ...usage.assets]
        .map(
            (entry) =>
                `<li>${escapeHtml(entry.kind)} · ${escapeHtml(entry.eventId)}${entry.storylineId ? ` / ${escapeHtml(entry.storylineId)}` : ''}${entry.assetId ? ` · ${escapeHtml(entry.assetId)}` : ''}</li>`
        )
        .join('');
    elements.figureUsage.innerHTML = `${cards
        .map(([label, value]) => `<div class="usage-card"><strong>${value}</strong>${escapeHtml(label)}</div>`)
        .join(
            ''
        )}<div class="usage-card span-2"><strong>引用明细</strong><ul>${details || '<li>尚未被事件或资产引用</li>'}</ul></div>`;
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
                <div><strong>${escapeHtml(localize(figure.name, 'zh') || localize(figure.name, 'en'))}</strong><div class="muted">${escapeHtml(relation.figureId)} · ${escapeHtml(figure.type)}</div></div>
                <div class="relation-actions"><button data-action="up" title="上移">↑</button><button data-action="down" title="下移">↓</button><button data-action="remove">移除</button></div>
              </div>
              <div class="form-grid">
                <label>人物身份<select data-field="figureId">${state.figureOptions.map((option) => `<option value="${escapeHtml(option.id)}"${option.id === relation.figureId ? ' selected' : ''}>${escapeHtml(figureLabel(option))}</option>`).join('')}</select></label>
                <label class="role-field">英文角色<input data-field="role.en" value="${escapeHtml(localize(relation.role, 'en'))}"></label>
                <label class="role-field">中文角色<input data-field="role.zh" value="${escapeHtml(localize(relation.role, 'zh'))}"></label>
                <label class="span-2">事件头像<select data-field="avatarAssetId"><option value="">正在加载资产...</option></select></label>
                <label>avatarStyle<input data-field="avatarStyle" value="${escapeHtml(relation.avatarStyle || '')}"></label>
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
    if (field === 'figureId') {
        relation.figureId = target.value;
        delete relation.avatarAssetId;
    } else if (field === 'role.en' || field === 'role.zh') {
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
    elements.figureId.focus();
}

elements.entityList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    selectEntity(button.dataset.id);
    await loadEntity().catch((error) => setStatus(error.message, 'bad'));
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
        if (isRelationshipFile()) renderRelations().catch((error) => setStatus(error.message, 'bad'));
        setStatus('JSON 已同步到结构化编辑器', 'ok');
    } catch (error) {
        setStatus(`JSON 无效：${error.message}`, 'bad');
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
    if (field === 'figureId') renderRelations().catch((error) => setStatus(error.message, 'bad'));
});
elements.relationRows.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    const row = event.target.closest('.relation-row');
    if (!button || !row) return;
    const relations = currentRelations();
    const index = Number(row.dataset.index);
    if (button.dataset.action === 'remove') relations.splice(index, 1);
    if (button.dataset.action === 'up' && index > 0)
        [relations[index - 1], relations[index]] = [relations[index], relations[index - 1]];
    if (button.dataset.action === 'down' && index < relations.length - 1)
        [relations[index], relations[index + 1]] = [relations[index + 1], relations[index]];
    syncEditor();
    renderRelations().catch((error) => setStatus(error.message, 'bad'));
});

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
