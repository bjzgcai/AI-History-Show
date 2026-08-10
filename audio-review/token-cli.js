#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { hashToken } = require('./auth');

function argument(name, fallback = '') {
    const index = process.argv.indexOf(`--${name}`);
    return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

const id = argument('id');
const name = argument('name');
const role = argument('role', 'reviewer');

if (!id || !name || !['reviewer', 'admin'].includes(role)) {
    console.error('Usage: node audio-review/token-cli.js --id <id> --name <name> [--role reviewer|admin]');
    process.exit(1);
}

const token = `ar_${crypto.randomBytes(32).toString('base64url')}`;
console.log(`Token（仅显示一次）: ${token}`);
console.log('Token 配置项:');
console.log(
    JSON.stringify(
        {
            id,
            name,
            role,
            tokenHash: `sha256:${hashToken(token)}`
        },
        null,
        2
    )
);
