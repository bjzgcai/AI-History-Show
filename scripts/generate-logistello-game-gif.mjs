#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(projectRoot, 'resources/images/external/1997-logistello/logistello-game-1-positions.png');
const outputPath = path.join(
    projectRoot,
    'resources/images/external/1997-logistello/logistello-game-1-first-25-positions.gif'
);
const moves = [
    '2: -e3',
    '3: +f6',
    '4: -e6',
    '5: +f5',
    '6: -c5',
    '7: +f4',
    '8: -g6',
    '9: +f7',
    '10: -g5',
    '11: +d6',
    '12: -d3',
    '13: +g3',
    '14: -f3',
    '15: +d2',
    '16: -c7',
    '17: +d7',
    '18: -c6',
    '19: +b6',
    '20: -b5',
    '21: +c8',
    '22: -e2',
    '23: +e7',
    '24: -c3',
    '25: +a5',
    '26: -f8'
];

function run(command, args, options = {}) {
    execFileSync(command, args, { stdio: 'inherit', ...options });
}

const workDir = mkdtempSync(path.join(tmpdir(), 'logistello-game-gif-'));

try {
    run('swift', [path.join(projectRoot, 'scripts/render-logistello-frames.swift'), sourcePath, workDir, ...moves], {
        env: {
            ...process.env,
            SWIFT_MODULECACHE_PATH: path.join(workDir, 'swift-module-cache'),
            CLANG_MODULE_CACHE_PATH: path.join(workDir, 'clang-module-cache')
        }
    });

    run('ffmpeg', [
        '-y',
        '-loglevel',
        'error',
        '-framerate',
        '1',
        '-i',
        path.join(workDir, 'frame-%02d.png'),
        '-filter_complex',
        '[0:v]split[frames][palette_src];[palette_src]palettegen=max_colors=256:stats_mode=diff[palette];[frames][palette]paletteuse=dither=sierra2_4a:diff_mode=rectangle',
        '-loop',
        '0',
        outputPath
    ]);

    console.log(`Generated ${outputPath}`);
} finally {
    rmSync(workDir, { recursive: true, force: true });
}
