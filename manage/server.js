#!/usr/bin/env node
// 内容管理服务器
// 用法：node manage/server.js
// 访问：http://localhost:3001/admin

'use strict';

const http         = require('http');
const https        = require('https');
const fs           = require('fs');
const path         = require('path');
const vm           = require('vm');
const { execFile } = require('child_process');
const { URL }      = require('url');

const PORT    = process.env.PORT || 3001;
const ROOT    = path.resolve(__dirname, '..');
const MANAGE  = __dirname;
const QUOTE_CANDIDATES_PATH = path.join(ROOT, 'resources', 'quote-candidates.js');
const {
  MILESTONE_ID_PREFIX,
  QUOTE_META_FIELDS,
  SUPPORTED_LOCALES,
  backupFile: backupSharedFile,
  detectVideoSource,
  formatQuoteAttribution,
  getLocalizedText,
  hasOwn,
  isLocalizedText,
  loadQuoteCandidates: loadSharedQuoteCandidates,
  mergeEditableQuoteMeta,
  normalizeEditableQuoteMeta,
  normalizeQuoteText,
} = require('../shared/utils.js');
const localizedText = getLocalizedText;
const BACKUP_DIR = path.join(MANAGE, '.backups');

// ─── MIME 类型 ────────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function err(res, msg, status = 500) {
  json(res, { error: msg }, status);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** 清除 require cache 后重新 require，保证读到最新文件 */
function freshRequire(filePath) {
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
}

/** 解析 URL query string 为对象 */
function parseQuery(urlStr) {
  const q = {};
  const idx = urlStr.indexOf('?');
  if (idx === -1) return q;
  for (const part of urlStr.slice(idx + 1).split('&')) {
    const [k, v] = part.split('=').map(decodeURIComponent);
    if (k) q[k] = v || '';
  }
  return q;
}

/** 清理文件名，只保留安全字符 */
function safeName(name) {
  return name.replace(/[^A-Za-z0-9._\-\u4e00-\u9fa5]/g, '_').slice(0, 120);
}

/** 从 URL 提取文件名 + 确保有图片扩展名 */
function filenameFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const base = path.basename(u.pathname) || 'image';
    const name = safeName(base);
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return name;
    return name + '.jpg';
  } catch {
    return `img_${Date.now()}.jpg`;
  }
}

/** 确保目录存在 */
function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** 如文件已存在则在文件名前加时间戳 */
function uniquePath(dir, filename) {
  const full = path.join(dir, filename);
  if (!fs.existsSync(full)) return full;
  const ext  = path.extname(filename);
  const base = path.basename(filename, ext);
  return path.join(dir, `${base}_${Date.now()}${ext}`);
}

/** 下载 http/https URL 并写入文件（返回 Promise<void>） */
function downloadFile(rawUrl, dest) {
  return new Promise((resolve, reject) => {
    const get = rawUrl.startsWith('https') ? https.get : http.get;
    get(rawUrl, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 跟随一次重定向
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', resolve);
      out.on('error', reject);
    }).on('error', reject);
  });
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractAppliedQuoteLocale(rawQuote, explicitQuotePage) {
  const quoteHtml = String(rawQuote || '').trim();
  const quotePage = String(explicitQuotePage || '').trim();
  const sourcePattern = /(?:<br\s*\/?>\s*){1,2}<span[^>]*>\s*—\s*([^<]+?)\s*<\/span>\s*$/i;
  const matchedSource = quoteHtml.match(sourcePattern);

  if (matchedSource) {
    return {
      quote: quoteHtml.replace(sourcePattern, '').trim(),
      quotePage: quotePage || matchedSource[1].trim(),
    };
  }

  return {
    quote: quoteHtml,
    quotePage,
  };
}

function extractAppliedQuoteState(milestone) {
  const safeMilestone = milestone || {};
  if (isLocalizedText(safeMilestone.quote) || isLocalizedText(safeMilestone.quotePage)) {
    const quote = {};
    const quotePage = {};

    for (const locale of SUPPORTED_LOCALES) {
      const extracted = extractAppliedQuoteLocale(
        localizedText(safeMilestone.quote, locale),
        localizedText(safeMilestone.quotePage, locale),
      );
      quote[locale] = extracted.quote;
      quotePage[locale] = extracted.quotePage;
    }

    return {
      quote,
      quotePage,
    };
  }

  return extractAppliedQuoteLocale(safeMilestone.quote, safeMilestone.quotePage);
}

function quoteHtmlToText(html) {
  if (isLocalizedText(html)) {
    return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, quoteHtmlToText(localizedText(html, locale))]));
  }

  let value = String(html || '').trim();
  if (!value) return '';
  if (value.startsWith('"')) value = value.slice(1).trimStart();
  if (value.endsWith('"')) value = value.slice(0, -1).trimEnd();
  value = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  return decodeHtmlEntities(value).trim();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function localizedTextEquals(a, b) {
  return SUPPORTED_LOCALES.every((locale) => localizedText(a, locale) === localizedText(b, locale));
}

function localizedDisplayValue(value) {
  if (!isLocalizedText(value)) return localizedText(value);
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, localizedText(value, locale)]));
}

function loadAppliedMilestones() {
  const milestonePath = path.join(ROOT, 'milestones-data.js');
  if (!fs.existsSync(milestonePath)) return [];
  try {
    const src = fs.readFileSync(milestonePath, 'utf8');
    const sandbox = {};
    vm.runInNewContext(src.replace(/\bconst\s+(milestones)\b/, 'var $1'), sandbox);
    return Array.isArray(sandbox.milestones) ? sandbox.milestones : [];
  } catch (_) {
    return [];
  }
}

function loadAppliedMilestoneMap() {
  const map = {};
  for (const milestone of loadAppliedMilestones()) {
    if (milestone && typeof milestone === 'object' && milestone.id && milestone.id.startsWith(MILESTONE_ID_PREFIX)) {
      map[milestone.id.slice(MILESTONE_ID_PREFIX.length)] = milestone;
    }
  }
  return map;
}

function loadQuoteCandidates() {
  return loadSharedQuoteCandidates(QUOTE_CANDIDATES_PATH, {
    fresh: true,
    fallback: { curatedAt: '', purpose: '', events: {} },
  });
}

function writeQuoteCandidates(data) {
  const target = QUOTE_CANDIDATES_PATH;
  const safeData = data && typeof data === 'object' ? data : { events: {} };
  const content = [
    `// AI 历史展览引言摘录候选库（人工整理）`,
    `// 说明：`,
    `// - 每个事件至少提供一条高相关、可追溯来源的候选引言`,
    `// - 优先选择官方页面、论文摘要、学术出版社页面或机构页面中的原话`,
    `// - 当前文件仅存候选数据，不直接参与页面渲染`,
    ``,
    `const quoteCandidates = ${JSON.stringify(safeData, null, 2)};`,
    ``,
    `if (typeof module !== 'undefined' && module.exports) {`,
    `  module.exports = { quoteCandidates };`,
    `}`,
    ``,
    `if (typeof window !== 'undefined') {`,
    `  window.quoteCandidates = quoteCandidates;`,
    `}`,
    ``,
  ].join('\n');
  backupFile(target);
  atomicWrite(target, content);
}

function getLeadQuoteCandidate(candidatesMap, key) {
  const list = candidatesMap && candidatesMap.events && Array.isArray(candidatesMap.events[key])
    ? candidatesMap.events[key]
    : [];
  return list.length > 0 && list[0] && typeof list[0] === 'object' ? list[0] : null;
}

function cloneTextValue(value) {
  return isLocalizedText(value) ? deepClone(value) : String(value || '');
}

function getEffectiveQuoteText(candidatesMap, key, fallbackText) {
  const first = getLeadQuoteCandidate(candidatesMap, key);
  const candidateQuote = first ? String(first.quote || '').trim() : '';
  if (isLocalizedText(fallbackText)) {
    return {
      en: candidateQuote || localizedText(fallbackText, 'en'),
      zh: localizedText(fallbackText, 'zh') || candidateQuote || localizedText(fallbackText, 'en'),
    };
  }
  return candidateQuote || localizedText(fallbackText);
}

function getEffectiveQuoteMeta(candidatesMap, key, ev, options = {}) {
  const first = getLeadQuoteCandidate(candidatesMap, key);
  const eventMeta = ev && hasOwn(ev, 'quoteMeta') ? ev.quoteMeta : null;
  return mergeEditableQuoteMeta(eventMeta, first, options);
}

function quoteMetaHasAnyValue(meta) {
  return QUOTE_META_FIELDS.some((field) => {
    const value = (meta || {})[field];
    if (isLocalizedText(value)) return SUPPORTED_LOCALES.some((locale) => localizedText(value, locale));
    return String(value || '').trim();
  });
}

function quoteMetaEquals(a, b) {
  return QUOTE_META_FIELDS.every((field) => {
    const left = (a || {})[field];
    const right = (b || {})[field];
    if (isLocalizedText(left) || isLocalizedText(right)) {
      return SUPPORTED_LOCALES.every((locale) => localizedText(left, locale) === localizedText(right, locale));
    }
    return String(left || '').trim() === String(right || '').trim();
  });
}

function extractQuoteMetaFromAttribution(attribution, options = {}) {
  const preserveKeys = Boolean(options.preserveKeys);
  const value = String(attribution || '').trim();
  const empty = normalizeEditableQuoteMeta({}, { preserveKeys });
  if (!value) return empty;

  const workMatch = value.match(/^《([^》]+)》(.*)$/);
  if (workMatch) {
    const authors = String(workMatch[2] || '').replace(/^,\s*/, '').trim();
    return normalizeEditableQuoteMeta({
      workTitle: String(workMatch[1] || '').trim(),
      workAuthors: authors,
    }, { preserveKeys });
  }

  return normalizeEditableQuoteMeta({ speaker: value }, { preserveKeys });
}

function getFileMtimeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch (_) {
    return 0;
  }
}

function shouldPreferAppliedSnapshot(eventsPath, milestonePath) {
  if (!fs.existsSync(milestonePath)) return false;
  return getFileMtimeMs(milestonePath) >= getFileMtimeMs(eventsPath);
}

function isPortraitLikeImage(url) {
  return /\/people\/|portrait|headshot|avatar|人物|人像/i.test(String(url || ''));
}

function isDocumentLikeImage(url) {
  return /proposal|paper|document|page|sheet|scan|manuscript|report|doc|论文|提案|文稿|手稿/i.test(String(url || ''));
}

function extractWorkTitleFromAttribution(attribution) {
  const match = String(attribution || '').match(/《([^》]+)》/);
  return match ? String(match[1] || '').trim() : '';
}

function readConfiguredImageMetaEntry(map, url) {
  if (!map || typeof map !== 'object') return null;
  const entry = map[url];
  if (!entry || typeof entry !== 'object') return null;

  const caption = cloneTextValue(entry.caption || entry.title || entry.name || '');
  const subcaption = cloneTextValue(entry.subcaption || entry.subtitle || entry.description || entry.role || '');
  if (!localizedText(caption) && !localizedText(subcaption)) return null;
  return { caption, subcaption };
}

function deriveDisplayedImageMeta(milestone, url, configured) {
  const value = String(url || '').trim();
  if (!value) return { caption: '', subcaption: '' };

  const title = localizedText((milestone || {}).title);
  const year = milestone && milestone.year ? String(milestone.year) : '';
  const category = localizedText((milestone || {}).category);
  const workTitle = extractWorkTitleFromAttribution((milestone || {}).quoteAttribution || '');

  let fallback;
  if (isPortraitLikeImage(value)) {
    fallback = { caption: '人物肖像', subcaption: '相关研究者照片' };
  } else if (/\/architecture\//i.test(value) || /_architecture_/i.test(value)) {
    fallback = { caption: '结构示意', subcaption: title ? `${title} 架构图` : '模型架构图' };
  } else if (/\/papers\//i.test(value) || /_papers_/i.test(value) || isDocumentLikeImage(value)) {
    fallback = { caption: '论文页面', subcaption: workTitle ? `《${workTitle}》` : (title || '原文截图或摘要') };
  } else if (/\/historical\//i.test(value) || /_historical_/i.test(value)) {
    fallback = { caption: '历史照片', subcaption: title || (year ? `${year} 年相关档案` : '事件相关档案') };
  } else {
    fallback = { caption: '档案图片', subcaption: title || category || '事件相关资料' };
  }

  return {
    caption: configured && localizedText(configured.caption) ? configured.caption : fallback.caption,
    subcaption: configured && localizedText(configured.subcaption) ? configured.subcaption : fallback.subcaption,
  };
}

function buildDisplayedImageMetaMap(milestone, existingMap, imageList) {
  const result = {};
  const sourceMap = existingMap && typeof existingMap === 'object' ? existingMap : {};
  for (const url of Array.isArray(imageList) ? imageList : []) {
    if (!url) continue;
    const configured = readConfiguredImageMetaEntry(sourceMap, url);
    const displayed = deriveDisplayedImageMeta(milestone, url, configured);
    if (!displayed.caption && !displayed.subcaption) continue;
    result[url] = {
      ...(sourceMap[url] && typeof sourceMap[url] === 'object' ? sourceMap[url] : {}),
      caption: displayed.caption,
      subcaption: displayed.subcaption,
    };
  }
  return result;
}

function buildAdminEventsSnapshot(eventsData, options = {}) {
  const merged = deepClone(eventsData || {});
  const appliedMap = options.appliedMap || loadAppliedMilestoneMap();
  const quoteCandidates = options.quoteCandidates || loadQuoteCandidates();
  const preferApplied = Boolean(options.preferApplied);

  for (const [key, ev] of Object.entries(merged)) {
    const applied = appliedMap[key];
    const resources = applied && applied.resources && typeof applied.resources === 'object' ? applied.resources : {};

    if (preferApplied && applied) {
      if (applied.title !== undefined) ev.title = cloneTextValue(applied.title);
      if (applied.year !== undefined) ev.year = applied.year;
      if (applied.location && typeof applied.location === 'object') ev.location = deepClone(applied.location);
      if (applied.description !== undefined) ev.description = cloneTextValue(applied.description);
      if (Array.isArray(applied.figures)) ev.figures = deepClone(applied.figures);

      const appliedQuoteState = extractAppliedQuoteState(applied);
      const appliedQuoteText = quoteHtmlToText(appliedQuoteState.quote);
      ev.quoteText = appliedQuoteText;
      ev.quotePage = cloneTextValue(appliedQuoteState.quotePage || '');

      if (Array.isArray(resources.images)) ev.images = deepClone(resources.images);
      if (Array.isArray(resources.videos)) ev.videos = deepClone(resources.videos);
    } else {
      if (!hasOwn(ev, 'quoteText') && applied) {
        const appliedQuoteState = extractAppliedQuoteState(applied);
        const appliedQuoteText = quoteHtmlToText(appliedQuoteState.quote);
        ev.quoteText = appliedQuoteText;
      }
      if (!hasOwn(ev, 'quotePage') && applied) {
        const appliedQuoteState = extractAppliedQuoteState(applied);
        ev.quotePage = cloneTextValue(appliedQuoteState.quotePage || '');
      }
      if (!hasOwn(ev, 'images') && Array.isArray(resources.images)) {
        ev.images = deepClone(resources.images);
      }
      if (!hasOwn(ev, 'videos') && Array.isArray(resources.videos)) {
        ev.videos = deepClone(resources.videos);
      }
    }

    const effectiveQuoteText = getEffectiveQuoteText(quoteCandidates, key, ev.quoteText);
    const effectiveQuoteMeta = getEffectiveQuoteMeta(quoteCandidates, key, ev, { preserveKeys: true });
    ev.quoteText = isLocalizedText(effectiveQuoteText)
      ? Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, normalizeQuoteText(localizedText(effectiveQuoteText, locale))]))
      : normalizeQuoteText(effectiveQuoteText);
    ev.quoteMeta = effectiveQuoteMeta;

    const displayMilestone = preferApplied && applied
      ? applied
      : {
          title: ev.title,
          year: ev.year,
          category: '',
          quoteAttribution: formatQuoteAttribution(effectiveQuoteMeta),
        };

    ev.imageMeta = buildDisplayedImageMetaMap(displayMilestone, ev.imageMeta || resources.imageMeta || {}, ev.images || []);
  }

  return merged;
}

function normalizeImageMetaMap(map) {
  const source = map && typeof map === 'object' ? map : {};
  const normalized = {};
  for (const [url, entry] of Object.entries(source)) {
    if (!entry || typeof entry !== 'object') continue;
  const caption = localizedText(entry.caption || entry.title || entry.name || '');
  const subcaption = localizedText(entry.subcaption || entry.subtitle || entry.description || entry.role || '');
    if (!caption && !subcaption) continue;
    normalized[url] = { caption, subcaption };
  }
  return normalized;
}

function syncLeadQuoteCandidates(eventsData) {
  const quoteCandidates = loadQuoteCandidates();
  if (!quoteCandidates.events || typeof quoteCandidates.events !== 'object') {
    quoteCandidates.events = {};
  }

  let changed = false;
  for (const [key, ev] of Object.entries(eventsData || {})) {
    let first = getLeadQuoteCandidate(quoteCandidates, key);
    const normalizedQuoteMeta = normalizeEditableQuoteMeta(
      ev && hasOwn(ev, 'quoteMeta') ? ev.quoteMeta : null,
      { preserveKeys: ev && hasOwn(ev, 'quoteMeta') },
    );
    const nextQuote = normalizeQuoteText(localizedText(ev && ev.quoteText ? ev.quoteText : '', 'en'));

    if (!first && (nextQuote || quoteMetaHasAnyValue(normalizedQuoteMeta))) {
      if (!Array.isArray(quoteCandidates.events[key])) quoteCandidates.events[key] = [];
      first = {};
      quoteCandidates.events[key].unshift(first);
      changed = true;
    }
    if (!first) continue;

    if (String(first.quote || '').trim() !== nextQuote) {
      first.quote = nextQuote;
      changed = true;
    }

    if (ev && hasOwn(ev, 'quoteMeta')) {
      for (const field of QUOTE_META_FIELDS) {
        const nextValue = String(normalizedQuoteMeta[field] || '').trim();
        if (String(first[field] || '').trim() !== nextValue) {
          first[field] = nextValue;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    writeQuoteCandidates(quoteCandidates);
  }

  return quoteCandidates;
}

// ─── 备份 + 原子写 ────────────────────────────────────────────────────────────

function backupFile(filePath) {
  return backupSharedFile(filePath, { backupDir: BACKUP_DIR, maxBackups: 5 });
}

/** 原子写：先写 .tmp，再 rename，防止写入中断损坏文件 */
function atomicWrite(filePath, content) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

// ─── 写回函数 ─────────────────────────────────────────────────────────────────

function writeCatalog(data) {
  const target  = path.join(MANAGE, 'catalog.js');
  const content = [
    `// 文件A: 展示目录配置（由管理页面生成）`,
    `// 控制展示哪些分类、哪些核心事件，以及展示顺序`,
    `// 修改此文件后运行 \`node manage/generate.js\` 重新生成 milestones-data.js`,
    ``,
    `module.exports = ${JSON.stringify(data, null, 2)};`,
    ``,
  ].join('\n');
  backupFile(target);
  atomicWrite(target, content);
}

function writeEvents(data) {
  const target  = path.join(MANAGE, 'events.js');
  const content = [
    `// 文件B: 核心事件内容配置（由管理页面生成）`,
    `// 修改此文件后运行 \`node manage/generate.js\` 重新生成 milestones-data.js`,
    ``,
    `/* eslint-disable */`,
    `module.exports = ${JSON.stringify(data, null, 2)};`,
    ``,
  ].join('\n');
  backupFile(target);
  atomicWrite(target, content);
}

function createVideoCatalog(eventKey, ev) {
  return {
    event_id: eventKey,
    event_title: localizedText(ev.title) || eventKey,
    year: ev.year || 0,
    candidate_videos: [],
    total_count: 0,
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
}

function readVideoCatalog(jsonPath, eventKey, ev) {
  let catalog = null;
  if (fs.existsSync(jsonPath)) {
    try { catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (_) {}
  }
  if (!catalog || typeof catalog !== 'object') {
    catalog = createVideoCatalog(eventKey, ev);
  }
  if (!Array.isArray(catalog.candidate_videos)) catalog.candidate_videos = [];
  return catalog;
}

function ensureVideoCatalogEntry(jsonPath, eventKey, ev, matchFn, newEntry) {
  const catalog = readVideoCatalog(jsonPath, eventKey, ev);
  const alreadyExists = catalog.candidate_videos.some(matchFn);
  if (alreadyExists) return false;

  catalog.candidate_videos.push(newEntry);
  catalog.total_count = catalog.candidate_videos.length;
  mkdirp(path.dirname(jsonPath));
  atomicWrite(jsonPath, JSON.stringify(catalog, null, 2));
  return true;
}

// ─── 路由处理 ─────────────────────────────────────────────────────────────────

const routes = {

  'GET /admin': (req, res) => {
    const file = path.join(MANAGE, 'admin.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('admin.html not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(file));
  },

  'GET /api/catalog': (req, res) => {
    try { json(res, freshRequire(path.join(MANAGE, 'catalog.js'))); }
    catch (e) { err(res, e.message); }
  },

  'POST /api/catalog': async (req, res) => {
    try { writeCatalog(await readBody(req)); json(res, { ok: true }); }
    catch (e) { err(res, e.message); }
  },

  'GET /api/events': (req, res) => {
    try {
      const eventsPath = path.join(MANAGE, 'events.js');
      const milestonePath = path.join(ROOT, 'milestones-data.js');
      const baseEvents = freshRequire(path.join(MANAGE, 'events.js'));
      json(res, buildAdminEventsSnapshot(baseEvents, {
        appliedMap: loadAppliedMilestoneMap(),
        quoteCandidates: loadQuoteCandidates(),
        preferApplied: shouldPreferAppliedSnapshot(eventsPath, milestonePath),
      }));
    }
    catch (e) { err(res, e.message); }
  },

  'POST /api/events': async (req, res) => {
    try {
      const eventsData = await readBody(req);
      const videosDir  = path.join(ROOT, 'resources', 'videos');

      for (const ev of Object.values(eventsData)) {
        if (ev && typeof ev === 'object' && hasOwn(ev, 'quoteMeta')) {
          ev.quoteMeta = normalizeEditableQuoteMeta(ev.quoteMeta, { preserveKeys: true });
        }
        if (!Array.isArray(ev.figures)) continue;
        ev.figures = ev.figures
          .map((figure) => ({
            name: cloneTextValue(figure && figure.name),
            role: isLocalizedText(figure && figure.role)
              ? deepClone(figure.role)
              : String(figure && figure.role ? figure.role : '').trim(),
          }))
          .filter((figure) => localizedText(figure.name) || localizedText(figure.role));
      }

      // 同步视频：将含元数据的对象写入 resources/videos/{key}.json，
      // 同时将 events 中的条目规范化为纯字符串：
      //   YouTube（有 id）→ 字符串 ID；非 YouTube（只有 url）→ 字符串 URL
      for (const [eventKey, ev] of Object.entries(eventsData)) {
        if (!Array.isArray(ev.videos)) continue;
        ev.videos = ev.videos.map(item => {
          // 已是字符串：短 ID 不变；完整 URL 写入 JSON 后保留
          if (typeof item === 'string') {
            if (item.startsWith('http://') || item.startsWith('https://')) {
              // 非 YouTube URL → 写入 candidate_videos JSON
              const jsonPath = path.join(videosDir, `${eventKey}.json`);
              ensureVideoCatalogEntry(
                jsonPath,
                eventKey,
                ev,
                v => v.url === item,
                { url: item, title: '', source: detectVideoSource(item) },
              );
            }
            return item; // 字符串原样保留
          }
          if (typeof item !== 'object') return item;
          // 无 url 且无 id → 丢弃（无效条目）
          if (!item.id && !item.url) return null;

          // 写入 candidate_videos JSON
          const jsonPath = path.join(videosDir, `${eventKey}.json`);

          if (item.id) {
            // YouTube 视频：按 id 去重，写入后规范化为纯字符串 ID
            ensureVideoCatalogEntry(
              jsonPath,
              eventKey,
              ev,
              v => v.id === item.id,
              {
                id:           item.id,
                url:          item.url          || `https://www.youtube.com/watch?v=${item.id}`,
                embed_url:    item.embed_url    || `https://www.youtube.com/embed/${item.id}`,
                title:        item.title        || '',
                channel:      item.channel      || '',
                duration:     item.duration     || '',
                views:        item.views        || '',
                thumbnail:    item.thumbnail    || `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
                thumbnail_hq: item.thumbnail_hq || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
                source:       'YouTube',
              },
            );
            return item.id; // 规范化为纯字符串 ID
          } else {
            // 非 YouTube 视频（Bilibili 等）：按 url 去重，写入 JSON，events 中保留对象
            ensureVideoCatalogEntry(
              jsonPath,
              eventKey,
              ev,
              v => v.url === item.url,
              {
                url:    item.url,
                title:  item.title  || '',
                source: item.source || 'Web',
              },
            );
            return item.url; // 规范化为纯字符串 URL
          }
        }).filter(Boolean);
      }

      const updatedQuoteCandidates = syncLeadQuoteCandidates(eventsData);
      for (const [key, ev] of Object.entries(eventsData)) {
        if (!ev || typeof ev !== 'object' || !hasOwn(ev, 'quoteMeta')) continue;
        const eventQuoteMeta = normalizeEditableQuoteMeta(ev.quoteMeta, { preserveKeys: true });
        const candidateQuoteMeta = normalizeEditableQuoteMeta(getLeadQuoteCandidate(updatedQuoteCandidates, key));
        if (!quoteMetaHasAnyValue(eventQuoteMeta)) {
          delete ev.quoteMeta;
          continue;
        }
        if (quoteMetaEquals(eventQuoteMeta, candidateQuoteMeta)) {
          delete ev.quoteMeta;
        }
      }
      writeEvents(eventsData);
      json(res, { ok: true });
    } catch (e) { err(res, e.message); }
  },

  'GET /api/videos': (req, res) => {
    try {
      const videosDir = path.join(ROOT, 'resources', 'videos');
      const result = {};
      if (fs.existsSync(videosDir)) {
        for (const file of fs.readdirSync(videosDir)) {
          if (!file.endsWith('.json')) continue;
          const key = path.basename(file, '.json');
          try {
            const raw = JSON.parse(fs.readFileSync(path.join(videosDir, file), 'utf8'));
            result[key] = raw.candidate_videos || [];
          } catch { result[key] = []; }
        }
      }
      json(res, result);
    } catch (e) { err(res, e.message); }
  },

  'GET /api/images': (req, res) => {
    try {
      const imagesDir = path.join(ROOT, 'resources', 'images');
      const result = {};
      if (fs.existsSync(imagesDir)) {
        for (const eventKey of fs.readdirSync(imagesDir)) {
          const eventDir = path.join(imagesDir, eventKey);
          if (!fs.statSync(eventDir).isDirectory()) continue;
          result[eventKey] = {};
          for (const sub of fs.readdirSync(eventDir)) {
            const subDir = path.join(eventDir, sub);
            if (!fs.statSync(subDir).isDirectory()) continue;
            result[eventKey][sub] = fs.readdirSync(subDir)
              .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
              .map(f => `resources/images/${eventKey}/${sub}/${f}`);
          }
        }
      }
      json(res, result);
    } catch (e) { err(res, e.message); }
  },

  // 图片上传：POST /api/images/upload?eventKey=xxx&subdir=uploaded&filename=photo.jpg
  // Body: application/octet-stream（原始二进制）
  'POST /api/images/upload': async (req, res) => {
    try {
      const q        = parseQuery(req.url);
      const eventKey = q.eventKey;
      const subdir   = q.subdir || 'uploaded';
      let   filename = q.filename ? safeName(q.filename) : `img_${Date.now()}.jpg`;

      if (!eventKey) { err(res, 'eventKey 参数必填', 400); return; }
      if (/\.\./.test(eventKey) || /\.\./.test(subdir)) { err(res, '路径非法', 400); return; }

      const dir  = path.join(ROOT, 'resources', 'images', eventKey, subdir);
      mkdirp(dir);
      const dest = uniquePath(dir, filename);
      const buf  = await readRawBody(req);
      fs.writeFileSync(dest, buf);

      const relPath = path.relative(ROOT, dest).replace(/\\/g, '/');
      json(res, { ok: true, path: relPath });
    } catch (e) { err(res, e.message); }
  },

  // 图片 URL 下载：POST /api/images/download
  // Body: { eventKey, url, subdir?, filename? }
  'POST /api/images/download': async (req, res) => {
    try {
      const body = await readBody(req);
      const { eventKey, url: imgUrl, subdir = 'downloaded', filename: rawFilename } = body;

      if (!eventKey) { err(res, 'eventKey 必填', 400); return; }
      if (!imgUrl)   { err(res, 'url 必填', 400); return; }
      if (/\.\./.test(eventKey) || /\.\./.test(subdir)) { err(res, '路径非法', 400); return; }

      const filename = rawFilename ? safeName(rawFilename) : filenameFromUrl(imgUrl);
      const dir      = path.join(ROOT, 'resources', 'images', eventKey, subdir);
      mkdirp(dir);
      const dest = uniquePath(dir, filename);

      await downloadFile(imgUrl, dest);

      const relPath = path.relative(ROOT, dest).replace(/\\/g, '/');
      json(res, { ok: true, path: relPath });
    } catch (e) { err(res, e.message); }
  },

  // 差异预览：比较当前 manage/ 配置与已应用的 milestones-data.js
  'GET /api/generate/diff': (req, res) => {
    try {
      const catalog   = freshRequire(path.join(MANAGE, 'catalog.js'));
      const eventsMap = freshRequire(path.join(MANAGE, 'events.js'));
      const quoteCandidates = loadQuoteCandidates();

      // 新目录中所有 key（按 catalog 顺序）
      const newKeys = [];
      for (const cat of catalog.categories || []) {
        for (const key of cat.events || []) {
          if (!newKeys.includes(key)) newKeys.push(key);
        }
      }

      // 解析已应用的 milestones-data.js
      const milestonePath = path.join(ROOT, 'milestones-data.js');
      if (!fs.existsSync(milestonePath)) {
        json(res, { firstGeneration: true, totalEvents: newKeys.length, newKeys });
        return;
      }

      let appliedMilestones;
      try {
        appliedMilestones = loadAppliedMilestones();
      } catch (e) {
        json(res, { firstGeneration: true, parseError: e.message, newKeys });
        return;
      }

      // applied map: key → milestone
      const appliedMap = {};
      for (const m of appliedMilestones) {
        if (m.id && m.id.startsWith(MILESTONE_ID_PREFIX)) {
          appliedMap[m.id.slice(MILESTONE_ID_PREFIX.length)] = m;
        }
      }
      const appliedKeys = new Set(Object.keys(appliedMap));
      const newKeysSet  = new Set(newKeys);

      const added   = newKeys.filter(k => !appliedKeys.has(k));
      const removed = [...appliedKeys].filter(k => !newKeysSet.has(k));

      const modified  = [];
      const unchanged = [];

      for (const key of newKeys) {
        if (!appliedKeys.has(key)) continue;
        const ev      = eventsMap[key] || {};
        const applied = appliedMap[key];

        const changes = {};

        // 标量字段：直接对比旧/新值
        if (!localizedTextEquals(ev.title, applied.title))
          changes.title = { from: localizedText(applied.title), to: localizedText(ev.title) };
        if (String(ev.year  || '') !== String(applied.year  || ''))
          changes.year  = { from: applied.year,         to: ev.year };

        // 描述：记录完整前后内容
        if (!localizedTextEquals(ev.description, applied.description))
          changes.description = { from: localizedText(applied.description), to: localizedText(ev.description) };

        // 引言文本和页码来源：分别比较，兼容旧版把 quotePage 拼进 quote HTML 的数据
        const evQuoteTextValue = getEffectiveQuoteText(quoteCandidates, key, ev.quoteText);
        const evQuoteText = isLocalizedText(evQuoteTextValue)
          ? Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, normalizeQuoteText(localizedText(evQuoteTextValue, locale))]))
          : normalizeQuoteText(evQuoteTextValue);
        const rebuildQuote = (text) => {
          if (!text) return '';
          const body = text.replace(/\n/g, '<br>');
          return `"${body}"`;
        };
        const rebuildQuoteValue = (value) => isLocalizedText(value)
          ? Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, rebuildQuote(localizedText(value, locale))]))
          : rebuildQuote(value);
        const appliedQuoteState = extractAppliedQuoteState(applied);
        const rebuiltQuote = rebuildQuoteValue(evQuoteText);
        if (!localizedTextEquals(rebuiltQuote, appliedQuoteState.quote))
          changes.quote = { from: localizedDisplayValue(appliedQuoteState.quote || ''), quoteText: localizedDisplayValue(evQuoteText) };
        if (!localizedTextEquals(ev.quotePage, appliedQuoteState.quotePage))
          changes.quotePage = { from: localizedDisplayValue(appliedQuoteState.quotePage || ''), to: localizedDisplayValue(ev.quotePage) };

        const evQuoteMeta = getEffectiveQuoteMeta(quoteCandidates, key, ev, { preserveKeys: true });
        const appliedHasStructuredQuoteMeta = Boolean(applied.quoteMeta && typeof applied.quoteMeta === 'object');
        const appliedQuoteMeta = appliedHasStructuredQuoteMeta
          ? normalizeEditableQuoteMeta(applied.quoteMeta, { preserveKeys: true })
          : extractQuoteMetaFromAttribution(applied.quoteAttribution, { preserveKeys: true });
        const evQuoteAttribution = formatQuoteAttribution(evQuoteMeta);
        const appliedQuoteAttribution = localizedText(applied.quoteAttribution)
          ? applied.quoteAttribution
          : formatQuoteAttribution(appliedQuoteMeta);
        const quoteMetaChanged = appliedHasStructuredQuoteMeta
          ? !quoteMetaEquals(evQuoteMeta, appliedQuoteMeta)
          : !localizedTextEquals(evQuoteAttribution, appliedQuoteAttribution);
        if (quoteMetaChanged) {
          changes.quoteMeta = {
            fromAttribution: localizedDisplayValue(appliedQuoteAttribution),
            toAttribution: localizedDisplayValue(evQuoteAttribution),
            from: appliedHasStructuredQuoteMeta ? appliedQuoteMeta : null,
            to: evQuoteMeta,
          };
        }

        // 图片：计算集合差
        const evImgSet  = new Set(ev.images || []);
        const appImgSet = new Set((applied.resources || {}).images || []);
        const imgsAdded   = [...evImgSet].filter(p => !appImgSet.has(p));
        const imgsRemoved = [...appImgSet].filter(p => !evImgSet.has(p));
        if (imgsAdded.length || imgsRemoved.length)
          changes.images = { added: imgsAdded, removed: imgsRemoved };

        const evImageMeta = normalizeImageMetaMap(ev.imageMeta);
        const appImageMeta = normalizeImageMetaMap((applied.resources || {}).imageMeta);
        const imageMetaChanged = [...new Set([...Object.keys(evImageMeta), ...Object.keys(appImageMeta)])]
          .filter((imgPath) => JSON.stringify(evImageMeta[imgPath] || {}) !== JSON.stringify(appImageMeta[imgPath] || {}));
        if (imageMetaChanged.length) {
          changes.imageMeta = { changed: imageMetaChanged };
        }

        // 视频：计算集合差
        const evVidIds  = new Set((ev.videos || []).map(v => typeof v === 'string' ? v : (v.id || v.url || '')));
        const appVidIds = new Set(((applied.resources || {}).videos || []).map(v => v.id || v.url || ''));
        const vidsAdded   = [...evVidIds].filter(id => !appVidIds.has(id));
        const vidsRemoved = [...appVidIds].filter(id => !evVidIds.has(id));
        if (vidsAdded.length || vidsRemoved.length)
          changes.videos = { added: vidsAdded, removed: vidsRemoved };

        // 地点：比较 name + country
        const evLoc  = `${localizedText((ev.location || {}).name)}|${localizedText((ev.location || {}).country)}`;
        const appLoc = `${localizedText((applied.location || {}).name)}|${localizedText((applied.location || {}).country)}`;
        if (evLoc !== appLoc)
          changes.location = {
            from: localizedText((applied.location || {}).name),
            to:   localizedText((ev.location  || {}).name),
          };

        // 人物：计算增删
        const figureName = f => localizedText(f.name);
        const evFigNames  = new Set((ev.figures || []).map(figureName));
        const appFigNames = new Set((applied.figures || []).map(figureName));
        const figsAdded   = (ev.figures || []).filter(f => !appFigNames.has(figureName(f))).map(figureName);
        const figsRemoved = (applied.figures || []).filter(f => !evFigNames.has(figureName(f))).map(figureName);
        if (figsAdded.length || figsRemoved.length)
          changes.figures = { added: figsAdded, removed: figsRemoved };

        if (Object.keys(changes).length > 0) {
          modified.push({ key, title: localizedText(ev.title) || key, year: ev.year, changes });
        } else {
          unchanged.push(key);
        }
      }

      // 分类顺序对比
      const appliedCategoryOrder = [];
      const seen = {};
      for (const m of appliedMilestones) {
        const categoryName = localizedText(m.category);
        if (categoryName && !seen[categoryName]) { seen[categoryName] = true; appliedCategoryOrder.push(categoryName); }
      }
      const newCategoryOrder = (catalog.categories || []).map(c => localizedText(c.name));
      const categoryChanged  = JSON.stringify(newCategoryOrder) !== JSON.stringify(appliedCategoryOrder);

      json(res, {
        added:   added.map(k => ({
          key: k, title: localizedText((eventsMap[k] || {}).title) || k,
          year: (eventsMap[k] || {}).year,
          location: localizedText(((eventsMap[k] || {}).location || {}).name),
          figureCount: ((eventsMap[k] || {}).figures || []).length,
          imageCount:  ((eventsMap[k] || {}).images  || []).length,
          videoCount:  ((eventsMap[k] || {}).videos  || []).length,
        })),
        removed: removed.map(k => ({
          key: k, title: localizedText((appliedMap[k] || {}).title) || k,
          year: (appliedMap[k] || {}).year,
          category: localizedText((appliedMap[k] || {}).category),
        })),
        modified,
        unchanged,
        categoryChanged,
        newCategoryOrder,
        appliedCategoryOrder,
      });
    } catch (e) { err(res, e.message); }
  },

  // 初始化新事件的资源目录：POST /api/events/init  { key: "yyyy-slug" }
  'POST /api/events/init': async (req, res) => {
    try {
      const { key } = await readBody(req);
      if (!key || /[^a-zA-Z0-9_\-]/.test(key)) { err(res, '非法 key', 400); return; }
      const IMG_SUBDIRS = ['historical', 'people', 'papers', 'architecture'];
      const imgBase = path.join(ROOT, 'resources', 'images', key);
      for (const sub of IMG_SUBDIRS) {
        mkdirp(path.join(imgBase, sub));
      }
      const videoFile = path.join(ROOT, 'resources', 'videos', `${key}.json`);
      if (!fs.existsSync(videoFile)) {
        mkdirp(path.join(ROOT, 'resources', 'videos'));
        atomicWrite(videoFile, JSON.stringify({
          candidate_videos: [],
          total_count: 0,
        }, null, 2));
      }
      json(res, { ok: true, key, createdDirs: IMG_SUBDIRS.map(s => `resources/images/${key}/${s}`) });
    } catch (e) { err(res, e.message); }
  },

  'POST /api/generate': (req, res) => {
    const script = path.join(MANAGE, 'generate.js');
    execFile(process.execPath, [script], { cwd: ROOT }, (error, stdout, stderr) => {
      json(res, { ok: !error, stdout: stdout || '', stderr: stderr || '', exitCode: error ? error.code : 0 });
    });
  },

  // 备份列表：GET /api/backups
  'GET /api/backups': (req, res) => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) { json(res, []); return; }
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.bak'))
        .sort()
        .reverse()
        .map(name => {
          const stat = fs.statSync(path.join(BACKUP_DIR, name));
          // 从文件名解析原始文件名（去掉 .时间戳.bak）
          const base = name.replace(/\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.bak$/, '');
          return { name, file: base, size: stat.size, mtime: stat.mtime.toISOString() };
        });
      json(res, files);
    } catch (e) { err(res, e.message); }
  },

  // 恢复备份：POST /api/backups/restore  { name: "events.js.2026-03-17T10-30-00.bak" }
  'POST /api/backups/restore': async (req, res) => {
    try {
      const { name } = await readBody(req);
      if (!name || !/^[\w.\-]+\.bak$/.test(name)) { err(res, '非法文件名', 400); return; }
      const src  = path.join(BACKUP_DIR, name);
      if (!fs.existsSync(src)) { err(res, '备份文件不存在', 404); return; }
      // 判断恢复到哪个目标文件
      const base   = name.replace(/\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.bak$/, '');
      const managedFiles = new Set(['catalog.js', 'events.js']);
      const generatedFiles = new Set(['milestones-data.js', 'milestones-data-default.js']);
      if (!managedFiles.has(base) && !generatedFiles.has(base)) {
        err(res, '只支持恢复 catalog.js / events.js / milestones-data.js / milestones-data-default.js', 400);
        return;
      }
      const dest = managedFiles.has(base) ? path.join(MANAGE, base) : path.join(ROOT, base);
      backupFile(dest); // 恢复前先备份当前版本
      fs.copyFileSync(src, dest);
      json(res, { ok: true, restored: base });
    } catch (e) { err(res, e.message); }
  },
};

// ─── 服务器主循环 ─────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  const routeKey = `${req.method} ${req.url.split('?')[0]}`;
  const handler  = routes[routeKey];

  if (handler) {
    Promise.resolve(handler(req, res)).catch(e => err(res, e.message));
    return;
  }

  // 静态文件：/resources/... → 映射到项目根目录
  const urlPath = req.url.split('?')[0];
  if (req.method === 'GET' && urlPath.startsWith('/resources/')) {
    const filePath = path.join(ROOT, urlPath.slice(1)); // 去掉开头 /
    // 安全：禁止路径穿越
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!fs.existsSync(filePath))   { res.writeHead(404); res.end('Not found'); return; }
    const ext      = path.extname(filePath).toLowerCase();
    const mimeType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=3600' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✓ 管理服务器已启动`);
  console.log(`  http://localhost:${PORT}/admin`);
});
