#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, '.tmp', 'static-site');
const ROOT_FILES = ['.nojekyll', 'index.html', 'dual-screen.html', 'milestones-data.js', 'milestones-data-default.js'];
const DIRECTORIES = ['shared', 'resources', 'public'];
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

function copyRequired(source, destination) {
    assert.ok(fs.existsSync(source), `Required static input is missing: ${path.relative(ROOT, source)}`);
    fs.cpSync(source, destination, { recursive: true });
}

function validateBundle() {
    for (const file of ROOT_FILES) assert.ok(fs.existsSync(path.join(OUTPUT, file)), `Bundle is missing ${file}`);
    for (const directory of DIRECTORIES) {
        assert.ok(fs.statSync(path.join(OUTPUT, directory)).isDirectory(), `Bundle is missing ${directory}/`);
    }
    for (const name of fs.readdirSync(OUTPUT)) {
        assert.equal(FORBIDDEN_TOP_LEVEL.has(name), false, `Forbidden path entered static bundle: ${name}`);
    }

    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'public', 'fonts', 'oppo-sans', 'OPPO Sans 4.0.ttf')),
        'Bundle is missing the local OPPO Sans font'
    );
    assert.ok(
        fs.existsSync(path.join(OUTPUT, 'shared', 'milestone-view.js')),
        'Bundle is missing shared/milestone-view.js'
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

    for (const htmlFile of ['index.html', 'dual-screen.html']) {
        const html = fs.readFileSync(path.join(OUTPUT, htmlFile), 'utf8');
        assert.match(html, /milestones-data\.js/);
        assert.doesNotMatch(html, /milestones-data-archive-preview\.js/);
        if (htmlFile === 'index.html') assert.match(html, /public\/fonts\/oppo-sans\/OPPO Sans 4\.0\.ttf/);
    }

    delete require.cache[require.resolve(path.join(OUTPUT, 'milestones-data.js'))];
    const runtime = require(path.join(OUTPUT, 'milestones-data.js'));
    assert.equal(runtime.milestones.length, 146);
    assert.ok(
        runtime.milestones.every(
            (milestone) => milestone.archiveEventId && milestone.archiveVariantId && milestone.sourceKind === 'archive'
        )
    );
}

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });
for (const file of ROOT_FILES) copyRequired(path.join(ROOT, file), path.join(OUTPUT, file));
for (const directory of DIRECTORIES) copyRequired(path.join(ROOT, directory), path.join(OUTPUT, directory));
validateBundle();

console.log(`Static site bundle: ${path.relative(ROOT, OUTPUT)}`);
console.log(`Static site files: ${ROOT_FILES.length} root files + ${DIRECTORIES.join(', ')}`);
console.log('Static site bundle validation passed.');
