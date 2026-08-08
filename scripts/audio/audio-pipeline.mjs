#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, fail, loadRevisionConfig, relativeToRoot, revisionPaths } from './lib/audio-revision.mjs';

const AUDIO_SCRIPT_ROOT = path.join(ROOT, 'scripts/audio');
const BUILD_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'build-audio-revision.mjs');
const GENERATE_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'generate-audio-revision.mjs');
const VALIDATE_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'validate-audio-revision.mjs');
const REVIEW_BUILD_SCRIPT = path.join(AUDIO_SCRIPT_ROOT, 'build-audio-review-page-data.mjs');
const ACTIVE_OVERLAYS_PATH = path.join(ROOT, 'designs/audio-review-console/active-overlays.json');

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

function main() {
    const [command, ...args] = process.argv.slice(2);
    if (!command || command === 'help' || command === '--help') {
        console.log(`Usage:
  npm run audio:revision -- build <config.json>
  npm run audio:revision -- generate <config.json>
  npm run audio:revision -- validate <config.json>
  npm run audio:revision -- source-check <config.json>
  npm run audio:revision -- check <config.json>
  npm run audio:revision -- activate <config-a.json> [config-b.json ...]
  npm run audio:revision -- review`);
        return;
    }
    if (command === 'build') run(BUILD_SCRIPT, args);
    else if (command === 'generate') {
        const config = loadRevisionConfig(args[0]);
        run(BUILD_SCRIPT, [config.configPath]);
        run(GENERATE_SCRIPT, [revisionPaths(config).planPath]);
        run(VALIDATE_SCRIPT, [config.configPath]);
    } else if (command === 'validate') run(VALIDATE_SCRIPT, args);
    else if (command === 'source-check') run(BUILD_SCRIPT, [...args, '--source-only']);
    else if (command === 'check') {
        run(BUILD_SCRIPT, [...args, '--check']);
        const config = loadRevisionConfig(args[0]);
        if (fs.existsSync(revisionPaths(config).overlayPath)) run(VALIDATE_SCRIPT, [config.configPath]);
    } else if (command === 'activate') activate(args);
    else if (command === 'review') run(REVIEW_BUILD_SCRIPT);
    else fail(`Unknown audio revision command: ${command}`);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
