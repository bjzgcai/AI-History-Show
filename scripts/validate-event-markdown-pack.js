#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const PACK_DIR = path.join(ROOT, 'pq');
const FORBIDDEN_PATTERN =
    /archiveEventId|archiveVariantId|sourceIds|claimIds|presentationMode|review status|milestones-data|manage\/events|\bEvent ID\b|事件 ID/;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\((images\/[^)]+)\)/g;
const LOCAL_MEDIA_PATTERN = /\[[^\]]+\]\((images\/[^)]+)\)/g;
const CJK_PATTERN = /[\u4e00-\u9fff]/;

function eventIdsFromArchive() {
    return fs
        .readdirSync(EVENTS_DIR)
        .filter((name) => fs.statSync(path.join(EVENTS_DIR, name)).isDirectory())
        .sort();
}

function addError(errors, message) {
    errors.push(message);
}

function checkEmptyHeadings(content, label, errors) {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
        const heading = line.match(/^(#{2,6})\s+/);
        if (!heading) return;
        let nextIndex = index + 1;
        while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex += 1;
        const nextHeading = nextIndex < lines.length ? lines[nextIndex].match(/^(#{2,6})\s+/) : null;
        if (nextIndex >= lines.length || (nextHeading && nextHeading[1].length <= heading[1].length)) {
            addError(errors, `${label}:${index + 1} has an empty heading: ${line}`);
        }
    });
}

function collectLocalMediaReferences(content) {
    const references = new Set();
    for (const pattern of [MARKDOWN_IMAGE_PATTERN, LOCAL_MEDIA_PATTERN]) {
        pattern.lastIndex = 0;
        for (const match of content.matchAll(pattern)) references.add(match[1]);
    }
    return references;
}

function main() {
    const errors = [];
    const eventIds = eventIdsFromArchive();
    const packEventIds = fs
        .readdirSync(PACK_DIR)
        .filter(
            (name) => fs.existsSync(path.join(PACK_DIR, name)) && fs.statSync(path.join(PACK_DIR, name)).isDirectory()
        )
        .sort();

    if (JSON.stringify(packEventIds) !== JSON.stringify(eventIds)) {
        addError(errors, `Event directory mismatch: expected ${eventIds.length}, found ${packEventIds.length}.`);
    }

    let markdownCount = 0;
    let imageCount = 0;
    eventIds.forEach((eventId) => {
        const eventDir = path.join(PACK_DIR, eventId);
        const imagesDir = path.join(eventDir, 'images');
        const zhPath = path.join(eventDir, `${eventId}.zh.md`);
        const enPath = path.join(eventDir, `${eventId}.en.md`);
        const oldPath = path.join(eventDir, `${eventId}.md`);

        if (!fs.existsSync(zhPath)) addError(errors, `${eventId} is missing its Chinese Markdown file.`);
        if (!fs.existsSync(enPath)) addError(errors, `${eventId} is missing its English Markdown file.`);
        if (fs.existsSync(oldPath)) addError(errors, `${eventId} still contains the obsolete bilingual Markdown file.`);
        if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory())
            addError(errors, `${eventId} is missing its images directory.`);

        const referencedFiles = new Set();
        for (const [language, filePath] of [
            ['zh', zhPath],
            ['en', enPath]
        ]) {
            if (!fs.existsSync(filePath)) continue;
            markdownCount += 1;
            const content = fs.readFileSync(filePath, 'utf8');
            const label = path.relative(ROOT, filePath);
            if (!content.startsWith('# ')) addError(errors, `${label} is missing its document title.`);
            if (FORBIDDEN_PATTERN.test(content)) addError(errors, `${label} contains project-internal metadata.`);
            if (language === 'en' && CJK_PATTERN.test(content)) addError(errors, `${label} contains Chinese text.`);
            const storylinePattern =
                language === 'zh' ? /^\|\s*故事线\s*\|\s*[^|\s]/m : /^\|\s*Storyline\s*\|\s*[^|\s]/m;
            if (!storylinePattern.test(content)) addError(errors, `${label} is missing its storyline field.`);
            checkEmptyHeadings(content, label, errors);
            collectLocalMediaReferences(content).forEach((reference) => {
                const target = path.join(eventDir, reference);
                referencedFiles.add(path.basename(reference));
                if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
                    addError(errors, `${label} references missing media: ${reference}`);
                }
            });
        }

        if (fs.existsSync(imagesDir) && fs.statSync(imagesDir).isDirectory()) {
            fs.readdirSync(imagesDir).forEach((fileName) => {
                const filePath = path.join(imagesDir, fileName);
                if (!fs.statSync(filePath).isFile()) return;
                imageCount += 1;
                if (!referencedFiles.has(fileName))
                    addError(errors, `${eventId}/images/${fileName} is not referenced by either document.`);
            });
        }
    });

    if (!fs.existsSync(path.join(PACK_DIR, 'README.md'))) addError(errors, 'pq/README.md is missing.');

    if (errors.length) {
        console.error(`Event Markdown pack validation failed with ${errors.length} error(s):`);
        errors.slice(0, 100).forEach((error) => console.error(`- ${error}`));
        process.exit(1);
    }

    console.log(
        `PASS event Markdown pack: ${eventIds.length} events, ${markdownCount} documents, ${imageCount} images.`
    );
}

main();
