#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'scripts', 'ai100-first-40-and-gaming');
const MANIFEST_PATH = path.join(OUTPUT_ROOT, 'manifest.json');
const PLAN_PATH = path.join(ROOT, 'resources', 'audio', 'plans', 'ai100-first-40-and-gaming', 'editorial-plan.json');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const VALID_ROLES = new Set(['A', 'B', 'N', 'SUMMARY']);
const LOCALES = ['zh', 'en'];
const MODES = ['standalone', 'storyline'];

function collectArchiveSourceIds() {
    const result = new Set();
    for (const eventId of fs.readdirSync(ARCHIVE_EVENTS)) {
        const sourcesPath = path.join(ARCHIVE_EVENTS, eventId, 'sources.json');
        if (!fs.existsSync(sourcesPath)) continue;
        for (const source of readJson(sourcesPath)) result.add(source.id);
    }
    return result;
}

const ALL_ARCHIVE_SOURCE_IDS = collectArchiveSourceIds();

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stable(value) {
    return JSON.stringify(value);
}

function allTurns(event, locale, mode) {
    const content = event.locales[locale];
    const intro = mode === 'standalone' ? content.standaloneIntro : content.storylineBridgeIn;
    return [...intro, ...content.body, ...content.closing];
}

function validateRoles(event, turns, context, errors) {
    for (const item of turns) {
        if (!VALID_ROLES.has(item.role)) errors.push(`${context}: invalid role ${item.role}`);
        if (!String(item.text || '').trim()) errors.push(`${context}: empty turn text`);
        if (/<[^>]+>/.test(item.text)) errors.push(`${context}: HTML remains in speech text`);
    }
    const roles = new Set(turns.map((item) => item.role));
    if (event.format === 'dialogue' && (!roles.has('A') || !roles.has('B'))) {
        errors.push(`${context}: dialogue requires both A and B`);
    }
    if (event.format === 'narration' && [...roles].some((role) => !['N', 'SUMMARY'].includes(role))) {
        errors.push(`${context}: narration contains dialogue roles`);
    }
    if (event.format === 'hybrid' && (!roles.has('N') || (!roles.has('A') && !roles.has('B')))) {
        errors.push(`${context}: hybrid requires narrator and dialogue participation`);
    }
}

function validateCompiledFile(event, locale, mode, turns, errors) {
    const relativePath = event.compiledPaths[locale][mode];
    const filePath = path.join(OUTPUT_ROOT, relativePath);
    if (!fs.existsSync(filePath)) {
        errors.push(`${event.scopeId}/${event.eventId}: missing ${relativePath}`);
        return;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const expectedLineCount = turns.length;
    const actualLines = source.split(/\r?\n/).filter(Boolean);
    if (actualLines.length !== expectedLineCount) {
        errors.push(`${relativePath}: expected ${expectedLineCount} turns, got ${actualLines.length}`);
    }
    const pattern = locale === 'zh' ? /^(A|B|N|总结)：/ : /^(A|B|N|Summary):/;
    for (const [index, line] of actualLines.entries()) {
        if (!pattern.test(line)) errors.push(`${relativePath}:${index + 1}: invalid A/B/N label`);
    }
}

function validateEvidence(event, planEvent, errors) {
    const sources = readJson(path.join(ARCHIVE_EVENTS, event.eventId, 'sources.json'));
    const claims = readJson(path.join(ARCHIVE_EVENTS, event.eventId, 'claims.json'));
    const sourceIds = new Set(sources.map((source) => source.id));
    const claimIds = new Set(claims.map((claim) => claim.id));
    if (stable(event.sourceIds) !== stable(planEvent.audit.selectedSourceIds)) {
        errors.push(`${event.scopeId}/${event.eventId}: selected source IDs drifted from editorial plan`);
    }
    if (stable(event.claimIds) !== stable(planEvent.audit.selectedClaimIds)) {
        errors.push(`${event.scopeId}/${event.eventId}: selected claim IDs drifted from editorial plan`);
    }
    for (const locale of LOCALES) {
        const turns = [
            ...event.locales[locale].standaloneIntro,
            ...event.locales[locale].storylineBridgeIn,
            ...event.locales[locale].body,
            ...event.locales[locale].closing
        ];
        for (const item of turns) {
            for (const sourceId of item.sourceIds) {
                const allowedSourceIds =
                    item.contentOrigin === 'relationship-candidate' ? ALL_ARCHIVE_SOURCE_IDS : sourceIds;
                if (!allowedSourceIds.has(sourceId)) {
                    errors.push(`${event.scopeId}/${event.eventId}/${locale}: missing source ${sourceId}`);
                }
            }
            for (const claimId of item.claimIds) {
                if (!claimIds.has(claimId)) {
                    errors.push(`${event.scopeId}/${event.eventId}/${locale}: missing claim ${claimId}`);
                }
            }
            if (item.contentOrigin.startsWith('variant.') && item.sourceIds.length === 0) {
                errors.push(`${event.scopeId}/${event.eventId}/${locale}: factual section has no source IDs`);
            }
        }
    }
}

function validateEvent(event, planEvent, errors) {
    const context = `${event.scopeId}/${event.eventId}`;
    if (event.variantId !== planEvent.effectiveVariantId) errors.push(`${context}: variant does not match plan`);
    if (event.styleAuthority !== planEvent.styleAuthority)
        errors.push(`${context}: style authority does not match plan`);
    if (event.format !== planEvent.editorial.format) errors.push(`${context}: format does not match plan`);
    if (event.closingType !== planEvent.editorial.closingType) errors.push(`${context}: closing does not match plan`);
    if (!event.title?.zh || !event.title?.en) errors.push(`${context}: title is not bilingual`);
    if (!fs.existsSync(path.join(OUTPUT_ROOT, event.structuredPath))) {
        errors.push(`${context}: structured file is missing`);
    }
    validateEvidence(event, planEvent, errors);
    for (const locale of LOCALES) {
        const content = event.locales[locale];
        if (!content) {
            errors.push(`${context}: missing locale ${locale}`);
            continue;
        }
        for (const mode of MODES) {
            const turns = allTurns(event, locale, mode);
            validateRoles(event, turns, `${context}/${locale}/${mode}`, errors);
            validateCompiledFile(event, locale, mode, turns, errors);
            const duration = content.estimates[`${mode}Sec`];
            if (!Number.isFinite(duration) || duration < 40 || duration > 150) {
                errors.push(`${context}/${locale}/${mode}: estimated duration ${duration}s is outside 40-150s`);
            }
        }
        const closingRoles = new Set(content.closing.map((item) => item.role));
        if (event.closingType === 'summary' && !closingRoles.has('SUMMARY')) {
            errors.push(`${context}/${locale}: summary closing must use SUMMARY label`);
        }
        if (event.closingType === 'open-question' && closingRoles.has('SUMMARY')) {
            errors.push(`${context}/${locale}: open question must not use SUMMARY label`);
        }
    }
}

function main() {
    if (!fs.existsSync(MANIFEST_PATH)) throw new Error(`Missing ${path.relative(ROOT, MANIFEST_PATH)}`);
    const manifest = readJson(MANIFEST_PATH);
    const plan = readJson(PLAN_PATH);
    const errors = [];
    const bodiesByAuthority = new Map();
    let eventCount = 0;
    let compiledCount = 0;
    let archiveReviewCount = 0;

    for (const [scopeId, scope] of Object.entries(manifest.scopes)) {
        const planEvents = plan.scopes[scopeId].events;
        if (scope.events.length !== planEvents.length) {
            errors.push(`${scopeId}: expected ${planEvents.length} events, got ${scope.events.length}`);
        }
        for (const [index, event] of scope.events.entries()) {
            const planEvent = planEvents[index];
            if (!planEvent || event.eventId !== planEvent.eventId) {
                errors.push(`${scopeId}/${index + 1}: event order differs from editorial plan`);
                continue;
            }
            validateEvent(event, planEvent, errors);
            eventCount += 1;
            compiledCount += LOCALES.length * MODES.length;
            if (event.archiveAudit.status !== 'ready') archiveReviewCount += 1;
            const authorityKey = `${event.eventId}/${event.variantId}/${event.styleAuthority}`;
            const body = stable({ zh: event.locales.zh.body, en: event.locales.en.body });
            if (bodiesByAuthority.has(authorityKey) && bodiesByAuthority.get(authorityKey) !== body) {
                errors.push(`${scopeId}/${event.eventId}: overlapping event body drifted from its authority script`);
            }
            bodiesByAuthority.set(authorityKey, body);
        }
    }

    if (errors.length) {
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }
    console.log(
        `Audio story scripts valid: ${eventCount} scoped packages, ${compiledCount} compiled bilingual inputs, ${archiveReviewCount} packages retain Archive review warnings.`
    );
}

main();
