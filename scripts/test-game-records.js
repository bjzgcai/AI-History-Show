#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
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
    const milestone = compiled.milestones.find((item) => item.archiveEventId === record.eventId);
    assert.ok(milestone, `missing compiled milestone for ${record.eventId}`);
    const module = milestone.achievement.visualModules.find((item) => item.recordId === record.id);
    assert.ok(module, `missing compiled game module for ${record.id}`);
    assert.equal(module.url, record.manifest.render.videoPath);
    assert.equal(module.poster, record.manifest.render.posterPath);
    assert.equal(module.recordFormat, record.manifest.record.format);
}

console.log('PASS verified game records resolve to compiled video and poster assets');
