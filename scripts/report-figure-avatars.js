#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'manage', 'figure-avatar-report.md');
const AVATAR_REGISTRY_PATH = path.join(ROOT, 'manage', 'figure-avatars.js');

const events = require(path.join(ROOT, 'manage', 'events.js'));
const avatarRegistry = loadAvatarRegistry();

function escapeCell(value) {
    return String(value == null ? '' : value)
        .replace(/\|/g, '\\|')
        .replace(/\n/g, '<br>');
}

function getRegistryEntry(name) {
    return avatarRegistry[name] || null;
}

function loadAvatarRegistry() {
    if (!fs.existsSync(AVATAR_REGISTRY_PATH)) {
        console.warn('[警告] manage/figure-avatars.js 不存在，报告将按空注册表处理。');
        return {};
    }

    return require(AVATAR_REGISTRY_PATH);
}

function resolveAvatarPath(avatarPath) {
    const trimmed = String(avatarPath || '').trim();
    if (!trimmed) return '';
    return path.isAbsolute(trimmed) ? trimmed : path.join(ROOT, trimmed);
}

function getAvatarInfo(name, figure) {
    if (figure && typeof figure.avatar === 'string' && figure.avatar.trim()) {
        const avatar = figure.avatar.trim();
        return {
            avatar,
            exists: fs.existsSync(resolveAvatarPath(avatar))
        };
    }
    const entry = getRegistryEntry(name);
    const avatar = entry && entry.avatar ? String(entry.avatar).trim() : '';
    return {
        avatar,
        exists: avatar ? fs.existsSync(resolveAvatarPath(avatar)) : false
    };
}

function getLegacyPeopleCount(event) {
    return (event.images || []).filter((item) => /\/people\//.test(String(item || ''))).length;
}

const figureMap = new Map();
const eventRows = [];

for (const [key, event] of Object.entries(events)) {
    const figures = Array.isArray(event.figures) ? event.figures.filter(Boolean) : [];
    const readyCount = figures.filter((figure) => getAvatarInfo(figure.name, figure).exists).length;
    const totalCount = figures.length;
    const legacyPeopleCount = getLegacyPeopleCount(event);
    const state =
        totalCount === 0 ? 'no-figures' : readyCount === totalCount ? 'full' : readyCount > 0 ? 'partial' : 'none';

    eventRows.push({
        key,
        title: event.title || key,
        totalCount,
        readyCount,
        legacyPeopleCount,
        missingCount: Math.max(0, totalCount - readyCount),
        state
    });

    figures.forEach((figure) => {
        const name = String((figure || {}).name || '').trim();
        if (!name) return;

        if (!figureMap.has(name)) {
            const entry = getRegistryEntry(name) || {};
            figureMap.set(name, {
                name,
                type: entry.type || 'person',
                status: entry.status || 'unregistered',
                wikipediaTitle: entry.wikipediaTitle || '',
                avatar: entry.avatar || '',
                avatarExists: entry.avatar ? fs.existsSync(resolveAvatarPath(entry.avatar)) : false,
                note: entry.note || '',
                roles: new Set(),
                events: new Set()
            });
        }

        const item = figureMap.get(name);
        const avatarInfo = getAvatarInfo(name, figure);
        if (figure.role) item.roles.add(figure.role);
        item.events.add(key);
        if (!item.avatar && avatarInfo.avatar) item.avatar = avatarInfo.avatar;
        item.avatarExists = item.avatarExists || avatarInfo.exists;
    });
}

const figureRows = [...figureMap.values()]
    .map((item) => ({
        ...item,
        roles: [...item.roles].sort(),
        events: [...item.events].sort()
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const summary = {
    eventCount: eventRows.length,
    uniqueFigureCount: figureRows.length,
    readyFigureCount: figureRows.filter((item) => item.avatarExists).length,
    missingFigureCount: figureRows.filter((item) => !item.avatarExists).length,
    fullEventCount: eventRows.filter((item) => item.state === 'full').length,
    partialEventCount: eventRows.filter((item) => item.state === 'partial').length,
    noneEventCount: eventRows.filter((item) => item.state === 'none').length
};

const priorityEvents = eventRows
    .filter((item) => item.missingCount > 0)
    .sort((a, b) => b.missingCount - a.missingCount || a.key.localeCompare(b.key));

const lines = [
    '# 人物头像缺口报告',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    '## 摘要',
    `- 章节事件数：${summary.eventCount}`,
    `- 去重人物/团队数：${summary.uniqueFigureCount}`,
    `- 已有可用头像：${summary.readyFigureCount}`,
    `- 仍缺可用头像：${summary.missingFigureCount}`,
    `- 章节覆盖：完整 ${summary.fullEventCount} / 部分 ${summary.partialEventCount} / 空缺 ${summary.noneEventCount}`,
    '',
    '> 注：`旧 people 图` 只是当前资源目录中落在 `/people/` 下的文件数，不等于真正可用的头像数；非空头像路径但文件不存在时，仍按缺失处理。',
    '',
    '## 优先补齐章节',
    '',
    '| 事件 key | 标题 | 人物数 | 已可用 | 旧 people 图 | 仍缺 | 状态 |',
    '| --- | --- | ---: | ---: | ---: | ---: | --- |'
];

priorityEvents.forEach((item) => {
    lines.push(
        `| ${escapeCell(item.key)} | ${escapeCell(item.title)} | ${item.totalCount} | ${item.readyCount} | ${item.legacyPeopleCount} | ${item.missingCount} | ${item.state} |`
    );
});

lines.push(
    '',
    '## 人物清单',
    '',
    '| 人物/团队 | 类型 | 状态 | 头像路径 | 文件校验 | 候选条目 | 出现章节 | 备注 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'
);

figureRows.forEach((item) => {
    lines.push(
        `| ${escapeCell(item.name)} | ${escapeCell(item.type)} | ${escapeCell(item.status)} | ${escapeCell(item.avatar)} | ${item.avatarExists ? 'ok' : 'missing'} | ${escapeCell(item.wikipediaTitle)} | ${escapeCell(item.events.join(', '))} | ${escapeCell(item.note)} |`
    );
});

lines.push('');

fs.writeFileSync(OUTPUT, `${lines.join('\n')}\n`, 'utf8');

console.log(`已写入 ${path.relative(ROOT, OUTPUT)}`);
console.log(
    `人物/团队: ${summary.uniqueFigureCount}, 已有可用头像: ${summary.readyFigureCount}, 缺失: ${summary.missingFigureCount}`
);
