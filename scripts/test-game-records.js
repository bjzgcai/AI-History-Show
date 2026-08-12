#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { compileArchive } = require('./archive-compiler.js');
const { validateGameRecords } = require('./validate-game-records.js');

const root = path.join(__dirname, '..');
const validation = validateGameRecords(root);
assert.deepEqual(validation.errors, []);
assert.deepEqual(
    validation.records.map((record) => record.id),
    [
        'chinook-tinsley-boston-1994-game-2',
        'deep-blue-kasparov-1997-game-6',
        'logistello-murakami-1997-game-1',
        'lee-sedol-alphago-2016-game-2',
        'alphazero-stockfish-2018-top10-game-3'
    ]
);

const compiled = compileArchive(root);
assert.deepEqual(compiled.errors, []);
for (const record of validation.records) {
    assert.equal(record.parsedRecord.moveCount, record.manifest.record.moveCount);
    assert.equal(record.parsedRecord.mainLineSha256, record.manifest.verification.mainLineSha256);
    const milestone = compiled.milestones.find((item) => item.archiveEventId === record.eventId);
    assert.ok(milestone, `missing compiled milestone for ${record.eventId}`);
    const module = milestone.achievement.visualModules.find((item) => item.recordId === record.id);
    assert.ok(module, `missing compiled game module for ${record.id}`);
    assert.equal(module.url, record.manifest.render.videoPath);
    assert.equal(module.poster, record.manifest.render.posterPath);
    assert.equal(module.recordFormat, record.manifest.record.format);
}

const sourceManifestPath = validation.records[0].manifestPath;
const sourceManifest = validation.records[0].manifest;
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-game-record-test-'));
try {
    const temporaryManifestPath = path.join(temporaryRoot, 'game-record.json');
    const temporaryRecordPath = path.join(temporaryRoot, sourceManifest.record.path);
    fs.copyFileSync(path.join(path.dirname(sourceManifestPath), sourceManifest.record.path), temporaryRecordPath);
    const staleManifest = JSON.parse(JSON.stringify(sourceManifest));
    staleManifest.verification.mainLineSha256 = '0'.repeat(64);
    fs.writeFileSync(temporaryManifestPath, `${JSON.stringify(staleManifest)}\n`);
    const parserResult = childProcess.spawnSync(
        process.env.GAME_RECORD_PYTHON || 'python3',
        [path.join(root, 'scripts/game-evolution/verify_game_record.py'), temporaryManifestPath],
        { encoding: 'utf8' }
    );
    assert.notEqual(parserResult.status, 0, 'production parser must reject a stale main-line digest');
    assert.match(parserResult.stderr, /Main-line SHA-256 mismatch/);
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log('PASS verified game records resolve to compiled video and poster assets');
