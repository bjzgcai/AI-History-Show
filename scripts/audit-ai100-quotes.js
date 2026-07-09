#!/usr/bin/env node
'use strict';

const { TextDecoder } = require('node:util');
const { categories } = require('../manage/catalog.js');
const events = require('../manage/events.js');

const STORYLINE_ID = 'bench-council-ai100';
const MAX_SOURCE_CHARS = 2_000_000;
const FETCH_TIMEOUT_MS = 10_000;
const VERIFIED_OVERRIDES = new Map([
    ['1950-turing-test', 'verified-original-text-browser-check'],
    ['1971-vc-theory', 'verified-source-text'],
    ['1958-wangs-algorithm', 'verified-source-text'],
    ['2014-adam', 'verified-source-text']
]);
const REJECTED_OVERRIDES = new Map([
    ['1971-complexity-theory', 'award-citation-phrase-not-original-paper-quote'],
    ['1956-logic-theorist', 'metadata-description-not-original-text'],
]);

function localizedText(value) {
    if (value && typeof value === 'object') return value.en || value.zh || '';
    return String(value || '');
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/<script[\s\S]*?<\/script>/g, ' ')
        .replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[#a-z0-9]+;/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function tokens(value) {
    return normalizeText(value).split(' ').filter(Boolean);
}

function isTitleLike(quote, title) {
    const quoteText = normalizeText(quote);
    const titleText = normalizeText(title);
    if (!quoteText || !titleText) return false;
    if (quoteText === titleText || quoteText.includes(titleText) || titleText.includes(quoteText)) return true;

    const quoteTokens = tokens(quoteText);
    const titleTokens = new Set(tokens(titleText));
    if (quoteTokens.length === 0 || titleTokens.size === 0) return false;

    const overlap = quoteTokens.filter((token) => titleTokens.has(token)).length / quoteTokens.length;
    return quoteTokens.length >= 4 && overlap >= 0.85;
}

async function fetchSource(url) {
    const controller = new globalThis.AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            redirect: 'follow',
            signal: controller.signal,
            headers: { 'user-agent': 'AI-History-Show quote audit' }
        });
        const buffer = await response.arrayBuffer();
        return {
            ok: response.ok,
            status: response.status,
            finalUrl: response.url,
            body: new TextDecoder('utf-8', { fatal: false }).decode(buffer).slice(0, MAX_SOURCE_CHARS)
        };
    } catch (error) {
        return { ok: false, status: 0, finalUrl: url, body: '', error: error.message };
    } finally {
        clearTimeout(timeout);
    }
}

function getAi100Keys() {
    const category = categories.find((item) => item.storyline && item.storyline.id === STORYLINE_ID);
    return category ? category.events : [];
}

async function auditEntry(key) {
    const event = events[key] || {};
    const quote = localizedText(event.quoteText);
    const meta = event.quoteMeta || {};
    const title = localizedText(meta.workTitle);
    const sourceUrl = meta.sourceUrl || '';
    const titleOnly = isTitleLike(quote, title);

    if (VERIFIED_OVERRIDES.has(key)) {
        return {
            key,
            recommendation: 'quote',
            reason: VERIFIED_OVERRIDES.get(key),
            sourceUrl,
            quote,
            title
        };
    }

    if (REJECTED_OVERRIDES.has(key)) {
        return {
            key,
            recommendation: 'keyIdea',
            reason: REJECTED_OVERRIDES.get(key),
            sourceUrl,
            quote,
            title
        };
    }

    if (!sourceUrl || sourceUrl.endsWith('.pdf')) {
        return {
            key,
            recommendation: 'keyIdea',
            reason: sourceUrl ? 'pdf-or-unreadable-by-html-audit' : 'missing-source-url',
            sourceUrl,
            quote,
            title
        };
    }

    const source = await fetchSource(sourceUrl);
    const foundInSource = normalizeText(source.body).includes(normalizeText(quote));
    const recommendation = foundInSource && !titleOnly ? 'quote' : 'keyIdea';
    const reason = foundInSource
        ? titleOnly
            ? 'found-but-title-like'
            : 'found-in-source'
        : 'not-found-in-source';

    return {
        key,
        recommendation,
        reason,
        status: source.status,
        sourceUrl,
        finalUrl: source.finalUrl,
        quote,
        title
    };
}

async function main() {
    const results = [];
    for (const key of getAi100Keys()) {
        const result = await auditEntry(key);
        results.push(result);
        console.log(JSON.stringify(result));
    }

    const quoteKeys = results.filter((result) => result.recommendation === 'quote').map((result) => result.key);
    console.error(`\nRecommended verified quote keys (${quoteKeys.length}):`);
    console.error(quoteKeys.join(', '));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
