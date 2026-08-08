#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'generated', 'ai100-first-40-and-gaming');
const AUDIO_MANIFEST_PATH = path.join(OUTPUT_ROOT, 'audio-manifest.json');
const SCRIPT_MANIFEST_PATH = path.join(
    ROOT,
    'resources',
    'audio',
    'scripts',
    'ai100-first-40-and-gaming',
    'manifest.json'
);
const QUALITY_REPORT_PATH = path.join(OUTPUT_ROOT, 'quality-report.json');
const RESOURCE_MAP_PATH = path.join(OUTPUT_ROOT, 'resource-map.json');
const TARGET_I = -16;
const TARGET_TP = -1;
const LOUDNESS_TOLERANCE = 0.8;
const TRUE_PEAK_CEILING = -0.8;

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.writeFileSync(filePath, formatted);
}

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
        throw new Error(`${command} exited ${result.status}: ${detail.slice(-3000)}`);
    }
    return result;
}

function probeAudio(filePath) {
    const result = run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration,size:stream=sample_rate,channels,codec_name,bit_rate',
        '-of',
        'json',
        filePath
    ]);
    const data = JSON.parse(result.stdout);
    const stream = data.streams?.[0];
    return {
        durationSec: Number(data.format?.duration),
        sizeBytes: Number(data.format?.size),
        sampleRate: Number(stream?.sample_rate),
        channels: Number(stream?.channels),
        codec: stream?.codec_name,
        bitrate: Number(stream?.bit_rate)
    };
}

function measureLoudness(filePath) {
    const result = spawnSync(
        'ffmpeg',
        [
            '-hide_banner',
            '-nostats',
            '-i',
            filePath,
            '-af',
            `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=11:print_format=json`,
            '-f',
            'null',
            '-'
        ],
        { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
    );
    if (result.status !== 0) throw new Error(`ffmpeg loudness measurement failed for ${filePath}`);
    const matches = result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/g);
    if (!matches?.length) throw new Error(`Could not parse loudness for ${filePath}`);
    const data = JSON.parse(matches.at(-1));
    return {
        integratedLufs: Number(data.input_i),
        truePeakDbtp: Number(data.input_tp),
        loudnessRangeLu: Number(data.input_lra),
        thresholdLufs: Number(data.input_thresh)
    };
}

function expectedAssetKeys(scriptManifest) {
    const keys = new Set();
    for (const [scopeId, scope] of Object.entries(scriptManifest.scopes)) {
        for (const event of scope.events) {
            for (const locale of ['zh', 'en']) {
                for (const mode of ['standalone', 'storyline']) {
                    keys.add(`${scopeId}/${event.eventId}/${locale}/${mode}`);
                }
            }
        }
    }
    return keys;
}

function buildResourceMap(audioManifest, scriptManifest, results) {
    const resultByKey = new Map(
        results.map((result) => [`${result.scopeId}/${result.eventId}/${result.locale}/${result.mode}`, result])
    );
    const scopes = {};
    for (const [scopeId, scope] of Object.entries(scriptManifest.scopes)) {
        scopes[scopeId] = {
            eventCount: scope.events.length,
            events: scope.events.map((event) => {
                const audio = {};
                for (const mode of ['standalone', 'storyline']) {
                    audio[mode] = {};
                    for (const locale of ['zh', 'en']) {
                        const item = resultByKey.get(`${scopeId}/${event.eventId}/${locale}/${mode}`);
                        audio[mode][locale] = {
                            path: item.path,
                            durationSec: item.durationSec,
                            status: item.passed ? 'validated' : 'failed'
                        };
                    }
                }
                return {
                    sequenceIndex: event.sequenceIndex,
                    eventId: event.eventId,
                    variantId: event.variantId,
                    styleAuthority: event.styleAuthority,
                    title: event.title,
                    audio
                };
            })
        };
    }
    return {
        schemaVersion: 1,
        status: results.every((result) => result.passed) ? 'validated-awaiting-listening-review' : 'quality-failed',
        sourceAudioManifest: path.relative(ROOT, AUDIO_MANIFEST_PATH),
        specification: audioManifest.specification,
        scopes
    };
}

async function main() {
    if (!fs.existsSync(AUDIO_MANIFEST_PATH)) throw new Error(`Missing ${path.relative(ROOT, AUDIO_MANIFEST_PATH)}`);
    const audioManifest = readJson(AUDIO_MANIFEST_PATH);
    const scriptManifest = readJson(SCRIPT_MANIFEST_PATH);
    const expectedKeys = expectedAssetKeys(scriptManifest);
    const actualKeys = new Set();
    const results = [];
    const failures = [];
    let totalBytes = 0;

    for (const [index, asset] of audioManifest.assets.entries()) {
        const key = `${asset.scopeId}/${asset.eventId}/${asset.locale}/${asset.mode}`;
        actualKeys.add(key);
        const filePath = path.join(ROOT, asset.path);
        const issues = [];
        if (!fs.existsSync(filePath)) {
            issues.push('missing-file');
            results.push({ ...asset, passed: false, issues });
            failures.push(`${asset.path}: missing file`);
            continue;
        }
        const probe = probeAudio(filePath);
        const loudness = measureLoudness(filePath);
        totalBytes += probe.sizeBytes;
        if (probe.durationSec < 40 || probe.durationSec > 150) issues.push('duration-outside-40-150s');
        if (probe.sampleRate !== 44100) issues.push('sample-rate-not-44100');
        if (probe.channels !== 1) issues.push('not-mono');
        if (probe.codec !== 'mp3') issues.push('codec-not-mp3');
        if (Math.abs(loudness.integratedLufs - TARGET_I) > LOUDNESS_TOLERANCE) {
            issues.push('integrated-loudness-outside-tolerance');
        }
        if (loudness.truePeakDbtp > TRUE_PEAK_CEILING) issues.push('true-peak-above-ceiling');
        const result = {
            scopeId: asset.scopeId,
            sequenceIndex: asset.sequenceIndex,
            eventId: asset.eventId,
            locale: asset.locale,
            mode: asset.mode,
            path: asset.path,
            inputHash: asset.inputHash,
            durationSec: Number(probe.durationSec.toFixed(3)),
            sizeBytes: probe.sizeBytes,
            sampleRate: probe.sampleRate,
            channels: probe.channels,
            codec: probe.codec,
            bitrate: probe.bitrate,
            integratedLufs: loudness.integratedLufs,
            truePeakDbtp: loudness.truePeakDbtp,
            loudnessRangeLu: loudness.loudnessRangeLu,
            passed: issues.length === 0,
            issues
        };
        results.push(result);
        if (issues.length) failures.push(`${asset.path}: ${issues.join(', ')}`);
        if (index === 0 || (index + 1) % 20 === 0 || index + 1 === audioManifest.assets.length) {
            console.log(`Measured assets: ${index + 1}/${audioManifest.assets.length}`);
        }
    }

    for (const key of expectedKeys) {
        if (!actualKeys.has(key)) failures.push(`Missing manifest asset ${key}`);
    }
    for (const key of actualKeys) {
        if (!expectedKeys.has(key)) failures.push(`Unexpected manifest asset ${key}`);
    }

    const durations = results
        .filter((result) => Number.isFinite(result.durationSec))
        .map((result) => result.durationSec);
    const loudnessValues = results
        .filter((result) => Number.isFinite(result.integratedLufs))
        .map((result) => result.integratedLufs);
    const report = {
        schemaVersion: 1,
        status: failures.length ? 'failed' : 'passed',
        specification: audioManifest.specification,
        summary: {
            expectedAssetCount: expectedKeys.size,
            measuredAssetCount: results.length,
            passedAssetCount: results.filter((result) => result.passed).length,
            failureCount: failures.length,
            totalSizeBytes: totalBytes,
            durationSec: {
                minimum: Math.min(...durations),
                maximum: Math.max(...durations),
                average: durations.reduce((sum, value) => sum + value, 0) / durations.length,
                total: durations.reduce((sum, value) => sum + value, 0)
            },
            integratedLufs: {
                minimum: Math.min(...loudnessValues),
                maximum: Math.max(...loudnessValues),
                average: loudnessValues.reduce((sum, value) => sum + value, 0) / loudnessValues.length
            }
        },
        failures,
        assets: results
    };
    await writeFormatted(QUALITY_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    const resourceMap = buildResourceMap(audioManifest, scriptManifest, results);
    await writeFormatted(RESOURCE_MAP_PATH, `${JSON.stringify(resourceMap, null, 2)}\n`);
    if (failures.length) {
        for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`);
        if (failures.length > 80) console.error(`- ... ${failures.length - 80} more failures`);
        process.exit(1);
    }
    console.log(
        `Audio assets valid: ${results.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB, loudness and media specifications passed.`
    );
}

await main();
