#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
    buildManifest,
    collectAudioAssets,
    mergeAudioCorsRules,
    mergePublicReleasePolicy,
    normalizeObjectKey,
    remoteMatches,
    resolveS3Config,
    selectUploadAction,
    validateAudioAssets
} = require('./sync-audio-s3.js');

function assertArchiveAudioUsage(root) {
    const eventsRoot = path.join(root, 'archive', 'events');
    for (const eventEntry of fs.readdirSync(eventsRoot, { withFileTypes: true })) {
        if (!eventEntry.isDirectory()) continue;
        const eventRoot = path.join(eventsRoot, eventEntry.name);
        const assets = JSON.parse(fs.readFileSync(path.join(eventRoot, 'assets.json'), 'utf8'));
        const variantsRoot = path.join(eventRoot, 'variants');
        const variants = fs
            .readdirSync(variantsRoot)
            .filter((fileName) => fileName.endsWith('.json'))
            .map((fileName) => ({
                id: path.basename(fileName, '.json'),
                data: JSON.parse(fs.readFileSync(path.join(variantsRoot, fileName), 'utf8'))
            }));

        for (const asset of assets.filter((candidate) => candidate.type === 'audio')) {
            const deliveryUrl = String(asset.deliveryUrl || asset.path || '');
            assert.match(
                deliveryUrl,
                /^https:\/\/s3\.inner\.bza\.edu\.cn\//,
                `${eventEntry.name}/${asset.id} must use the S3 delivery endpoint instead of a local MP3 path`
            );
            const usage = new Set(asset.usage || []);
            for (const variant of variants) {
                if (!(variant.data.assetIds || []).includes(asset.id)) continue;
                assert.ok(
                    usage.has(`variant:${variant.id}`),
                    `${eventEntry.name}/${asset.id} must declare usage by variant:${variant.id}`
                );
            }
        }
    }
}

async function main() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-storage-'));
    try {
        const eventDir = path.join(root, 'archive', 'events', '1956-dartmouth');
        const audioPath = path.join(root, 'resources', 'audio', '1956-dartmouth', 'sample.mp3');
        fs.mkdirSync(eventDir, { recursive: true });
        fs.mkdirSync(path.dirname(audioPath), { recursive: true });
        fs.writeFileSync(audioPath, 'test audio bytes');
        fs.writeFileSync(
            path.join(eventDir, 'assets.json'),
            JSON.stringify([
                {
                    id: 'asset-test-audio',
                    type: 'audio',
                    path: 'resources/audio/1956-dartmouth/sample.mp3',
                    language: 'zh',
                    storage: {
                        provider: 'bza-s3',
                        bucket: 'ai-history',
                        objectKey: 'audio/delivery/1956-dartmouth/zh/narration-v1.mp3',
                        contentType: 'audio/mpeg'
                    }
                }
            ])
        );

        const entries = collectAudioAssets(root);
        assert.equal(entries.length, 1);
        assert.deepEqual(validateAudioAssets(entries), []);
        assert.equal(entries[0].bucket, 'ai-history');
        assert.equal(entries[0].objectKey, 'audio/delivery/1956-dartmouth/zh/narration-v1.mp3');
        assert.equal(normalizeObjectKey('/audio//delivery\\sample.mp3'), 'audio/delivery/sample.mp3');

        const manifest = await buildManifest(entries, { generatedAt: '2026-08-07T00:00:00.000Z' });
        const expectedHash = crypto.createHash('sha256').update('test audio bytes').digest('hex');
        assert.equal(manifest.assets[0].sha256, expectedHash);
        assert.equal(manifest.assets[0].size, 16);
        assert.equal(manifest.assets[0].contentType, 'audio/mpeg');
        const matchingRemote = {
            exists: true,
            size: 16,
            sha256: expectedHash,
            contentType: 'audio/mpeg',
            cacheControl: 'public, max-age=31536000, immutable'
        };
        assert.equal(remoteMatches(matchingRemote, manifest.assets[0]), true);
        assert.equal(remoteMatches({ ...matchingRemote, size: 15 }, manifest.assets[0]), false);
        assert.equal(
            remoteMatches({ ...matchingRemote, contentType: 'application/octet-stream' }, manifest.assets[0]),
            false
        );
        assert.equal(selectUploadAction(matchingRemote, manifest.assets[0]), 'skip');
        assert.equal(selectUploadAction({ exists: false }, manifest.assets[0]), 'upload');
        assert.equal(selectUploadAction({ ...matchingRemote, size: 15 }, manifest.assets[0]), 'conflict');
        assert.equal(selectUploadAction({ ...matchingRemote, size: 15 }, manifest.assets[0], true), 'upload');

        const config = resolveS3Config({}, entries);
        assert.equal(config.endpoint, 'https://s3.inner.bza.edu.cn');
        assert.equal(config.bucket, 'ai-history');
        assert.equal(config.forcePathStyle, true);

        const policy = mergePublicReleasePolicy(
            {
                Version: '2012-10-17',
                Statement: [{ Sid: 'KeepExistingAccess', Effect: 'Allow', Action: 's3:ListBucket' }]
            },
            'ai-history'
        );
        assert.equal(policy.Statement.length, 2);
        assert.equal(policy.Statement[0].Sid, 'KeepExistingAccess');
        assert.deepEqual(policy.Statement[1], {
            Sid: 'PublicReadAudioReleases',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::ai-history/audio/releases/*'
        });
        assert.equal(mergePublicReleasePolicy(policy, 'ai-history').Statement.length, 2);

        const corsRules = mergeAudioCorsRules([
            { ID: 'KeepExistingCors', AllowedMethods: ['GET'], AllowedOrigins: ['https://example.com'] }
        ]);
        assert.equal(corsRules.length, 2);
        assert.equal(corsRules[0].ID, 'KeepExistingCors');
        assert.deepEqual(corsRules[1].AllowedMethods, ['GET', 'HEAD']);
        assert.deepEqual(corsRules[1].AllowedHeaders, ['Range']);
        assert.equal(mergeAudioCorsRules(corsRules).length, 2);

        entries[0].objectKey = '../outside.mp3';
        assert.match(validateAudioAssets(entries).join('\n'), /must stay under audio|parent traversal/);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }

    assertArchiveAudioUsage(path.join(__dirname, '..'));
    console.log('PASS S3 audio storage manifest and validation tooling');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
