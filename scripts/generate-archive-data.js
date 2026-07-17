#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildArchivePreview } = require('./archive-compiler.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUTS = [path.join(ROOT, 'milestones-data.js'), path.join(ROOT, 'milestones-data-default.js')];

function normalizeGeneratedTime(content) {
    return String(content || '')
        .replace(/\r\n/g, '\n')
        .replace(/^\/\/ 生成时间: .+$/m, '// 生成时间: <preserved>');
}

function writeOutputsAtomically(outputs, content) {
    const changed = outputs.filter((file) => {
        if (!fs.existsSync(file)) return true;
        return normalizeGeneratedTime(fs.readFileSync(file, 'utf8')) !== normalizeGeneratedTime(content);
    });
    if (changed.length === 0) return new Map(outputs.map((file) => [file, false]));

    const temporaryFiles = outputs.map((file) => `${file}.tmp-${process.pid}`);
    const backupFiles = outputs.map((file) => `${file}.bak-${process.pid}`);
    const hadOriginal = outputs.map((file) => fs.existsSync(file));
    const backedUp = outputs.map(() => false);
    const installed = outputs.map(() => false);
    let writeCompleted = false;

    try {
        for (const temporaryFile of temporaryFiles) fs.writeFileSync(temporaryFile, content, 'utf8');
        for (let index = 0; index < outputs.length; index += 1) {
            if (!hadOriginal[index]) continue;
            fs.renameSync(outputs[index], backupFiles[index]);
            backedUp[index] = true;
        }
        for (let index = 0; index < outputs.length; index += 1) {
            fs.renameSync(temporaryFiles[index], outputs[index]);
            installed[index] = true;
        }
        writeCompleted = true;
    } catch (error) {
        const rollbackErrors = [];
        for (let index = outputs.length - 1; index >= 0; index -= 1) {
            try {
                if (installed[index] && fs.existsSync(outputs[index])) {
                    fs.rmSync(outputs[index], { force: true });
                }
                if (backedUp[index] && fs.existsSync(backupFiles[index])) {
                    fs.renameSync(backupFiles[index], outputs[index]);
                    backedUp[index] = false;
                }
            } catch (rollbackError) {
                rollbackErrors.push(rollbackError);
            }
        }
        if (rollbackErrors.length > 0) {
            throw new AggregateError([error, ...rollbackErrors], 'Archive output write and rollback failed');
        }
        throw error;
    } finally {
        for (const temporaryFile of temporaryFiles) {
            if (fs.existsSync(temporaryFile)) fs.rmSync(temporaryFile, { force: true });
        }
        for (let index = 0; index < backupFiles.length; index += 1) {
            if (writeCompleted && fs.existsSync(backupFiles[index])) {
                fs.rmSync(backupFiles[index], { force: true });
            }
        }
    }
    return new Map(outputs.map((file) => [file, changed.includes(file)]));
}

function buildOutputContent(milestones, now, result) {
    return [
        '// AI 历史里程碑数据 archive-native（由脚本自动生成，请勿手动编辑）',
        `// 生成时间: ${now}`,
        '// 数据来源: archive/storylines/* + archive/events/*，不读取 legacy milestones 作为 scaffold',
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

function generateArchiveData({
    root = ROOT,
    outputs = OUTPUTS,
    buildPreview = buildArchivePreview,
    now = new Date().toISOString().replace('T', ' ').slice(0, 16),
    logger = console
} = {}) {
    const result = buildPreview(root);
    for (const item of result.errors) {
        logger.warn(
            `[警告] archive-native 构建失败：${item.storylineId} ${JSON.stringify(item.ref)} — ${item.message}`
        );
    }
    if (result.errors.length > 0) {
        logger.error('Archive-native generation aborted; runtime milestone files were not modified.');
        return { ok: false, result, writeResults: new Map() };
    }

    const content = buildOutputContent(result.milestones, now, result);
    const writeResults = writeOutputsAtomically(outputs, content);
    for (const file of outputs) {
        logger.log(`✓ ${writeResults.get(file) ? '生成完成' : '内容未变化'}：${file}`);
    }
    logger.log(
        `  Archive native：${result.counts.storylines} 个 storylines，${result.counts.milestones} 个 milestones，${result.counts.errors} 个错误`
    );
    return { ok: true, result, writeResults };
}

function main() {
    const generation = generateArchiveData();
    if (!generation.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
    buildOutputContent,
    generateArchiveData,
    normalizeGeneratedTime,
    writeOutputsAtomically
};
