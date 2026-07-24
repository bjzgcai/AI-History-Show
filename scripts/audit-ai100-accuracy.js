#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const { milestones } = require('../milestones-data.js');
const {
    countTextSentences,
    escapeMarkdownTableText,
    getLocalizedText,
    splitTextSentences
} = require('../shared/utils.js');

const STORYLINE_ID = 'bench-council-ai100';
const MACHINE_OUT_DIR = path.join(__dirname, '..', '.tmp', 'archive-reports');
const OUT_JSON = path.join(MACHINE_OUT_DIR, 'ai100-accuracy-audit.json');
const OUT_MD = path.join(MACHINE_OUT_DIR, 'ai100-accuracy-audit.md');
const OUT_WEAK_JSON = path.join(MACHINE_OUT_DIR, 'ai100-weak-claims-review.json');
const OUT_WEAK_MD = path.join(MACHINE_OUT_DIR, 'ai100-weak-claims-review.md');
const OUT_RISK_JSON = path.join(MACHINE_OUT_DIR, 'ai100-risk-claims.json');
const OUT_RISK_MD = path.join(MACHINE_OUT_DIR, 'ai100-risk-claims.md');
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
    /第一个|首次|唯一|最早|证明了|解决了|彻底改变|最优|专家通常/
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
        reason: 'non-legacy risk claim',
        pattern: /.+/,
        applies: (claim) =>
            claim.risk &&
            !claim.field.includes('Long-Term Legacy') &&
            !claim.field.startsWith('quote-work') &&
            !claim.text.match(/\b(first-order|you only look once)\b/i)
    }
];

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function sourceText(source) {
    return [
        getLocalizedText(source.type, 'en'),
        getLocalizedText(source.type, 'zh'),
        getLocalizedText(source.label, 'en'),
        getLocalizedText(source.label, 'zh'),
        source.url || ''
    ]
        .join(' ')
        .toLowerCase();
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
        typeEn: getLocalizedText(source.type, 'en'),
        typeZh: getLocalizedText(source.type, 'zh'),
        labelEn: getLocalizedText(source.label, 'en'),
        labelZh: getLocalizedText(source.label, 'zh'),
        url: source.url || '',
        primaryCandidate: isPrimarySource(source),
        validUrl: isValidUrl(source.url)
    }));
}

function collectClaims(milestone) {
    const claims = [];
    const add = (field, locale, text) => {
        const clean = escapeMarkdownTableText(text);
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

    add('year-title', 'en', `${milestone.year}: ${getLocalizedText(milestone.title, 'en')}`);
    add('year-title', 'zh', `${milestone.year}: ${getLocalizedText(milestone.title, 'zh')}`);
    add(
        'location',
        'en',
        `${getLocalizedText(milestone.location && milestone.location.name, 'en')}, ${getLocalizedText(milestone.location && milestone.location.country, 'en')}`
    );
    add(
        'location',
        'zh',
        `${getLocalizedText(milestone.location && milestone.location.name, 'zh')}，${getLocalizedText(milestone.location && milestone.location.country, 'zh')}`
    );

    for (const figure of milestone.figures || []) {
        add('figure', 'en', `${getLocalizedText(figure.name, 'en')} - ${getLocalizedText(figure.role, 'en')}`);
        add('figure', 'zh', `${getLocalizedText(figure.name, 'zh')} - ${getLocalizedText(figure.role, 'zh')}`);
    }

    for (const locale of ['en', 'zh']) {
        for (const sentence of splitTextSentences(getLocalizedText(milestone.description, locale), locale)) {
            add('description', locale, sentence);
        }
    }

    for (const section of milestone.commentarySections || []) {
        const label = getLocalizedText(section.label, 'en') || 'commentary';
        for (const locale of ['en', 'zh']) {
            for (const sentence of splitTextSentences(getLocalizedText(section.html, locale), locale)) {
                add(`commentary:${label}`, locale, sentence);
            }
        }
    }

    if (milestone.quoteMeta) {
        add('quote-work', 'en', getLocalizedText(milestone.quoteMeta.workTitle, 'en'));
        add('quote-authors', 'en', getLocalizedText(milestone.quoteMeta.workAuthors, 'en'));
        add('quote-work', 'zh', getLocalizedText(milestone.quoteMeta.workTitle, 'zh'));
        add('quote-authors', 'zh', getLocalizedText(milestone.quoteMeta.workAuthors, 'zh'));
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
        const section = sections.find((item) => getLocalizedText(item.label, 'en') === requiredLabel);
        if (!section) {
            issues.push(`missing context section: ${requiredLabel}`);
            continue;
        }
        for (const locale of ['en', 'zh']) {
            const count = countTextSentences(getLocalizedText(section.html, locale), locale);
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
        titleEn: getLocalizedText(milestone.title, 'en'),
        titleZh: getLocalizedText(milestone.title, 'zh'),
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

function renderMarkdown(audit) {
    const lines = [];
    lines.push('# AI100 Accuracy Audit');
    lines.push('');
    lines.push(`Generated from \`milestones-data.js\`.`);
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
            `| ${item.id} | ${escapeMarkdownTableText(item.titleEn)} | ${item.sourceCount} | ${item.primarySourceCount} | ${item.claimCount} | ${item.riskyClaimCount} | ${item.weakClaimCount} | ${item.issues.length ? escapeMarkdownTableText(item.issues.join('; ')) : 'ready for source review'} |`
        );
    }
    lines.push('');
    lines.push('## Review Protocol');
    lines.push('');
    lines.push(
        '1. Open the primary source candidate first and verify year, title, authors, venue, and core contribution.'
    );
    lines.push(
        '2. Manually review only claims marked `needs-manual-source-review`, prioritizing absolute, first/only, proof/solved, superlative, and strong legacy wording.'
    );
    lines.push(
        '3. Low-priority risk claims do not need rewriting unless a reviewer spots an unsupported source chain.'
    );
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
            lines.push(
                `- [${escapeMarkdownTableText(source.labelEn)}](${source.url}) (${escapeMarkdownTableText(source.typeEn)}${primary})`
            );
        }
        lines.push('');
        lines.push('| Field | Locale | Risk | Manual Review | Claim | Status |');
        lines.push('| --- | --- | --- | --- | --- | --- |');
        for (const claim of item.claims) {
            lines.push(
                `| ${escapeMarkdownTableText(claim.field)} | ${claim.locale} | ${claim.risk ? 'yes' : 'no'} | ${claim.manualReview ? escapeMarkdownTableText(claim.reviewReasons.join('; ')) : 'no'} | ${claim.text} | ${claim.status} |`
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
            `| ${index + 1} | ${row.milestoneId} / ${escapeMarkdownTableText(row.titleEn)} | ${escapeMarkdownTableText(row.field)} | ${row.locale} | ${row.manualReview ? 'yes' : 'no'} | ${row.reasons.length ? escapeMarkdownTableText(row.reasons.join('; ')) : 'low-priority risk'} | ${escapeMarkdownTableText(row.claim)} |`
        );
    });
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
        riskyClaims: items.reduce((sum, item) => sum + item.riskyClaimCount, 0),
        weakClaims: items.reduce((sum, item) => sum + item.weakClaimCount, 0)
    },
    items
};

fs.mkdirSync(MACHINE_OUT_DIR, { recursive: true });
const riskClaims = claimReportItems(audit).filter((claim) => claim.risk);
const weakClaims = riskClaims.filter((claim) => claim.manualReview);
fs.writeFileSync(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(OUT_MD, renderMarkdown(audit));
fs.writeFileSync(OUT_RISK_JSON, `${JSON.stringify(riskClaims, null, 2)}\n`);
fs.writeFileSync(
    OUT_RISK_MD,
    renderClaimsMarkdown(riskClaims, {
        title: 'AI100 Risk Claims',
        intro: 'These claims contain risk wording and are kept for traceability. Manual review is only required when the Manual Review column is `yes`.'
    })
);
fs.writeFileSync(OUT_WEAK_JSON, `${JSON.stringify(weakClaims, null, 2)}\n`);
fs.writeFileSync(
    OUT_WEAK_MD,
    renderClaimsMarkdown(weakClaims, {
        title: 'AI100 Weak Claims For Manual Review',
        intro: 'These are the risk-word claims most likely to need a human source check. Low-priority risk claims are intentionally excluded.'
    })
);

console.log(`AI100 accuracy audit written to ${path.relative(process.cwd(), OUT_MD)}`);
console.log(`Machine-readable audit written to ${path.relative(process.cwd(), OUT_JSON)}`);
console.log(`Weak-claims review queue written to ${path.relative(process.cwd(), OUT_WEAK_MD)}`);
console.log(
    `Milestones: ${audit.summary.milestones}; claims: ${audit.summary.claims}; issues: ${audit.summary.milestonesWithIssues}; risk claims: ${audit.summary.riskyClaims}; weak claims: ${audit.summary.weakClaims}`
);

if (STRICT && audit.summary.milestonesWithIssues > 0) {
    process.exit(1);
}
