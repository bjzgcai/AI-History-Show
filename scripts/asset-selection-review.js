'use strict';

const SELECTION_REVIEW_STATUSES = new Set(['excluded-from-variants']);
const SELECTION_REVIEW_REASON_CODES = new Set(['curated-figure-scope', 'display-quality', 'historical-reference']);

function isObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isValidIsoDate(value) {
    const text = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const timestamp = Date.parse(`${text}T00:00:00Z`);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === text;
}

function validateAssetSelectionReview(review) {
    if (review === undefined) return [];
    if (!isObject(review)) return ['must be an object'];

    const issues = [];
    const status = String(review.status || '').trim();
    const reasonCode = String(review.reasonCode || '').trim();
    if (!SELECTION_REVIEW_STATUSES.has(status)) {
        issues.push(`status must be one of: ${[...SELECTION_REVIEW_STATUSES].join(', ')}`);
    }
    if (!SELECTION_REVIEW_REASON_CODES.has(reasonCode)) {
        issues.push(`reasonCode must be one of: ${[...SELECTION_REVIEW_REASON_CODES].join(', ')}`);
    }
    if (!isObject(review.reason)) {
        issues.push('reason must be a localized object');
    } else {
        for (const locale of ['en', 'zh']) {
            if (!String(review.reason[locale] || '').trim()) issues.push(`reason.${locale} is required`);
        }
    }
    if (!isValidIsoDate(review.reviewedAt)) issues.push('reviewedAt must be a valid YYYY-MM-DD date');
    return issues;
}

function isAssetSelectionExcluded(asset) {
    return String(asset && asset.selectionReview && asset.selectionReview.status).trim() === 'excluded-from-variants';
}

module.exports = {
    SELECTION_REVIEW_REASON_CODES,
    SELECTION_REVIEW_STATUSES,
    isAssetSelectionExcluded,
    validateAssetSelectionReview
};
