#!/usr/bin/env node
'use strict';

const { milestones } = require('../milestones-data.js');

const REQUIRED_LABELS = new Set(['Historical Background', 'Core Idea', 'Long-Term Legacy']);
const STRICT = process.argv.includes('--strict');

function localizedText(value, locale) {
    if (value && typeof value === 'object') {
        return String(value[locale] || value.en || value.zh || '').trim();
    }
    return String(value || '').trim();
}

function stripHtml(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sentenceCount(value, locale) {
    const text = stripHtml(value);
    if (!text) return 0;

    if (locale === 'zh') {
        const matches = text.match(/[。！？!?]/g);
        return matches ? matches.length : 1;
    }

    const matches = text.match(/[.!?](?:\s|$|["'”’）)])/g);
    return matches ? matches.length : 1;
}

const failures = [];

for (const milestone of milestones) {
    const storylineId =
        typeof milestone.storyline === 'string'
            ? milestone.storyline
            : milestone.storyline && milestone.storyline.id;

    if (storylineId !== 'bench-council-ai100') continue;

    const sections = Array.isArray(milestone.commentarySections) ? milestone.commentarySections : [];
    for (const section of sections) {
        const label = localizedText(section && section.label, 'en');
        if (!REQUIRED_LABELS.has(label)) continue;

        for (const locale of ['en', 'zh']) {
            const count = sentenceCount(localizedText(section.html, locale), locale);
            if (count < 2) {
                failures.push({
                    id: milestone.id,
                    title: localizedText(milestone.title, locale),
                    label,
                    locale,
                    count
                });
            }
        }
    }
}

if (failures.length > 0) {
    console.log(`AI100 context sections below 2 sentences: ${failures.length}`);
    for (const item of failures.slice(0, 80)) {
        console.log(
            `- ${item.id} / ${item.label} / ${item.locale}: ${item.count} sentence(s) (${item.title})`
        );
    }
    if (failures.length > 80) {
        console.log(`...and ${failures.length - 80} more`);
    }
    if (STRICT) process.exit(1);
} else {
    console.log('PASS AI100 context sections have at least 2 sentences in English and Chinese.');
}
