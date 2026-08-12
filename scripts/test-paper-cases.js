#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const { compileArchive } = require('./archive-compiler.js');
const { validatePaperCases } = require('./validate-paper-cases.js');

const root = path.join(__dirname, '..');
const validation = validatePaperCases(root);
assert.deepEqual(validation.errors, []);
assert.deepEqual(
    validation.cases.map((item) => item.id),
    ['suphx-figure-13-safe-tile-case']
);

const compiled = compileArchive(root);
assert.deepEqual(compiled.errors, []);
const milestone = compiled.milestones.find((item) => item.archiveEventId === '2019-suphx');
assert.ok(milestone, 'missing compiled Suphx milestone');
const caseModule = milestone.achievement.visualModules.find((item) => item.caseId === 'suphx-figure-13-safe-tile-case');
assert.ok(caseModule, 'missing compiled Suphx paper-case module');
assert.equal(caseModule.type, 'paperCaseVideo');
assert.equal(caseModule.completeGameReplay, false);
assert.match(caseModule.url, /suphx-figure-13-safe-tile-case\.mp4$/);
assert.match(caseModule.poster, /suphx-figure-13-safe-tile-case\.png$/);

console.log('PASS partial paper cases remain distinct from verified game replays');
