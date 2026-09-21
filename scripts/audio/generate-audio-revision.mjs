#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderScript, resolveTtsEnvFile, resolveVoiceProfile } from './lib/audio-revision.mjs';
import { compileSpeechTurns, loadPronunciationGlossary } from './lib/pronunciation.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GENERATOR_PATH = path.join(ROOT, 'scripts/audio/generate-dialogue-audio.mjs');
const GENERATION_STATE_ROOT = path.join(ROOT, '.tmp/audio-generation-identities');

function fail(message) {
    throw new Error(message);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

function loadGenerationState(revisionId) {
    const statePath = path.join(GENERATION_STATE_ROOT, `${revisionId}.json`);
    if (!fs.existsSync(statePath)) return { statePath, state: { schemaVersion: 1, revisionId, jobs: {} } };
    const state = readJson(statePath);
    if (state.schemaVersion !== 1 || state.revisionId !== revisionId || !state.jobs) {
        fail(`Invalid pronunciation generation state: ${statePath}`);
    }
    return { statePath, state };
}

function writeGenerationState(statePath, state) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    const temporaryPath = `${statePath}.tmp-${process.pid}`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`);
    fs.renameSync(temporaryPath, statePath);
}

function loudnessMeasurement(filePath, specification) {
    const targetI = specification.targetIntegratedLoudnessLufs;
    const targetTp = specification.targetTruePeakDbtp;
    const targetLra = specification.targetLoudnessRangeLu;
    const result = spawnSync(
        'ffmpeg',
        [
            '-hide_banner',
            '-nostats',
            '-i',
            filePath,
            '-af',
            `loudnorm=I=${targetI}:TP=${targetTp}:LRA=${targetLra}:print_format=json`,
            '-f',
            'null',
            '-'
        ],
        { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
    );
    if (result.status !== 0) fail(`Loudness measurement failed: ${result.stderr.slice(-2000)}`);
    const matches = result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/g);
    if (!matches?.length) fail(`Could not parse loudness output for ${filePath}`);
    return JSON.parse(matches.at(-1));
}

function normalizeAudio(inputPath, outputPath, specification) {
    const targetI = specification.targetIntegratedLoudnessLufs;
    const targetTp = specification.targetTruePeakDbtp;
    const targetLra = specification.targetLoudnessRangeLu;
    const measured = loudnessMeasurement(inputPath, specification);
    const filter = [
        `loudnorm=I=${targetI}`,
        `TP=${targetTp}`,
        `LRA=${targetLra}`,
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

function probeAudio(filePath) {
    const result = run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration,size,bit_rate:stream=sample_rate,channels,codec_name',
        '-of',
        'json',
        filePath
    ]);
    const data = JSON.parse(result.stdout);
    const stream = data.streams?.[0];
    if (!stream) fail(`No audio stream in ${filePath}`);
    return {
        durationSec: Number(data.format.duration),
        sizeBytes: Number(data.format.size),
        bitrate: Number(data.format.bit_rate),
        sampleRate: Number(stream.sample_rate),
        channels: Number(stream.channels),
        codec: stream.codec_name
    };
}

function generatorArgs(job, outputPath) {
    return [
        GENERATOR_PATH,
        job.inputPath,
        outputPath,
        '--provider',
        job.provider,
        '--volc-base-url',
        job.endpoint,
        '--model',
        job.model,
        '--lang',
        job.locale,
        '--voice-a',
        job.voiceProfile.voiceA,
        '--voice-b',
        job.voiceProfile.voiceB,
        '--voice-narrator',
        job.voiceProfile.voiceNarrator,
        '--voice-summary',
        job.voiceProfile.voiceSummary,
        '--instruction-a',
        job.voiceProfile.instructionA,
        '--instruction-b',
        job.voiceProfile.instructionB,
        '--instruction-narrator',
        job.voiceProfile.instructionNarrator,
        '--instruction-summary',
        job.voiceProfile.instructionSummary,
        '--speed-a',
        String(job.voiceProfile.speedA),
        '--speed-b',
        String(job.voiceProfile.speedB),
        '--speed-narrator',
        String(job.voiceProfile.speedNarrator),
        '--speed-summary',
        String(job.voiceProfile.speedSummary),
        '--pause-ms',
        String(job.normalPauseMs),
        '--summary-pause-ms',
        String(job.summaryPauseMs),
        '--env-file',
        job.envFile
    ];
}

function voiceForRole(profile, role) {
    if (role === 'A') return profile.voiceA;
    if (role === 'B') return profile.voiceB;
    if (role === 'SUMMARY') return profile.voiceSummary;
    return profile.voiceNarrator;
}

function instructionForRole(profile, role) {
    if (role === 'A') return profile.instructionA;
    if (role === 'B') return profile.instructionB;
    if (role === 'SUMMARY') return profile.instructionSummary;
    return profile.instructionNarrator;
}

function buildJobs(plan) {
    const grouped = new Map();
    const glossaryBundle = loadPronunciationGlossary();
    for (const entry of plan.entries) {
        const planProfile = plan.voiceProfile || {};
        const voiceProfile = resolveVoiceProfile(
            planProfile,
            Object.fromEntries(
                Object.keys(planProfile)
                    .filter((key) => entry[key] !== undefined)
                    .map((key) => [key, entry[key]])
            )
        );
        for (const key of ['voiceA', 'voiceB', 'voiceNarrator', 'voiceSummary']) {
            if (!voiceProfile[key]) fail(`Revision plan is missing ${key} for ${entry.eventId}/${entry.locale}`);
        }
        const stem = `${String(entry.sequenceIndex).padStart(2, '0')}-${entry.eventId}.mp3`;
        for (const mode of entry.modes) {
            const relativeInputPath = entry.scriptPaths?.[mode];
            if (!relativeInputPath) fail(`Revision plan is missing a script path for ${entry.eventId}/${mode}`);
            const inputPath = path.join(ROOT, relativeInputPath);
            if (!fs.existsSync(inputPath)) fail(`Missing revision script: ${relativeInputPath}`);
            const turns = entry.turnsPaths?.[mode] ? readJson(path.join(ROOT, entry.turnsPaths[mode])).turns : null;
            const pronunciation = turns
                ? compileSpeechTurns({
                      turns,
                      eventId: entry.eventId,
                      locale: entry.locale,
                      provider: plan.provider,
                      model: plan.model,
                      voiceForRole: (role) => voiceForRole(voiceProfile, role),
                      instructionForRole: (role) => instructionForRole(voiceProfile, role),
                      glossaryBundle
                  })
                : {
                      schemaVersion: 2,
                      turns: null,
                      replacements: [],
                      unqualified: [],
                      exclusions: [],
                      glossaryPath: path.relative(ROOT, glossaryBundle.path).split(path.sep).join('/'),
                      glossarySha256: glossaryBundle.hash
                  };
            if (pronunciation.unqualified.length) {
                const details = pronunciation.unqualified
                    .map(
                        (item) =>
                            `${item.term} turn ${item.turnIndex} (${item.context.voice}, ${item.context.instructionSha256.slice(0, 12)})`
                    )
                    .join(', ');
                fail(`${entry.eventId}/${entry.locale}: unqualified pronunciation context: ${details}`);
            }
            const speechText = pronunciation.turns
                ? renderScript(pronunciation.turns)
                : fs.readFileSync(inputPath, 'utf8');
            const relativeOutputPath = path.join(plan.outputRoot, 'audio', entry.scopeId, mode, entry.locale, stem);
            const outputPath = path.join(ROOT, relativeOutputPath);
            const identity = {
                sourceText: fs.readFileSync(inputPath, 'utf8'),
                speechText,
                pronunciationGlossarySha256: pronunciation.glossarySha256,
                pronunciationReplacements: pronunciation.replacements,
                pronunciationExclusions: pronunciation.exclusions,
                model: plan.model,
                locale: entry.locale,
                voiceProfile,
                normalPauseMs: plan.specification.normalPauseMs,
                summaryPauseMs: plan.specification.summaryPauseMs
            };
            const hash = sha256(JSON.stringify(identity));
            if (!grouped.has(hash)) {
                grouped.set(hash, {
                    hash,
                    inputPath,
                    speechText,
                    pronunciation,
                    provider: plan.provider,
                    model: plan.model,
                    endpoint: plan.endpoint,
                    envFile: plan.envFile,
                    locale: entry.locale,
                    voiceProfile,
                    specification: plan.specification,
                    normalPauseMs: plan.specification.normalPauseMs,
                    summaryPauseMs: plan.specification.summaryPauseMs,
                    assets: []
                });
            }
            grouped.get(hash).assets.push({
                scopeId: entry.scopeId,
                sequenceIndex: entry.sequenceIndex,
                eventId: entry.eventId,
                locale: entry.locale,
                mode,
                path: relativeOutputPath.split(path.sep).join('/'),
                outputPath,
                voiceProfile,
                turns,
                generationIdentitySha256: hash,
                pronunciation: {
                    schemaVersion: pronunciation.schemaVersion,
                    glossaryPath: pronunciation.glossaryPath,
                    glossarySha256: pronunciation.glossarySha256,
                    replacements: pronunciation.replacements,
                    unqualified: pronunciation.unqualified,
                    exclusions: pronunciation.exclusions
                }
            });
        }
    }
    return [...grouped.values()];
}

function generateJob(job, retries, generationState, generationStatePath) {
    const existingAssets = job.assets.filter((asset) => fs.existsSync(asset.outputPath));
    if (existingAssets.length === job.assets.length) {
        const recordedAssets = new Map(
            (generationState.jobs[job.hash]?.assets || []).map((asset) => [asset.path, asset.sha256])
        );
        for (const asset of existingAssets) {
            probeAudio(asset.outputPath);
            if (recordedAssets.get(asset.path) !== sha256(fs.readFileSync(asset.outputPath))) {
                fail(`Existing audio does not match generation identity ${job.hash.slice(0, 12)}: ${asset.path}`);
            }
        }
        return { resumed: true };
    }
    if (existingAssets.length > 0) {
        fail(`Revision job is only partially present: ${existingAssets.map((asset) => asset.path).join(', ')}`);
    }
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-voice-revision-'));
    try {
        const speechInputPath = path.join(temporaryDirectory, 'speech.txt');
        fs.writeFileSync(speechInputPath, job.speechText);
        const rawPath = path.join(temporaryDirectory, 'raw.mp3');
        const normalizedPath = path.join(temporaryDirectory, 'normalized.mp3');
        let generated = false;
        let lastError;
        for (let attempt = 1; attempt <= retries; attempt += 1) {
            try {
                run(process.execPath, generatorArgs({ ...job, inputPath: speechInputPath }, rawPath), {
                    inherit: true
                });
                generated = true;
                break;
            } catch (error) {
                lastError = error;
                if (attempt < retries) console.log(`Retrying ${job.hash.slice(0, 8)} (${attempt}/${retries})...`);
            }
        }
        if (!generated) throw lastError;
        normalizeAudio(rawPath, normalizedPath, job.specification);
        for (const asset of job.assets) {
            fs.mkdirSync(path.dirname(asset.outputPath), { recursive: true });
            fs.copyFileSync(normalizedPath, asset.outputPath, fs.constants.COPYFILE_EXCL);
        }
        generationState.jobs[job.hash] = {
            assets: job.assets.map((asset) => ({
                path: asset.path,
                sha256: sha256(fs.readFileSync(asset.outputPath))
            }))
        };
        writeGenerationState(generationStatePath, generationState);
    } finally {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
}

function buildOverlay(plan, jobs) {
    const assets = [];
    for (const job of jobs) {
        for (const asset of job.assets) {
            const probe = probeAudio(asset.outputPath);
            const loudness = loudnessMeasurement(asset.outputPath, plan.specification);
            const issues = [];
            const minimumDuration = plan.specification.minimumDurationSec || 40;
            const maximumDuration = plan.specification.maximumDurationSec || 150;
            const integratedLufs = Number(loudness.input_i);
            const truePeakDbtp = Number(loudness.input_tp);
            if (probe.durationSec < minimumDuration || probe.durationSec > maximumDuration) {
                issues.push('duration-outside-range');
            }
            if (probe.sampleRate !== 44100) issues.push('sample-rate-not-44100');
            if (probe.channels !== 1) issues.push('not-mono');
            if (probe.codec !== 'mp3') issues.push('codec-not-mp3');
            if (
                integratedLufs < plan.specification.targetIntegratedLoudnessLufs - 1 ||
                integratedLufs > plan.specification.targetIntegratedLoudnessLufs + 1
            ) {
                issues.push('integrated-loudness-outside-tolerance');
            }
            if (truePeakDbtp > plan.specification.targetTruePeakDbtp) issues.push('true-peak-above-target');
            assets.push({
                scopeId: asset.scopeId,
                sequenceIndex: asset.sequenceIndex,
                eventId: asset.eventId,
                locale: asset.locale,
                mode: asset.mode,
                revisionId: plan.revisionId,
                voiceProfile: asset.voiceProfile,
                ...(asset.turns ? { turns: asset.turns } : {}),
                generationIdentitySha256: asset.generationIdentitySha256,
                pronunciation: asset.pronunciation,
                audio: {
                    path: asset.path,
                    durationSec: Number(probe.durationSec.toFixed(3)),
                    status: 'candidate-revision'
                },
                quality: {
                    scopeId: asset.scopeId,
                    sequenceIndex: asset.sequenceIndex,
                    eventId: asset.eventId,
                    locale: asset.locale,
                    mode: asset.mode,
                    path: asset.path,
                    durationSec: Number(probe.durationSec.toFixed(3)),
                    sizeBytes: probe.sizeBytes,
                    sampleRate: probe.sampleRate,
                    channels: probe.channels,
                    codec: probe.codec,
                    bitrate: probe.bitrate,
                    integratedLufs,
                    truePeakDbtp,
                    loudnessRangeLu: Number(loudness.input_lra),
                    passed: issues.length === 0,
                    issues
                }
            });
        }
    }
    return {
        schemaVersion: 2,
        status: 'candidate-listening-review',
        revisionId: plan.revisionId,
        label: plan.label,
        comparisonKind: plan.comparisonKind,
        provider: plan.provider,
        model: plan.model,
        endpoint: plan.endpoint,
        createdAt: new Date().toISOString(),
        sourcePlan: path.relative(ROOT, plan.planPath).split(path.sep).join('/'),
        assets
    };
}

function main() {
    const planArgument = process.argv[2];
    if (!planArgument) fail('Usage: node scripts/audio/generate-audio-revision.mjs <plan.json>');
    const planPath = path.isAbsolute(planArgument) ? planArgument : path.join(ROOT, planArgument);
    if (!fs.existsSync(planPath)) fail(`Missing plan: ${planPath}`);
    const plan = { ...readJson(planPath), planPath };
    if (plan.provider !== 'volc') fail(`Unsupported revision provider: ${plan.provider}`);
    if (!plan.endpoint) fail('Revision plan is missing endpoint');
    if (!plan.envFile) fail('Revision plan is missing envFile');
    const envFile = resolveTtsEnvFile(plan.envFile);
    if (!fs.existsSync(envFile)) fail(`Missing TTS environment file: ${envFile}`);
    run('ffmpeg', ['-version']);
    run('ffprobe', ['-version']);
    const outputRoot = path.join(ROOT, plan.outputRoot);
    const overlayPath = path.join(outputRoot, 'overlay.json');
    if (fs.existsSync(overlayPath)) fail(`Refusing to overwrite append-only overlay: ${overlayPath}`);
    const jobs = buildJobs({ ...plan, envFile });
    const { statePath: generationStatePath, state: generationState } = loadGenerationState(plan.revisionId);
    console.log(
        `${jobs.length} unique dialogue assets will generate ${jobs.reduce((sum, job) => sum + job.assets.length, 0)} revision files.`
    );
    jobs.forEach((job, index) => {
        console.log(
            `Generating ${index + 1}/${jobs.length}: ${job.assets.map((asset) => `${asset.eventId}/${asset.mode}`).join(', ')}`
        );
        generateJob(job, plan.retries || 3, generationState, generationStatePath);
    });
    const overlay = buildOverlay(plan, jobs);
    fs.mkdirSync(outputRoot, { recursive: true });
    fs.writeFileSync(overlayPath, `${JSON.stringify(overlay, null, 2)}\n`, { flag: 'wx' });
    const completedPlan = {
        ...readJson(planPath),
        status: 'candidate-listening-review',
        generatedAt: overlay.createdAt,
        generatedAssetCount: overlay.assets.length
    };
    fs.writeFileSync(planPath, `${JSON.stringify(completedPlan, null, 2)}\n`);
    console.log(`Created ${path.relative(ROOT, overlayPath)} with ${overlay.assets.length} candidate assets.`);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
