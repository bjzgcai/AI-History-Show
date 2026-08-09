#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_ENDPOINT = 'https://s3.inner.bza.edu.cn';
const DEFAULT_BUCKET = 'ai-history';
const DEFAULT_REGION = 'us-east-1';
const DEFAULT_MANIFEST_PATH = path.join(ROOT, '.tmp', 'audio', 'audio-manifest.json');
const DEFAULT_MANIFEST_KEY = 'audio/manifests/audio-manifest.json';
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const AUDIO_CONTENT_TYPES = new Map([
    ['.aac', 'audio/aac'],
    ['.m4a', 'audio/mp4'],
    ['.mp3', 'audio/mpeg'],
    ['.ogg', 'audio/ogg'],
    ['.wav', 'audio/wav']
]);

function printUsage() {
    console.log(
        [
            'Usage:',
            '  node scripts/sync-audio-s3.js check',
            '  node scripts/sync-audio-s3.js manifest [--output FILE] [--json]',
            '  node scripts/sync-audio-s3.js push [--dry-run] [--force] [--output FILE] [--json]',
            '  node scripts/sync-audio-s3.js verify [--json]',
            '  node scripts/sync-audio-s3.js publish-access [--dry-run] [--json]',
            '',
            'Configuration:',
            `  BZA_S3_ENDPOINT       S3 endpoint (default: ${DEFAULT_ENDPOINT})`,
            `  BZA_S3_BUCKET         bucket name (default: ${DEFAULT_BUCKET})`,
            `  BZA_S3_REGION         signing region (default: ${DEFAULT_REGION})`,
            '  BZA_S3_FORCE_PATH_STYLE=false to disable path-style access',
            `  BZA_S3_MANIFEST_KEY   remote manifest key (default: ${DEFAULT_MANIFEST_KEY})`,
            '  AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for push/verify.',
            '',
            'Credentials must come from the environment or the standard AWS credential chain.'
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

function normalizeObjectKey(value) {
    return String(value || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/{2,}/g, '/');
}

function contentTypeForPath(filePath) {
    return AUDIO_CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) || '';
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
            const storage = asset.storage && typeof asset.storage === 'object' ? asset.storage : {};
            const configuredSourcePath = String(storage.sourcePath || asset.path || '').trim();
            const sourcePath = isRemotePath(configuredSourcePath) ? '' : configuredSourcePath;
            entries.push({
                eventId,
                assetId: String(asset.id || '').trim(),
                language: String(asset.language || '').trim(),
                sourcePath: toPosixPath(sourcePath),
                absoluteSourcePath: sourcePath ? path.resolve(root, sourcePath) : '',
                provider: String(storage.provider || '').trim(),
                bucket: String(storage.bucket || '').trim(),
                objectKey: normalizeObjectKey(storage.objectKey),
                contentType: String(storage.contentType || contentTypeForPath(sourcePath)).trim(),
                cacheControl: String(storage.cacheControl || DEFAULT_CACHE_CONTROL).trim(),
                deliveryUrl: String(asset.deliveryUrl || storage.publicUrl || '').trim()
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
        if (entry.provider !== 'bza-s3') issues.push(`${label}: storage.provider must be bza-s3`);
        if (!entry.bucket) issues.push(`${label}: storage.bucket is required`);
        if (!entry.objectKey) {
            issues.push(`${label}: storage.objectKey is required`);
        } else {
            if (!entry.objectKey.startsWith('audio/')) {
                issues.push(`${label}: storage.objectKey must stay under audio/: ${entry.objectKey}`);
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
        provider: 'bza-s3',
        assets
    };
}

function writeManifest(manifest, outputPath = DEFAULT_MANIFEST_PATH) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return outputPath;
}

function resolveS3Config(args, entries) {
    const configuredBuckets = new Set(entries.map((entry) => entry.bucket).filter(Boolean));
    const bucket = String(
        args.bucket || process.env.BZA_S3_BUCKET || [...configuredBuckets][0] || DEFAULT_BUCKET
    ).trim();
    if (configuredBuckets.size > 1 && !args.bucket && !process.env.BZA_S3_BUCKET) {
        throw new Error(`Audio assets reference multiple buckets: ${[...configuredBuckets].join(', ')}`);
    }
    if ([...configuredBuckets].some((value) => value !== bucket)) {
        throw new Error(`Configured bucket ${bucket} does not match Archive audio metadata`);
    }

    return {
        endpoint: String(args.endpoint || process.env.BZA_S3_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/+$/, ''),
        bucket,
        region: String(args.region || process.env.BZA_S3_REGION || process.env.AWS_REGION || DEFAULT_REGION).trim(),
        forcePathStyle: String(process.env.BZA_S3_FORCE_PATH_STYLE || 'true').toLowerCase() !== 'false',
        manifestKey: normalizeObjectKey(args['manifest-key'] || process.env.BZA_S3_MANIFEST_KEY || DEFAULT_MANIFEST_KEY)
    };
}

function loadS3Sdk() {
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
    const { S3Client } = loadS3Sdk();
    return new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.forcePathStyle
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
    const { HeadObjectCommand } = loadS3Sdk();
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

function remoteMatches(remote, asset) {
    return (
        remote.exists &&
        remote.size === asset.size &&
        remote.sha256 === asset.sha256 &&
        remote.contentType === asset.contentType &&
        remote.cacheControl === asset.cacheControl
    );
}

function selectUploadAction(remote, asset, force = false) {
    if (force) return 'upload';
    if (remoteMatches(remote, asset)) return 'skip';
    if (remote.exists) return 'conflict';
    return 'upload';
}

async function uploadAudioAsset(client, config, entry, asset) {
    const { Upload } = loadS3Sdk();
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
            }
        }
    });
    await upload.done();
}

async function uploadManifest(client, config, manifest) {
    const { PutObjectCommand } = loadS3Sdk();
    await client.send(
        new PutObjectCommand({
            Bucket: config.bucket,
            Key: config.manifestKey,
            Body: `${JSON.stringify(manifest, null, 2)}\n`,
            ContentType: 'application/json; charset=utf-8',
            CacheControl: 'no-cache'
        })
    );
}

async function pushAudioAssets(entries, manifest, config, options = {}) {
    const summary = { planned: 0, uploaded: 0, skipped: 0, failed: 0, manifestUploaded: false, results: [] };
    if (options.dryRun) {
        for (const asset of manifest.assets) {
            summary.planned += 1;
            summary.results.push({ objectKey: asset.objectKey, action: 'would-upload' });
        }
        return summary;
    }

    const client = createS3Client(config);
    try {
        for (let index = 0; index < manifest.assets.length; index += 1) {
            const asset = manifest.assets[index];
            const entry = entries[index];
            try {
                const remote = await readRemoteState(client, config.bucket, asset.objectKey);
                const action = selectUploadAction(remote, asset, options.force === true);
                if (action === 'skip') {
                    summary.skipped += 1;
                    summary.results.push({ objectKey: asset.objectKey, action: 'skipped' });
                    continue;
                }
                if (action === 'conflict') {
                    summary.failed += 1;
                    summary.results.push({
                        objectKey: asset.objectKey,
                        action: 'conflict',
                        error: 'remote object exists with different content or metadata; use --force to overwrite'
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
        if (summary.failed === 0) {
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

function mergePublicReleasePolicy(policy, bucket) {
    const statementId = 'PublicReadAudioReleases';
    const statements = Array.isArray(policy.Statement) ? policy.Statement : policy.Statement ? [policy.Statement] : [];
    return {
        ...policy,
        Version: policy.Version || '2012-10-17',
        Statement: [
            ...statements.filter((statement) => statement && statement.Sid !== statementId),
            {
                Sid: statementId,
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${bucket}/audio/releases/*`
            }
        ]
    };
}

function mergeAudioCorsRules(corsRules) {
    const ruleId = 'PublicAudioPlayback';
    return [
        ...(corsRules || []).filter((rule) => rule && rule.ID !== ruleId),
        {
            ID: ruleId,
            AllowedHeaders: ['Range'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['Accept-Ranges', 'Content-Length', 'Content-Range', 'ETag'],
            MaxAgeSeconds: 86400
        }
    ];
}

async function readBucketPolicy(client, bucket) {
    const { GetBucketPolicyCommand } = loadS3Sdk();
    try {
        const result = await client.send(new GetBucketPolicyCommand({ Bucket: bucket }));
        return result.Policy ? JSON.parse(result.Policy) : {};
    } catch (error) {
        if (isNotFound(error)) return {};
        throw error;
    }
}

async function readBucketCors(client, bucket) {
    const { GetBucketCorsCommand } = loadS3Sdk();
    try {
        const result = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
        return result.CORSRules || [];
    } catch (error) {
        if (isNotFound(error)) return [];
        throw error;
    }
}

async function configurePublicAudioAccess(config, options = {}) {
    const { PutBucketCorsCommand, PutBucketPolicyCommand } = loadS3Sdk();
    const client = createS3Client(config);
    try {
        const [currentPolicy, currentCorsRules] = await Promise.all([
            readBucketPolicy(client, config.bucket),
            readBucketCors(client, config.bucket)
        ]);
        const policy = mergePublicReleasePolicy(currentPolicy, config.bucket);
        const corsRules = mergeAudioCorsRules(currentCorsRules);
        if (!options.dryRun) {
            await client.send(
                new PutBucketPolicyCommand({
                    Bucket: config.bucket,
                    Policy: JSON.stringify(policy)
                })
            );
            await client.send(
                new PutBucketCorsCommand({
                    Bucket: config.bucket,
                    CORSConfiguration: { CORSRules: corsRules }
                })
            );
        }
        return { dryRun: options.dryRun === true, policy, corsRules };
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
        console.log(`${result.action}: s3://${config.bucket}/${result.objectKey}${suffix}`);
    }
    console.log(
        summary.planned > 0
            ? `Audio push dry-run: ${summary.planned} object(s) would upload; manifest would upload after success.`
            : `Audio push: ${summary.uploaded} uploaded, ${summary.skipped} skipped, ${summary.failed} failed, manifest ${
                  summary.manifestUploaded ? 'uploaded' : 'not uploaded'
              }.`
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

    const config = resolveS3Config(args, entries);
    if (command === 'publish-access') {
        const result = await configurePublicAudioAccess(config, { dryRun: args['dry-run'] === true });
        if (args.json) console.log(JSON.stringify(result, null, 2));
        else {
            console.log(
                `${result.dryRun ? 'Would configure' : 'Configured'} public read for ` +
                    `s3://${config.bucket}/audio/releases/*; audio/manifests/* remains private.`
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
        if (summary.failed > 0) process.exitCode = 1;
        return;
    }

    const results = await verifyAudioAssets(manifest, config);
    const failed = results.filter((result) => !result.ok);
    if (args.json) console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
    else {
        for (const result of results) {
            console.log(`${result.ok ? 'verified' : 'mismatch'}: s3://${config.bucket}/${result.objectKey}`);
        }
        console.log(`Audio verify: ${results.length - failed.length} passed, ${failed.length} failed.`);
    }
    if (failed.length > 0) process.exitCode = 1;
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`Audio storage error: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = {
    AUDIO_CONTENT_TYPES,
    DEFAULT_BUCKET,
    DEFAULT_ENDPOINT,
    DEFAULT_MANIFEST_KEY,
    buildManifest,
    collectAudioAssets,
    configurePublicAudioAccess,
    contentTypeForPath,
    mergeAudioCorsRules,
    mergePublicReleasePolicy,
    normalizeObjectKey,
    parseArgs,
    pushAudioAssets,
    remoteMatches,
    resolveS3Config,
    selectUploadAction,
    sha256File,
    validateAudioAssets,
    verifyAudioAssets,
    writeManifest
};
