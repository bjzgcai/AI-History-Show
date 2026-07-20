#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_DATA_PATH = path.join(ROOT, '.tmp', 'archive-preview', 'milestones-data-archive-preview.js');
const ARCHIVE_EVENTS_PATH = path.join(ROOT, 'archive', 'events');

const QUOTE_FIELDS = ['quote', 'quoteText', 'quoteHtml', 'quoteMeta', 'quotePage', 'quoteAttribution', 'quoteLabel'];

const ACHIEVEMENT_ARCHIVE_FIELDS = new Set([
    'visual',
    'sources',
    'sourceIds',
    'claims',
    'claimIds',
    'emphasis',
    'archiveSources',
    'archiveSourceIds',
    'archiveClaims',
    'archiveClaimIds',
    'archiveEmphasis'
]);

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonIfChanged(filePath, value) {
    const next = `${JSON.stringify(value, null, 2)}\n`;
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    if (current === next) return false;
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
}

function copyField(target, source, field) {
    if (source[field] === undefined) return false;
    const next = clone(source[field]);
    if (JSON.stringify(target[field]) === JSON.stringify(next)) return false;
    target[field] = next;
    return true;
}

function achievementPresentation(achievement) {
    if (!achievement || typeof achievement !== 'object' || Array.isArray(achievement)) return {};
    return Object.fromEntries(
        Object.entries(achievement)
            .filter(([field, value]) => !ACHIEVEMENT_ARCHIVE_FIELDS.has(field) && value !== undefined)
            .map(([field, value]) => [field, clone(value)])
    );
}

function normalizeQuiz(quiz, storylineId) {
    return {
        id: quiz.id,
        storylineId: quiz.storylineId || storylineId,
        question: clone(quiz.question || { zh: '', en: '' }),
        options: clone(quiz.options || []),
        answer: Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : quiz.answer,
        explanation: clone(quiz.explanation || { zh: '', en: '' }),
        sourceIds: clone(quiz.sourceIds || []),
        assetIds: clone(quiz.assetIds || [])
    };
}

function ensureQuiz(eventDir, variant, milestone) {
    const quiz = Array.isArray(milestone.quizzes) ? milestone.quizzes[0] : null;
    if (!quiz || variant.quizId) return false;

    const quizzesPath = path.join(eventDir, 'quizzes.json');
    const quizzes = readJson(quizzesPath);
    const existing = quizzes.find((item) => item.id === quiz.id);
    if (!existing) quizzes.push(normalizeQuiz(quiz, variant.storylineId));
    variant.quizId = quiz.id;
    writeJsonIfChanged(quizzesPath, quizzes);
    return true;
}

function migrateMilestone(milestone) {
    if (!milestone.archiveEventId || !milestone.archiveVariantId) return { status: 'skipped' };

    const eventDir = path.join(ARCHIVE_EVENTS_PATH, milestone.archiveEventId);
    const variantPath = path.join(eventDir, 'variants', `${milestone.archiveVariantId}.json`);
    if (!fs.existsSync(variantPath)) throw new Error(`Missing archive variant: ${variantPath}`);

    const variant = readJson(variantPath);
    let changed = false;

    changed = copyField(variant, milestone, 'category') || changed;
    changed = copyField(variant, milestone, 'location') || changed;
    changed = copyField(variant, milestone, 'figures') || changed;
    changed = copyField(variant, milestone, 'papers') || changed;
    changed = copyField(variant, milestone, 'photos') || changed;
    changed = copyField(variant, milestone, 'videoUrl') || changed;

    const videos = milestone.resources && milestone.resources.videos;
    if (Array.isArray(videos) && videos.length > 0) {
        variant.resources = variant.resources || {};
        if (JSON.stringify(variant.resources.videos) !== JSON.stringify(videos)) {
            variant.resources.videos = clone(videos);
            changed = true;
        }
    }

    for (const field of QUOTE_FIELDS) changed = copyField(variant, milestone, field) || changed;

    const achievement = achievementPresentation(milestone.achievement);
    if (Object.keys(achievement).length > 0) {
        const nextAchievement = { ...(variant.achievement || {}), ...achievement };
        if (JSON.stringify(variant.achievement) !== JSON.stringify(nextAchievement)) {
            variant.achievement = nextAchievement;
            changed = true;
        }
    }

    if (!variant.analysis && milestone.analysis) {
        variant.analysis = clone(milestone.analysis);
        changed = true;
    }
    if (
        (!Array.isArray(variant.commentarySections) || variant.commentarySections.length === 0) &&
        Array.isArray(milestone.commentarySections) &&
        milestone.commentarySections.length > 0
    ) {
        variant.commentarySections = clone(milestone.commentarySections);
        changed = true;
    }

    changed = ensureQuiz(eventDir, variant, milestone) || changed;
    const written = writeJsonIfChanged(variantPath, variant);
    return { status: changed || written ? 'migrated' : 'unchanged' };
}

function main() {
    delete require.cache[require.resolve(PREVIEW_DATA_PATH)];
    const milestones = require(PREVIEW_DATA_PATH).milestones || [];
    const counts = { migrated: 0, unchanged: 0, skipped: 0 };

    for (const milestone of milestones) {
        const result = migrateMilestone(milestone);
        counts[result.status] += 1;
    }

    console.log(
        `Archive presentation migration: migrated ${counts.migrated}, unchanged ${counts.unchanged}, skipped ${counts.skipped}`
    );
    console.log(
        'Archive-native generation no longer needs the legacy scaffold after this one-time migration output is committed.'
    );
}

main();
