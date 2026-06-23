#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const { milestones } = require('../milestones-data.js');

const STORYLINE_ID = 'bench-council-ai100';
const OUT_DIR = path.join(__dirname, '..', 'reports');
const OUT_JSON = path.join(OUT_DIR, 'ai100-accuracy-audit.json');
const OUT_MD = path.join(OUT_DIR, 'ai100-accuracy-audit.md');
const STRICT = process.argv.includes('--strict');

const REQUIRED_CONTEXT_LABELS = new Set(['Historical Background', 'Core Idea', 'Long-Term Legacy']);
const PRIMARY_SOURCE_HINTS = [
    'paper',
    'archive',
    'doi',
    'arxiv',
    'book',
    'official',
    'proceedings',
    'conference',
    'journal',
    'acm',
    'ieee',
    'neurips',
    'nips',
    'icml',
    'iclr',
    'cvpr',
    'nature',
    'science',
    'openreview',
    'jmlr'
];
const RISK_WORDS = [
    'first',
    ' 최초',
    '第一个',
    '首次',
    'only',
    '唯一',
    'proved',
    '证明了',
    'solved',
    '解决了',
    'revolutionized',
    '彻底改变',
    'state-of-the-art',
    'best',
    '最优',
    '专家通常',
    'experts generally'
];

function localizedText(value, locale = 'en') {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
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

function splitSentences(value, locale) {
    const text = stripHtml(value);
    if (!text) return [];

    if (locale === 'zh') {
        return text
            .split(/(?<=[。！？!?])/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return text
        .split(/(?<=[.!?])\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function compact(value) {
    return stripHtml(value).replace(/\|/g, '\\|');
}

function sourceText(source) {
    return `${localizedText(source.type)} ${localizedText(source.label)} ${source.url || ''}`.toLowerCase();
}

function isPrimarySource(source) {
    const text = sourceText(source);
    return PRIMARY_SOURCE_HINTS.some((hint) => text.includes(hint));
}

function hasRiskWording(text) {
    const normalized = String(text || '').toLowerCase();
    return RISK_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}

function collectSources(milestone) {
    const sources =
        milestone.achievement && Array.isArray(milestone.achievement.sources) ? milestone.achievement.sources : [];
    return sources.map((source, index) => ({
        index: index + 1,
        typeEn: localizedText(source.type, 'en'),
        typeZh: localizedText(source.type, 'zh'),
        labelEn: localizedText(source.label, 'en'),
        labelZh: localizedText(source.label, 'zh'),
        url: source.url || '',
        primaryCandidate: isPrimarySource(source),
        validUrl: isValidUrl(source.url)
    }));
}

function collectClaims(milestone) {
    const claims = [];
    const add = (field, locale, text) => {
        const clean = compact(text);
        if (!clean) return;
        claims.push({
            id: `${milestone.id}:${claims.length + 1}`,
            field,
            locale,
            text: clean,
            risk: hasRiskWording(clean),
            status: 'needs-human-verification'
        });
    };

    add('year-title', 'en', `${milestone.year}: ${localizedText(milestone.title, 'en')}`);
    add('year-title', 'zh', `${milestone.year}: ${localizedText(milestone.title, 'zh')}`);
    add(
        'location',
        'en',
        `${localizedText(milestone.location && milestone.location.name, 'en')}, ${localizedText(milestone.location && milestone.location.country, 'en')}`
    );
    add(
        'location',
        'zh',
        `${localizedText(milestone.location && milestone.location.name, 'zh')}，${localizedText(milestone.location && milestone.location.country, 'zh')}`
    );

    for (const figure of milestone.figures || []) {
        add('figure', 'en', `${localizedText(figure.name, 'en')} - ${localizedText(figure.role, 'en')}`);
        add('figure', 'zh', `${localizedText(figure.name, 'zh')} - ${localizedText(figure.role, 'zh')}`);
    }

    for (const locale of ['en', 'zh']) {
        for (const sentence of splitSentences(localizedText(milestone.description, locale), locale)) {
            add('description', locale, sentence);
        }
    }

    for (const section of milestone.commentarySections || []) {
        const label = localizedText(section.label, 'en') || 'commentary';
        for (const locale of ['en', 'zh']) {
            for (const sentence of splitSentences(localizedText(section.html, locale), locale)) {
                add(`commentary:${label}`, locale, sentence);
            }
        }
    }

    if (milestone.quoteMeta) {
        add('quote-work', 'en', localizedText(milestone.quoteMeta.workTitle, 'en'));
        add('quote-authors', 'en', localizedText(milestone.quoteMeta.workAuthors, 'en'));
        add('quote-work', 'zh', localizedText(milestone.quoteMeta.workTitle, 'zh'));
        add('quote-authors', 'zh', localizedText(milestone.quoteMeta.workAuthors, 'zh'));
    }

    return claims;
}

function checkMilestone(milestone) {
    const sources = collectSources(milestone);
    const claims = collectClaims(milestone);
    const issues = [];

    if (sources.length < 3) {
        issues.push(`needs at least 3 sources; found ${sources.length}`);
    }
    if (!sources.some((source) => source.primaryCandidate)) {
        issues.push('needs a primary paper / DOI / archive source candidate');
    }
    for (const source of sources) {
        if (!source.validUrl) {
            issues.push(`source ${source.index} has an invalid URL`);
        }
        if (!source.typeEn || !source.typeZh || !source.labelEn || !source.labelZh) {
            issues.push(`source ${source.index} is missing bilingual type or label`);
        }
    }

    const sections = Array.isArray(milestone.commentarySections) ? milestone.commentarySections : [];
    for (const requiredLabel of REQUIRED_CONTEXT_LABELS) {
        const section = sections.find((item) => localizedText(item.label, 'en') === requiredLabel);
        if (!section) {
            issues.push(`missing context section: ${requiredLabel}`);
            continue;
        }
        for (const locale of ['en', 'zh']) {
            const count = sentenceCount(localizedText(section.html, locale), locale);
            if (count < 2) {
                issues.push(`${requiredLabel} ${locale} has ${count} sentence(s)`);
            }
        }
    }

    const riskyClaims = claims.filter((claim) => claim.risk);
    return {
        id: milestone.id,
        year: milestone.year,
        titleEn: localizedText(milestone.title, 'en'),
        titleZh: localizedText(milestone.title, 'zh'),
        sourceCount: sources.length,
        primarySourceCount: sources.filter((source) => source.primaryCandidate).length,
        claimCount: claims.length,
        riskyClaimCount: riskyClaims.length,
        issues,
        sources,
        claims
    };
}

function renderMarkdown(audit) {
    const lines = [];
    lines.push('# AI100 Accuracy Audit');
    lines.push('');
    lines.push(`Generated from \`milestones-data.js\`.`);
    lines.push('');
    lines.push(
        'This report is an evidence-audit worklist. It does not certify historical accuracy by itself; each claim remains `needs-human-verification` until a reviewer checks it against the listed sources.'
    );
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Milestones: ${audit.summary.milestones}`);
    lines.push(`- Claims extracted: ${audit.summary.claims}`);
    lines.push(`- Milestones with issues: ${audit.summary.milestonesWithIssues}`);
    lines.push(`- Risk-word claims: ${audit.summary.riskyClaims}`);
    lines.push('');
    lines.push('## Milestone Checklist');
    lines.push('');
    lines.push('| ID | Title | Sources | Primary | Claims | Risk Claims | Issues |');
    lines.push('| --- | --- | ---: | ---: | ---: | ---: | --- |');
    for (const item of audit.items) {
        lines.push(
            `| ${item.id} | ${compact(item.titleEn)} | ${item.sourceCount} | ${item.primarySourceCount} | ${item.claimCount} | ${item.riskyClaimCount} | ${item.issues.length ? compact(item.issues.join('; ')) : 'ready for source review'} |`
        );
    }
    lines.push('');
    lines.push('## Review Protocol');
    lines.push('');
    lines.push(
        '1. Open the primary source candidate first and verify year, title, authors, venue, and core contribution.'
    );
    lines.push(
        '2. Check description and commentary claims against primary sources plus at least one independent context source.'
    );
    lines.push('3. Mark ambiguous, overstated, or source-missing claims in the JSON report or fix the source content.');
    lines.push('4. Re-run `npm run generate && npm run audit:ai100-accuracy` after edits.');
    lines.push('');
    lines.push('## Claim Worklist');
    for (const item of audit.items) {
        lines.push('');
        lines.push(`### ${item.id} - ${item.titleEn}`);
        lines.push('');
        lines.push('Sources:');
        for (const source of item.sources) {
            const primary = source.primaryCandidate ? ' primary-candidate' : '';
            lines.push(`- [${compact(source.labelEn)}](${source.url}) (${compact(source.typeEn)}${primary})`);
        }
        lines.push('');
        lines.push('| Field | Locale | Risk | Claim | Status |');
        lines.push('| --- | --- | --- | --- | --- |');
        for (const claim of item.claims) {
            lines.push(
                `| ${compact(claim.field)} | ${claim.locale} | ${claim.risk ? 'yes' : 'no'} | ${claim.text} | ${claim.status} |`
            );
        }
    }
    lines.push('');
    return `${lines.join('\n')}\n`;
}

const items = milestones
    .filter((milestone) => milestone.storyline && milestone.storyline.id === STORYLINE_ID)
    .map(checkMilestone)
    .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

const audit = {
    generatedAt: new Date().toISOString(),
    sourceFile: 'milestones-data.js',
    storylineId: STORYLINE_ID,
    summary: {
        milestones: items.length,
        claims: items.reduce((sum, item) => sum + item.claimCount, 0),
        milestonesWithIssues: items.filter((item) => item.issues.length > 0).length,
        riskyClaims: items.reduce((sum, item) => sum + item.riskyClaimCount, 0)
    },
    items
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(OUT_MD, renderMarkdown(audit));

console.log(`AI100 accuracy audit written to ${path.relative(process.cwd(), OUT_MD)}`);
console.log(`Machine-readable audit written to ${path.relative(process.cwd(), OUT_JSON)}`);
console.log(
    `Milestones: ${audit.summary.milestones}; claims: ${audit.summary.claims}; issues: ${audit.summary.milestonesWithIssues}; risk claims: ${audit.summary.riskyClaims}`
);

if (STRICT && audit.summary.milestonesWithIssues > 0) {
    process.exit(1);
}
