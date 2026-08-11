'use strict';

const fs = require('node:fs');
const path = require('node:path');

function cloneJson(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mergePresentation(base, override) {
    if (override === undefined) return cloneJson(base);
    if (override === null) return null;
    if (Array.isArray(base) || Array.isArray(override)) return cloneJson(override);
    if (!isPlainObject(base) || !isPlainObject(override)) return cloneJson(override);

    const result = cloneJson(base) || {};
    for (const [key, value] of Object.entries(override)) {
        if (value === undefined) continue;
        if (value === null) {
            delete result[key];
            continue;
        }
        result[key] = mergePresentation(result[key], value);
    }
    return result;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function variantFilePath(eventDir, variantId) {
    return path.join(eventDir, 'variants', `${variantId}.json`);
}

function presentationIdForRef(ref, storylineId) {
    return String((ref && ref.variant) || storylineId || '').trim();
}

function stripVariantIdentity(variant) {
    if (!isPlainObject(variant)) return {};
    const { eventId: _eventId, storylineId: _storylineId, ...presentation } = variant;
    return presentation;
}

function resolveEffectivePresentation({ root, eventDir, event, eventId, storylineId, ref = {} }) {
    const defaultPresentation = isPlainObject(event && event.defaultPresentation)
        ? cloneJson(event.defaultPresentation)
        : {};
    const explicitVariantId = String(ref.variant || '').trim();
    const overrideId = presentationIdForRef(ref, storylineId);
    const overridePath = overrideId ? variantFilePath(eventDir, overrideId) : '';
    const hasOverride = Boolean(overridePath && fs.existsSync(overridePath));

    if (explicitVariantId && !hasOverride) {
        throw new Error(`Missing variant: ${eventId}/${explicitVariantId}`);
    }
    if (!isPlainObject(event && event.defaultPresentation) && !hasOverride) {
        throw new Error(`Missing defaultPresentation or variant override: ${eventId}/${overrideId || storylineId}`);
    }

    const override = hasOverride ? stripVariantIdentity(readJson(overridePath)) : {};
    const presentation = mergePresentation(defaultPresentation, override) || {};
    return {
        presentation,
        defaultPresentation,
        override,
        hasDefaultPresentation: isPlainObject(event && event.defaultPresentation),
        overrideId,
        overrideFile: hasOverride && root ? path.relative(root, overridePath).replace(/\\/g, '/') : '',
        overridePath: hasOverride ? overridePath : ''
    };
}

module.exports = {
    cloneJson,
    mergePresentation,
    presentationIdForRef,
    resolveEffectivePresentation,
    stripVariantIdentity,
    variantFilePath
};
