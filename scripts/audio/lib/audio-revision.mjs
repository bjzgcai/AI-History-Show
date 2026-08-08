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
    if (config.schemaVersion !== 1) fail('Revision config schemaVersion must be 1');
    if (!Number.isInteger(config.expectedEntryCount) || config.expectedEntryCount < 1) {
        fail('expectedEntryCount must be a positive integer');
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
    return fs
        .readdirSync(config.turnsDir)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .map((fileName) => ({
            fileName,
            path: path.join(config.turnsDir, fileName),
            data: readJson(path.join(config.turnsDir, fileName))
        }));
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
