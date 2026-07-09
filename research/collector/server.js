#!/usr/bin/env node

const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const config = require('./config.js');

const ISSUE_LABELS = {
    missingBilingualTitle: '标题缺少中英双语',
    missingBilingualDescription: '描述缺少中英双语',
    missingLocation: '地点信息不完整',
    noFigures: '缺少人物信息',
    fewSources: '来源少于 3 条',
    noPrimarySource: '缺少 primary / paper / DOI 来源',
    noCurrentAssets: '正式事件图片为空',
    missingLocalAsset: '正式图片本地文件缺失',
    assetMissingSource: '正式图片缺少来源页',
    assetMissingRights: '正式图片缺少授权/用途说明',
    noDownloadedImages: '研究候选图为空',
    fetchFailed: '存在抓取失败来源',
    imageDownloadProblem: '存在候选图下载问题',
    pendingImageReview: '候选图仍需人工授权审核'
};

function getArg(name, fallback) {
    const prefix = `${name}=`;
    const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
    return match ? match.slice(prefix.length) : fallback;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function readJson(filePath, fallback) {
    try {
        return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (_error) {
        return fallback;
    }
}

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function localized(value, lang) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || '';
}

function hasBilingual(value) {
    return Boolean(localized(value, 'en') && localized(value, 'zh'));
}

function displayText(value, lang = 'zh') {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        return value[lang] || value.zh || value.en || value.label || value.title || '';
    }
    return String(value);
}

function countBy(items, keyFn) {
    const counts = {};
    for (const item of items) {
        const key = keyFn(item) || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
}

function addIssue(issues, code, severity, detail) {
    issues.push({
        code,
        label: ISSUE_LABELS[code] || code,
        severity,
        detail
    });
}

function analyzeEvent(event) {
    const issues = [];
    const assets = toArray(event.summary.currentAssets);
    const sourceList = toArray(event.sources.sources);
    const fetchResults = toArray(event.sources.fetchResults);
    const figures = toArray(event.people.figures);
    const downloadedImages = toArray(event.imageManifest.images);

    if (!hasBilingual(event.summary.title)) {
        addIssue(issues, 'missingBilingualTitle', 'high', 'summary.title.en / summary.title.zh');
    }
    if (!hasBilingual(event.summary.description)) {
        addIssue(issues, 'missingBilingualDescription', 'high', 'summary.description.en / summary.description.zh');
    }
    if (!hasBilingual(event.summary.location && event.summary.location.name)) {
        addIssue(issues, 'missingLocation', 'medium', 'summary.location.name');
    }
    if (!figures.length) {
        addIssue(issues, 'noFigures', 'medium', 'people.json');
    }
    if (sourceList.length < 3) {
        addIssue(issues, 'fewSources', 'high', `${sourceList.length} source(s)`);
    }
    if (
        !sourceList.some((source) =>
            /(primary|paper|doi|publication)/i.test(`${source.type || ''} ${source.label || ''}`)
        )
    ) {
        addIssue(issues, 'noPrimarySource', 'high', 'sources.json');
    }
    if (!assets.length) {
        addIssue(issues, 'noCurrentAssets', 'high', 'summary.currentAssets');
    }

    const missingLocalAssets = assets.filter((asset) => !asset.path.startsWith('http') && !asset.existsLocally);
    if (missingLocalAssets.length) {
        addIssue(issues, 'missingLocalAsset', 'high', `${missingLocalAssets.length} asset(s)`);
    }

    const assetsMissingSource = assets.filter((asset) => !asset.sourceUrl);
    if (assetsMissingSource.length) {
        addIssue(issues, 'assetMissingSource', 'medium', `${assetsMissingSource.length} asset(s)`);
    }

    const assetsMissingRights = assets.filter(
        (asset) =>
            !localized(asset.license, 'en') ||
            !localized(asset.license, 'zh') ||
            !localized(asset.usage, 'en') ||
            !localized(asset.usage, 'zh')
    );
    if (assetsMissingRights.length) {
        addIssue(issues, 'assetMissingRights', 'medium', `${assetsMissingRights.length} asset(s)`);
    }

    if (!downloadedImages.length) {
        addIssue(issues, 'noDownloadedImages', 'low', 'images/manifest.json');
    }

    const failedFetches = fetchResults.filter((result) => result.ok === false);
    if (failedFetches.length) {
        addIssue(issues, 'fetchFailed', 'medium', `${failedFetches.length} page(s)`);
    }

    const imageProblems = downloadedImages.filter((image) =>
        /failed|error|not-direct|no-image-url/i.test(image.status || '')
    );
    if (imageProblems.length) {
        addIssue(issues, 'imageDownloadProblem', 'medium', `${imageProblems.length} image(s)`);
    }

    const pendingImageReview = downloadedImages.filter((image) =>
        /review-required|candidate/i.test(image.status || '')
    );
    if (pendingImageReview.length) {
        addIssue(issues, 'pendingImageReview', 'low', `${pendingImageReview.length} image(s)`);
    }

    const severityRank = { high: 3, medium: 2, low: 1 };
    const score = issues.reduce((total, issue) => total + severityRank[issue.severity], 0);
    const status = issues.some((issue) => issue.severity === 'high')
        ? 'needs-facts'
        : issues.some((issue) => issue.severity === 'medium')
          ? 'needs-review'
          : issues.length
            ? 'rights-review'
            : 'ready';

    return {
        status,
        score,
        issues,
        counts: {
            assets: assets.length,
            downloadedImages: downloadedImages.length,
            figures: figures.length,
            sources: sourceList.length,
            fetchResults: fetchResults.length
        },
        imageStatusCounts: countBy(downloadedImages, (image) => image.status),
        fetchStatusCounts: countBy(fetchResults, (result) => (result.ok ? 'ok' : 'failed'))
    };
}

async function listEvents() {
    const entries = await fs.readdir(config.eventAssetsDir, { withFileTypes: true });
    const eventDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    const events = [];
    for (const eventKey of eventDirs) {
        const eventDir = path.join(config.eventAssetsDir, eventKey);
        const summary = await readJson(path.join(eventDir, 'summary.json'), {});
        const sources = await readJson(path.join(eventDir, 'sources.json'), { sources: [], searchCandidates: [] });
        const people = await readJson(path.join(eventDir, 'people.json'), { figures: [] });
        const media = await readJson(path.join(eventDir, 'media.json'), {
            people: [],
            eventImages: [],
            publications: [],
            existingAssetAudit: []
        });
        const imageManifest = await readJson(path.join(eventDir, 'images', 'manifest.json'), { images: [] });
        const event = { eventKey, summary, sources, people, media, imageManifest };
        event.analysis = analyzeEvent(event);
        event.changeSet = buildChangeSet(event);
        events.push(event);
    }
    return events;
}

function buildSummary(events) {
    const allIssues = events.flatMap((event) =>
        event.analysis.issues.map((issue) => ({ ...issue, eventKey: event.eventKey }))
    );
    return {
        generatedAt: new Date().toISOString(),
        totalEvents: events.length,
        statuses: countBy(events, (event) => event.analysis.status),
        issues: countBy(allIssues, (issue) => issue.code),
        severities: countBy(allIssues, (issue) => issue.severity),
        totals: {
            sources: events.reduce((total, event) => total + event.analysis.counts.sources, 0),
            currentAssets: events.reduce((total, event) => total + event.analysis.counts.assets, 0),
            downloadedImages: events.reduce((total, event) => total + event.analysis.counts.downloadedImages, 0),
            figures: events.reduce((total, event) => total + event.analysis.counts.figures, 0),
            candidateLeads: events.reduce((total, event) => total + event.changeSet.counts.candidateLeads, 0),
            candidateSources: events.reduce((total, event) => total + event.changeSet.counts.candidateSources, 0),
            missingSourceAssets: events.reduce((total, event) => total + event.changeSet.counts.missingSourceAssets, 0)
        }
    };
}

function filterEvents(events, searchParams) {
    const status = searchParams.get('status');
    const issue = searchParams.get('issue');
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    return events
        .filter((event) => !status || event.analysis.status === status)
        .filter((event) => !issue || event.analysis.issues.some((item) => item.code === issue))
        .filter((event) => {
            if (!query) return true;
            const text = [
                event.eventKey,
                localized(event.summary.title, 'en'),
                localized(event.summary.title, 'zh'),
                localized(event.summary.description, 'en'),
                localized(event.summary.description, 'zh')
            ]
                .join(' ')
                .toLowerCase();
            return text.includes(query);
        })
        .sort((a, b) => b.analysis.score - a.analysis.score || a.eventKey.localeCompare(b.eventKey));
}

function statusLabel(status) {
    return (
        {
            'needs-facts': '事实/来源优先',
            'needs-review': '需要校正',
            'rights-review': '授权待审',
            ready: '基本完整'
        }[status] || status
    );
}

function issueClass(severity) {
    return `issue issue-${severity}`;
}

function sourceKind(source) {
    const text = `${source.type || ''} ${source.label || ''} ${source.url || ''}`.toLowerCase();
    if (/(paper|primary|publication|doi|arxiv|scholar|proceedings|journal|manual|report)/.test(text)) {
        return 'paper';
    }
    if (/(person|portrait|bio|biography|profile|award|obituary)/.test(text)) {
        return 'person';
    }
    if (/(architecture|diagram|explainer|visual|image|photo|commons|loc\.gov|museum|library)/.test(text)) {
        return 'visual';
    }
    if (/(project|toolkit|github|code|implementation|release|demo|dataset|application)/.test(text)) {
        return 'application';
    }
    return 'source';
}

function assetKind(asset) {
    const text =
        `${asset.path || ''} ${localized(asset.caption, 'en')} ${localized(asset.caption, 'zh')} ${localized(asset.subcaption, 'en')} ${localized(asset.subcaption, 'zh')}`.toLowerCase();
    if (/(portrait|people|person|肖像|人物)/.test(text)) return 'person';
    if (/(architecture|diagram|explainer|visual|svg|流程|架构|结构|示意)/.test(text)) return 'architecture';
    if (/(paper|proposal|publication|document|manual|论文|文档|提案)/.test(text)) return 'paper';
    return 'image';
}

function isSearchOnly(url) {
    return /(google\.com\/search|scholar\.google\.com|Special:MediaSearch|\/pictures\/search)/i.test(url || '');
}

function hasSourceInfo(asset) {
    return Boolean(
        asset.sourceUrl &&
        localized(asset.license, 'en') &&
        localized(asset.license, 'zh') &&
        localized(asset.usage, 'en') &&
        localized(asset.usage, 'zh')
    );
}

function buildChangeSet(event) {
    const assets = toArray(event.summary.currentAssets);
    const sources = toArray(event.sources.sources);
    const figures = toArray(event.people.figures);
    const mediaPeople = toArray(event.media.people);
    const eventImages = toArray(event.media.eventImages);
    const publications = toArray(event.media.publications);
    const downloadedImages = toArray(event.imageManifest.images);
    const existingAssetSources = new Set(assets.map((asset) => asset.sourceUrl).filter(Boolean));
    const existingImageCopies = downloadedImages.filter(
        (image) => image.status === 'existing-event-asset-review-required'
    );
    const candidateImages = downloadedImages.filter((image) => image.status !== 'existing-event-asset-review-required');
    const sourceItems = sources.map((source) => ({
        ...source,
        kind: sourceKind(source),
        isExisting: existingAssetSources.has(source.url) || !source.status,
        isCandidate: source.status === 'media-lead' || isSearchOnly(source.url)
    }));
    const candidateSources = sourceItems.filter((source) => source.isCandidate);
    const verifiedSources = sourceItems.filter((source) => !source.isCandidate);
    const evidenceSources = verifiedSources.filter((source) => source.kind !== 'visual' && source.type !== 'video');
    const paperSources = sourceItems.filter((source) => source.kind === 'paper');
    const applicationSources = sourceItems.filter((source) => source.kind === 'application');
    const visualSources = sourceItems.filter((source) => source.kind === 'visual');
    const missingSourceAssets = assets.filter((asset) => !asset.sourceUrl || !hasSourceInfo(asset));
    const newLeads = [
        ...mediaPeople.flatMap((person) =>
            toArray(person.searches).map((lead) => ({
                ...lead,
                group: 'person',
                owner: person.name
            }))
        ),
        ...eventImages.map((lead) => ({ ...lead, group: 'visual' })),
        ...publications.map((lead) => ({ ...lead, group: 'paper' }))
    ];

    return {
        existing: {
            text: Boolean(localized(event.summary.description, 'zh') || localized(event.summary.description, 'en')),
            figures,
            assets: assets.map((asset) => ({ ...asset, kind: assetKind(asset), sourceReady: hasSourceInfo(asset) })),
            sources: verifiedSources,
            imageCopies: existingImageCopies
        },
        candidates: {
            sources: candidateSources,
            images: candidateImages,
            leads: newLeads,
            people: newLeads.filter((lead) => lead.group === 'person'),
            papers: newLeads.filter((lead) => lead.group === 'paper'),
            visuals: newLeads.filter((lead) => lead.group === 'visual')
        },
        categories: {
            text: evidenceSources,
            people: [
                ...figures.map((figure) => ({
                    kind: 'existing-figure',
                    label: localized(figure.name, 'zh') || localized(figure.name, 'en'),
                    detail: localized(figure.role, 'zh') || localized(figure.role, 'en')
                })),
                ...newLeads.filter((lead) => lead.group === 'person')
            ],
            papers: paperSources,
            architecture: [
                ...assets.filter((asset) => assetKind(asset) === 'architecture'),
                ...visualSources,
                ...newLeads.filter((lead) => lead.group === 'visual')
            ],
            applications: applicationSources,
            images: [...assets, ...downloadedImages]
        },
        counts: {
            existingAssets: assets.length,
            existingFigures: figures.length,
            existingSources: verifiedSources.length,
            candidateLeads: newLeads.length,
            candidateSources: candidateSources.length,
            candidateImages: candidateImages.length,
            missingSourceAssets: missingSourceAssets.length
        },
        missing: {
            assets: missingSourceAssets
        }
    };
}

function pageShell(body) {
    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI History Event Assets</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
    body { margin: 0; background: #10141d; color: #eef4ff; }
    a { color: #7cc7ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    header { position: sticky; top: 0; background: rgba(16, 20, 29, 0.94); border-bottom: 1px solid rgba(255,255,255,0.14); padding: 18px 28px; backdrop-filter: blur(12px); }
    h1 { margin: 0; font-size: 22px; }
    main { max-width: 1180px; margin: 0 auto; padding: 24px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .card { border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; background: rgba(255,255,255,0.055); padding: 16px; }
    .card-attention { border-color: rgba(255,190,92,0.42); box-shadow: inset 0 1px rgba(255,255,255,0.08); }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 18px; }
    .toolbar a, .toolbar span { border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 8px 10px; background: rgba(255,255,255,0.055); color: #dceaff; font-size: 13px; }
    .summary { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin-bottom: 18px; }
    .metric strong { display: block; font-size: 26px; line-height: 1.1; }
    .meta { color: #9fb0c8; font-size: 13px; line-height: 1.6; }
    .pill { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 999px; background: rgba(124,199,255,0.16); color: #bfe4ff; font-size: 12px; margin: 4px 6px 4px 0; }
    .status-needs-facts { background: rgba(255,107,107,0.18); color: #ffd2d2; }
    .status-needs-review { background: rgba(255,190,92,0.18); color: #ffe1ad; }
    .status-rights-review { background: rgba(124,199,255,0.16); color: #bfe4ff; }
    .status-ready { background: rgba(104,211,145,0.16); color: #c9f7d9; }
    .issue { display: inline-flex; align-items: center; border-radius: 6px; padding: 4px 7px; margin: 3px 4px 3px 0; font-size: 12px; }
    .issue-high { background: rgba(255,107,107,0.16); color: #ffd2d2; }
    .issue-medium { background: rgba(255,190,92,0.15); color: #ffe1ad; }
    .issue-low { background: rgba(124,199,255,0.13); color: #bfe4ff; }
    .change-grid { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .change-panel { border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.14); }
    .change-panel h3 { margin: 0 0 8px; font-size: 15px; }
    .change-panel-new { border-color: rgba(124,199,255,0.34); background: rgba(124,199,255,0.06); }
    .change-panel-existing { border-color: rgba(104,211,145,0.24); }
    .change-row { border-top: 1px solid rgba(255,255,255,0.09); padding: 8px 0; }
    .change-row:first-of-type { border-top: 0; padding-top: 0; }
    .change-title { font-weight: 700; }
    .change-source { display: block; margin-top: 3px; color: #9fb0c8; font-size: 12px; overflow-wrap: anywhere; }
    .tag { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 7px; margin: 2px 4px 2px 0; font-size: 11px; border: 1px solid rgba(255,255,255,0.12); }
    .tag-existing { color: #c9f7d9; background: rgba(104,211,145,0.11); }
    .tag-new { color: #bfe4ff; background: rgba(124,199,255,0.14); }
    .tag-missing { color: #ffe1ad; background: rgba(255,190,92,0.14); }
    .source-matrix { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .source-box { border: 1px solid rgba(255,255,255,0.11); border-radius: 8px; padding: 10px; background: rgba(255,255,255,0.035); }
    .source-box strong { display: block; margin-bottom: 4px; }
    .thumbs { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); margin-top: 8px; }
    .thumb { aspect-ratio: 1; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.22); object-fit: cover; width: 100%; }
    .section { margin-top: 14px; }
    .list { margin: 8px 0 0; padding-left: 18px; }
    .list li { margin: 6px 0; }
    .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #c7d4e8; font-size: 12px; overflow-wrap: anywhere; }
    .empty { color: #7f8da5; }
    @media (max-width: 760px) { .change-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header><h1>AI History Event Assets</h1><div class="meta">候选资料审核服务 · 数据目录 research/event-assets</div></header>
  <main>${body}</main>
</body>
</html>`;
}

function renderCounts(counts, basePath, paramName) {
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(
            ([key, value]) =>
                `<a href="${basePath}?${paramName}=${encodeURIComponent(key)}">${escapeHtml(key)} · ${value}</a>`
        )
        .join('');
}

function renderSummary(summary) {
    return `<section class="summary">
  <div class="card metric"><span class="meta">事件</span><strong>${summary.totalEvents}</strong></div>
  <div class="card metric"><span class="meta">来源</span><strong>${summary.totals.sources}</strong></div>
  <div class="card metric"><span class="meta">正式图片</span><strong>${summary.totals.currentAssets}</strong></div>
  <div class="card metric"><span class="meta">候选图</span><strong>${summary.totals.downloadedImages}</strong></div>
  <div class="card metric card-attention"><span class="meta">新增候选线索</span><strong>${summary.totals.candidateLeads}</strong></div>
  <div class="card metric card-attention"><span class="meta">待补图片来源</span><strong>${summary.totals.missingSourceAssets}</strong></div>
</section>
<nav class="toolbar">
  <a href="/">全部事件</a>
  ${renderCounts(summary.statuses, '/', 'status')}
  <a href="/api/summary">API summary</a>
  <a href="/api/events">API events</a>
</nav>
<nav class="toolbar">
  <span>常见问题</span>
  ${renderCounts(summary.issues, '/', 'issue')}
</nav>`;
}

function renderChangeItem(item, options = {}) {
    const label =
        displayText(item.label) ||
        displayText(item.caption) ||
        displayText(item.name) ||
        item.path ||
        item.url ||
        '未命名条目';
    const detail =
        displayText(item.detail) ||
        displayText(item.usage) ||
        displayText(item.subcaption) ||
        displayText(item.role) ||
        item.type ||
        '';
    const url = item.url || item.sourceUrl || item.sourcePageUrl || '';
    const pathText = item.path || item.localPath || item.originalLocalPath || '';
    const tags = [
        options.existing ? '<span class="tag tag-existing">已有</span>' : '',
        options.candidate ? '<span class="tag tag-new">新增候选</span>' : '',
        options.missing ? '<span class="tag tag-missing">待补来源</span>' : '',
        item.kind ? `<span class="tag">${escapeHtml(item.kind)}</span>` : '',
        item.type ? `<span class="tag">${escapeHtml(item.type)}</span>` : ''
    ].join('');
    return `<div class="change-row">
  <div>${tags}</div>
  <div class="change-title">${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : escapeHtml(label)}</div>
  ${detail ? `<span class="change-source">${escapeHtml(detail)}</span>` : ''}
  ${pathText ? `<span class="change-source path">${escapeHtml(pathText)}</span>` : ''}
</div>`;
}

function renderChangePanel(title, items, options) {
    return `<div class="change-panel ${options.className || ''}">
  <h3>${escapeHtml(title)}</h3>
  ${
      items.length
          ? items
                .slice(0, options.limit || 6)
                .map((item) => renderChangeItem(item, options))
                .join('')
          : `<div class="empty">${escapeHtml(options.empty || '暂无')}</div>`
  }
</div>`;
}

function renderSourceBox(title, items) {
    return `<div class="source-box">
  <strong>${escapeHtml(title)}</strong>
  ${
      items.length
          ? items
                .slice(0, 4)
                .map((item) => {
                    const label =
                        displayText(item.label) || displayText(item.caption) || item.url || item.path || '未命名来源';
                    const url = item.url || item.sourceUrl || '';
                    const detail = item.type || displayText(item.usage) || displayText(item.subcaption) || '';
                    return `<div class="change-row"><span class="tag ${item.isCandidate ? 'tag-new' : 'tag-existing'}">${item.isCandidate ? '候选' : '已有'}</span><div>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : escapeHtml(label)}</div><span class="change-source">${escapeHtml(detail)}</span></div>`;
                })
                .join('')
          : '<div class="empty">暂无来源</div>'
  }
</div>`;
}

function renderChangeLedger(event) {
    const changeSet = event.changeSet;
    const existingItems = [
        ...changeSet.existing.figures.map((figure) => ({
            label: localized(figure.name, 'zh') || localized(figure.name, 'en'),
            detail: localized(figure.role, 'zh') || localized(figure.role, 'en'),
            kind: 'person'
        })),
        ...changeSet.existing.assets
    ];
    const candidateItems = [
        ...changeSet.candidates.people,
        ...changeSet.candidates.papers,
        ...changeSet.candidates.visuals,
        ...changeSet.candidates.sources
    ];
    return `<div class="section">
  <strong>变更台账</strong>
  <div class="section">
    <span class="tag tag-existing">已有内容 ${changeSet.counts.existingAssets} 图 / ${changeSet.counts.existingFigures} 人 / ${changeSet.counts.existingSources} 来源</span>
    <span class="tag tag-new">新增候选 ${changeSet.counts.candidateLeads} 线索 / ${changeSet.counts.candidateImages} 图 / ${changeSet.counts.candidateSources} 搜索来源</span>
    <span class="tag tag-missing">待补来源 ${changeSet.counts.missingSourceAssets} 图</span>
  </div>
  <div class="change-grid section">
    ${renderChangePanel('当前正式已有', existingItems, {
        existing: true,
        className: 'change-panel-existing',
        empty: '正式事件里暂无结构化内容'
    })}
    ${renderChangePanel('新增候选与可补充材料', candidateItems, {
        candidate: true,
        className: 'change-panel-new',
        empty: '暂无新增候选线索'
    })}
  </div>
  ${
      changeSet.missing.assets.length
          ? `<div class="section">${renderChangePanel('需要补齐来源/授权的正式图片', changeSet.missing.assets, {
                missing: true,
                className: 'card-attention',
                limit: 8
            })}</div>`
          : ''
  }
</div>`;
}

function renderSourceMatrix(event) {
    const changeSet = event.changeSet;
    return `<div class="section">
  <strong>按内容类型追溯来源</strong>
  <div class="source-matrix section">
    ${renderSourceBox('正文/历史描述', changeSet.categories.text)}
    ${renderSourceBox('人物', changeSet.categories.people)}
    ${renderSourceBox('Paper / 文献', changeSet.categories.papers)}
    ${renderSourceBox('架构 / 视觉', changeSet.categories.architecture)}
    ${renderSourceBox('应用 / 项目', changeSet.categories.applications)}
    ${renderSourceBox('图片 / 素材', changeSet.categories.images)}
  </div>
</div>`;
}

function renderEventCard(event) {
    const title = event.summary.title && (event.summary.title.zh || event.summary.title.en);
    const assets = event.summary.currentAssets || [];
    const sourceList = event.sources.sources || [];
    const searches = event.sources.searchCandidates || [];
    const figures = event.people.figures || [];
    const eventImages = event.media.eventImages || [];
    const publications = event.media.publications || [];
    const downloadedImages = event.imageManifest.images || [];
    const previews = downloadedImages.filter(
        (image) => image.localPath && /\.(jpe?g|png|webp|gif|svg)$/i.test(image.localPath)
    );
    return `<article class="card">
  <h2>${escapeHtml(title || event.eventKey)}</h2>
  <div class="meta">${escapeHtml(event.eventKey)} · ${escapeHtml(event.summary.year || '')}</div>
  <p>${escapeHtml(event.summary.description && event.summary.description.zh)}</p>
  <div class="section">
    <span class="pill status-${escapeHtml(event.analysis.status)}">${escapeHtml(statusLabel(event.analysis.status))}</span>
    <span class="pill">${assets.length} current assets</span>
    <span class="pill">${sourceList.length} sources</span>
    <span class="pill">${searches.length} search links</span>
    <span class="pill">${eventImages.length} image leads</span>
    <span class="pill">${downloadedImages.length} downloaded images</span>
    <span class="pill">${publications.length} publication leads</span>
    <span class="pill">${figures.length} figures</span>
  </div>
  <div class="section">
    <strong>校正提示</strong>
    ${
        event.analysis.issues.length
            ? `<div>${event.analysis.issues
                  .map(
                      (issue) =>
                          `<span class="${issueClass(issue.severity)}" title="${escapeHtml(issue.detail)}">${escapeHtml(issue.label)}</span>`
                  )
                  .join('')}</div>`
            : '<div class="empty">未发现明显结构问题</div>'
    }
  </div>
  ${renderChangeLedger(event)}
  ${renderSourceMatrix(event)}
  <div class="section">
    <strong>候选图片预览</strong>
    ${
        previews.length
            ? `<div class="thumbs">${previews
                  .slice(0, 8)
                  .map(
                      (image) =>
                          `<a href="/assets/${escapeHtml(event.eventKey)}/${escapeHtml(image.localPath)}" target="_blank" rel="noreferrer"><img class="thumb" src="/assets/${escapeHtml(event.eventKey)}/${escapeHtml(image.localPath)}" alt="${escapeHtml(image.label || image.localPath)}"></a>`
                  )
                  .join('')}</div>`
            : '<div class="empty">暂无可预览候选图片</div>'
    }
  </div>
  <div class="section meta">文件：research/event-assets/${escapeHtml(event.eventKey)}/summary.json · sources.json · media.json · people.json · notes.md · <a href="/api/events/${escapeHtml(event.eventKey)}">JSON</a></div>
</article>`;
}

async function renderIndex(searchParams) {
    const events = await listEvents();
    if (!events.length) {
        return pageShell(
            '<div class="card">还没有事件资料目录。先运行 <span class="path">npm run research:collect</span>。</div>'
        );
    }
    const summary = buildSummary(events);
    const filteredEvents = filterEvents(events, searchParams);
    const active = [
        searchParams.get('status') ? `状态：${searchParams.get('status')}` : '',
        searchParams.get('issue') ? `问题：${searchParams.get('issue')}` : '',
        searchParams.get('q') ? `搜索：${searchParams.get('q')}` : ''
    ].filter(Boolean);
    return pageShell(`${renderSummary(summary)}
${active.length ? `<div class="card meta">当前筛选：${active.map(escapeHtml).join(' · ')} · ${filteredEvents.length} 个事件</div>` : ''}
<div class="grid">${filteredEvents.map(renderEventCard).join('')}</div>`);
}

async function handleApi(response) {
    const events = await listEvents();
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ events }, null, 2));
}

async function handleSummaryApi(response) {
    const events = await listEvents();
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(buildSummary(events), null, 2));
}

async function handleEventApi(eventKey, response) {
    const events = await listEvents();
    const event = events.find((item) => item.eventKey === eventKey);
    if (!event) {
        response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'event not found', eventKey }, null, 2));
        return;
    }
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(event, null, 2));
}

function contentTypeFor(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
    if (extension === '.png') return 'image/png';
    if (extension === '.webp') return 'image/webp';
    if (extension === '.gif') return 'image/gif';
    if (extension === '.svg') return 'image/svg+xml';
    return 'application/octet-stream';
}

async function handleAsset(url, response) {
    const relativePath = decodeURIComponent(url.pathname.replace(/^\/assets\//, ''));
    const assetPath = path.resolve(config.eventAssetsDir, relativePath);
    if (!assetPath.startsWith(config.eventAssetsDir + path.sep)) {
        response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
    }
    try {
        const data = await fs.readFile(assetPath);
        response.writeHead(200, { 'content-type': contentTypeFor(assetPath) });
        response.end(data);
    } catch (_error) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
    }
}

async function handleRequest(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    try {
        if (url.pathname === '/api/events') {
            await handleApi(response);
            return;
        }
        if (url.pathname === '/api/summary') {
            await handleSummaryApi(response);
            return;
        }
        const eventApiMatch = url.pathname.match(/^\/api\/events\/([^/]+)$/);
        if (eventApiMatch) {
            await handleEventApi(decodeURIComponent(eventApiMatch[1]), response);
            return;
        }
        if (url.pathname.startsWith('/assets/')) {
            await handleAsset(url, response);
            return;
        }
        const html = await renderIndex(url.searchParams);
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(html);
    } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(error.stack || error.message);
    }
}

const host = getArg('--host', config.reviewServer.host);
const port = Number(getArg('--port', String(config.reviewServer.port)));

http.createServer(handleRequest).listen(port, host, () => {
    console.log(`Event asset review server: http://${host}:${port}/`);
});
