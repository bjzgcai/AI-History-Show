#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULTS = {
    provider: 'inner',
    baseUrl: 'https://llm.inner.bza.edu.cn/hub/v1/audio/speech',
    volcBaseUrl: 'https://openspeech.bytedance.com/api/v3/plan/tts/unidirectional',
    language: 'zh',
    speed: 1,
    stability: 0.5,
    similarity: 0.75,
    style: 0,
    postSpeed: 1,
    pauseMs: 450,
    summaryPauseMs: 850,
    seed: 198900
};

const PROVIDER_DEFAULTS = {
    inner: {
        model: 'cosy-voice',
        voiceA: 'vc_zh_female_wenroumama',
        voiceB: 'vcc_audiobook_BV701'
    },
    sag: {
        model: 'eleven_multilingual_v2',
        voiceA: 'Liam',
        voiceB: 'Alice'
    },
    volc: {
        model: 'seed-tts-2.0',
        voiceA: 'zh_female_vv_uranus_bigtts',
        voiceB: 'ICL_uranus_zh_male_qinglangwenrun_tob'
    }
};

function printHelp() {
    console.log(`Usage:
  node scripts/audio/generate-dialogue-audio.mjs <input.txt> [output.mp3] [options]

Input format:
  A: First speaker text
  B: Second speaker text
  Narrator: Single-narrator text (uses B voice settings)
  N: Short form for Narrator
  旁白: Chinese narrator label
  Summary: Optional closing summary
  总结: Optional Chinese closing summary

Full-width Chinese colons are also accepted. Lines without a speaker label are
appended to the previous turn.

Options:
  --provider <inner|sag|volc>  TTS provider (default: ${DEFAULTS.provider})
  --base-url <url>             Internal speech endpoint (default: ${DEFAULTS.baseUrl})
  --volc-base-url <url>        Volcengine endpoint (default: ${DEFAULTS.volcBaseUrl})
  --voice-a <name-or-id>       Voice for A (inner default: ${PROVIDER_DEFAULTS.inner.voiceA})
  --voice-b <name-or-id>       Voice for B (inner default: ${PROVIDER_DEFAULTS.inner.voiceB})
  --voice-narrator <name-or-id> Narrator voice (default: B)
  --voice-summary <name-or-id> Summary voice (Volc default: B; others: A)
  --model <model-id>           TTS model (inner default: ${PROVIDER_DEFAULTS.inner.model})
  --instruction-a <text>       Doubao speaking instruction for A
  --instruction-b <text>       Doubao speaking instruction for B
  --instruction-narrator <text> Doubao speaking instruction for narrator
  --instruction-summary <text> Doubao speaking instruction for summary
  --subtitle                   Request Doubao word timestamps
  --lang <code>                Language hint (default: ${DEFAULTS.language})
  --speed <number>             Speech speed multiplier (default: ${DEFAULTS.speed})
  --speed-a <number>           Doubao/SAG speed multiplier for A
  --speed-b <number>           Doubao/SAG speed multiplier for B
  --speed-narrator <number>    Doubao/SAG speed multiplier for narrator
  --speed-summary <number>     Doubao/SAG speed multiplier for summary
  --pitch-a <-12..12>          Doubao pitch adjustment for A
  --pitch-b <-12..12>          Doubao pitch adjustment for B
  --pitch-summary <-12..12>    Doubao pitch adjustment for summary
  --stability <0..1>           Voice stability (default: ${DEFAULTS.stability})
  --similarity <0..1>          Voice similarity (default: ${DEFAULTS.similarity})
  --style <0..1>               Style exaggeration (default: ${DEFAULTS.style})
  --post-speed <0.5..2>        Post-process speed for every clip (default: ${DEFAULTS.postSpeed})
  --post-speed-a <0.5..2>     Post-process speed for A clips
  --post-speed-b <0.5..2>     Post-process speed for B clips
  --post-speed-summary <0.5..2> Post-process speed for the summary
  --pause-ms <number>          Pause between normal turns (default: ${DEFAULTS.pauseMs})
  --summary-pause-ms <number>  Pause before the summary (default: ${DEFAULTS.summaryPauseMs})
  --seed <integer>             Base deterministic seed (default: ${DEFAULTS.seed})
  --api-key-file <path>        Read a raw API key from a file
  --env-file <path>            Load KEY=value credentials without executing the file
  --api-key-env <name>         API key variable in the environment/env file
  --keep-clips                 Keep individual MP3 clips beside the final output
  --dry-run                    Parse and print the generation plan without TTS calls
  -h, --help                   Show this help

Credentials:
  inner: export INNER_TTS_API_KEY, use --env-file, or pass --api-key-file.
  sag: export ELEVENLABS_API_KEY/SIXTYDB_API_KEY, or pass --api-key-file.
  volc: export SEED-TTS-API-KEY/VOLC_API_KEY/VOLCENGINE_API_KEY/DOUBAO_API_KEY, use --env-file, or pass --api-key-file.
`);
}

function fail(message) {
    console.error(`Error: ${message}`);
    process.exit(1);
}

function readOption(args, index, option) {
    const value = args[index + 1];
    if (!value || value.startsWith('--')) fail(`${option} requires a value`);
    return value;
}

function parseNumber(value, option, { min = -Infinity, max = Infinity, integer = false } = {}) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
        fail(`${option} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`);
    }
    return number;
}

function parseArgs(argv) {
    const options = {
        ...DEFAULTS,
        keepClips: false,
        dryRun: false,
        apiKeyFile: null,
        apiKeyEnv: null,
        envFile: null,
        volcBaseUrl: DEFAULTS.volcBaseUrl,
        instructionA: null,
        instructionB: null,
        instructionNarrator: null,
        instructionSummary: null,
        subtitle: false,
        speedA: null,
        speedB: null,
        speedNarrator: null,
        speedSummary: null,
        pitchA: 0,
        pitchB: 0,
        pitchSummary: 0,
        voiceA: null,
        voiceB: null,
        voiceNarrator: null,
        voiceSummary: null,
        model: null
    };
    const positional = [];

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '-h' || arg === '--help') {
            printHelp();
            process.exit(0);
        }
        if (arg === '--keep-clips') {
            options.keepClips = true;
            continue;
        }
        if (arg === '--dry-run') {
            options.dryRun = true;
            continue;
        }
        if (arg === '--subtitle') {
            options.subtitle = true;
            continue;
        }
        if (!arg.startsWith('--')) {
            positional.push(arg);
            continue;
        }

        const value = readOption(argv, index, arg);
        index += 1;
        if (arg === '--provider') options.provider = value;
        else if (arg === '--base-url') options.baseUrl = value;
        else if (arg === '--volc-base-url') options.volcBaseUrl = value;
        else if (arg === '--voice-a') options.voiceA = value;
        else if (arg === '--voice-b') options.voiceB = value;
        else if (arg === '--voice-narrator') options.voiceNarrator = value;
        else if (arg === '--voice-summary') options.voiceSummary = value;
        else if (arg === '--model') options.model = value;
        else if (arg === '--instruction-a') options.instructionA = value;
        else if (arg === '--instruction-b') options.instructionB = value;
        else if (arg === '--instruction-narrator') options.instructionNarrator = value;
        else if (arg === '--instruction-summary') options.instructionSummary = value;
        else if (arg === '--lang') options.language = value;
        else if (arg === '--api-key-file') options.apiKeyFile = value;
        else if (arg === '--env-file') options.envFile = value;
        else if (arg === '--api-key-env') options.apiKeyEnv = value;
        else if (arg === '--speed') options.speed = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--speed-a') options.speedA = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--speed-b') options.speedB = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--speed-narrator') {
            options.speedNarrator = parseNumber(value, arg, { min: 0.5, max: 2 });
        } else if (arg === '--speed-summary') options.speedSummary = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--pitch-a') options.pitchA = parseNumber(value, arg, { min: -12, max: 12 });
        else if (arg === '--pitch-b') options.pitchB = parseNumber(value, arg, { min: -12, max: 12 });
        else if (arg === '--pitch-summary') {
            options.pitchSummary = parseNumber(value, arg, { min: -12, max: 12 });
        } else if (arg === '--stability') options.stability = parseNumber(value, arg, { min: 0, max: 1 });
        else if (arg === '--similarity') options.similarity = parseNumber(value, arg, { min: 0, max: 1 });
        else if (arg === '--style') options.style = parseNumber(value, arg, { min: 0, max: 1 });
        else if (arg === '--post-speed') options.postSpeed = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--post-speed-a') options.postSpeedA = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--post-speed-b') options.postSpeedB = parseNumber(value, arg, { min: 0.5, max: 2 });
        else if (arg === '--post-speed-summary') {
            options.postSpeedSummary = parseNumber(value, arg, { min: 0.5, max: 2 });
        } else if (arg === '--pause-ms') options.pauseMs = parseNumber(value, arg, { min: 0, max: 5000 });
        else if (arg === '--summary-pause-ms') {
            options.summaryPauseMs = parseNumber(value, arg, { min: 0, max: 5000 });
        } else if (arg === '--seed') {
            options.seed = parseNumber(value, arg, { min: 0, max: 4294967295, integer: true });
        } else fail(`unknown option ${arg}`);
    }

    if (positional.length < 1 || positional.length > 2) {
        printHelp();
        fail('provide an input file and, optionally, one output file');
    }
    if (!Object.hasOwn(PROVIDER_DEFAULTS, options.provider)) fail('--provider must be inner, sag, or volc');

    const inputPath = path.resolve(positional[0]);
    const defaultOutput = path.join(
        path.dirname(inputPath),
        `${path.basename(inputPath, path.extname(inputPath))}.mp3`
    );
    options.inputPath = inputPath;
    options.outputPath = path.resolve(positional[1] || defaultOutput);
    options.model ||= PROVIDER_DEFAULTS[options.provider].model;
    options.voiceA ||= PROVIDER_DEFAULTS[options.provider].voiceA;
    options.voiceB ||= PROVIDER_DEFAULTS[options.provider].voiceB;
    options.voiceNarrator ||= options.voiceB;
    options.voiceSummary ||= options.provider === 'volc' ? options.voiceB : options.voiceA;
    options.instructionNarrator ||= options.instructionB;
    return options;
}

function parseEnvFile(filePath) {
    const variables = {};
    const lines = fs
        .readFileSync(filePath, 'utf8')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/);
    for (const sourceLine of lines) {
        const line = sourceLine.trim();
        if (!line || line.startsWith('#')) continue;
        const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.*)$/);
        if (!match) continue;
        let value = match[2].trim();
        if (
            value.length >= 2 &&
            ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        ) {
            value = value.slice(1, -1);
        }
        variables[match[1]] = value;
    }
    return variables;
}

function resolveApiKey(options) {
    if (options.apiKeyFile) return fs.readFileSync(path.resolve(options.apiKeyFile), 'utf8').trim();
    const keyNames = options.apiKeyEnv
        ? [options.apiKeyEnv]
        : options.provider === 'inner'
          ? ['INNER_TTS_API_KEY', 'BZA_API_KEY', 'TTS-INNER-API-KEY']
          : options.provider === 'sag'
            ? ['ELEVENLABS_API_KEY', 'SIXTYDB_API_KEY']
            : ['SEED-TTS-API-KEY', 'VOLC_API_KEY', 'VOLCENGINE_API_KEY', 'DOUBAO_API_KEY', 'ARK_API_KEY'];
    for (const keyName of keyNames) {
        if (process.env[keyName]) return process.env[keyName];
    }
    return null;
}

function cleanSpeechText(value) {
    return value
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[\*_~`]/g, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseDialogue(source) {
    const turns = [];
    const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
        const line = lines[lineNumber].trim();
        if (!line) continue;

        const match = line.match(/^(A|B|N|NARRATOR|旁白|SUMMARY|总结)\s*[:：]\s*(.*)$/iu);
        if (match) {
            const label = match[1].toUpperCase();
            const role =
                label === 'A'
                    ? 'A'
                    : label === 'B'
                      ? 'B'
                      : label === 'SUMMARY' || label === '总结'
                        ? 'SUMMARY'
                        : 'NARRATOR';
            const text = cleanSpeechText(match[2]);
            if (!text) fail(`line ${lineNumber + 1} has a speaker label but no text`);
            turns.push({ role, text, lineNumber: lineNumber + 1 });
            continue;
        }

        if (turns.length === 0) {
            fail(`line ${lineNumber + 1} must start with A:, B:, Narrator:, N:, 旁白:, Summary:, or 总结:`);
        }
        turns.at(-1).text = cleanSpeechText(`${turns.at(-1).text} ${line}`);
    }

    if (turns.length === 0) fail('the input contains no dialogue turns');
    return turns;
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, { encoding: 'utf8', stdio: options.quiet ? 'pipe' : 'inherit' });
    if (result.error?.code === 'ENOENT') fail(`${command} is not installed or not on PATH`);
    if (result.status !== 0) {
        const detail = options.quiet ? (result.stderr || result.stdout || '').trim() : '';
        fail(`${command} exited with status ${result.status}${detail ? `: ${detail}` : ''}`);
    }
    return result;
}

function voiceFor(turn, options) {
    if (turn.role === 'A') return options.voiceA;
    if (turn.role === 'B') return options.voiceB;
    if (turn.role === 'NARRATOR') return options.voiceNarrator;
    return options.voiceSummary;
}

function postSpeedFor(turn, options) {
    if (turn.role === 'A') return options.postSpeedA ?? options.postSpeed;
    if (turn.role === 'B' || turn.role === 'NARRATOR') return options.postSpeedB ?? options.postSpeed;
    return options.postSpeedSummary ?? options.postSpeed;
}

function speedFor(turn, options) {
    if (turn.role === 'A') return options.speedA ?? options.speed;
    if (turn.role === 'B') return options.speedB ?? options.speed;
    if (turn.role === 'NARRATOR') return options.speedNarrator ?? options.speedB ?? options.speed;
    return options.speedSummary ?? options.speed;
}

function pitchFor(turn, options) {
    if (turn.role === 'A') return options.pitchA;
    if (turn.role === 'B' || turn.role === 'NARRATOR') return options.pitchB;
    return options.pitchSummary;
}

function outputCodecArgs(outputPath) {
    const extension = path.extname(outputPath).toLowerCase();
    if (extension === '.mp3') return ['-c:a', 'libmp3lame', '-b:a', '192k'];
    if (extension === '.wav') return ['-c:a', 'pcm_s16le'];
    if (extension === '.m4a' || extension === '.aac') return ['-c:a', 'aac', '-b:a', '192k'];
    fail('output extension must be .mp3, .wav, .m4a, or .aac');
}

function writeSilence(filePath, durationMs) {
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

function printPlan(turns, options) {
    console.log(`Input:  ${options.inputPath}`);
    console.log(`Output: ${options.outputPath}`);
    console.log(`TTS:    ${options.provider} / ${options.model} (${options.language})`);
    if (options.provider === 'inner') console.log(`API:    ${options.baseUrl}`);
    if (options.provider === 'volc') console.log(`API:    ${options.volcBaseUrl}`);
    console.log(
        `Voices: A=${options.voiceA}, B=${options.voiceB}, narrator=${options.voiceNarrator}, summary=${options.voiceSummary}`
    );
    console.log('');
    turns.forEach((turn, index) => {
        console.log(
            `${String(index + 1).padStart(2, '0')}. ${turn.role.padEnd(7)} [${voiceFor(turn, options)}] ${turn.text}`
        );
    });
}

async function generateInnerClip(turn, text, outputPath, options, apiKey) {
    const response = await fetch(options.baseUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: options.model,
            input: text,
            voice: voiceFor(turn, options),
            response_format: 'wav'
        })
    });
    const body = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
        const detail = body.toString('utf8').trim();
        throw new Error(`inner TTS returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('json')) {
        throw new Error(`inner TTS returned JSON instead of audio: ${body.toString('utf8').trim()}`);
    }
    fs.writeFileSync(outputPath, body);
}

function instructionFor(turn, options) {
    if (turn.role === 'A') return options.instructionA;
    if (turn.role === 'B') return options.instructionB;
    if (turn.role === 'NARRATOR') return options.instructionNarrator;
    return options.instructionSummary;
}

function volcSpeechRate(speed) {
    return Math.max(-50, Math.min(100, Math.round((speed - 1) * 100)));
}

function volcLanguage(language) {
    const normalized = String(language || '').toLowerCase();
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
    if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-cn';
    return language;
}

function normalizeVolcSpeechText(text, language) {
    const normalizedLanguage = String(language || '').toLowerCase();
    if (normalizedLanguage === 'zh' || normalizedLanguage.startsWith('zh-')) {
        return text.replaceAll('：', '，');
    }
    return text;
}

async function generateVolcClip(turn, text, outputPath, options, apiKey) {
    const additions = {
        disable_markdown_filter: true,
        disable_emoji_filter: true
    };
    const instruction = instructionFor(turn, options);
    if (instruction) additions.context_texts = [instruction];

    const response = await fetch(options.volcBaseUrl, {
        method: 'POST',
        headers: {
            'X-Api-Key': apiKey,
            'X-Api-Resource-Id': options.model,
            'X-Api-Request-Id': randomUUID(),
            'X-Control-Require-Usage-Tokens-Return': '*',
            'Content-Type': 'application/json',
            Connection: 'keep-alive'
        },
        body: JSON.stringify({
            req_params: {
                text: normalizeVolcSpeechText(text, options.language),
                speaker: voiceFor(turn, options),
                additions: JSON.stringify(additions),
                explicit_language: volcLanguage(options.language),
                audio_params: {
                    format: 'mp3',
                    sample_rate: 24000,
                    speech_rate: volcSpeechRate(speedFor(turn, options)),
                    enable_subtitle: options.subtitle
                },
                ...(pitchFor(turn, options) === 0 ? {} : { post_process: { pitch: pitchFor(turn, options) } }),
                silence_duration: 0
            }
        })
    });
    const body = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
        throw new Error(`Volcengine TTS returned HTTP ${response.status}: ${body.toString('utf8').trim()}`);
    }

    const source = body.toString('utf8').trim();
    const chunks = [];
    for (const line of source
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)) {
        let packet;
        try {
            packet = JSON.parse(line);
        } catch {
            throw new Error(`Volcengine TTS returned an invalid JSON chunk: ${line.slice(0, 240)}`);
        }
        if (packet.code !== undefined && ![0, 20000000].includes(packet.code)) {
            throw new Error(`Volcengine TTS returned code ${packet.code}: ${packet.message || 'unknown error'}`);
        }
        if (packet.data) chunks.push(Buffer.from(packet.data, 'base64'));
    }
    if (!chunks.length) throw new Error('Volcengine TTS returned no audio data');
    fs.writeFileSync(outputPath, Buffer.concat(chunks));
}

function generateSagClip(turn, text, outputPath, options) {
    const sagArgs = [
        'speak',
        '--voice',
        voiceFor(turn, options),
        '--model-id',
        options.model,
        '--lang',
        options.language,
        '--normalize',
        'auto',
        '--speed',
        String(speedFor(turn, options)),
        '--stability',
        String(options.stability),
        '--similarity',
        String(options.similarity),
        '--style',
        String(options.style),
        '--seed',
        String((options.seed + turn.index) % 4294967296),
        '--format',
        'mp3_44100_128',
        '--no-play',
        '--no-stream',
        '--output',
        outputPath
    ];
    if (options.apiKeyFile) sagArgs.push('--api-key-file', path.resolve(options.apiKeyFile));
    sagArgs.push(text);
    run('sag', sagArgs);
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(options.inputPath)) fail(`input file does not exist: ${options.inputPath}`);
    outputCodecArgs(options.outputPath);
    if (options.envFile) {
        const envPath = path.resolve(options.envFile);
        if (!fs.existsSync(envPath)) fail(`environment file does not exist: ${envPath}`);
        const variables = parseEnvFile(envPath);
        for (const [name, value] of Object.entries(variables)) process.env[name] ||= value;
    }
    const turns = parseDialogue(fs.readFileSync(options.inputPath, 'utf8'));

    if (options.dryRun) {
        printPlan(turns, options);
        return;
    }

    if (options.apiKeyFile && !fs.existsSync(path.resolve(options.apiKeyFile))) {
        fail(`API key file does not exist: ${path.resolve(options.apiKeyFile)}`);
    }
    const apiKey = resolveApiKey(options);
    if (!apiKey) {
        const expected =
            options.provider === 'inner'
                ? 'INNER_TTS_API_KEY/BZA_API_KEY'
                : options.provider === 'sag'
                  ? 'ELEVENLABS_API_KEY/SIXTYDB_API_KEY'
                  : 'SEED-TTS-API-KEY/VOLC_API_KEY/VOLCENGINE_API_KEY/DOUBAO_API_KEY';
        fail(`no ${options.provider} TTS key found; export ${expected}, use --env-file, or pass --api-key-file`);
    }

    if (options.provider === 'sag') run('sag', ['--version'], { quiet: true });
    run('ffmpeg', ['-version'], { quiet: true });
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-dialogue-'));
    const clipDirectory = options.keepClips
        ? `${options.outputPath.slice(0, -path.extname(options.outputPath).length)}-clips`
        : temporaryDirectory;
    if (options.keepClips) fs.mkdirSync(clipDirectory, { recursive: true });

    try {
        const timeline = [];
        const normalSilence = path.join(temporaryDirectory, 'pause.wav');
        const summarySilence = path.join(temporaryDirectory, 'summary-pause.wav');
        if (options.pauseMs > 0) writeSilence(normalSilence, options.pauseMs);
        if (options.summaryPauseMs > 0) writeSilence(summarySilence, options.summaryPauseMs);

        for (let index = 0; index < turns.length; index += 1) {
            const turn = turns[index];
            const stem = `${String(index + 1).padStart(2, '0')}-${turn.role.toLowerCase()}`;
            const rawExtension = options.provider === 'inner' ? 'wav' : 'mp3';
            const rawPath = path.join(clipDirectory, `${stem}.${rawExtension}`);
            const wavPath = path.join(temporaryDirectory, `${stem}-normalized.wav`);
            const spokenText = turn.text;
            console.log(`[${index + 1}/${turns.length}] Generating ${turn.role} with ${voiceFor(turn, options)}...`);
            const indexedTurn = { ...turn, index };
            if (options.provider === 'inner') {
                await generateInnerClip(indexedTurn, spokenText, rawPath, options, apiKey);
            } else if (options.provider === 'sag') {
                generateSagClip(indexedTurn, spokenText, rawPath, options);
            } else {
                await generateVolcClip(indexedTurn, spokenText, rawPath, options, apiKey);
            }
            run('ffmpeg', [
                '-hide_banner',
                '-loglevel',
                'error',
                '-y',
                '-i',
                rawPath,
                '-ar',
                '44100',
                '-ac',
                '1',
                '-c:a',
                'pcm_s16le',
                ...(postSpeedFor(turn, options) === 1 ? [] : ['-filter:a', `atempo=${postSpeedFor(turn, options)}`]),
                wavPath
            ]);

            timeline.push(wavPath);
            if (index < turns.length - 1) {
                const nextTurn = turns[index + 1];
                const silence = nextTurn.role === 'SUMMARY' ? summarySilence : normalSilence;
                const duration = nextTurn.role === 'SUMMARY' ? options.summaryPauseMs : options.pauseMs;
                if (duration > 0) timeline.push(silence);
            }
        }

        const concatPath = path.join(temporaryDirectory, 'timeline.txt');
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
            ...outputCodecArgs(options.outputPath),
            options.outputPath
        ]);

        if (options.keepClips) {
            fs.writeFileSync(
                path.join(clipDirectory, 'manifest.json'),
                `${JSON.stringify(
                    turns.map((turn, index) => ({
                        index: index + 1,
                        role: turn.role,
                        voice: voiceFor(turn, options),
                        text: turn.text
                    })),
                    null,
                    2
                )}\n`
            );
        }
        console.log(`Created ${options.outputPath}`);
    } finally {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
