#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, fail, loadRevisionConfig, relativeToRoot, revisionPaths } from './lib/audio-revision.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const AUDIO_SCRIPT_ROOT = path.join(ROOT, 'scripts/audio');
const BUILD_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'build-audio-revision.mjs');
const GENERATE_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'generate-audio-revision.mjs');
const VALIDATE_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'validate-audio-revision.mjs');
const REVIEW_BUILD_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'build-audio-review-page-data.mjs');
const STATUS_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'check-audio-workflow-status.mjs');
const ARCHIVE_SYNC_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'sync-original-audio-release.mjs');
const OSS_SCRIPT = path.join(ROOT, 'scripts/sync-audio-oss.js');
const ACTIVE_OVERLAYS_PATH = path.join(ROOT, 'tools/audio-review-console/active-overlays.json');

function run(scriptPath, args = []) {
    const result = spawnSync(process.execPath, [scriptPath, ...args], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'inherit'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) fail(`${path.basename(scriptPath)} exited with status ${result.status}`);
}

function activate(configArguments) {
    if (!configArguments.length) fail('activate requires at least one revision config');
    const descriptors = configArguments.map((argument) => {
        const config = loadRevisionConfig(argument);
        const { overlayPath } = revisionPaths(config);
        if (!fs.existsSync(overlayPath)) fail(`Missing ${relativeToRoot(overlayPath)}`);
        run(VALIDATE_SCRIPT, [config.configPath]);
        return {
            configPath: relativeToRoot(config.configPath),
            path: relativeToRoot(overlayPath),
            revisionId: config.revisionId,
            comparisonKind: config.comparisonKind,
            label: config.label
        };
    });
    fs.writeFileSync(ACTIVE_OVERLAYS_PATH, `${JSON.stringify(descriptors, null, 2)}\n`);
    run(REVIEW_BUILD_SCRIPT);
    console.log(`Activated ${descriptors.length} revision overlays for review.`);
}

export function generationActions({ planExists, overlayExists }) {
    return [planExists ? 'build-check' : 'build', ...(overlayExists ? [] : ['generate']), 'validate'];
}

function generate(configArgument) {
    const config = loadRevisionConfig(configArgument);
    const paths = revisionPaths(config);
    const actions = generationActions({
        planExists: fs.existsSync(paths.planPath),
        overlayExists: fs.existsSync(paths.overlayPath)
    });
    for (const action of actions) {
        if (action === 'build') run(BUILD_SCRIPT, [config.configPath]);
        else if (action === 'build-check') run(BUILD_SCRIPT, [config.configPath, '--check']);
        else if (action === 'generate') run(GENERATE_SCRIPT, [paths.planPath]);
        else if (action === 'validate') run(VALIDATE_SCRIPT, [config.configPath]);
    }
    if (!actions.includes('generate')) {
        console.log(`Revision ${config.revisionId} already has an overlay; validated existing append-only output.`);
    }
}

function sourceCheckAll() {
    const revisionsRoot = path.join(ROOT, 'audio/revisions');
    const configPaths = fs
        .readdirSync(revisionsRoot)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .map((fileName) => path.join(revisionsRoot, fileName));
    for (const configPath of configPaths) run(BUILD_SCRIPT, [configPath, '--source-only']);
}

function release(args) {
    const [command, ...commandArgs] = args;
    if (command === 'archive-sync-originals') {
        run(ARCHIVE_SYNC_SCRIPT, commandArgs);
        return;
    }
    if (!['check', 'manifest', 'push', 'verify', 'publish-access'].includes(command)) {
        fail('release requires check, manifest, push, verify, publish-access, or archive-sync-originals');
    }
    run(OSS_SCRIPT, [command, ...commandArgs]);
}

function main() {
    const [command, ...args] = process.argv.slice(2);
    if (!command || command === 'help' || command === '--help') {
        console.log(`Usage:
  npm run audio:workflow -- status [--json] [--strict] [--remote]
  npm run audio:workflow -- source-check <config.json>
  npm run audio:workflow -- source-check-all
  npm run audio:workflow -- build <config.json>
  npm run audio:workflow -- generate <config.json>
  npm run audio:workflow -- validate <config.json>
  npm run audio:workflow -- check <config.json>
  npm run audio:workflow -- activate <config-a.json> [config-b.json ...]
  npm run audio:workflow -- review
  npm run audio:workflow -- release <check|manifest|push|verify|publish-access> [options]
  npm run audio:workflow -- release archive-sync-originals [--apply] [--link-shared-variants]`);
        return;
    }
    if (command === 'status') run(STATUS_SCRIPT, args);
    else if (command === 'build') run(BUILD_SCRIPT, args);
    else if (command === 'generate') generate(args[0]);
    else if (command === 'validate') run(VALIDATE_SCRIPT, args);
    else if (command === 'source-check') run(BUILD_SCRIPT, [...args, '--source-only']);
    else if (command === 'source-check-all') sourceCheckAll();
    else if (command === 'check') {
        run(BUILD_SCRIPT, [...args, '--check']);
        const config = loadRevisionConfig(args[0]);
        if (fs.existsSync(revisionPaths(config).overlayPath)) run(VALIDATE_SCRIPT, [config.configPath]);
    } else if (command === 'activate') activate(args);
    else if (command === 'review') run(REVIEW_BUILD_SCRIPT);
    else if (command === 'release') release(args);
    else fail(`Unknown audio revision command: ${command}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
    try {
        main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
