#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const WRITE = process.argv.includes('--write');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function localized(value, locale) {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';
    return String(value[locale] || value[locale === 'en' ? 'zh' : 'en'] || '').trim();
}

function normalizeName(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
        .trim();
}

function meaningfulNameTokens(value) {
    return normalizeName(value)
        .split(' ')
        .filter((token) => token.length > 1);
}

function captionMatchesFigureName(caption, names) {
    const captionTokens = new Set(meaningfulNameTokens(caption));
    return names
        .map(meaningfulNameTokens)
        .filter((tokens) => tokens.length > 0)
        .some((tokens) => tokens.every((token) => captionTokens.has(token)));
}

function localFileExists(relativePath) {
    return Boolean(relativePath && !/^https?:\/\//i.test(relativePath) && fs.existsSync(path.join(ROOT, relativePath)));
}

function candidatePortrait(asset, figureNames) {
    if (!asset || !['image', 'gif'].includes(asset.type) || !localFileExists(asset.path)) return false;
    const caption = [localized(asset.caption, 'en'), localized(asset.caption, 'zh')].join(' ').toLowerCase();
    const description = [localized(asset.subcaption, 'en'), localized(asset.subcaption, 'zh')].join(' ').toLowerCase();
    if (/composite|组合资料图|not a source photograph|不是来源照片/.test(description)) return false;
    return captionMatchesFigureName(caption, figureNames);
}

function objectRangeAt(text, keyIndex) {
    let start = keyIndex;
    while (start >= 0 && text[start] !== '{') start -= 1;
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
        const char = text[index];
        if (inString) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
            continue;
        }
        if (char === '"') inString = true;
        else if (char === '{') depth += 1;
        else if (char === '}') {
            depth -= 1;
            if (depth === 0) return { start, end: index + 1 };
        }
    }
    return null;
}

function setAvatarInObject(objectText, avatar, avatarStyle = '') {
    let updated = objectText;
    if (/"avatar"\s*:\s*"[^"]*"/.test(objectText)) {
        updated = objectText.replace(/"avatar"\s*:\s*"[^"]*"/, `"avatar": ${JSON.stringify(avatar)}`);
    } else {
        const anchor = objectText.match(/^(\s*)"(?:figureType|organizationIds)"\s*:/m);
        if (!anchor) return objectText;
        const insertion = `${anchor[1]}"avatar": ${JSON.stringify(avatar)},\n`;
        updated = objectText.slice(0, anchor.index) + insertion + objectText.slice(anchor.index);
    }

    if (avatarStyle && /"avatarStyle"\s*:\s*""/.test(updated)) {
        updated = updated.replace(/"avatarStyle"\s*:\s*""/, `"avatarStyle": ${JSON.stringify(avatarStyle)}`);
    }
    return updated;
}

function replaceFigureObject(text, lookupText, avatar, avatarStyle = '') {
    const keyIndex = text.indexOf(lookupText);
    if (keyIndex < 0) return { text, changed: false };
    const range = objectRangeAt(text, keyIndex);
    if (!range) return { text, changed: false };
    const original = text.slice(range.start, range.end);
    const updated = setAvatarInObject(original, avatar, avatarStyle);
    if (updated === original) return { text, changed: false };
    return {
        text: text.slice(0, range.start) + updated + text.slice(range.end),
        changed: true
    };
}

function replaceVariantAvatar(text, lookupText, avatar, avatarStyle = '') {
    const nameIndex = text.indexOf(lookupText);
    if (nameIndex < 0) return { text, changed: false };
    const nextFigureIndex = text.indexOf('"name":', nameIndex + lookupText.length);
    const figureEnd = nextFigureIndex >= 0 ? nextFigureIndex : text.length;
    const figureTail = text.slice(nameIndex + lookupText.length, figureEnd);
    const avatarMatch = figureTail.match(/"avatar"\s*:\s*"[^"]*"/);
    if (!avatarMatch) return { text, changed: false };
    const avatarIndex = nameIndex + lookupText.length + avatarMatch.index;
    const original = avatarMatch[0];
    let updated = `"avatar": ${JSON.stringify(avatar)}`;
    const styleIndex = text.indexOf('"avatarStyle": ""', avatarIndex + original.length);
    if (avatarStyle && styleIndex >= 0 && (nextFigureIndex < 0 || styleIndex < nextFigureIndex)) {
        const between = text.slice(avatarIndex + original.length, styleIndex);
        updated += `${between}"avatarStyle": ${JSON.stringify(avatarStyle)}`;
        return {
            text: text.slice(0, avatarIndex) + updated + text.slice(styleIndex + '"avatarStyle": ""'.length),
            changed: true
        };
    }
    return {
        text: text.slice(0, avatarIndex) + updated + text.slice(avatarIndex + original.length),
        changed: true
    };
}

function variantFiles(eventDir) {
    const dir = path.join(eventDir, 'variants');
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => path.join(dir, file));
}

function resolveFigures(event, variants) {
    const fallbackFigures = variants.flatMap((variant) => (Array.isArray(variant.figures) ? variant.figures : []));
    return (event.figures || []).map((figure, index) => {
        const fallback = fallbackFigures[index] || {};
        return {
            figureId: typeof figure === 'string' ? figure : figure.figureId || '',
            nameEn: localized(typeof figure === 'object' ? figure.name : null, 'en') || localized(fallback.name, 'en'),
            nameZh: localized(typeof figure === 'object' ? figure.name : null, 'zh') || localized(fallback.name, 'zh'),
            figureType: (typeof figure === 'object' && figure.figureType) || fallback.figureType || 'person',
            avatar: (typeof figure === 'object' && figure.avatar) || fallback.avatar || '',
            avatarStyle: (typeof figure === 'object' && figure.avatarStyle) || fallback.avatarStyle || ''
        };
    });
}

const changes = [];
const globalSelectedAssets = [];
const globalFigureAvatars = new Map();

function addFigureAvatarCandidate(key, candidate) {
    const normalizedKey = normalizeName(key);
    if (!normalizedKey) return;
    if (!globalFigureAvatars.has(normalizedKey)) globalFigureAvatars.set(normalizedKey, []);
    globalFigureAvatars.get(normalizedKey).push(candidate);
}

function uniqueFigureAvatarCandidate(figure) {
    const candidates = [figure.figureId, figure.nameEn, figure.nameZh]
        .flatMap((key) => globalFigureAvatars.get(normalizeName(key)) || [])
        .filter((candidate) => candidate.figureType === 'person');
    const uniquePaths = [...new Set(candidates.map((candidate) => candidate.avatar))];
    if (uniquePaths.length !== 1) return null;
    const avatar = uniquePaths[0];
    const matching = candidates.filter((candidate) => candidate.avatar === avatar);
    const styles = [...new Set(matching.map((candidate) => candidate.avatarStyle).filter(Boolean))];
    return {
        avatar,
        avatarStyle: styles.length === 1 ? styles[0] : ''
    };
}

function main() {
    for (const entry of fs.readdirSync(EVENTS_DIR, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const eventDir = path.join(EVENTS_DIR, entry.name);
        const eventPath = path.join(eventDir, 'event.json');
        const assetsPath = path.join(eventDir, 'assets.json');
        if (!fs.existsSync(eventPath) || !fs.existsSync(assetsPath)) continue;
        const variants = variantFiles(eventDir).map(readJson);
        const figures = resolveFigures(readJson(eventPath), variants);
        for (const figure of figures) {
            if (!localFileExists(figure.avatar) || figure.figureType !== 'person') continue;
            const candidate = {
                eventId: entry.name,
                figureType: figure.figureType,
                avatar: figure.avatar,
                avatarStyle: figure.avatarStyle
            };
            addFigureAvatarCandidate(figure.figureId, candidate);
            addFigureAvatarCandidate(figure.nameEn, candidate);
            addFigureAvatarCandidate(figure.nameZh, candidate);
        }
        const selectedIds = new Set(variants.flatMap((variant) => variant.assetIds || []));
        for (const asset of readJson(assetsPath)) {
            if (selectedIds.has(asset.id) && localFileExists(asset.path)) {
                globalSelectedAssets.push({ eventId: entry.name, asset });
            }
        }
    }

    for (const entry of fs.readdirSync(EVENTS_DIR, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const eventDir = path.join(EVENTS_DIR, entry.name);
        const eventPath = path.join(eventDir, 'event.json');
        const assetsPath = path.join(eventDir, 'assets.json');
        if (!fs.existsSync(eventPath) || !fs.existsSync(assetsPath)) continue;

        const files = variantFiles(eventDir);
        const variants = files.map(readJson);
        const figures = resolveFigures(readJson(eventPath), variants);
        const avatarByName = new Map();
        const avatarById = new Map();

        for (const figure of figures) {
            const names = [figure.nameEn, figure.nameZh];
            let avatar = localFileExists(figure.avatar) ? figure.avatar : '';
            let avatarStyle = figure.avatarStyle;
            if (!avatar) {
                const candidate = uniqueFigureAvatarCandidate(figure);
                avatar = candidate ? candidate.avatar : '';
                avatarStyle = candidate ? candidate.avatarStyle : '';
            }
            if (!avatar) {
                const candidates = globalSelectedAssets
                    .filter(({ asset }) => candidatePortrait(asset, names))
                    .map(({ asset }) => asset.path);
                const uniquePaths = [...new Set(candidates)];
                if (uniquePaths.length !== 1) continue;
                avatar = uniquePaths[0];
            }
            const resolvedAvatar = { avatar, avatarStyle };
            if (figure.figureId) avatarById.set(figure.figureId, resolvedAvatar);
            for (const name of names.map(normalizeName).filter(Boolean)) avatarByName.set(name, resolvedAvatar);
        }

        if (avatarById.size === 0 && avatarByName.size === 0) continue;

        let eventText = fs.readFileSync(eventPath, 'utf8');
        let eventChanged = false;
        for (const [figureId, resolvedAvatar] of avatarById) {
            const result = replaceFigureObject(
                eventText,
                `"figureId": ${JSON.stringify(figureId)}`,
                resolvedAvatar.avatar,
                resolvedAvatar.avatarStyle
            );
            eventText = result.text;
            eventChanged ||= result.changed;
        }
        if (eventChanged) {
            changes.push(path.relative(ROOT, eventPath));
            if (WRITE) fs.writeFileSync(eventPath, eventText);
        }

        for (const variantPath of files) {
            const variant = readJson(variantPath);
            if (!Array.isArray(variant.figures)) continue;
            let variantText = fs.readFileSync(variantPath, 'utf8');
            let variantChanged = false;
            for (const figure of variant.figures) {
                const nameEn = localized(figure.name, 'en');
                const nameZh = localized(figure.name, 'zh');
                const resolvedAvatar =
                    avatarByName.get(normalizeName(nameEn)) || avatarByName.get(normalizeName(nameZh));
                if (!resolvedAvatar || localFileExists(figure.avatar)) continue;
                const lookupName = nameEn || nameZh;
                const lookupLocale = nameEn ? 'en' : 'zh';
                const result = replaceVariantAvatar(
                    variantText,
                    `"${lookupLocale}": ${JSON.stringify(lookupName)}`,
                    resolvedAvatar.avatar,
                    resolvedAvatar.avatarStyle
                );
                variantText = result.text;
                variantChanged ||= result.changed;
            }
            if (variantChanged) {
                changes.push(path.relative(ROOT, variantPath));
                if (WRITE) fs.writeFileSync(variantPath, variantText);
            }
        }
    }

    const mode = WRITE ? 'updated' : 'would update';
    console.log(`${mode} ${changes.length} Archive file(s).`);
    for (const file of changes) console.log(`- ${file}`);
    if (!WRITE && changes.length > 0) console.log('Run with --write to apply these exact local portrait matches.');
}

if (require.main === module) main();

module.exports = { replaceVariantAvatar, setAvatarInObject };
