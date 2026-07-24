#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { FUSIONS } = require('../manage/event-fusions.js');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');
const OUT_JSON = path.join(ROOT, '.tmp', 'archive-reports', 'archive-fusion-variant-map.json');
const OUT_MD = path.join(ROOT, '.tmp', 'archive-reports', 'archive-fusion-variant-map.md');

function existsEvent(id) {
    return fs.existsSync(path.join(ARCHIVE_EVENTS, id, 'event.json'));
}

function variantsFor(id) {
    const dir = path.join(ARCHIVE_EVENTS, id, 'variants');
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.basename(file, '.json'))
        .sort();
}

function main() {
    const rows = FUSIONS.map((fusion) => {
        const archiveEventExists = existsEvent(fusion.canonical);
        const deepExists = existsEvent(fusion.deep);
        const ai100Exists = existsEvent(fusion.ai100);
        const canonicalId = archiveEventExists
            ? fusion.canonical
            : deepExists
              ? fusion.deep
              : ai100Exists
                ? fusion.ai100
                : fusion.canonical;
        return {
            canonical: fusion.canonical,
            deep: fusion.deep,
            ai100: fusion.ai100,
            archiveCanonical: canonicalId,
            archiveExists: existsEvent(canonicalId),
            variants: variantsFor(canonicalId),
            status: existsEvent(canonicalId) ? 'archive-event-present' : 'pending-archive-migration',
            recommendation: existsEvent(canonicalId)
                ? 'Move shared facts into the archive event and express deep-learning / AI100 differences as variants.'
                : 'Create canonical archive event, then migrate deep-learning and AI100 presentations into variants.'
        };
    });

    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
    fs.writeFileSync(OUT_JSON, `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`);

    const lines = [];
    lines.push('# Archive Fusion Variant Map');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(
        'This report maps current `manage/event-fusions.js` pairs to the archive canonical-event + variant model.'
    );
    lines.push('');
    lines.push('| Fusion canonical | Deep id | AI100 id | Archive canonical | Status | Variants |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const row of rows) {
        lines.push(
            `| \`${row.canonical}\` | \`${row.deep}\` | \`${row.ai100}\` | \`${row.archiveCanonical}\` | ${row.status} | ${row.variants.map((v) => `\`${v}\``).join(', ')} |`
        );
    }
    lines.push('');
    lines.push('## Next actions');
    lines.push('');
    lines.push(
        '- Use this report to replace fusion-specific duplicated presentation with canonical archive events plus variants.'
    );
    lines.push('- Keep backward-compatible milestone ids during migration.');
    lines.push(
        '- Do not delete `manage/event-fusions.js` until all mapped rows are archive-backed and generated output is verified.'
    );
    fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`);

    console.log(`Archive fusion variant map: ${path.relative(ROOT, OUT_MD)}`);
    console.log(`Archive fusion variant map JSON: ${path.relative(ROOT, OUT_JSON)}`);
}

main();
