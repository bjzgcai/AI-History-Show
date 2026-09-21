#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import { ROOT, readJson, relativeToRoot, resolveFromRoot } from './lib/audio-revision.mjs';
import { loadPronunciationGlossary, pronunciationInstructionSha256 } from './lib/pronunciation.mjs';

const CONFIG_PATH = path.join(ROOT, 'audio/pronunciation/qualification-cases.json');
const GENERATOR_PATH = path.join(ROOT, 'scripts/audio/generate-dialogue-audio.mjs');
const OUTPUT_ROOT = path.join(ROOT, '.tmp/pronunciation-qualification');

function fail(message) {
    throw new Error(message);
}

function parseArgs(argv) {
    const options = {
        generate: false,
        reuseExisting: false,
        envFile: process.env.TTS_ENV_FILE || '.secrets/tts.env',
        groupIds: []
    };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--generate') options.generate = true;
        else if (argument === '--reuse-existing') options.reuseExisting = true;
        else if (argument === '--env-file') {
            options.envFile = argv[index + 1];
            index += 1;
        } else if (argument === '--group') {
            options.groupIds.push(argv[index + 1]);
            index += 1;
        } else fail(`unknown option ${argument}`);
    }
    return options;
}

function roleLabel(role) {
    if (role === 'N' || role === 'NARRATOR') return 'N';
    return role;
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

function instructionForGroup(group, profile, role) {
    return group.instructionOverride || instructionForRole(profile, role);
}

function speedForRole(profile, role) {
    if (role === 'A') return profile.speedA;
    if (role === 'B') return profile.speedB;
    if (role === 'SUMMARY') return profile.speedSummary;
    return profile.speedNarrator;
}

function hasExactBoundary(text, start, alias) {
    const word = (value) => /[A-Za-z0-9]/u.test(value || '');
    return !word(text[start - 1]) && !word(text[start + alias.length]);
}

function replaceTerm(text, aliases, speechForm) {
    const sortedAliases = [...aliases].sort((left, right) => right.length - left.length);
    let cursor = 0;
    let output = '';
    let replacementCount = 0;
    for (let start = 0; start < text.length; start += 1) {
        const alias = sortedAliases.find(
            (candidate) => text.startsWith(candidate, start) && hasExactBoundary(text, start, candidate)
        );
        if (!alias) continue;
        output += text.slice(cursor, start) + speechForm;
        cursor = start + alias.length;
        replacementCount += 1;
        start += alias.length - 1;
    }
    return { text: output + text.slice(cursor), replacementCount };
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
            'format=duration,size:stream=codec_name,sample_rate,channels',
            '-of',
            'json',
            filePath
        ],
        { cwd: ROOT, encoding: 'utf8' }
    );
    if (result.error || result.status !== 0) fail(`ffprobe failed for ${filePath}`);
    const data = JSON.parse(result.stdout);
    return {
        durationSec: Number(Number(data.format.duration).toFixed(3)),
        sizeBytes: Number(data.format.size),
        codec: data.streams?.[0]?.codec_name,
        sampleRate: Number(data.streams?.[0]?.sample_rate),
        channels: Number(data.streams?.[0]?.channels)
    };
}

function runGenerator(sample, config, profile, envFile) {
    const instructionProfile = sample.instructionOverride
        ? {
              ...profile,
              instructionA: sample.instructionOverride,
              instructionB: sample.instructionOverride,
              instructionNarrator: sample.instructionOverride,
              instructionSummary: sample.instructionOverride
          }
        : profile;
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
        '--instruction-a',
        instructionProfile.instructionA,
        '--instruction-b',
        instructionProfile.instructionB,
        '--instruction-narrator',
        instructionProfile.instructionNarrator,
        '--instruction-summary',
        instructionProfile.instructionSummary,
        '--speed-a',
        String(profile.speedA),
        '--speed-b',
        String(profile.speedB),
        '--speed-narrator',
        String(profile.speedNarrator),
        '--speed-summary',
        String(profile.speedSummary),
        '--pause-ms',
        '0',
        '--summary-pause-ms',
        '0',
        '--seed',
        String(sample.seed),
        '--env-file',
        envFile
    ];
    const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) fail(`TTS generation failed for ${sample.id}`);
}

async function writeJson(filePath, value) {
    const prettierConfig = (await prettier.resolveConfig(filePath)) || {};
    fs.writeFileSync(filePath, await prettier.format(JSON.stringify(value), { ...prettierConfig, filepath: filePath }));
}

function markdown(manifest) {
    const lines = [
        '# 专用词发音资格审听包',
        '',
        '| Group | Sample | Context | Repeat | Role | Speech form | Audio | Result |',
        '| --- | --- | --- | ---: | --- | --- | --- | --- |'
    ];
    for (const sample of manifest.samples) {
        lines.push(
            `| ${sample.groupId} | ${sample.sampleMode === 'term' ? 'term' : 'context'} | ${sample.contextId} | ${sample.repeat} | ${sample.role} | ${sample.speechForm} | ${sample.audioAbsolutePath || '-'} | pending |`
        );
    }
    return `${lines.join('\n')}\n`;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const config = readJson(CONFIG_PATH);
    const profileCache = new Map();
    const profileForGroup = (group) => {
        const profilePath = group.voiceProfilePath || config.voiceProfilePath;
        if (!profilePath) fail(`${group.id}: voiceProfilePath is required`);
        if (!profileCache.has(profilePath)) profileCache.set(profilePath, readJson(resolveFromRoot(profilePath)));
        return profileCache.get(profilePath);
    };
    const glossary = loadPronunciationGlossary().glossary;
    const glossaryById = new Map(glossary.entries.map((entry) => [entry.id, entry]));
    const selectedGroups = new Set(options.groupIds);
    if (!Number.isInteger(config.baseSeed) || config.baseSeed < 0) fail('baseSeed must be a non-negative integer');
    if (!config.provider?.name || !config.provider?.model || !config.provider?.endpoint) {
        fail('qualification provider needs name, model, and endpoint');
    }
    const groupIds = new Set();
    for (const group of config.groups) {
        if (!group.id || groupIds.has(group.id)) fail(`duplicate or missing qualification group id: ${group.id}`);
        groupIds.add(group.id);
        if (!group.qualificationId || !group.termId || !group.locale || !group.speechForm) {
            fail(`${group.id}: missing qualification tuple field`);
        }
        if (group.reviewStatus !== 'pending-human-review')
            fail(`${group.id}: reviewStatus must be pending-human-review`);
        profileForGroup(group);
        if (!Array.isArray(group.contexts) || !group.contexts.length) fail(`${group.id}: contexts are empty`);
        const contextIds = new Set();
        for (const context of group.contexts) {
            if (!context.id || contextIds.has(context.id)) fail(`${group.id}: duplicate or missing context id`);
            contextIds.add(context.id);
            if (!context.turnPath || !Number.isInteger(context.turnIndex) || context.turnIndex < 1) {
                fail(`${group.id}/${context.id}: invalid turn source`);
            }
            if (!Number.isInteger(context.repeatCount) || context.repeatCount < 2) {
                fail(`${group.id}/${context.id}: repeatCount must be at least 2`);
            }
        }
    }
    for (const groupId of selectedGroups) {
        if (!config.groups.some((group) => group.id === groupId)) fail(`unknown qualification group ${groupId}`);
    }
    const envFile = resolveFromRoot(options.envFile);
    if (options.generate && !fs.existsSync(envFile)) fail(`missing TTS environment file: ${envFile}`);
    fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
    const samples = [];
    const tupleByGroupId = new Map();

    for (const group of config.groups) {
        if (selectedGroups.size && !selectedGroups.has(group.id)) continue;
        const profile = profileForGroup(group);
        const term = glossaryById.get(group.termId);
        if (!term) fail(`${group.id}: unknown glossary term ${group.termId}`);
        for (const [contextIndex, context] of group.contexts.entries()) {
            const source = readJson(resolveFromRoot(context.turnPath));
            if (source.locale !== group.locale) fail(`${group.id}/${context.id}: source locale does not match group`);
            const turn = source.turns[context.turnIndex - 1];
            if (!turn) fail(`${group.id}/${context.id}: missing turn ${context.turnIndex}`);
            const rewritten = replaceTerm(turn.text, term.aliases, group.speechForm);
            if (!rewritten.replacementCount) fail(`${group.id}/${context.id}: term not found in selected turn`);
            const instruction = instructionForGroup(group, profile, turn.role);
            const tuple = {
                voice: voiceForRole(profile, turn.role),
                instructionSha256: pronunciationInstructionSha256(instruction)
            };
            if (
                tupleByGroupId.has(group.id) &&
                JSON.stringify(tupleByGroupId.get(group.id)) !== JSON.stringify(tuple)
            ) {
                fail(`${group.id}: all contexts must use the same voice and instruction`);
            }
            tupleByGroupId.set(group.id, tuple);
            const groupRoot = path.join(OUTPUT_ROOT, group.id);
            fs.mkdirSync(groupRoot, { recursive: true });
            for (let repeat = 1; repeat <= context.repeatCount; repeat += 1) {
                const sampleModes = contextIndex === 0 ? ['term', 'context'] : ['context'];
                for (const sampleMode of sampleModes) {
                    const id =
                        sampleMode === 'term'
                            ? `${group.id}-${context.id}-term-repeat-${repeat}`
                            : `${group.id}-${context.id}-repeat-${repeat}`;
                    const fileStem =
                        sampleMode === 'term'
                            ? `${context.id}-term-repeat-${repeat}`
                            : `${context.id}-repeat-${repeat}`;
                    const inputPath = path.join(groupRoot, `${fileStem}.txt`);
                    const outputPath = path.join(groupRoot, `${fileStem}.mp3`);
                    const speechText = sampleMode === 'term' ? group.speechForm : rewritten.text;
                    fs.writeFileSync(inputPath, `${roleLabel(turn.role)}: ${speechText}\n`);
                    const sample = {
                        id,
                        groupId: group.id,
                        contextId: context.id,
                        sampleMode,
                        repeat,
                        termId: term.id,
                        term: term.term,
                        targetReading: term.reading.spoken,
                        speechForm: group.speechForm,
                        provider: config.provider.name,
                        model: config.provider.model,
                        locale: group.locale,
                        voice: voiceForRole(profile, turn.role),
                        instructionSha256: pronunciationInstructionSha256(instruction),
                        role: turn.role,
                        speed: speedForRole(profile, turn.role),
                        seed: config.baseSeed + samples.length,
                        sourcePath: context.turnPath,
                        turnIndex: context.turnIndex,
                        sourceText: turn.text,
                        sourceTextSha256: sha256(turn.text),
                        speechText,
                        instructionOverride: group.instructionOverride || null,
                        speechTextSha256: sha256(speechText),
                        inputPath,
                        outputPath
                    };
                    if (options.generate) {
                        if (fs.existsSync(outputPath)) {
                            if (!options.reuseExisting) {
                                fail(`refusing to overwrite qualification sample: ${outputPath}`);
                            }
                            probeAudio(outputPath);
                        } else {
                            runGenerator(sample, config, profile, envFile);
                        }
                    }
                    samples.push(sample);
                }
            }
        }
    }

    const manifest = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        mode: options.generate ? 'generated' : 'prepared',
        provider: config.provider,
        voiceProfilePath: config.voiceProfilePath,
        qualificationGroups: config.groups
            .filter((group) => !selectedGroups.size || selectedGroups.has(group.id))
            .map((group) => {
                const term = glossaryById.get(group.termId);
                const tuple = tupleByGroupId.get(group.id);
                const qualificationTuple = {
                    termId: term.id,
                    term: term.term,
                    speechForm: group.speechForm,
                    provider: config.provider.name,
                    model: config.provider.model,
                    locale: group.locale,
                    voice: tuple.voice,
                    instructionSha256: tuple.instructionSha256
                };
                const existingQualification = (term.ttsQualifications || []).find(
                    (qualification) => qualification.qualificationId === group.qualificationId
                );
                if (existingQualification) {
                    const existingTuple = {
                        termId: term.id,
                        term: term.term,
                        speechForm: existingQualification.speechForm,
                        provider: existingQualification.provider,
                        model: existingQualification.model,
                        locale: existingQualification.locale,
                        voice: existingQualification.voice,
                        instructionSha256: existingQualification.instructionSha256
                    };
                    if (JSON.stringify(existingTuple) !== JSON.stringify(qualificationTuple)) {
                        fail(`${group.id}: existing qualification tuple does not match the review group`);
                    }
                }
                return {
                    id: group.id,
                    qualificationId: group.qualificationId,
                    voiceProfilePath: group.voiceProfilePath || config.voiceProfilePath,
                    reviewAction: existingQualification ? 'update-evidence' : 'create-qualification',
                    reviewStatus: group.reviewStatus,
                    tuple: qualificationTuple
                };
            }),
        samples: samples.map((sample) => ({
            ...sample,
            inputPath: relativeToRoot(sample.inputPath),
            outputPath: relativeToRoot(sample.outputPath),
            ...(fs.existsSync(sample.outputPath)
                ? { audioAbsolutePath: sample.outputPath, audio: probeAudio(sample.outputPath) }
                : {})
        }))
    };
    const manifestPath = path.join(OUTPUT_ROOT, 'manifest.json');
    const reviewPath = path.join(OUTPUT_ROOT, 'REVIEW.md');
    await writeJson(manifestPath, manifest);
    fs.writeFileSync(reviewPath, markdown(manifest));
    console.log(`Prepared ${samples.length} qualification samples.`);
    console.log(`Manifest: ${relativeToRoot(manifestPath)}`);
    console.log(`Review sheet: ${relativeToRoot(reviewPath)}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
