#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const RESOURCE_ROOTS = ['resources', 'research', 'examples'];
const OUT_JSON = path.join(ROOT, '.tmp', 'archive-reports', 'assets-usage.json');
const OUT_MD = path.join(ROOT, 'reports', 'assets-usage.md');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.json', '.sgf']);

function rel(filePath) {
    return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function walk(dir, result = []) {
    if (!fs.existsSync(dir)) return result;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, result);
        else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) result.push(rel(full));
    }
    return result;
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectArchiveAssets() {
    const refs = [];
    if (!fs.existsSync(ARCHIVE_EVENTS)) return refs;
    for (const eventId of fs.readdirSync(ARCHIVE_EVENTS)) {
        const file = path.join(ARCHIVE_EVENTS, eventId, 'assets.json');
        if (!fs.existsSync(file)) continue;
        const assets = readJson(file);
        for (const asset of assets) {
            refs.push({
                eventId,
                assetId: asset.id,
                path: asset.path,
                role: asset.role,
                type: asset.type,
                hasCaption: Boolean(asset.caption && asset.caption.zh && asset.caption.en),
                hasRights: Boolean(asset.rights),
                hasUsage: Array.isArray(asset.usage) && asset.usage.length > 0
            });
        }
    }
    return refs;
}

function main() {
    const files = RESOURCE_ROOTS.flatMap((root) => walk(path.join(ROOT, root))).sort();
    const refs = collectArchiveAssets();
    const refsByPath = new Map();
    for (const ref of refs) {
        if (!refsByPath.has(ref.path)) refsByPath.set(ref.path, []);
        refsByPath.get(ref.path).push(ref);
    }

    const missing = refs.filter((ref) => !fs.existsSync(path.join(ROOT, ref.path)));
    const referenced = files.filter((file) => refsByPath.has(file));
    const unreferenced = files.filter((file) => !refsByPath.has(file));
    const duplicated = [...refsByPath.entries()]
        .filter(([, items]) => items.length > 1)
        .map(([file, items]) => ({ file, refs: items }));
    const incomplete = refs.filter((ref) => !ref.hasCaption || !ref.hasRights || !ref.hasUsage);

    const output = {
        generatedAt: new Date().toISOString(),
        counts: {
            scannedFiles: files.length,
            archiveRefs: refs.length,
            referenced: referenced.length,
            unreferenced: unreferenced.length,
            missing: missing.length,
            duplicated: duplicated.length,
            incomplete: incomplete.length
        },
        referenced,
        unreferenced,
        missing,
        duplicated,
        incomplete
    };
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
    fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`);

    const lines = [];
    lines.push('# Assets Usage Report');
    lines.push('');
    lines.push(`Generated: ${output.generatedAt}`);
    lines.push('');
    lines.push(
        'This report compares files under `resources/`, `research/`, and `examples/` with archive asset references. It is report-only and does not delete files.'
    );
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    for (const [key, value] of Object.entries(output.counts)) lines.push(`- ${key}: ${value}`);
    lines.push('');
    lines.push('## Missing archive asset paths');
    lines.push('');
    lines.push(
        missing.length ? missing.map((ref) => `- \`${ref.path}\` — ${ref.eventId}/${ref.assetId}`).join('\n') : 'None.'
    );
    lines.push('');
    lines.push('## Duplicate archive references');
    lines.push('');
    lines.push(
        duplicated.length
            ? duplicated
                  .map(
                      (item) =>
                          `- \`${item.file}\` — ${item.refs.map((ref) => `${ref.eventId}/${ref.assetId}`).join(', ')}`
                  )
                  .join('\n')
            : 'None.'
    );
    lines.push('');
    lines.push('## Incomplete asset metadata');
    lines.push('');
    lines.push(
        incomplete.length
            ? incomplete.map((ref) => `- \`${ref.path}\` — ${ref.eventId}/${ref.assetId}`).join('\n')
            : 'None.'
    );
    lines.push('');
    lines.push('## Unreferenced files (first 200)');
    lines.push('');
    lines.push(
        unreferenced
            .slice(0, 200)
            .map((file) => `- \`${file}\``)
            .join('\n') || 'None.'
    );
    if (unreferenced.length > 200) lines.push(`\n... ${unreferenced.length - 200} more unreferenced file(s).`);
    lines.push('');
    fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`);
    console.log(`Assets usage report: ${rel(OUT_MD)}`);
    console.log(`Assets usage JSON: ${rel(OUT_JSON)}`);
}

main();
