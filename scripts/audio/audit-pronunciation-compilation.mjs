#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import prettier from 'prettier';
import {
    ROOT,
    entryOverrideFor,
    readJson,
    relativeToRoot,
    resolveFromRoot,
    resolveVoiceProfile
} from './lib/audio-revision.mjs';
import { compileSpeechTurns, loadPronunciationGlossary } from './lib/pronunciation.mjs';

const AUDIO_REVISIONS_ROOT = path.join(ROOT, 'audio/revisions');
const OUTPUT_PATH = path.join(ROOT, '.tmp/pronunciation-compilation-audit.json');

function listTurnFiles(directory) {
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...listTurnFiles(filePath));
        else if (/turns[\/](?:zh|en)[\/].+\.json$/u.test(filePath)) files.push(filePath);
    }
    return files.sort();
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

function loadRevisionContexts() {
    return fs
        .readdirSync(AUDIO_REVISIONS_ROOT)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .map((fileName) => {
            const configPath = path.join(AUDIO_REVISIONS_ROOT, fileName);
            const config = readJson(configPath);
            return {
                revisionId: config.revisionId,
                configPath,
                turnsRoot: resolveFromRoot(config.turnsDir),
                provider: config.provider.name,
                model: config.provider.model,
                voiceProfilePath: config.voiceProfilePath,
                voiceProfile: readJson(resolveFromRoot(config.voiceProfilePath)),
                entryOverrides: config.entryOverrides || {},
                eventIds: config.eventIds || null
            };
        });
}

async function main() {
    const glossaryBundle = loadPronunciationGlossary();
    const files = [];
    const termCounts = new Map();
    const sourceSignatures = new Set();
    const generationSignatures = new Set();
    let scannedTurnFileCount = 0;
    let duplicateGenerationContextCount = 0;
    for (const revision of loadRevisionContexts()) {
        for (const filePath of listTurnFiles(revision.turnsRoot)) {
            const data = readJson(filePath);
            if (revision.eventIds && !revision.eventIds.includes(data.eventId)) continue;
            scannedTurnFileCount += 1;
            const locale = data.locale || (/turns[\/]en[\/]/u.test(filePath) ? 'en' : 'zh');
            const sourceIdentity = {
                eventId: data.eventId,
                locale,
                mode: data.mode || 'storyline',
                turns: data.turns
            };
            const voiceProfile = resolveVoiceProfile(
                revision.voiceProfile,
                entryOverrideFor(revision, { eventId: data.eventId, locale })
            );
            const sourceSignature = crypto.createHash('sha256').update(JSON.stringify(sourceIdentity)).digest('hex');
            sourceSignatures.add(sourceSignature);
            const generationSignature = crypto
                .createHash('sha256')
                .update(
                    JSON.stringify({
                        sourceSignature,
                        provider: revision.provider,
                        model: revision.model,
                        voiceProfile
                    })
                )
                .digest('hex');
            if (generationSignatures.has(generationSignature)) {
                duplicateGenerationContextCount += 1;
                continue;
            }
            generationSignatures.add(generationSignature);
            const compiled = compileSpeechTurns({
                turns: data.turns,
                eventId: data.eventId,
                locale,
                provider: revision.provider,
                model: revision.model,
                voiceForRole: (role) => voiceForRole(voiceProfile, role),
                instructionForRole: (role) => instructionForRole(voiceProfile, role),
                glossaryBundle
            });
            if (!compiled.replacements.length && !compiled.unqualified.length && !compiled.exclusions.length) continue;
            for (const [status, items] of [
                ['applied', compiled.replacements],
                ['unqualified', compiled.unqualified],
                ['excluded', compiled.exclusions]
            ]) {
                for (const item of items) {
                    if (!termCounts.has(item.termId)) {
                        termCounts.set(item.termId, { applied: 0, unqualified: 0, excluded: 0 });
                    }
                    termCounts.get(item.termId)[status] += 1;
                }
            }
            files.push({
                path: relativeToRoot(filePath),
                revisionId: revision.revisionId,
                configPath: relativeToRoot(revision.configPath),
                voiceProfilePath: revision.voiceProfilePath,
                provider: revision.provider,
                model: revision.model,
                eventId: data.eventId,
                locale,
                replacementCount: compiled.replacements.length,
                unqualifiedCount: compiled.unqualified.length,
                exclusionCount: compiled.exclusions.length,
                replacements: compiled.replacements,
                unqualified: compiled.unqualified,
                exclusions: compiled.exclusions
            });
        }
    }
    const appliedCount = files.reduce((sum, file) => sum + file.replacementCount, 0);
    const unqualifiedCount = files.reduce((sum, file) => sum + file.unqualifiedCount, 0);
    const exclusionCount = files.reduce((sum, file) => sum + file.exclusionCount, 0);
    const report = {
        schemaVersion: 1,
        status: unqualifiedCount ? 'unqualified-contexts' : 'qualified',
        glossaryPath: relativeToRoot(glossaryBundle.path),
        glossarySha256: glossaryBundle.hash,
        scannedTurnFileCount,
        uniqueTurnSourceCount: sourceSignatures.size,
        uniqueGenerationContextCount: generationSignatures.size,
        duplicateGenerationContextCount,
        compiledTurnFileCount: files.length,
        appliedCount,
        unqualifiedCount,
        exclusionCount,
        terms: [...termCounts.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([termId, counts]) => ({ termId, ...counts })),
        files
    };
    const config = (await prettier.resolveConfig(OUTPUT_PATH)) || {};
    fs.writeFileSync(OUTPUT_PATH, await prettier.format(JSON.stringify(report), { ...config, filepath: OUTPUT_PATH }));
    console.log(
        `Pronunciation qualification audit: ${appliedCount} applied, ${unqualifiedCount} unqualified, ${exclusionCount} excluded in ${report.compiledTurnFileCount}/${report.scannedTurnFileCount} turn files.`
    );
    console.log(`Report: ${relativeToRoot(OUTPUT_PATH)}`);
    if (process.argv.includes('--check') && unqualifiedCount) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
