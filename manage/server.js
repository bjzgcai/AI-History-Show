#!/usr/bin/env node
// 内容管理服务器
// 用法：node manage/server.js
// 访问：http://localhost:3001/admin

'use strict';

const http         = require('http');
const https        = require('https');
const fs           = require('fs');
const path         = require('path');
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
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
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
    try { writeEvents(await readBody(req)); json(res, { ok: true }); }
    catch (e) { err(res, e.message); }
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
