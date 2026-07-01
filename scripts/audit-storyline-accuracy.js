#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const { milestones } = require('../milestones-data.js');

const STORYLINE_CONFIG = {
    'gaming-ai': {
        slug: 'gaming-ai',
        title: 'Gaming AI Accuracy Audit',
        command: 'npm run generate && npm run audit:gaming-accuracy'
    }
};

const OUT_DIR = path.join(__dirname, '..', 'reports');
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
    'jmlr',
    'preprint',
    'technical report',
    'technical note',
    'project',
    'match report',
    'tournament'
];
const RISK_PATTERNS = [
    /\bfirst(?!-)\b/i,
    /\bone of the first\b/i,
    /\bearliest\b/i,
    /\bonly\b/i,
    /\bproved\b|\bproven\b|\bproof that\b|\bearly proof\b|\bas a proof\b/i,
    /\bsolved\b/i,
    /\brevolutionized\b/i,
    /\bstate-of-the-art\b/i,
    /\bbest\b/i,
    /\bexperts generally\b/i,
    /\bdefeated\b|\bbeats?\b|\bbeating\b|\bwon\b|\bwin\b/i,
    /\bworld champion\b|\bchampionship\b|\bsuperhuman\b|\bmaster(?:ed|s)?\b|\boutperform(?:ed|s)?\b/i,
    /第一个|首次|唯一|最早|证明了|解决了|彻底改变|最优|专家通常/,
    /击败|战胜|冠军|超人类|掌握|超过|胜过|完美对弈/
];
const MANUAL_REVIEW_RULES = [
    {
        reason: 'absolute-first-or-only wording',
        pattern: /\bfirst(?!-)\b|\bonly\b|\bearliest\b|第一个|首次|唯一|最早/i,
        applies: (claim) => !claim.text.match(/\b(not only|rather than only)\b/i)
    },
    {
        reason: 'proof/solved wording',
        pattern:
            /\b(proved|proven|solved|guarantee|guaranteed)\b|\bproof that\b|\bearly proof\b|\bas a proof\b|证明|解决|保证/i
    },
    {
        reason: 'superlative or benchmark wording',
        pattern: /\b(best|state-of-the-art|most|widely usable)\b|最优|最先进|最有|最广/i
    },
    {
        reason: 'game result or superhuman-performance wording',
        pattern:
            /\b(defeated|beats?|beating|won|win|world champion|championship|superhuman|master(?:ed|s)?|outperform(?:ed|s)?)\b|击败|战胜|冠军|超人类|掌握|超过|胜过/i
    },
    {
        reason: 'non-legacy risk claim',
        pattern: /.+/,
        applies: (claim) =>
            claim.risk &&
            !claim.field.includes('Long-Term Legacy') &&
            !claim.field.startsWith('quote-work') &&
            !claim.text.match(/\b(first-order|you only look once)\b/i)
    }
];

function readOption(name, fallback = '') {
    const prefix = `--${name}=`;
    const inline = process.argv.find((arg) => arg.startsWith(prefix));
    if (inline) return inline.slice(prefix.length);

    const index = process.argv.indexOf(`--${name}`);
    if (index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
        return process.argv[index + 1];
    }

    return fallback;
}

function slugify(value) {
    return String(value || 'storyline')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const STORYLINE_ID = readOption('storyline', process.env.ACCURACY_AUDIT_STORYLINE || 'gaming-ai');
const config = STORYLINE_CONFIG[STORYLINE_ID] || {};
const REPORT_SLUG = slugify(readOption('slug', config.slug || STORYLINE_ID));
const REPORT_TITLE = readOption('title', config.title || `${STORYLINE_ID} Accuracy Audit`);
const RERUN_COMMAND = readOption(
    'rerun-command',
    config.command || `npm run generate && node scripts/audit-storyline-accuracy.js --storyline ${STORYLINE_ID}`
);

const OUT_JSON = path.join(OUT_DIR, `${REPORT_SLUG}-accuracy-audit.json`);
const OUT_MD = path.join(OUT_DIR, `${REPORT_SLUG}-accuracy-audit.md`);
const OUT_WEAK_JSON = path.join(OUT_DIR, `${REPORT_SLUG}-weak-claims-review.json`);
const OUT_WEAK_MD = path.join(OUT_DIR, `${REPORT_SLUG}-weak-claims-review.md`);
const OUT_RISK_JSON = path.join(OUT_DIR, `${REPORT_SLUG}-risk-claims.json`);
const OUT_RISK_MD = path.join(OUT_DIR, `${REPORT_SLUG}-risk-claims.md`);

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
    const value = String(text || '');
    return RISK_PATTERNS.some((pattern) => pattern.test(value));
}

function manualReviewReasons(claim) {
    if (!claim.risk) return [];
    if (claim.field.startsWith('quote-work')) return [];
    return MANUAL_REVIEW_RULES.filter((rule) => {
        if (rule.applies && !rule.applies(claim)) return false;
        return rule.pattern.test(claim.text);
    }).map((rule) => rule.reason);
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
            status: 'pending-audit-classification'
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

function classifyClaims(claims) {
    return claims.map((claim) => {
        const reasons = manualReviewReasons(claim);
        return {
            ...claim,
            manualReview: reasons.length > 0,
            reviewReasons: reasons,
            status:
                reasons.length > 0 ? 'needs-manual-source-review' : claim.risk ? 'low-priority-risk' : 'structural-only'
        };
    });
}

function checkMilestone(milestone) {
    const sources = collectSources(milestone);
    const claims = classifyClaims(collectClaims(milestone));
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
    const weakClaims = claims.filter((claim) => claim.manualReview);
    return {
        id: milestone.id,
        year: milestone.year,
        titleEn: localizedText(milestone.title, 'en'),
        titleZh: localizedText(milestone.title, 'zh'),
        sourceCount: sources.length,
        primarySourceCount: sources.filter((source) => source.primaryCandidate).length,
        claimCount: claims.length,
        riskyClaimCount: riskyClaims.length,
        weakClaimCount: weakClaims.length,
        issues,
        sources,
        claims
    };
}

function sortYear(value) {
    const match = String(value || '').match(/\d{4}/);
    return match ? Number(match[0]) : 0;
}

function renderMarkdown(audit) {
    const lines = [];
    lines.push(`# ${REPORT_TITLE}`);
    lines.push('');
    lines.push(`Generated from \`${audit.sourceFile}\` for storyline \`${audit.storylineId}\`.`);
    lines.push('');
    lines.push(
        'This report is an evidence-audit worklist. It does not certify historical accuracy by itself. Manual review is required only for claims marked `needs-manual-source-review`; lower-priority risk claims are kept for traceability but do not need immediate rewriting.'
    );
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Milestones: ${audit.summary.milestones}`);
    lines.push(`- Claims extracted: ${audit.summary.claims}`);
    lines.push(`- Milestones with issues: ${audit.summary.milestonesWithIssues}`);
    lines.push(`- Risk-word claims: ${audit.summary.riskyClaims}`);
    lines.push(`- Weak/manual-review claims: ${audit.summary.weakClaims}`);
    lines.push('');
    lines.push('## Milestone Checklist');
    lines.push('');
    lines.push('| ID | Title | Sources | Primary | Claims | Risk Claims | Weak Claims | Issues |');
    lines.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |');
    for (const item of audit.items) {
        lines.push(
            `| ${item.id} | ${compact(item.titleEn)} | ${item.sourceCount} | ${item.primarySourceCount} | ${item.claimCount} | ${item.riskyClaimCount} | ${item.weakClaimCount} | ${item.issues.length ? compact(item.issues.join('; ')) : 'ready for source review'} |`
        );
    }
    lines.push('');
    lines.push('## Review Protocol');
    lines.push('');
    lines.push(
        '1. Open the primary source candidate first and verify year, title, authors, venue, and core contribution.'
    );
    lines.push(
        '2. Manually review only claims marked `needs-manual-source-review`, prioritizing absolute, first/only, proof/solved, superlative, strong game-result, and strong legacy wording.'
    );
    lines.push(
        '3. Low-priority risk claims do not need rewriting unless a reviewer spots an unsupported source chain.'
    );
    lines.push(`4. Re-run \`${RERUN_COMMAND}\` after edits.`);
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
        lines.push('| Field | Locale | Risk | Manual Review | Claim | Status |');
        lines.push('| --- | --- | --- | --- | --- | --- |');
        for (const claim of item.claims) {
            lines.push(
                `| ${compact(claim.field)} | ${claim.locale} | ${claim.risk ? 'yes' : 'no'} | ${claim.manualReview ? compact(claim.reviewReasons.join('; ')) : 'no'} | ${claim.text} | ${claim.status} |`
            );
        }
    }
    lines.push('');
    return `${lines.join('\n')}\n`;
}

function claimReportItems(audit) {
    const rows = [];
    for (const item of audit.items) {
        for (const claim of item.claims) {
            rows.push({
                milestoneId: item.id,
                year: item.year,
                titleEn: item.titleEn,
                titleZh: item.titleZh,
                field: claim.field,
                locale: claim.locale,
                claim: claim.text,
                risk: claim.risk,
                manualReview: claim.manualReview,
                reasons: claim.reviewReasons,
                status: claim.status,
                sources: item.sources
            });
        }
    }
    return rows;
}

function renderClaimsMarkdown(rows, { title, intro }) {
    const lines = [];
    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`Total claims: ${rows.length}`);
    lines.push('');
    lines.push(intro);
    lines.push('');
    lines.push('| # | Milestone | Field | Locale | Manual Review | Reason | Claim |');
    lines.push('| ---: | --- | --- | --- | --- | --- | --- |');
    rows.forEach((row, index) => {
        lines.push(
            `| ${index + 1} | ${row.milestoneId} / ${compact(row.titleEn)} | ${compact(row.field)} | ${row.locale} | ${row.manualReview ? 'yes' : 'no'} | ${row.reasons.length ? compact(row.reasons.join('; ')) : 'low-priority risk'} | ${compact(row.claim)} |`
        );
    });
    lines.push('');
    return `${lines.join('\n')}\n`;
}

const items = milestones
    .filter((milestone) => milestone.storyline && milestone.storyline.id === STORYLINE_ID)
    .map(checkMilestone)
    .sort((a, b) => sortYear(a.year) - sortYear(b.year) || a.id.localeCompare(b.id));

const audit = {
    generatedAt: new Date().toISOString(),
    sourceFile: 'milestones-data.js',
    storylineId: STORYLINE_ID,
    summary: {
        milestones: items.length,
        claims: items.reduce((sum, item) => sum + item.claimCount, 0),
        milestonesWithIssues: items.filter((item) => item.issues.length > 0).length,
        riskyClaims: items.reduce((sum, item) => sum + item.riskyClaimCount, 0),
        weakClaims: items.reduce((sum, item) => sum + item.weakClaimCount, 0)
    },
    items
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const riskClaims = claimReportItems(audit).filter((claim) => claim.risk);
const weakClaims = riskClaims.filter((claim) => claim.manualReview);
fs.writeFileSync(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(OUT_MD, renderMarkdown(audit));
fs.writeFileSync(OUT_RISK_JSON, `${JSON.stringify(riskClaims, null, 2)}\n`);
fs.writeFileSync(
    OUT_RISK_MD,
    renderClaimsMarkdown(riskClaims, {
        title: `${REPORT_TITLE.replace(/ Accuracy Audit$/, '')} Risk Claims`,
        intro: 'These claims contain risk wording and are kept for traceability. Manual review is only required when the Manual Review column is `yes`.'
    })
);
fs.writeFileSync(OUT_WEAK_JSON, `${JSON.stringify(weakClaims, null, 2)}\n`);
fs.writeFileSync(
    OUT_WEAK_MD,
    renderClaimsMarkdown(weakClaims, {
        title: `${REPORT_TITLE.replace(/ Accuracy Audit$/, '')} Weak Claims For Manual Review`,
        intro: 'These are the risk-word claims most likely to need a human source check. Low-priority risk claims are intentionally excluded.'
    })
);

console.log(`${REPORT_TITLE} written to ${path.relative(process.cwd(), OUT_MD)}`);
console.log(`Machine-readable audit written to ${path.relative(process.cwd(), OUT_JSON)}`);
console.log(`Weak-claims review queue written to ${path.relative(process.cwd(), OUT_WEAK_MD)}`);
console.log(
    `Milestones: ${audit.summary.milestones}; claims: ${audit.summary.claims}; issues: ${audit.summary.milestonesWithIssues}; risk claims: ${audit.summary.riskyClaims}; weak claims: ${audit.summary.weakClaims}`
);

if (STRICT && audit.summary.milestonesWithIssues > 0) {
    process.exit(1);
}
