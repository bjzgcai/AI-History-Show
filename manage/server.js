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

/** 根据 URL 检测视频平台 */
function detectVideoSource(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/bilibili\.com/.test(url))          return 'Bilibili';
  if (/vimeo\.com/.test(url))             return 'Vimeo';
  return 'Web';
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

// ─── 备份 + 原子写 ────────────────────────────────────────────────────────────

const BACKUP_DIR  = path.join(MANAGE, '.backups');
const MAX_BACKUPS = 5;

/** 备份文件到 manage/.backups/，最多保留 MAX_BACKUPS 份 */
function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  mkdirp(BACKUP_DIR);
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const name = path.basename(filePath);
  const dest = path.join(BACKUP_DIR, `${name}.${ts}.bak`);
  fs.copyFileSync(filePath, dest);
  // 只保留最新 MAX_BACKUPS 份，删除多余的
  const all = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(name + '.') && f.endsWith('.bak'))
    .sort();
  for (const old of all.slice(0, -MAX_BACKUPS)) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch (_) {}
  }
  return dest;
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
    try { json(res, freshRequire(path.join(MANAGE, 'events.js'))); }
    catch (e) { err(res, e.message); }
  },

  'POST /api/events': async (req, res) => {
    try {
      const eventsData = await readBody(req);
      const videosDir  = path.join(ROOT, 'resources', 'videos');

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
              let catalog = null;
              if (fs.existsSync(jsonPath)) {
                try { catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (_) {}
              }
              if (!catalog || typeof catalog !== 'object') {
                catalog = { event_id: eventKey, event_title: ev.title || eventKey, year: ev.year || 0, candidate_videos: [], total_count: 0, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
              }
              if (!Array.isArray(catalog.candidate_videos)) catalog.candidate_videos = [];
              const alreadyExists = catalog.candidate_videos.some(v => v.url === item);
              if (!alreadyExists) {
                catalog.candidate_videos.push({ url: item, title: '', source: detectVideoSource(item) });
                catalog.total_count = catalog.candidate_videos.length;
                mkdirp(videosDir);
                atomicWrite(jsonPath, JSON.stringify(catalog, null, 2));
              }
            }
            return item; // 字符串原样保留
          }
          if (typeof item !== 'object') return item;
          // 无 url 且无 id → 丢弃（无效条目）
          if (!item.id && !item.url) return null;

          // 写入 candidate_videos JSON
          const jsonPath = path.join(videosDir, `${eventKey}.json`);
          let catalog = null;
          if (fs.existsSync(jsonPath)) {
            try { catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (_) {}
          }
          if (!catalog || typeof catalog !== 'object') {
            catalog = {
              event_id:         eventKey,
              event_title:      ev.title || eventKey,
              year:             ev.year  || 0,
              candidate_videos: [],
              total_count:      0,
              created_at:       new Date().toISOString().slice(0, 19).replace('T', ' '),
            };
          }
          if (!Array.isArray(catalog.candidate_videos)) catalog.candidate_videos = [];

          if (item.id) {
            // YouTube 视频：按 id 去重，写入后规范化为纯字符串 ID
            const alreadyExists = catalog.candidate_videos.some(v => v.id === item.id);
            if (!alreadyExists) {
              catalog.candidate_videos.push({
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
              });
              catalog.total_count = catalog.candidate_videos.length;
              mkdirp(videosDir);
              atomicWrite(jsonPath, JSON.stringify(catalog, null, 2));
            }
            return item.id; // 规范化为纯字符串 ID
          } else {
            // 非 YouTube 视频（Bilibili 等）：按 url 去重，写入 JSON，events 中保留对象
            const alreadyExists = catalog.candidate_videos.some(v => v.url === item.url);
            if (!alreadyExists) {
              catalog.candidate_videos.push({
                url:    item.url,
                title:  item.title  || '',
                source: item.source || 'Web',
              });
              catalog.total_count = catalog.candidate_videos.length;
              mkdirp(videosDir);
              atomicWrite(jsonPath, JSON.stringify(catalog, null, 2));
            }
            return item.url; // 规范化为纯字符串 URL
          }
        }).filter(Boolean);
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
        const src = fs.readFileSync(milestonePath, 'utf8');
        // const 顶级声明不会成为 sandbox 属性，替换为 var 使其可读取
        const sandbox = {};
        vm.runInNewContext(src.replace(/\bconst\s+(milestones)\b/, 'var $1'), sandbox);
        appliedMilestones = sandbox.milestones || [];
      } catch (e) {
        json(res, { firstGeneration: true, parseError: e.message, newKeys });
        return;
      }

      // applied map: key → milestone
      const appliedMap = {};
      for (const m of appliedMilestones) {
        if (m.id && m.id.startsWith('milestone-')) {
          appliedMap[m.id.slice('milestone-'.length)] = m;
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
        if (String(ev.title || '') !== String(applied.title || ''))
          changes.title = { from: applied.title || '', to: ev.title || '' };
        if (String(ev.year  || '') !== String(applied.year  || ''))
          changes.year  = { from: applied.year,         to: ev.year };

        // 描述：记录完整前后内容
        if (String(ev.description || '') !== String(applied.description || ''))
          changes.description = { from: applied.description || '', to: ev.description || '' };

        // 引言文本（quoteText + quotePage → applied.quote）：重建 quote HTML 后比较
        const evQuoteText = ev.quoteText || '';
        const evQuotePage = ev.quotePage || '';
        const rebuildQuote = (text, page) => {
          if (!text) return '';
          const body = text.replace(/\n/g, '<br>');
          const src  = page ? `<br><br><span style="font-size: 0.9vw; color: var(--accent);">— ${page}</span>` : '';
          return `"${body}"${src}`;
        };
        const rebuiltQuote = rebuildQuote(evQuoteText, evQuotePage);
        if (rebuiltQuote !== String(applied.quote || ''))
          changes.quote = { from: applied.quote || '', quoteText: evQuoteText, quotePage: evQuotePage };

        // 图片：计算集合差
        const evImgSet  = new Set(ev.images || []);
        const appImgSet = new Set((applied.resources || {}).images || []);
        const imgsAdded   = [...evImgSet].filter(p => !appImgSet.has(p));
        const imgsRemoved = [...appImgSet].filter(p => !evImgSet.has(p));
        if (imgsAdded.length || imgsRemoved.length)
          changes.images = { added: imgsAdded, removed: imgsRemoved };

        // 视频：计算集合差
        const evVidIds  = new Set((ev.videos || []).map(v => typeof v === 'string' ? v : (v.id || v.url || '')));
        const appVidIds = new Set(((applied.resources || {}).videos || []).map(v => v.id || v.url || ''));
        const vidsAdded   = [...evVidIds].filter(id => !appVidIds.has(id));
        const vidsRemoved = [...appVidIds].filter(id => !evVidIds.has(id));
        if (vidsAdded.length || vidsRemoved.length)
          changes.videos = { added: vidsAdded, removed: vidsRemoved };

        // 地点：比较 name + country
        const evLoc  = `${(ev.location || {}).name || ''}|${(ev.location || {}).country || ''}`;
        const appLoc = `${(applied.location || {}).name || ''}|${(applied.location || {}).country || ''}`;
        if (evLoc !== appLoc)
          changes.location = {
            from: (applied.location || {}).name || '',
            to:   (ev.location  || {}).name || '',
          };

        // 人物：计算增删
        const evFigNames  = new Set((ev.figures || []).map(f => f.name));
        const appFigNames = new Set((applied.figures || []).map(f => f.name));
        const figsAdded   = (ev.figures || []).filter(f => !appFigNames.has(f.name)).map(f => f.name);
        const figsRemoved = (applied.figures || []).filter(f => !evFigNames.has(f.name)).map(f => f.name);
        if (figsAdded.length || figsRemoved.length)
          changes.figures = { added: figsAdded, removed: figsRemoved };

        if (Object.keys(changes).length > 0) {
          modified.push({ key, title: ev.title || key, year: ev.year, changes });
        } else {
          unchanged.push(key);
        }
      }

      // 分类顺序对比
      const appliedCategoryOrder = [];
      const seen = {};
      for (const m of appliedMilestones) {
        if (m.category && !seen[m.category]) { seen[m.category] = true; appliedCategoryOrder.push(m.category); }
      }
      const newCategoryOrder = (catalog.categories || []).map(c => c.name);
      const categoryChanged  = JSON.stringify(newCategoryOrder) !== JSON.stringify(appliedCategoryOrder);

      json(res, {
        added:   added.map(k => ({
          key: k, title: (eventsMap[k] || {}).title || k,
          year: (eventsMap[k] || {}).year,
          location: ((eventsMap[k] || {}).location || {}).name || '',
          figureCount: ((eventsMap[k] || {}).figures || []).length,
          imageCount:  ((eventsMap[k] || {}).images  || []).length,
          videoCount:  ((eventsMap[k] || {}).videos  || []).length,
        })),
        removed: removed.map(k => ({
          key: k, title: (appliedMap[k] || {}).title || k,
          year: (appliedMap[k] || {}).year,
          category: (appliedMap[k] || {}).category || '',
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
      const allowed = ['catalog.js', 'events.js'];
      if (!allowed.includes(base)) { err(res, '只支持恢复 catalog.js / events.js', 400); return; }
      const dest = path.join(MANAGE, base);
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
