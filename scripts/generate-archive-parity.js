#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildArchivePreview } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'reports', 'archive-parity', 'data');
const LEGACY_OUTPUT = path.join(OUTPUT_DIR, 'milestones-data-legacy.js');
const ARCHIVE_OUTPUT = path.join(OUTPUT_DIR, 'milestones-data-archive.js');
const MANIFEST_OUTPUT = path.join(OUTPUT_DIR, 'manifest.json');
const RUNTIME_FILES = [path.join(ROOT, 'milestones-data.js'), path.join(ROOT, 'milestones-data-default.js')];

function fileHash(filePath) {
    return fs.existsSync(filePath) ? crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex') : null;
}

function runtimeHashes() {
    return Object.fromEntries(RUNTIME_FILES.map((filePath) => [path.basename(filePath), fileHash(filePath)]));
}

function writeDataFile(filePath, milestones, source) {
    const content = [
        '// Archive authority parity review data (generated; do not edit)',
        `// Source: ${source}`,
        '',
        `const milestones = ${JSON.stringify(milestones, null, 2)};`,
        '',
        "if (typeof module !== 'undefined' && module.exports) {",
        '  module.exports = { milestones };',
        '}',
        ''
    ].join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
}

function storylineSummary(milestones) {
    const summary = {};
    for (const milestone of milestones) {
        const value = milestone.storyline;
        const storylineId = typeof value === 'string' ? value : value && value.id ? value.id : 'deep-learning';
        (summary[storylineId] ||= []).push(milestone.id);
    }
    return summary;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const before = runtimeHashes();
const relativeLegacyOutput = path.relative(ROOT, LEGACY_OUTPUT);
const legacyResult = spawnSync(process.execPath, ['manage/generate.js', '--review-output', relativeLegacyOutput], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
});
if (legacyResult.status !== 0) {
    process.stderr.write(legacyResult.stdout || '');
    process.stderr.write(legacyResult.stderr || '');
    process.exit(legacyResult.status || 1);
}

const archiveResult = buildArchivePreview(ROOT);
if (archiveResult.errors.length > 0) {
    for (const error of archiveResult.errors) console.error(`${error.storylineId}: ${error.message}`);
    process.exit(1);
}
writeDataFile(ARCHIVE_OUTPUT, archiveResult.milestones, 'archive/storylines/* + archive/events/*');

const after = runtimeHashes();
if (JSON.stringify(before) !== JSON.stringify(after)) {
    console.error('Parity generation modified runtime milestone files.');
    process.exit(1);
}

for (const filePath of [LEGACY_OUTPUT, ARCHIVE_OUTPUT]) delete require.cache[require.resolve(filePath)];
const legacy = require(LEGACY_OUTPUT).milestones || [];
const archive = require(ARCHIVE_OUTPUT).milestones || [];
const manifest = {
    generatedAt: new Date().toISOString(),
    runtimeHashes: before,
    runtimeUnchanged: true,
    legacy: {
        file: path.relative(ROOT, LEGACY_OUTPUT),
        sha256: fileHash(LEGACY_OUTPUT),
        milestones: legacy.length,
        ids: legacy.map((item) => item.id),
        storylines: storylineSummary(legacy)
    },
    archive: {
        file: path.relative(ROOT, ARCHIVE_OUTPUT),
        sha256: fileHash(ARCHIVE_OUTPUT),
        milestones: archive.length,
        ids: archive.map((item) => item.id),
        storylines: storylineSummary(archive)
    }
};
fs.writeFileSync(MANIFEST_OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Legacy parity data: ${path.relative(ROOT, LEGACY_OUTPUT)} (${legacy.length})`);
console.log(`Archive parity data: ${path.relative(ROOT, ARCHIVE_OUTPUT)} (${archive.length})`);
console.log(`Parity manifest: ${path.relative(ROOT, MANIFEST_OUTPUT)}`);
console.log('Runtime milestone hashes unchanged.');
