#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildArchivePreview } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'reports', 'archive-build-preview.json');
const SUMMARY_PATH = path.join(ROOT, 'reports', 'archive-build-preview.md');

function writeSummary(output) {
    const lines = [];
    lines.push('# Archive Build Preview');
    lines.push('');
    lines.push(`Generated: ${output.generatedAt}`);
    lines.push('');
    lines.push('This is a preview-only build from `archive/`. It does not replace `milestones-data.js`.');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Storylines: ${output.counts.storylines}`);
    lines.push(`- Milestone previews: ${output.counts.milestones}`);
    lines.push(`- Errors: ${output.counts.errors}`);
    lines.push('');
    lines.push('## Milestones');
    lines.push('');
    for (const milestone of output.milestones) {
        lines.push(
            `- \`${milestone.archiveEventId}\` / \`${milestone.archiveVariantId}\` / \`${milestone.storyline.id}\` — ${milestone.year}`
        );
    }
    lines.push('');
    lines.push('## Errors');
    lines.push('');
    if (output.errors.length === 0) {
        lines.push('None.');
    } else {
        output.errors.forEach((error) => lines.push(`- \`${error.storylineId}\`: ${error.message}`));
    }
    lines.push('');
    fs.writeFileSync(SUMMARY_PATH, `${lines.join('\n')}\n`);
}

const output = buildArchivePreview(ROOT);
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
writeSummary(output);

console.log(`Archive build preview: ${path.relative(ROOT, OUTPUT_PATH)}`);
console.log(`Archive build summary: ${path.relative(ROOT, SUMMARY_PATH)}`);
console.log(`Archive build: ${output.milestones.length} milestone preview(s), ${output.errors.length} error(s).`);

if (output.errors.length > 0) {
    output.errors.slice(0, 20).forEach((error) => console.error(`${error.storylineId}: ${error.message}`));
    process.exitCode = 1;
}
