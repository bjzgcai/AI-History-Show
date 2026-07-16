#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'reports', 'archive-parity', 'data');
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4'
};

function getArg(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const host = getArg('host', '127.0.0.1');
const port = Number(getArg('port', '18081'));

function safeRootPath(relativePath) {
    const filePath = path.resolve(ROOT, relativePath);
    return filePath === ROOT || filePath.startsWith(`${ROOT}${path.sep}`) ? filePath : null;
}

function resolveFile(pathname) {
    if (pathname === '/' || pathname === '/archive-parity-compare.html') {
        return path.join(ROOT, 'archive-parity-compare.html');
    }
    if (pathname === '/parity-manifest.json') return path.join(DATA_DIR, 'manifest.json');

    const match = pathname.match(/^\/(legacy|archive)(?:\/(.*))?$/);
    if (match) {
        const authority = match[1];
        const relative = match[2] || 'index.html';
        if (relative === 'milestones-data.js' || relative === 'milestones-data-default.js') {
            return path.join(DATA_DIR, `milestones-data-${authority}.js`);
        }
        return safeRootPath(relative);
    }
    return safeRootPath(pathname.replace(/^\/+/, ''));
}

const server = http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405).end('Method not allowed');
        return;
    }
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
    } catch (_) {
        response.writeHead(400).end('Bad request');
        return;
    }
    const filePath = resolveFile(pathname);
    if (!filePath) {
        response.writeHead(403).end('Forbidden');
        return;
    }
    fs.stat(filePath, (error, stat) => {
        if (error || !stat.isFile()) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
            return;
        }
        response.writeHead(200, {
            'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        if (request.method === 'HEAD') {
            response.end();
            return;
        }
        fs.createReadStream(filePath).pipe(response);
    });
});

server.listen(port, host, () => {
    console.log(`Archive parity server listening at http://${host}:${port}`);
    console.log(`Compare: http://${host}:${port}/archive-parity-compare.html`);
    console.log(`Legacy:  http://${host}:${port}/legacy/index.html`);
    console.log(`Archive: http://${host}:${port}/archive/index.html`);
});
