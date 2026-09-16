import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const GENERATED_AUDIO_ROOT = path.join(ROOT, 'resources/audio/generated');

export function fail(message) {
    throw new Error(message);
}

export function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function toPosix(filePath) {
    return filePath.split(path.sep).join('/');
}

export function resolveFromRoot(filePath) {
    return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

export function resolveTtsEnvFile(envFile, environment = process.env) {
    const configuredPath = String(environment.TTS_ENV_FILE || '').trim() || String(envFile || '').trim();
    return configuredPath ? resolveFromRoot(configuredPath) : '';
}

const VOICE_PROFILE_KEYS = [
    'voiceA',
    'voiceB',
    'voiceNarrator',
    'voiceSummary',
    'instructionA',
    'instructionB',
    'instructionNarrator',
    'instructionSummary',
    'speedA',
    'speedB',
    'speedNarrator',
    'speedSummary'
];

export function entryOverrideFor(config, source) {
    const overrides = config.entryOverrides || {};
    const exactKey = `${source.eventId}:${source.locale || 'zh'}`;
    return overrides[exactKey] || overrides[source.eventId] || {};
}

export function resolveVoiceProfile(baseProfile, override = {}) {
    const unknownKeys = Object.keys(override).filter((key) => !VOICE_PROFILE_KEYS.includes(key));
    if (unknownKeys.length) fail(`Unsupported voice profile override keys: ${unknownKeys.join(', ')}`);
    const profile = { ...baseProfile, ...override };
    profile.voiceNarrator = profile.voiceNarrator || profile.voiceB;
    profile.voiceSummary = profile.voiceSummary || profile.voiceB;
    profile.instructionA = profile.instructionA ?? '';
    profile.instructionB = profile.instructionB ?? '';
    profile.instructionNarrator = profile.instructionNarrator ?? profile.instructionB;
    profile.instructionSummary = profile.instructionSummary ?? '';
    profile.speedA = profile.speedA ?? 1;
    profile.speedB = profile.speedB ?? 1;
    profile.speedNarrator = profile.speedNarrator ?? profile.speedB;
    profile.speedSummary = profile.speedSummary ?? 0.97;
    return profile;
}

export function formatCommandFailure(command, result, target = '') {
    const targetLabel = target ? ` for ${target}` : '';
    if (result.error?.code === 'ENOENT' || (result.status === null && !result.error)) {
        return `${command} not found in PATH`;
    }
    if (result.error) return `${command} could not start${targetLabel}: ${result.error.message}`;
    const detail = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
    return `${command} failed${targetLabel} (exit ${result.status})${detail ? `: ${detail.slice(-2000)}` : ''}`;
}

export function revisionPaths(config) {
    const outputRoot = resolveFromRoot(config.outputRoot);
    return {
        outputRoot,
        planPath: path.join(outputRoot, 'revision-plan.json'),
        overlayPath: path.join(outputRoot, 'overlay.json')
    };
}

export function loadRevisionConfig(configArgument) {
    if (!configArgument) fail('A revision config path is required');
    const configPath = resolveFromRoot(configArgument);
    if (!fs.existsSync(configPath)) fail(`Missing revision config: ${configPath}`);
    const config = readJson(configPath);
    const required = [
        'revisionId',
        'label',
        'comparisonKind',
        'outputRoot',
        'turnsDir',
        'voiceProfilePath',
        'provider',
        'specification'
    ];
    for (const key of required) {
        if (config[key] === undefined || config[key] === null || config[key] === '') {
            fail(`Revision config is missing ${key}`);
        }
    }
    if (!['previous', 'interactive'].includes(config.comparisonKind)) {
        fail('comparisonKind must be previous or interactive');
    }
    if (
        config.storylineOrderPolicy !== undefined &&
        !['current', 'frozen-revision'].includes(config.storylineOrderPolicy)
    ) {
        fail('storylineOrderPolicy must be current or frozen-revision');
    }
    if (config.schemaVersion !== 1) fail('Revision config schemaVersion must be 1');
    if (!Number.isInteger(config.expectedEntryCount) || config.expectedEntryCount < 1) {
        fail('expectedEntryCount must be a positive integer');
    }
    if (config.eventIds !== undefined) {
        if (!Array.isArray(config.eventIds) || !config.eventIds.length) {
            fail('eventIds must be a non-empty array when provided');
        }
        const normalizedEventIds = config.eventIds.map((eventId) => String(eventId || '').trim());
        if (
            normalizedEventIds.some((eventId) => !eventId) ||
            new Set(normalizedEventIds).size !== config.eventIds.length
        ) {
            fail('eventIds must contain unique non-empty event IDs');
        }
        if (config.expectedEntryCount !== config.eventIds.length) {
            fail('expectedEntryCount must match eventIds length');
        }
    }
    const outputRoot = resolveFromRoot(config.outputRoot);
    const relativeOutputRoot = path.relative(GENERATED_AUDIO_ROOT, outputRoot);
    if (
        !relativeOutputRoot ||
        relativeOutputRoot.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeOutputRoot) ||
        path.basename(outputRoot) !== config.revisionId
    ) {
        fail('outputRoot must be under resources/audio/generated/ and end with revisionId');
    }
    for (const key of ['name', 'model', 'endpoint', 'envFile']) {
        if (!String(config.provider?.[key] || '').trim()) fail(`Revision provider is missing ${key}`);
    }
    if (!Array.isArray(config.specification?.modes) || !config.specification.modes.includes('storyline')) {
        fail('Revision specification must include storyline mode');
    }
    if (!Array.isArray(config.specification?.locales) || config.specification.locales.length === 0) {
        fail('Revision specification must declare at least one locale');
    }
    if (config.entryOverrides !== undefined) {
        if (
            !config.entryOverrides ||
            Array.isArray(config.entryOverrides) ||
            typeof config.entryOverrides !== 'object'
        ) {
            fail('entryOverrides must be an object keyed by eventId or eventId:locale');
        }
        for (const [entryKey, override] of Object.entries(config.entryOverrides)) {
            if (!entryKey.trim() || !override || Array.isArray(override) || typeof override !== 'object') {
                fail(`Invalid entry override: ${entryKey || '(empty)'}`);
            }
            resolveVoiceProfile({}, override);
        }
    }
    const turnsDir = resolveFromRoot(config.turnsDir);
    if (!fs.existsSync(turnsDir)) fail(`Missing turns directory: ${turnsDir}`);
    const voiceProfilePath = resolveFromRoot(config.voiceProfilePath);
    if (!fs.existsSync(voiceProfilePath)) fail(`Missing voice profile: ${voiceProfilePath}`);
    return {
        ...config,
        configPath,
        turnsDir,
        voiceProfilePath,
        voiceProfile: readJson(voiceProfilePath)
    };
}

export function loadRevisionTurns(config) {
    const sources = fs
        .readdirSync(config.turnsDir)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .map((fileName) => ({
            fileName,
            path: path.join(config.turnsDir, fileName),
            data: readJson(path.join(config.turnsDir, fileName))
        }));
    if (!config.eventIds) return sources;
    const eventIds = new Set(config.eventIds);
    const selected = sources.filter(({ data }) => eventIds.has(data.eventId));
    const found = new Set(selected.map(({ data }) => data.eventId));
    const missing = config.eventIds.filter((eventId) => !found.has(eventId));
    if (missing.length) fail(`Missing selected revision events: ${missing.join(', ')}`);
    return selected;
}

export function roleLabel(role) {
    if (role === 'N' || role === 'NARRATOR') return '旁白';
    if (role === 'SUMMARY') return '总结';
    return role;
}

export function renderScript(turns) {
    return `${turns.map((turn) => `${roleLabel(turn.role)}：${turn.text}`).join('\n')}\n`;
}

export function normalizedRole(role) {
    if (role === 'NARRATOR') return 'N';
    if (role === 'SUMMARY') return 'SUMMARY';
    return role;
}

export function relativeToRoot(filePath) {
    return toPosix(path.relative(ROOT, filePath));
}
