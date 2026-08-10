#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generationActions } from './audio/audio-pipeline.mjs';
import { buildOverlayOnlyEvent, loadStorylineEntries } from './audio/build-audio-review-page-data.mjs';
import { writeFrozenJson } from './audio/build-complete-original-revisions.mjs';

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
