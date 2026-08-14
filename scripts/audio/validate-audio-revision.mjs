#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
    ROOT,
    fail,
    formatCommandFailure,
    loadRevisionConfig,
    loadRevisionTurns,
    readJson,
    relativeToRoot,
    renderScript,
    revisionPaths
} from './lib/audio-revision.mjs';
import { compileSpeechTurns, loadPronunciationGlossary } from './lib/pronunciation.mjs';

function probeAudio(filePath) {
    const result = spawnSync(
        'ffprobe',
        [
            '-v',
            'error',
            '-show_entries',
            'format=duration,size,bit_rate:stream=sample_rate,channels,codec_name',
            '-of',
            'json',
            filePath
        ],
        { cwd: ROOT, encoding: 'utf8' }
    );
    if (result.error || result.status !== 0) {
        fail(formatCommandFailure('ffprobe', result, relativeToRoot(filePath)));
    }
    const data = JSON.parse(result.stdout);
    return {
        durationSec: Number(data.format?.duration),
        sampleRate: Number(data.streams?.[0]?.sample_rate),
        channels: Number(data.streams?.[0]?.channels),
        codec: data.streams?.[0]?.codec_name
    };
}

function assetKey(item) {
    return `${item.scopeId}:${item.sequenceIndex}:${item.locale}:${item.mode}`;
}

function voiceForRole(profile, role) {
    if (role === 'A') return profile.voiceA;
    if (role === 'B') return profile.voiceB;
    if (role === 'SUMMARY') return profile.voiceSummary;
    return profile.voiceNarrator;
}

function instructionForRole(profile, role) {
    if (role === 'A') return profile.instructionA;
    if (role === 'B') return profile.instructionB;
    if (role === 'SUMMARY') return profile.instructionSummary;
    return profile.instructionNarrator;
}

function main() {
    const config = loadRevisionConfig(process.argv[2]);
    const { planPath, overlayPath } = revisionPaths(config);
    if (!fs.existsSync(planPath)) fail(`Missing ${relativeToRoot(planPath)}`);
    if (!fs.existsSync(overlayPath)) fail(`Missing ${relativeToRoot(overlayPath)}`);
    const plan = readJson(planPath);
    const overlay = readJson(overlayPath);
    const requiresPronunciationQualification = overlay.schemaVersion >= 2;
    const turnSources = loadRevisionTurns(config);
    const glossaryBundle = loadPronunciationGlossary();
    if (plan.revisionId !== config.revisionId || overlay.revisionId !== config.revisionId) {
        fail('Revision IDs do not match the config');
    }
    if (overlay.assets.length !== turnSources.length) {
        fail(`Expected ${turnSources.length} overlay assets, found ${overlay.assets.length}`);
    }

    const assets = new Map(overlay.assets.map((asset) => [assetKey(asset), asset]));
    const failures = [];
    for (const source of turnSources) {
        const data = source.data;
        const locale = data.locale || 'zh';
        const mode = data.mode || 'storyline';
        const asset = assets.get(`${data.scopeId}:${data.sequenceIndex}:${locale}:${mode}`);
        if (!asset) {
            failures.push(`${data.eventId}: missing overlay asset`);
            continue;
        }
        const scriptPath = path.join(
            revisionPaths(config).outputRoot,
            'scripts',
            locale,
            `${String(data.sequenceIndex).padStart(2, '0')}-${data.eventId}.txt`
        );
        if (!fs.existsSync(scriptPath) || fs.readFileSync(scriptPath, 'utf8') !== renderScript(data.turns)) {
            failures.push(`${data.eventId}: generated script is out of sync`);
        }
        if (JSON.stringify(asset.turns) !== JSON.stringify(data.turns)) {
            failures.push(`${data.eventId}: overlay turns are out of sync`);
        }
        if (requiresPronunciationQualification && asset.pronunciation?.schemaVersion !== 2) {
            failures.push(`${data.eventId}: missing pronunciation qualification metadata`);
        } else if (requiresPronunciationQualification) {
            const voiceProfile = asset.voiceProfile || config.voiceProfile;
            const expectedPronunciation = compileSpeechTurns({
                turns: data.turns,
                eventId: data.eventId,
                locale,
                provider: config.provider.name,
                model: config.provider.model,
                voiceForRole: (role) => voiceForRole(voiceProfile, role),
                instructionForRole: (role) => instructionForRole(voiceProfile, role),
                glossaryBundle
            });
            const expectedMetadata = {
                schemaVersion: expectedPronunciation.schemaVersion,
                glossaryPath: expectedPronunciation.glossaryPath,
                glossarySha256: expectedPronunciation.glossarySha256,
                replacements: expectedPronunciation.replacements,
                unqualified: expectedPronunciation.unqualified,
                exclusions: expectedPronunciation.exclusions
            };
            if (JSON.stringify(asset.pronunciation) !== JSON.stringify(expectedMetadata)) {
                failures.push(`${data.eventId}: overlay pronunciation metadata is out of sync`);
            }
            if (!asset.generationIdentitySha256) {
                failures.push(`${data.eventId}: missing pronunciation generation identity`);
            }
            if (expectedPronunciation.unqualified.length) {
                failures.push(`${data.eventId}: unqualified pronunciation context`);
            }
        }
        const audioPath = path.join(ROOT, asset.audio.path);
        if (!fs.existsSync(audioPath)) {
            failures.push(`${data.eventId}: missing audio file`);
            continue;
        }
        const probe = probeAudio(audioPath);
        const minimum = config.specification.minimumDurationSec || 40;
        const maximum = config.specification.maximumDurationSec || 150;
        if (probe.durationSec < minimum || probe.durationSec > maximum) {
            failures.push(`${data.eventId}: duration ${probe.durationSec.toFixed(2)}s outside ${minimum}-${maximum}s`);
        }
        if (probe.sampleRate !== 44100 || probe.channels !== 1 || probe.codec !== 'mp3') {
            failures.push(`${data.eventId}: media format mismatch`);
        }
        if (!asset.quality.passed) failures.push(`${data.eventId}: overlay quality failed`);
        if (asset.quality.integratedLufs < -17 || asset.quality.integratedLufs > -15) {
            failures.push(`${data.eventId}: loudness outside -17 to -15 LUFS`);
        }
        if (asset.quality.truePeakDbtp > -1) failures.push(`${data.eventId}: true peak above -1 dBTP`);
    }
    if (failures.length) {
        for (const failure of failures) console.error(`- ${failure}`);
        process.exitCode = 1;
        return;
    }
    console.log(`Revision valid: ${config.revisionId}, ${overlay.assets.length} audio assets passed.`);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
