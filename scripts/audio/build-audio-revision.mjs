#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
    ROOT,
    fail,
    loadRevisionConfig,
    loadRevisionTurns,
    normalizedRole,
    readJson,
    relativeToRoot,
    renderScript,
    revisionPaths,
    toPosix
} from './lib/audio-revision.mjs';

const VALID_ROLES = new Set(['A', 'B', 'N', 'SUMMARY']);
const storylineCache = new Map();

function parseArgs(argv) {
    const check = argv.includes('--check');
    const sourceOnly = argv.includes('--source-only');
    const configPath = argv.find((argument) => !argument.startsWith('--'));
    return { check, sourceOnly, configPath };
}

function assertEqual(actual, expected, label) {
    if (actual !== expected) fail(`${label} is out of sync`);
}

function loadStoryline(scopeId) {
    if (storylineCache.has(scopeId)) return storylineCache.get(scopeId);
    const storylinePath = path.join(ROOT, 'archive/storylines', `${scopeId}.json`);
    if (!fs.existsSync(storylinePath)) fail(`Missing Archive storyline: ${relativeToRoot(storylinePath)}`);
    const storyline = readJson(storylinePath);
    const enabledEvents = storyline.events.filter((event) => event.enabled !== false).sort((a, b) => a.order - b.order);
    const result = { storyline, enabledEvents };
    storylineCache.set(scopeId, result);
    return result;
}

function validateTurns(source) {
    const { data, fileName } = source;
    const { storyline, enabledEvents } = loadStoryline(data.scopeId);
    const storylineEvent = enabledEvents[data.sequenceIndex - 1];
    if (!storylineEvent || storylineEvent.eventId !== data.eventId) {
        fail(`${fileName}: event does not match enabled Archive storyline order`);
    }
    if (data.variantId && (storylineEvent.variant || storyline.id) !== data.variantId) {
        fail(`${fileName}: variant does not match Archive storyline ${storyline.id}`);
    }
    if (!Array.isArray(data.turns) || data.turns.length === 0) fail(`${fileName}: turns must be non-empty`);

    const sourceIds = new Set(
        readJson(path.join(ROOT, 'archive/events', data.eventId, 'sources.json')).map((sourceItem) => sourceItem.id)
    );
    const claimIds = new Set(
        readJson(path.join(ROOT, 'archive/events', data.eventId, 'claims.json')).map((claim) => claim.id)
    );
    for (const [index, turn] of data.turns.entries()) {
        const role = normalizedRole(turn.role);
        if (!VALID_ROLES.has(role)) fail(`${fileName}: unsupported role ${turn.role} at turn ${index + 1}`);
        if (!String(turn.text || '').trim()) fail(`${fileName}: empty text at turn ${index + 1}`);
        for (const sourceId of turn.sourceIds || []) {
            if (!sourceIds.has(sourceId)) fail(`${fileName}: missing source ${sourceId}`);
        }
        for (const claimId of turn.claimIds || []) {
            if (!claimIds.has(claimId)) fail(`${fileName}: missing claim ${claimId}`);
        }
    }
}

function expectedFiles(config, sources) {
    const { outputRoot, planPath } = revisionPaths(config);
    const entries = sources.map(({ data }) => {
        const locale = data.locale || 'zh';
        const mode = data.mode || 'storyline';
        const stem = `${String(data.sequenceIndex).padStart(2, '0')}-${data.eventId}`;
        const scriptPath = path.join(outputRoot, 'scripts', locale, `${stem}.txt`);
        const turnsPath = path.join(outputRoot, 'turns', locale, `${stem}.json`);
        return {
            source: data,
            scriptPath,
            turnsPath,
            script: renderScript(data.turns),
            turns: `${JSON.stringify({ ...data, revisionId: config.revisionId }, null, 2)}\n`,
            planEntry: {
                scopeId: data.scopeId,
                sequenceIndex: data.sequenceIndex,
                eventId: data.eventId,
                locale,
                modes: [mode],
                scriptPaths: { [mode]: relativeToRoot(scriptPath) },
                turnsPaths: { [mode]: relativeToRoot(turnsPath) }
            }
        };
    });
    const plan = {
        schemaVersion: 1,
        revisionId: config.revisionId,
        label: config.label,
        comparisonKind: config.comparisonKind,
        status: 'ready-for-generation',
        provider: config.provider.name,
        model: config.provider.model,
        endpoint: config.provider.endpoint,
        envFile: config.provider.envFile,
        outputRoot: toPosix(config.outputRoot),
        retries: config.provider.retries || 3,
        specification: config.specification,
        voiceProfile: config.voiceProfile,
        sourceConfig: relativeToRoot(config.configPath),
        entries: entries.map((entry) => entry.planEntry)
    };
    return { outputRoot, planPath, entries, plan };
}

function checkExisting(expected) {
    if (!fs.existsSync(expected.planPath)) fail(`Missing ${relativeToRoot(expected.planPath)}`);
    const actualPlan = readJson(expected.planPath);
    const stableKeys = [
        'schemaVersion',
        'revisionId',
        'provider',
        'model',
        'outputRoot',
        'retries',
        'specification',
        'voiceProfile',
        'entries'
    ];
    const revisionMetadataKeys = ['label', 'comparisonKind', 'endpoint', 'envFile', 'sourceConfig'];
    if (expected.config.allowLegacyPlanMetadata) {
        for (const key of stableKeys.filter((key) => !['specification', 'entries'].includes(key))) {
            assertEqual(JSON.stringify(actualPlan[key]), JSON.stringify(expected.plan[key]), `revision plan ${key}`);
        }
        for (const [key, value] of Object.entries(actualPlan.specification || {})) {
            assertEqual(
                JSON.stringify(value),
                JSON.stringify(expected.plan.specification[key]),
                `revision plan specification.${key}`
            );
        }
        assertEqual(actualPlan.entries.length, expected.plan.entries.length, 'revision plan entry count');
        for (const [index, entry] of expected.plan.entries.entries()) {
            for (const [key, value] of Object.entries(entry)) {
                assertEqual(
                    JSON.stringify(actualPlan.entries[index]?.[key]),
                    JSON.stringify(value),
                    `revision plan entries[${index}].${key}`
                );
            }
        }
        for (const key of revisionMetadataKeys) {
            if (key in actualPlan) {
                assertEqual(
                    JSON.stringify(actualPlan[key]),
                    JSON.stringify(expected.plan[key]),
                    `revision plan ${key}`
                );
            }
        }
    } else {
        for (const key of [...stableKeys, ...revisionMetadataKeys]) {
            if (!(key in actualPlan)) fail(`revision plan is missing ${key}`);
            assertEqual(JSON.stringify(actualPlan[key]), JSON.stringify(expected.plan[key]), `revision plan ${key}`);
        }
    }
    for (const entry of expected.entries) {
        if (!fs.existsSync(entry.scriptPath)) fail(`Missing ${relativeToRoot(entry.scriptPath)}`);
        if (!fs.existsSync(entry.turnsPath)) fail(`Missing ${relativeToRoot(entry.turnsPath)}`);
        assertEqual(fs.readFileSync(entry.scriptPath, 'utf8'), entry.script, relativeToRoot(entry.scriptPath));
        const actualTurns = readJson(entry.turnsPath);
        assertEqual(
            JSON.stringify(actualTurns.turns),
            JSON.stringify(entry.source.turns),
            `${relativeToRoot(entry.turnsPath)} turns`
        );
    }
}

function writeNew(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, { flag: 'wx' });
}

function main() {
    const { check, sourceOnly, configPath } = parseArgs(process.argv.slice(2));
    const config = loadRevisionConfig(configPath);
    const sources = loadRevisionTurns(config);
    if (sources.length !== config.expectedEntryCount) {
        fail(`Expected ${config.expectedEntryCount} turn files, found ${sources.length}`);
    }
    for (const source of sources) validateTurns(source);
    const expected = { ...expectedFiles(config, sources), config };

    if (sourceOnly) {
        console.log(`Revision sources valid: ${config.revisionId}, ${sources.length} turn files passed.`);
        return;
    }

    if (check) {
        checkExisting(expected);
        console.log(`Revision source and generated scripts are synchronized: ${config.revisionId}`);
        return;
    }
    if (fs.existsSync(expected.planPath)) {
        fail(`Refusing to overwrite existing revision: ${relativeToRoot(expected.outputRoot)}`);
    }
    for (const entry of expected.entries) {
        writeNew(entry.scriptPath, entry.script);
        writeNew(entry.turnsPath, entry.turns);
    }
    writeNew(expected.planPath, `${JSON.stringify(expected.plan, null, 2)}\n`);
    console.log(`Built ${config.revisionId} with ${expected.entries.length} revision scripts.`);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
