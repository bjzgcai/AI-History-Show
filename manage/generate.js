#!/usr/bin/env node
// 生成脚本：读取 catalog.js + events.js，输出 milestones-data.js / milestones-data-default.js
// 用法：node manage/generate.js
//
// 无需安装任何依赖，直接运行即可。

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── 路径配置 ────────────────────────────────────────────────────────────────

const ROOT       = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT, 'resources', 'videos');
const OUTPUTS    = [
  path.join(ROOT, 'milestones-data.js'),
  path.join(ROOT, 'milestones-data-default.js'),
];
const AVATAR_REGISTRY_PATH = path.join(__dirname, 'figure-avatars.js');
const RESEARCH_CANDIDATES_PATH = path.join(ROOT, 'resources', 'research-candidates.js');
const QUOTE_CANDIDATES_PATH = path.join(ROOT, 'resources', 'quote-candidates.js');
const {
  MILESTONE_ID_PREFIX,
  SUPPORTED_LOCALES,
  backupFile,
  deriveEmbedUrl,
  detectVideoSource,
  formatQuoteAttribution,
  getLocalizedText,
  isLocalizedText,
  loadQuoteCandidates,
  mergeEditableQuoteMeta,
  normalizeQuoteText,
} = require('../shared/utils.js');

const { categories } = require('./catalog.js');
const eventsMap      = require('./events.js');
const avatarRegistry = loadAvatarRegistry();
const researchCandidates = loadResearchCandidates();
const quoteCandidates = loadQuoteCandidates(QUOTE_CANDIDATES_PATH);

// ─── 视频元数据缓存 ──────────────────────────────────────────────────────────

/** 读取 resources/videos/{key}.json，返回 candidate_videos 数组；文件不存在返回 null */
function loadVideoCatalog(key) {
  const file = path.join(VIDEOS_DIR, `${key}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data.candidate_videos || [];
  } catch (e) {
    console.warn(`[警告] 无法解析视频文件 ${file}: ${e.message}`);
    return null;
  }
}

/** 从视频目录中按 ID 查找视频，返回精简的视频对象 */
function lookupVideo(catalog, id, key) {
  const entry = catalog.find(v => v.id === id);
  if (!entry) {
    console.warn(`[警告] 事件 "${key}": 在视频目录中找不到 ID "${id}"，已跳过。`);
    return null;
  }
  // 只输出前端需要的字段
  return {
    id:        entry.id,
    url:       entry.url,
    embed_url: entry.embed_url,
    title:     entry.title,
    channel:   entry.channel,
    duration:  entry.duration,
    thumbnail: entry.thumbnail,
    source:    entry.source || 'YouTube',
  };
}

// ─── 构建里程碑数组 ──────────────────────────────────────────────────────────

const milestones = [];

for (const cat of categories) {
  for (const key of cat.events) {
    const ev = eventsMap[key];
    if (!ev) {
      console.warn(`[警告] catalog.js 中引用了 "${key}"，但 events.js 中不存在该事件，已跳过。`);
      continue;
    }

    const curatedQuote = selectCuratedQuote(key, ev);

    // 构建视频列表（支持字符串 ID 和 URL 对象两种格式）
    const videos = [];
    let   catalog = null; // 懒加载，仅当存在字符串 ID 时才读取 JSON

    for (const item of ev.videos || []) {
      if (typeof item === 'string') {
        if (item.startsWith('http://') || item.startsWith('https://')) {
          // 完整 URL（Bilibili 等）：先查 JSON 候选列表，找不到则直接构建
          if (catalog === null) catalog = loadVideoCatalog(key);
          const fromCatalog = catalog && catalog.find(v => v.url === item);
          if (fromCatalog) {
            videos.push({
              id:        fromCatalog.id || fromCatalog.url,
              url:       fromCatalog.url,
              embed_url: fromCatalog.embed_url || deriveEmbedUrl(fromCatalog.url),
              title:     fromCatalog.title    || '',
              channel:   fromCatalog.channel  || '',
              duration:  fromCatalog.duration || '',
              thumbnail: fromCatalog.thumbnail || '',
              source:    fromCatalog.source   || detectVideoSource(fromCatalog.url),
            });
          } else {
            videos.push({
              id:        item,
              url:       item,
              embed_url: deriveEmbedUrl(item),
              title:     '',
              channel:   '',
              duration:  '',
              thumbnail: '',
              source:    detectVideoSource(item),
            });
          }
        } else {
          // 短字符串：YouTube ID，从 resources/videos/{key}.json 查找元数据
          if (catalog === null) {
            catalog = loadVideoCatalog(key);
            if (catalog === null) {
              console.warn(`[警告] 事件 "${key}" 包含视频 ID，但 resources/videos/${key}.json 不存在，字符串 ID 已跳过。`);
            }
          }
          if (catalog) {
            const v = lookupVideo(catalog, item, key);
            if (v) videos.push(v);
          }
        }
      } else if (item && typeof item === 'object' && item.url) {
        // 对象：直接使用 URL，自动推导 embed_url 和 source
        videos.push({
          id:        item.id || item.url,
          url:       item.url,
          embed_url: item.embed_url || deriveEmbedUrl(item.url),
          title:     item.title     || '',
          channel:   item.channel   || '',
          duration:  item.duration  || '',
          thumbnail: item.thumbnail || '',
          source:    item.source    || detectVideoSource(item.url),
        });
      }
    }

    milestones.push({
      id:          `${MILESTONE_ID_PREFIX}${key}`,
      year:        ev.year,
      category:    cat.name,
      title:       ev.title,
      subtitle:    cat.subtitle,
      location:    ev.location,
      description: ev.description,
      figures:     (ev.figures || []).map(enrichFigure),
      photos:      [],   // 预留字段，暂不使用
      videoUrl:    videos[0] ? (videos[0].embed_url || videos[0].url || '') : '',
      quote:       buildQuote(curatedQuote.text),
      quoteAttribution: curatedQuote.attribution,
      quoteMeta:   curatedQuote.meta,
      quotePage:   ev.quotePage || '',
      commentarySections: buildCommentarySectionsOverride(key, ev),
      resources: {
        images: ev.images || [],
        imageMeta: ev.imageMeta || {},
        videos,
      },
    });
  }
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/** 头像注册表允许缺失，这样生成脚本在资源未准备齐时也不会直接报错 */
function loadAvatarRegistry() {
  if (!fs.existsSync(AVATAR_REGISTRY_PATH)) {
    console.warn('[警告] manage/figure-avatars.js 不存在，已跳过头像注册表补全。');
    return {};
  }

  return require('./figure-avatars.js');
}

function loadResearchCandidates() {
  if (!fs.existsSync(RESEARCH_CANDIDATES_PATH)) {
    return { events: {} };
  }

  try {
    return require(RESEARCH_CANDIDATES_PATH).researchCandidates || { events: {} };
  } catch (error) {
    console.warn(`[警告] 无法加载候选研究素材 ${RESEARCH_CANDIDATES_PATH}: ${error.message}`);
    return { events: {} };
  }
}

/** 给人物条目补上显式头像信息 */
function enrichFigure(figure) {
  const safeFigure = figure && typeof figure === 'object' ? figure : {};
  const registryEntry = safeFigure.name ? avatarRegistry[safeFigure.name] || {} : {};

  return {
    ...safeFigure,
    avatar: safeFigure.avatar || registryEntry.avatar || '',
    avatarStyle: safeFigure.avatarStyle || registryEntry.avatarStyle || '',
    figureType: safeFigure.figureType || registryEntry.type || 'person',
  };
}

function getExplicitLocalizedText(value, locale) {
  if (!isLocalizedText(value) || !Object.prototype.hasOwnProperty.call(value, locale)) return '';
  return String(value[locale] || '').trim();
}

function buildCommentarySectionsOverride(key, ev) {
  const entry = researchCandidates.events && researchCandidates.events[key];
  if (!entry) {
    return [];
  }

  const explicitSections = Array.isArray(entry.displayCommentarySections)
    ? entry.displayCommentarySections
    : [];

  const fallbackSections = [];
  const backgroundText = entry.candidateTexts && entry.candidateTexts.background
    ? String(entry.candidateTexts.background.text || '').trim()
    : '';
  const extensionText = entry.candidateTexts && entry.candidateTexts.extension
    ? String(entry.candidateTexts.extension.text || '').trim()
    : '';

  if (backgroundText) {
    fallbackSections.push({
      label: '背景解读',
      text: backgroundText,
    });
  }

  if (extensionText) {
    fallbackSections.push({
      label: '延展说明',
      text: extensionText,
    });
  }

  const sourceSections = explicitSections.length > 0 ? explicitSections : fallbackSections;

  return sourceSections
    .map((section, index) => {
      const zhText = getLocalizedText(section.text, 'zh');
      const explicitEnLabel = getExplicitLocalizedText(section.label, 'en');
      const explicitEnText = getExplicitLocalizedText(section.text, 'en');
      const fallbackEnText = index === 0 ? getLocalizedText(ev && ev.description, 'en') : '';
      return {
        label: {
          en: explicitEnLabel || (index === 0 ? 'Background' : 'Context'),
          zh: getLocalizedText(section.label, 'zh'),
        },
        html: {
          en: explicitEnText || fallbackEnText,
          zh: zhText,
        },
      };
    })
    .filter((section) => section.label.zh && section.html.zh);
}

function mapLocalizedText(value, transform) {
  if (!isLocalizedText(value)) return transform(String(value || ''));
  const result = {};
  for (const locale of SUPPORTED_LOCALES) {
    const text = getLocalizedText(value, locale);
    result[locale] = transform(text, locale);
  }
  return result;
}

function selectCuratedQuote(key, ev) {
  const candidates = quoteCandidates.events && quoteCandidates.events[key];
  const first = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : null;
  const candidateQuote = first && typeof first === 'object' ? String(first.quote || '').trim() : '';
  const effectiveMeta = mergeEditableQuoteMeta(ev && ev.quoteMeta, first);
  const eventQuote = ev && ev.quoteText;
  const quoteText = isLocalizedText(eventQuote)
    ? {
        en: candidateQuote || getLocalizedText(eventQuote, 'en'),
        zh: getLocalizedText(eventQuote, 'zh') || candidateQuote || getLocalizedText(eventQuote, 'en'),
      }
    : (candidateQuote || getLocalizedText(eventQuote));

  return {
    text: quoteText,
    attribution: formatQuoteAttribution(effectiveMeta),
    meta: effectiveMeta,
  };
}

/** 将纯文本引言组装成 HTML 字符串（\n → <br>）*/
function buildQuote(text) {
  return mapLocalizedText(text, (value) => {
    const normalizedText = normalizeQuoteText(value);
    if (!normalizedText) return '';
    const body = normalizedText.replace(/\n/g, '<br>');
    return `"${body}"`;
  });
}

// ─── 写出文件 ────────────────────────────────────────────────────────────────

function backupOutput(file) {
  backupFile(file, { backupDir: path.join(ROOT, 'manage', '.backups'), maxBackups: 5 });
}

function buildOutputContent(now) {
  return [
    `// AI 历史里程碑数据（由脚本自动生成，请勿手动编辑）`,
    `// 生成时间: ${now}`,
    `// 数据来源: manage/catalog.js  +  manage/events.js  +  resources/videos/`,
    ``,
    `const milestones = ${JSON.stringify(milestones, null, 2)};`,
    ``,
    `// 导出（兼容 Node.js require）`,
    `if (typeof module !== 'undefined' && module.exports) {`,
    `  module.exports = { milestones };`,
    `}`,
    ``,
  ].join('\n');
}

function validateAvatarAssets(items) {
  const missing = [];
  const seen = new Set();

  for (const milestone of items) {
    for (const figure of milestone.figures || []) {
      const avatar = String(figure.avatar || '').trim();
      if (!avatar) continue;
      if (seen.has(avatar)) continue;
      seen.add(avatar);

      const absolutePath = path.isAbsolute(avatar)
        ? avatar
        : path.join(ROOT, avatar);

      if (!fs.existsSync(absolutePath)) {
        missing.push({
          avatar,
          milestoneId: milestone.id,
          figureName: figure.name || '未知人物',
        });
      }
    }
  }

  return missing;
}

const missingAvatarAssets = validateAvatarAssets(milestones);
const now     = new Date().toISOString().replace('T', ' ').slice(0, 16);
const content = buildOutputContent(now);

for (const file of OUTPUTS) {
  backupOutput(file);
  fs.writeFileSync(file, content, 'utf8');
}

for (const item of missingAvatarAssets) {
  console.warn(`[警告] 头像文件不存在：${item.avatar}（${item.milestoneId} / ${item.figureName}）`);
}

for (const file of OUTPUTS) {
  console.log(`✓ 生成完成：${file}`);
}
console.log(`  共 ${categories.length} 个分类，${milestones.length} 个事件`);
if (missingAvatarAssets.length > 0) {
  console.log(`  头像资源缺失：${missingAvatarAssets.length}`);
}
