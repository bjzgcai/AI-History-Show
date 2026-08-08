#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'scripts', 'ai100-first-40-and-gaming');
const MANIFEST_PATH = path.join(OUTPUT_ROOT, 'manifest.json');
const REPORT_PATH = path.join(OUTPUT_ROOT, 'dry-run-report.json');
const TTS_SCRIPT = path.join(ROOT, 'scripts', 'generate-dialogue-audio.mjs');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.writeFileSync(filePath, formatted);
}

function ttsArgs(inputPath, outputPath, profile) {
    return [
        TTS_SCRIPT,
        inputPath,
        outputPath,
        '--provider',
        'volc',
        '--model',
        'seed-tts-2.0',
        '--lang',
        profile.language,
        '--voice-a',
        profile.voiceA,
        '--voice-b',
        profile.voiceB,
        '--voice-summary',
        profile.voiceSummary,
        '--instruction-a',
        profile.instructionA,
        '--instruction-b',
        profile.instructionB,
        '--instruction-summary',
        profile.instructionSummary,
        '--speed-a',
        '1',
        '--speed-b',
        profile.language === 'zh' ? '0.99' : '0.96',
        '--speed-summary',
        profile.language === 'zh' ? '0.99' : '0.94',
        '--pause-ms',
        '450',
        '--summary-pause-ms',
        '600',
        '--dry-run'
    ];
}

async function main() {
    const manifest = readJson(MANIFEST_PATH);
    const results = [];
    for (const [scopeId, scope] of Object.entries(manifest.scopes)) {
        for (const event of scope.events) {
            for (const locale of ['zh', 'en']) {
                const profile = manifest.voiceProfiles[locale];
                for (const mode of ['standalone', 'storyline']) {
                    const relativePath = event.compiledPaths[locale][mode];
                    const inputPath = path.join(OUTPUT_ROOT, relativePath);
                    const outputPath = path.join(
                        ROOT,
                        '.tmp',
                        'audio-dry-run',
                        `${scopeId}-${mode}-${locale}-${event.eventId}.mp3`
                    );
                    const result = spawnSync(process.execPath, ttsArgs(inputPath, outputPath, profile), {
                        cwd: ROOT,
                        encoding: 'utf8'
                    });
                    const turnCount = (result.stdout.match(/^\d{2}\.\s/gm) || []).length;
                    results.push({
                        scopeId,
                        eventId: event.eventId,
                        locale,
                        mode,
                        inputPath: path.relative(ROOT, inputPath),
                        provider: 'volc',
                        model: 'seed-tts-2.0',
                        voices: {
                            A: profile.voiceA,
                            B: profile.voiceB,
                            narrator: profile.voiceB,
                            summary: profile.voiceSummary
                        },
                        turnCount,
                        success: result.status === 0,
                        error: result.status === 0 ? null : (result.stderr || result.stdout).trim()
                    });
                }
            }
        }
    }
    const failures = results.filter((result) => !result.success);
    const report = {
        schemaVersion: 1,
        status: failures.length ? 'failed' : 'passed',
        ttsCallsPerformed: 0,
        dryRunCount: results.length,
        failureCount: failures.length,
        results
    };
    await writeFormatted(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    if (failures.length) {
        for (const failure of failures) console.error(`- ${failure.inputPath}: ${failure.error}`);
        process.exit(1);
    }
    console.log(`TTS dry-run passed for ${results.length} compiled inputs; no API calls or audio files were created.`);
}

await main();
