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
const REVISION_ID = 'humanistic-missing-zh-volc-v4-2026-09-14';
const OUTPUT_DIR = path.join(ROOT, 'audio/revisions/humanistic-missing-zh-volc-v4/turns/zh');
const EVENT_IDS = [
    'sandman-1816',
    'descartes-automata',
    'jaquet-droz-automata',
    'frankenstein-1818',
    'darwin-among-machines-1863',
    'erewhon-1872',
    'impressions-theophrastus-1879',
    'future-eve-1886',
    'new-china-future-1902',
    'humanistic-1950-i-robot',
    'humanistic-computationalism-1950',
    'humanistic-1962-a-michael-noll',
    'humanistic-1966-17-babel-17',
    'humanistic-1967-event',
    'humanistic-1968-event',
    'humanistic-1972-dreyfus',
    'humanistic-1990-chinese-nation',
    'humanistic-1979-event',
    'humanistic-1979-geb',
    'humanistic-1980-event',
    'humanistic-1981-event',
    'humanistic-1984-event',
    'humanistic-1985-cyborg-manifesto',
    'humanistic-1998-event',
    'humanistic-1988-mind-children',
    'humanistic-1989-event',
    'humanistic-1990-event',
    'humanistic-1991-event',
    'humanistic-1991-ghost-shell',
    'humanistic-1992-event',
    'humanistic-1993-singularity',
    'humanistic-1993-event',
    'humanistic-1995-event',
    'humanistic-1995-hard-problem',
    'humanistic-1998-extended-mind',
    'humanistic-1999-event',
    'humanistic-2001-event',
    'humanistic-2003-event',
    'humanistic-2008-event',
    'humanistic-2010-teamlab',
    'humanistic-2012-event',
    'humanistic-2013-event',
    'humanistic-2014-superintelligence',
    'humanistic-2025-ai',
    'humanistic-2021-event',
    'humanistic-2022-reality-plus',
    'humanistic-2025-iit-ai'
];

const EDITORIAL = {
    'sandman-1816': ['hybrid', 'summary'],
    'descartes-automata': ['dialogue', 'open-question'],
    'jaquet-droz-automata': ['hybrid', 'forward-hook'],
    'frankenstein-1818': ['narration', 'historical-echo'],
    'darwin-among-machines-1863': ['dialogue', 'open-question'],
    'erewhon-1872': ['narration', 'forward-hook'],
    'impressions-theophrastus-1879': ['hybrid', 'historical-echo'],
    'future-eve-1886': ['dialogue', 'summary'],
    'new-china-future-1902': ['narration', 'open-question'],
    'humanistic-1950-i-robot': ['hybrid', 'historical-echo'],
    'humanistic-computationalism-1950': ['dialogue', 'open-question'],
    'humanistic-1962-a-michael-noll': ['narration', 'summary'],
    'humanistic-1966-17-babel-17': ['hybrid', 'forward-hook'],
    'humanistic-1967-event': ['narration', 'historical-echo'],
    'humanistic-1968-event': ['dialogue', 'open-question'],
    'humanistic-1972-dreyfus': ['dialogue', 'summary'],
    'humanistic-1990-chinese-nation': ['hybrid', 'historical-echo'],
    'humanistic-1979-event': ['narration', 'forward-hook'],
    'humanistic-1979-geb': ['dialogue', 'open-question'],
    'humanistic-1980-event': ['hybrid', 'summary'],
    'humanistic-1981-event': ['narration', 'historical-echo'],
    'humanistic-1984-event': ['hybrid', 'forward-hook'],
    'humanistic-1985-cyborg-manifesto': ['dialogue', 'open-question'],
    'humanistic-1998-event': ['narration', 'summary'],
    'humanistic-1988-mind-children': ['hybrid', 'historical-echo'],
    'humanistic-1989-event': ['dialogue', 'open-question'],
    'humanistic-1990-event': ['narration', 'forward-hook'],
    'humanistic-1991-event': ['dialogue', 'summary'],
    'humanistic-1991-ghost-shell': ['hybrid', 'historical-echo'],
    'humanistic-1992-event': ['narration', 'open-question'],
    'humanistic-1993-singularity': ['dialogue', 'forward-hook'],
    'humanistic-1993-event': ['hybrid', 'summary'],
    'humanistic-1995-event': ['narration', 'historical-echo'],
    'humanistic-1995-hard-problem': ['dialogue', 'open-question'],
    'humanistic-1998-extended-mind': ['hybrid', 'forward-hook'],
    'humanistic-1999-event': ['narration', 'summary'],
    'humanistic-2001-event': ['hybrid', 'historical-echo'],
    'humanistic-2003-event': ['dialogue', 'open-question'],
    'humanistic-2008-event': ['hybrid', 'forward-hook'],
    'humanistic-2010-teamlab': ['narration', 'summary'],
    'humanistic-2012-event': ['hybrid', 'historical-echo'],
    'humanistic-2013-event': ['dialogue', 'open-question'],
    'humanistic-2014-superintelligence': ['narration', 'forward-hook'],
    'humanistic-2025-ai': ['hybrid', 'summary'],
    'humanistic-2021-event': ['dialogue', 'historical-echo'],
    'humanistic-2022-reality-plus': ['narration', 'open-question'],
    'humanistic-2025-iit-ai': ['hybrid', 'summary']
};

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

function yearLabel(event) {
    const year = Number(event.year);
    if (year < 0) return `公元前${Math.abs(year)}年左右`;
    const date = String(event.date || year);
    if (date === '1983（短篇）；1985（长篇）') return '1983年发表短篇、1985年扩写为长篇时';
    if (date.includes('至今')) return date.replace(/^(\d{4})(?:—至|—|至)/, '$1年至');
    if (date.includes('世纪')) return date;
    return `${date}年`;
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
    const text = cleanText(section?.html?.zh || fallback);
    const firstSentence = text.split(/[。！？；]/u)[0].trim();
    if (/^(研究者通常把这一节点视为|作品或理论把人工制造|研究者通常把这类作品视为)/u.test(firstSentence)) {
        return fallback;
    }
    return (firstSentence || text).slice(0, 30);
}

const OPENING_TEMPLATES = [
    (date, title, focus) => `${date}，${title}把“${focus}”带入了人工智能与人文想象的讨论。先从这个具体线索看起。`,
    (date, title, focus) => `沿着${date}的时间线，我们先遇到${title}。它让“${focus}”成为一个无法绕开的文化问题。`,
    (date, title, focus) => `把镜头拨回${date}，${title}从“${focus}”出发，重新追问机器、心智与人的关系。`,
    (date, title, focus) => `在${date}这个节点，${title}提供了一种观察“${focus}”的方式。它为什么值得今天再听一遍？`,
    (date, title, focus) =>
        `如果从“${focus}”切入，${date}出现的${title}就不只是一个作品或概念，而是一道关于人工智能的提问。`,
    (date, title, focus) => `${title}出现在${date}，把“${focus}”从抽象想象变成了可以讨论的经验。它留下了什么？`,
    (date, title, focus) => `今天回到${date}，我们会通过${title}观察“${focus}”如何进入技术文化，并继续影响后来者。`,
    (date, title, focus) => `从${date}的${title}开始，人工智能人文史出现了一个新视角：${focus}究竟意味着什么？`
];

const CORE_QUESTIONS = [
    (title, focus) => `先抓住“${focus}”：在${title}里，它究竟改变了我们理解机器的哪一个角度？`,
    (title, focus) => `如果把${title}拆成一个具体问题，答案会落在“${focus}”上吗？`,
    (title, focus) => `听众最容易忽略的细节也许是“${focus}”。它为什么成为${title}的关键？`,
    (title, focus) => `从“${focus}”这个切口进入，${title}的核心机制或判断应该怎样说明？`,
    (title, focus) => `我们先不急着下结论：${title}如何把“${focus}”变成可感知的经验？`,
    (title, focus) => `当我们说到${title}，真正需要解释的，是“${focus}”背后的哪一层关系？`,
    (title, focus) => `把注意力放在“${focus}”上，能否看出${title}与同时代观念的分歧？`,
    (title, focus) => `“${focus}”看似只是一个细节，它怎样支撑起${title}关于人工智能的判断？`
];

const LEGACY_QUESTIONS = [
    (title, focus) => `放到今天再看，“${focus}”还在哪些人工智能场景里继续出现？`,
    (title, focus) => `这项作品或理论后来留下的，不只是名声。围绕“${focus}”，后人真正接住了什么？`,
    (title, focus) => `如果把时间拉长，${title}关于“${focus}”的提醒，哪些仍然有效？`,
    (title, focus) => `从“${focus}”延伸出去，我们今天应当怎样评价${title}的影响和边界？`,
    (title, focus) => `它为什么能越过原来的时代？也许要从“${focus}”在后来研究中的变化说起。`,
    (title, focus) => `当代系统再次遇到“${focus}”时，${title}提供了哪些可继承、又哪些需要修正的经验？`,
    (title, focus) => `如果只保留一个长期问题，那会是“${focus}”怎样改变了我们谈论人工智能的方式？`
];

const OPEN_QUESTION_TEMPLATES = [
    (title, focus) => `今天的系统再次触及“${focus}”时，我们还应向${title}追问什么？`,
    (title, focus) => `如果人工智能继续发展，${title}关于“${focus}”的判断需要怎样被重新检验？`,
    (title, focus) => `面对“${focus}”，我们是在延续${title}的设想，还是已经走向了另一条路？`,
    (title, focus) => `“${focus}”今天仍没有简单答案。${title}留下的哪一个问题最值得继续追踪？`,
    (title, focus) => `从${title}出发，人工智能的下一步应如何处理“${focus}”带来的张力？`,
    (title, focus) => `当“${focus}”进入真实生活，${title}提醒我们的边界是否仍然成立？`
];

const SUMMARY_TEMPLATES = [
    (title, focus) => `${title}最持久的启发，是把“${focus}”变成了可以反复讨论的问题。`,
    (title, focus) => `如果只记住${title}的一点，可以记住它如何让“${focus}”进入人工智能的人文视野。`,
    (title, focus) => `多年以后，${title}仍然从“${focus}”提醒我们：机器问题同时也是人的问题。`,
    (title, focus) => `因此，${title}的意义不止在当时的表达，也在于它为“${focus}”留下了持续追问的入口。`,
    (title, focus) => `回到${title}，我们看到“${focus}”并没有随时代消失，而是换了形式继续出现。`,
    (title, focus) => `${title}把“${focus}”留给后来的研究者和创作者，成为人工智能文化史的一条长线索。`
];

const ECHO_TEMPLATES = [
    (previous, title, focus) => `从${previous}走到${title}，关于“${focus}”的疑问换了语境，却没有消失。`,
    (previous, title, focus) => `${previous}提出的线索在${title}这里折返，“${focus}”因此有了新的含义。`,
    (previous, title, focus) => `把${previous}和${title}并置，会发现“${focus}”一直牵动着人工智能的人文讨论。`,
    (previous, title, focus) => `历史在${previous}与${title}之间留下了回声：每次谈论“${focus}”，都在重画人的边界。`
];

function buildTurns(event, presentation, format, closingType, previousTitle, nextTitle, authorityIndex) {
    const title = presentation.displayTitle?.zh || event.title.zh;
    const sections = presentation.commentarySections || [];
    const requiredIds = ['historical-background', 'core-idea', 'long-term-legacy'];
    const selected = requiredIds.map((id) => sections.find((section) => section.id === id)).filter(Boolean);
    if (selected.length !== requiredIds.length) {
        throw new Error(`${event.id} must provide historical-background, core-idea and long-term-legacy`);
    }

    const sharedEvidence = {
        sourceIds: [...new Set(selected.flatMap((section) => evidence(section, presentation).sourceIds))],
        claimIds: presentation.claimIds || []
    };
    const historicalFocus = focusText(selected[0], title);
    const coreFocus = focusText(selected[1], title);
    const legacyFocus = focusText(selected[2], title);
    const opening = OPENING_TEMPLATES[authorityIndex % OPENING_TEMPLATES.length](
        yearLabel(event),
        title,
        historicalFocus
    );
    const sectionTurn = (role, section) =>
        makeTurn(role, cleanText(section.html?.zh), {
            ...evidence(section, presentation),
            contentOrigin: `commentarySections.${section.id}`
        });
    const introRole = format === 'dialogue' ? 'A' : 'N';
    const intro = makeTurn(introRole, opening, { contentOrigin: 'editorial-hook' });
    let body;
    if (format === 'narration') {
        body = selected.map((section) => sectionTurn('N', section));
    } else if (format === 'hybrid') {
        body = [
            sectionTurn('N', selected[0]),
            makeTurn('A', CORE_QUESTIONS[authorityIndex % CORE_QUESTIONS.length](title, coreFocus)),
            sectionTurn('B', selected[1]),
            sectionTurn('N', selected[2])
        ];
    } else {
        body = [
            sectionTurn('B', selected[0]),
            makeTurn('A', CORE_QUESTIONS[authorityIndex % CORE_QUESTIONS.length](title, coreFocus)),
            sectionTurn('B', selected[1]),
            makeTurn('A', LEGACY_QUESTIONS[authorityIndex % LEGACY_QUESTIONS.length](title, legacyFocus)),
            sectionTurn('B', selected[2])
        ];
    }
    if (body.some((turn) => !turn.text)) throw new Error(`${event.id} has an empty Chinese commentary section`);
    let closing;
    if (closingType === 'open-question') {
        const role = format === 'dialogue' ? 'A' : 'N';
        closing = makeTurn(
            role,
            OPEN_QUESTION_TEMPLATES[authorityIndex % OPEN_QUESTION_TEMPLATES.length](title, legacyFocus),
            {
                ...sharedEvidence,
                contentOrigin: 'editorial-closing'
            }
        );
    } else if (closingType === 'summary') {
        closing = makeTurn(
            'SUMMARY',
            SUMMARY_TEMPLATES[authorityIndex % SUMMARY_TEMPLATES.length](title, legacyFocus),
            {
                ...sharedEvidence,
                contentOrigin: 'editorial-closing'
            }
        );
    } else if (closingType === 'forward-hook' && nextTitle) {
        const role = format === 'dialogue' ? 'B' : 'N';
        closing = makeTurn(role, `下一站是${nextTitle}，我们会继续追踪“${legacyFocus}”如何进入新的历史场景。`, {
            contentOrigin: 'storyline-sequence'
        });
    } else {
        const role = format === 'dialogue' ? 'B' : 'N';
        const text = previousTitle
            ? ECHO_TEMPLATES[authorityIndex % ECHO_TEMPLATES.length](previousTitle, title, legacyFocus)
            : `${title}留下的“${legacyFocus}”，后来还会在人工智能的技术选择中反复出现。`;
        closing = makeTurn(role, text, { ...sharedEvidence, contentOrigin: 'editorial-closing' });
    }
    return [intro, ...body, closing];
}

async function writeFrozenJson(filePath, value) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(`${JSON.stringify(value, null, 2)}\n`, { ...config, filepath: filePath });
    if (fs.existsSync(filePath)) {
        if (fs.readFileSync(filePath, 'utf8') !== formatted) {
            throw new Error(`Refusing to overwrite frozen turn file: ${path.relative(ROOT, filePath)}`);
        }
        return false;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, formatted, { encoding: 'utf8', flag: 'wx' });
    return true;
}

async function main() {
    const storyline = readJson(path.join(ROOT, 'archive/storylines', `${STORYLINE_ID}.json`));
    const entries = storyline.events.filter((entry) => entry.enabled !== false).sort((a, b) => a.order - b.order);
    const selected = entries.filter((entry) => EVENT_IDS.includes(entry.eventId));
    if (selected.length !== EVENT_IDS.length) throw new Error('The humanistic storyline is missing a configured event');

    let created = 0;
    let previousFormat = null;
    let consecutiveFormatCount = 0;
    const expectedFiles = new Set();
    for (const entry of selected) {
        const sequenceIndex = entries.findIndex((candidate) => candidate.eventId === entry.eventId) + 1;
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
        const assignment = EDITORIAL[entry.eventId];
        if (!assignment) throw new Error(`Missing editorial assignment for ${entry.eventId}`);
        const [format, closingType] = assignment;
        const authorityIndex = selected.findIndex((candidate) => candidate.eventId === entry.eventId);
        if (format === previousFormat) consecutiveFormatCount += 1;
        else consecutiveFormatCount = 1;
        if (consecutiveFormatCount > 3) throw new Error(`More than three consecutive ${format} events`);
        previousFormat = format;
        const previousEntry = entries[entries.findIndex((candidate) => candidate.eventId === entry.eventId) - 1];
        const nextEntry = entries[entries.findIndex((candidate) => candidate.eventId === entry.eventId) + 1];
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
            return candidatePresentation.displayTitle?.zh || candidateEvent.title.zh;
        };
        const fileName = `${String(sequenceIndex).padStart(3, '0')}-${entry.eventId}.json`;
        expectedFiles.add(fileName);
        const wasCreated = await writeFrozenJson(path.join(OUTPUT_DIR, fileName), {
            schemaVersion: 1,
            revisionId: REVISION_ID,
            scopeId: STORYLINE_ID,
            sequenceIndex,
            eventId: entry.eventId,
            variantId: entry.variant || STORYLINE_ID,
            locale: 'zh',
            mode: 'storyline',
            format,
            closingType,
            styleAuthority: STORYLINE_ID,
            turns: buildTurns(
                event,
                presentation,
                format,
                closingType,
                titleFor(previousEntry),
                titleFor(nextEntry),
                authorityIndex
            )
        });
        if (wasCreated) created += 1;
    }

    const unexpected = fs.existsSync(OUTPUT_DIR)
        ? fs.readdirSync(OUTPUT_DIR).filter((fileName) => fileName.endsWith('.json') && !expectedFiles.has(fileName))
        : [];
    if (unexpected.length) throw new Error(`Unexpected frozen turn files: ${unexpected.join(', ')}`);
    console.log(`Verified ${selected.length} humanistic Chinese turn files; created ${created}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
