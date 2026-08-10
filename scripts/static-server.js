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
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.aac': 'audio/aac',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg'
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

function parseByteRange(range, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || size <= 0 || (!match[1] && !match[2])) return null;

    if (!match[1]) {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
        return { start: Math.max(size - suffixLength, 0), end: size - 1 };
    }

    const start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : size - 1;
    if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(requestedEnd) ||
        start < 0 ||
        start >= size ||
        requestedEnd < start
    ) {
        return null;
    }

    return { start, end: Math.min(requestedEnd, size - 1) };
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
        const headers = {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Accept-Ranges': 'bytes'
        };

        const range = req.headers.range;
        if (range) {
            const parsedRange = parseByteRange(range, stat.size);
            if (!parsedRange) {
                res.writeHead(416, {
                    ...headers,
                    'Content-Range': `bytes */${stat.size}`
                });
                res.end();
                return;
            }

            const { start, end } = parsedRange;

            res.writeHead(206, {
                ...headers,
                'Content-Length': end - start + 1,
                'Content-Range': `bytes ${start}-${end}/${stat.size}`
            });

            if (req.method === 'HEAD') {
                res.end();
                return;
            }

            const rangeStream = fs.createReadStream(filePath, { start, end });
            rangeStream.on('error', (error) => res.destroy(error));
            rangeStream.pipe(res);
            return;
        }

        res.writeHead(200, { ...headers, 'Content-Length': stat.size });

        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', (error) => {
            if (res.headersSent) {
                res.destroy(error);
                return;
            }

            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal server error');
        });
        stream.pipe(res);
    });
});

if (require.main === module) {
    server.listen(port, host, () => {
        console.log(`Static presentation server listening at http://${host}:${port}`);
    });
}

module.exports = { parseByteRange };
