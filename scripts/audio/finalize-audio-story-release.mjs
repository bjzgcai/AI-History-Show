#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'generated', 'ai100-first-40-and-gaming');
const QUALITY_REPORT_PATH = path.join(OUTPUT_ROOT, 'quality-report.json');
const RESOURCE_MAP_PATH = path.join(OUTPUT_ROOT, 'resource-map.json');
const SAMPLE_REPORT_PATH = path.join(OUTPUT_ROOT, 'listening-sample-report.json');
const RELEASE_MANIFEST_PATH = path.join(OUTPUT_ROOT, 'release-manifest.json');
const README_PATH = path.join(OUTPUT_ROOT, 'README.md');
const PREVIEW_ROOT = path.join(OUTPUT_ROOT, 'quality', 'previews');
const SAMPLE_STEMS = ['09-1958-lisp', '10-1973-prolog', '11-1966-eliza', '12-1970-shrdlu', '13-2011-ibm-watson'];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, formatted);
}

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
        throw new Error(`${command} exited ${result.status}: ${detail.slice(-3000)}`);
    }
    return result;
}

function probeDuration(filePath) {
    const result = run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath
    ]);
    return Number(result.stdout.trim());
}

function buildPreview(locale) {
    const inputPaths = SAMPLE_STEMS.map((stem) =>
        path.join(OUTPUT_ROOT, 'audio', 'bench-council-ai100', 'storyline', locale, `${stem}.mp3`)
    );
    const outputPath = path.join(PREVIEW_ROOT, `ai100-09-13-storyline.${locale}.mp3`);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const inputArgs = inputPaths.flatMap((inputPath) => ['-i', inputPath]);
        const filters = inputPaths.map((_, index) => `[${index}:a]apad=pad_dur=1[a${index}]`).join(';');
        const concatInputs = inputPaths.map((_, index) => `[a${index}]`).join('');
        run('ffmpeg', [
            '-hide_banner',
            '-loglevel',
            'error',
            '-y',
            ...inputArgs,
            '-filter_complex',
            `${filters};${concatInputs}concat=n=${inputPaths.length}:v=0:a=1[out]`,
            '-map',
            '[out]',
            '-ar',
            '44100',
            '-ac',
            '1',
            '-c:a',
            'libmp3lame',
            '-b:a',
            '192k',
            outputPath
        ]);
    }
    return {
        locale,
        path: path.relative(ROOT, outputPath),
        durationSec: Number(probeDuration(outputPath).toFixed(3)),
        eventIds: SAMPLE_STEMS.map((stem) => stem.replace(/^\d+-/, ''))
    };
}

async function main() {
    const qualityReport = readJson(QUALITY_REPORT_PATH);
    const resourceMap = readJson(RESOURCE_MAP_PATH);
    const sampleReport = readJson(SAMPLE_REPORT_PATH);
    if (qualityReport.status !== 'passed') throw new Error('Audio quality report has not passed');
    if (sampleReport.status !== 'passed') throw new Error('Listening sample report has not passed');
    const previews = ['zh', 'en'].map(buildPreview);
    const releaseManifest = {
        schemaVersion: 1,
        status: 'machine-validated-release-candidate',
        humanListeningReview: 'pending-user-review',
        sourceResourceMap: path.relative(ROOT, RESOURCE_MAP_PATH),
        sourceQualityReport: path.relative(ROOT, QUALITY_REPORT_PATH),
        sourceListeningSampleReport: path.relative(ROOT, SAMPLE_REPORT_PATH),
        scopes: {
            'bench-council-ai100': {
                eventCount: resourceMap.scopes['bench-council-ai100'].eventCount,
                assetCount: resourceMap.scopes['bench-council-ai100'].eventCount * 4
            },
            'gaming-ai': {
                eventCount: resourceMap.scopes['gaming-ai'].eventCount,
                assetCount: resourceMap.scopes['gaming-ai'].eventCount * 4
            }
        },
        qualitySummary: qualityReport.summary,
        sampleAudit: {
            sequence: sampleReport.sampleSequence,
            bilingualFileCount: sampleReport.sampleCount,
            status: sampleReport.status,
            notes: [
                'All sampled files retained at least 99% timeline coverage after local Whisper transcription.',
                'Technical names and acronyms such as OTTER, SHRDLU, CONS, CAR, CDR, COND, and EVAL may appear as phonetic variants in ASR output and remain priorities for subjective listening review.'
            ]
        },
        previews
    };
    await writeFormatted(RELEASE_MANIFEST_PATH, `${JSON.stringify(releaseManifest, null, 2)}\n`);
    const readme = `# AI100 与 AI 棋牌双语音频资产

当前批次已经完成生成、媒体规格校验和连续事件回转写抽检。

## 结果

- AI100：40 个故事线条目
- AI 棋牌：13 个故事线条目
- 每个条目包含中文/英文、独立版/故事线版
- 正式 MP3：212 个
- 总时长：约 ${(qualityReport.summary.durationSec.total / 3600).toFixed(2)} 小时
- 总容量：约 ${(qualityReport.summary.totalSizeBytes / 1024 / 1024).toFixed(1)} MiB
- 时长范围：${qualityReport.summary.durationSec.minimum.toFixed(1)}–${qualityReport.summary.durationSec.maximum.toFixed(1)} 秒
- 综合响度范围：${qualityReport.summary.integratedLufs.minimum}–${qualityReport.summary.integratedLufs.maximum} LUFS

## 主要文件

- \`audio/\`：正式双语音频
- \`audio-manifest.json\`：生成参数、哈希和媒体信息
- \`quality-report.json\`：212 个文件的全量媒体质检
- \`resource-map.json\`：按故事线、事件、语言和播放模式组织的资源映射
- \`listening-sample-report.json\`：连续 5 个事件、10 份双语文件的回转写抽检
- \`release-manifest.json\`：发布候选状态和试听预览

## 连续试听预览

- 中文：\`${previews.find((item) => item.locale === 'zh').path}\`
- 英文：\`${previews.find((item) => item.locale === 'en').path}\`

当前状态为 \`machine-validated-release-candidate\`。机器校验已经完成；音色偏好、技术名发音和长时间耐听度仍需要用户主观确认后才能标记为最终 approved。
`;
    await writeFormatted(README_PATH, readme);
    console.log(`Created release candidate manifest and ${previews.length} continuous listening previews.`);
}

await main();
