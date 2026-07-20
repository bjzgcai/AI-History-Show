#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, '.tmp', 'archive-parity');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.PARITY_BASE_URL || 'http://127.0.0.1:18081';
const AUTHORITIES = ['legacy', 'archive'];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class Cdp {
    constructor(url) {
        this.url = url;
        this.id = 0;
        this.pending = new Map();
        this.events = [];
    }

    async connect() {
        this.socket = new globalThis.WebSocket(this.url);
        await new Promise((resolve, reject) => {
            this.socket.addEventListener('open', resolve, { once: true });
            this.socket.addEventListener('error', reject, { once: true });
        });
        this.socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.id && this.pending.has(message.id)) {
                const { resolve, reject } = this.pending.get(message.id);
                this.pending.delete(message.id);
                if (message.error) reject(new Error(message.error.message));
                else resolve(message.result || {});
                return;
            }
            this.events.push(message);
        });
    }

    send(method, params = {}) {
        const id = ++this.id;
        this.socket.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    }

    close() {
        if (!this.socket) return Promise.resolve();
        return new Promise((resolve) => {
            const socket = this.socket;
            const timeout = setTimeout(resolve, 1000);
            socket.addEventListener(
                'close',
                () => {
                    clearTimeout(timeout);
                    resolve();
                },
                { once: true }
            );
            socket.close();
        });
    }
}

async function launchChrome(outputDir) {
    const profile = path.join(outputDir, 'chrome-profile');
    fs.rmSync(profile, { recursive: true, force: true });
    const chrome = spawn(
        CHROME,
        [
            '--headless=new',
            '--disable-gpu',
            '--hide-scrollbars',
            '--no-first-run',
            '--no-default-browser-check',
            '--remote-debugging-port=9223',
            `--user-data-dir=${profile}`,
            'about:blank'
        ],
        { stdio: 'ignore' }
    );
    for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
            const response = await fetch('http://127.0.0.1:9223/json/version');
            if (response.ok) return chrome;
        } catch (_) {}
        await sleep(100);
    }
    chrome.kill();
    throw new Error('Chrome CDP did not start.');
}

async function newPage(authority, locale, width, height) {
    const response = await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' });
    const target = await response.json();
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.connect();
    await Promise.all([
        cdp.send('Page.enable'),
        cdp.send('Runtime.enable'),
        cdp.send('Network.enable'),
        cdp.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: width <= 500
        })
    ]);
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `localStorage.setItem('ai-history-locale', ${JSON.stringify(locale)});`
    });
    return cdp;
}

function pagePath(spec) {
    const page = spec.layout === 'dual' ? 'dual-screen.html' : 'index.html';
    const params = new globalThis.URLSearchParams({ layout: spec.layout });
    if (spec.storyline) params.set('storyline', spec.storyline);
    if (spec.event && spec.layout === 'single' && spec.storyline !== 'gaming-ai') {
        params.set('uiMode', 'detail');
        params.set('event', spec.event);
    }
    return `${page}?${params}`;
}

function semanticScript(spec) {
    const branchKey = String(spec.event || '').replace(/^milestone-gaming-ai-/, '');
    return `(() => {
      const text = (selector) => Array.from(document.querySelectorAll(selector)).map((node) => (node.innerText || node.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
      const attrs = (selector, name) => Array.from(document.querySelectorAll(selector)).map((node) => node.getAttribute(name) || '');
      const result = {
        title: document.title,
        bodyClass: document.body.className,
        stageClass: document.querySelector('#stage')?.className || document.querySelector('.single-stage')?.className || '',
        detailTitle: text('.ui-detail-title'),
        detailYear: text('.ui-detail-year'),
        detailDescription: text('.ui-detail-description'),
        branchTitles: text('.branch-event-title'),
        branchKeys: attrs('.branch-event', 'data-branch-event-key'),
        branchPapers: text('.branch-element-group'),
        archiveTitle: text('#archiveTitle'),
        archiveYear: text('#archiveYear'),
        figures: text('.figure-name, .figure-card-name, .ui-detail-people-name'),
        commentary: text('.commentary-item, .commentary-section, #commentaryList'),
        sources: text('.achievement-source-item, .source-item, .branch-source-item'),
        quizzes: text('.quick-quiz, .quiz-card'),
        images: attrs('img', 'src').filter(Boolean),
        brokenImages: Array.from(document.images).filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src),
        dimensions: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }
      };
      const target = document.querySelector('[data-branch-event-key=${JSON.stringify(branchKey)}]');
      if (target) { target.scrollIntoView({ block: 'center', inline: 'center' }); result.branchTarget = (target.innerText || '').replace(/\\s+/g, ' ').trim(); }
      return result;
    })()`;
}

async function loadState(cdp, url, spec, screenshotPath) {
    cdp.events.length = 0;
    await cdp.send('Page.navigate', { url });
    for (let attempt = 0; attempt < 120; attempt += 1) {
        const ready = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
        if (ready.result && ready.result.value === 'complete') break;
        await sleep(100);
    }
    await sleep(spec.layout === 'dual' ? 1600 : 900);
    if (spec.layout === 'dual' && spec.index > 0) {
        await cdp.send('Runtime.evaluate', {
            expression: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`,
            returnByValue: true
        });
        for (let i = 1; i < spec.index; i += 1) {
            await cdp.send('Runtime.evaluate', {
                expression: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`,
                returnByValue: true
            });
        }
        await sleep(250);
    }
    const evaluation = await cdp.send('Runtime.evaluate', {
        expression: semanticScript(spec),
        returnByValue: true,
        awaitPromise: true
    });
    const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    fs.writeFileSync(screenshotPath, Buffer.from(capture.data, 'base64'));
    const errors = cdp.events
        .filter(
            (event) =>
                event.method === 'Runtime.exceptionThrown' ||
                (event.method === 'Log.entryAdded' && event.params.entry.level === 'error') ||
                (event.method === 'Network.loadingFailed' && !event.params.canceled)
        )
        .map((event) => ({ method: event.method, params: event.params }));
    return { semantic: evaluation.result.value, errors };
}

async function closePage(cdp) {
    try {
        await cdp.send('Page.close');
    } catch (_) {}
    await cdp.close();
}

function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, item]) => [key, stable(item)])
        );
    }
    return value;
}

function makeSpecs(legacy) {
    const storylineOf = (item) =>
        typeof item.storyline === 'string' ? item.storyline : item.storyline?.id || 'deep-learning';
    const specs = [];
    for (const locale of ['zh', 'en']) {
        for (const storyline of ['unified-ai-history', 'deep-learning-history', 'bench-council-ai100', 'gaming-ai']) {
            specs.push({
                key: `single-overview-${storyline}-${locale}`,
                layout: 'single',
                storyline,
                locale,
                width: 1920,
                height: 1080,
                index: 0
            });
        }
        for (const item of legacy) {
            const rawStoryline = storylineOf(item);
            const storyline = rawStoryline === 'deep-learning' ? 'deep-learning-history' : rawStoryline;
            specs.push({
                key: `single-${item.id}-${locale}`,
                layout: 'single',
                storyline,
                event: item.id,
                locale,
                width: 1920,
                height: 1080,
                index: legacy.indexOf(item)
            });
        }
        for (const item of legacy.filter((entry) => storylineOf(entry) === 'gaming-ai')) {
            specs.push({
                key: `mobile-${item.id}-${locale}`,
                layout: 'single',
                storyline: 'gaming-ai',
                event: item.id,
                locale,
                width: 390,
                height: 844,
                index: 0
            });
        }
        const dualSamples = [0, Math.floor((legacy.length - 1) / 2), legacy.length - 1];
        for (const index of dualSamples) {
            const item = legacy[index];
            specs.push({
                key: `dual-${String(index).padStart(3, '0')}-${locale}`,
                layout: 'dual',
                storyline: '',
                event: item.id,
                locale,
                width: 3840,
                height: 1080,
                index
            });
        }
    }
    return specs;
}

async function main() {
    fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
    const runId = new Date().toISOString().replace(/[:.]/g, '-');
    const runOutput = path.join(OUTPUT_ROOT, runId);
    fs.mkdirSync(runOutput, { recursive: true });
    const legacy = require(
        path.join(ROOT, 'reports', 'archive-parity', 'data', 'milestones-data-legacy.js')
    ).milestones;
    const specs = makeSpecs(legacy);
    const chrome = await launchChrome(runOutput);
    const results = [];
    try {
        for (let index = 0; index < specs.length; index += 1) {
            const spec = specs[index];
            const row = { spec, authorities: {} };
            for (const authority of AUTHORITIES) {
                const cdp = await newPage(authority, spec.locale, spec.width, spec.height);
                const url = `${BASE_URL}/${authority}/${pagePath(spec)}`;
                const screenshot = path.join(runOutput, authority, `${spec.key}.png`);
                try {
                    row.authorities[authority] = await loadState(cdp, url, spec, screenshot);
                } catch (error) {
                    row.authorities[authority] = { semantic: null, errors: [{ message: error.message }] };
                } finally {
                    await closePage(cdp);
                }
            }
            const same =
                JSON.stringify(stable(row.authorities.legacy.semantic)) ===
                JSON.stringify(stable(row.authorities.archive.semantic));
            const hasErrors = AUTHORITIES.some((authority) => row.authorities[authority].errors.length > 0);
            row.status = hasErrors ? 'FAIL' : same ? 'PASS' : 'REVIEW';
            results.push(row);
            if ((index + 1) % 25 === 0 || index === specs.length - 1)
                console.log(`Browser parity: ${index + 1}/${specs.length}`);
        }
    } finally {
        chrome.kill();
    }
    const counts = Object.fromEntries(
        ['PASS', 'REVIEW', 'FAIL'].map((status) => [status, results.filter((row) => row.status === status).length])
    );
    fs.writeFileSync(
        path.join(runOutput, 'browser-results.json'),
        `${JSON.stringify({ generatedAt: new Date().toISOString(), counts, results }, null, 2)}\n`
    );
    const lines = [
        '# Archive Parity Browser Review',
        '',
        `- Total states: ${results.length}`,
        `- PASS: ${counts.PASS}`,
        `- REVIEW: ${counts.REVIEW}`,
        `- FAIL: ${counts.FAIL}`,
        '',
        '## REVIEW / FAIL',
        ''
    ];
    for (const row of results.filter((item) => item.status !== 'PASS')) {
        lines.push(`- **${row.status}** \`${row.spec.key}\``);
        if (row.authorities.legacy.errors.length)
            lines.push(`  - Legacy errors: ${JSON.stringify(row.authorities.legacy.errors)}`);
        if (row.authorities.archive.errors.length)
            lines.push(`  - Archive errors: ${JSON.stringify(row.authorities.archive.errors)}`);
    }
    fs.writeFileSync(path.join(runOutput, 'browser-summary.md'), `${lines.join('\n')}\n`);
    console.log(`Browser parity summary: ${path.relative(ROOT, path.join(runOutput, 'browser-summary.md'))}`);
    console.log(`PASS ${counts.PASS}, REVIEW ${counts.REVIEW}, FAIL ${counts.FAIL}`);
    if (counts.FAIL > 0) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
});
