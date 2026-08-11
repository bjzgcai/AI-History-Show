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
    normalizeObjectKey,
    pushAudioAssets,
    readPublicRemoteState,
    remoteMatches,
    resolveOssConfig,
    selectUploadAction,
    validateAudioAssets
} = require('./sync-audio-oss.js');
const { resolveEffectivePresentation } = require('./archive-presentation.js');
const { loadMediaStorageConfig, resolveAudioUrl, resolveMediaStorage } = require('./media-storage.js');

function assertArchiveAudioUsage(root) {
    const eventsRoot = path.join(root, 'archive', 'events');
    const storylinesRoot = path.join(root, 'archive', 'storylines');
    const mediaStorageConfig = loadMediaStorageConfig(root);
    const audioProfile = mediaStorageConfig.profiles.find(
        (profile) => profile.id === mediaStorageConfig.defaultProfiles.audio
    );
    assert.ok(audioProfile, 'default audio storage profile must exist');
    const selectedAudioIds = new Map();
    for (const storylineFile of fs.readdirSync(storylinesRoot).filter((fileName) => fileName.endsWith('.json'))) {
        const storyline = JSON.parse(fs.readFileSync(path.join(storylinesRoot, storylineFile), 'utf8'));
        for (const ref of storyline.events || []) {
            if (!ref || ref.enabled === false) continue;
            const eventRoot = path.join(eventsRoot, ref.eventId);
            const event = JSON.parse(fs.readFileSync(path.join(eventRoot, 'event.json'), 'utf8'));
            const assets = JSON.parse(fs.readFileSync(path.join(eventRoot, 'assets.json'), 'utf8'));
            const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
            const presentation = resolveEffectivePresentation({
                root,
                eventDir: eventRoot,
                event,
                eventId: ref.eventId,
                storylineId: storyline.id,
                ref
            }).presentation;
            for (const assetId of presentation.assetIds || []) {
                const asset = assetMap.get(assetId);
                if (asset && asset.type === 'audio') {
                    const refs = selectedAudioIds.get(`${ref.eventId}:${assetId}`) || [];
                    refs.push(`${storyline.id}/${ref.variant || storyline.id}`);
                    selectedAudioIds.set(`${ref.eventId}:${assetId}`, refs);
                }
            }
        }
    }

    for (const eventEntry of fs.readdirSync(eventsRoot, { withFileTypes: true })) {
        if (!eventEntry.isDirectory()) continue;
        const eventRoot = path.join(eventsRoot, eventEntry.name);
        const assets = JSON.parse(fs.readFileSync(path.join(eventRoot, 'assets.json'), 'utf8'));

        for (const asset of assets.filter((candidate) => candidate.type === 'audio')) {
            const deliveryUrl = resolveAudioUrl(asset, { config: mediaStorageConfig });
            assert.ok(
                deliveryUrl.startsWith(audioProfile.publicUrlPrefix),
                `${eventEntry.name}/${asset.id} must use the configured delivery endpoint instead of a local MP3 path`
            );
            if ((asset.usage || []).includes('archive-only')) continue;
            assert.ok(
                selectedAudioIds.has(`${eventEntry.name}:${asset.id}`),
                `${eventEntry.name}/${asset.id} must be selected by at least one effective presentation`
            );
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
                        provider: 'aliyun-oss',
                        bucket: 'zgca-medias',
                        objectKey: 'audio/ai-history/releases/1956-dartmouth-zh-original-v1.mp3',
                        contentType: 'audio/mpeg'
                    }
                }
            ])
        );

        const entries = collectAudioAssets(root);
        assert.equal(entries.length, 1);
        assert.deepEqual(validateAudioAssets(entries), []);
        assert.equal(entries[0].bucket, 'zgca-medias');
        assert.equal(entries[0].objectKey, 'audio/ai-history/releases/1956-dartmouth-zh-original-v1.mp3');
        assert.equal(
            normalizeObjectKey('/audio//ai-history\\releases/sample.mp3'),
            'audio/ai-history/releases/sample.mp3'
        );

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

        const config = resolveOssConfig({}, entries);
        assert.equal(config.endpoint, 'https://oss-cn-beijing.aliyuncs.com');
        assert.equal(config.bucket, 'zgca-medias');
        assert.equal(config.forcePathStyle, false);

        assert.throws(
            () =>
                resolveMediaStorage(
                    { type: 'audio', storage: { profileId: 'missing-profile', objectName: 'sample.mp3' } },
                    { config: loadMediaStorageConfig(path.join(__dirname, '..')) }
                ),
            /Unknown media storage profile/
        );
        const customPrefixStorage = resolveMediaStorage(
            { type: 'audio', storage: { profileId: 'custom-audio', objectName: 'sample.mp3' } },
            {
                config: {
                    defaultProfiles: { audio: 'custom-audio' },
                    profiles: [
                        {
                            id: 'custom-audio',
                            mediaType: 'audio',
                            provider: 'aliyun-oss',
                            bucket: 'test-bucket',
                            publicUrlPrefix: 'https://media.example/audio',
                            objectKeyPrefix: 'audio/releases'
                        }
                    ]
                }
            }
        );
        assert.equal(customPrefixStorage.objectKey, 'audio/releases/sample.mp3');
        assert.equal(customPrefixStorage.publicUrl, 'https://media.example/audio/sample.mp3');

        const makeHeadResponse = (status, headers = {}) => ({
            status,
            ok: status >= 200 && status < 300,
            headers: {
                get(name) {
                    return headers[String(name).toLowerCase()] || null;
                }
            }
        });
        const publicState = await readPublicRemoteState(
            { objectKey: manifest.assets[0].objectKey, url: 'https://media.example/matching.mp3' },
            async () =>
                makeHeadResponse(200, {
                    'content-length': '16',
                    'content-type': 'audio/mpeg',
                    'cache-control': 'public, max-age=31536000, immutable',
                    'x-oss-meta-sha256': expectedHash
                })
        );
        assert.deepEqual(publicState, matchingRemote);

        const dryRunAssets = [
            {
                ...manifest.assets[0],
                objectKey: `${manifest.assets[0].objectKey}.matching`,
                url: 'https://media.example/matching.mp3'
            },
            {
                ...manifest.assets[0],
                objectKey: `${manifest.assets[0].objectKey}.missing`,
                url: 'https://media.example/missing.mp3'
            },
            {
                ...manifest.assets[0],
                objectKey: `${manifest.assets[0].objectKey}.conflict`,
                url: 'https://media.example/conflict.mp3'
            }
        ];
        const dryRunEntries = dryRunAssets.map((asset) => ({ deliveryUrl: asset.url }));
        const dryRunSummary = await pushAudioAssets(dryRunEntries, { ...manifest, assets: dryRunAssets }, config, {
            dryRun: true,
            fetchImpl: async (url) => {
                if (url.endsWith('/missing.mp3')) return makeHeadResponse(404);
                return makeHeadResponse(200, {
                    'content-length': url.endsWith('/conflict.mp3') ? '15' : '16',
                    'content-type': 'audio/mpeg',
                    'cache-control': 'public, max-age=31536000, immutable',
                    'x-oss-meta-sha256': expectedHash
                });
            }
        });
        assert.equal(dryRunSummary.planned, 1);
        assert.equal(dryRunSummary.skipped, 1);
        assert.equal(dryRunSummary.conflicts, 1);
        assert.equal(dryRunSummary.failed, 0);
        assert.equal(dryRunSummary.manifestPlanned, false);
        assert.deepEqual(
            dryRunSummary.results.map((result) => result.action),
            ['would-skip', 'would-upload', 'conflict']
        );
        await assert.rejects(
            pushAudioAssets(entries, manifest, config, { force: true }),
            /Immutable release objects cannot be overwritten/
        );

        const corsRules = mergeAudioCorsRules([
            { ID: 'KeepExistingCors', AllowedMethods: ['GET'], AllowedOrigins: ['https://example.com'] }
        ]);
        assert.equal(corsRules.length, 2);
        assert.equal(corsRules[0].ID, 'KeepExistingCors');
        assert.deepEqual(corsRules[1].AllowedMethods, ['GET', 'HEAD']);
        assert.deepEqual(corsRules[1].AllowedHeaders, ['range']);
        assert.equal(mergeAudioCorsRules(corsRules).length, 2);
        const ossRoundTripRules = mergeAudioCorsRules([
            {
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag', 'Content-Length'],
                MaxAgeSeconds: 86400
            },
            {
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['*'],
                AllowedHeaders: ['range'],
                ExposeHeaders: ['Accept-Ranges', 'Content-Range'],
                MaxAgeSeconds: 86400
            }
        ]);
        assert.equal(ossRoundTripRules.length, 1);
        assert.deepEqual(ossRoundTripRules[0].AllowedHeaders, ['*']);
        assert.ok(ossRoundTripRules[0].ExposeHeaders.includes('Content-Range'));

        entries[0].objectKey = '../outside.mp3';
        assert.match(validateAudioAssets(entries).join('\n'), /must stay under audio|parent traversal/);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }

    assertArchiveAudioUsage(path.join(__dirname, '..'));
    console.log('PASS Alibaba Cloud OSS audio storage manifest and validation tooling');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
