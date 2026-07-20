#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, '.tmp', 'archive-review', 'event-fusion-review.html');
const eventMap = require('./events.js');
const avatarRegistry = require('./figure-avatars.js');
const { FUSIONS } = require('./event-fusions.js');
const { milestones } = require('../milestones-data.js');

const LOCALE = 'zh';

function localized(value, locale = LOCALE) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[locale] || value.zh || value.en || Object.values(value).find(Boolean) || '').trim();
  }
  return String(value || '').trim();
}

function stripHtml(value) {
  return localized(value).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function figureNameCandidates(figure) {
  const value = figure && figure.name;
  if (value && typeof value === 'object') {
    return [...new Set([value.zh, value.en, ...Object.values(value)].map((item) => localized(item)).filter(Boolean))];
  }
  return [localized(value)].filter(Boolean);
}

function findAvatarEntry(figure) {
  for (const name of figureNameCandidates(figure)) {
    if (avatarRegistry[name]) return avatarRegistry[name];
  }
  return {};
}

function enrichFigure(figure, key) {
  const entry = findAvatarEntry(figure);
  const eventAvatar = key && entry.avatarByEvent ? entry.avatarByEvent[key] || '' : '';
  const eventAvatarStyle = key && entry.avatarStyleByEvent ? entry.avatarStyleByEvent[key] || '' : '';
  return {
    ...(figure || {}),
    avatar: (figure && figure.avatar) || eventAvatar || entry.avatar || '',
    avatarStyle: (figure && figure.avatarStyle) || eventAvatarStyle || entry.avatarStyle || ''
  };
}

function findMilestone(key) {
  return milestones.find((item) => item.id === `milestone-${key}`);
}

function locationText(item) {
  const location = item && item.location;
  if (!location) return '';
  const name = localized(location.name);
  const country = localized(location.country);
  return [name, country].filter(Boolean).join(' / ');
}

function getSources(item) {
  return (item && item.achievement && item.achievement.sources) || item.sources || [];
}

function getKeyConcepts(item) {
  return (item && item.achievement && item.achievement.keyConcepts) || item.keyConcepts || [];
}

function getSections(item) {
  return item && item.commentarySections ? item.commentarySections : [];
}

function getVideos(item) {
  if (!item) return [];
  const videos = [];
  if (item.commentaryVideo) {
    videos.push({ title: localized(item.title) || 'commentaryVideo', url: item.commentaryVideo });
  }
  for (const video of item.videos || []) {
    videos.push({
      title: localized(video.title) || video.id || video.url || 'video',
      url: video.url || (video.id ? `https://www.youtube.com/watch?v=${video.id}` : '')
    });
  }
  return videos.filter((video) => video.url || video.title);
}

function getImages(item) {
  if (!item) return [];
  if (item.resources && Array.isArray(item.resources.images)) return item.resources.images;
  return Array.isArray(item.images) ? item.images : [];
}

function imageMetaText(item, url) {
  const meta = item && ((item.resources && item.resources.imageMeta) || item.imageMeta) && ((item.resources && item.resources.imageMeta) || item.imageMeta)[url];
  if (!meta) return '';
  const caption = localized(meta.caption);
  const subcaption = localized(meta.subcaption);
  const source = localized(meta.sourceName) || localized(meta.source);
  return [caption, subcaption, source].filter(Boolean).join(' · ');
}

function mediaSignature(item) {
  return {
    title: item && item.title,
    year: item && item.year,
    location: item && item.location,
    description: item && item.description,
    figures: item && item.figures,
    videos: getVideos(item),
    images: getImages(item),
    sources: getSources(item),
    keyConcepts: getKeyConcepts(item),
    quoteText: item && item.quoteText,
    commentarySections: getSections(item)
  };
}

function renderAvatar(figure) {
  const name = localized(figure.name);
  if (figure.avatar) {
    return `<div class="avatar"><img src="${attr(figure.avatar)}" alt="${attr(name)}" style="${attr(figure.avatarStyle || '')}"></div>`;
  }
  return `<div class="avatar">${escapeHtml(name.slice(0, 3) || '?')}</div>`;
}

function renderFigures(item, key) {
  const figures = (item && item.figures ? item.figures : []).map((figure) => enrichFigure(figure, key));
  if (!figures.length) return '<p class="empty">无</p>';
  return `<div class="figures">${figures.map((figure) => {
    const avatarPath = figure.avatar ? `<code>${escapeHtml(figure.avatar)}</code>` : '';
    return `<div class="figure">
      ${renderAvatar(figure)}
      <div><b>${escapeHtml(localized(figure.name))}</b><small>${escapeHtml(localized(figure.role))}</small>${avatarPath}</div>
    </div>`;
  }).join('')}</div>`;
}

function renderVideos(item) {
  const videos = getVideos(item);
  if (!videos.length) return '<p class="empty">无</p>';
  return videos.map((video) => {
    const label = localized(video.title) || video.url;
    return `<a href="${attr(video.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a><code>${escapeHtml(video.url)}</code>`;
  }).join('');
}

function renderImages(item) {
  const images = getImages(item);
  if (!images.length) return '<p class="empty">无</p>';
  return `<div class="image-grid">${images.map((url) => {
    const meta = imageMetaText(item, url);
    return `<figure>
      <img src="${attr(url)}" loading="lazy" alt="">
      <figcaption><b>${escapeHtml(url)}</b>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}</figcaption>
    </figure>`;
  }).join('')}</div>`;
}

function renderSources(item) {
  const sources = getSources(item);
  if (!sources.length) return '<p class="empty">无</p>';
  return `<ol class="sources">${sources.map((source) => {
    const type = localized(source.type);
    const label = localized(source.label || source.title);
    const url = source.url || source.sourceUrl || '';
    return `<li><span>${escapeHtml(type)}</span><a href="${attr(url)}" target="_blank" rel="noreferrer">${escapeHtml(label || url)}</a><code>${escapeHtml(url)}</code></li>`;
  }).join('')}</ol>`;
}

function renderConcepts(item) {
  const concepts = getKeyConcepts(item);
  if (!concepts.length) return '<p class="empty">无</p>';
  return `<div class="concepts">${concepts.map((concept) => {
    const label = localized(concept.label || concept.title || concept.name);
    const text = localized(concept.text || concept.description);
    return `<div><b>${escapeHtml(label)}</b><p>${escapeHtml(text)}</p></div>`;
  }).join('')}</div>`;
}

function renderSections(item) {
  const sections = getSections(item);
  if (!sections.length) return '<p class="empty">无</p>';
  return `<div class="sections">${sections.map((section) => {
    const title = localized(section.title || section.label);
    const body = stripHtml(section.body || section.text || section.description);
    return `<div><b>${escapeHtml(title)}</b><p>${escapeHtml(body)}</p></div>`;
  }).join('')}</div>`;
}

function renderColumn(label, key, item, options = {}) {
  return `<article class="column ${options.final ? 'final' : ''}">
    <header><span>${escapeHtml(label)}</span><code>${escapeHtml(key || '')}</code></header>
    <div class="metrics">
      <div class="metric"><span>年份</span><strong>${escapeHtml(localized(item && item.year))}</strong></div>
      <div class="metric"><span>标题</span><strong>${escapeHtml(localized(item && item.title))}</strong></div>
      ${options.canonical ? `<div class="metric"><span>canonical</span><strong>${escapeHtml(options.canonical)}</strong></div>` : ''}
    </div>
    <h4>地点</h4><p>${escapeHtml(locationText(item) || '无')}</p>
    <h4>正文描述</h4><p class="description">${escapeHtml(stripHtml(item && item.description) || '无')}</p>
    <h4>任务/人物与头像 (${((item && item.figures) || []).length})</h4>${renderFigures(item, key)}
    <h4>视频 (${getVideos(item).length})</h4><div class="media-block">${renderVideos(item)}</div>
    <h4>图片 (${getImages(item).length})</h4>${renderImages(item)}
    <h4>资料来源 (${getSources(item).length})</h4>${renderSources(item)}
    <h4>关键概念 (${getKeyConcepts(item).length})</h4>${renderConcepts(item)}
    <h4>引言摘要</h4><p class="description">${escapeHtml(stripHtml(item && item.quoteText) || '无')}</p>
    <h4>背景解读 (${getSections(item).length})</h4>${renderSections(item)}
  </article>`;
}

function renderFusion(fusion, index) {
  const deepRaw = eventMap[fusion.deep];
  const ai100Raw = eventMap[fusion.ai100];
  const finalDeep = findMilestone(fusion.deep);
  const finalAi100 = findMilestone(fusion.ai100);
  const consistent = JSON.stringify(mediaSignature(finalDeep)) === JSON.stringify(mediaSignature(finalAi100));
  const finalItem = finalDeep || finalAi100 || {};
  return `<section class="fusion" id="${attr(fusion.canonical)}">
    <div class="fusion-head">
      <div><span class="index">${String(index + 1).padStart(2, '0')}</span><h2>${escapeHtml(localized(finalItem.title || fusion.title))}</h2><p>${escapeHtml(fusion.canonical)} · ${escapeHtml(fusion.deep)} ↔ ${escapeHtml(fusion.ai100)}</p></div>
      <span class="badge ${consistent ? 'ok' : 'bad'}">${consistent ? '入口展示一致' : '入口展示不一致'}</span>
    </div>
    <div class="columns">
      ${renderColumn('深度学习原始数据', fusion.deep, deepRaw)}
      ${renderColumn('AI100 原始数据', fusion.ai100, ai100Raw)}
      ${renderColumn('融合后最终数据', fusion.deep, finalItem, { final: true, canonical: fusion.canonical })}
    </div>
  </section>`;
}

function renderHtml() {
  const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false });
  const toc = FUSIONS.map((fusion, index) => `<a href="#${attr(fusion.canonical)}">${String(index + 1).padStart(2, '0')} ${escapeHtml(fusion.canonical)}</a>`).join('');
  const body = FUSIONS.map(renderFusion).join('');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>事件融合数据审阅</title>
<style>
  :root { color-scheme: dark; --bg:#0b0d10; --panel:#15191f; --panel2:#10141a; --text:#edf2f7; --muted:#9aa6b2; --line:#2b3440; --orange:#ff8a3d; --green:#62d26f; --red:#ff6b6b; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.65 -apple-system,BlinkMacSystemFont,"OPPO Sans",Segoe UI,sans-serif; }
  a { color:#7cc7ff; word-break: break-all; }
  code { display:block; color:#a8b3bf; font-size:12px; white-space:normal; word-break:break-all; }
  .page-head { position:sticky; top:0; z-index:5; padding:20px 28px; background:rgba(11,13,16,.94); border-bottom:1px solid var(--line); backdrop-filter: blur(10px); }
  .page-head h1 { margin:0 0 6px; font-size:26px; }
  .page-head p { margin:0; color:var(--muted); }
  .toc { display:flex; gap:8px; flex-wrap:wrap; padding-top:14px; }
  .toc a { text-decoration:none; color:var(--text); border:1px solid var(--line); border-radius:999px; padding:3px 10px; background:#111820; }
  main { padding:24px 28px 60px; }
  .fusion { margin:0 0 32px; border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--panel2); }
  .fusion-head { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; padding:18px 20px; border-bottom:1px solid var(--line); }
  .fusion-head h2 { display:inline; margin:0 12px 0 0; font-size:22px; }
  .fusion-head p { margin:4px 0 0; color:var(--muted); }
  .index { color:var(--orange); font-weight:700; margin-right:12px; }
  .badge { white-space:nowrap; border-radius:999px; padding:4px 10px; border:1px solid var(--line); }
  .badge.ok { color:var(--green); border-color:rgba(98,210,111,.35); }
  .badge.bad { color:var(--red); border-color:rgba(255,107,107,.35); }
  .columns { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:1px; background:var(--line); }
  .column { background:var(--panel); padding:18px; min-width:0; }
  .column.final { background:#171b1d; box-shadow: inset 4px 0 0 var(--orange); }
  .column header { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:14px; }
  .column header span { font-size:18px; font-weight:700; }
  .column h4 { margin:18px 0 8px; color:#ffd2b8; font-size:13px; letter-spacing:.03em; }
  .column p { margin:0; color:#d9e1e8; }
  .description { max-height:170px; overflow:auto; padding-right:4px; }
  .metrics { display:grid; gap:8px; }
  .metric { border:1px solid var(--line); border-radius:8px; padding:8px; background:#10161d; }
  .metric span { display:block; color:var(--muted); font-size:12px; }
  .metric strong { display:block; font-size:15px; }
  .figures { display:grid; gap:8px; }
  .figure { display:grid; grid-template-columns:42px minmax(0,1fr); gap:10px; align-items:center; border:1px solid var(--line); border-radius:8px; padding:8px; background:#10161d; }
  .avatar { width:42px; height:42px; display:grid; place-items:center; overflow:hidden; border-radius:50%; background:#222b35; color:#fff; font-weight:700; font-size:12px; }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .figure small { display:block; color:var(--muted); }
  .media-block a { display:block; margin:0 0 2px; }
  .image-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  figure { margin:0; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#0f141a; }
  figure img { width:100%; height:128px; object-fit:contain; display:block; background:#090d12; }
  figcaption { padding:6px; color:var(--muted); font-size:11px; word-break:break-all; }
  figcaption b, figcaption span { display:block; font-weight:400; }
  .sources { padding-left:20px; margin:0; }
  .sources li { margin-bottom:8px; }
  .sources span { display:inline-block; color:var(--orange); margin-right:6px; }
  .concepts, .sections { display:grid; gap:8px; }
  .concepts div, .sections div { border:1px solid var(--line); border-radius:8px; padding:9px; background:#10161d; }
  .concepts b, .sections b { display:block; color:#fff; margin-bottom:4px; }
  .empty { color:var(--muted); font-style:italic; }
  @media (max-width: 1200px) { .columns { grid-template-columns:1fr; } .page-head { position:static; } }
</style>
</head>
<body>
<header class="page-head">
  <h1>事件融合数据审阅</h1>
  <p>左侧为深度学习分支原始数据，中间为 AI100 原始数据，右侧为当前生成后的最终融合数据。生成时间：${escapeHtml(generatedAt)}</p>
  <nav class="toc">${toc}</nav>
</header>
<main>${body}</main>
</body>
</html>
`;
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, renderHtml(), 'utf8');
console.log(`✓ 生成完成：${OUTPUT}`);
