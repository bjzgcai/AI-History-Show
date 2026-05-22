#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');

const HOST = '127.0.0.1';
const PREVIEW_PORT = 18080;
const ADMIN_PORT = 13001;
const STARTUP_TIMEOUT_MS = 10_000;

function startProcess(command, args, env) {
    const child = spawn(command, args, {
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => process.stdout.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));

    return child;
}

function stopProcess(child) {
    if (!child.killed) {
        child.kill('SIGTERM');
    }
}

async function waitForOk(url, expectedText) {
    const startedAt = Date.now();
    let lastError;

    while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
        try {
            const response = await fetch(url);
            const body = await response.text();

            if (response.ok && (!expectedText || body.includes(expectedText))) {
                return;
            }

            lastError = new Error(`${url} returned ${response.status}`);
        } catch (error) {
            lastError = error;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw lastError || new Error(`${url} did not become ready`);
}

async function main() {
    const preview = startProcess('node', ['scripts/serve-static.js'], {
        HOST,
        PORT: String(PREVIEW_PORT)
    });
    const admin = startProcess('node', ['manage/server.js'], {
        PORT: String(ADMIN_PORT)
    });

    try {
        await Promise.all([
            waitForOk(`http://${HOST}:${PREVIEW_PORT}/`, 'AI'),
            waitForOk(`http://${HOST}:${PREVIEW_PORT}/dual-screen.html`, 'AI'),
            waitForOk(`http://${HOST}:${ADMIN_PORT}/admin`)
        ]);
        console.log('Startup validation passed.');
    } finally {
        stopProcess(preview);
        stopProcess(admin);
    }
}

main().catch((error) => {
    console.error(`Startup validation failed: ${error.message}`);
    process.exitCode = 1;
});
