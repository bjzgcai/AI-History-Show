#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { readJson } = require('./generate-event-markdown-pack.js');
const { replaceVariantAvatar, setAvatarInObject } = require('./migrate-archive-figure-avatars.js');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-tooling-'));
const invalidJsonPath = path.join(tempDir, 'invalid.json');
fs.writeFileSync(invalidJsonPath, '{ invalid json');
assert.throws(() => readJson(invalidJsonPath), /Failed to read JSON/);

const repairedEventFigure = setAvatarInObject(
    `{
        "figureId": "example-person",
        "avatar": "resources/images/missing.jpg",
        "organizationIds": []
    }`,
    'resources/images/verified.jpg'
);
assert.match(repairedEventFigure, /"avatar": "resources\/images\/verified\.jpg"/);
assert.doesNotMatch(repairedEventFigure, /missing\.jpg/);

const repairedVariant = replaceVariantAvatar(
    `{
        "name": { "en": "Example Person", "zh": "示例人物" },
        "avatar": "resources/images/missing.jpg",
        "avatarStyle": ""
    }`,
    '"en": "Example Person"',
    'resources/images/verified.jpg'
);
assert.equal(repairedVariant.changed, true);
assert.match(repairedVariant.text, /"avatar": "resources\/images\/verified\.jpg"/);
assert.doesNotMatch(repairedVariant.text, /missing\.jpg/);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('PASS content tooling rejects invalid JSON and repairs broken avatar paths');
