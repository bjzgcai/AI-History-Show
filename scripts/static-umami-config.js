'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE_CONFIG_PATH = path.join(__dirname, '..', 'shared', 'umami-config.js');

function readSourceUmamiConfig(filePath = SOURCE_CONFIG_PATH) {
    const source = fs.readFileSync(filePath, 'utf8');
    const context = vm.createContext({});
    vm.runInContext(source, context, { filename: filePath });
    const config = context.AI_HISTORY_UMAMI_CONFIG;
    if (!config || typeof config !== 'object') {
        throw new Error(`Umami source config is invalid: ${filePath}`);
    }
    if (config.enabled || config.websiteId) {
        throw new Error('Git-tracked Umami config must remain disabled and must not contain a Website ID');
    }
    return JSON.parse(JSON.stringify(config));
}

function buildUmamiConfig(environment = process.env) {
    const websiteId = String(environment.UMAMI_WEBSITE_ID || '').trim();
    return {
        ...readSourceUmamiConfig(),
        enabled: Boolean(websiteId),
        websiteId
    };
}

function serializeUmamiConfig(config) {
    return `(function (globalScope) {
    'use strict';

    if (globalScope.AI_HISTORY_UMAMI_CONFIG) return;

    globalScope.AI_HISTORY_UMAMI_CONFIG = ${JSON.stringify(config, null, 8)};
})(typeof window !== 'undefined' ? window : globalThis);
`;
}

function writeStaticUmamiConfig(filePath, environment = process.env) {
    fs.writeFileSync(filePath, serializeUmamiConfig(buildUmamiConfig(environment)), 'utf8');
}

module.exports = { buildUmamiConfig, readSourceUmamiConfig, serializeUmamiConfig, writeStaticUmamiConfig };
