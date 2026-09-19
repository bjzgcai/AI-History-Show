#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(process.env.AI_HISTORY_ARCHIVE_ROOT || path.join(__dirname, '..'));
const OUTPUT = path.join(ROOT, '.tmp', 'static-site');
const BUILD_META = path.join(ROOT, '.tmp', 'static-site-build.json');
const ROOT_FILES = ['.nojekyll', 'index.html', 'milestones-data.js', 'milestones-data-default.js'];
const DIRECTORIES = ['shared', 'resources', 'public'];
const RETIRED_RESOURCE_METADATA = new Set([
    'resources/quote-candidates.js',
    'resources/research-candidates.js',
    'resources/videos/urls.txt'
]);
const OMITTED_STATIC_FILES = new Set(['public/fonts/oppo-sans/OPPO Sans 4.0.ttf']);
const SOURCE_HAN_FONT = 'public/fonts/source-han-sans/SourceHanSansSC-VF.woff2';
const SOURCE_HAN_LICENSE = 'public/fonts/source-han-sans/OFL.txt';
const RIGHTS_REVIEW_STATIC_FILES = new Set([
    'resources/images/external/1997-logistello/logistello-game-1-positions.png',
    'resources/images/external/2013-dqn/dqn-breakout-paper-frame.png',
    'resources/images/external/2017-alphazero/alphazero-three-games-official.jpg',
    'resources/images/external/2019-muzero/muzero-games-official.jpg',
    'resources/images/external/2019-suphx/suphx-safe-tile-paper-figure.png'
]);
const FORBIDDEN_TOP_LEVEL = new Set([
    'archive',
    'manage',
    'reports',
    'research',
    'scripts',
    'milestones-data-archive-preview.js',
    'milestones-data-archive-native.js',
    'archive-preview-compare.html',
    'archive-parity-compare.html',
    'archive-review.html'
]);

function copyRequired(source, destination, options = {}) {
    assert.ok(fs.existsSync(source), `Required static input is missing: ${path.relative(ROOT, source)}`);
    fs.cpSync(source, destination, { recursive: true, dereference: true, ...options });
}

function includeStaticFile(source) {
    const relativePath = path.relative(ROOT, source).split(path.sep).join('/');
    if (relativePath === 'resources/audio' || relativePath.startsWith('resources/audio/')) return false;
    if (OMITTED_STATIC_FILES.has(relativePath)) return false;
    if (RIGHTS_REVIEW_STATIC_FILES.has(relativePath)) return false;
    if (RETIRED_RESOURCE_METADATA.has(relativePath)) return false;
    if (/^resources\/videos\/[^/]+\.json$/.test(relativePath)) return false;
    return true;
}

function validateBundle() {
    for (const file of ROOT_FILES) assert.ok(fs.existsSync(path.join(OUTPUT, file)), `Bundle is missing ${file}`);
    for (const directory of DIRECTORIES) {
        assert.ok(fs.statSync(path.join(OUTPUT, directory)).isDirectory(), `Bundle is missing ${directory}/`);
    }
    for (const name of fs.readdirSync(OUTPUT)) {
        assert.equal(FORBIDDEN_TOP_LEVEL.has(name), false, `Forbidden path entered static bundle: ${name}`);
    }

    assert.equal(
        fs.existsSync(path.join(OUTPUT, 'public', 'fonts', 'oppo-sans', 'OPPO Sans 4.0.ttf')),
        false,
        'The oversized OPPO Sans TTF must not enter the static bundle'
    );
    assert.ok(fs.existsSync(path.join(OUTPUT, SOURCE_HAN_FONT)), `Bundle is missing ${SOURCE_HAN_FONT}`);
    assert.ok(fs.existsSync(path.join(OUTPUT, SOURCE_HAN_LICENSE)), `Bundle is missing ${SOURCE_HAN_LICENSE}`);
    assert.ok(
        fs.statSync(path.join(OUTPUT, SOURCE_HAN_FONT)).size < 15 * 1024 * 1024,
        'The bundled Source Han Sans web font must remain below 15 MiB'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'milestone-view.js')),
        'Bundle is missing shared/milestone-view.js'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'video-player.js')),
        'Bundle is missing shared/video-player.js'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'chronology-overview.js')),
        'Bundle is missing shared/chronology-overview.js'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'chronology-overview.css')),
        'Bundle is missing shared/chronology-overview.css'
    );
    assert.ok(fs.existsSync(path.join(OUTPUT, 'shared', 'analytics.js')), 'Bundle is missing shared/analytics.js');
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'analytics-config.js')),
        'Bundle is missing shared/analytics-config.js'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'umami-config.js')),
        'Bundle is missing shared/umami-config.js'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'resources', 'images', 'ui', 'brand.png')),
        'Bundle is missing the brand image'
    );
    for (const relativePath of RETIRED_RESOURCE_METADATA) {
        assert.equal(fs.existsSync(path.join(OUTPUT, relativePath)), false, `${relativePath} must not be published`);
    }
    for (const relativePath of RIGHTS_REVIEW_STATIC_FILES) {
        assert.equal(
            fs.existsSync(path.join(OUTPUT, relativePath)),
            false,
            `${relativePath} requires a rights review and must not be published`
        );
    }
    assert.equal(
        fs.readdirSync(path.join(OUTPUT, 'resources', 'videos')).some((file) => file.endsWith('.json')),
        false,
        'Legacy video metadata must not be published'
    );
    assert.equal(
        fs.existsSync(path.join(OUTPUT, 'resources', 'audio')),
        false,
        'Generated audio must be delivered through object storage, not the static bundle'
    );

    assert.equal(
        fs.existsSync(path.join(OUTPUT, 'dual-screen.html')),
        false,
        'The retired dual-screen entry must not enter the static bundle'
    );

    for (const htmlFile of ['index.html']) {
        const html = fs.readFileSync(path.join(OUTPUT, htmlFile), 'utf8');
        assert.match(html, /milestones-data\.js/);
        assert.doesNotMatch(html, /milestones-data-archive-preview\.js/);
        assert.doesNotMatch(html, /public\/fonts\/oppo-sans\/OPPO Sans 4\.0\.ttf/);
        assert.match(html, /public\/fonts\/source-han-sans\/SourceHanSansSC-VF\.woff2/);
        assert.match(html, /font-family:\s*"Source Han Sans SC"/);
        assert.match(html, /--year-font:\s*"Arial Narrow",\s*var\(--ui-font\)/);
        assert.doesNotMatch(
            html,
            /OPPOSans|PingFang SC|Microsoft YaHei|Gotham|Georgia|Times New Roman|Courier New|SFMono-Regular/
        );
    }

    delete require.cache[require.resolve(path.join(ROOT, 'milestones-data.js'))];
    delete require.cache[require.resolve(path.join(OUTPUT, 'milestones-data.js'))];
    const sourceRuntime = require(path.join(ROOT, 'milestones-data.js'));
    const runtime = require(path.join(OUTPUT, 'milestones-data.js'));
    assert.deepEqual(
        runtime.milestones.map((milestone) => milestone.id),
        sourceRuntime.milestones.map((milestone) => milestone.id),
        'The static bundle must preserve every generated milestone in source order'
    );
    assert.equal(
        runtime.milestones.filter(
            (milestone) => milestone.storyline && milestone.storyline.id === 'bench-council-ai100'
        ).length,
        139,
        'The static bundle must publish the complete BenchCouncil AI100 map'
    );
    assert.ok(
        runtime.milestones.every(
            (milestone) => milestone.archiveEventId && milestone.archiveVariantId && milestone.sourceKind === 'archive'
        )
    );
    const serializedRuntime = JSON.stringify(runtime);
    for (const relativePath of RIGHTS_REVIEW_STATIC_FILES) {
        assert.equal(
            serializedRuntime.includes(relativePath),
            false,
            `${relativePath} must not be referenced by runtime data`
        );
    }
}

function bundleStats(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).reduce(
        (result, entry) => {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                const child = bundleStats(entryPath);
                result.fileCount += child.fileCount;
                result.totalBytes += child.totalBytes;
            } else if (entry.isFile()) {
                result.fileCount += 1;
                result.totalBytes += fs.statSync(entryPath).size;
            }
            return result;
        },
        { fileCount: 0, totalBytes: 0 }
    );
}

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });
for (const file of ROOT_FILES) copyRequired(path.join(ROOT, file), path.join(OUTPUT, file));
for (const directory of DIRECTORIES) {
    const options = directory === 'resources' || directory === 'public' ? { filter: includeStaticFile } : {};
    copyRequired(path.join(ROOT, directory), path.join(OUTPUT, directory), options);
}
validateBundle();

const stats = bundleStats(OUTPUT);
const buildMeta = {
    builtAt: new Date().toISOString(),
    relativePath: '.tmp/static-site/',
    ...stats
};
fs.mkdirSync(path.dirname(BUILD_META), { recursive: true });
const buildMetaTemp = `${BUILD_META}.${process.pid}.tmp`;
fs.writeFileSync(buildMetaTemp, `${JSON.stringify(buildMeta, null, 2)}\n`, 'utf8');
fs.renameSync(buildMetaTemp, BUILD_META);

console.log(`Static site bundle: ${path.relative(ROOT, OUTPUT)}`);
console.log(`Static site files: ${stats.fileCount} files, ${stats.totalBytes} bytes`);
console.log('Static site bundle validation passed.');
