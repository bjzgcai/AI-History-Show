#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/audio-revision.mjs';

const RUNTIME_ROOT = path.join(ROOT, '.tmp/whisper-cpp-bin');
const RUNTIME_ARCHIVE = path.join(RUNTIME_ROOT, 'whisper.tar.gz');
const RUNTIME_DIRECTORY = path.join(RUNTIME_ROOT, 'whisper-bin-ubuntu-x64');
const MODEL_ROOT = path.join(process.env.HOME, '.cache/hyperframes/whisper/models');
const ARTIFACTS = [
    {
        path: RUNTIME_ARCHIVE,
        url: 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.2/whisper-bin-ubuntu-x64.tar.gz',
        sha256: '46811a3ecf584307480a220b9ef5ff81b7b22dc41577cbc274ce3afc61f753b1'
    },
    {
        path: path.join(MODEL_ROOT, 'ggml-small.bin'),
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
        sha256: '1be3a9b2063867b937e64e2ec7483364a79917e157fa98c5d94b5c1fffea987b'
    },
    {
        path: path.join(MODEL_ROOT, 'ggml-small.en.bin'),
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
        sha256: 'c6138d6d58ecc8322097e0f987c32f1be8bb0a18532a3f88f734d1bbf9c41e5d'
    }
];

function fail(message) {
    throw new Error(message);
}

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function run(command, args) {
    const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) fail(`${command} exited ${result.status}`);
}

for (const artifact of ARTIFACTS) {
    fs.mkdirSync(path.dirname(artifact.path), { recursive: true });
    if (!fs.existsSync(artifact.path) || sha256(artifact.path) !== artifact.sha256) {
        const temporaryPath = `${artifact.path}.download`;
        run('curl', ['-fL', '--retry', '8', '--retry-all-errors', '-o', temporaryPath, artifact.url]);
        if (sha256(temporaryPath) !== artifact.sha256) fail(`Checksum mismatch for ${artifact.url}`);
        fs.renameSync(temporaryPath, artifact.path);
    }
    if (sha256(artifact.path) !== artifact.sha256) fail(`Checksum mismatch for ${artifact.path}`);
}

const binary = path.join(RUNTIME_DIRECTORY, 'whisper-cli');
if (!fs.existsSync(binary)) {
    fs.mkdirSync(RUNTIME_DIRECTORY, { recursive: true });
    run('tar', ['-xzf', RUNTIME_ARCHIVE, '-C', RUNTIME_ROOT]);
}
if (!fs.existsSync(binary)) fail(`whisper-cli was not extracted to ${binary}`);
console.log(`Pronunciation validator ready: ${path.relative(ROOT, binary)}`);
