#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generationActions } from './audio/audio-pipeline.mjs';
import {
    buildOverlayOnlyEvent,
    expandSharedStorylineOverlays,
    loadStorylineEntries
} from './audio/build-audio-review-page-data.mjs';
import { writeFrozenJson } from './audio/build-complete-original-revisions.mjs';
import { resolvePresentationAuthority } from './audio/build-audio-editorial-plan.mjs';
import { buildWorkflowReport } from './audio/check-audio-workflow-status.mjs';
import {
    ROOT,
    entryOverrideFor,
    formatCommandFailure,
    resolveTtsEnvFile,
    resolveVoiceProfile
} from './audio/lib/audio-revision.mjs';
import { compileSpeechTurns, pronunciationInstructionSha256 } from './audio/lib/pronunciation.mjs';
import { classify, locateRanges } from './audio/score-pronunciation-validation.mjs';
import { sourceOrdinal } from './audio/validate-revision-pronunciation.mjs';

assert.equal(resolveTtsEnvFile('.secrets/tts.env', {}), path.join(ROOT, '.secrets/tts.env'));
assert.equal(
    resolveTtsEnvFile('.secrets/tts.env', { TTS_ENV_FILE: '/tmp/ai-history-tts.env' }),
    '/tmp/ai-history-tts.env'
);
assert.equal(resolveTtsEnvFile('.secrets/tts.env', { TTS_ENV_FILE: '  ' }), path.join(ROOT, '.secrets/tts.env'));
const overlapAuthority = resolvePresentationAuthority({
    scopeId: 'gaming-ai',
    entry: { eventId: '2016-alphago', variant: 'gaming-custom' },
    ai100MemberSet: new Set(['2016-alphago']),
    ai100EntryById: new Map([['2016-alphago', { eventId: '2016-alphago', variant: 'ai100-custom' }]])
});
assert.deepEqual(overlapAuthority, {
    overlapsAi100: true,
    styleAuthority: 'bench-council-ai100',
    effectiveVariantId: 'ai100-custom',
    presentationRef: { eventId: '2016-alphago', variant: 'ai100-custom' }
});
assert.deepEqual(
    resolvePresentationAuthority({
        scopeId: 'gaming-ai',
        entry: { eventId: '2016-alphago', variant: 'gaming-custom' },
        ai100MemberSet: new Set(['2016-alphago']),
        ai100EntryById: new Map()
    }),
    {
        overlapsAi100: true,
        styleAuthority: 'bench-council-ai100',
        effectiveVariantId: 'bench-council-ai100',
        presentationRef: { eventId: '2016-alphago' }
    }
);
assert.equal(
    formatCommandFailure('ffprobe', {
        error: Object.assign(new Error('spawn ffprobe ENOENT'), { code: 'ENOENT' }),
        status: null
    }),
    'ffprobe not found in PATH'
);
assert.match(
    formatCommandFailure('ffprobe', { status: 1, stderr: 'Invalid data found', stdout: '' }, 'bad.mp3'),
    /ffprobe failed for bad\.mp3 \(exit 1\): Invalid data found/
);

const zhVoiceProfile = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio/voices/zh-huopo-original.json'), 'utf8'));
const pronunciationVoiceForRole = (role) => {
    if (role === 'A') return zhVoiceProfile.voiceA;
    if (role === 'B') return zhVoiceProfile.voiceB;
    if (role === 'SUMMARY') return zhVoiceProfile.voiceSummary;
    return zhVoiceProfile.voiceNarrator;
};
const pronunciationInstructionForRole = (role) => {
    if (role === 'A') return zhVoiceProfile.instructionA;
    if (role === 'B') return zhVoiceProfile.instructionB;
    if (role === 'SUMMARY') return zhVoiceProfile.instructionSummary;
    return zhVoiceProfile.instructionNarrator;
};
const pronunciationContext = {
    locale: 'zh',
    provider: 'volc',
    model: 'seed-tts-2.0',
    voiceForRole: pronunciationVoiceForRole,
    instructionForRole: pronunciationInstructionForRole
};
assert.equal(
    pronunciationInstructionSha256(zhVoiceProfile.instructionB),
    '7864fbdc8b056092594f2170a8addd7d497808059a8b84a57caa3384e9533105'
);
const compiledPronunciation = compileSpeechTurns({
    ...pronunciationContext,
    eventId: 'ai100-2017-mask-r-cnn',
    turns: [{ role: 'B', text: 'RoIAlign 避免 RoI 池化，SURF 保持展示拼写。' }]
});
assert.equal(compiledPronunciation.turns[0].text, 'R-O-I align 避免 R-O-I 池化，surf 保持展示拼写。');
assert.deepEqual(
    compiledPronunciation.replacements.map((item) => item.termId),
    ['roialign', 'roi', 'surf']
);
assert.deepEqual(compiledPronunciation.unqualified, []);
assert.equal(compiledPronunciation.exclusions.length, 0);
assert.equal(compiledPronunciation.replacements[0].qualification.id, 'roialign-volc-seed-tts-2-zh-huopo-b-v1');
assert.equal(compiledPronunciation.glossarySha256.length, 64);
const excludedPronunciation = compileSpeechTurns({
    ...pronunciationContext,
    eventId: '1980-xcon-r1',
    turns: Array.from({ length: 5 }, (_, index) => ({ role: 'N', text: index === 4 ? 'XCON/R1' : '无' }))
});
assert.equal(excludedPronunciation.turns[4].text, 'XCON/R1');
assert.equal(excludedPronunciation.replacements.length, 0);
assert.equal(excludedPronunciation.unqualified.length, 0);
assert.equal(excludedPronunciation.exclusions.length, 1);
const xconReleaseConfig = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'audio/revisions/issue-98-pronunciation-release-zh.json'), 'utf8')
);
const xconReleaseProfile = resolveVoiceProfile(
    zhVoiceProfile,
    entryOverrideFor(xconReleaseConfig, { eventId: '1980-xcon-r1', locale: 'zh' })
);
const xconReleasePronunciation = compileSpeechTurns({
    ...pronunciationContext,
    eventId: '1980-xcon-r1',
    turns: Array.from({ length: 5 }, (_, index) => ({ role: 'N', text: index === 4 ? 'XCON/R1' : '无' })),
    voiceForRole: (role) =>
        role === 'A'
            ? xconReleaseProfile.voiceA
            : role === 'B'
              ? xconReleaseProfile.voiceB
              : xconReleaseProfile.voiceNarrator,
    instructionForRole: (role) =>
        role === 'A'
            ? xconReleaseProfile.instructionA
            : role === 'B'
              ? xconReleaseProfile.instructionB
              : xconReleaseProfile.instructionNarrator
});
assert.equal(xconReleasePronunciation.turns[4].text, 'ex-con/R1');
assert.equal(xconReleasePronunciation.replacements[0].qualification.id, 'xcon-volc-seed-tts-2-zh-huopo-narrator-v2');
assert.equal(xconReleasePronunciation.exclusions.length, 0);
assert.equal(
    compileSpeechTurns({
        ...pronunciationContext,
        eventId: 'other-event',
        turns: [{ role: 'N', text: 'XCON XCONSOLE' }]
    }).turns[0].text,
    'ex-con XCONSOLE'
);
for (const mismatch of [
    { provider: 'different-provider' },
    { model: 'different-model' },
    { locale: 'en' },
    { voiceForRole: () => 'different-voice' },
    { instructionForRole: () => 'different-instruction' }
]) {
    const result = compileSpeechTurns({
        ...pronunciationContext,
        ...mismatch,
        eventId: 'other-event',
        turns: [{ role: 'N', text: 'NAS' }]
    });
    assert.equal(result.turns[0].text, 'NAS');
    assert.equal(result.replacements.length, 0);
    assert.equal(result.unqualified.length, 1);
}
assert.throws(
    () =>
        compileSpeechTurns({
            ...pronunciationContext,
            eventId: 'ambiguous-event',
            turns: [{ role: 'B', text: 'SURF' }],
            glossaryBundle: {
                path: path.join(ROOT, 'audio/pronunciation/glossary.json'),
                hash: 'test-glossary-hash',
                glossary: {
                    entries: [
                        {
                            id: 'surf',
                            term: 'SURF',
                            aliases: ['SURF'],
                            ttsQualifications: ['surf', 'serf'].map((speechForm, index) => ({
                                qualificationId: `ambiguous-${index}`,
                                status: 'human-reviewed-pass',
                                reviewedAt: '2026-08-14',
                                provider: pronunciationContext.provider,
                                model: pronunciationContext.model,
                                locale: pronunciationContext.locale,
                                voice: pronunciationVoiceForRole('B'),
                                instructionSha256: pronunciationInstructionSha256(pronunciationInstructionForRole('B')),
                                method: 'speech-replacement',
                                speechForm,
                                sampleIds: [`sample-${index}`]
                            }))
                        }
                    ]
                }
            }
        }),
    /multiple active pronunciation qualifications/
);
assert.deepEqual(
    locateRanges([{ text: ' X' }, { text: 'CON' }, { text: ' then' }, { text: ' XKAN' }], ['XCON', 'XKAN']).map(
        ({ start, end }) => ({ start, end })
    ),
    [
        { start: 0, end: 1 },
        { start: 3, end: 3 }
    ]
);
assert.deepEqual(
    locateRanges([{ text: '专家通常把' }, { text: ' NAS' }], ['NAS']).map(({ start, end }) => ({ start, end })),
    [{ start: 1, end: 1 }]
);
assert.equal(
    classify({ automaticValidation: { detector: 'duration', passMaxMs: 650, failMinMs: 800 } }, { durationMs: 410 })
        .decision,
    'PASS'
);
assert.equal(
    classify(
        { automaticValidation: { detector: 'token-form', passPrefixes: ['roi'], failPrefixes: ['roy'] } },
        { targetTokenText: 'Royalign' }
    ).decision,
    'FAIL'
);
assert.deepEqual(
    classify(
        { automaticValidation: { detector: 'review-only', reason: 'insufficient-signal' } },
        { targetTokenText: 'XCON' }
    ),
    { decision: 'REVIEW', detector: 'review-only', reason: 'insufficient-signal' }
);
assert.equal(sourceOrdinal([{ text: 'XCON 与 XCON' }, { text: 'XCON' }], { turnIndex: 1, start: 7 }, ['XCON']), 1);

assert.deepEqual(generationActions({ planExists: false, overlayExists: false }), ['build', 'generate', 'validate']);
assert.deepEqual(generationActions({ planExists: true, overlayExists: false }), [
    'build-check',
    'generate',
    'validate'
]);
assert.deepEqual(generationActions({ planExists: true, overlayExists: true }), ['build-check', 'validate']);

const storylines = await loadStorylineEntries();
for (const storylineId of ['bench-council-ai100', 'gaming-ai', 'deep-learning', 'humanistic-cycle']) {
    assert(storylines.has(storylineId), `Expected review tooling to load ${storylineId}`);
    assert(storylines.get(storylineId).length > 0, `Expected ${storylineId} to contain enabled events`);
}

const overlayCandidate = (locale) => ({
    eventId: '1956-dartmouth',
    locale,
    mode: 'storyline',
    revisionId: `test-deep-learning-${locale}`,
    status: 'candidate-listening-review',
    comparisonKind: 'previous',
    comparisonLabel: 'Test original',
    audio: { path: `test-${locale}.mp3`, durationSec: 60 },
    quality: { passed: true },
    turns: [],
    voiceProfile: {}
});
const overlayOnlyEvent = await buildOverlayOnlyEvent({
    scopeId: 'deep-learning',
    sequenceIndex: 1,
    overlays: new Map([
        ['deep-learning:1:zh:storyline', [overlayCandidate('zh')]],
        ['deep-learning:1:en:storyline', [overlayCandidate('en')]]
    ]),
    storylineEntries: storylines
});
assert.equal(overlayOnlyEvent.eventId, '1956-dartmouth');
assert.equal(overlayOnlyEvent.scopeId, 'deep-learning');
assert.equal(overlayOnlyEvent.variants.zh.storyline.audio.path, 'test-zh.mp3');
assert.equal(overlayOnlyEvent.variants.en.storyline.audio.path, 'test-en.mp3');

const singleLocaleEvent = await buildOverlayOnlyEvent({
    scopeId: 'deep-learning',
    sequenceIndex: 1,
    overlays: new Map([['deep-learning:1:zh:storyline', [overlayCandidate('zh')]]]),
    storylineEntries: storylines
});
assert.deepEqual(Object.keys(singleLocaleEvent.variants), ['zh']);
assert.equal(singleLocaleEvent.variants.zh.storyline.audio.path, 'test-zh.mp3');

const perceptronSourcePath =
    'resources/audio/generated/ai100-and-gaming-original-v1/ai100-remaining-storyline-zh-original-v1-2026-08-09/audio/bench-council-ai100/storyline/zh/39-1957-perceptron.mp3';
const sharedPerceptronCandidate = {
    ...overlayCandidate('zh'),
    scopeId: 'bench-council-ai100',
    sequenceIndex: 39,
    eventId: '1957-perceptron',
    revisionId: 'test-ai100-perceptron-zh',
    audio: { path: perceptronSourcePath, durationSec: 60 }
};
const deepActivationCandidate = {
    ...overlayCandidate('zh'),
    scopeId: 'deep-learning',
    sequenceIndex: 1
};
const expanded = await expandSharedStorylineOverlays({
    overlays: new Map([
        ['bench-council-ai100:39:zh:storyline', [sharedPerceptronCandidate]],
        ['deep-learning:1:zh:storyline', [deepActivationCandidate]]
    ]),
    storylineEntries: storylines
});
const reusedPerceptron = expanded.overlays.get('deep-learning:2:zh:storyline');
assert.equal(reusedPerceptron.length, 1);
assert.equal(reusedPerceptron[0].audio.path, perceptronSourcePath);
assert.deepEqual(reusedPerceptron[0].reviewReuse, {
    sourceScopeId: 'bench-council-ai100',
    sourceSequenceIndex: 39,
    targetScopeId: 'deep-learning',
    targetSequenceIndex: 2
});
const deepPerceptronEvent = await buildOverlayOnlyEvent({
    scopeId: 'deep-learning',
    sequenceIndex: 2,
    overlays: expanded.overlays,
    storylineEntries: storylines
});
assert.equal(deepPerceptronEvent.eventId, '1957-perceptron');
assert.equal(deepPerceptronEvent.variantId, 'deep-learning');
assert.equal(deepPerceptronEvent.audioReuse.sourceScopeId, 'bench-council-ai100');

const reviewBuilderPath = path.join(import.meta.dirname, 'audio/build-audio-review-page-data.mjs');
const pipelinePath = path.join(import.meta.dirname, 'audio/audio-pipeline.mjs');
const reviewConsoleRoot = path.resolve(import.meta.dirname, '../tools/audio-review-console');
const reviewBuilderSource = fs.readFileSync(reviewBuilderPath, 'utf8');
const pipelineSource = fs.readFileSync(pipelinePath, 'utf8');
for (const retiredPath of [
    'designs/audio-review-console',
    'resources/audio/scripts/ai100-first-40-and-gaming',
    'resources/audio/generated/ai100-first-40-and-gaming'
]) {
    assert(!reviewBuilderSource.includes(retiredPath), `Review builder still references ${retiredPath}`);
    assert(!pipelineSource.includes(retiredPath), `Audio pipeline still references ${retiredPath}`);
}
assert(
    pipelineSource.includes('configPath: relativeToRoot(config.configPath)'),
    'Active overlay descriptors must retain their tracked revision config path'
);
for (const fileName of ['index.html', 'styles.css', 'app.js']) {
    assert(fs.existsSync(path.join(reviewConsoleRoot, fileName)), `Missing review console source ${fileName}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../package.json'), 'utf8'));
for (const command of ['audio:workflow', 'audio:status', 'audio:review', 'audio:release']) {
    assert(packageJson.scripts[command], `Missing stable package command ${command}`);
}
for (const command of [
    'audio:pronunciation:qualification-pack',
    'audio:pronunciation:diagnostic:prepare',
    'audio:pronunciation:diagnostic:generate',
    'audio:pronunciation:diagnostic:score',
    'audio:pronunciation:diagnostic:revision'
]) {
    assert(packageJson.scripts[command], `Missing pronunciation command ${command}`);
}
for (const retiredCommand of [
    'audio:pronunciation:validate',
    'audio:pronunciation:validate-revision',
    'audio:pronunciation:prepare-validator'
]) {
    assert(!packageJson.scripts[retiredCommand], `Formal acoustic command ${retiredCommand} must stay removed`);
}
assert(!pipelineSource.includes('pronunciation-validate'), 'Acoustic diagnostics must not be part of audio:workflow');
for (const retiredCommand of ['audio:plan:build', 'audio:base:generate', 'audio:push', 'audio:publish']) {
    assert(!packageJson.scripts[retiredCommand], `Retired package command ${retiredCommand} must stay removed`);
}
assert(
    !packageJson.scripts['migrate:figure-references'],
    'Retired writable figure migration command must stay removed'
);

const workflowReport = await buildWorkflowReport();
const enabledStorylineEntries = [...storylines.values()].flat();
assert.deepEqual(workflowReport.errors, []);
assert.equal(workflowReport.source.configCount, 23);
assert.equal(workflowReport.source.validConfigCount, 23);
assert.equal(workflowReport.source.turnCount, 611);
assert.deepEqual(workflowReport.source.untrackedFiles, []);
assert.equal(workflowReport.archive.storylineEntryCount, enabledStorylineEntries.length);
assert.equal(
    workflowReport.archive.uniqueEventCount,
    new Set(enabledStorylineEntries.map((entry) => entry.eventId)).size
);
assert.equal(
    workflowReport.archive.releaseObjectCount,
    workflowReport.archive.referencedAudioAssetCount + workflowReport.archive.unreferencedAudioAssetCount
);
assert(workflowReport.archive.referencedAudioAssetCount > 0);
assert.equal(workflowReport.archive.unreferencedAudioAssetCount, 10);
assert.deepEqual(workflowReport.archive.missingAudio, []);
assert.deepEqual(workflowReport.archive.deliveryErrors, []);

const frozenRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-frozen-turn-'));
try {
    const frozenPath = path.join(frozenRoot, 'turn.json');
    assert.equal(await writeFrozenJson(frozenPath, { revisionId: 'test', turns: [] }), true);
    assert.equal(await writeFrozenJson(frozenPath, { revisionId: 'test', turns: [] }), false);
    await assert.rejects(
        writeFrozenJson(frozenPath, { revisionId: 'test', turns: [{ role: 'N', text: 'changed' }] }),
        /Refusing to overwrite frozen revision turn file/
    );
} finally {
    fs.rmSync(frozenRoot, { recursive: true, force: true });
}

console.log(`Audio tooling checks passed for ${storylines.size} storylines.`);
