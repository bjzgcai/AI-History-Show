#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageJson = require('../package.json');
const { milestones } = require('../milestones-data.js');
const { compileArchive } = require('./archive-compiler.js');
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

const compilerSource = fs.readFileSync(path.join(__dirname, 'archive-compiler.js'), 'utf8');
for (const legacyInput of ['manage/event-fusions.js', 'manage/events.js', 'manage/catalog.js']) {
    assert.equal(compilerSource.includes(legacyInput), false, `production compiler must not read ${legacyInput}`);
}
for (const storylineFile of fs.readdirSync(path.join(__dirname, '..', 'archive', 'storylines'))) {
    if (!storylineFile.endsWith('.json')) continue;
    const storyline = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'archive', 'storylines', storylineFile), 'utf8')
    );
    for (const ref of storyline.events || []) {
        if (ref.enabled === false) continue;
        assert.match(ref.milestoneId, /^milestone-[a-z0-9][a-z0-9._-]*$/, `${storyline.id} ref must own its ID`);
    }
}
console.log('PASS production compiler uses Archive-owned milestone identities');

const compiledArchive = compileArchive(path.join(__dirname, '..'));
assert.equal(compiledArchive.source, 'archive');
assert.equal(compiledArchive.errors.length, 0);
assert.equal(compiledArchive.milestones.length, 146);
assert.ok(compiledArchive.milestones.every((milestone) => milestone.sourceKind === 'archive'));
assert.deepEqual(
    new Set(compiledArchive.milestones.map((milestone) => milestone.id)).size,
    compiledArchive.milestones.length,
    'compiled Archive milestone IDs must be unique'
);
console.log('PASS production compiler emits Archive provenance');

assert.equal(milestones.length, 146, 'Archive runtime should contain all four storylines and 146 milestones');
const humanisticMilestones = milestones.filter(
    (milestone) => milestone.storyline && milestone.storyline.id === 'humanistic-cycle'
);
assert.equal(humanisticMilestones.length, 12, 'Archive runtime should contain all 12 humanistic cycle events');
assert.deepEqual(
    humanisticMilestones.map((milestone) => milestone.id),
    [
        'milestone-humanistic-cycle-1920-rur-robots',
        'milestone-humanistic-cycle-1942-asimov-runaround',
        'milestone-humanistic-cycle-1950-wiener-human-use',
        'milestone-humanistic-cycle-1965-simon-ai-prediction',
        'milestone-humanistic-cycle-1968-hal-9000',
        'milestone-humanistic-cycle-1973-lighthill-report',
        'milestone-humanistic-cycle-1978-xiaolingtong',
        'milestone-humanistic-cycle-1984-neuromancer',
        'milestone-humanistic-cycle-1987-lisp-machine-collapse',
        'milestone-humanistic-cycle-2014-ai-existential-warnings',
        'milestone-humanistic-cycle-2015-openai-founding',
        'milestone-humanistic-cycle-2023-ai-risk-statement'
    ],
    'humanistic cycle milestone identities and order must remain stable'
);
for (const milestone of humanisticMilestones) {
    assert.equal(milestone.archiveVariantId, 'humanistic-cycle');
    assert.equal(milestone.archivePresentationMode, 'archive');
    assert.ok(milestone.sentiment, `${milestone.id} should preserve its sentiment`);
    assert.ok(Array.isArray(milestone.realityLinks) && milestone.realityLinks.length > 0);
    assert.ok(milestone.branchSummary && milestone.branchSummary.zh && milestone.branchSummary.en);
    assert.ok(milestone.analysis && milestone.analysis.what && milestone.analysis.how && milestone.analysis.why);
    assert.ok(milestone.resources && milestone.resources.images.length > 0);
    assert.ok(milestone.achievement && milestone.achievement.sources.length >= 4);
}
console.log('PASS humanistic cycle Archive authority');

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
