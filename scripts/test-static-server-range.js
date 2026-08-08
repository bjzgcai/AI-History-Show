#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { parseByteRange } = require('./static-server.js');

const size = 5590;

assert.deepEqual(parseByteRange('bytes=-10', size), { start: 5580, end: 5589 });
assert.deepEqual(parseByteRange('bytes=-99999', size), { start: 0, end: 5589 });
assert.deepEqual(parseByteRange('bytes=0-99999', size), { start: 0, end: 5589 });
assert.deepEqual(parseByteRange('bytes=100-', size), { start: 100, end: 5589 });
assert.deepEqual(parseByteRange('bytes=100-200', size), { start: 100, end: 200 });

for (const range of ['bytes=-0', 'bytes=5590-', 'bytes=100-50', 'bytes=-', 'bytes=0-1,3-4']) {
    assert.equal(parseByteRange(range, size), null, `${range} should be unsatisfiable`);
}

assert.equal(parseByteRange('bytes=0-0', 0), null);

console.log('Static server byte-range checks passed.');
