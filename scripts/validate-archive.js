#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const ARCHIVE_DIR = path.join(ROOT, 'archive');
const EVENTS_DIR = path.join(ARCHIVE_DIR, 'events');
const STORYLINES_DIR = path.join(ARCHIVE_DIR, 'storylines');
const reportJsonPath = path.join(REPORTS_DIR, 'archive-validation-report.json');
const reportMdPath = path.join(REPORTS_DIR, 'archive-validation-report.md');

function readJson(file, issues) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        issues.push(issue('error', 'json.invalid', file, error.message));
        return null;
    }
}

function issue(severity, code, file, message, details = {}) {
    return {
        severity,
        code,
        file: path.relative(ROOT, file),
        message,
        ...details
    };
}

function localizedComplete(value) {
    return Boolean(value && typeof value === 'object' && value.en && value.zh);
}

function existingPath(resourcePath) {
    if (!resourcePath || typeof resourcePath !== 'string') return false;
    const absolutePath = path.isAbsolute(resourcePath) ? resourcePath : path.join(ROOT, resourcePath);
    return fs.existsSync(absolutePath);
}

function eventIds() {
    if (!fs.existsSync(EVENTS_DIR)) return [];
    return fs
        .readdirSync(EVENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

function validateRequiredFile(eventDir, filename, issues) {
    const file = path.join(eventDir, filename);
    if (!fs.existsSync(file)) {
        issues.push(issue('error', 'event.fileMissing', file, `Missing ${filename}`));
        return null;
    }
    return readJson(file, issues);
}

function validateClaims(eventDir, claims, sourceIds, issues) {
    if (!Array.isArray(claims)) {
        issues.push(
            issue('error', 'claims.notArray', path.join(eventDir, 'claims.json'), 'claims.json must be an array')
        );
        return;
    }

    for (const claim of claims) {
        const sourceRefs = Array.isArray(claim.sourceIds) ? claim.sourceIds : [];
        if (sourceRefs.length === 0) {
            issues.push(
                issue(
                    'error',
                    'claim.sourceMissing',
                    path.join(eventDir, 'claims.json'),
                    `Claim ${claim.id || '(no id)'} has no sourceIds`
                )
            );
            continue;
        }
        for (const sourceId of sourceRefs) {
            if (!sourceIds.has(sourceId)) {
                issues.push(
                    issue(
                        'error',
                        'claim.sourceUnknown',
                        path.join(eventDir, 'claims.json'),
                        `Claim ${claim.id || '(no id)'} references unknown source ${sourceId}`
                    )
                );
            }
        }
    }
}

function validateAssets(eventDir, assets, sourceIds, issues) {
    if (!Array.isArray(assets)) {
        issues.push(
            issue('error', 'assets.notArray', path.join(eventDir, 'assets.json'), 'assets.json must be an array')
        );
        return;
    }

    for (const asset of assets) {
        const assetLabel = asset.id || asset.path || '(no id)';
        if (!existingPath(asset.path)) {
            issues.push(
                issue(
                    'error',
                    'asset.resourceMissing',
                    path.join(eventDir, 'assets.json'),
                    `Asset resource is missing: ${asset.path || assetLabel}`
                )
            );
        }
        if (!localizedComplete(asset.caption)) {
            issues.push(
                issue(
                    'error',
                    'asset.captionMissing',
                    path.join(eventDir, 'assets.json'),
                    `Asset ${assetLabel} lacks bilingual caption`
                )
            );
        }
        if (!asset.sourceId && !asset.sourceUrl) {
            issues.push(
                issue(
                    'error',
                    'asset.sourceMissing',
                    path.join(eventDir, 'assets.json'),
                    `Asset ${assetLabel} lacks sourceId/sourceUrl`
                )
            );
        }
        if (asset.sourceId && !sourceIds.has(asset.sourceId)) {
            issues.push(
                issue(
                    'error',
                    'asset.sourceUnknown',
                    path.join(eventDir, 'assets.json'),
                    `Asset ${assetLabel} references unknown source ${asset.sourceId}`
                )
            );
        }
        if (!asset.rights) {
            issues.push(
                issue(
                    'error',
                    'asset.rightsMissing',
                    path.join(eventDir, 'assets.json'),
                    `Asset ${assetLabel} lacks rights`
                )
            );
        }
        if (!localizedComplete(asset.usage)) {
            issues.push(
                issue(
                    'error',
                    'asset.usageMissing',
                    path.join(eventDir, 'assets.json'),
                    `Asset ${assetLabel} lacks bilingual usage`
                )
            );
        }
    }
}

function validateEvent(eventId, issues) {
    const eventDir = path.join(EVENTS_DIR, eventId);
    const event = validateRequiredFile(eventDir, 'event.json', issues);
    const claims = validateRequiredFile(eventDir, 'claims.json', issues);
    const sources = validateRequiredFile(eventDir, 'sources.json', issues);
    const assets = validateRequiredFile(eventDir, 'assets.json', issues);
    validateRequiredFile(eventDir, 'quizzes.json', issues);

    const sourceIds = new Set(Array.isArray(sources) ? sources.map((source) => source.id).filter(Boolean) : []);
    if (!event) return;
    if (event.id !== eventId) {
        issues.push(
            issue(
                'error',
                'event.idMismatch',
                path.join(eventDir, 'event.json'),
                `event.id must match directory name ${eventId}`
            )
        );
    }
    if (!localizedComplete(event.title)) {
        issues.push(
            issue(
                'error',
                'event.titleMissing',
                path.join(eventDir, 'event.json'),
                'Event title must include en and zh'
            )
        );
    }
    validateClaims(eventDir, claims || [], sourceIds, issues);
    validateAssets(eventDir, assets || [], sourceIds, issues);
}

function validateStorylines(knownEventIds, issues) {
    if (!fs.existsSync(STORYLINES_DIR)) return;
    const files = fs.readdirSync(STORYLINES_DIR).filter((file) => file.endsWith('.json'));

    for (const filename of files) {
        const file = path.join(STORYLINES_DIR, filename);
        const storyline = readJson(file, issues);
        if (!storyline) continue;
        for (const item of storyline.events || []) {
            const eventId = typeof item === 'string' ? item : item.eventId;
            if (!knownEventIds.has(eventId)) {
                issues.push(
                    issue('error', 'storyline.eventUnknown', file, `Storyline references unknown event ${eventId}`)
                );
            }
            const variantId = typeof item === 'string' ? 'default' : item.variantId || 'default';
            const variantFile = path.join(EVENTS_DIR, eventId || '', 'variants', `${variantId}.json`);
            if (eventId && knownEventIds.has(eventId) && !fs.existsSync(variantFile)) {
                issues.push(
                    issue(
                        'error',
                        'storyline.variantUnknown',
                        file,
                        `Storyline references missing variant ${eventId}/${variantId}`
                    )
                );
            }
        }
    }
}

function writeReport(issues, ids) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const summary = {
        generatedAt: new Date().toISOString(),
        eventCount: ids.length,
        issueCount: issues.length,
        errorCount: issues.filter((item) => item.severity === 'error').length
    };
    fs.writeFileSync(reportJsonPath, JSON.stringify({ summary, issues }, null, 2), 'utf8');

    const lines = [
        '# Archive Validation Report',
        '',
        `Generated: ${summary.generatedAt}`,
        `Events checked: ${summary.eventCount}`,
        `Issues: ${summary.issueCount}`,
        ''
    ];
    if (issues.length === 0) {
        lines.push('No archive validation issues found.');
    } else {
        for (const item of issues) {
            lines.push(`- [${item.severity}] ${item.code} in ${item.file}: ${item.message}`);
        }
    }
    fs.writeFileSync(reportMdPath, `${lines.join('\n')}\n`, 'utf8');
}

const ids = eventIds();
const issues = [];
if (!fs.existsSync(ARCHIVE_DIR)) {
    issues.push(issue('error', 'archive.missing', ARCHIVE_DIR, 'archive/ directory is missing'));
}

for (const eventId of ids) {
    validateEvent(eventId, issues);
}
validateStorylines(new Set(ids), issues);
writeReport(issues, ids);

if (issues.length > 0) {
    console.error(
        `Archive validation failed with ${issues.length} issue(s). See ${path.relative(ROOT, reportMdPath)}.`
    );
    process.exitCode = 1;
} else {
    console.log(`Archive validation passed for ${ids.length} event(s). Report: ${path.relative(ROOT, reportMdPath)}`);
}
