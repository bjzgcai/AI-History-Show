#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createArchiveSchemaValidator } = require('./archive-schema-validator.js');
const { readJson } = require('./generate-event-markdown-pack.js');
const { replaceVariantAvatar, setAvatarInObject } = require('./migrate-archive-figure-avatars.js');

const projectRoot = path.join(__dirname, '..');

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

const validationRoot = path.join(tempDir, 'archive-validation-root');
const archiveRoot = path.join(validationRoot, 'archive');
fs.mkdirSync(archiveRoot, { recursive: true });
for (const entry of fs.readdirSync(path.join(projectRoot, 'archive'), { withFileTypes: true })) {
    if (entry.name === 'config') continue;
    fs.symlinkSync(
        path.join(projectRoot, 'archive', entry.name),
        path.join(archiveRoot, entry.name),
        entry.isDirectory() ? 'dir' : 'file'
    );
}
fs.mkdirSync(path.join(archiveRoot, 'config'), { recursive: true });
fs.symlinkSync(path.join(projectRoot, 'resources'), path.join(validationRoot, 'resources'), 'dir');
const validationConfigPath = path.join(archiveRoot, 'config', 'media-storage.json');
const runArchiveValidation = () =>
    spawnSync(process.execPath, [path.join(projectRoot, 'scripts', 'validate-archive.js')], {
        env: { ...process.env, AI_HISTORY_ARCHIVE_ROOT: validationRoot },
        encoding: 'utf8'
    });

fs.writeFileSync(validationConfigPath, '{ invalid json');
const malformedConfigValidation = runArchiveValidation();
assert.equal(malformedConfigValidation.status, 1);
assert.doesNotMatch(malformedConfigValidation.stderr, /at .*validate-archive\.js:\d+/);
let validationReport = fs.readFileSync(
    path.join(validationRoot, '.tmp', 'archive-reports', 'archive-validation.md'),
    'utf8'
);
assert.match(validationReport, /Invalid JSON:/);
assert.match(validationReport, /## Storylines/);

const missingProfileConfig = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'archive', 'config', 'media-storage.json'), 'utf8')
);
missingProfileConfig.defaultProfiles.audio = 'missing-profile';
missingProfileConfig.profiles = [];
fs.writeFileSync(validationConfigPath, `${JSON.stringify(missingProfileConfig, null, 2)}\n`);
const missingProfileValidation = runArchiveValidation();
assert.equal(missingProfileValidation.status, 1);
assert.doesNotMatch(missingProfileValidation.stderr, /at .*validate-archive\.js:\d+/);
validationReport = fs.readFileSync(
    path.join(validationRoot, '.tmp', 'archive-reports', 'archive-validation.md'),
    'utf8'
);
assert.match(validationReport, /defaultProfiles\.audio references missing profile: missing-profile/);
assert.match(validationReport, /Unknown media storage profile: ai-history-audio-releases/);
assert.match(validationReport, /## Storylines/);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('PASS content tooling rejects invalid JSON, invalid Archive URIs, and broken avatar paths');
