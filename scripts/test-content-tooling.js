#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createArchiveSchemaValidator } = require('./archive-schema-validator.js');
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

const validateSchema = createArchiveSchemaValidator(path.join(__dirname, '..'));
const validAsset = {
    id: 'asset-test-audio',
    type: 'audio',
    path: 'resources/audio/test.mp3',
    role: 'narration',
    caption: { en: 'Test audio', zh: '测试音频' },
    sourceId: 'source-test',
    language: 'en',
    deliveryUrl: 'https://media.example/audio/test.mp3',
    storage: {
        provider: 'aliyun-oss',
        bucket: 'example-bucket',
        objectKey: 'audio/ai-history/releases/test-v1.mp3',
        contentType: 'audio/mpeg',
        publicUrl: 'https://example-bucket.oss.example/audio/test.mp3'
    }
};
assert.equal(validateSchema('asset.schema.json', [validAsset]).valid, true);

const invalidDeliveryUrl = globalThis.structuredClone(validAsset);
invalidDeliveryUrl.deliveryUrl = 'not a valid URI';
assert.equal(validateSchema('asset.schema.json', [invalidDeliveryUrl]).valid, false);

const invalidPublicUrl = globalThis.structuredClone(validAsset);
invalidPublicUrl.storage.publicUrl = 'https://';
assert.equal(validateSchema('asset.schema.json', [invalidPublicUrl]).valid, false);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('PASS content tooling rejects invalid JSON, invalid Archive URIs, and broken avatar paths');
