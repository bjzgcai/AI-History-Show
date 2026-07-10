#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { applyArchiveOverlays } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const LEGACY_DATA_PATH = path.join(ROOT, 'milestones-data.js');
const OUTPUT_PATH = path.join(ROOT, 'milestones-data-archive-preview.js');

function normalizeGeneratedTime(content) {
    return String(content || '')
        .replace(/\r\n/g, '\n')
        .replace(/^\/\/ 生成时间: .+$/m, '// 生成时间: <preserved>');
}

function writeIfMeaningfullyChanged(file, content) {
    if (fs.existsSync(file)) {
        const existing = fs.readFileSync(file, 'utf8');
        if (normalizeGeneratedTime(existing) === normalizeGeneratedTime(content)) return false;
    }
    fs.writeFileSync(file, content, 'utf8');
    return true;
}

function buildOutputContent(milestones, now, overlayResult) {
    return [
        '// AI 历史里程碑数据 archive presentation preview（由脚本自动生成，请勿手动编辑）',
        `// 生成时间: ${now}`,
        '// 数据来源: milestones-data.js + archive/events/* forced presentation overlay',
        '// 用途: 本地预览 archive 数据直接驱动主展陈页；正常展示仍使用 milestones-data.js。',
        `// Archive overlay: applied ${overlayResult.applied.length}, skipped ${overlayResult.skipped.length}, errors ${overlayResult.errors.length}`,
        '',
        `const milestones = ${JSON.stringify(milestones, null, 2)};`,
        '',
        '// 导出（兼容 Node.js require）',
        "if (typeof module !== 'undefined' && module.exports) {",
        '  module.exports = { milestones };',
        '}',
        ''
    ].join('\n');
}

delete require.cache[require.resolve(LEGACY_DATA_PATH)];
const { milestones: legacyMilestones } = require(LEGACY_DATA_PATH);
const previewMilestones = JSON.parse(JSON.stringify(legacyMilestones));
const overlayResult = applyArchiveOverlays(previewMilestones, {
    root: ROOT,
    forceArchivePresentation: true
});

for (const item of overlayResult.errors) {
    console.warn(
        `[警告] archive preview overlay 构建失败：${item.storylineId} ${JSON.stringify(item.ref)} — ${item.message}`
    );
}
for (const item of overlayResult.skipped) {
    console.warn(
        `[警告] archive preview overlay 跳过：${item.id || item.archiveEventId}/${item.archiveVariantId} — ${item.reason}`
    );
}

const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
const content = buildOutputContent(previewMilestones, now, overlayResult);
const changed = writeIfMeaningfullyChanged(OUTPUT_PATH, content);

console.log(`✓ ${changed ? '生成完成' : '内容未变化'}：${OUTPUT_PATH}`);
console.log(
    `  Archive preview overlay：应用 ${overlayResult.applied.length} 个，跳过 ${overlayResult.skipped.length} 个，错误 ${overlayResult.errors.length} 个`
);
