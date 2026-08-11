#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
    AUDIO_CONTENT_TYPES,
    DEFAULT_BUCKET,
    DEFAULT_CACHE_CONTROL,
    DEFAULT_ENDPOINT,
    DEFAULT_MANIFEST_KEY,
    DEFAULT_OBJECT_KEY_PREFIX,
    DEFAULT_PROVIDER,
    DEFAULT_REGION,
    contentTypeForPath,
    loadMediaStorageConfig,
    normalizeObjectKey,
    resolveMediaStorage
} = require('./media-storage');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MANIFEST_PATH = path.join(ROOT, '.tmp', 'audio', 'audio-manifest.json');
const RELEASE_PREFIX = DEFAULT_OBJECT_KEY_PREFIX;

function printUsage() {
    console.log(
        [
            'Usage:',
            '  node scripts/sync-audio-oss.js check',
            '  node scripts/sync-audio-oss.js manifest [--output FILE] [--json]',
            '  node scripts/sync-audio-oss.js push [--dry-run] [--output FILE] [--json]',
            '  node scripts/sync-audio-oss.js verify [--json]',
            '  node scripts/sync-audio-oss.js publish-access [--dry-run] [--json]',
            '',
            'Configuration:',
            `  ALIYUN_OSS_ENDPOINT       OSS endpoint (default: ${DEFAULT_ENDPOINT})`,
            `  ALIYUN_OSS_BUCKET         bucket name (default: ${DEFAULT_BUCKET})`,
            `  ALIYUN_OSS_REGION         signing region (default: ${DEFAULT_REGION})`,
            `  ALIYUN_OSS_MANIFEST_KEY   remote manifest key (default: ${DEFAULT_MANIFEST_KEY})`,
            '  ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET are required for push/verify.',
            '',
            'Credentials must come from the environment; never store them in Archive metadata.'
        ].join('\n')
    );
}

function parseArgs(argv) {
    const args = { _: [] };
    const booleanFlags = new Set(['dry-run', 'force', 'help', 'json']);
    for (let index = 0; index < argv.length; index += 1) {
        const item = argv[index];
        if (!item.startsWith('--')) {
            args._.push(item);
            continue;
        }
        const key = item.slice(2);
        if (booleanFlags.has(key)) {
            args[key] = true;
            continue;
        }
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
        args[key] = value;
        index += 1;
    }
    return args;
}

function toPosixPath(value) {
    return value.split(path.sep).join('/');
}

function isRemotePath(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
}

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`Failed to read ${toPosixPath(path.relative(ROOT, filePath))}: ${error.message}`);
    }
}

function collectAudioAssets(root = ROOT) {
    const eventsDir = path.join(root, 'archive', 'events');
    const mediaStorageConfig = loadMediaStorageConfig(root);
    if (!fs.existsSync(eventsDir)) return [];

    const entries = [];
    const eventDirs = fs
        .readdirSync(eventsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    for (const eventId of eventDirs) {
        const assetsPath = path.join(eventsDir, eventId, 'assets.json');
        if (!fs.existsSync(assetsPath)) continue;
        const assets = readJson(assetsPath);
        for (const asset of assets) {
            if (!asset || asset.type !== 'audio') continue;
            const storage = resolveMediaStorage(asset, { config: mediaStorageConfig });
            const configuredSourcePath = String(storage.sourcePath || asset.path || '').trim();
            const sourcePath = isRemotePath(configuredSourcePath) ? '' : configuredSourcePath;
            entries.push({
                eventId,
                assetId: String(asset.id || '').trim(),
                language: String(asset.language || '').trim(),
                sourcePath: toPosixPath(sourcePath),
                absoluteSourcePath: sourcePath ? path.resolve(root, sourcePath) : '',
                profileId: storage.profileId,
                provider: storage.provider,
                bucket: storage.bucket,
                objectKey: storage.objectKey,
                objectName: storage.objectName,
                contentType: String(storage.contentType || contentTypeForPath(sourcePath)).trim(),
                cacheControl: String(storage.cacheControl || DEFAULT_CACHE_CONTROL).trim(),
                deliveryUrl: storage.publicUrl,
                objectKeyPrefix: storage.objectKeyPrefix,
                endpoint: storage.endpoint,
                region: storage.region,
                manifestKey: storage.manifestKey
            });
        }
    }

    return entries.sort((left, right) => left.objectKey.localeCompare(right.objectKey));
}

function validateAudioAssets(entries) {
    const issues = [];
    const objectKeys = new Map();

    for (const entry of entries) {
        const label = `${entry.eventId}/${entry.assetId || '<missing-id>'}`;
        if (!entry.assetId) issues.push(`${label}: asset id is required`);
        if (!entry.language) issues.push(`${label}: language is required`);
        if (!entry.sourcePath) {
            issues.push(`${label}: a local path or storage.sourcePath is required`);
        } else if (!AUDIO_CONTENT_TYPES.has(path.extname(entry.sourcePath).toLowerCase())) {
            issues.push(`${label}: unsupported audio extension: ${entry.sourcePath}`);
        } else if (!fs.existsSync(entry.absoluteSourcePath)) {
            issues.push(`${label}: local source does not exist: ${entry.sourcePath}`);
        } else if (!fs.statSync(entry.absoluteSourcePath).isFile()) {
            issues.push(`${label}: local source is not a file: ${entry.sourcePath}`);
        }
        if (!entry.provider) issues.push(`${label}: storage.provider is required`);
        if (!entry.bucket) issues.push(`${label}: storage.bucket is required`);
        if (!entry.objectKey) {
            issues.push(`${label}: storage.objectKey is required`);
        } else {
            if (!entry.objectKey.startsWith(entry.objectKeyPrefix || RELEASE_PREFIX)) {
                issues.push(
                    `${label}: storage.objectKey must stay under ${entry.objectKeyPrefix || RELEASE_PREFIX}: ${entry.objectKey}`
                );
            }
            if (entry.objectKey.split('/').includes('..')) {
                issues.push(`${label}: storage.objectKey must not contain parent traversal`);
            }
            const existing = objectKeys.get(entry.objectKey);
            if (existing) issues.push(`${label}: storage.objectKey duplicates ${existing}: ${entry.objectKey}`);
            else objectKeys.set(entry.objectKey, label);
        }
        if (!entry.contentType.startsWith('audio/')) {
            issues.push(`${label}: storage.contentType must be an audio MIME type`);
        }
    }

    return issues;
}

async function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
    return hash.digest('hex');
}

async function buildManifest(entries, options = {}) {
    const assets = [];
    for (const entry of entries) {
        const stat = fs.statSync(entry.absoluteSourcePath);
        assets.push({
            eventId: entry.eventId,
            assetId: entry.assetId,
            language: entry.language,
            sourcePath: entry.sourcePath,
            bucket: entry.bucket,
            objectKey: entry.objectKey,
            contentType: entry.contentType,
            cacheControl: entry.cacheControl,
            size: stat.size,
            sha256: await sha256File(entry.absoluteSourcePath),
            ...(entry.deliveryUrl ? { url: entry.deliveryUrl } : {})
        });
    }

    return {
        schemaVersion: 1,
        generatedAt: options.generatedAt || new Date().toISOString(),
        provider: entries[0]?.provider || DEFAULT_PROVIDER,
        assets
    };
}

function writeManifest(manifest, outputPath = DEFAULT_MANIFEST_PATH) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return outputPath;
}

function resolveOssConfig(args, entries) {
    const configuredProviders = new Set(entries.map((entry) => entry.provider).filter(Boolean));
    const configuredBuckets = new Set(entries.map((entry) => entry.bucket).filter(Boolean));
    const configuredEndpoints = new Set(entries.map((entry) => entry.endpoint).filter(Boolean));
    const configuredRegions = new Set(entries.map((entry) => entry.region).filter(Boolean));
    const configuredManifestKeys = new Set(entries.map((entry) => entry.manifestKey).filter(Boolean));
    const provider = [...configuredProviders][0] || DEFAULT_PROVIDER;
    const bucket = String(
        args.bucket || process.env.ALIYUN_OSS_BUCKET || [...configuredBuckets][0] || DEFAULT_BUCKET
    ).trim();
    if (configuredProviders.size > 1)
        throw new Error(`Audio assets reference multiple providers: ${[...configuredProviders].join(', ')}`);
    if (configuredBuckets.size > 1 && !args.bucket && !process.env.ALIYUN_OSS_BUCKET) {
        throw new Error(`Audio assets reference multiple buckets: ${[...configuredBuckets].join(', ')}`);
    }
    if ([...configuredBuckets].some((value) => value !== bucket)) {
        throw new Error(`Configured bucket ${bucket} does not match Archive audio metadata`);
    }

    return {
        provider,
        endpoint: String(
            args.endpoint || process.env.ALIYUN_OSS_ENDPOINT || [...configuredEndpoints][0] || DEFAULT_ENDPOINT
        ).replace(/\/+$/, ''),
        bucket,
        region: String(
            args.region || process.env.ALIYUN_OSS_REGION || [...configuredRegions][0] || DEFAULT_REGION
        ).trim(),
        forcePathStyle: false,
        manifestKey: normalizeObjectKey(
            args['manifest-key'] ||
                process.env.ALIYUN_OSS_MANIFEST_KEY ||
                [...configuredManifestKeys][0] ||
                DEFAULT_MANIFEST_KEY
        )
    };
}

function loadS3CompatibleSdk() {
    try {
        return {
            ...require('@aws-sdk/client-s3'),
            Upload: require('@aws-sdk/lib-storage').Upload
        };
    } catch (error) {
        throw new Error(`AWS SDK is unavailable; run npm install first. ${error.message}`);
    }
}

function createS3Client(config) {
    const { S3Client } = loadS3CompatibleSdk();
    const accessKeyId = String(process.env.ALIYUN_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = String(process.env.ALIYUN_ACCESS_KEY_SECRET || '').trim();
    return new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.forcePathStyle,
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED'
    });
}

function isNotFound(error) {
    return Boolean(
        error &&
        (error.name === 'NotFound' ||
            error.name === 'NoSuchKey' ||
            (error.$metadata && error.$metadata.httpStatusCode === 404))
    );
}

async function readRemoteState(client, bucket, objectKey) {
    const { HeadObjectCommand } = loadS3CompatibleSdk();
    try {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
        return {
            exists: true,
            size: Number(result.ContentLength || 0),
            sha256: String((result.Metadata && result.Metadata.sha256) || '').toLowerCase(),
            contentType: String(result.ContentType || ''),
            cacheControl: String(result.CacheControl || '')
        };
    } catch (error) {
        if (isNotFound(error)) return { exists: false };
        throw error;
    }
}

async function readPublicRemoteState(entry, fetchImpl = globalThis.fetch) {
    const deliveryUrl = String(entry.url || entry.deliveryUrl || '').trim();
    if (!deliveryUrl) throw new Error(`No public delivery URL is configured for ${entry.objectKey}`);
    if (typeof fetchImpl !== 'function') throw new Error('The runtime does not provide fetch for public HEAD checks');

    const response = await fetchImpl(deliveryUrl, { method: 'HEAD', redirect: 'follow' });
    if (response.status === 404) return { exists: false };
    if (!response.ok) throw new Error(`HEAD ${deliveryUrl} returned HTTP ${response.status}`);

    return {
        exists: true,
        size: Number(response.headers.get('content-length') || 0),
        sha256: String(response.headers.get('x-oss-meta-sha256') || '').toLowerCase(),
        contentType: String(response.headers.get('content-type') || ''),
        cacheControl: String(response.headers.get('cache-control') || '')
    };
}

function remoteMatches(remote, asset) {
    return (
        remote.exists &&
        remote.size === asset.size &&
        remote.sha256 === asset.sha256 &&
        remote.contentType === asset.contentType &&
        remote.cacheControl === asset.cacheControl
    );
}

function selectUploadAction(remote, asset) {
    if (remoteMatches(remote, asset)) return 'skip';
    if (remote.exists) return 'conflict';
    return 'upload';
}

async function uploadAudioAsset(client, config, entry, asset) {
    const { Upload } = loadS3CompatibleSdk();
    const upload = new Upload({
        client,
        queueSize: 2,
        partSize: 8 * 1024 * 1024,
        leavePartsOnError: false,
        params: {
            Bucket: config.bucket,
            Key: asset.objectKey,
            Body: fs.createReadStream(entry.absoluteSourcePath),
            ContentType: asset.contentType,
            CacheControl: asset.cacheControl,
            Metadata: {
                sha256: asset.sha256,
                eventid: asset.eventId,
                assetid: asset.assetId,
                language: asset.language
            },
            ACL: 'public-read'
        }
    });
    await upload.done();
}

async function uploadManifest(client, config, manifest) {
    const { PutObjectCommand } = loadS3CompatibleSdk();
    await client.send(
        new PutObjectCommand({
            Bucket: config.bucket,
            Key: config.manifestKey,
            Body: `${JSON.stringify(manifest, null, 2)}\n`,
            ContentType: 'application/json; charset=utf-8',
            CacheControl: 'no-cache',
            ACL: 'private'
        })
    );
}

async function pushAudioAssets(entries, manifest, config, options = {}) {
    if (options.force === true) {
        throw new Error(
            'Immutable release objects cannot be overwritten; publish changed audio under a new versioned key'
        );
    }

    const summary = {
        dryRun: options.dryRun === true,
        planned: 0,
        uploaded: 0,
        skipped: 0,
        conflicts: 0,
        failed: 0,
        manifestUploaded: false,
        manifestPlanned: false,
        results: []
    };
    if (options.dryRun) {
        for (let index = 0; index < manifest.assets.length; index += 1) {
            const asset = manifest.assets[index];
            const entry = entries[index] || {};
            try {
                const remote = await readPublicRemoteState(
                    { ...entry, ...asset, deliveryUrl: asset.url || entry.deliveryUrl },
                    options.fetchImpl
                );
                const action = selectUploadAction(remote, asset);
                if (action === 'skip') {
                    summary.skipped += 1;
                    summary.results.push({ objectKey: asset.objectKey, action: 'would-skip' });
                } else if (action === 'conflict') {
                    summary.conflicts += 1;
                    summary.results.push({
                        objectKey: asset.objectKey,
                        action: 'conflict',
                        error: 'remote immutable object differs; publish the audio under a new versioned object key'
                    });
                } else {
                    summary.planned += 1;
                    summary.results.push({ objectKey: asset.objectKey, action: 'would-upload' });
                }
            } catch (error) {
                summary.failed += 1;
                summary.results.push({ objectKey: asset.objectKey, action: 'failed', error: error.message });
            }
        }
        summary.manifestPlanned = summary.conflicts === 0 && summary.failed === 0;
        return summary;
    }

    const client = createS3Client(config);
    try {
        for (let index = 0; index < manifest.assets.length; index += 1) {
            const asset = manifest.assets[index];
            const entry = entries[index];
            try {
                const remote = await readRemoteState(client, config.bucket, asset.objectKey);
                const action = selectUploadAction(remote, asset);
                if (action === 'skip') {
                    summary.skipped += 1;
                    summary.results.push({ objectKey: asset.objectKey, action: 'skipped' });
                    continue;
                }
                if (action === 'conflict') {
                    summary.conflicts += 1;
                    summary.results.push({
                        objectKey: asset.objectKey,
                        action: 'conflict',
                        error: 'remote immutable object differs; publish the audio under a new versioned object key'
                    });
                    continue;
                }
                await uploadAudioAsset(client, config, entry, asset);
                summary.uploaded += 1;
                summary.results.push({ objectKey: asset.objectKey, action: 'uploaded' });
            } catch (error) {
                summary.failed += 1;
                summary.results.push({ objectKey: asset.objectKey, action: 'failed', error: error.message });
            }
        }
        if (summary.conflicts === 0 && summary.failed === 0) {
            await uploadManifest(client, config, manifest);
            summary.manifestUploaded = true;
        }
    } finally {
        client.destroy();
    }
    return summary;
}

async function verifyAudioAssets(manifest, config) {
    const client = createS3Client(config);
    const results = [];
    try {
        for (const asset of manifest.assets) {
            try {
                const remote = await readRemoteState(client, config.bucket, asset.objectKey);
                results.push({
                    objectKey: asset.objectKey,
                    ok: remoteMatches(remote, asset),
                    exists: remote.exists,
                    expectedSize: asset.size,
                    remoteSize: remote.size || 0,
                    checksumMatched: remote.sha256 === asset.sha256,
                    contentType: remote.contentType || ''
                });
            } catch (error) {
                results.push({ objectKey: asset.objectKey, ok: false, error: error.message });
            }
        }
    } finally {
        client.destroy();
    }
    return results;
}

function mergeAudioCorsRules(corsRules) {
    const publicPlaybackRules = [];
    const unrelatedRules = [];
    for (const rule of corsRules || []) {
        const methods = new Set((rule?.AllowedMethods || []).map((value) => String(value).toUpperCase()));
        const origins = new Set(rule?.AllowedOrigins || []);
        if (origins.has('*') && methods.has('GET') && methods.has('HEAD')) publicPlaybackRules.push(rule);
        else if (rule) unrelatedRules.push(rule);
    }
    const existingHeaders = publicPlaybackRules.flatMap((rule) => rule.AllowedHeaders || []);
    const allowedHeaders = existingHeaders.some((header) => header === '*')
        ? ['*']
        : [...new Set([...existingHeaders, 'Range'].map((header) => String(header).toLowerCase()))].sort();
    const exposeHeaders = [
        ...new Set([
            ...publicPlaybackRules.flatMap((rule) => rule.ExposeHeaders || []),
            'Accept-Ranges',
            'Content-Length',
            'Content-Range',
            'ETag'
        ])
    ].sort((left, right) => left.localeCompare(right));
    return [
        ...unrelatedRules,
        {
            AllowedHeaders: allowedHeaders,
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: exposeHeaders,
            MaxAgeSeconds: Math.max(86400, ...publicPlaybackRules.map((rule) => Number(rule.MaxAgeSeconds || 0)))
        }
    ];
}

async function readBucketCors(client, bucket) {
    const { GetBucketCorsCommand } = loadS3CompatibleSdk();
    try {
        const result = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
        return result.CORSRules || [];
    } catch (error) {
        if (isNotFound(error)) return [];
        throw error;
    }
}

async function configurePublicAudioAccess(config, entries, options = {}) {
    const { PutBucketCorsCommand, PutObjectAclCommand } = loadS3CompatibleSdk();
    const client = createS3Client(config);
    try {
        const currentCorsRules = await readBucketCors(client, config.bucket);
        const corsRules = mergeAudioCorsRules(currentCorsRules);
        if (!options.dryRun) {
            for (const entry of entries) {
                await client.send(
                    new PutObjectAclCommand({ Bucket: config.bucket, Key: entry.objectKey, ACL: 'public-read' })
                );
            }
            await client.send(
                new PutBucketCorsCommand({
                    Bucket: config.bucket,
                    CORSConfiguration: { CORSRules: corsRules }
                })
            );
        }
        return { dryRun: options.dryRun === true, publicObjectCount: entries.length, corsRules };
    } finally {
        client.destroy();
    }
}

function printIssues(issues) {
    for (const issue of issues) console.error(`ERROR ${issue}`);
}

function printPushSummary(summary, config) {
    for (const result of summary.results) {
        const suffix = result.error ? `: ${result.error}` : '';
        console.log(`${result.action}: oss://${config.bucket}/${result.objectKey}${suffix}`);
    }
    console.log(
        summary.dryRun
            ? `Audio push dry-run: ${summary.planned} would upload, ${summary.skipped} would skip, ` +
                  `${summary.conflicts} conflict(s), ${summary.failed} check(s) failed; manifest ` +
                  `${summary.manifestPlanned ? 'would upload' : 'would not upload'}.`
            : `Audio push: ${summary.uploaded} uploaded, ${summary.skipped} skipped, ` +
                  `${summary.conflicts} conflict(s), ${summary.failed} failed, manifest ` +
                  `${summary.manifestUploaded ? 'uploaded' : 'not uploaded'}.`
    );
}

async function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    const command = args._[0] || 'check';
    if (args.help) {
        printUsage();
        return;
    }
    if (!['check', 'manifest', 'push', 'verify', 'publish-access'].includes(command)) {
        printUsage();
        throw new Error(`Unknown command: ${command}`);
    }
    if (command === 'push' && args.force) {
        throw new Error('--force is not supported for immutable release objects; use a new versioned object key');
    }

    const entries = collectAudioAssets(ROOT);
    const issues = validateAudioAssets(entries);
    if (entries.length === 0) issues.push('No Archive audio assets were found');
    if (issues.length > 0) {
        printIssues(issues);
        process.exitCode = 1;
        return;
    }

    if (command === 'check') {
        const output = { ok: true, assets: entries.length };
        console.log(
            args.json ? JSON.stringify(output, null, 2) : `Audio storage check passed: ${entries.length} asset(s).`
        );
        return;
    }

    const config = resolveOssConfig(args, entries);
    if (command === 'publish-access') {
        const result = await configurePublicAudioAccess(config, entries, { dryRun: args['dry-run'] === true });
        if (args.json) console.log(JSON.stringify(result, null, 2));
        else {
            console.log(
                `${result.dryRun ? 'Would configure' : 'Configured'} public read for ` +
                    `${result.publicObjectCount} OSS audio object(s); ${config.manifestKey} remains private.`
            );
            console.log(
                `${result.dryRun ? 'Would merge' : 'Merged'} audio playback CORS with ` +
                    `${result.corsRules.length} total rule(s).`
            );
        }
        return;
    }

    const manifest = await buildManifest(entries);
    const outputPath = path.resolve(args.output || DEFAULT_MANIFEST_PATH);
    if (command === 'manifest') {
        writeManifest(manifest, outputPath);
        console.log(
            args.json
                ? JSON.stringify(manifest, null, 2)
                : `Audio manifest: ${toPosixPath(path.relative(ROOT, outputPath))}`
        );
        return;
    }

    if (command === 'push') {
        writeManifest(manifest, outputPath);
        const summary = await pushAudioAssets(entries, manifest, config, {
            dryRun: args['dry-run'] === true,
            force: args.force === true
        });
        if (args.json) console.log(JSON.stringify(summary, null, 2));
        else printPushSummary(summary, config);
        if (summary.conflicts > 0 || summary.failed > 0) process.exitCode = 1;
        return;
    }

    const results = await verifyAudioAssets(manifest, config);
    const failed = results.filter((result) => !result.ok);
    if (args.json) console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
    else {
        for (const result of results) {
            console.log(`${result.ok ? 'verified' : 'mismatch'}: oss://${config.bucket}/${result.objectKey}`);
        }
        console.log(`Audio verify: ${results.length - failed.length} passed, ${failed.length} failed.`);
    }
    if (failed.length > 0) process.exitCode = 1;
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`OSS audio storage error: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = {
    AUDIO_CONTENT_TYPES,
    DEFAULT_BUCKET,
    DEFAULT_ENDPOINT,
    DEFAULT_MANIFEST_KEY,
    DEFAULT_PROVIDER,
    RELEASE_PREFIX,
    buildManifest,
    collectAudioAssets,
    configurePublicAudioAccess,
    contentTypeForPath,
    mergeAudioCorsRules,
    normalizeObjectKey,
    parseArgs,
    pushAudioAssets,
    readPublicRemoteState,
    remoteMatches,
    resolveOssConfig,
    selectUploadAction,
    sha256File,
    validateAudioAssets,
    verifyAudioAssets,
    writeManifest
};
