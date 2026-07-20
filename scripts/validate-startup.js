#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { LEGACY_WRITE_ROUTES } = require('../manage/authority-boundary.js');

const HOST = '127.0.0.1';

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function startProcess(command, args, env) {
    const child = spawn(command, args, {
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => process.stdout.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));

    return child;
}

async function waitForHttp(url, attempts = 40) {
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            lastError = new Error(`${url} returned ${response.status}`);
        } catch (error) {
            lastError = error;
        }

        await wait(250);
    }

    throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function stopProcess(child) {
    if (child.exitCode !== null) return;
    child.kill('SIGTERM');
    const exited = await Promise.race([once(child, 'exit').then(() => true), wait(3000).then(() => false)]);

    if (!exited && child.exitCode === null) {
        child.kill('SIGKILL');
        await once(child, 'exit');
    }
}

async function validateStaticServer() {
    const port = '18080';
    const child = startProcess(process.execPath, ['scripts/static-server.js'], {
        HOST,
        PORT: port
    });

    try {
        const index = await waitForHttp(`http://${HOST}:${port}/`);
        assert.match(await index.text(), /AI\s*历史回顾展览|milestones-data/i);

        const dual = await waitForHttp(`http://${HOST}:${port}/dual-screen.html`);
        assert.match(await dual.text(), /dual|milestones/i);

        const indexPreview = await waitForHttp(`http://${HOST}:${port}/?archivePreview=1`);
        const indexPreviewHtml = await indexPreview.text();
        assert.doesNotMatch(indexPreviewHtml, /milestones-data-archive-preview\.js/);
        assert.match(indexPreviewHtml, /milestones-data\.js/);

        const dualPreview = await waitForHttp(`http://${HOST}:${port}/dual-screen.html?archivePreview=1`);
        assert.doesNotMatch(await dualPreview.text(), /milestones-data-archive-preview\.js/);

        const data = await waitForHttp(`http://${HOST}:${port}/milestones-data.js`);
        assert.match(await data.text(), /const\s+milestones\s*=/);

        console.log('PASS static presentation startup validation');
    } finally {
        await stopProcess(child);
    }
}

async function validateAdminServer() {
    const port = '13001';
    const child = startProcess(process.execPath, ['manage/server.js'], {
        PORT: port
    });

    try {
        const admin = await waitForHttp(`http://${HOST}:${port}/admin`);
        const adminHtml = await admin.text();
        assert.match(adminHtml, /Legacy 内容查看（只读）/);
        assert.doesNotMatch(adminHtml, /POST.*\/api\/(?:events|catalog|generate)/);

        const archiveAdmin = await waitForHttp(`http://${HOST}:${port}/archive-admin`);
        const archiveAdminHtml = await archiveAdmin.text();
        assert.match(archiveAdminHtml, /Archive Entity Editor/);
        assert.match(archiveAdminHtml, /Storylines/);

        const archiveEvents = await waitForHttp(`http://${HOST}:${port}/api/archive/events`);
        const archiveEventList = await archiveEvents.json();
        assert.ok(Array.isArray(archiveEventList) && archiveEventList.length > 0);

        const storylines = await waitForHttp(`http://${HOST}:${port}/api/archive/storylines`);
        const storylineIds = await storylines.json();
        assert.ok(storylineIds.includes('humanistic-cycle'));

        const storylineResponse = await waitForHttp(
            `http://${HOST}:${port}/api/archive/storyline?storylineId=humanistic-cycle`
        );
        const storylineData = await storylineResponse.json();
        assert.equal(storylineData.data.id, 'humanistic-cycle');

        const invalidStorylineData = await fetch(`http://${HOST}:${port}/api/archive/storyline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storylineId: 'humanistic-cycle', data: [] })
        });
        assert.equal(invalidStorylineData.status, 400);
        assert.match((await invalidStorylineData.json()).error, /must be a JSON object/i);

        const mismatchedStoryline = await fetch(`http://${HOST}:${port}/api/archive/storyline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storylineId: 'humanistic-cycle',
                data: { ...storylineData.data, id: 'wrong-storyline' }
            })
        });
        assert.equal(mismatchedStoryline.status, 400);
        assert.match((await mismatchedStoryline.json()).error, /data\.id must match storylineId/i);

        const traversal = await fetch(
            `http://${HOST}:${port}/api/archive/storyline?storylineId=${encodeURIComponent('../package')}`
        );
        assert.equal(traversal.status, 400);
        assert.match((await traversal.json()).error, /Invalid archive storylineId|path traversal/i);

        const legacyWrite = await fetch(`http://${HOST}:${port}/api/generate`, { method: 'POST' });
        assert.equal(legacyWrite.status, 403);
        assert.match((await legacyWrite.json()).error, /Legacy admin is read-only/);
        assert.ok(LEGACY_WRITE_ROUTES.has('POST /api/generate'));

        const resource = await waitForHttp(`http://${HOST}:${port}/resources/images/ui/brand.png`);
        assert.equal(resource.headers.get('content-type'), 'image/png');

        console.log('PASS admin authority boundary startup validation');
    } finally {
        await stopProcess(child);
    }
}

(async () => {
    await validateStaticServer();
    await validateAdminServer();
    console.log('All startup checks passed.');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
