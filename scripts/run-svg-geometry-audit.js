#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, '.tmp', 'archive-reports', 'svg-explainer-review');
const REVIEW_URL =
    process.env.SVG_REVIEW_URL || 'http://127.0.0.1:8002/.tmp/archive-reports/svg-explainer-review/review.html';
const OUTPUT_NAME = process.env.SVG_GEOMETRY_OUTPUT_NAME || 'geometry.json';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function decodeHtml(value) {
    return String(value || '')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function issueSummary(results) {
    const counts = {};
    for (const result of results) {
        for (const issue of result.issues || []) {
            counts[issue.type] = (counts[issue.type] || 0) + 1;
        }
    }
    return counts;
}

function main() {
    const run = childProcess.spawnSync(
        CHROME,
        [
            '--headless=new',
            '--disable-gpu',
            '--no-sandbox',
            '--enable-logging=stderr',
            '--virtual-time-budget=30000',
            '--dump-dom',
            REVIEW_URL
        ],
        { cwd: ROOT, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }
    );
    if (run.error) throw run.error;
    if (run.status !== 0) {
        throw new Error(`Chrome geometry audit failed (${run.status}): ${run.stderr}`);
    }
    if (!/data-audit-complete="true"/.test(run.stdout)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(path.join(OUTPUT_DIR, 'chrome-dump.html'), run.stdout);
        fs.writeFileSync(path.join(OUTPUT_DIR, 'chrome-stderr.txt'), run.stderr || '');
        throw new Error('Chrome returned before the SVG geometry audit completed.');
    }

    const match = run.stdout.match(/<script id="svg-audit-results" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) throw new Error('SVG geometry results were not found in the rendered document.');
    const results = JSON.parse(decodeHtml(match[1]));
    const output = {
        generatedAt: new Date().toISOString(),
        reviewUrl: REVIEW_URL,
        svgCount: results.length,
        affectedSvgCount: results.filter((result) => (result.issues || []).length > 0).length,
        issueCounts: issueSummary(results),
        results
    };
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, OUTPUT_NAME), `${JSON.stringify(output, null, 2)}\n`);
    console.log(`SVG geometry audit: ${output.svgCount}`);
    console.log(`Flagged SVGs: ${output.affectedSvgCount}`);
    console.log(`Issues: ${JSON.stringify(output.issueCounts)}`);
}

if (require.main === module) main();
