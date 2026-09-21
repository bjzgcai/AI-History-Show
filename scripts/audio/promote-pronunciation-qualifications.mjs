#!/usr/bin/env node

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import prettier from 'prettier';
import { ROOT, fail, readJson, relativeToRoot, resolveFromRoot } from './lib/audio-revision.mjs';

const require = createRequire(import.meta.url);
const { candidateIdFor } = require('../../audio-review/candidates');
const CONFIG_PATH = path.join(ROOT, 'audio/pronunciation/qualification-cases.json');
const GLOSSARY_PATH = path.join(ROOT, 'audio/pronunciation/glossary.json');
const MANIFEST_PATH = path.join(ROOT, '.tmp/pronunciation-qualification/manifest.json');

function parseArgs(argv) {
    const options = {
        databasePath: process.env.AUDIO_REVIEW_DB || path.join(ROOT, '.tmp/audio-review/reviews.sqlite'),
        write: false,
        check: false
    };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--db') {
            options.databasePath = resolveFromRoot(argv[index + 1]);
            index += 1;
        } else if (argument === '--write') options.write = true;
        else if (argument === '--check') options.check = true;
        else fail(`unknown option ${argument}`);
    }
    return options;
}

function qualificationTuple(qualification) {
    return {
        provider: qualification.provider,
        model: qualification.model,
        locale: qualification.locale,
        voice: qualification.voice,
        instructionSha256: qualification.instructionSha256,
        method: qualification.method,
        speechForm: qualification.speechForm
    };
}

async function writeJson(filePath, value) {
    const prettierConfig = (await prettier.resolveConfig(filePath)) || {};
    const output = await prettier.format(JSON.stringify(value), { ...prettierConfig, filepath: filePath });
    const temporaryPath = `${filePath}.tmp-${process.pid}`;
    fs.writeFileSync(temporaryPath, output);
    fs.renameSync(temporaryPath, filePath);
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    for (const filePath of [CONFIG_PATH, GLOSSARY_PATH, MANIFEST_PATH, options.databasePath]) {
        if (!fs.existsSync(filePath)) fail(`Missing required file: ${relativeToRoot(filePath)}`);
    }
    const config = readJson(CONFIG_PATH);
    const glossary = readJson(GLOSSARY_PATH);
    const manifest = readJson(MANIFEST_PATH);
    const manifestGroups = new Map(manifest.qualificationGroups.map((group) => [group.id, group]));
    const samplesByGroup = new Map();
    for (const sample of manifest.samples) {
        if (!samplesByGroup.has(sample.groupId)) samplesByGroup.set(sample.groupId, []);
        samplesByGroup.get(sample.groupId).push(sample);
    }
    const glossaryById = new Map(glossary.entries.map((entry) => [entry.id, entry]));
    const database = new DatabaseSync(options.databasePath, { readOnly: true });
    const passedReview = database.prepare(`
        SELECT created_at
        FROM review_records
        WHERE candidate_id = ? AND result = 'pass' AND invalidated_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
    `);
    const results = [];
    try {
        for (const group of config.groups) {
            const manifestGroup = manifestGroups.get(group.id);
            const samples = samplesByGroup.get(group.id) || [];
            if (!manifestGroup || !samples.length) fail(`${group.id}: missing from qualification manifest`);
            const reviews = samples.map((sample) => {
                const candidateId = candidateIdFor(`pronunciation:${sample.id}`, sample.outputPath);
                return { sample, candidateId, review: passedReview.get(candidateId) || null };
            });
            const missing = reviews.filter((item) => !item.review);
            if (missing.length) {
                results.push({
                    id: group.id,
                    status: 'pending',
                    passed: reviews.length - missing.length,
                    total: reviews.length
                });
                continue;
            }
            const term = glossaryById.get(group.termId);
            if (!term) fail(`${group.id}: glossary term ${group.termId} is missing`);
            term.ttsQualifications ||= [];
            const reviewedAt = reviews
                .map((item) => item.review.created_at)
                .sort()
                .at(-1)
                .slice(0, 10);
            const sampleIds = samples.map((sample) => sample.id).sort();
            const tuple = {
                qualificationId: group.qualificationId,
                status: 'human-reviewed-pass',
                reviewedAt,
                ...manifestGroup.tuple,
                method: 'speech-replacement',
                sampleIds
            };
            delete tuple.termId;
            delete tuple.term;
            const existing = term.ttsQualifications.find(
                (qualification) => qualification.qualificationId === group.qualificationId
            );
            if (existing) {
                if (JSON.stringify(qualificationTuple(existing)) !== JSON.stringify(qualificationTuple(tuple))) {
                    fail(`${group.id}: existing glossary qualification tuple differs from reviewed tuple`);
                }
                existing.reviewedAt = reviewedAt;
                existing.sampleIds = [...new Set([...(existing.sampleIds || []), ...sampleIds])].sort();
                results.push({ id: group.id, status: 'updated', passed: reviews.length, total: reviews.length });
            } else {
                term.ttsQualifications.push(tuple);
                results.push({ id: group.id, status: 'created', passed: reviews.length, total: reviews.length });
            }
        }
    } finally {
        database.close();
    }

    const pending = results.filter((result) => result.status === 'pending');
    for (const result of results) console.log(`${result.id}: ${result.status} (${result.passed}/${result.total})`);
    if (options.write) {
        await writeJson(GLOSSARY_PATH, glossary);
        console.log(`Updated ${relativeToRoot(GLOSSARY_PATH)}.`);
    }
    if (options.check && pending.length) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
