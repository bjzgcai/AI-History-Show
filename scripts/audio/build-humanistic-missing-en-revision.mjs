#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '../..');
const require = createRequire(import.meta.url);
const { resolveEffectivePresentation } = require('../archive-presentation');
const STORYLINE_ID = 'humanistic-cycle';
const REVISION_ID = 'humanistic-missing-en-volc-v1-2026-09-14';
const OUTPUT_DIR = path.join(ROOT, 'audio/revisions/humanistic-missing-en-volc-v1/turns/en');
const ZH_TURNS_DIR = path.join(ROOT, 'audio/revisions/humanistic-missing-zh-volc-v4/turns/zh');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanText(value) {
    return String(value || '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function dateLabel(event) {
    return String(event.date || event.year);
}

function evidence(section, presentation) {
    return {
        sourceIds: section.sourceIds?.length ? section.sourceIds : presentation.sourceIds?.slice(0, 1) || [],
        claimIds: presentation.claimIds || []
    };
}

function makeTurn(role, text, details = {}) {
    return {
        role,
        text,
        sourceIds: details.sourceIds || [],
        claimIds: details.claimIds || [],
        contentOrigin: details.contentOrigin || 'editorial'
    };
}

function focusText(section, fallback) {
    const text = cleanText(section?.html?.en || fallback);
    const firstSentence = text.split(/[.!?;]/u)[0].trim();
    if (
        /^(Researchers generally|The work or theory turns|It turns artificial|Researchers usually|Scholars generally)/u.test(
            firstSentence
        )
    ) {
        return fallback;
    }
    return (firstSentence || text).slice(0, 48);
}

const OPENINGS = [
    (date, title, focus) =>
        `In ${date}, ${title} brought “${focus}” into the conversation about artificial intelligence and human imagination. Let us start with that concrete clue.`,
    (date, title, focus) =>
        `Following the timeline to ${date}, we arrive at ${title}, where “${focus}” becomes a cultural question rather than a technical footnote.`,
    (date, title, focus) =>
        `Turn back to ${date}: ${title} begins with “${focus}” and asks us to rethink the relationship between machines, minds, and people.`,
    (date, title, focus) =>
        `At the ${date} point on this timeline, ${title} offers a way to look closely at “${focus}”. Why does it still matter?`,
    (date, title, focus) =>
        `Seen through “${focus}”, ${title} is more than a work or concept from ${date}; it is a question about artificial intelligence.`,
    (date, title, focus) =>
        `${title} appeared in ${date} and made “${focus}” an experience that could be discussed, not just an abstraction.`,
    (date, title, focus) =>
        `Today we return to ${date} and use ${title} to follow how “${focus}” entered technical culture and reached later generations.`,
    (date, title, focus) =>
        `${title}, first appearing in ${date}, opens a new view of the humanities of AI: what does “${focus}” really mean?`
];

const CORE_QUESTIONS = [
    (title, focus) =>
        `Let us focus on “${focus}”: in ${title}, which part of our understanding of machines does it change?`,
    (title, focus) => `If we reduce ${title} to one concrete question, does the answer begin with “${focus}”?`,
    (title, focus) => `The detail listeners may miss is “${focus}”. Why does it become central to ${title}?`,
    (title, focus) => `Starting from “${focus}”, how should we explain the core mechanism or judgment in ${title}?`,
    (title, focus) => `Before we draw a conclusion, how does ${title} make “${focus}” perceptible?`,
    (title, focus) => `When we talk about ${title}, what deeper relationship lies behind “${focus}”?`,
    (title, focus) => `What does “${focus}” reveal about ${title}'s disagreement with ideas of its own time?`,
    (title, focus) =>
        `It may sound like a small detail, but how does “${focus}” support ${title}'s view of artificial intelligence?`
];

const LEGACY_QUESTIONS = [
    (title, focus) => `Where does “${focus}” still appear in AI systems today?`,
    (title, focus) =>
        `${title} left more than a reputation behind. What did later thinkers actually inherit from “${focus}”?`,
    (title, focus) => `Looking across time, which part of ${title}'s warning about “${focus}” still holds?`,
    (title, focus) => `How should we assess ${title}'s influence and limits through the lens of “${focus}”?`,
    (title, focus) =>
        `Why did the idea cross its original era? The answer may begin with how “${focus}” changed afterward.`,
    (title, focus) =>
        `When current systems encounter “${focus}” again, what can they inherit from ${title}, and what must they revise?`,
    (title, focus) =>
        `If one long-term question remains, it is how “${focus}” changed the way we talk about artificial intelligence.`
];

const OPEN_QUESTIONS = [
    (title, focus) => `As systems encounter “${focus}” again, what should we still ask of ${title}?`,
    (title, focus) =>
        `If artificial intelligence keeps developing, how should ${title}'s judgment about “${focus}” be tested again?`,
    (title, focus) => `Faced with “${focus}”, are we extending ${title}'s idea, or taking a different path?`,
    (title, focus) =>
        `“${focus}” still has no simple answer. Which question left by ${title} deserves the closest follow-up?`,
    (title, focus) =>
        `Starting from ${title}, how should the next generation of AI handle the tension contained in “${focus}”?`,
    (title, focus) => `When “${focus}” enters real life, do the boundaries identified by ${title} still hold?`
];

const SUMMARIES = [
    (title, focus) => `${title}'s lasting insight is to make “${focus}” a question that can be revisited.`,
    (title, focus) =>
        `If we remember one thing about ${title}, it is how “${focus}” entered the humanistic view of artificial intelligence.`,
    (title, focus) =>
        `Years later, ${title} still reminds us through “${focus}” that questions about machines are also questions about people.`,
    (title, focus) =>
        `${title} matters not only for what it said then, but for the continuing doorway it left open around “${focus}”.`,
    (title, focus) =>
        `Returning to ${title}, we can see that “${focus}” did not disappear; it kept returning in new forms.`,
    (title, focus) =>
        `${title} handed “${focus}” to later researchers and creators as a long thread in the cultural history of AI.`
];

const ECHOES = [
    (previous, title, focus) =>
        `From ${previous} to ${title}, the question of “${focus}” changes its setting but does not disappear.`,
    (previous, title, focus) =>
        `The thread raised by ${previous} turns back in ${title}, giving “${focus}” a new meaning.`,
    (previous, title, focus) =>
        `Placed beside ${previous}, ${title} shows how “${focus}” keeps shaping humanistic discussions of AI.`,
    (previous, title, focus) =>
        `Between ${previous} and ${title} we hear a historical echo: every discussion of “${focus}” redraws the boundary of the human.`
];

function buildTurns(event, presentation, assignment, previousTitle, nextTitle, index) {
    const title = presentation.displayTitle?.en || event.title.en;
    const sections = presentation.commentarySections || [];
    const selected = ['historical-background', 'core-idea', 'long-term-legacy']
        .map((id) => sections.find((section) => section.id === id))
        .filter(Boolean);
    if (selected.length !== 3) throw new Error(`${event.id} is missing English commentary sections`);
    const historicalFocus = focusText(selected[0], title);
    const coreFocus = focusText(selected[1], title);
    const legacyFocus = focusText(selected[2], title);
    const sharedEvidence = {
        sourceIds: [...new Set(selected.flatMap((section) => evidence(section, presentation).sourceIds))],
        claimIds: presentation.claimIds || []
    };
    const sectionTurn = (role, section) =>
        makeTurn(role, cleanText(section.html?.en), {
            ...evidence(section, presentation),
            contentOrigin: `commentarySections.${section.id}`
        });
    const introRole = assignment.format === 'dialogue' ? 'A' : 'N';
    const body =
        assignment.format === 'narration'
            ? selected.map((section) => sectionTurn('N', section))
            : assignment.format === 'hybrid'
              ? [
                    sectionTurn('N', selected[0]),
                    makeTurn('A', CORE_QUESTIONS[index % CORE_QUESTIONS.length](title, coreFocus)),
                    sectionTurn('B', selected[1]),
                    sectionTurn('N', selected[2])
                ]
              : [
                    sectionTurn('B', selected[0]),
                    makeTurn('A', CORE_QUESTIONS[index % CORE_QUESTIONS.length](title, coreFocus)),
                    sectionTurn('B', selected[1]),
                    makeTurn('A', LEGACY_QUESTIONS[index % LEGACY_QUESTIONS.length](title, legacyFocus)),
                    sectionTurn('B', selected[2])
                ];
    let closing;
    if (assignment.closingType === 'summary') {
        closing = makeTurn('SUMMARY', SUMMARIES[index % SUMMARIES.length](title, legacyFocus), {
            ...sharedEvidence,
            contentOrigin: 'editorial-closing'
        });
    } else if (assignment.closingType === 'open-question') {
        closing = makeTurn(
            assignment.format === 'dialogue' ? 'A' : 'N',
            OPEN_QUESTIONS[index % OPEN_QUESTIONS.length](title, legacyFocus),
            { ...sharedEvidence, contentOrigin: 'editorial-closing' }
        );
    } else if (assignment.closingType === 'forward-hook' && nextTitle) {
        closing = makeTurn(
            assignment.format === 'dialogue' ? 'B' : 'N',
            `Next comes ${nextTitle}, where we will follow how “${legacyFocus}” enters a new historical setting.`,
            { contentOrigin: 'storyline-sequence' }
        );
    } else {
        closing = makeTurn(
            assignment.format === 'dialogue' ? 'B' : 'N',
            previousTitle
                ? ECHOES[index % ECHOES.length](previousTitle, title, legacyFocus)
                : `${title} leaves “${legacyFocus}” as a question that will return in later choices about AI.`,
            { ...sharedEvidence, contentOrigin: 'editorial-closing' }
        );
    }
    return [
        makeTurn(introRole, OPENINGS[index % OPENINGS.length](dateLabel(event), title, historicalFocus), {
            contentOrigin: 'editorial-hook'
        }),
        ...body,
        closing
    ];
}

async function writeFrozenJson(filePath, value) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(`${JSON.stringify(value, null, 2)}\n`, { ...config, filepath: filePath });
    if (fs.existsSync(filePath)) {
        if (fs.readFileSync(filePath, 'utf8') !== formatted) throw new Error(`Refusing to overwrite ${filePath}`);
        return false;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, formatted, { encoding: 'utf8', flag: 'wx' });
    return true;
}

async function main() {
    const storyline = readJson(path.join(ROOT, 'archive/storylines', `${STORYLINE_ID}.json`));
    const entries = storyline.events.filter((entry) => entry.enabled !== false).sort((a, b) => a.order - b.order);
    const zhFiles = fs.readdirSync(ZH_TURNS_DIR).filter((name) => name.endsWith('.json'));
    const assignments = new Map(
        zhFiles.map((name) => {
            const turn = readJson(path.join(ZH_TURNS_DIR, name));
            return [
                turn.eventId,
                { format: turn.format, closingType: turn.closingType, sequenceIndex: turn.sequenceIndex }
            ];
        })
    );
    const selected = entries.filter((entry) => assignments.has(entry.eventId));
    if (selected.length !== 47) throw new Error(`Expected 47 English events, found ${selected.length}`);
    let created = 0;
    const expectedFiles = new Set();
    for (let index = 0; index < selected.length; index += 1) {
        const entry = selected[index];
        const assignment = assignments.get(entry.eventId);
        const eventDir = path.join(ROOT, 'archive/events', entry.eventId);
        const event = readJson(path.join(eventDir, 'event.json'));
        const presentation = resolveEffectivePresentation({
            root: ROOT,
            eventDir,
            event,
            eventId: entry.eventId,
            storylineId: STORYLINE_ID,
            ref: entry
        }).presentation;
        const entryIndex = entries.findIndex((candidate) => candidate.eventId === entry.eventId);
        const previousEntry = entries[entryIndex - 1];
        const nextEntry = entries[entryIndex + 1];
        const titleFor = (candidate) => {
            if (!candidate) return null;
            const candidateDir = path.join(ROOT, 'archive/events', candidate.eventId);
            const candidateEvent = readJson(path.join(candidateDir, 'event.json'));
            const candidatePresentation = resolveEffectivePresentation({
                root: ROOT,
                eventDir: candidateDir,
                event: candidateEvent,
                eventId: candidate.eventId,
                storylineId: STORYLINE_ID,
                ref: candidate
            }).presentation;
            return candidatePresentation.displayTitle?.en || candidateEvent.title.en;
        };
        const fileName = `${String(assignment.sequenceIndex).padStart(3, '0')}-${entry.eventId}.json`;
        expectedFiles.add(fileName);
        if (
            await writeFrozenJson(path.join(OUTPUT_DIR, fileName), {
                schemaVersion: 1,
                revisionId: REVISION_ID,
                scopeId: STORYLINE_ID,
                sequenceIndex: assignment.sequenceIndex,
                eventId: entry.eventId,
                variantId: entry.variant || STORYLINE_ID,
                locale: 'en',
                mode: 'storyline',
                format: assignment.format,
                closingType: assignment.closingType,
                styleAuthority: STORYLINE_ID,
                turns: buildTurns(event, presentation, assignment, titleFor(previousEntry), titleFor(nextEntry), index)
            })
        )
            created += 1;
    }
    const unexpected = fs.readdirSync(OUTPUT_DIR).filter((name) => name.endsWith('.json') && !expectedFiles.has(name));
    if (unexpected.length) throw new Error(`Unexpected English turn files: ${unexpected.join(', ')}`);
    console.log(`Verified ${selected.length} humanistic English turn files; created ${created}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
