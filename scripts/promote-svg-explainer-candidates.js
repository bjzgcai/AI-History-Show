#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const REVIEW_DIR = path.join(ROOT, 'reports', 'svg-explainer-review');
const CANDIDATE_DIR = path.join(REVIEW_DIR, 'candidates');
const ORIGINAL_DIR = path.join(REVIEW_DIR, 'originals');
const MANIFEST_PATH = path.join(REVIEW_DIR, 'candidates.json');

function main() {
    const records = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    fs.mkdirSync(ORIGINAL_DIR, { recursive: true });

    let snapshotCount = 0;
    let replacementCount = 0;
    for (const record of records) {
        const originalPath = path.join(ROOT, record.original);
        const candidatePath = path.join(CANDIDATE_DIR, record.candidateFile);
        const snapshotPath = path.join(ORIGINAL_DIR, record.candidateFile);
        if (!fs.existsSync(originalPath)) throw new Error(`Missing original SVG: ${record.original}`);
        if (!fs.existsSync(candidatePath)) throw new Error(`Missing candidate SVG: ${record.candidateFile}`);

        if (!fs.existsSync(snapshotPath)) {
            fs.copyFileSync(originalPath, snapshotPath, fs.constants.COPYFILE_EXCL);
            snapshotCount += 1;
        }
        if (!fs.readFileSync(originalPath).equals(fs.readFileSync(candidatePath))) {
            fs.copyFileSync(candidatePath, originalPath);
            replacementCount += 1;
        }
    }

    console.log(`Original SVG snapshots created: ${snapshotCount}`);
    console.log(`SVG candidates promoted: ${replacementCount}`);
}

if (require.main === module) main();
