#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildArchivePreview } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, '.tmp', 'archive-review', 'archive-review-snapshot.json');
const OUTPUT_PATH = path.join(ROOT, '.tmp', 'archive-review', 'archive-review.html');

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function localize(value, locale) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value == null ? '' : String(value);
    return value[locale] || value.zh || value.en || '';
}

function oneLine(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function imagesOf(item) {
    return item && item.resources && Array.isArray(item.resources.images) ? item.resources.images : [];
}

function sourcesOf(item) {
    return item && item.achievement && Array.isArray(item.achievement.sources) ? item.achievement.sources : [];
}

function claimsOf(item) {
    return item && item.achievement && Array.isArray(item.achievement.claims) ? item.achievement.claims : [];
}

function quizzesOf(item) {
    return item && Array.isArray(item.quizzes) ? item.quizzes : [];
}

function visualOf(item) {
    return (item && item.achievement && item.achievement.visual) || '';
}

function card(label, item) {
    if (!item) {
        return `<section class="column empty"><h3>${esc(label)}</h3><p>No target data.</p></section>`;
    }

    return `<section class="column">
        <h3>${esc(label)}</h3>
        <dl>
            <dt>id</dt><dd><code>${esc(item.id || '')}</code></dd>
            <dt>title zh</dt><dd>${esc(localize(item.title, 'zh'))}</dd>
            <dt>title en</dt><dd>${esc(localize(item.title, 'en'))}</dd>
            <dt>description zh</dt><dd>${esc(oneLine(localize(item.description, 'zh'))).slice(0, 700)}</dd>
            <dt>description en</dt><dd>${esc(oneLine(localize(item.description, 'en'))).slice(0, 700)}</dd>
            <dt>visual</dt><dd><code>${esc(visualOf(item))}</code></dd>
        </dl>
        ${imageBlock(item)}
        ${sourceBlock(item)}
        ${claimBlock(item)}
        ${quizBlock(item)}
    </section>`;
}

function imageBlock(item) {
    const images = imagesOf(item);
    if (images.length === 0) return '<h4>Images</h4><p class="muted">None.</p>';
    return `<h4>Images (${images.length})</h4><div class="images">${images
        .map(
            (src) =>
                `<figure><img src="${esc(src)}" loading="lazy" onerror="this.closest('figure').classList.add('broken')"><figcaption>${esc(src)}</figcaption></figure>`
        )
        .join('')}</div>`;
}

function sourceBlock(item) {
    const sources = sourcesOf(item);
    if (sources.length === 0) return '<h4>Sources</h4><p class="muted">None.</p>';
    return `<h4>Sources (${sources.length})</h4><ul>${sources
        .map(
            (source) =>
                `<li><code>${esc(source.id || source.sourceType || '')}</code> ${esc(localize(source.label, 'en') || localize(source.label, 'zh'))}</li>`
        )
        .join('')}</ul>`;
}

function claimBlock(item) {
    const claims = claimsOf(item);
    if (claims.length === 0) return '<h4>Claims</h4><p class="muted">None.</p>';
    return `<h4>Claims (${claims.length})</h4><ul>${claims
        .map((claim) => `<li><code>${esc(claim.id || '')}</code> ${esc(localize(claim.text, 'en'))}</li>`)
        .join('')}</ul>`;
}

function quizBlock(item) {
    const quizzes = quizzesOf(item);
    if (quizzes.length === 0) return '<h4>Quizzes</h4><p class="muted">None.</p>';
    return `<h4>Quizzes (${quizzes.length})</h4><ul>${quizzes
        .map((quiz) => `<li><code>${esc(quiz.id || '')}</code> ${esc(localize(quiz.question, 'en'))}</li>`)
        .join('')}</ul>`;
}

function diffBadge(row) {
    const cls = row.status === 'applied' ? 'ok' : 'warn';
    const text = row.status === 'applied' ? 'overlay applied' : `skipped: ${row.reason}`;
    return `<span class="badge ${cls}">${esc(text)}</span>`;
}

function rowSection(row) {
    return `<article class="review-row" id="${esc(row.archiveEventId)}-${esc(row.archiveVariantId)}">
        <header>
            <div>
                <h2>${esc(row.archiveEventId)} <span>/ ${esc(row.archiveVariantId)}</span></h2>
                <p><code>${esc(row.id || '')}</code> · storyline <code>${esc(row.storylineId)}</code></p>
            </div>
            ${diffBadge(row)}
        </header>
        <div class="columns">
            ${card('Legacy milestone', row.legacy)}
            ${card('Archive preview', row.archivePreview)}
            ${card('Generated final', row.final)}
        </div>
    </article>`;
}

function buildRows(snapshot) {
    const rows = Array.isArray(snapshot.rows) ? snapshot.rows : [];
    return rows.map(rowSection).join('\n');
}

function loadSnapshot() {
    if (fs.existsSync(SNAPSHOT_PATH)) return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    const preview = buildArchivePreview(ROOT);
    return {
        generatedAt: new Date().toISOString(),
        applied: [],
        skipped: preview.milestones.map((item) => ({
            id: item.id,
            archiveEventId: item.archiveEventId,
            archiveVariantId: item.archiveVariantId,
            reason: 'run npm run generate to capture legacy/final snapshots'
        })),
        errors: preview.errors,
        rows: preview.milestones.map((item) => ({
            id: item.id,
            archiveEventId: item.archiveEventId,
            archiveVariantId: item.archiveVariantId,
            storylineId: item.storyline.id,
            status: 'skipped',
            reason: 'run npm run generate to capture legacy/final snapshots',
            legacy: null,
            archivePreview: item,
            final: null
        }))
    };
}

const snapshot = loadSnapshot();
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Archive Migration Review</title>
<style>
:root { color-scheme: dark; --bg:#101114; --panel:#181a20; --line:#30343d; --text:#f2efe7; --muted:#a9adba; --accent:#f68900; --ok:#3fb950; --warn:#d29922; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
main { max-width: 1680px; margin:0 auto; padding:32px 24px 64px; }
h1 { margin:0 0 8px; font-size:32px; }
a { color: #8ab4ff; }
.summary { color:var(--muted); margin-bottom:24px; }
.review-row { border:1px solid var(--line); border-radius:16px; margin:24px 0; background:rgba(255,255,255,.02); overflow:hidden; }
.review-row > header { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; padding:18px 20px; border-bottom:1px solid var(--line); background:#14161b; }
h2 { margin:0; font-size:22px; } h2 span { color:var(--muted); font-weight:500; } header p { margin:4px 0 0; color:var(--muted); }
.badge { display:inline-flex; align-items:center; border-radius:999px; padding:6px 10px; font-weight:700; white-space:nowrap; }
.badge.ok { background:rgba(63,185,80,.16); color:var(--ok); } .badge.warn { background:rgba(210,153,34,.16); color:var(--warn); }
.columns { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; background:var(--line); }
.column { background:var(--panel); padding:18px; min-width:0; } .column.empty { color:var(--muted); }
h3 { margin:0 0 12px; color:var(--accent); } h4 { margin:18px 0 8px; }
dl { display:grid; grid-template-columns:110px minmax(0,1fr); gap:6px 10px; margin:0; } dt { color:var(--muted); } dd { margin:0; overflow-wrap:anywhere; }
code { color:#f2cc60; }
ul { margin:0; padding-left:18px; } li { margin:4px 0; overflow-wrap:anywhere; }
.images { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; }
figure { margin:0; border:1px solid var(--line); border-radius:10px; overflow:hidden; background:#0d0e11; }
figure.broken { border-color:#9e3a3a; }
img { display:block; width:100%; height:96px; object-fit:cover; background:#0b0c0f; }
figcaption { padding:6px; font-size:11px; color:var(--muted); overflow-wrap:anywhere; }
.muted { color:var(--muted); }
@media (max-width: 1100px) { .columns { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main>
<h1>Archive Migration Review</h1>
<p class="summary">Generated from <code>.tmp/archive-review/archive-review-snapshot.json</code> at ${esc(snapshot.generatedAt)}. Run <code>npm run generate:legacy &amp;&amp; npm run review:archive</code> to refresh legacy/archive/final comparisons.</p>
<p class="summary">Applied: ${snapshot.applied.length} · Skipped: ${snapshot.skipped.length} · Errors: ${snapshot.errors.length}</p>
${buildRows(snapshot)}
</main>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, html);
console.log(`Archive review page: ${path.relative(ROOT, OUTPUT_PATH)}`);
