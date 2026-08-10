#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageJson = require('../package.json');
const { archiveStorylines, milestones } = require('../milestones-data.js');
const sourcePurposeTaxonomy = require('../archive/taxonomies/source-purposes.json');
const sourceSchema = require('../archive/schemas/source.schema.json');
const sourceTypeTaxonomy = require('../archive/taxonomies/source-types.json');
const { compileArchive, resolveAudioUrl } = require('./archive-compiler.js');
const { generateArchiveData, normalizeGeneratedTime, writeOutputsAtomically } = require('./generate-archive-data.js');

function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'archive-authority-'));
}

function silentLogger() {
    return { log() {}, warn() {}, error() {} };
}

function successfulPreview() {
    return {
        milestones: [{ id: 'milestone-test', title: { zh: '测试', en: 'Test' } }],
        errors: [],
        counts: { storylines: 1, milestones: 1, errors: 0 }
    };
}

assert.equal(
    packageJson.scripts.generate.split(' && ')[0],
    'node scripts/generate-archive-data.js',
    'the default generator must use Archive data'
);
assert.match(
    packageJson.scripts.generate,
    / && npm run generate:thumbnails$/,
    'the default generator must refresh the thumbnail manifest after Archive data'
);
const retiredScripts = [
    'generate:legacy',
    'generate:parity',
    'diff:parity',
    'review:parity',
    'serve:parity',
    'build:archive',
    'diff:archive',
    'review:archive',
    'preview:archive-data',
    'generate:archive-native-preview',
    'migrate:archive-presentation',
    'diff:archive-preview',
    'diff:archive-native',
    'diff:archive-legacy-main',
    'report:archive-native-fields',
    'audit:legacy-data',
    'migrate:ai100-batch',
    'migrate:archive',
    'map:archive-fusions'
];
for (const script of retiredScripts) {
    assert.equal(packageJson.scripts[script], undefined, `${script} must be retired`);
}

const retiredFiles = [
    'archive-parity-compare.html',
    'manage/archive-admin.html',
    'manage/catalog.js',
    'manage/events.js',
    'manage/event-fusions.js',
    'manage/generate.js',
    'scripts/archive-source-normalizer.js',
    'scripts/build-archive.js',
    'scripts/migrate-archive-events.js'
];
for (const retiredFile of retiredFiles) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', retiredFile)), false, `${retiredFile} must be removed`);
}
assert.equal(
    fs.existsSync(path.join(__dirname, '..', 'manage/admin.html')),
    true,
    'Archive admin page must use admin.html'
);
assert.deepEqual(
    new Set(sourceSchema.items.properties.type.enum),
    new Set(sourceTypeTaxonomy.map((entry) => entry.id)),
    'source schema type enum must match the managed taxonomy'
);
assert.deepEqual(
    new Set(sourceSchema.items.properties.purpose.enum),
    new Set(sourcePurposeTaxonomy.map((entry) => entry.id)),
    'source schema purpose enum must match the managed taxonomy'
);
console.log('PASS Legacy command and source files are retired');

const sourceClassificationCases = [
    ['2018-bert', 'source-google-ai-bert-blog-post', 'article', 'background'],
    ['2018-gpt', 'source-openai-language-unsupervised-page', 'article', 'background'],
    ['2020-alphafold', 'source-deepmind-alphafold-page', 'project-page', 'background'],
    ['ai100-2021-clip', 'source-openai-clip-blog-post', 'article', 'background'],
    ['ai100-2021-dalle', 'source-openai-dall-e-blog-post', 'article', 'background']
];
for (const [eventId, sourceId, expectedType, expectedPurpose] of sourceClassificationCases) {
    const sources = require(`../archive/events/${eventId}/sources.json`);
    const source = sources.find((entry) => entry.id === sourceId);
    assert.ok(source, `${eventId} must retain source ${sourceId}`);
    assert.equal(source.type, expectedType, `${eventId}/${sourceId} must keep its semantic source type`);
    assert.equal(source.purpose, expectedPurpose, `${eventId}/${sourceId} must keep its citation purpose`);
}
assert.equal(
    require('../archive/events/2018-gpt/sources.json').some(
        (source) => source.id === 'source-alec-radford-research-context'
    ),
    false,
    'the generic OpenAI research index must not be presented as Alec Radford biography evidence'
);

const ddpgSources = require('../archive/events/ai100-2015-ddpg/sources.json');
const ddpgAssets = require('../archive/events/ai100-2015-ddpg/assets.json');
const ddpgPortrait = ddpgAssets.find((asset) => asset.id === 'asset-ai100-2015-ddpg-timothy-lillicrap-1');
const ddpgPortraitSource = ddpgSources.find((source) => source.id === ddpgPortrait.sourceId);
assert.equal(ddpgPortraitSource.type, 'image-source');
assert.equal(ddpgPortraitSource.url, ddpgPortrait.rights.sourceUrl);
assert.match(ddpgPortrait.path, /-display\.png$/);
assert.ok(
    fs.statSync(path.join(__dirname, '..', ddpgPortrait.path)).size < 1024 * 1024,
    'the display portrait should stay below 1 MiB'
);
console.log('PASS normalized source display and portrait provenance checks');

const compilerSource = fs.readFileSync(path.join(__dirname, 'archive-compiler.js'), 'utf8');
for (const legacyInput of ['manage/event-fusions.js', 'manage/events.js', 'manage/catalog.js']) {
    assert.equal(compilerSource.includes(legacyInput), false, `production compiler must not read ${legacyInput}`);
}
for (const storylineFile of fs.readdirSync(path.join(__dirname, '..', 'archive', 'storylines'))) {
    if (!storylineFile.endsWith('.json')) continue;
    const storyline = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'archive', 'storylines', storylineFile), 'utf8')
    );
    for (const ref of storyline.events || []) {
        if (ref.enabled === false) continue;
        assert.match(ref.milestoneId, /^milestone-[a-z0-9][a-z0-9._-]*$/, `${storyline.id} ref must own its ID`);
    }
}
console.log('PASS production compiler uses Archive-owned milestone identities');

assert.equal(
    resolveAudioUrl({
        path: 'resources/audio/example.mp3',
        deliveryUrl: 'https://media.example/audio/example.mp3',
        storage: { publicUrl: 'https://s3.example/audio/example.mp3' }
    }),
    'https://media.example/audio/example.mp3',
    'explicit audio delivery URLs should take priority'
);
assert.equal(
    resolveAudioUrl({
        path: 'resources/audio/example.mp3',
        storage: { publicUrl: 'https://s3.example/audio/example.mp3' }
    }),
    'https://s3.example/audio/example.mp3',
    'published remote URLs should take priority over the local fallback'
);
assert.equal(
    resolveAudioUrl({ path: 'resources/audio/example.mp3', storage: {} }),
    'resources/audio/example.mp3',
    'audio assets should retain a local fallback until remote delivery is configured'
);
console.log('PASS audio delivery URL priority');

for (const eventEntry of fs.readdirSync(path.join(__dirname, '..', 'archive', 'events'), { withFileTypes: true })) {
    if (!eventEntry.isDirectory()) continue;
    const eventDir = path.join(__dirname, '..', 'archive', 'events', eventEntry.name);
    const assets = JSON.parse(fs.readFileSync(path.join(eventDir, 'assets.json'), 'utf8'));
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    const variantsDir = path.join(eventDir, 'variants');

    for (const variantFile of fs.readdirSync(variantsDir)) {
        if (!variantFile.endsWith('.json')) continue;
        const variant = JSON.parse(fs.readFileSync(path.join(variantsDir, variantFile), 'utf8'));
        for (const assetId of variant.assetIds || []) {
            const asset = assetsById.get(assetId);
            if (!asset || !['image', 'svg', 'gif'].includes(asset.type)) continue;
            assert.doesNotMatch(
                asset.path,
                /^https?:\/\//i,
                `${eventEntry.name}/${variantFile} must not select external image asset ${assetId}`
            );
        }
        for (const [index, figure] of (variant.figures || []).entries()) {
            if (!figure || !figure.avatar) continue;
            assert.doesNotMatch(
                figure.avatar,
                /^https?:\/\//i,
                `${eventEntry.name}/${variantFile} figures[${index}] must use a local avatar`
            );
            assert.equal(
                fs.existsSync(path.join(__dirname, '..', figure.avatar)),
                true,
                `${eventEntry.name}/${variantFile} figures[${index}] avatar must exist`
            );
        }
    }
}
console.log('PASS runtime variants select only local image assets');
console.log('PASS runtime figure avatars are explicit local files');

const compiledArchive = compileArchive(path.join(__dirname, '..'));
assert.equal(compiledArchive.source, 'archive');
assert.equal(compiledArchive.errors.length, 0);
assert.equal(compiledArchive.milestones.length, 194);
assert.ok(compiledArchive.milestones.every((milestone) => milestone.sourceKind === 'archive'));
assert.deepEqual(
    new Set(compiledArchive.milestones.map((milestone) => milestone.id)).size,
    compiledArchive.milestones.length,
    'compiled Archive milestone IDs must be unique'
);
assert.deepEqual(archiveStorylines, compiledArchive.storylines, 'generated storyline metadata should match Archive');
const dartmouthMilestone = compiledArchive.milestones.find(
    (milestone) =>
        milestone.id === 'milestone-1956-dartmouth' && milestone.storyline && milestone.storyline.id === 'deep-learning'
);
assert.ok(dartmouthMilestone, 'the Dartmouth milestone should compile for the deep-learning storyline');
assert.deepEqual(
    dartmouthMilestone.resources.audios.map((audio) => audio.language),
    ['zh', 'en'],
    'the Dartmouth milestone should expose its Chinese and English OSS narration audio'
);
assert.ok(
    dartmouthMilestone.resources.audios.every(
        (audio) =>
            audio.url.startsWith('https://media.sciencearena.cn/audio/ai-history/releases/') &&
            audio.storage?.provider === 'aliyun-oss' &&
            audio.storage?.bucket === 'zgca-medias' &&
            audio.storage?.objectKey.startsWith('audio/ai-history/releases/')
    ),
    'the Dartmouth narration should not depend on a local MP3 fallback'
);
const turingTestMilestone = compiledArchive.milestones.find(
    (milestone) =>
        milestone.id === 'milestone-1950-turing-test' &&
        milestone.storyline &&
        milestone.storyline.id === 'bench-council-ai100'
);
assert.ok(turingTestMilestone, 'the Turing Test milestone should compile for the AI100 storyline');
assert.deepEqual(
    turingTestMilestone.resources.audios.map((audio) => audio.language),
    ['zh', 'en'],
    'the AI100 runtime should select the interactive Chinese and English release audio'
);
assert.match(
    turingTestMilestone.resources.audios[0].url,
    /audio\/ai-history\/releases\/1950-turing-test-zh-interact-v1\.mp3$/,
    'the Chinese runtime audio should use the interactive release URL'
);
assert.equal(
    Object.hasOwn(turingTestMilestone.resources.audios[0], 'sourcePath'),
    false,
    'published runtime audio must not expose its local production source path'
);
console.log('PASS production compiler emits Archive provenance');

for (const eventEntry of fs.readdirSync(path.join(__dirname, '..', 'archive', 'events'), { withFileTypes: true })) {
    if (!eventEntry.isDirectory()) continue;
    const eventDir = path.join(__dirname, '..', 'archive', 'events', eventEntry.name);
    const event = JSON.parse(fs.readFileSync(path.join(eventDir, 'event.json'), 'utf8'));
    const variantsDir = path.join(eventDir, 'variants');
    const variants = fs
        .readdirSync(variantsDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => JSON.parse(fs.readFileSync(path.join(variantsDir, file), 'utf8')));
    const ai100Variant = variants.find((variant) => variant.storylineId === 'bench-council-ai100');
    if (ai100Variant) {
        assert.equal(
            ai100Variant.displaySummary,
            undefined,
            `${eventEntry.name} should inherit the BenchCouncil storyline title instead of duplicating displaySummary`
        );
    }
    if (event.summary) {
        assert.equal(
            variants.some(
                (variant) =>
                    variant.displaySummary &&
                    variant.displaySummary.en === event.summary.en &&
                    variant.displaySummary.zh === event.summary.zh
            ),
            false,
            `${eventEntry.name} event.summary should not duplicate a variant displaySummary`
        );
    }
}
console.log('PASS storyline labels have one Archive authority');

assert.equal(milestones.length, 194, 'Archive runtime should contain four storylines and 194 milestones');
const ai100MapMilestones = milestones.filter(
    (milestone) => milestone.storyline && milestone.storyline.id === 'bench-council-ai100'
);
assert.equal(
    ai100MapMilestones.length,
    139,
    'AI Achievement Map should contain 119 canonical and 20 selected achievements'
);
assert.equal(
    ai100MapMilestones.filter((milestone) => milestone.id.startsWith('milestone-ai100-map-2022-')).length,
    10,
    'AI Achievement Map should contain ten selected 2022 achievements'
);
assert.equal(
    ai100MapMilestones.filter((milestone) => milestone.id.startsWith('milestone-ai100-map-2023-')).length,
    10,
    'AI Achievement Map should contain ten selected 2023 achievements'
);
console.log('PASS AI Achievement Map combines the canonical table with all 20 annual highlights');
const annualAi100Milestones = milestones.filter(
    (milestone) =>
        milestone.storyline &&
        milestone.storyline.id === 'bench-council-ai100' &&
        milestone.archiveEventId.startsWith('ai100-annual-2022-2023-')
);
assert.equal(annualAi100Milestones.length, 20, 'AI Achievement Map should contain the 20 curated annual entries');
assert.equal(annualAi100Milestones[0].title.en, 'Swin Transformer V2');
assert.equal(annualAi100Milestones[19].title.en, 'ESMFold');
assert.ok(
    annualAi100Milestones.some((milestone) => milestone.archiveEventId === 'ai100-annual-2022-2023-057-claude'),
    'annual AI100 highlights should contain Claude'
);
console.log('PASS annual AI100 highlights preserve the curated boundary');
const ai100AlphaFold = milestones.find(
    (milestone) =>
        milestone.archiveEventId === '2020-alphafold' &&
        milestone.storyline &&
        milestone.storyline.id === 'bench-council-ai100'
);
const deepLearningAlphaFold = milestones.find(
    (milestone) =>
        milestone.archiveEventId === '2020-alphafold' &&
        milestone.storyline &&
        milestone.storyline.id === 'deep-learning'
);
assert.ok(ai100AlphaFold, 'AI100 should contain the shared AlphaFold event');
assert.ok(deepLearningAlphaFold, 'deep learning should contain the shared AlphaFold event');
assert.deepEqual(
    ai100AlphaFold.title,
    { zh: 'AlphaFold', en: 'AlphaFold' },
    'AI100 should use the canonical BenchCouncil AlphaFold title'
);
assert.deepEqual(
    deepLearningAlphaFold.title,
    { zh: 'AlphaFold', en: 'AlphaFold' },
    'deep learning should use the unified AlphaFold title'
);
console.log('PASS AlphaFold titles stay unified across storylines');
const humanisticMilestones = milestones.filter(
    (milestone) => milestone.storyline && milestone.storyline.id === 'humanistic-cycle'
);
assert.equal(humanisticMilestones.length, 12, 'Archive runtime should contain all 12 humanistic cycle events');
assert.deepEqual(
    humanisticMilestones.map((milestone) => milestone.id),
    [
        'milestone-humanistic-cycle-1920-rur-robots',
        'milestone-humanistic-cycle-1942-asimov-runaround',
        'milestone-humanistic-cycle-1950-wiener-human-use',
        'milestone-humanistic-cycle-1965-simon-ai-prediction',
        'milestone-humanistic-cycle-1968-hal-9000',
        'milestone-humanistic-cycle-1973-lighthill-report',
        'milestone-humanistic-cycle-1978-xiaolingtong',
        'milestone-humanistic-cycle-1984-neuromancer',
        'milestone-humanistic-cycle-1987-lisp-machine-collapse',
        'milestone-humanistic-cycle-2014-ai-existential-warnings',
        'milestone-humanistic-cycle-2015-openai-founding',
        'milestone-humanistic-cycle-2023-ai-risk-statement'
    ],
    'humanistic cycle milestone identities and order must remain stable'
);
for (const milestone of humanisticMilestones) {
    assert.equal(milestone.archiveVariantId, 'humanistic-cycle');
    assert.equal(milestone.archivePresentationMode, 'archive');
    assert.ok(milestone.sentiment, `${milestone.id} should preserve its sentiment`);
    assert.ok(Array.isArray(milestone.realityLinks) && milestone.realityLinks.length > 0);
    assert.ok(milestone.branchSummary && milestone.branchSummary.zh && milestone.branchSummary.en);
    assert.ok(milestone.analysis && milestone.analysis.what && milestone.analysis.how && milestone.analysis.why);
    assert.ok(milestone.resources && milestone.resources.images.length > 0);
    assert.ok(milestone.achievement && milestone.achievement.sources.length >= 4);
}
console.log('PASS humanistic cycle Archive authority');

{
    const tempDir = createTempDir();
    try {
        const outputs = [path.join(tempDir, 'primary.js'), path.join(tempDir, 'fallback.js')];
        fs.writeFileSync(outputs[0], 'primary-original\n');
        fs.writeFileSync(outputs[1], 'fallback-original\n');

        const generation = generateArchiveData({
            root: tempDir,
            outputs,
            buildPreview: () => ({
                milestones: [],
                errors: [{ storylineId: 'test', ref: { eventId: 'missing' }, message: 'missing event' }],
                counts: { storylines: 1, milestones: 0, errors: 1 }
            }),
            logger: silentLogger()
        });

        assert.equal(generation.ok, false);
        assert.equal(fs.readFileSync(outputs[0], 'utf8'), 'primary-original\n');
        assert.equal(fs.readFileSync(outputs[1], 'utf8'), 'fallback-original\n');
        assert.deepEqual(fs.readdirSync(tempDir).sort(), ['fallback.js', 'primary.js']);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
console.log('PASS generation errors preserve runtime outputs');

{
    const tempDir = createTempDir();
    try {
        const outputs = [path.join(tempDir, 'primary.js'), path.join(tempDir, 'fallback.js')];
        const first = generateArchiveData({
            root: tempDir,
            outputs,
            buildPreview: successfulPreview,
            now: '2026-07-16 10:00',
            logger: silentLogger()
        });
        const firstContent = fs.readFileSync(outputs[0], 'utf8');
        const firstMtime = fs.statSync(outputs[0]).mtimeMs;

        assert.equal(first.ok, true);
        assert.equal(first.writeResults.get(outputs[0]), true);
        assert.equal(first.writeResults.get(outputs[1]), true);
        assert.equal(fs.readFileSync(outputs[1], 'utf8'), firstContent);

        const second = generateArchiveData({
            root: tempDir,
            outputs,
            buildPreview: successfulPreview,
            now: '2026-07-16 11:00',
            logger: silentLogger()
        });

        assert.equal(second.writeResults.get(outputs[0]), false);
        assert.equal(second.writeResults.get(outputs[1]), false);
        assert.equal(fs.statSync(outputs[0]).mtimeMs, firstMtime);
        assert.match(firstContent, /生成时间: 2026-07-16 10:00/);
        assert.equal(
            normalizeGeneratedTime(firstContent),
            normalizeGeneratedTime(firstContent.replace('2026-07-16 10:00', '2026-07-16 11:00'))
        );
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
console.log('PASS generated outputs stay synchronized and stable');

{
    const tempDir = createTempDir();
    try {
        const output = path.join(tempDir, 'runtime.js');
        fs.writeFileSync(output, 'original\n');

        assert.throws(() => writeOutputsAtomically([output, output], 'replacement\n'), /ENOENT|no such file/i);
        assert.equal(fs.readFileSync(output, 'utf8'), 'original\n');
        assert.deepEqual(fs.readdirSync(tempDir), ['runtime.js']);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
console.log('PASS failed output replacement rolls back cleanly');

console.log('All Archive authority checks passed.');
