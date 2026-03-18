#!/usr/bin/env node
// 生成脚本：读取 catalog.js + events.js，输出 milestones-data.js
// 用法：node manage/generate.js
//
// 无需安装任何依赖，直接运行即可。

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── 路径配置 ────────────────────────────────────────────────────────────────

const ROOT       = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT, 'resources', 'videos');
const OUTPUT     = path.join(ROOT, 'milestones-data.js');

const { categories } = require('./catalog.js');
const eventsMap      = require('./events.js');

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
              source:    fromCatalog.source   || detectSource(fromCatalog.url),
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
              source:    detectSource(item),
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
          source:    item.source    || detectSource(item.url),
        });
      }
    }

    milestones.push({
      id:          `milestone-${key}`,
      year:        ev.year,
      category:    cat.name,
      title:       ev.title,
      subtitle:    cat.subtitle,
      location:    ev.location,
      description: ev.description,
      figures:     ev.figures || [],
      photos:      [],   // 预留字段，暂不使用
      videoUrl:    "",   // 预留字段，暂不使用
      quote:       buildQuote(ev.quoteText, ev.quotePage),
      resources: {
        images: ev.images || [],
        videos,
      },
    });
  }
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/** 根据 URL 自动推导 embed_url */
function deriveEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const bili = url.match(/bilibili\.com\/video\/(BV[A-Za-z0-9]+)/);
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

/** 根据 URL 检测来源平台 */
function detectSource(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/bilibili\.com/.test(url))          return 'Bilibili';
  if (/vimeo\.com/.test(url))             return 'Vimeo';
  return 'Web';
}

/** 将纯文本引言 + 来源说明 组装成 HTML 字符串（\n → <br>）*/
function buildQuote(text, page) {
  if (!text) return '';
  const body = text.replace(/\n/g, '<br>');
  const src  = page
    ? `<br><br><span style="font-size: 0.9vw; color: var(--accent);">— ${page}</span>`
    : '';
  return `"${body}"${src}`;
}

// ─── 写出文件 ────────────────────────────────────────────────────────────────

// 备份旧的输出文件（最多保留5份）
const BACKUP_DIR = path.join(ROOT, 'manage', '.backups');
if (fs.existsSync(OUTPUT)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dest = path.join(BACKUP_DIR, `milestones-data.js.${ts}.bak`);
  fs.copyFileSync(OUTPUT, dest);
  const all = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('milestones-data.js.') && f.endsWith('.bak'))
    .sort();
  for (const old of all.slice(0, -5)) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch (_) {}
  }
}

const now     = new Date().toISOString().replace('T', ' ').slice(0, 16);
const content = [
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

fs.writeFileSync(OUTPUT, content, 'utf8');

console.log(`✓ 生成完成：${OUTPUT}`);
console.log(`  共 ${categories.length} 个分类，${milestones.length} 个事件`);
