#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { ROOT, fail, loadRevisionConfig, readJson, relativeToRoot, revisionPaths } from './lib/audio-revision.mjs';
import { loadPronunciationGlossary } from './lib/pronunciation.mjs';
import { classify, crop, locateRanges, transcribe, transcriptTokens } from './score-pronunciation-validation.mjs';

const CASES_PATH = path.join(ROOT, 'audio/pronunciation/validation-cases.json');
const OUTPUT_ROOT = path.join(ROOT, '.tmp/pronunciation-validation/revisions');
const SCRIPT_PATH = fileURLToPath(import.meta.url);

function parseArgs(argv) {
    return {
        configPath: argv.find((argument) => !argument.startsWith('--')),
        failOnFail: argv.includes('--fail-on-fail')
    };
}

function exactOccurrences(text, aliases) {
    const occurrences = [];
    for (const alias of aliases) {
        let start = text.indexOf(alias);
        while (start >= 0) {
            const before = text[start - 1] || '';
            const after = text[start + alias.length] || '';
            if (!/[A-Za-z0-9]/u.test(before) && !/[A-Za-z0-9]/u.test(after)) {
                occurrences.push({ start, end: start + alias.length, alias });
            }
            start = text.indexOf(alias, start + alias.length);
        }
    }
    return occurrences
        .sort((left, right) => left.start - right.start || right.alias.length - left.alias.length)
        .filter(
            (occurrence, index, items) =>
                index === 0 || occurrence.start !== items[index - 1].start || occurrence.end !== items[index - 1].end
        );
}

export function sourceOrdinal(turns, replacement, aliases) {
    let ordinal = 0;
    for (const [turnOffset, turn] of turns.entries()) {
        for (const occurrence of exactOccurrences(turn.text, aliases)) {
            if (turnOffset + 1 === replacement.turnIndex && occurrence.start === replacement.start) return ordinal;
            ordinal += 1;
        }
    }
    return -1;
}

function voiceForRole(profile, role) {
    if (role === 'A') return profile.voiceA;
    if (role === 'B') return profile.voiceB;
    if (role === 'SUMMARY') return profile.voiceSummary;
    return profile.voiceNarrator;
}

function overlaps(left, right) {
    return left.start <= right.end && right.start <= left.end;
}

function occurrenceKey(termId, turnIndex, start) {
    return `${termId}:${turnIndex}:${start}`;
}

function validationOccurrences(asset, casesByTerm, termsById) {
    const occurrences = [];
    for (const [caseKey, validationCase] of casesByTerm) {
        const [termId, locale] = caseKey.split(':');
        if (locale !== asset.locale) continue;
        const term = termsById.get(termId);
        if (!term) continue;
        let termOrdinal = 0;
        for (const [turnOffset, turn] of asset.turns.entries()) {
            for (const occurrence of exactOccurrences(turn.text, term.aliases)) {
                occurrences.push({
                    ...occurrence,
                    term,
                    termOrdinal,
                    validationCase,
                    turnIndex: turnOffset + 1,
                    role: turn.role
                });
                termOrdinal += 1;
            }
        }
    }
    return occurrences.sort(
        (left, right) =>
            left.turnIndex - right.turnIndex || left.start - right.start || right.alias.length - left.alias.length
    );
}

async function writeJson(filePath, value) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, await prettier.format(JSON.stringify(value), { ...config, filepath: filePath }));
}

function markdown(report) {
    const lines = [
        '# Revision 发音验证报告',
        '',
        `Revision：${report.revisionId}`,
        '',
        `结果：PASS ${report.summary.passCount}，FAIL ${report.summary.failCount}，REVIEW ${report.summary.reviewCount}。`,
        '',
        '| 事件 | Turn | 专用词 | 判定 | Detector | 审听片段 |',
        '| --- | ---: | --- | --- | --- | --- |'
    ];
    for (const result of report.results) {
        lines.push(
            `| ${result.eventId} | ${result.turnIndex} | ${result.term} | ${result.decision} | ${result.detector} | ${result.cropPath || '-'} |`
        );
    }
    return `${lines.join('\n')}\n`;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (!options.configPath) {
        fail('Usage: node scripts/audio/validate-revision-pronunciation.mjs <revision-config.json> [--fail-on-fail]');
    }
    const config = loadRevisionConfig(options.configPath);
    const { overlayPath } = revisionPaths(config);
    if (!fs.existsSync(overlayPath)) fail(`Missing ${relativeToRoot(overlayPath)}`);
    const overlay = readJson(overlayPath);
    const casesConfig = readJson(CASES_PATH);
    const calibrationProfile = readJson(path.join(ROOT, casesConfig.voiceProfilePath));
    const glossary = loadPronunciationGlossary().glossary;
    const termsById = new Map(glossary.entries.map((entry) => [entry.id, entry]));
    const casesByTerm = new Map(
        casesConfig.cases
            .filter((item) => item.automaticValidation)
            .map((item) => [`${item.termId}:${item.locale}`, item])
    );
    const results = [];

    for (const asset of overlay.assets) {
        const replacements = asset.pronunciation?.replacements || [];
        const replacementByOccurrence = new Map(
            replacements.map((replacement) => [
                occurrenceKey(replacement.termId, replacement.turnIndex, replacement.start),
                replacement
            ])
        );
        const occurrences = validationOccurrences(asset, casesByTerm, termsById);
        if (!occurrences.length) continue;
        const audioPath = path.join(ROOT, asset.audio.path);
        const idPrefix = `${overlay.revisionId}-${asset.sequenceIndex}-${asset.eventId}-${asset.locale}`;
        const transcription = transcribe({ id: idPrefix, audioPath }, asset.locale);
        const tokens = transcriptTokens(transcription.transcript);
        const rangesByTerm = new Map();
        const usedRanges = [];

        for (const occurrence of occurrences) {
            const { term, termOrdinal, turnIndex, role, start, validationCase } = occurrence;
            const replacement = replacementByOccurrence.get(occurrenceKey(term.id, turnIndex, start));
            if (!rangesByTerm.has(term.id)) {
                rangesByTerm.set(term.id, locateRanges(tokens, validationCase.alignmentAliases || term.aliases));
            }
            const candidates = rangesByTerm.get(term.id);
            let candidateIndex = termOrdinal;
            while (
                candidates[candidateIndex] &&
                usedRanges.some((range) => overlaps(range, candidates[candidateIndex]))
            ) {
                candidateIndex += 1;
            }
            const located = candidates[candidateIndex];
            const resultBase = {
                id: `${idPrefix}-${term.id}-turn-${turnIndex}-${start}`,
                eventId: asset.eventId,
                locale: asset.locale,
                turnIndex,
                termId: term.id,
                term: term.term,
                sourceOrdinal: termOrdinal,
                replacementApplied: Boolean(replacement),
                audioPath: asset.audio.path,
                role
            };
            const expectedContext = {
                provider: casesConfig.provider.name,
                model: casesConfig.provider.model,
                locale: validationCase.locale,
                voice: voiceForRole(calibrationProfile, role)
            };
            const actualContext = {
                provider: replacement?.validation.provider || overlay.provider,
                model: replacement?.validation.model || overlay.model,
                locale: replacement?.validation.locale || asset.locale,
                voice: replacement?.validation.voice || voiceForRole(asset.voiceProfile, role)
            };
            if (!located) {
                results.push({
                    ...resultBase,
                    decision: 'REVIEW',
                    detector: 'alignment',
                    reason: 'target-audio-occurrence-not-found'
                });
                continue;
            }
            usedRanges.push(located);
            const selectedTokens = tokens.slice(located.start, located.end + 1);
            const startMs = selectedTokens[0]?.offsets.from;
            const endMs = selectedTokens.at(-1)?.offsets.to;
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
                results.push({
                    ...resultBase,
                    decision: 'REVIEW',
                    detector: 'alignment',
                    reason: 'invalid-target-range'
                });
                continue;
            }
            const cropped = crop({ id: resultBase.id, audioPath }, { startMs, endMs });
            const sample = {
                id: resultBase.id,
                audioPath,
                cropPath: cropped.outputPath,
                durationMs: cropped.durationMs,
                targetTokenText: selectedTokens.map((token) => token.text).join(''),
                alignment: located
            };
            const commonResult = {
                ...resultBase,
                startMs,
                endMs,
                durationMs: cropped.durationMs,
                targetTokenText: sample.targetTokenText,
                cropPath: relativeToRoot(cropped.outputPath),
                cropAbsolutePath: cropped.outputPath,
                transcriptPath: relativeToRoot(transcription.outputPath)
            };
            if (JSON.stringify(actualContext) !== JSON.stringify(expectedContext)) {
                results.push({
                    ...commonResult,
                    decision: 'REVIEW',
                    detector: 'context',
                    reason: 'detector-context-mismatch',
                    expectedContext,
                    actualContext
                });
                continue;
            }
            results.push({
                ...commonResult,
                ...classify(validationCase, sample)
            });
        }
    }

    const reviewItems = results.filter((item) => item.decision !== 'PASS');
    const summary = {
        sampleCount: results.length,
        passCount: results.filter((item) => item.decision === 'PASS').length,
        failCount: results.filter((item) => item.decision === 'FAIL').length,
        reviewCount: results.filter((item) => item.decision === 'REVIEW').length
    };
    const report = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        revisionId: overlay.revisionId,
        provider: overlay.provider,
        model: overlay.model,
        summary,
        results
    };
    const reportRoot = path.join(OUTPUT_ROOT, overlay.revisionId);
    const reportPath = path.join(reportRoot, 'report.json');
    const markdownPath = path.join(reportRoot, 'report.md');
    const reviewPath = path.join(reportRoot, 'review-manifest.json');
    await writeJson(reportPath, report);
    fs.writeFileSync(markdownPath, markdown(report));
    await writeJson(reviewPath, {
        schemaVersion: 1,
        generatedAt: report.generatedAt,
        revisionId: report.revisionId,
        reviewCount: reviewItems.length,
        items: reviewItems.map((item) => ({
            id: item.id,
            eventId: item.eventId,
            turnIndex: item.turnIndex,
            term: item.term,
            decision: item.decision,
            detector: item.detector,
            replacementApplied: item.replacementApplied,
            reason: item.reason,
            cropPath: item.cropPath,
            cropAbsolutePath: item.cropAbsolutePath,
            startMs: item.startMs,
            endMs: item.endMs
        }))
    });
    console.log(
        `Pronunciation validation: PASS ${summary.passCount}, FAIL ${summary.failCount}, REVIEW ${summary.reviewCount}.`
    );
    console.log(`Report: ${relativeToRoot(reportPath)}`);
    console.log(`Review manifest: ${relativeToRoot(reviewPath)}`);
    if (options.failOnFail && summary.failCount) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });
}
