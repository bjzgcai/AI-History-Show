#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PLAN_PATH = path.join(ROOT, 'resources', 'audio', 'plans', 'ai100-first-40-and-gaming', 'editorial-plan.json');
const STORYLINE_DIR = path.join(ROOT, 'archive', 'storylines');
const AI100_ID = 'bench-council-ai100';
const GAMING_ID = 'gaming-ai';
const VALID_FORMATS = new Set(['dialogue', 'narration', 'hybrid']);
const VALID_CLOSINGS = new Set(['summary', 'open-question', 'forward-hook', 'historical-echo']);

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(errors) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

function enabledEntries(storylineId) {
    return readJson(path.join(STORYLINE_DIR, `${storylineId}.json`)).events.filter((entry) => entry.enabled);
}

function maxRun(events) {
    let maximum = 0;
    let current = 0;
    let previous = null;
    for (const event of events) {
        if (event.editorial.format === previous) current += 1;
        else current = 1;
        previous = event.editorial.format;
        maximum = Math.max(maximum, current);
    }
    return maximum;
}

function main() {
    if (!fs.existsSync(PLAN_PATH)) fail([`Plan does not exist: ${path.relative(ROOT, PLAN_PATH)}`]);
    const plan = readJson(PLAN_PATH);
    const errors = [];
    const ai100Entries = enabledEntries(AI100_ID)
        .map((entry, sourceIndex) => ({ ...entry, sourceIndex }))
        .sort((left, right) => left.order - right.order || left.sourceIndex - right.sourceIndex)
        .slice(0, 40);
    const gamingEntries = enabledEntries(GAMING_ID);
    const ai100Members = new Set(enabledEntries(AI100_ID).map((entry) => entry.eventId));
    const ai100Events = plan.scopes?.[AI100_ID]?.events || [];
    const gamingEvents = plan.scopes?.[GAMING_ID]?.events || [];

    if (ai100Events.length !== 40) errors.push(`AI100 scope must contain 40 events; got ${ai100Events.length}`);
    if (gamingEvents.length !== gamingEntries.length) {
        errors.push(`Gaming scope must contain ${gamingEntries.length} events; got ${gamingEvents.length}`);
    }

    const expectedAi100Ids = ai100Entries.map((entry) => entry.eventId);
    const actualAi100Ids = ai100Events.map((event) => event.eventId);
    if (JSON.stringify(expectedAi100Ids) !== JSON.stringify(actualAi100Ids)) {
        errors.push('AI100 event order does not match the first 40 enabled storyline entries');
    }

    const expectedGamingIds = gamingEntries.map((entry) => entry.eventId);
    const actualGamingIds = gamingEvents.map((event) => event.eventId);
    if (JSON.stringify(expectedGamingIds) !== JSON.stringify(actualGamingIds)) {
        errors.push('Gaming event order does not match enabled storyline source order');
    }

    for (const [scopeId, events] of [
        [AI100_ID, ai100Events],
        [GAMING_ID, gamingEvents]
    ]) {
        const ids = new Set();
        for (const event of events) {
            if (ids.has(event.eventId)) errors.push(`${scopeId} contains duplicate event ${event.eventId}`);
            ids.add(event.eventId);
            if (!VALID_FORMATS.has(event.editorial?.format)) {
                errors.push(`${scopeId}/${event.eventId} has invalid format ${event.editorial?.format}`);
            }
            if (!VALID_CLOSINGS.has(event.editorial?.closingType)) {
                errors.push(`${scopeId}/${event.eventId} has invalid closing ${event.editorial?.closingType}`);
            }
            const duration = event.editorial?.targetDurationSec;
            if (!Number.isFinite(duration) || duration < 40 || duration > 150) {
                errors.push(`${scopeId}/${event.eventId} has invalid target duration ${duration}`);
            }
            if (event.audit?.status === 'blocked') {
                errors.push(`${scopeId}/${event.eventId} has blocked Archive references`);
            }
        }
        const maximum = maxRun(events);
        if (maximum > 3) errors.push(`${scopeId} has ${maximum} consecutive events with the same format`);
    }

    for (const event of gamingEvents) {
        const overlap = ai100Members.has(event.eventId);
        if (overlap && event.effectiveVariantId !== AI100_ID) {
            errors.push(`Gaming overlap ${event.eventId} must use ${AI100_ID} variant`);
        }
        if (overlap && event.styleAuthority !== AI100_ID) {
            errors.push(`Gaming overlap ${event.eventId} must use ${AI100_ID} style authority`);
        }
        if (!overlap && event.effectiveVariantId !== GAMING_ID) {
            errors.push(`Gaming-only event ${event.eventId} must use ${GAMING_ID} variant`);
        }
    }

    for (const [scopeId, scope] of Object.entries(plan.scopes || {})) {
        const eventIds = new Set((scope.events || []).map((event) => event.eventId));
        for (const relation of scope.relations || []) {
            if (!eventIds.has(relation.fromEventId) || !eventIds.has(relation.toEventId)) {
                errors.push(
                    `${scopeId} relation has endpoint outside scope: ${relation.fromEventId} -> ${relation.toEventId}`
                );
            }
            if (!relation.sourceReviewRequired) {
                errors.push(`${scopeId} relation must remain source-review-required before script writing`);
            }
        }
    }

    if (errors.length) fail(errors);
    console.log(
        `Audio editorial plan valid: ${ai100Events.length} AI100 events, ${gamingEvents.length} gaming events, overlap priority enforced.`
    );
}

main();
