'use strict';

const fs = require('fs');
const path = require('path');

const QUOTE_META_FIELDS = ['speaker', 'workTitle', 'workAuthors', 'sourceLabel', 'sourceUrl'];
const SUPPORTED_LOCALES = ['en', 'zh'];
const DEFAULT_LOCALE = 'zh';
const MILESTONE_ID_PREFIX = 'milestone-';

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function isLocalizedText(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && SUPPORTED_LOCALES.some((locale) => hasOwn(value, locale)));
}

function getLocalizedText(value, locale = DEFAULT_LOCALE) {
  if (!isLocalizedText(value)) return String(value || '').trim();
  return String(value[locale] || value[DEFAULT_LOCALE] || value.en || value.zh || '').trim();
}

function detectVideoSource(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/bilibili\.com/.test(url)) return 'Bilibili';
  if (/vimeo\.com/.test(url)) return 'Vimeo';
  return 'Web';
}

function deriveEmbedUrl(url) {
  const yt = String(url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const bili = String(url || '').match(/bilibili\.com\/video\/(BV[A-Za-z0-9]+)/);
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
  const vimeo = String(url || '').match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function normalizeQuoteText(text) {
  let value = String(text || '').trim();
  if (!value) return '';
  if (value.startsWith('"')) value = value.slice(1).trimStart();
  if (value.endsWith('"')) value = value.slice(0, -1).trimEnd();
  return value;
}

function normalizeEditableQuoteMeta(meta, options = {}) {
  const preserveKeys = Boolean(options.preserveKeys);
  const source = meta && typeof meta === 'object' ? meta : null;
  const normalized = {};
  let hasValue = false;

  for (const field of QUOTE_META_FIELDS) {
    const value = source && hasOwn(source, field) ? String(source[field] || '').trim() : '';
    if (value) hasValue = true;
    if (value || preserveKeys) normalized[field] = value;
  }

  return hasValue || preserveKeys ? normalized : {};
}

function mergeEditableQuoteMeta(eventMeta, candidateMeta, options = {}) {
  const preserveKeys = Boolean(options.preserveKeys);
  const hasEventMeta = Boolean(eventMeta && typeof eventMeta === 'object');
  const eventSource = hasEventMeta ? eventMeta : null;
  const candidateSource = candidateMeta && typeof candidateMeta === 'object' ? candidateMeta : null;
  const merged = {};
  let hasValue = false;

  for (const field of QUOTE_META_FIELDS) {
    const rawValue = eventSource && hasOwn(eventSource, field)
      ? eventSource[field]
      : (candidateSource && hasOwn(candidateSource, field) ? candidateSource[field] : '');
    const value = String(rawValue || '').trim();
    if (value) hasValue = true;
    if (value || preserveKeys || hasEventMeta) merged[field] = value;
  }

  return hasValue || preserveKeys || hasEventMeta ? merged : {};
}

function formatQuoteAttribution(candidate) {
  const safeCandidate = candidate && typeof candidate === 'object' ? candidate : {};
  const workTitle = String(safeCandidate.workTitle || '').trim();
  const workAuthors = String(safeCandidate.workAuthors || '').trim();
  const speaker = String(safeCandidate.speaker || '').trim();

  if (workTitle) {
    return workAuthors ? `《${workTitle}》, ${workAuthors}` : `《${workTitle}》`;
  }

  return speaker;
}

function loadQuoteCandidates(filePath, options = {}) {
  const fallback = options.fallback || { events: {} };
  if (!filePath || !fs.existsSync(filePath)) return fallback;

  try {
    if (options.fresh) {
      delete require.cache[require.resolve(filePath)];
    }
    return require(filePath).quoteCandidates || fallback;
  } catch (_) {
    return fallback;
  }
}

function backupFile(filePath, options = {}) {
  if (!fs.existsSync(filePath)) return null;

  const backupDir = options.backupDir || path.join(path.dirname(filePath), '.backups');
  const maxBackups = options.maxBackups || 5;
  fs.mkdirSync(backupDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const name = path.basename(filePath);
  const dest = path.join(backupDir, `${name}.${ts}.bak`);
  fs.copyFileSync(filePath, dest);

  const all = fs.readdirSync(backupDir)
    .filter((fileName) => fileName.startsWith(`${name}.`) && fileName.endsWith('.bak'))
    .sort();
  for (const old of all.slice(0, -maxBackups)) {
    try { fs.unlinkSync(path.join(backupDir, old)); } catch (_) {}
  }

  return dest;
}

module.exports = {
  DEFAULT_LOCALE,
  MILESTONE_ID_PREFIX,
  QUOTE_META_FIELDS,
  SUPPORTED_LOCALES,
  backupFile,
  deriveEmbedUrl,
  detectVideoSource,
  formatQuoteAttribution,
  getLocalizedText,
  hasOwn,
  isLocalizedText,
  loadQuoteCandidates,
  mergeEditableQuoteMeta,
  normalizeEditableQuoteMeta,
  normalizeQuoteText,
};
