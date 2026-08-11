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
const ARCHIVE_EVENTS = path.join(ROOT, 'archive/events');
const STORYLINES = path.join(ROOT, 'archive/storylines');
const AI100_ID = 'bench-council-ai100';
const GAMING_ID = 'gaming-ai';
const DEEP_LEARNING_ID = 'deep-learning';
const HUMANISTIC_ID = 'humanistic-cycle';
const AI100_SKIP = 10;
const FORMAT_CYCLE = ['dialogue', 'narration', 'hybrid', 'dialogue', 'narration', 'dialogue'];
const CLOSING_CYCLE = ['summary', 'open-question', 'historical-echo', 'summary', 'forward-hook', 'open-question'];

const outputs = {
    [AI100_ID]: {
        startIndex: AI100_SKIP,
        root: path.join(ROOT, 'audio/revisions/ai100-remaining-original/turns'),
        revisionIds: {
            zh: 'ai100-remaining-storyline-zh-original-v1-2026-08-09',
            en: 'ai100-remaining-storyline-en-original-v1-2026-08-09'
        }
    },
    [GAMING_ID]: {
        startIndex: 0,
        root: path.join(ROOT, 'audio/revisions/gaming-original/turns'),
        revisionIds: {
            zh: 'gaming-all-storyline-zh-original-v1-2026-08-09',
            en: 'gaming-all-storyline-en-original-v1-2026-08-09'
        }
    },
    [DEEP_LEARNING_ID]: {
        eventIds: [
            '1956-dartmouth',
            '1969-ai-winter',
            '1986-backpropagation',
            '1986-rnn',
            '2014-highway-network',
            '2019-ai-feynman',
            '2022-post-training-intelligence',
            '2023-agents',
            '2024-ai-scientist',
            '2025-llm-competition'
        ],
        root: path.join(ROOT, 'audio/revisions/deep-learning-remaining-original/turns'),
        revisionIds: {
            zh: 'deep-learning-remaining-storyline-zh-original-v1-2026-08-09',
            en: 'deep-learning-remaining-storyline-en-original-v1-2026-08-09'
        }
    },
    [HUMANISTIC_ID]: {
        eventIds: [
            '1920-rur-robots',
            '1942-asimov-runaround',
            '1950-wiener-human-use',
            '1965-simon-ai-prediction',
            '1968-hal-9000',
            '1973-lighthill-report',
            '1978-xiaolingtong',
            '1984-neuromancer',
            '1987-lisp-machine-collapse',
            '2014-ai-existential-warnings',
            '2015-openai-founding',
            '2023-ai-risk-statement'
        ],
        root: path.join(ROOT, 'audio/revisions/humanistic-cycle-original/turns'),
        revisionIds: {
            zh: 'humanistic-cycle-storyline-zh-original-v1-2026-08-09',
            en: 'humanistic-cycle-storyline-en-original-v1-2026-08-09'
        }
    }
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readEffectiveVariant(storylineId, entry) {
    const eventDir = path.join(ARCHIVE_EVENTS, entry.eventId);
    const event = readJson(path.join(eventDir, 'event.json'));
    const variant = resolveEffectivePresentation({
        root: ROOT,
        eventDir,
        event,
        eventId: entry.eventId,
        storylineId,
        ref: entry
    }).presentation;
    return { event, variant };
}

export async function writeFrozenJson(filePath, value) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
        ...config,
        filepath: filePath
    });
    if (fs.existsSync(filePath)) {
        if (fs.readFileSync(filePath, 'utf8') !== formatted) {
            throw new Error(`Refusing to overwrite frozen revision turn file: ${path.relative(ROOT, filePath)}`);
        }
        return false;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, formatted, { encoding: 'utf8', flag: 'wx' });
    return true;
}

function enabledEvents(storylineId) {
    return readJson(path.join(STORYLINES, `${storylineId}.json`))
        .events.filter((entry) => entry.enabled !== false)
        .sort((left, right) => left.order - right.order);
}

function decodeEntities(value) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    };
    return String(value || '').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => entities[match] || match);
}

function cleanText(value, locale) {
    let text = decodeEntities(value)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (locale === 'zh') {
        text = text
            .replace(/互动演示会突出这些步骤如何把资料线索与可见的系统行为连接起来。?/g, '')
            .replace(/这段背景帮助观众把.+?放回当时的技术问题和研究重点中理解。?/g, '');
    } else {
        text = text
            .replace(
                /The interactive demo focuses on the steps that connect the source material to the visible system behavior\.?/g,
                ''
            )
            .replace(
                /This context helps viewers place .+? in the technical problems and research priorities of its time\.?/g,
                ''
            );
    }
    return text.replace(/\s+/g, ' ').trim();
}

function speechUnits(text, locale) {
    if (locale === 'zh') return [...text].filter((character) => /[\p{Script=Han}A-Za-z0-9]/u.test(character)).length;
    return text.split(/\s+/).filter(Boolean).length;
}

function limitSection(text, locale) {
    const sentences = text.split(locale === 'zh' ? /(?<=[。！？])/u : /(?<=[.!?])\s+/u).filter(Boolean);
    const maximum = locale === 'zh' ? 165 : 82;
    const minimum = locale === 'zh' ? 70 : 34;
    const selected = [];
    for (const sentence of sentences) {
        const candidate = [...selected, sentence].join(locale === 'zh' ? '' : ' ');
        if (selected.length && speechUnits(candidate, locale) > maximum) break;
        selected.push(sentence);
        if (selected.length >= 2 && speechUnits(candidate, locale) >= minimum) break;
    }
    return (selected.length ? selected : [text]).join(locale === 'zh' ? '' : ' ').trim();
}

function localizedTitle(event, variant, locale) {
    return variant.displayTitle?.[locale] || event.title[locale];
}

function hookText({ title, year, locale, authorityIndex, previousTitle, addBridge }) {
    const templates =
        locale === 'zh'
            ? [
                  `把时间拨回${year}年，「${title}」究竟在解决一个什么样的难题？`,
                  `为什么「${title}」会成为人工智能史上值得单独记住的一步？`,
                  `如果把「${title}」拆开来看，真正改变研究方向的部分是什么？`,
                  `一个看似专业的名字「${title}」，背后藏着怎样一个直观问题？`,
                  `研究者为什么需要「${title}」？当时已有的方法究竟卡在了哪里？`,
                  `「${title}」最有意思的地方，是结果本身，还是它重新定义问题的方式？`
              ]
            : [
                  `Turn the clock back to ${year}. What problem was ${title} actually trying to solve?`,
                  `Why does ${title} deserve its own place in the history of artificial intelligence?`,
                  `If we take ${title} apart, which idea truly changed the direction of research?`,
                  `Behind the technical name ${title}, what intuitive problem were researchers confronting?`,
                  `Why did researchers need ${title}, and where were the existing methods getting stuck?`,
                  `What is most interesting about ${title}: the result itself, or the way it reframed the problem?`
              ];
    const hook = templates[authorityIndex % templates.length];
    if (!addBridge || !previousTitle) return hook;
    return locale === 'zh'
        ? `上一段讲到「${previousTitle}」。现在把镜头转向「${title}」，沿着这条故事线换一个问题：${hook}`
        : `The previous story examined ${previousTitle}. Now the camera turns to ${title} and a new question along the same timeline: ${hook}`;
}

function coreQuestion(locale) {
    return locale === 'zh'
        ? '这听起来像一个漂亮的方向。真正让它运转起来的核心机制是什么？'
        : 'That sounds like a promising direction. What mechanism actually makes it work?';
}

function legacyQuestion(locale) {
    return locale === 'zh'
        ? '那它为什么没有停留在一篇论文或一次实验里？后来研究者真正继承了什么？'
        : 'Why did the idea outlive one paper or experiment? What did later researchers actually inherit?';
}

function evidence(section, variant, origin) {
    return {
        sourceIds: section?.sourceIds?.length ? section.sourceIds : variant.sourceIds || [],
        claimIds: variant.claimIds || [],
        contentOrigin: origin
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

function closingTurn({ type, format, locale, title, previousTitle, nextTitle, variant }) {
    const factualRole = format === 'dialogue' ? 'B' : 'N';
    const questionRole = format === 'dialogue' ? 'A' : 'N';
    const details = {
        sourceIds: variant.sourceIds || [],
        claimIds: variant.claimIds || [],
        contentOrigin: 'editorial-closing'
    };
    if (type === 'summary') {
        const text =
            locale === 'zh'
                ? `「${title}」留下的关键，不只是一项成果，而是一种后来可以继续检验、改造和扩展的方法。`
                : `${title} mattered not only as a result, but as a method that later researchers could test, adapt, and extend.`;
        return makeTurn('SUMMARY', text, details);
    }
    if (type === 'open-question') {
        const text =
            locale === 'zh'
                ? `当今天的系统规模越来越大时，「${title}」留下的思路还有哪些价值，又有哪些边界值得重新追问？`
                : `As today's systems grow larger, which lessons from ${title} still matter, and which limits deserve to be questioned again?`;
        return makeTurn(questionRole, text, details);
    }
    if (type === 'forward-hook' && nextTitle) {
        const text =
            locale === 'zh'
                ? `这条线索还没有结束。接下来来到「${nextTitle}」，我们会看到研究者怎样把问题继续向前推进。`
                : `The thread continues with ${nextTitle}, where researchers push the problem one step further.`;
        return makeTurn(factualRole, text, { contentOrigin: 'storyline-sequence' });
    }
    const text = previousTitle
        ? locale === 'zh'
            ? `回看「${previousTitle}」，再看「${title}」，我们能听见同一个技术问题跨越年代后的回响。`
            : `Seen alongside ${previousTitle}, ${title} reveals how the same technical question can echo across different eras.`
        : locale === 'zh'
          ? `「${title}」留下的问题，后来还会在人工智能的技术选择中反复出现。`
          : `The questions left by ${title} would return repeatedly in later choices about artificial intelligence.`;
    return makeTurn(factualRole, text, details);
}

function buildTurns({ event, variant, locale, format, closingType, authorityIndex, previousTitle, nextTitle }) {
    const title = localizedTitle(event, variant, locale);
    const sections = variant.commentarySections.slice(0, 3);
    if (sections.length < 2) throw new Error(`${event.id} requires at least two commentary sections`);
    const sectionTexts = sections.map((section) => limitSection(cleanText(section.html[locale], locale), locale));
    const introRole = format === 'dialogue' ? 'A' : 'N';
    const intro = makeTurn(
        introRole,
        hookText({
            title,
            year: event.year,
            locale,
            authorityIndex,
            previousTitle,
            addBridge: authorityIndex % 4 === 0
        }),
        { contentOrigin: authorityIndex % 4 === 0 ? 'storyline-sequence' : 'editorial-hook' }
    );
    let body;
    if (format === 'narration') {
        body = sections.map((section, index) =>
            makeTurn('N', sectionTexts[index], evidence(section, variant, `commentarySections.${section.id}`))
        );
    } else if (format === 'hybrid') {
        body = [
            makeTurn('N', sectionTexts[0], evidence(sections[0], variant, `commentarySections.${sections[0].id}`)),
            makeTurn('A', coreQuestion(locale)),
            makeTurn('B', sectionTexts[1], evidence(sections[1], variant, `commentarySections.${sections[1].id}`))
        ];
        if (sections[2]) {
            body.push(
                makeTurn('N', sectionTexts[2], evidence(sections[2], variant, `commentarySections.${sections[2].id}`))
            );
        }
    } else {
        body = [
            makeTurn('B', sectionTexts[0], evidence(sections[0], variant, `commentarySections.${sections[0].id}`)),
            makeTurn('A', coreQuestion(locale)),
            makeTurn('B', sectionTexts[1], evidence(sections[1], variant, `commentarySections.${sections[1].id}`))
        ];
        if (sections[2]) {
            body.push(
                makeTurn('A', legacyQuestion(locale)),
                makeTurn('B', sectionTexts[2], evidence(sections[2], variant, `commentarySections.${sections[2].id}`))
            );
        }
    }
    return [
        intro,
        ...body,
        closingTurn({
            type: closingType,
            format,
            locale,
            title,
            previousTitle,
            nextTitle,
            variant
        })
    ];
}

async function main() {
    const ai100Entries = enabledEvents(AI100_ID);
    const ai100IndexById = new Map(ai100Entries.map((entry, index) => [entry.eventId, index]));
    let verified = 0;
    let created = 0;
    for (const [scopeId, output] of Object.entries(outputs)) {
        const entries = enabledEvents(scopeId);
        const selected = output.eventIds
            ? entries.filter((entry) => output.eventIds.includes(entry.eventId))
            : entries.slice(output.startIndex);
        if (output.eventIds && selected.length !== output.eventIds.length) {
            throw new Error(`${scopeId} is missing one or more configured event IDs`);
        }
        const expectedNames = { zh: new Set(), en: new Set() };
        for (let selectedIndex = 0; selectedIndex < selected.length; selectedIndex += 1) {
            const entry = selected[selectedIndex];
            const sequenceIndex = entries.findIndex((candidate) => candidate.eventId === entry.eventId) + 1;
            const authorityIndex = ai100IndexById.has(entry.eventId)
                ? ai100IndexById.get(entry.eventId)
                : selectedIndex;
            const format = FORMAT_CYCLE[authorityIndex % FORMAT_CYCLE.length];
            const closingType = CLOSING_CYCLE[authorityIndex % CLOSING_CYCLE.length];
            const { event, variant } = readEffectiveVariant(scopeId, entry);
            const previousEntry = entries[sequenceIndex - 2] || null;
            const nextEntry = entries[sequenceIndex] || null;
            const previous = previousEntry ? readEffectiveVariant(scopeId, previousEntry) : null;
            const next = nextEntry ? readEffectiveVariant(scopeId, nextEntry) : null;
            for (const locale of ['zh', 'en']) {
                const fileName = `${String(sequenceIndex).padStart(3, '0')}-${entry.eventId}.json`;
                expectedNames[locale].add(fileName);
                const wasCreated = await writeFrozenJson(path.join(output.root, locale, fileName), {
                    schemaVersion: 1,
                    revisionId: output.revisionIds[locale],
                    scopeId,
                    sequenceIndex,
                    eventId: entry.eventId,
                    variantId: entry.variant || scopeId,
                    locale,
                    mode: 'storyline',
                    format,
                    closingType,
                    styleAuthority: ai100IndexById.has(entry.eventId) ? AI100_ID : scopeId,
                    turns: buildTurns({
                        event,
                        variant,
                        locale,
                        format,
                        closingType,
                        authorityIndex,
                        previousTitle: previous ? localizedTitle(previous.event, previous.variant, locale) : null,
                        nextTitle: next ? localizedTitle(next.event, next.variant, locale) : null
                    })
                });
                verified += 1;
                if (wasCreated) created += 1;
            }
        }
        for (const locale of ['zh', 'en']) {
            const localeDir = path.join(output.root, locale);
            const unexpected = fs
                .readdirSync(localeDir)
                .filter((fileName) => fileName.endsWith('.json') && !expectedNames[locale].has(fileName));
            if (unexpected.length)
                throw new Error(`${scopeId}/${locale} contains stale turn files: ${unexpected.join(', ')}`);
        }
    }
    console.log(`Verified ${verified} source-grounded original revision turn files; created ${created}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
