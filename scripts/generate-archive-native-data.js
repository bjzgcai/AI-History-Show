#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildArchivePreview } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'milestones-data-archive-native.js');

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

function buildOutputContent(milestones, now, result) {
    return [
        '// AI 历史里程碑数据 archive-native preview（由脚本自动生成，请勿手动编辑）',
        `// 生成时间: ${now}`,
        '// 数据来源: archive/storylines/* + archive/events/*，不读取 legacy milestones 作为 scaffold',
        '// 用途: 验证 archive 模型能否直接生成完整前端 milestone 数据。',
        `// Archive native: storylines ${result.counts.storylines}, milestones ${result.counts.milestones}, errors ${result.counts.errors}`,
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

const result = buildArchivePreview(ROOT);
for (const item of result.errors) {
    console.warn(`[警告] archive-native 构建失败：${item.storylineId} ${JSON.stringify(item.ref)} — ${item.message}`);
}

const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
const content = buildOutputContent(result.milestones, now, result);
const changed = writeIfMeaningfullyChanged(OUTPUT_PATH, content);

console.log(`✓ ${changed ? '生成完成' : '内容未变化'}：${OUTPUT_PATH}`);
console.log(
    `  Archive native：${result.counts.storylines} 个 storylines，${result.counts.milestones} 个 milestones，${result.counts.errors} 个错误`
);
if (result.errors.length > 0) process.exitCode = 1;
