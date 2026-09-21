'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const fixtureRoot = path.resolve(
    process.env.AI_HISTORY_ADMIN_TEST_ROOT || path.join(projectRoot, '.tmp', 'admin-browser-fixture')
);
const temporaryRoot = path.join(projectRoot, '.tmp');

function linkTree(source, destination) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);
        if (entry.isDirectory()) linkTree(sourcePath, destinationPath);
        else if (entry.isFile()) fs.linkSync(sourcePath, destinationPath);
    }
}

if (!fixtureRoot.startsWith(`${temporaryRoot}${path.sep}`)) {
    throw new Error(`Admin browser fixture must stay under ${temporaryRoot}`);
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });
fs.mkdirSync(fixtureRoot, { recursive: true });
fs.cpSync(path.join(projectRoot, 'archive'), path.join(fixtureRoot, 'archive'), { recursive: true });
for (const name of ['milestones-data.js', 'milestones-data-default.js']) {
    fs.copyFileSync(path.join(projectRoot, name), path.join(fixtureRoot, name));
}
linkTree(path.join(projectRoot, 'resources'), path.join(fixtureRoot, 'resources'));
for (const name of ['.nojekyll', 'index.html', 'shared', 'public']) {
    const source = path.join(projectRoot, name);
    const type = fs.statSync(source).isDirectory() ? 'dir' : 'file';
    fs.symlinkSync(source, path.join(fixtureRoot, name), type);
}

const proxyHost = process.env.HOST || '127.0.0.1';
const proxyPort = Number(process.env.PORT || 43118);
const backendPort = proxyPort + 1;
const adminPrefix = '/nested-admin';

process.env.HOST = proxyHost;
process.env.PORT = String(backendPort);
process.env.AI_HISTORY_ARCHIVE_ROOT = fixtureRoot;

require('../../manage/server');

const proxy = http.createServer((req, res) => {
    let upstreamPath = req.url || '/';
    if (upstreamPath === adminPrefix || upstreamPath === `${adminPrefix}/`) {
        res.writeHead(308, { Location: `${adminPrefix}/admin` });
        res.end();
        return;
    }
    if (upstreamPath.startsWith(`${adminPrefix}/`)) {
        upstreamPath = upstreamPath.slice(adminPrefix.length) || '/';
    }

    const upstream = http.request(
        {
            host: proxyHost,
            port: backendPort,
            method: req.method,
            path: upstreamPath,
            headers: req.headers
        },
        (upstreamResponse) => {
            res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
            upstreamResponse.pipe(res);
        }
    );
    upstream.on('error', (error) => {
        if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(error.message);
    });
    req.pipe(upstream);
});

proxy.listen(proxyPort, proxyHost, () => {
    console.log(`Admin test proxy listening at http://${proxyHost}:${proxyPort}${adminPrefix}/admin`);
});
