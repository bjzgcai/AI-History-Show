#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_REVISIONS_ROOT = path.join(ROOT, 'audio/revisions');
const FIGURES_PATH = path.join(ROOT, 'archive/figures/figures.json');
const GLOSSARY_PATH = path.join(ROOT, 'audio/pronunciation/glossary.json');
const INVENTORY_PATH = path.join(ROOT, 'audio/pronunciation/inventory.json');
const CHECK = process.argv.includes('--check');

function fail(message) {
    throw new Error(message);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toPosix(filePath) {
    return filePath.split(path.sep).join('/');
}

function relativeToRoot(filePath) {
    return toPosix(path.relative(ROOT, filePath));
}

function listTurnFiles(directory) {
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...listTurnFiles(filePath));
        else if (/turns[\\/](zh|en)[\\/].+\.json$/u.test(filePath)) files.push(filePath);
    }
    return files.sort();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasPattern(alias) {
    return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(alias)}(?![A-Za-z0-9])`, 'gu');
}

function validateGlossary(glossary) {
    if (glossary.schemaVersion !== 1) fail('glossary schemaVersion must be 1');
    if (!Array.isArray(glossary.entries) || glossary.entries.length === 0) fail('glossary entries are empty');
    const ids = new Set();
    const aliases = new Map();
    const qualificationIds = new Set();
    for (const entry of glossary.entries) {
        if (!entry.id || !entry.term || !entry.category) fail('every glossary entry needs id, term, and category');
        if (ids.has(entry.id)) fail(`duplicate glossary id: ${entry.id}`);
        ids.add(entry.id);
        if (!Array.isArray(entry.aliases) || !entry.aliases.includes(entry.term)) {
            fail(`${entry.id}: aliases must include the canonical term`);
        }
        if (!entry.reading?.type || !entry.reading?.spoken) {
            fail(`${entry.id}: missing reading type or spoken form`);
        }
        if (entry.pronunciationHypotheses) {
            if (
                !Array.isArray(entry.pronunciationHypotheses.expected) ||
                !entry.pronunciationHypotheses.expected.length
            ) {
                fail(`${entry.id}: pronunciation hypotheses need expected phonemes`);
            }
            if (!Array.isArray(entry.pronunciationHypotheses.rejected)) {
                fail(`${entry.id}: pronunciation hypotheses rejected must be an array`);
            }
            if (
                entry.pronunciationHypotheses.rejected.some(
                    (hypothesis) => !Array.isArray(hypothesis) || !hypothesis.length
                )
            ) {
                fail(`${entry.id}: every rejected pronunciation hypothesis must contain phonemes`);
            }
        }
        const activeQualificationContexts = new Set();
        for (const validation of entry.ttsQualifications || []) {
            for (const key of [
                'qualificationId',
                'status',
                'reviewedAt',
                'provider',
                'model',
                'locale',
                'voice',
                'instructionSha256',
                'method',
                'speechForm'
            ]) {
                if (!validation[key]) fail(`${entry.id}: TTS qualification is missing ${key}`);
            }
            if (!Array.isArray(validation.sampleIds) || validation.sampleIds.length < 1) {
                fail(`${entry.id}: TTS qualification needs reviewed sampleIds`);
            }
            if (qualificationIds.has(validation.qualificationId)) {
                fail(`duplicate TTS qualification id: ${validation.qualificationId}`);
            }
            qualificationIds.add(validation.qualificationId);
            if (!/^[a-f0-9]{64}$/u.test(validation.instructionSha256)) {
                fail(`${entry.id}: TTS qualification instructionSha256 must be lowercase SHA-256`);
            }
            if (!['human-reviewed-pass', 'human-reviewed-fail'].includes(validation.status)) {
                fail(`${entry.id}: unknown TTS qualification status ${validation.status}`);
            }
            if (validation.status === 'human-reviewed-pass') {
                const contextKey = [
                    validation.provider,
                    validation.model,
                    validation.locale,
                    validation.voice,
                    validation.instructionSha256,
                    validation.method
                ].join('\u0000');
                if (activeQualificationContexts.has(contextKey)) {
                    fail(`${entry.id}: multiple active TTS qualifications match the same generation context`);
                }
                activeQualificationContexts.add(contextKey);
            }
        }
        for (const exclusion of entry.ttsExclusions || []) {
            for (const key of ['eventId', 'locale', 'turnIndex', 'reason']) {
                if (!exclusion[key]) fail(`${entry.id}: TTS exclusion is missing ${key}`);
            }
            if (!Number.isInteger(exclusion.turnIndex) || exclusion.turnIndex < 1) {
                fail(`${entry.id}: TTS exclusion turnIndex must be a positive integer`);
            }
        }
        if (!glossary.verificationLevels?.[entry.verification]) {
            fail(`${entry.id}: unknown verification level ${entry.verification}`);
        }
        for (const alias of entry.aliases) {
            const key = alias.toLocaleLowerCase('en-US');
            const previous = aliases.get(key);
            if (previous && previous !== entry.id) fail(`alias ${alias} belongs to both ${previous} and ${entry.id}`);
            aliases.set(key, entry.id);
        }
    }
}

function loadTurns() {
    const turns = [];
    for (const filePath of listTurnFiles(AUDIO_REVISIONS_ROOT)) {
        const data = readJson(filePath);
        for (const [index, turn] of data.turns.entries()) {
            turns.push({
                revisionId: data.revisionId,
                scopeId: data.scopeId,
                sequenceIndex: data.sequenceIndex,
                eventId: data.eventId,
                locale: data.locale,
                role: turn.role,
                turnIndex: index + 1,
                text: turn.text,
                path: relativeToRoot(filePath)
            });
        }
    }
    return turns;
}

function overlaps(range, coveredRanges) {
    return coveredRanges.some((covered) => range.start >= covered.start && range.end <= covered.end);
}

function candidateIsCovered(range, text, coveredRanges) {
    for (let index = range.start; index < range.end; index += 1) {
        if (!/[A-Za-z0-9]/u.test(text[index])) continue;
        if (!coveredRanges.some((covered) => index >= covered.start && index < covered.end)) return false;
    }
    return true;
}

function scanUncoveredCandidates(text, coveredRanges, ignoredTerms) {
    const patterns = [
        /\b[A-Z]{2,}(?:[-/][A-Z0-9]+)*\b/gu,
        /\b[A-Z][a-z]+[A-Z][A-Za-z0-9-]*\b/gu,
        /\b[A-Za-z]+[0-9]+(?:[-.][A-Za-z0-9]+)*\b/gu
    ];
    const candidates = [];
    for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
            const range = { start: match.index, end: match.index + match[0].length };
            if (candidateIsCovered(range, text, coveredRanges) || ignoredTerms.has(match[0])) continue;
            candidates.push(match[0]);
        }
    }
    return [...new Set(candidates)];
}

function scanUncoveredChineseLatinTerms(text, coveredRanges, ignoredTerms) {
    const candidates = [];
    for (const match of text.matchAll(/[A-Za-z][A-Za-z0-9]*(?:(?:[-/+.]|\s+)[A-Za-z0-9]+)*/gu)) {
        const candidate = match[0].trim().replace(/[.,]+$/u, '');
        const range = { start: match.index, end: match.index + candidate.length };
        if (candidateIsCovered(range, text, coveredRanges) || ignoredTerms.has(candidate)) continue;
        candidates.push(candidate);
    }
    return [...new Set(candidates)];
}

function buildPersonCandidates(figures) {
    const candidates = new Map();
    for (const figure of figures) {
        if (figure.type !== 'person') continue;
        const names = [figure.name?.en, ...(figure.aliases || [])].filter(Boolean);
        for (const name of names) {
            candidates.set(name, figure.id);
        }

        const canonicalName = figure.name?.en?.replace(/\b(?:Jr|Sr)\.?$/u, '').trim();
        const surname = canonicalName
            ?.split(/\s+/u)
            .at(-1)
            ?.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/gu, '');
        if (surname?.length >= 4 && /^[A-Z]/u.test(surname)) candidates.set(surname, figure.id);
    }
    return [...candidates]
        .map(([candidate, figureId]) => ({ candidate, figureId, pattern: aliasPattern(candidate) }))
        .sort((left, right) => right.candidate.length - left.candidate.length);
}

function scanUncoveredPersonNames(turn, coveredRanges, personCandidates) {
    if (turn.locale !== 'en') return [];
    const candidates = [];
    for (const person of personCandidates) {
        for (const match of turn.text.matchAll(person.pattern)) {
            const range = { start: match.index, end: match.index + person.candidate.length };
            if (candidateIsCovered(range, turn.text, coveredRanges)) continue;
            candidates.push({ ...person, range });
        }
    }
    return candidates;
}

function buildInventory(glossary, turns, figures) {
    const compiledEntries = glossary.entries
        .map((entry) => ({
            entry,
            aliases: [...entry.aliases].sort((left, right) => right.length - left.length),
            patterns: new Map(entry.aliases.map((alias) => [alias, aliasPattern(alias)])),
            occurrences: []
        }))
        .sort(
            (left, right) =>
                Math.max(...right.aliases.map((alias) => alias.length)) -
                Math.max(...left.aliases.map((alias) => alias.length))
        );
    const unknownCandidates = [];
    const ignoredTerms = new Set(glossary.ignoredCandidateTerms || []);
    const personCandidates = buildPersonCandidates(figures);

    for (const turn of turns) {
        const coveredRanges = [];
        for (const compiled of compiledEntries) {
            for (const alias of compiled.aliases) {
                const pattern = compiled.patterns.get(alias);
                for (const match of turn.text.matchAll(pattern)) {
                    const range = { start: match.index, end: match.index + alias.length };
                    range.end += turn.text.slice(range.end).match(/^-[a-z]+/u)?.[0].length || 0;
                    if (overlaps(range, coveredRanges)) continue;
                    coveredRanges.push(range);
                    compiled.occurrences.push({ ...turn, alias });
                }
            }
        }
        const candidates =
            turn.locale === 'zh'
                ? scanUncoveredChineseLatinTerms(turn.text, coveredRanges, ignoredTerms)
                : scanUncoveredCandidates(turn.text, coveredRanges, ignoredTerms);
        for (const candidate of candidates) {
            unknownCandidates.push({ ...turn, candidate, kind: 'formatted-term' });
        }
        for (const person of scanUncoveredPersonNames(turn, coveredRanges, personCandidates)) {
            unknownCandidates.push({
                ...turn,
                candidate: person.candidate,
                kind: 'person-name',
                figureId: person.figureId
            });
        }
    }

    const entries = compiledEntries
        .filter(({ occurrences }) => occurrences.length > 0)
        .map(({ entry, occurrences }) => {
            const locales = {};
            for (const locale of ['zh', 'en']) {
                const selected = occurrences.filter((occurrence) => occurrence.locale === locale);
                locales[locale] = {
                    count: selected.length,
                    eventIds: [...new Set(selected.map((occurrence) => occurrence.eventId))].sort(),
                    occurrences: selected
                };
            }
            return {
                id: entry.id,
                term: entry.term,
                aliases: entry.aliases,
                category: entry.category,
                hintRequired: entry.hintRequired,
                verification: {
                    level: entry.verification,
                    ...glossary.verificationLevels[entry.verification],
                    ...(entry.evidence ? { evidence: entry.evidence } : {})
                },
                reading: {
                    ...entry.reading,
                    prompts: {
                        zh: `文案中的“${entry.term}”保持原样，读作“${entry.reading.spoken}”。`,
                        en: `Keep “${entry.term}” unchanged and pronounce it as “${entry.reading.spoken}”.`
                    }
                },
                ...(entry.ttsQualifications ? { ttsQualifications: entry.ttsQualifications } : {}),
                ...(entry.ttsExclusions ? { ttsExclusions: entry.ttsExclusions } : {}),
                ...(entry.pronunciationHypotheses ? { pronunciationHypotheses: entry.pronunciationHypotheses } : {}),
                locales
            };
        });

    const unmatchedGlossaryIds = compiledEntries
        .filter(({ occurrences }) => occurrences.length === 0)
        .map(({ entry }) => entry.id);
    return {
        schemaVersion: 1,
        source: {
            turnsRoot: 'audio/revisions',
            turnFileCount: new Set(turns.map((turn) => turn.path)).size,
            turnCount: turns.length,
            localeCounts: Object.fromEntries(
                ['zh', 'en'].map((locale) => [locale, turns.filter((turn) => turn.locale === locale).length])
            )
        },
        summary: {
            glossaryEntryCount: glossary.entries.length,
            matchedEntryCount: entries.length,
            unmatchedEntryCount: unmatchedGlossaryIds.length,
            unknownCandidateCount: unknownCandidates.length,
            occurrenceCount: entries.reduce((sum, entry) => sum + entry.locales.zh.count + entry.locales.en.count, 0),
            hintRequiredEntryCount: entries.filter((entry) => entry.hintRequired).length,
            categories: Object.fromEntries(
                [...new Set(entries.map((entry) => entry.category))]
                    .sort()
                    .map((category) => [category, entries.filter((entry) => entry.category === category).length])
            )
        },
        unmatchedGlossaryIds,
        unknownCandidates,
        entries
    };
}

async function main() {
    const glossary = readJson(GLOSSARY_PATH);
    validateGlossary(glossary);
    const inventory = buildInventory(glossary, loadTurns(), readJson(FIGURES_PATH));
    const prettierConfig = (await prettier.resolveConfig(INVENTORY_PATH)) || {};
    const output = await prettier.format(JSON.stringify(inventory), {
        ...prettierConfig,
        filepath: INVENTORY_PATH
    });

    if (inventory.unknownCandidates.length > 0) {
        const grouped = new Map();
        for (const item of inventory.unknownCandidates) {
            const contexts = grouped.get(item.candidate) || new Set();
            contexts.add(`${item.locale}/${item.eventId}`);
            grouped.set(item.candidate, contexts);
        }
        const sample = [...grouped]
            .map(([candidate, contexts]) => `${candidate} (${[...contexts].join(', ')})`)
            .join(', ');
        fail(`${inventory.unknownCandidates.length} uncovered pronunciation candidate(s): ${sample}`);
    }
    if (inventory.unmatchedGlossaryIds.length > 0) {
        fail(`glossary entries do not occur in audio turns: ${inventory.unmatchedGlossaryIds.join(', ')}`);
    }

    if (CHECK) {
        if (!fs.existsSync(INVENTORY_PATH)) fail('pronunciation inventory has not been generated');
        if (fs.readFileSync(INVENTORY_PATH, 'utf8') !== output) fail('pronunciation inventory is out of sync');
        console.log(`Pronunciation inventory is synchronized: ${inventory.summary.matchedEntryCount} terms.`);
        return;
    }

    fs.mkdirSync(path.dirname(INVENTORY_PATH), { recursive: true });
    fs.writeFileSync(INVENTORY_PATH, output);
    console.log(
        `Built pronunciation inventory: ${inventory.summary.matchedEntryCount} terms, ${inventory.summary.occurrenceCount} occurrences.`
    );
}

try {
    await main();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
