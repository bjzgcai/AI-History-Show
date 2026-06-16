#!/usr/bin/env node
'use strict';

const { milestones } = require('../milestones-data.js');

const STORYLINE_ID = 'bench-council-ai100';
const MIN_OVERLAP_RATIO = 0.35;
const MIN_OVERLAP_TOKENS = 2;

const STOPWORDS = new Set([
    'the',
    'and',
    'or',
    'for',
    'with',
    'from',
    'into',
    'that',
    'this',
    'what',
    'how',
    'why',
    'does',
    'only',
    'just',
    'model',
    'method',
    'system',
    'question',
    'answer',
    '什么',
    '如何',
    '为什么',
    '哪种',
    '哪类',
    '主要',
    '只有',
    '通过',
    '用于',
    '模型',
    '系统',
    '方法'
]);

function flatten(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(flatten).join(' ');
    if (typeof value === 'object') return Object.values(value).map(flatten).join(' ');
    return String(value);
}

function tokenize(text) {
    const matches =
        String(text)
            .toLowerCase()
            .replace(/<[^>]*>/g, ' ')
            .match(/[a-z0-9][a-z0-9-]{2,}|[\u4e00-\u9fff]{2,}/g) || [];
    return [...new Set(matches)].filter((token) => !STOPWORDS.has(token));
}

function visibleMilestoneText(milestone) {
    return flatten({
        title: milestone.title,
        description: milestone.description,
        figures: milestone.figures,
        quote: milestone.quote,
        quoteAttribution: milestone.quoteAttribution,
        commentarySections: milestone.commentarySections,
        achievement: milestone.achievement,
        imageMeta: milestone.resources && milestone.resources.imageMeta
    }).toLowerCase();
}

const failures = [];

for (const milestone of milestones.filter((item) => item.storyline && item.storyline.id === STORYLINE_ID)) {
    const quizzes = Array.isArray(milestone.quizzes) ? milestone.quizzes : [];
    const visibleText = visibleMilestoneText(milestone);

    for (const quiz of quizzes) {
        const answer = quiz.options && quiz.options[quiz.answerIndex];
        const supportTokens = tokenize(`${flatten(answer)} ${flatten(quiz.explanation)}`);
        const matchedTokens = supportTokens.filter((token) => visibleText.includes(token));
        const ratio = supportTokens.length > 0 ? matchedTokens.length / supportTokens.length : 0;

        if (supportTokens.length === 0 || matchedTokens.length < MIN_OVERLAP_TOKENS || ratio < MIN_OVERLAP_RATIO) {
            failures.push({
                milestone: milestone.id,
                title: flatten(milestone.title.en || milestone.title),
                question: flatten(quiz.question),
                answer: flatten(answer),
                matched: matchedTokens,
                missing: supportTokens.filter((token) => !visibleText.includes(token)).slice(0, 10),
                ratio
            });
        }
    }
}

if (failures.length > 0) {
    console.error(`AI100 quizzes not grounded in visible milestone content: ${failures.length}`);
    for (const failure of failures) {
        console.error(
            `- ${failure.milestone} / ${failure.title}: ${failure.answer} ` +
                `(matched ${failure.matched.length}, ratio ${failure.ratio.toFixed(2)}, missing: ${failure.missing.join(', ')})`
        );
    }
    process.exit(1);
}

console.log('All AI100 quizzes are grounded in their visible milestone content.');
