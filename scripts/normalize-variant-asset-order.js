#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { orderVariantAssetIds } = require('./event-figure-rules');

const ROOT = path.resolve(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const writeChanges = process.argv.includes('--write');
const changes = [];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findJsonValueEnd(source, startIndex) {
    const opening = source[startIndex];
    if (opening === '"') {
        for (let index = startIndex + 1; index < source.length; index += 1) {
            if (source[index] === '\\') index += 1;
            else if (source[index] === '"') return index + 1;
        }
    }

    const closing = opening === '[' ? ']' : opening === '{' ? '}' : '';
    if (closing) {
        let depth = 0;
        let inString = false;
        for (let index = startIndex; index < source.length; index += 1) {
            const character = source[index];
            if (inString) {
                if (character === '\\') index += 1;
                else if (character === '"') inString = false;
                continue;
            }
            if (character === '"') inString = true;
            else if (character === opening) depth += 1;
            else if (character === closing && --depth === 0) return index + 1;
        }
    }

    throw new Error(`Unable to find the end of a JSON value at offset ${startIndex}`);
}

function formatReplacementValue(existingValue, value, propertyIndent) {
    if (!existingValue.includes('\n')) return JSON.stringify(value);
    const itemIndentMatch = existingValue.match(/\n([ \t]+)\S/);
    const itemIndent = itemIndentMatch ? itemIndentMatch[1] : `${propertyIndent}  `;
    return JSON.stringify(value, null, itemIndent.length - propertyIndent.length)
        .split('\n')
        .map((line, index) => (index === 0 ? line : `${propertyIndent}${line}`))
        .join('\n');
}

function replaceTopLevelProperty(source, propertyName, value) {
    const propertyPattern = new RegExp(`^([ \\t]*)"${propertyName}"[ \\t]*:[ \\t]*`, 'm');
    const match = propertyPattern.exec(source);
    if (!match) throw new Error(`Missing top-level property: ${propertyName}`);
    const valueStart = match.index + match[0].length;
    const valueEnd = findJsonValueEnd(source, valueStart);
    const replacement = formatReplacementValue(source.slice(valueStart, valueEnd), value, match[1]);
    return `${source.slice(0, valueStart)}${replacement}${source.slice(valueEnd)}`;
}

for (const eventId of fs.readdirSync(EVENTS_DIR).sort()) {
    const eventDir = path.join(EVENTS_DIR, eventId);
    const eventFile = path.join(eventDir, 'event.json');
    const assetsFile = path.join(eventDir, 'assets.json');
    const variantsDir = path.join(eventDir, 'variants');
    if (!fs.existsSync(eventFile) || !fs.existsSync(assetsFile) || !fs.existsSync(variantsDir)) continue;

    const event = readJson(eventFile);
    const assets = readJson(assetsFile);
    for (const fileName of fs
        .readdirSync(variantsDir)
        .filter((name) => name.endsWith('.json'))
        .sort()) {
        const filePath = path.join(variantsDir, fileName);
        const variant = readJson(filePath);
        const ordered = orderVariantAssetIds(event, variant, assets);
        const assetOrderChanged = JSON.stringify(variant.assetIds || []) !== JSON.stringify(ordered.assetIds);
        const overviewChanged = Boolean(
            ordered.primaryAssetId &&
            variant.overviewImageAssetId &&
            variant.overviewImageAssetId !== ordered.primaryAssetId
        );
        if (!assetOrderChanged && !overviewChanged) continue;

        changes.push({
            file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
            before: variant.assetIds || [],
            after: ordered.assetIds,
            overviewBefore: variant.overviewImageAssetId || '',
            overviewAfter: overviewChanged ? ordered.primaryAssetId : variant.overviewImageAssetId || ''
        });

        if (writeChanges) {
            let source = fs.readFileSync(filePath, 'utf8');
            if (assetOrderChanged) source = replaceTopLevelProperty(source, 'assetIds', ordered.assetIds);
            if (overviewChanged) {
                source = replaceTopLevelProperty(source, 'overviewImageAssetId', ordered.primaryAssetId);
            }
            fs.writeFileSync(filePath, source);
        }
    }
}

for (const change of changes) {
    console.log(`${writeChanges ? 'UPDATED' : 'NEEDS UPDATE'} ${change.file}`);
    console.log(`  assetIds: ${change.before.join(', ')} -> ${change.after.join(', ')}`);
    if (change.overviewBefore !== change.overviewAfter) {
        console.log(`  overviewImageAssetId: ${change.overviewBefore} -> ${change.overviewAfter}`);
    }
}

console.log(`${writeChanges ? 'Updated' : 'Found'} ${changes.length} variant asset order change(s).`);
if (!writeChanges && changes.length > 0) process.exitCode = 1;
