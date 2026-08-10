#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');

const HOST = '127.0.0.1';

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort() {
    const server = net.createServer();
    server.unref();
    server.listen(0, HOST);
    await once(server, 'listening');
    const address = server.address();
    const port = String(address.port);
    server.close();
    await once(server, 'close');
    return port;
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
    const port = await getFreePort();
    const child = startProcess(process.execPath, ['scripts/static-server.js'], {
        HOST,
        PORT: port
    });

    try {
        const index = await waitForHttp(`http://${HOST}:${port}/`);
        assert.match(await index.text(), /AI\s*历史回顾展览|milestones-data/i);

        const retiredDualEntry = await fetch(`http://${HOST}:${port}/dual-screen.html`);
        assert.equal(retiredDualEntry.status, 404);

        const indexPreview = await waitForHttp(`http://${HOST}:${port}/?archivePreview=1`);
        const indexPreviewHtml = await indexPreview.text();
        assert.doesNotMatch(indexPreviewHtml, /milestones-data-archive-preview\.js/);
        assert.match(indexPreviewHtml, /milestones-data\.js/);

        const data = await waitForHttp(`http://${HOST}:${port}/milestones-data.js`);
        assert.match(await data.text(), /const\s+milestones\s*=/);

        console.log('PASS static presentation startup validation');
    } finally {
        await stopProcess(child);
    }
}

async function validateAdminServer() {
    const port = await getFreePort();
    const child = startProcess(process.execPath, ['manage/server.js'], {
        PORT: port
    });

    try {
        const admin = await waitForHttp(`http://${HOST}:${port}/admin`);
        const adminHtml = await admin.text();
        assert.match(adminHtml, /Archive Entity Editor/);
        assert.match(adminHtml, /Storylines/);
        assert.match(adminHtml, /Figures/);
        assert.match(adminHtml, /Figure Audit/);
        assert.match(adminHtml, /生成运行时数据/);
        assert.equal(admin.headers.get('access-control-allow-origin'), null);

        const adminCss = await waitForHttp(`http://${HOST}:${port}/admin.css`);
        assert.equal(adminCss.headers.get('content-type'), 'text/css; charset=utf-8');
        const adminJs = await waitForHttp(`http://${HOST}:${port}/admin.js`);
        assert.match(await adminJs.text(), /api\/archive\/figure-usage/);

        const adminHead = await fetch(`http://${HOST}:${port}/admin`, { method: 'HEAD' });
        assert.equal(adminHead.status, 200);
        assert.equal(await adminHead.text(), '');

        const crossOriginPreflight = await fetch(`http://${HOST}:${port}/api/archive/file`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'https://example.com',
                'Access-Control-Request-Method': 'POST'
            }
        });
        assert.equal(crossOriginPreflight.status, 405);
        assert.equal(crossOriginPreflight.headers.get('access-control-allow-origin'), null);

        const crossOriginWrite = await fetch(`http://${HOST}:${port}/api/archive/storyline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                Origin: 'https://example.com'
            },
            body: JSON.stringify({ storylineId: 'humanistic-cycle', data: { id: 'humanistic-cycle' } })
        });
        assert.equal(crossOriginWrite.status, 403);

        const archiveEvents = await waitForHttp(`http://${HOST}:${port}/api/archive/events`);
        const archiveEventList = await archiveEvents.json();
        assert.ok(Array.isArray(archiveEventList) && archiveEventList.length > 0);
        assert.equal(typeof archiveEventList[0].used, 'boolean');
        assert.equal(typeof archiveEventList[0].usageCount, 'number');

        const storylines = await waitForHttp(`http://${HOST}:${port}/api/archive/storylines`);
        const storylineList = await storylines.json();
        assert.equal(storylineList.length, 4);
        assert.equal(
            storylineList.some((storyline) => storyline.id === 'bench-council-ai100-2022-2023'),
            false
        );
        const humanisticStoryline = storylineList.find((storyline) => storyline.id === 'humanistic-cycle');
        assert.ok(humanisticStoryline);
        assert.equal(humanisticStoryline.used, true);
        assert.ok(humanisticStoryline.enabledEventCount > 0);

        const storylineResponse = await waitForHttp(
            `http://${HOST}:${port}/api/archive/storyline?storylineId=humanistic-cycle`
        );
        const storylineData = await storylineResponse.json();
        assert.equal(storylineData.data.id, 'humanistic-cycle');

        const eventFileResponse = await waitForHttp(
            `http://${HOST}:${port}/api/archive/file?eventId=1956-dartmouth&file=event.json`
        );
        const eventFileData = await eventFileResponse.json();
        assert.equal(eventFileData.data.id, '1956-dartmouth');
        assert.match(eventFileData.revision, /^[a-f0-9]{64}$/);

        const eventDisplayTargets = await waitForHttp(
            `http://${HOST}:${port}/api/archive/event-display-targets?eventId=1956-dartmouth`
        );
        const eventDisplayTargetData = await eventDisplayTargets.json();
        assert.ok(eventDisplayTargetData.some((target) => target.milestoneId));

        const figuresResponse = await waitForHttp(`http://${HOST}:${port}/api/archive/figures`);
        const figuresData = await figuresResponse.json();
        assert.ok(Array.isArray(figuresData.items) && figuresData.items.length > 300);
        assert.match(figuresData.revision, /^[a-f0-9]{64}$/);
        assert.ok(figuresData.items.some((figure) => figure.id === 'michael-i-jordan'));
        assert.equal(typeof figuresData.items[0].used, 'boolean');
        assert.equal(typeof figuresData.items[0].usageCount, 'number');

        const figureResponse = await waitForHttp(`http://${HOST}:${port}/api/archive/figure?figureId=michael-i-jordan`);
        const figureData = await figureResponse.json();
        assert.equal(figureData.data.name.en, 'Michael I. Jordan');
        assert.match(figureData.data.disambiguation.en, /computer scientist/i);

        const figureUsage = await waitForHttp(
            `http://${HOST}:${port}/api/archive/figure-usage?figureId=michael-i-jordan`
        );
        const figureUsageData = await figureUsage.json();
        assert.ok(figureUsageData.events.includes('1986-rnn'));
        assert.ok(figureUsageData.events.includes('2003-lda'));
        const rnnEventDetail = figureUsageData.eventDetails.find((event) => event.eventId === '1986-rnn');
        assert.ok(rnnEventDetail);
        assert.ok(rnnEventDetail.displayTargets.some((target) => target.milestoneId));

        const figureAssets = await waitForHttp(
            `http://${HOST}:${port}/api/archive/figure-assets?figureId=michael-i-jordan&eventId=1986-rnn`
        );
        const figureAssetData = await figureAssets.json();
        assert.ok(figureAssetData.some((asset) => asset.eventId === '1986-rnn'));
        assert.ok(figureAssetData.every((asset) => asset.source && asset.rights));
        assert.ok(figureAssetData.every((asset) => Array.isArray(asset.relationUsages)));

        const staleDefaultAvatarWrite = await fetch(`http://${HOST}:${port}/api/archive/figure-default-avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                figureId: 'michael-i-jordan',
                eventId: '1986-rnn',
                assetId: figureAssetData[0].id,
                expectedRevision: '0'.repeat(64)
            })
        });
        assert.equal(staleDefaultAvatarWrite.status, 409);
        assert.match((await staleDefaultAvatarWrite.json()).error, /changed since it was loaded/i);

        const figureAudit = await waitForHttp(`http://${HOST}:${port}/api/archive/figure-audit`);
        const figureAuditData = await figureAudit.json();
        assert.equal(figureAuditData.summary.figures, figuresData.items.length);
        assert.ok(Array.isArray(figureAuditData.categories));

        const staleFigureWrite = await fetch(`http://${HOST}:${port}/api/archive/figure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                figureId: 'michael-i-jordan',
                data: figureData.data,
                expectedRevision: '0'.repeat(64)
            })
        });
        assert.equal(staleFigureWrite.status, 409);
        assert.match((await staleFigureWrite.json()).error, /changed since it was loaded/i);

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

        const oversizedWrite = await fetch(`http://${HOST}:${port}/api/archive/storyline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storylineId: 'startup-oversized-probe',
                data: { id: 'startup-oversized-probe', padding: 'x'.repeat(16 * 1024 * 1024) }
            })
        });
        assert.equal(oversizedWrite.status, 413);

        const traversal = await fetch(
            `http://${HOST}:${port}/api/archive/storyline?storylineId=${encodeURIComponent('../package')}`
        );
        assert.equal(traversal.status, 400);
        assert.match((await traversal.json()).error, /Invalid archive storylineId|path traversal/i);

        for (const [method, pathname] of [
            ['GET', '/archive-admin'],
            ['GET', '/api/events'],
            ['POST', '/api/events'],
            ['POST', '/api/generate']
        ]) {
            const retiredRoute = await fetch(`http://${HOST}:${port}${pathname}`, { method });
            assert.equal(retiredRoute.status, 404, `${method} ${pathname} must be retired`);
        }

        const resource = await waitForHttp(`http://${HOST}:${port}/resources/images/ui/brand.png`);
        assert.equal(resource.headers.get('content-type'), 'image/png');

        const generate = await fetch(`http://${HOST}:${port}/api/archive/generate`, { method: 'POST' });
        assert.equal(generate.status, 200);
        const generateResult = await generate.json();
        assert.equal(generateResult.ok, true);
        assert.match(generateResult.stdout, /生成完成|内容未变化/);

        console.log('PASS Archive-only admin startup validation');
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
