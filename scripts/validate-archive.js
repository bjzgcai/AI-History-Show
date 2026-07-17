#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { legacyIdFor } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT, 'archive');
const EVENTS_DIR = path.join(ARCHIVE_DIR, 'events');
const STORYLINES_DIR = path.join(ARCHIVE_DIR, 'storylines');
const REPORT_PATH = path.join(ROOT, 'reports', 'archive-validation.md');

const REQUIRED_EVENT_FILES = ['event.json', 'claims.json', 'sources.json', 'assets.json', 'quizzes.json'];
const LOCALIZED_REQUIRED_KEYS = ['zh', 'en'];

const state = {
    errors: [],
    warnings: [],
    events: [],
    storylines: [],
    assetRefs: [],
    counts: {
        events: 0,
        claims: 0,
        sources: 0,
        assets: 0,
        quizzes: 0,
        variants: 0,
        storylines: 0
    }
};

function rel(filePath) {
    return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function addError(filePath, message) {
    state.errors.push({ file: rel(filePath), message });
}

function addWarning(filePath, message) {
    state.warnings.push({ file: rel(filePath), message });
}

function readJson(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
        if (!options.optional) addError(filePath, 'Missing required JSON file.');
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        addError(filePath, `Invalid JSON: ${error.message}`);
        return null;
    }
}

function isObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function checkLocalized(filePath, value, label, options = {}) {
    const required = options.required !== false;
    if (!isObject(value)) {
        if (required) addError(filePath, `${label} must be a localized object with zh/en fields.`);
        return false;
    }

    let ok = true;
    for (const locale of LOCALIZED_REQUIRED_KEYS) {
        if (!hasText(value[locale])) {
            ok = false;
            addError(filePath, `${label}.${locale} is required and must be non-empty.`);
        }
    }
    return ok;
}

function toIdSet(items) {
    return new Set((Array.isArray(items) ? items : []).map((item) => item && item.id).filter(Boolean));
}

function checkUniqueIds(filePath, items, label) {
    if (!Array.isArray(items)) {
        addError(filePath, `${label} must be an array.`);
        return;
    }

    const seen = new Set();
    for (const item of items) {
        if (!isObject(item)) {
            addError(filePath, `${label} entries must be objects.`);
            continue;
        }
        if (!hasText(item.id)) {
            addError(filePath, `${label} entry is missing id.`);
            continue;
        }
        if (seen.has(item.id)) {
            addError(filePath, `${label} has duplicate id: ${item.id}`);
        }
        seen.add(item.id);
    }
}

function resolveAssetPath(assetPath) {
    if (!hasText(assetPath) || /^https?:\/\//i.test(assetPath)) return '';
    return path.resolve(ROOT, assetPath);
}

function validateClaims(eventDir, claims, sourceIds) {
    const filePath = path.join(eventDir, 'claims.json');
    if (!Array.isArray(claims)) {
        addError(filePath, 'claims.json must be an array.');
        return;
    }
    checkUniqueIds(filePath, claims, 'claims');
    state.counts.claims += claims.length;

    for (const claim of claims) {
        if (!isObject(claim)) continue;
        checkLocalized(filePath, claim.text, `claim ${claim.id || '<missing>'} text`);
        if (!Array.isArray(claim.sourceIds) || claim.sourceIds.length === 0) {
            addError(filePath, `claim ${claim.id || '<missing>'} must include at least one sourceId.`);
        } else {
            for (const sourceId of claim.sourceIds) {
                if (!sourceIds.has(sourceId)) {
                    addError(filePath, `claim ${claim.id} references missing sourceId: ${sourceId}`);
                }
            }
        }
        if (claim.importance === 'core' && (!Array.isArray(claim.sourceIds) || claim.sourceIds.length === 0)) {
            addError(filePath, `core claim ${claim.id || '<missing>'} must include at least one sourceId.`);
        }
    }
}

function validateSources(eventDir, sources) {
    const filePath = path.join(eventDir, 'sources.json');
    if (!Array.isArray(sources)) {
        addError(filePath, 'sources.json must be an array.');
        return new Set();
    }
    checkUniqueIds(filePath, sources, 'sources');
    state.counts.sources += sources.length;

    for (const source of sources) {
        if (!isObject(source)) continue;
        if (!hasText(source.type)) addError(filePath, `source ${source.id || '<missing>'} is missing type.`);
        if (!hasText(source.title) && !isObject(source.title)) {
            addError(filePath, `source ${source.id || '<missing>'} is missing title.`);
        }
        if (!hasText(source.url) && !hasText(source.doi) && !hasText(source.archiveUrl)) {
            addError(filePath, `source ${source.id || '<missing>'} must include url, doi, or archiveUrl.`);
        }
    }

    return toIdSet(sources);
}

function validateAssets(eventDir, assets, sourceIds) {
    const filePath = path.join(eventDir, 'assets.json');
    if (!Array.isArray(assets)) {
        addError(filePath, 'assets.json must be an array.');
        return new Set();
    }
    checkUniqueIds(filePath, assets, 'assets');
    state.counts.assets += assets.length;

    for (const asset of assets) {
        if (!isObject(asset)) continue;
        if (!hasText(asset.type)) addError(filePath, `asset ${asset.id || '<missing>'} is missing type.`);
        if (!hasText(asset.path)) {
            addError(filePath, `asset ${asset.id || '<missing>'} is missing path.`);
        } else if (/^https?:\/\//i.test(asset.path)) {
            state.assetRefs.push({ eventId: path.basename(eventDir), assetId: asset.id, path: asset.path });
        } else if (!fs.existsSync(resolveAssetPath(asset.path))) {
            addError(filePath, `asset ${asset.id} path does not exist: ${asset.path}`);
        } else {
            state.assetRefs.push({ eventId: path.basename(eventDir), assetId: asset.id, path: asset.path });
        }
        if (!hasText(asset.role)) addError(filePath, `asset ${asset.id || '<missing>'} is missing role.`);
        checkLocalized(filePath, asset.caption, `asset ${asset.id || '<missing>'} caption`);

        const ids = Array.isArray(asset.sourceIds) ? asset.sourceIds : asset.sourceId ? [asset.sourceId] : [];
        if (ids.length === 0) {
            addError(filePath, `asset ${asset.id || '<missing>'} must include sourceId or sourceIds.`);
        }
        for (const sourceId of ids) {
            if (!sourceIds.has(sourceId)) {
                addError(filePath, `asset ${asset.id} references missing sourceId: ${sourceId}`);
            }
        }

        if (!isObject(asset.rights)) {
            addError(filePath, `asset ${asset.id || '<missing>'} is missing rights.`);
        }
        if (!Array.isArray(asset.usage) || asset.usage.length === 0) {
            addError(filePath, `asset ${asset.id || '<missing>'} must include usage.`);
        }
    }

    return toIdSet(assets);
}

function validateQuizzes(eventDir, quizzes, sourceIds, assetIds) {
    const filePath = path.join(eventDir, 'quizzes.json');
    if (!Array.isArray(quizzes)) {
        addError(filePath, 'quizzes.json must be an array.');
        return new Set();
    }
    checkUniqueIds(filePath, quizzes, 'quizzes');
    state.counts.quizzes += quizzes.length;

    for (const quiz of quizzes) {
        if (!isObject(quiz)) continue;
        checkLocalized(filePath, quiz.question, `quiz ${quiz.id || '<missing>'} question`);
        if (!Array.isArray(quiz.options) || quiz.options.length < 2) {
            addError(filePath, `quiz ${quiz.id || '<missing>'} must include at least two options.`);
        } else {
            quiz.options.forEach((option, index) => {
                const value = isObject(option) && isObject(option.text) ? option.text : option;
                checkLocalized(filePath, value, `quiz ${quiz.id || '<missing>'} option ${index}`);
            });
        }
        if (quiz.answer === undefined || quiz.answer === null) {
            addError(filePath, `quiz ${quiz.id || '<missing>'} is missing answer.`);
        }
        for (const sourceId of quiz.sourceIds || []) {
            if (!sourceIds.has(sourceId))
                addError(filePath, `quiz ${quiz.id} references missing sourceId: ${sourceId}`);
        }
        for (const assetId of quiz.assetIds || []) {
            if (!assetIds.has(assetId)) addError(filePath, `quiz ${quiz.id} references missing assetId: ${assetId}`);
        }
    }

    return toIdSet(quizzes);
}

function validateVariantPapers(filePath, papers) {
    if (papers === undefined) return;
    if (!Array.isArray(papers)) {
        addError(filePath, 'variant papers must be an array.');
        return;
    }

    papers.forEach((paper, index) => {
        const label = `papers[${index}]`;
        if (!isObject(paper)) {
            addError(filePath, `${label} must be an object.`);
            return;
        }
        checkLocalized(filePath, paper.title, `${label}.title`);
        checkLocalized(filePath, paper.authors, `${label}.authors`);
        checkLocalized(filePath, paper.journal, `${label}.journal`);
        if (!hasText(String(paper.year || ''))) addError(filePath, `${label}.year is required.`);
        if (!hasText(paper.url)) {
            addError(filePath, `${label}.url is required.`);
        } else if (!/^https?:\/\//i.test(paper.url) && !fs.existsSync(resolveAssetPath(paper.url))) {
            addError(filePath, `${label}.url does not exist: ${paper.url}`);
        }
    });
}

function validateVariant(eventDir, eventId, filePath, sourceIds, assetIds, claimIds, quizIds) {
    const variant = readJson(filePath);
    if (!variant) return null;
    state.counts.variants += 1;

    const variantId = path.basename(filePath, '.json');
    if (variant.eventId !== eventId) {
        addError(filePath, `variant eventId (${variant.eventId}) must match event directory (${eventId}).`);
    }
    if (variant.storylineId !== variantId) {
        addWarning(filePath, `variant storylineId (${variant.storylineId}) differs from file name (${variantId}).`);
    }

    for (const sourceId of variant.sourceIds || []) {
        if (!sourceIds.has(sourceId)) addError(filePath, `variant references missing sourceId: ${sourceId}`);
    }
    for (const assetId of variant.assetIds || []) {
        if (!assetIds.has(assetId)) addError(filePath, `variant references missing assetId: ${assetId}`);
    }
    for (const claimId of variant.claimIds || []) {
        if (!claimIds.has(claimId)) addError(filePath, `variant references missing claimId: ${claimId}`);
    }
    if (variant.quizId && !quizIds.has(variant.quizId)) {
        addError(filePath, `variant references missing quizId: ${variant.quizId}`);
    }
    validateVariantPapers(filePath, variant.papers);

    if (Array.isArray(variant.commentarySections)) {
        variant.commentarySections.forEach((section, index) => {
            checkLocalized(filePath, section && section.label, `commentarySections[${index}].label`);
            checkLocalized(filePath, section && section.html, `commentarySections[${index}].html`);
            for (const sourceId of (section && section.sourceIds) || []) {
                if (!sourceIds.has(sourceId)) {
                    addError(filePath, `commentarySections[${index}] references missing sourceId: ${sourceId}`);
                }
            }
        });
    }

    return { id: variantId, file: rel(filePath), eventId, storylineId: variant.storylineId };
}

function validateEventDir(eventDir) {
    const eventId = path.basename(eventDir);
    for (const fileName of REQUIRED_EVENT_FILES) {
        const filePath = path.join(eventDir, fileName);
        if (!fs.existsSync(filePath)) addError(filePath, 'Missing required event file.');
    }

    const eventFile = path.join(eventDir, 'event.json');
    const event = readJson(eventFile);
    if (!event) return;

    state.counts.events += 1;
    if (event.id !== eventId) addError(eventFile, `event.id (${event.id}) must match directory name (${eventId}).`);
    if (event.year === undefined || event.year === null || event.year === '')
        addError(eventFile, 'event.year is required.');
    checkLocalized(eventFile, event.title, 'event.title');
    if (event.summary) checkLocalized(eventFile, event.summary, 'event.summary');
    if (event.description) checkLocalized(eventFile, event.description, 'event.description');

    const sources = readJson(path.join(eventDir, 'sources.json')) || [];
    const sourceIds = validateSources(eventDir, sources);
    const claims = readJson(path.join(eventDir, 'claims.json')) || [];
    validateClaims(eventDir, claims, sourceIds);
    const claimIds = toIdSet(claims);
    const assets = readJson(path.join(eventDir, 'assets.json')) || [];
    const assetIds = validateAssets(eventDir, assets, sourceIds);
    const quizzes = readJson(path.join(eventDir, 'quizzes.json')) || [];
    const quizIds = validateQuizzes(eventDir, quizzes, sourceIds, assetIds);

    const variantsDir = path.join(eventDir, 'variants');
    const variants = [];
    if (!fs.existsSync(variantsDir)) {
        addError(variantsDir, 'Missing variants directory.');
    } else {
        const variantFiles = fs
            .readdirSync(variantsDir)
            .filter((file) => file.endsWith('.json'))
            .sort();
        if (variantFiles.length === 0) addWarning(variantsDir, 'Event has no variants.');
        for (const fileName of variantFiles) {
            const variant = validateVariant(
                eventDir,
                eventId,
                path.join(variantsDir, fileName),
                sourceIds,
                assetIds,
                claimIds,
                quizIds
            );
            if (variant) variants.push(variant);
        }
    }

    state.events.push({ id: eventId, file: rel(eventFile), variants });
}

function validateStorylines(eventIds) {
    if (!fs.existsSync(STORYLINES_DIR)) {
        addError(STORYLINES_DIR, 'Missing archive/storylines directory.');
        return;
    }

    const storylineFiles = fs
        .readdirSync(STORYLINES_DIR)
        .filter((file) => file.endsWith('.json'))
        .sort();
    const milestoneIds = new Set();
    const generatedMilestoneId = (storylineId, ref) =>
        ref.milestoneId || legacyIdFor(storylineId, ref.eventId) || `archive-preview-${storylineId}-${ref.eventId}`;
    for (const fileName of storylineFiles) {
        const filePath = path.join(STORYLINES_DIR, fileName);
        const storyline = readJson(filePath);
        if (!storyline) continue;
        state.counts.storylines += 1;

        const storylineId = path.basename(fileName, '.json');
        if (storyline.id !== storylineId) {
            addError(filePath, `storyline.id (${storyline.id}) must match file name (${storylineId}).`);
        }
        checkLocalized(filePath, storyline.title, 'storyline.title');
        if (!Array.isArray(storyline.events)) {
            addError(filePath, 'storyline.events must be an array.');
            continue;
        }

        const seenRefs = new Set();
        for (const ref of storyline.events) {
            if (!isObject(ref)) {
                addError(filePath, 'storyline event references must be objects.');
                continue;
            }
            if (!eventIds.has(ref.eventId)) {
                addError(filePath, `storyline references missing eventId: ${ref.eventId}`);
                continue;
            }
            const variantFile = path.join(EVENTS_DIR, ref.eventId, 'variants', `${ref.variant}.json`);
            if (!fs.existsSync(variantFile)) {
                addError(filePath, `storyline references missing variant: ${ref.eventId}/variants/${ref.variant}.json`);
            }
            const milestoneId = generatedMilestoneId(storylineId, ref);
            if (milestoneId.startsWith('archive-preview-')) {
                continue;
            }
            if (!/^milestone-[a-z0-9][a-z0-9._-]*$/.test(milestoneId)) {
                addError(filePath, `storyline event has invalid milestoneId: ${milestoneId}`);
            } else if (ref.enabled !== false && milestoneIds.has(milestoneId)) {
                addError(filePath, `enabled storyline event has duplicate milestoneId: ${milestoneId}`);
            } else if (ref.enabled !== false) {
                milestoneIds.add(milestoneId);
            }
            const key = `${ref.eventId}/${ref.variant}`;
            if (seenRefs.has(key)) addError(filePath, `storyline has duplicate event reference: ${key}`);
            seenRefs.add(key);
        }

        state.storylines.push({ id: storylineId, file: rel(filePath), events: storyline.events.length });
    }
}

function writeReport() {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

    const lines = [];
    lines.push('# Archive Validation Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Events: ${state.counts.events}`);
    lines.push(`- Storylines: ${state.counts.storylines}`);
    lines.push(`- Variants: ${state.counts.variants}`);
    lines.push(`- Claims: ${state.counts.claims}`);
    lines.push(`- Sources: ${state.counts.sources}`);
    lines.push(`- Assets: ${state.counts.assets}`);
    lines.push(`- Quizzes: ${state.counts.quizzes}`);
    lines.push(`- Errors: ${state.errors.length}`);
    lines.push(`- Warnings: ${state.warnings.length}`);
    lines.push('');

    lines.push('## Events');
    lines.push('');
    for (const event of state.events.sort((a, b) => a.id.localeCompare(b.id))) {
        lines.push(
            `- \`${event.id}\` — variants: ${event.variants.map((variant) => `\`${variant.id}\``).join(', ') || 'none'}`
        );
    }
    lines.push('');

    lines.push('## Storylines');
    lines.push('');
    for (const storyline of state.storylines.sort((a, b) => a.id.localeCompare(b.id))) {
        lines.push(`- \`${storyline.id}\` — event refs: ${storyline.events}`);
    }
    lines.push('');

    lines.push('## Errors');
    lines.push('');
    if (state.errors.length === 0) {
        lines.push('None.');
    } else {
        for (const error of state.errors) lines.push(`- \`${error.file}\`: ${error.message}`);
    }
    lines.push('');

    lines.push('## Warnings');
    lines.push('');
    if (state.warnings.length === 0) {
        lines.push('None.');
    } else {
        for (const warning of state.warnings) lines.push(`- \`${warning.file}\`: ${warning.message}`);
    }
    lines.push('');

    lines.push('## Asset references');
    lines.push('');
    for (const asset of state.assetRefs.sort((a, b) => a.path.localeCompare(b.path))) {
        lines.push(`- \`${asset.path}\` — ${asset.eventId}/${asset.assetId}`);
    }
    lines.push('');

    fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`);
}

function main() {
    if (!fs.existsSync(EVENTS_DIR)) {
        addError(EVENTS_DIR, 'Missing archive/events directory.');
    } else {
        const eventDirs = fs
            .readdirSync(EVENTS_DIR, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(EVENTS_DIR, entry.name))
            .sort();
        for (const eventDir of eventDirs) validateEventDir(eventDir);
    }

    validateStorylines(new Set(state.events.map((event) => event.id)));
    writeReport();

    console.log(`Archive validation report: ${rel(REPORT_PATH)}`);
    console.log(
        `Archive validation: ${state.errors.length} error(s), ${state.warnings.length} warning(s), ${state.counts.events} event(s), ${state.counts.storylines} storyline(s).`
    );

    if (state.errors.length > 0) {
        for (const error of state.errors.slice(0, 20)) {
            console.error(`${error.file}: ${error.message}`);
        }
        if (state.errors.length > 20) console.error(`... ${state.errors.length - 20} more error(s)`);
        process.exitCode = 1;
    }
}

main();
