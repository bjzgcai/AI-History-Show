#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT_ROOT = path.join(ROOT, 'resources', 'audio', 'scripts', 'ai100-first-40-and-gaming');
const SCRIPT_MANIFEST_PATH = path.join(SCRIPT_ROOT, 'manifest.json');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'generated', 'ai100-first-40-and-gaming');
const AUDIO_ROOT = path.join(OUTPUT_ROOT, 'audio');
const AUDIO_MANIFEST_PATH = path.join(OUTPUT_ROOT, 'audio-manifest.json');
const CACHE_ROOT = path.join(ROOT, '.tmp', 'audio-story-turn-cache');
const CACHE_AUDIO_ROOT = path.join(CACHE_ROOT, 'audio');
const CACHE_INPUT_ROOT = path.join(CACHE_ROOT, 'input');
const GENERATOR_PATH = path.join(ROOT, 'scripts', 'generate-dialogue-audio.mjs');
const ENV_PATH = '/home/ubuntu/.openclaw/workspace/.secrets/tts.env';
const MODEL = 'seed-tts-2.0';
const ENDPOINT = 'https://openspeech.bytedance.com/api/v3/plan/tts/unidirectional';
const NORMAL_PAUSE_MS = 450;
const SUMMARY_PAUSE_MS = 600;
const TARGET_I = -16;
const TARGET_TP = -1;
const TARGET_LRA = 11;

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, formatted);
}

function fail(message) {
    throw new Error(message);
}

function parseArgs(argv) {
    const options = { concurrency: 2, retries: 3, maxNewClips: Infinity, clipsOnly: false };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--clips-only') {
            options.clipsOnly = true;
            continue;
        }
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) fail(`${arg} requires a value`);
        index += 1;
        if (arg === '--concurrency') options.concurrency = Number(value);
        else if (arg === '--retries') options.retries = Number(value);
        else if (arg === '--max-new-clips') options.maxNewClips = Number(value);
        else fail(`Unknown option ${arg}`);
    }
    if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 6) {
        fail('--concurrency must be an integer from 1 to 6');
    }
    if (!Number.isInteger(options.retries) || options.retries < 1 || options.retries > 10) {
        fail('--retries must be an integer from 1 to 10');
    }
    if (!(options.maxNewClips === Infinity || (Number.isInteger(options.maxNewClips) && options.maxNewClips >= 1))) {
        fail('--max-new-clips must be a positive integer');
    }
    return options;
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        stdio: options.inherit ? 'inherit' : 'pipe'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
        throw new Error(`${command} exited ${result.status}${detail ? `: ${detail.slice(-3000)}` : ''}`);
    }
    return result;
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function turnsFor(event, locale, mode) {
    const content = event.locales[locale];
    const intro = mode === 'standalone' ? content.standaloneIntro : content.storylineBridgeIn;
    return [...intro, ...content.body, ...content.closing];
}

function roleLabel(role, locale) {
    if (locale === 'zh') {
        return role === 'SUMMARY' ? '总结：' : `${role}：`;
    }
    return role === 'SUMMARY' ? 'Summary: ' : `${role}: `;
}

function speedForRole(role, locale) {
    if (role === 'A') return 1;
    if (locale === 'zh') return 0.99;
    return role === 'SUMMARY' ? 0.94 : 0.96;
}

function clipIdentity(locale, turn, profile) {
    return {
        schemaVersion: 1,
        provider: 'volc',
        endpoint: ENDPOINT,
        model: MODEL,
        locale,
        role: turn.role,
        text: turn.text,
        voice: turn.role === 'A' ? profile.voiceA : turn.role === 'SUMMARY' ? profile.voiceSummary : profile.voiceB,
        instruction:
            turn.role === 'A'
                ? profile.instructionA
                : turn.role === 'SUMMARY'
                  ? profile.instructionSummary
                  : profile.instructionB,
        speed: speedForRole(turn.role, locale)
    };
}

function probeAudio(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        const result = run('ffprobe', [
            '-v',
            'error',
            '-show_entries',
            'format=duration:stream=sample_rate,channels,codec_name',
            '-of',
            'json',
            filePath
        ]);
        const data = JSON.parse(result.stdout);
        const stream = data.streams?.[0];
        const duration = Number(data.format?.duration);
        if (!stream || !Number.isFinite(duration) || duration <= 0) return null;
        return {
            durationSec: duration,
            sampleRate: Number(stream.sample_rate),
            channels: Number(stream.channels),
            codec: stream.codec_name
        };
    } catch {
        return null;
    }
}

function buildJobs(manifest) {
    const clips = new Map();
    const assets = [];
    for (const [scopeId, scope] of Object.entries(manifest.scopes)) {
        for (const event of scope.events) {
            const stem = `${String(event.sequenceIndex).padStart(2, '0')}-${event.eventId}`;
            for (const locale of ['zh', 'en']) {
                const profile = manifest.voiceProfiles[locale];
                for (const mode of ['standalone', 'storyline']) {
                    const turns = turnsFor(event, locale, mode);
                    const turnHashes = turns.map((turn) => {
                        const identity = clipIdentity(locale, turn, profile);
                        const hash = sha256(JSON.stringify(identity));
                        if (!clips.has(hash)) {
                            clips.set(hash, {
                                hash,
                                locale,
                                turn,
                                profile,
                                identity,
                                inputPath: path.join(CACHE_INPUT_ROOT, `${hash}.txt`),
                                audioPath: path.join(CACHE_AUDIO_ROOT, `${hash}.wav`)
                            });
                        }
                        return hash;
                    });
                    const outputPath = path.join(AUDIO_ROOT, scopeId, mode, locale, `${stem}.mp3`);
                    const relativePath = path.relative(ROOT, outputPath);
                    const inputHash = sha256(
                        JSON.stringify({
                            scopeId,
                            eventId: event.eventId,
                            locale,
                            mode,
                            turnHashes,
                            normalPauseMs: NORMAL_PAUSE_MS,
                            summaryPauseMs: SUMMARY_PAUSE_MS,
                            loudness: { integrated: TARGET_I, truePeak: TARGET_TP, range: TARGET_LRA }
                        })
                    );
                    assets.push({
                        scopeId,
                        sequenceIndex: event.sequenceIndex,
                        eventId: event.eventId,
                        variantId: event.variantId,
                        locale,
                        mode,
                        inputHash,
                        turnHashes,
                        turns,
                        path: relativePath,
                        outputPath
                    });
                }
            }
        }
    }
    return { clips: [...clips.values()], assets };
}

function generatorArgs(clip) {
    const { profile } = clip;
    return [
        GENERATOR_PATH,
        clip.inputPath,
        clip.audioPath,
        '--provider',
        'volc',
        '--volc-base-url',
        ENDPOINT,
        '--model',
        MODEL,
        '--lang',
        profile.language,
        '--voice-a',
        profile.voiceA,
        '--voice-b',
        profile.voiceB,
        '--voice-summary',
        profile.voiceSummary,
        '--instruction-a',
        profile.instructionA,
        '--instruction-b',
        profile.instructionB,
        '--instruction-summary',
        profile.instructionSummary,
        '--speed-a',
        String(speedForRole('A', clip.locale)),
        '--speed-b',
        String(speedForRole('B', clip.locale)),
        '--speed-summary',
        String(speedForRole('SUMMARY', clip.locale)),
        '--pause-ms',
        '0',
        '--summary-pause-ms',
        '0',
        '--env-file',
        ENV_PATH
    ];
}

function prepareClipInput(clip) {
    fs.mkdirSync(path.dirname(clip.inputPath), { recursive: true });
    if (!fs.existsSync(clip.inputPath)) {
        fs.writeFileSync(clip.inputPath, `${roleLabel(clip.turn.role, clip.locale)}${clip.turn.text}\n`);
    }
}

function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function generateClip(clip, retries) {
    if (probeAudio(clip.audioPath)) return { cached: true };
    prepareClipInput(clip);
    fs.mkdirSync(path.dirname(clip.audioPath), { recursive: true });
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            run(process.execPath, generatorArgs(clip));
            const probe = probeAudio(clip.audioPath);
            if (!probe || probe.sampleRate !== 44100 || probe.channels !== 1) {
                throw new Error('Generated clip failed WAV probe');
            }
            return { cached: false };
        } catch (error) {
            if (fs.existsSync(clip.audioPath)) fs.rmSync(clip.audioPath, { force: true });
            if (attempt === retries) throw error;
            await delay(1000 * 2 ** (attempt - 1));
        }
    }
    throw new Error('Unreachable clip generation state');
}

async function generateClips(clips, options) {
    const pending = clips.filter((clip) => !probeAudio(clip.audioPath)).slice(0, options.maxNewClips);
    const cachedCount = clips.length - clips.filter((clip) => !probeAudio(clip.audioPath)).length;
    console.log(`Turn cache: ${cachedCount}/${clips.length} ready; generating ${pending.length} new clips.`);
    let cursor = 0;
    let completed = 0;
    const errors = [];
    async function worker() {
        while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= pending.length) return;
            const clip = pending[index];
            try {
                await generateClip(clip, options.retries);
                completed += 1;
                if (completed === 1 || completed % 10 === 0 || completed === pending.length) {
                    console.log(`Generated clips: ${completed}/${pending.length} (${clip.locale}, ${clip.turn.role})`);
                }
            } catch (error) {
                errors.push({ clip, error });
                return;
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(options.concurrency, pending.length || 1) }, () => worker()));
    if (errors.length) {
        const failure = errors[0];
        throw new Error(`Clip ${failure.clip.hash} failed: ${failure.error.message}`);
    }
    const remaining = clips.filter((clip) => !probeAudio(clip.audioPath));
    return { remaining };
}

function writeSilence(filePath, durationMs) {
    if (probeAudio(filePath)) return;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-f',
        'lavfi',
        '-i',
        'anullsrc=r=44100:cl=mono',
        '-t',
        String(durationMs / 1000),
        '-c:a',
        'pcm_s16le',
        filePath
    ]);
}

function escapeConcatPath(filePath) {
    return filePath.replaceAll("'", "'\\''");
}

function loudnessMeasurement(filePath) {
    const result = spawnSync(
        'ffmpeg',
        [
            '-hide_banner',
            '-nostats',
            '-i',
            filePath,
            '-af',
            `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
            '-f',
            'null',
            '-'
        ],
        { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
    );
    if (result.status !== 0) throw new Error(`Loudness measurement failed: ${result.stderr.slice(-2000)}`);
    const matches = result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/g);
    if (!matches?.length) throw new Error(`Could not parse loudness output for ${filePath}`);
    return JSON.parse(matches.at(-1));
}

function normalizeAudio(inputPath, outputPath) {
    const measured = loudnessMeasurement(inputPath);
    const filter = [
        `loudnorm=I=${TARGET_I}`,
        `TP=${TARGET_TP}`,
        `LRA=${TARGET_LRA}`,
        `measured_I=${measured.input_i}`,
        `measured_LRA=${measured.input_lra}`,
        `measured_TP=${measured.input_tp}`,
        `measured_thresh=${measured.input_thresh}`,
        `offset=${measured.target_offset}`,
        'linear=true',
        'print_format=summary'
    ].join(':');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        inputPath,
        '-af',
        filter,
        '-ar',
        '44100',
        '-ac',
        '1',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        outputPath
    ]);
}

function assembleAsset(asset, clipsByHash, silencePaths) {
    const existing = probeAudio(asset.outputPath);
    if (existing) return { skipped: true, probe: existing };
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-asset-'));
    try {
        const timeline = [];
        for (let index = 0; index < asset.turnHashes.length; index += 1) {
            const clip = clipsByHash.get(asset.turnHashes[index]);
            if (!clip || !probeAudio(clip.audioPath)) throw new Error(`Missing cached turn ${asset.turnHashes[index]}`);
            timeline.push(clip.audioPath);
            if (index < asset.turnHashes.length - 1) {
                const nextRole = asset.turns[index + 1].role;
                timeline.push(nextRole === 'SUMMARY' ? silencePaths.summary : silencePaths.normal);
            }
        }
        const concatPath = path.join(temporaryDirectory, 'timeline.txt');
        const mergedPath = path.join(temporaryDirectory, 'merged.wav');
        const partialPath = path.join(temporaryDirectory, 'normalized.mp3');
        fs.writeFileSync(concatPath, timeline.map((filePath) => `file '${escapeConcatPath(filePath)}'`).join('\n'));
        run('ffmpeg', [
            '-hide_banner',
            '-loglevel',
            'error',
            '-y',
            '-f',
            'concat',
            '-safe',
            '0',
            '-i',
            concatPath,
            '-ar',
            '44100',
            '-ac',
            '1',
            '-c:a',
            'pcm_s16le',
            mergedPath
        ]);
        normalizeAudio(mergedPath, partialPath);
        fs.mkdirSync(path.dirname(asset.outputPath), { recursive: true });
        fs.copyFileSync(partialPath, asset.outputPath, fs.constants.COPYFILE_EXCL);
        const probe = probeAudio(asset.outputPath);
        if (!probe) throw new Error(`Final audio failed probe: ${asset.outputPath}`);
        return { skipped: false, probe };
    } finally {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
}

async function assembleAssets(assets, clips) {
    const clipsByHash = new Map(clips.map((clip) => [clip.hash, clip]));
    const silencePaths = {
        normal: path.join(CACHE_ROOT, `silence-${NORMAL_PAUSE_MS}ms.wav`),
        summary: path.join(CACHE_ROOT, `silence-${SUMMARY_PAUSE_MS}ms.wav`)
    };
    writeSilence(silencePaths.normal, NORMAL_PAUSE_MS);
    writeSilence(silencePaths.summary, SUMMARY_PAUSE_MS);
    const existingManifest = fs.existsSync(AUDIO_MANIFEST_PATH) ? readJson(AUDIO_MANIFEST_PATH) : null;
    const priorByPath = new Map((existingManifest?.assets || []).map((asset) => [asset.path, asset]));
    const results = [];
    let created = 0;
    for (const asset of assets) {
        const prior = priorByPath.get(asset.path);
        if (fs.existsSync(asset.outputPath) && prior && prior.inputHash !== asset.inputHash) {
            throw new Error(`Refusing to overwrite changed append-only audio asset: ${asset.path}`);
        }
        if (fs.existsSync(asset.outputPath) && !prior && existingManifest) {
            throw new Error(`Existing audio is missing manifest ownership: ${asset.path}`);
        }
        const assembled = assembleAsset(asset, clipsByHash, silencePaths);
        if (!assembled.skipped) created += 1;
        results.push({
            scopeId: asset.scopeId,
            sequenceIndex: asset.sequenceIndex,
            eventId: asset.eventId,
            variantId: asset.variantId,
            locale: asset.locale,
            mode: asset.mode,
            path: asset.path,
            inputHash: asset.inputHash,
            turnHashes: asset.turnHashes,
            durationSec: Number(assembled.probe.durationSec.toFixed(3)),
            sampleRate: assembled.probe.sampleRate,
            channels: assembled.probe.channels,
            codec: assembled.probe.codec,
            status: 'generated-normalized'
        });
        if (results.length === 1 || results.length % 10 === 0 || results.length === assets.length) {
            console.log(`Assembled assets: ${results.length}/${assets.length} (${created} new)`);
        }
    }
    return results;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(SCRIPT_MANIFEST_PATH)) fail(`Missing ${path.relative(ROOT, SCRIPT_MANIFEST_PATH)}`);
    if (!fs.existsSync(ENV_PATH)) fail(`Missing TTS environment file: ${ENV_PATH}`);
    run('ffmpeg', ['-version']);
    run('ffprobe', ['-version']);
    const scriptManifest = readJson(SCRIPT_MANIFEST_PATH);
    const { clips, assets } = buildJobs(scriptManifest);
    console.log(`Generation plan: ${clips.length} unique turns -> ${assets.length} final audio assets.`);
    const clipResult = await generateClips(clips, options);
    if (clipResult.remaining.length) {
        console.log(`Stopped with ${clipResult.remaining.length} uncached turns remaining.`);
        if (!options.clipsOnly) process.exitCode = 2;
        return;
    }
    if (options.clipsOnly) {
        console.log('All turn clips are cached; assembly skipped by --clips-only.');
        return;
    }
    const generatedAssets = await assembleAssets(assets, clips);
    const manifest = {
        schemaVersion: 1,
        status: 'generated-normalized',
        provider: 'volc',
        model: MODEL,
        endpoint: ENDPOINT,
        sourceManifest: path.relative(ROOT, SCRIPT_MANIFEST_PATH),
        outputRoot: path.relative(ROOT, OUTPUT_ROOT),
        specification: {
            format: 'mp3',
            sampleRate: 44100,
            channels: 1,
            targetIntegratedLoudnessLufs: TARGET_I,
            targetTruePeakDbtp: TARGET_TP,
            targetLoudnessRangeLu: TARGET_LRA,
            bitrateKbps: 192,
            normalPauseMs: NORMAL_PAUSE_MS,
            summaryPauseMs: SUMMARY_PAUSE_MS
        },
        uniqueTurnCount: clips.length,
        assetCount: generatedAssets.length,
        assets: generatedAssets
    };
    await writeFormatted(AUDIO_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Created ${path.relative(ROOT, AUDIO_MANIFEST_PATH)}.`);
}

await main();
