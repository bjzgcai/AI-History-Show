#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function getArg(name, fallback) {
    const flag = `--${name}`;
    const index = process.argv.indexOf(flag);
    if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
    return process.env[name.toUpperCase()] || fallback;
}

const host = getArg('host', '0.0.0.0');
const port = Number(getArg('port', process.env.PORT || '8000'));

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error(`Invalid port: ${port}`);
    process.exit(1);
}

function resolveRequestPath(url) {
    let parsed;
    let pathname;

    try {
        parsed = new URL(url, `http://${host}:${port}`);
        pathname = decodeURIComponent(parsed.pathname);
    } catch (_) {
        return null;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(ROOT, relativePath);

    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
        return null;
    }

    return filePath;
}

const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method not allowed');
        return;
    }

    const filePath = resolveRequestPath(req.url);
    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (statError, stat) => {
        if (statError || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });

        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(port, host, () => {
    console.log(`Static presentation server listening at http://${host}:${port}`);
});
