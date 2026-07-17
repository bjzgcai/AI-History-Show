#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageJson = require('../package.json');
const { generateArchiveData, normalizeGeneratedTime, writeOutputsAtomically } = require('./generate-archive-data.js');

function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'archive-authority-'));
}

function silentLogger() {
    return { log() {}, warn() {}, error() {} };
}

function successfulPreview() {
    return {
        milestones: [{ id: 'milestone-test', title: { zh: '测试', en: 'Test' } }],
        errors: [],
        counts: { storylines: 1, milestones: 1, errors: 0 }
    };
}

assert.equal(
    packageJson.scripts.generate,
    'node scripts/generate-archive-data.js',
    'the default generator must use Archive data'
);
assert.equal(
    packageJson.scripts['generate:legacy'],
    'node manage/generate.js',
    'the Legacy generator must require an explicit command'
);
console.log('PASS default generation authority');

{
    const tempDir = createTempDir();
    try {
        const outputs = [path.join(tempDir, 'primary.js'), path.join(tempDir, 'fallback.js')];
        fs.writeFileSync(outputs[0], 'primary-original\n');
        fs.writeFileSync(outputs[1], 'fallback-original\n');

        const generation = generateArchiveData({
            root: tempDir,
            outputs,
            buildPreview: () => ({
                milestones: [],
                errors: [{ storylineId: 'test', ref: { eventId: 'missing' }, message: 'missing event' }],
                counts: { storylines: 1, milestones: 0, errors: 1 }
            }),
            logger: silentLogger()
        });

        assert.equal(generation.ok, false);
        assert.equal(fs.readFileSync(outputs[0], 'utf8'), 'primary-original\n');
        assert.equal(fs.readFileSync(outputs[1], 'utf8'), 'fallback-original\n');
        assert.deepEqual(fs.readdirSync(tempDir).sort(), ['fallback.js', 'primary.js']);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
console.log('PASS generation errors preserve runtime outputs');

{
    const tempDir = createTempDir();
    try {
        const outputs = [path.join(tempDir, 'primary.js'), path.join(tempDir, 'fallback.js')];
        const first = generateArchiveData({
            root: tempDir,
            outputs,
            buildPreview: successfulPreview,
            now: '2026-07-16 10:00',
            logger: silentLogger()
        });
        const firstContent = fs.readFileSync(outputs[0], 'utf8');
        const firstMtime = fs.statSync(outputs[0]).mtimeMs;

        assert.equal(first.ok, true);
        assert.equal(first.writeResults.get(outputs[0]), true);
        assert.equal(first.writeResults.get(outputs[1]), true);
        assert.equal(fs.readFileSync(outputs[1], 'utf8'), firstContent);

        const second = generateArchiveData({
            root: tempDir,
            outputs,
            buildPreview: successfulPreview,
            now: '2026-07-16 11:00',
            logger: silentLogger()
        });

        assert.equal(second.writeResults.get(outputs[0]), false);
        assert.equal(second.writeResults.get(outputs[1]), false);
        assert.equal(fs.statSync(outputs[0]).mtimeMs, firstMtime);
        assert.match(firstContent, /生成时间: 2026-07-16 10:00/);
        assert.equal(
            normalizeGeneratedTime(firstContent),
            normalizeGeneratedTime(firstContent.replace('2026-07-16 10:00', '2026-07-16 11:00'))
        );
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
console.log('PASS generated outputs stay synchronized and stable');

{
    const tempDir = createTempDir();
    try {
        const output = path.join(tempDir, 'runtime.js');
        fs.writeFileSync(output, 'original\n');

        assert.throws(() => writeOutputsAtomically([output, output], 'replacement\n'), /ENOENT|no such file/i);
        assert.equal(fs.readFileSync(output, 'utf8'), 'original\n');
        assert.deepEqual(fs.readdirSync(tempDir), ['runtime.js']);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
console.log('PASS failed output replacement rolls back cleanly');

console.log('All Archive authority checks passed.');
