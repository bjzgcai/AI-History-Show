#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { repositoryFiles, scanLine } = require('./scan-sensitive-content');

const privateIp = ['10', '1', '2', '3'].join('.');
const internalHost = ['speech', 'inner', 'example', 'test'].join('.');
const ossEndpoint = ['oss-cn-example', 'aliyuncs', 'com'].join('.');
const ossBucketHost = ['example-bucket', 'oss-cn-example', 'aliyuncs', 'com'].join('.');
const retiredOssBucket = ['zgca', 'medias'].join('-');
const internalEmail = ['person', ['zgci', 'ac', 'cn'].join('.')].join('@');
const personalEmail = ['student', ['example', 'com'].join('.')].join('@');
const mobile = ['139', '1234', '5678'].join('');

assert.deepEqual(scanLine('scripts/example.js', `endpoint=${privateIp}`), ['private-ipv4']);
assert.deepEqual(scanLine('scripts/example.js', `endpoint=https://${internalHost}/v1`), ['internal-hostname']);
assert.deepEqual(scanLine('scripts/example.js', `endpoint=https://${ossEndpoint}`), ['aliyun-oss-host']);
assert.deepEqual(scanLine('scripts/example.js', `endpoint=https://${ossBucketHost}/object`), ['aliyun-oss-host']);
assert.deepEqual(scanLine('scripts/example.js', `bucket=${retiredOssBucket}`), ['retired-oss-bucket']);
assert.deepEqual(scanLine('scripts/example.js', `owner=${internalEmail}`), ['internal-email']);
assert.deepEqual(scanLine('data/users.csv', `name,${personalEmail}`), ['personal-email-in-data']);
assert.deepEqual(scanLine('questions/metadata.jsonl', `{"mobile":"${mobile}"}`), ['cn-mobile-in-data']);
assert.deepEqual(scanLine('archive/events/example/sources.json', 'https://example.com/image_13912345678.jpg'), []);
const scannedFiles = repositoryFiles();
assert.ok(scannedFiles.includes('scripts/test-sensitive-content.js'));
assert.equal(
    scannedFiles.some((file) => file.startsWith('exports/')),
    false,
    'Untracked local exports must stay outside the repository scan'
);

console.log('Sensitive content scanner tests passed.');
