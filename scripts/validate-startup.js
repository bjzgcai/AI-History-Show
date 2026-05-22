#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const HOST = '127.0.0.1';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startProcess(command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', chunk => process.stdout.write(chunk));
  child.stderr.on('data', chunk => process.stderr.write(chunk));

  return child;
}

async function waitForHttp(url, attempts = 40) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await wait(250);
  }

  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    wait(3000).then(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
    }),
  ]);
}

async function validateStaticServer() {
  const port = '18080';
  const child = startProcess(process.execPath, ['scripts/static-server.js'], {
    HOST,
    PORT: port,
  });

  try {
    const index = await waitForHttp(`http://${HOST}:${port}/`);
    assert.match(await index.text(), /AI\s*历史回顾展览|milestones-data/i);

    const dual = await waitForHttp(`http://${HOST}:${port}/dual-screen.html`);
    assert.match(await dual.text(), /dual|milestones/i);

    const data = await waitForHttp(`http://${HOST}:${port}/milestones-data.js`);
    assert.match(await data.text(), /const\s+milestones\s*=/);

    console.log('PASS static presentation startup validation');
  } finally {
    await stopProcess(child);
  }
}

async function validateAdminServer() {
  const port = '13001';
  const child = startProcess(process.execPath, ['manage/server.js'], {
    PORT: port,
  });

  try {
    const admin = await waitForHttp(`http://${HOST}:${port}/admin`);
    assert.match(await admin.text(), /AI|admin|管理/i);

    const resource = await waitForHttp(`http://${HOST}:${port}/resources/images/ui/brand.png`);
    assert.equal(resource.headers.get('content-type'), 'image/png');

    console.log('PASS admin server startup validation');
  } finally {
    await stopProcess(child);
  }
}

(async () => {
  await validateStaticServer();
  await validateAdminServer();
  console.log('All startup checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
