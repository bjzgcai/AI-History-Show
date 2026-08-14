#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import prettier from 'prettier';
import { fileURLToPath } from 'node:url';
import { ROOT, readJson, relativeToRoot } from './lib/audio-revision.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const CONFIG_PATH = path.join(ROOT, 'audio/pronunciation/validation-cases.json');
const OUTPUT_ROOT = path.join(ROOT, '.tmp/pronunciation-validation');
const TRANSCRIPT_ROOT = path.join(OUTPUT_ROOT, 'automatic-transcripts');
const CROP_ROOT = path.join(OUTPUT_ROOT, 'automatic-crops');
const SCORE_ROOT = path.join(OUTPUT_ROOT, 'automatic-scores');
const REPORT_PATH = path.join(OUTPUT_ROOT, 'automatic-report.json');
const REPORT_MARKDOWN_PATH = path.join(OUTPUT_ROOT, 'automatic-report.md');
const REVIEW_MANIFEST_PATH = path.join(OUTPUT_ROOT, 'review-manifest.json');
const WHISPER_ROOT = path.join(ROOT, '.tmp/whisper-cpp-bin/whisper-bin-ubuntu-x64');
const WHISPER_BIN = path.join(WHISPER_ROOT, 'whisper-cli');
const MULTILINGUAL_MODEL = path.join(process.env.HOME, '.cache/hyperframes/whisper/models/ggml-small.bin');
const ENGLISH_MODEL = path.join(process.env.HOME, '.cache/hyperframes/whisper/models/ggml-small.en.bin');

function fail(message) {
    throw new Error(message);
}

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseArgs(argv) {
    return {
        checkGold: argv.includes('--check-gold'),
        requireFullCoverage: argv.includes('--require-full-coverage')
    };
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 30 * 1024 * 1024,
        env: {
            ...process.env,
            LD_LIBRARY_PATH: `${WHISPER_ROOT}${process.env.LD_LIBRARY_PATH ? `:${process.env.LD_LIBRARY_PATH}` : ''}`
        }
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
        fail(`${command} exited ${result.status}${detail ? `: ${detail.slice(-3000)}` : ''}`);
    }
    return options.stdout ? result.stdout : result;
}

export function normalized(value) {
    return [...String(value || '').toLowerCase()].filter((character) => /[a-z0-9]/u.test(character)).join('');
}

function levenshtein(left, right) {
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
        const current = [leftIndex];
        for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
            current[rightIndex] = Math.min(
                previous[rightIndex] + 1,
                current[rightIndex - 1] + 1,
                previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
            );
        }
        previous = current;
    }
    return previous[right.length];
}

export function transcriptTokens(transcript) {
    return transcript.transcription
        .flatMap((segment) => segment.tokens || [])
        .filter((token) => !token.text.startsWith('[_'));
}

function exactOrFuzzyRange(tokens, aliases) {
    const targets = aliases.map(normalized);
    const candidates = [];
    for (let start = 0; start < tokens.length; start += 1) {
        const firstPiece = normalized(tokens[start].text);
        if (!firstPiece) continue;
        let combined = '';
        for (let end = start; end < Math.min(start + 8, tokens.length); end += 1) {
            combined += normalized(tokens[end].text);
            if (targets.includes(combined)) {
                return { start, end, method: 'token-exact', editDistance: 0, tokenText: combined };
            }
            const distance = Math.min(...targets.map((target) => levenshtein(combined, target)));
            if (combined && distance <= 1) {
                const confidence =
                    tokens.slice(start, end + 1).reduce((sum, token) => sum + Number(token.p || 0), 0) /
                    (end - start + 1);
                candidates.push({
                    start,
                    end,
                    method: 'token-fuzzy',
                    editDistance: distance,
                    confidence,
                    tokenText: combined
                });
            }
            if (combined.length > Math.max(...targets.map((target) => target.length)) + 1) break;
        }
    }
    return candidates.sort(
        (left, right) => left.editDistance - right.editDistance || right.confidence - left.confidence
    )[0];
}

function contextRange(tokens, aliases, sourceText) {
    const source = normalized(sourceText);
    const positions = aliases
        .map(normalized)
        .map((alias) => ({ alias, index: source.indexOf(alias) }))
        .filter((item) => item.index >= 0)
        .sort((left, right) => left.index - right.index);
    if (!positions.length) return null;
    const target = positions[0];
    const transcriptCharacters = [];
    for (const [tokenIndex, token] of tokens.entries()) {
        for (const character of normalized(token.text)) transcriptCharacters.push({ character, tokenIndex });
    }
    const transcriptText = transcriptCharacters.map((item) => item.character).join('');
    const before = source.slice(0, target.index);
    const after = source.slice(target.index + target.alias.length);
    let beforeToken = null;
    for (let length = Math.min(8, before.length); length >= 1; length -= 1) {
        const position = transcriptText.lastIndexOf(before.slice(-length));
        if (position >= 0) {
            beforeToken = transcriptCharacters[position + length - 1].tokenIndex;
            break;
        }
    }
    let afterToken = null;
    for (let length = Math.min(8, after.length); length >= 1; length -= 1) {
        const position = transcriptText.indexOf(after.slice(0, length));
        if (position >= 0) {
            afterToken = transcriptCharacters[position].tokenIndex;
            break;
        }
    }
    if (beforeToken === null || afterToken === null || beforeToken >= afterToken) return null;
    return { start: beforeToken + 1, end: afterToken - 1, method: 'context-anchor', editDistance: null };
}

function locateRange(tokens, validationCase, sourceText) {
    const aliases = validationCase.alignmentAliases || [validationCase.term];
    if (Number.isInteger(validationCase.alignmentOccurrence)) {
        const located = locateRanges(tokens, aliases)[validationCase.alignmentOccurrence];
        if (located) return located;
    }
    return exactOrFuzzyRange(tokens, aliases) || contextRange(tokens, aliases, sourceText);
}

export function locateRanges(tokens, aliases) {
    const targets = aliases.map(normalized).filter(Boolean);
    const ranges = [];
    for (let start = 0; start < tokens.length; start += 1) {
        if (!normalized(tokens[start].text)) continue;
        let combined = '';
        for (let end = start; end < Math.min(start + 8, tokens.length); end += 1) {
            combined += normalized(tokens[end].text);
            if (targets.includes(combined)) {
                ranges.push({ start, end, method: 'token-exact', editDistance: 0, tokenText: combined });
                break;
            }
            if (combined.length > Math.max(...targets.map((target) => target.length)) + 1) break;
        }
    }
    return ranges.filter((range, index) => index === 0 || range.start > ranges[index - 1].end);
}

export function transcribe(sample, locale) {
    const audioSha256 = sha256File(sample.audioPath);
    const outputStem = path.join(TRANSCRIPT_ROOT, `${sample.id}-${audioSha256.slice(0, 16)}`);
    const outputPath = `${outputStem}.json`;
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(TRANSCRIPT_ROOT, { recursive: true });
        run(WHISPER_BIN, ['-m', MULTILINGUAL_MODEL, '-l', locale, '-ojf', '-of', outputStem, '-np', sample.audioPath]);
    }
    return { transcript: readJson(outputPath), audioSha256, outputPath };
}

export function crop(sample, range) {
    const outputPath = path.join(CROP_ROOT, `${sample.id}.wav`);
    fs.mkdirSync(CROP_ROOT, { recursive: true });
    const startMs = Math.max(0, range.startMs - 120);
    const endMs = range.endMs + 120;
    run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-ss',
        String(startMs / 1000),
        '-to',
        String(endMs / 1000),
        '-i',
        sample.audioPath,
        '-ar',
        '16000',
        '-ac',
        '1',
        outputPath
    ]);
    return { outputPath, startMs, endMs, durationMs: endMs - startMs };
}

function grammarFor(value) {
    return `root ::= ${[...value].map((character) => `[${character}]`).join(' ')}\n`;
}

function forcedCandidateScore(sample, label, candidate) {
    fs.mkdirSync(SCORE_ROOT, { recursive: true });
    const grammarPath = path.join(SCORE_ROOT, `${sample.id}-${label}.gbnf`);
    fs.writeFileSync(grammarPath, grammarFor(candidate));
    run(WHISPER_BIN, [
        '-m',
        ENGLISH_MODEL,
        '-l',
        'en',
        '-np',
        '-nt',
        '-ls',
        '--grammar',
        grammarPath,
        '--grammar-rule',
        'root',
        '--grammar-penalty',
        '100',
        sample.cropPath
    ]);
    const rows = fs
        .readFileSync(`${sample.cropPath}.score.txt`, 'utf8')
        .trim()
        .split(/\r?\n/u)
        .map((line) => line.split('\t'))
        .filter(([token]) => token !== '<|endoftext|>');
    return {
        output: rows.map(([token]) => token).join(''),
        meanLogProbability:
            rows.reduce((sum, [, probability]) => sum + Math.log(Math.max(Number(probability), 1e-9)), 0) /
            Math.max(rows.length, 1)
    };
}

export function classify(validationCase, sample) {
    const detector = validationCase.automaticValidation.detector;
    if (detector === 'duration') {
        if (sample.durationMs <= validationCase.automaticValidation.passMaxMs) return { decision: 'PASS', detector };
        if (sample.durationMs >= validationCase.automaticValidation.failMinMs) return { decision: 'FAIL', detector };
        return { decision: 'REVIEW', detector, reason: 'duration-between-calibrated-thresholds' };
    }
    if (detector === 'token-form') {
        const compact = normalized(sample.targetTokenText);
        if (validationCase.automaticValidation.passPrefixes.some((prefix) => compact.startsWith(prefix))) {
            return { decision: 'PASS', detector, compact };
        }
        if (validationCase.automaticValidation.failPrefixes.some((prefix) => compact.startsWith(prefix))) {
            return { decision: 'FAIL', detector, compact };
        }
        return { decision: 'REVIEW', detector, compact, reason: 'unrecognized-token-form' };
    }
    if (detector === 'forced-candidate') {
        const expected = forcedCandidateScore(sample, 'expected', validationCase.automaticValidation.expectedText);
        const rejected = forcedCandidateScore(sample, 'rejected', validationCase.automaticValidation.rejectedText);
        const margin = expected.meanLogProbability - rejected.meanLogProbability;
        if (margin >= validationCase.automaticValidation.passMinMargin) {
            return { decision: 'PASS', detector, expected, rejected, margin };
        }
        if (margin <= validationCase.automaticValidation.failMaxMargin) {
            return { decision: 'FAIL', detector, expected, rejected, margin };
        }
        return {
            decision: 'REVIEW',
            detector,
            expected,
            rejected,
            margin,
            reason: 'margin-between-calibrated-thresholds'
        };
    }
    if (detector === 'review-only') {
        return { decision: 'REVIEW', detector, reason: validationCase.automaticValidation.reason };
    }
    return { decision: 'REVIEW', detector: 'unsupported', reason: `unsupported detector: ${detector}` };
}

async function writeFormatted(filePath, value) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    fs.writeFileSync(filePath, await prettier.format(JSON.stringify(value), { ...config, filepath: filePath }));
}

function markdown(report) {
    const lines = [
        '# 发音自动验证报告',
        '',
        `状态：${report.gold.status}；覆盖率：${(report.gold.coverage * 100).toFixed(1)}%。`,
        '',
        '| 样本 | 目标 | Gold | 自动判定 | Detector | 目标区间 |',
        '| --- | --- | --- | --- | --- | --- |'
    ];
    for (const result of report.results) {
        lines.push(
            `| ${result.id} | ${result.term} | ${result.gold} | ${result.decision} | ${result.detector} | ${result.startMs}-${result.endMs} ms |`
        );
    }
    lines.push(
        '',
        `- False accept: ${report.gold.falseAcceptCount}`,
        `- False reject: ${report.gold.falseRejectCount}`,
        `- Review: ${report.gold.reviewCount}`
    );
    return `${lines.join('\n')}\n`;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    for (const requiredPath of [WHISPER_BIN, MULTILINGUAL_MODEL, ENGLISH_MODEL]) {
        if (!fs.existsSync(requiredPath)) {
            fail(`Missing ${requiredPath}; run node scripts/audio/prepare-pronunciation-validator.mjs`);
        }
    }
    const config = readJson(CONFIG_PATH);
    const results = [];
    for (const validationCase of config.cases.filter((item) => item.automaticValidation)) {
        const turnData = readJson(path.join(ROOT, validationCase.turnPath));
        const sourceText = turnData.turns[validationCase.turnIndex - 1].text;
        for (const [variant, gold] of Object.entries(validationCase.goldVariants || {})) {
            const id = `${validationCase.id}-${variant}`;
            const audioPath = path.join(OUTPUT_ROOT, validationCase.audioCaseId || validationCase.id, `${variant}.mp3`);
            if (!fs.existsSync(audioPath)) fail(`Missing validation audio ${relativeToRoot(audioPath)}`);
            const transcription = transcribe({ id, audioPath }, validationCase.locale);
            const tokens = transcriptTokens(transcription.transcript);
            const located = locateRange(tokens, validationCase, sourceText);
            if (!located) {
                results.push({
                    id,
                    term: validationCase.term,
                    gold,
                    decision: 'REVIEW',
                    detector: 'alignment',
                    reason: 'target-not-located'
                });
                continue;
            }
            const selectedTokens = tokens.slice(located.start, located.end + 1);
            const startMs = selectedTokens[0]?.offsets.from;
            const endMs = selectedTokens.at(-1)?.offsets.to;
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
                results.push({
                    id,
                    term: validationCase.term,
                    gold,
                    decision: 'REVIEW',
                    detector: 'alignment',
                    reason: 'invalid-target-range'
                });
                continue;
            }
            const cropped = crop({ id, audioPath }, { startMs, endMs });
            const sample = {
                id,
                audioPath,
                cropPath: cropped.outputPath,
                durationMs: cropped.durationMs,
                targetTokenText: selectedTokens.map((token) => token.text).join(''),
                alignment: located
            };
            results.push({
                id,
                term: validationCase.term,
                gold,
                startMs,
                endMs,
                durationMs: cropped.durationMs,
                targetTokenText: sample.targetTokenText,
                alignment: located,
                audioSha256: transcription.audioSha256,
                transcriptPath: relativeToRoot(transcription.outputPath),
                cropPath: relativeToRoot(cropped.outputPath),
                cropAbsolutePath: cropped.outputPath,
                ...classify(validationCase, sample)
            });
        }
    }
    const falseAccept = results.filter((item) => item.gold === 'FAIL' && item.decision === 'PASS');
    const falseReject = results.filter((item) => item.gold === 'PASS' && item.decision === 'FAIL');
    const reviews = results.filter((item) => item.decision === 'REVIEW');
    const resolved = results.length - reviews.length;
    const gold = {
        status: falseAccept.length || falseReject.length ? 'unsafe' : reviews.length ? 'safe-partial' : 'full-pass',
        sampleCount: results.length,
        resolvedCount: resolved,
        reviewCount: reviews.length,
        coverage: results.length ? resolved / results.length : 0,
        falseAcceptCount: falseAccept.length,
        falseRejectCount: falseReject.length,
        falseAccept: falseAccept.map((item) => item.id),
        falseReject: falseReject.map((item) => item.id)
    };
    const report = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        runtime: {
            whisper: relativeToRoot(WHISPER_BIN),
            multilingualModel: MULTILINGUAL_MODEL,
            englishModel: ENGLISH_MODEL
        },
        gold,
        results
    };
    await writeFormatted(REPORT_PATH, report);
    await writeFormatted(REVIEW_MANIFEST_PATH, {
        schemaVersion: 1,
        generatedAt: report.generatedAt,
        reviewCount: reviews.length,
        items: reviews.map((item) => ({
            id: item.id,
            term: item.term,
            reason: item.reason,
            cropPath: item.cropPath,
            cropAbsolutePath: item.cropAbsolutePath,
            startMs: item.startMs,
            endMs: item.endMs
        }))
    });
    fs.writeFileSync(REPORT_MARKDOWN_PATH, markdown(report));
    console.log(`Pronunciation gold check: ${gold.status}, coverage ${(gold.coverage * 100).toFixed(1)}%.`);
    console.log(`Report: ${relativeToRoot(REPORT_PATH)}`);
    console.log(`Review manifest: ${relativeToRoot(REVIEW_MANIFEST_PATH)}`);
    if (options.checkGold && (gold.falseAcceptCount || gold.falseRejectCount)) process.exitCode = 1;
    if (options.requireFullCoverage && gold.status !== 'full-pass') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });
}
