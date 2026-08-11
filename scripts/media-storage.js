'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_PROFILE_ID = 'ai-history-audio-releases';
const DEFAULT_PROVIDER = 'aliyun-oss';
const DEFAULT_ENDPOINT = 'https://oss-cn-beijing.aliyuncs.com';
const DEFAULT_REGION = 'cn-beijing';
const DEFAULT_BUCKET = 'zgca-medias';
const DEFAULT_PUBLIC_URL_PREFIX = 'https://media.sciencearena.cn/audio/ai-history/releases/';
const DEFAULT_OBJECT_KEY_PREFIX = 'audio/ai-history/releases/';
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const DEFAULT_MANIFEST_KEY = 'audio/ai-history/manifests/audio-manifest.json';
const CONFIG_PATH = path.join('archive', 'config', 'media-storage.json');
const AUDIO_CONTENT_TYPES = new Map([
    ['.aac', 'audio/aac'],
    ['.m4a', 'audio/mp4'],
    ['.mp3', 'audio/mpeg'],
    ['.ogg', 'audio/ogg'],
    ['.wav', 'audio/wav']
]);

function normalizeObjectKey(value) {
    return String(value || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/{2,}/g, '/');
}

function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
}

function ensureTrailingSlash(value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function isRemotePath(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
}

function contentTypeForPath(filePath) {
    return AUDIO_CONTENT_TYPES.get(path.extname(String(filePath || '').toLowerCase())) || '';
}

function builtInConfig() {
    return {
        schemaVersion: 1,
        defaultProfiles: {
            audio: DEFAULT_PROFILE_ID
        },
        profiles: [
            {
                id: DEFAULT_PROFILE_ID,
                mediaType: 'audio',
                provider: DEFAULT_PROVIDER,
                endpoint: DEFAULT_ENDPOINT,
                region: DEFAULT_REGION,
                bucket: DEFAULT_BUCKET,
                publicUrlPrefix: DEFAULT_PUBLIC_URL_PREFIX,
                objectKeyPrefix: DEFAULT_OBJECT_KEY_PREFIX,
                cacheControl: DEFAULT_CACHE_CONTROL,
                manifestKey: DEFAULT_MANIFEST_KEY
            }
        ]
    };
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadMediaStorageConfig(root = path.resolve(__dirname, '..')) {
    const configFile = path.join(root, CONFIG_PATH);
    return fs.existsSync(configFile) ? readJson(configFile) : builtInConfig();
}

function profileMap(config) {
    return new Map(
        (Array.isArray(config && config.profiles) ? config.profiles : []).map((profile) => [profile.id, profile])
    );
}

function defaultProfileIdFor(config, mediaType) {
    return String((config && config.defaultProfiles && config.defaultProfiles[mediaType]) || DEFAULT_PROFILE_ID).trim();
}

function findProfile(config, mediaType, profileId) {
    const profiles = profileMap(config);
    const resolvedId = String(profileId || defaultProfileIdFor(config, mediaType)).trim();
    const profile = profiles.get(resolvedId);
    if (!profile) throw new Error(`Unknown media storage profile: ${resolvedId || '<empty>'}`);
    if (profile.mediaType && mediaType && profile.mediaType !== mediaType) {
        throw new Error(`Media storage profile ${resolvedId} is for ${profile.mediaType}, not ${mediaType}`);
    }
    return profile;
}

function objectNameFromKey(objectKey, profile) {
    const key = normalizeObjectKey(objectKey);
    const prefix = normalizeObjectKey(profile.objectKeyPrefix).replace(/\/+$/, '');
    if (!prefix || key === prefix) return key === prefix ? '' : key;
    return key.startsWith(`${prefix}/`) ? key.slice(prefix.length + 1) : key;
}

function joinObjectKey(prefix, objectName) {
    const normalizedPrefix = normalizeObjectKey(prefix).replace(/\/+$/, '');
    const normalizedName = normalizeObjectKey(objectName);
    return [normalizedPrefix, normalizedName].filter(Boolean).join('/');
}

function resolveMediaStorage(asset, options = {}) {
    const config = options.config || loadMediaStorageConfig(options.root);
    const storage = asset && asset.storage && typeof asset.storage === 'object' ? asset.storage : {};
    const mediaType = String((asset && asset.type) || storage.mediaType || 'audio').trim();
    const profileId = String(storage.profileId || storage.profile || defaultProfileIdFor(config, mediaType)).trim();
    const profile = findProfile(config, mediaType, profileId);
    const objectName = normalizeObjectKey(storage.objectName || objectNameFromKey(storage.objectKey, profile));
    const objectKey =
        normalizeObjectKey(storage.objectKey) || (objectName ? joinObjectKey(profile.objectKeyPrefix, objectName) : '');
    const explicitUrl = String((asset && asset.deliveryUrl) || storage.publicUrl || '').trim();
    const publicUrl =
        explicitUrl ||
        (objectName || objectKey
            ? `${ensureTrailingSlash(profile.publicUrlPrefix)}${objectName || objectNameFromKey(objectKey, profile)}`
            : isRemotePath(asset && asset.path)
              ? String(asset.path).trim()
              : '');
    const configuredSourcePath = String(
        storage.sourcePath || (asset && !isRemotePath(asset.path) ? asset.path : '') || ''
    ).trim();
    const contentSource = configuredSourcePath || objectName || objectKey || (asset && asset.path) || '';

    return {
        profileId,
        provider: String(storage.provider || profile.provider || '').trim(),
        endpoint: trimTrailingSlash(profile.endpoint || ''),
        region: String(profile.region || '').trim(),
        bucket: String(storage.bucket || profile.bucket || '').trim(),
        objectName,
        objectKey,
        publicUrl,
        sourcePath: configuredSourcePath,
        contentType: String(storage.contentType || contentTypeForPath(contentSource)).trim(),
        cacheControl: String(storage.cacheControl || profile.cacheControl || '').trim(),
        manifestKey: normalizeObjectKey(profile.manifestKey || DEFAULT_MANIFEST_KEY),
        objectKeyPrefix: normalizeObjectKey(profile.objectKeyPrefix || ''),
        publicUrlPrefix: ensureTrailingSlash(profile.publicUrlPrefix || '')
    };
}

function resolveAudioUrl(asset, options = {}) {
    return resolveMediaStorage(asset, options).publicUrl || String((asset && asset.path) || '').trim();
}

module.exports = {
    AUDIO_CONTENT_TYPES,
    CONFIG_PATH,
    DEFAULT_BUCKET,
    DEFAULT_CACHE_CONTROL,
    DEFAULT_ENDPOINT,
    DEFAULT_MANIFEST_KEY,
    DEFAULT_OBJECT_KEY_PREFIX,
    DEFAULT_PROFILE_ID,
    DEFAULT_PROVIDER,
    DEFAULT_PUBLIC_URL_PREFIX,
    DEFAULT_REGION,
    builtInConfig,
    contentTypeForPath,
    isRemotePath,
    loadMediaStorageConfig,
    normalizeObjectKey,
    resolveAudioUrl,
    resolveMediaStorage
};
