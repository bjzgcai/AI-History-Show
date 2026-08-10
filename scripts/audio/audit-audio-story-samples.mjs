#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'generated', 'ai100-first-40-and-gaming');
const AUDIO_ROOT = path.join(OUTPUT_ROOT, 'audio', 'bench-council-ai100', 'storyline');
const SCRIPT_ROOT = path.join(
    ROOT,
    'resources',
    'audio',
    'scripts',
    'ai100-first-40-and-gaming',
    'compiled',
    'bench-council-ai100',
    'storyline'
);
const TRANSCRIPT_ROOT = path.join(OUTPUT_ROOT, 'quality', 'transcripts');
const REPORT_PATH = path.join(OUTPUT_ROOT, 'listening-sample-report.json');
const WHISPER_BIN_ROOT = path.join(ROOT, '.tmp', 'whisper-cpp-bin');
const WHISPER_LIBRARY_ROOT = path.join(WHISPER_BIN_ROOT, 'whisper-bin-ubuntu-x64');
const SAMPLES = ['09-1958-lisp', '10-1973-prolog', '11-1966-eliza', '12-1970-shrdlu', '13-2011-ibm-watson'];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.writeFileSync(filePath, formatted);
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        env: options.env || process.env
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
        throw new Error(`${command} exited ${result.status}: ${detail.slice(-3000)}`);
    }
    return result;
}

function levenshtein(left, right) {
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    const current = new Array(right.length + 1);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
        current[0] = leftIndex;
        for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
            const substitution = previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
            current[rightIndex] = Math.min(previous[rightIndex] + 1, current[rightIndex - 1] + 1, substitution);
        }
        for (let index = 0; index < previous.length; index += 1) previous[index] = current[index];
    }
    return previous[right.length];
}

function normalizedExpected(source, locale) {
    const withoutLabels = source
        .split(/\r?\n/)
        .map((line) => line.replace(/^(?:A|B|N|Summary|总结)\s*[:：]\s*/i, ''))
        .join(' ');
    if (locale === 'zh') {
        return [
            ...withoutLabels
                .toLowerCase()
                .replace(/[a-z0-9]+/g, '')
                .replace(/[^\p{Script=Han}]/gu, '')
        ];
    }
    return withoutLabels.toLowerCase().match(/[a-z0-9]+(?:'[a-z0-9]+)?/g) || [];
}

function normalizedTranscript(transcript, locale) {
    const source = transcript.map((item) => item.text).join(' ');
    if (locale === 'zh') {
        return [
            ...source
                .toLowerCase()
                .replace(/[a-z0-9]+/g, '')
                .replace(/[^\p{Script=Han}]/gu, '')
        ];
    }
    return source.toLowerCase().match(/[a-z0-9]+(?:'[a-z0-9]+)?/g) || [];
}

function similarity(expected, actual) {
    const denominator = Math.max(expected.length, actual.length, 1);
    return 1 - levenshtein(expected, actual) / denominator;
}

function transcribe(audioPath, transcriptDir, locale) {
    const transcriptPath = path.join(transcriptDir, 'transcript.json');
    if (fs.existsSync(transcriptPath)) return transcriptPath;
    fs.mkdirSync(transcriptDir, { recursive: true });
    const binary = path.join(WHISPER_BIN_ROOT, 'whisper-cpp');
    if (!fs.existsSync(binary)) {
        throw new Error(`whisper-cpp is missing at ${binary}; install the local binary before running this audit`);
    }
    const env = {
        ...process.env,
        PATH: `${WHISPER_BIN_ROOT}:${process.env.PATH}`,
        LD_LIBRARY_PATH: `${WHISPER_LIBRARY_ROOT}${process.env.LD_LIBRARY_PATH ? `:${process.env.LD_LIBRARY_PATH}` : ''}`
    };
    const model = locale === 'zh' ? 'small' : 'small.en';
    run(
        'npx',
        [
            'hyperframes',
            'transcribe',
            audioPath,
            '--model',
            model,
            '--language',
            locale,
            '--dir',
            transcriptDir,
            '--json'
        ],
        { env }
    );
    if (!fs.existsSync(transcriptPath)) throw new Error(`Transcription did not create ${transcriptPath}`);
    return transcriptPath;
}

function inspectTranscript(transcript, expected, locale, audioDuration) {
    const musicPattern = /^[♪�\u266a\u266b\u266c\u266d\u266e\u266f]+$/;
    const musicEntries = transcript.filter((item) => musicPattern.test(String(item.text || '').trim()));
    const veryShortEntries = transcript.filter((item) => Number(item.end) - Number(item.start) < 0.05);
    const fillerEntries = transcript.filter(
        (item) =>
            /^(huh|uh|um|ah|oh)$/i.test(String(item.text || '').trim()) && Number(item.end) - Number(item.start) < 0.1
    );
    const actual = normalizedTranscript(transcript, locale);
    const textSimilarity = similarity(expected, actual);
    const lastEnd = Math.max(0, ...transcript.map((item) => Number(item.end) || 0));
    const coverageRatio = audioDuration > 0 ? lastEnd / audioDuration : 0;
    const threshold = locale === 'zh' ? 0.72 : 0.82;
    const issues = [];
    if (transcript.length === 0) issues.push('empty-transcript');
    if (musicEntries.length / Math.max(transcript.length, 1) > 0.2) issues.push('too-many-music-tokens');
    if (veryShortEntries.length / Math.max(transcript.length, 1) > 0.1) issues.push('too-many-short-spans');
    if (fillerEntries.length > 2) issues.push('repeated-filler-hallucination');
    if (coverageRatio < 0.92) issues.push('transcript-coverage-too-short');
    if (textSimilarity < threshold) issues.push('text-similarity-below-threshold');
    return {
        entryCount: transcript.length,
        musicTokenCount: musicEntries.length,
        veryShortSpanCount: veryShortEntries.length,
        fillerCount: fillerEntries.length,
        coverageRatio: Number(coverageRatio.toFixed(4)),
        textSimilarity: Number(textSimilarity.toFixed(4)),
        threshold,
        passed: issues.length === 0,
        issues
    };
}

function audioDuration(filePath) {
    const result = run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath
    ]);
    return Number(result.stdout.trim());
}

async function main() {
    const results = [];
    for (const sample of SAMPLES) {
        for (const locale of ['zh', 'en']) {
            const audioPath = path.join(AUDIO_ROOT, locale, `${sample}.mp3`);
            const scriptPath = path.join(SCRIPT_ROOT, locale, `${sample}.txt`);
            const transcriptDir = path.join(TRANSCRIPT_ROOT, locale, sample);
            console.log(`Auditing ${sample} (${locale})...`);
            const transcriptPath = transcribe(audioPath, transcriptDir, locale);
            const transcript = readJson(transcriptPath);
            const expected = normalizedExpected(fs.readFileSync(scriptPath, 'utf8'), locale);
            const inspection = inspectTranscript(transcript, expected, locale, audioDuration(audioPath));
            results.push({
                sample,
                locale,
                audioPath: path.relative(ROOT, audioPath),
                scriptPath: path.relative(ROOT, scriptPath),
                transcriptPath: path.relative(ROOT, transcriptPath),
                ...inspection
            });
        }
    }
    const failures = results.filter((result) => !result.passed);
    const report = {
        schemaVersion: 1,
        status: failures.length ? 'failed' : 'passed',
        sampleSequence: SAMPLES,
        sampleCount: results.length,
        failures: failures.map((failure) => ({
            sample: failure.sample,
            locale: failure.locale,
            issues: failure.issues
        })),
        results
    };
    await writeFormatted(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    if (failures.length) {
        for (const failure of failures) {
            console.error(`- ${failure.sample}/${failure.locale}: ${failure.issues.join(', ')}`);
        }
        process.exit(1);
    }
    console.log(`Listening sample audit passed for ${results.length} adjacent bilingual files.`);
}

await main();
