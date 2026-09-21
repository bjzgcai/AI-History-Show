#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG_PATH = path.join(ROOT, 'audio/pronunciation/validation-cases.json');
const GLOSSARY_PATH = path.join(ROOT, 'audio/pronunciation/glossary.json');
const GENERATOR_PATH = path.join(ROOT, 'scripts/audio/generate-dialogue-audio.mjs');
const DEFAULT_OUTPUT_ROOT = path.join(ROOT, '.tmp/pronunciation-validation');

function fail(message) {
    throw new Error(message);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveFromRoot(filePath) {
    return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

function parseArgs(argv) {
    const options = {
        generate: false,
        envFile: process.env.TTS_ENV_FILE || '.secrets/tts.env',
        runId: '',
        caseIds: [],
        variants: []
    };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--generate') options.generate = true;
        else if (argument === '--env-file') {
            options.envFile = argv[index + 1];
            index += 1;
        } else if (argument === '--run-id') {
            options.runId = argv[index + 1];
            index += 1;
        } else if (argument === '--case') {
            options.caseIds.push(argv[index + 1]);
            index += 1;
        } else if (argument === '--variant') {
            options.variants.push(argv[index + 1]);
            index += 1;
        } else fail(`unknown option ${argument}`);
    }
    return options;
}

function instructionForRole(profile, role) {
    if (role === 'A') return profile.instructionA;
    if (role === 'B') return profile.instructionB;
    if (role === 'SUMMARY') return profile.instructionSummary;
    return profile.instructionNarrator;
}

function speedForRole(profile, role) {
    if (role === 'A') return profile.speedA;
    if (role === 'B') return profile.speedB;
    if (role === 'SUMMARY') return profile.speedSummary;
    return profile.speedNarrator;
}

function roleLabel(role) {
    if (role === 'N' || role === 'NARRATOR') return 'N';
    return role;
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function probeAudio(filePath) {
    const result = spawnSync(
        'ffprobe',
        [
            '-v',
            'error',
            '-show_entries',
            'format=duration,size,bit_rate:stream=codec_name,sample_rate,channels',
            '-of',
            'json',
            filePath
        ],
        { cwd: ROOT, encoding: 'utf8' }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) fail(`ffprobe failed for ${filePath}`);
    const data = JSON.parse(result.stdout);
    const stream = data.streams?.[0];
    if (!stream) fail(`no audio stream in ${filePath}`);
    return {
        durationSec: Number(Number(data.format.duration).toFixed(3)),
        sizeBytes: Number(data.format.size),
        bitRate: Number(data.format.bit_rate),
        codec: stream.codec_name,
        sampleRate: Number(stream.sample_rate),
        channels: Number(stream.channels)
    };
}

async function writeJson(filePath, value) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const output = await prettier.format(JSON.stringify(value), { ...config, filepath: filePath });
    fs.writeFileSync(filePath, output);
}

function runGenerator(sample, config, profile, envFile) {
    const instructionOption =
        sample.role === 'A'
            ? '--instruction-a'
            : sample.role === 'B'
              ? '--instruction-b'
              : sample.role === 'SUMMARY'
                ? '--instruction-summary'
                : '--instruction-narrator';
    const speedOption =
        sample.role === 'A'
            ? '--speed-a'
            : sample.role === 'B'
              ? '--speed-b'
              : sample.role === 'SUMMARY'
                ? '--speed-summary'
                : '--speed-narrator';
    const args = [
        GENERATOR_PATH,
        sample.inputPath,
        sample.outputPath,
        '--provider',
        config.provider.name,
        '--volc-base-url',
        config.provider.endpoint,
        '--model',
        config.provider.model,
        '--lang',
        sample.locale,
        '--voice-a',
        profile.voiceA,
        '--voice-b',
        profile.voiceB,
        '--voice-narrator',
        profile.voiceNarrator,
        '--voice-summary',
        profile.voiceSummary,
        instructionOption,
        sample.instruction,
        speedOption,
        String(speedForRole(profile, sample.role)),
        '--pause-ms',
        '0',
        '--summary-pause-ms',
        '0',
        '--env-file',
        envFile
    ];
    const result = spawnSync(process.execPath, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        stdio: 'inherit'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) fail(`TTS generation failed for ${sample.id}`);
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.runId && !/^[a-z0-9][a-z0-9-]*$/u.test(options.runId)) {
        fail('--run-id must contain lowercase letters, digits, and hyphens only');
    }
    const outputRoot = options.runId ? path.join(DEFAULT_OUTPUT_ROOT, 'runs', options.runId) : DEFAULT_OUTPUT_ROOT;
    const config = readJson(CONFIG_PATH);
    const glossary = readJson(GLOSSARY_PATH);
    const profile = readJson(resolveFromRoot(config.voiceProfilePath));
    const envFile = resolveFromRoot(options.envFile);
    const glossaryById = new Map(glossary.entries.map((entry) => [entry.id, entry]));
    const selectedCaseIds = new Set(options.caseIds);
    const selectedVariants = new Set(options.variants);
    const samples = [];

    for (const caseId of selectedCaseIds) {
        if (!config.cases.some((item) => item.id === caseId)) fail(`unknown validation case ${caseId}`);
    }
    for (const variant of selectedVariants) {
        if (!['baseline', 'hinted', 'rewritten'].includes(variant)) fail(`unknown validation variant ${variant}`);
    }

    fs.mkdirSync(outputRoot, { recursive: true });
    for (const validationCase of config.cases) {
        const term = glossaryById.get(validationCase.termId);
        if (!term) fail(`${validationCase.id}: unknown glossary term ${validationCase.termId}`);
        const turnPath = resolveFromRoot(validationCase.turnPath);
        const turnData = readJson(turnPath);
        const turn = turnData.turns[validationCase.turnIndex - 1];
        if (!turn) fail(`${validationCase.id}: turn ${validationCase.turnIndex} does not exist`);
        if (!term.aliases.some((alias) => turn.text.includes(alias))) {
            fail(`${validationCase.id}: selected turn does not contain ${term.term}`);
        }

        const baseInstruction = instructionForRole(profile, turn.role);
        const pronunciationInstruction =
            validationCase.pronunciationInstruction ||
            (validationCase.locale === 'zh'
                ? `文案中的“${term.term}”保持原样，读作“${term.reading.spoken}”。`
                : `Keep “${term.term}” unchanged and pronounce it as “${term.reading.spoken}”.`);
        const rewrittenText = (validationCase.speechReplacements || []).reduce(
            (text, replacement) => text.replaceAll(replacement.from, replacement.to),
            turn.text
        );
        for (const variant of [
            'baseline',
            'hinted',
            ...(validationCase.speechReplacements?.length ? ['rewritten'] : [])
        ]) {
            const sampleDirectory = path.join(outputRoot, validationCase.id);
            fs.mkdirSync(sampleDirectory, { recursive: true });
            const inputPath = path.join(sampleDirectory, `${variant}.txt`);
            const outputPath = path.join(sampleDirectory, `${variant}.mp3`);
            const instruction =
                variant === 'baseline' ? baseInstruction : `${baseInstruction} ${pronunciationInstruction}`;
            const speechText = variant === 'rewritten' ? rewrittenText : turn.text;
            fs.writeFileSync(inputPath, `${roleLabel(turn.role)}: ${speechText}\n`);
            samples.push({
                id: `${validationCase.id}-${variant}`,
                caseId: validationCase.id,
                variant,
                termId: term.id,
                term: term.term,
                category: term.category,
                verification: term.verification,
                targetReading: term.reading.spoken,
                locale: validationCase.locale,
                eventId: turnData.eventId,
                sourcePath: validationCase.turnPath,
                turnIndex: validationCase.turnIndex,
                role: turn.role,
                text: turn.text,
                textSha256: sha256(turn.text),
                speechText,
                speechTextSha256: sha256(speechText),
                speechReplacements: variant === 'rewritten' ? validationCase.speechReplacements : [],
                instruction,
                inputPath,
                outputPath
            });
        }
    }

    let generatedSampleCount = 0;
    for (const sample of samples) {
        console.log(`${sample.id}: ${sample.text}`);
        if (
            options.generate &&
            (selectedCaseIds.size === 0 || selectedCaseIds.has(sample.caseId)) &&
            (selectedVariants.size === 0 || selectedVariants.has(sample.variant))
        ) {
            runGenerator(sample, config, profile, envFile);
            generatedSampleCount += 1;
        }
    }

    const hasAllAudio = samples.every((sample) => fs.existsSync(sample.outputPath));
    const report = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        mode: options.generate ? 'generated' : hasAllAudio ? 'existing-audio' : 'dry-run',
        provider: config.provider,
        voiceProfilePath: config.voiceProfilePath,
        sampleCount: samples.length,
        generatedSampleCount,
        transcription: {
            status: 'unavailable',
            note: 'whisper-cpp is not installed; pronunciation acceptance still requires human listening.'
        },
        cases: samples.map((sample) => ({
            ...sample,
            inputPath: path.relative(ROOT, sample.inputPath).split(path.sep).join('/'),
            outputPath: path.relative(ROOT, sample.outputPath).split(path.sep).join('/'),
            ...(fs.existsSync(sample.outputPath) ? { audio: probeAudio(sample.outputPath) } : {})
        }))
    };
    await writeJson(path.join(outputRoot, 'manifest.json'), report);
    if (options.generate) {
        console.log(`Generated ${generatedSampleCount} of ${samples.length} pronunciation samples.`);
    } else {
        console.log(`Prepared ${samples.length} pronunciation samples.`);
    }
    console.log(`Manifest: ${path.relative(ROOT, path.join(outputRoot, 'manifest.json'))}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
