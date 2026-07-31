#!/usr/bin/env node
'use strict';

const path = require('node:path');

const { auditArchive } = require('./event-figure-rules');

const ROOT = path.resolve(__dirname, '..');
const results = auditArchive(ROOT);
const failures = results.filter((result) => result.issues.length > 0);

if (failures.length > 0) {
    console.error(`Event figure/image rule audit failed for ${failures.length} variant(s):`);
    console.error(`Checked ${results.length} event variant(s).`);
    for (const result of failures) {
        console.error(`- ${result.eventId}/${result.variantId || path.basename(result.file, '.json')}`);
        for (const issue of result.issues) console.error(`  - ${issue}`);
        if (result.firstImage.path) console.error(`  - first image: ${result.firstImage.path}`);
    }
    process.exitCode = 1;
} else {
    console.log(`PASS all ${results.length} variants satisfy the event figure and first-image rules.`);
}
