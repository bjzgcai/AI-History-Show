'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const fixtureRoot = path.resolve(
    process.env.AI_HISTORY_ADMIN_TEST_ROOT || path.join(projectRoot, '.tmp', 'admin-browser-fixture')
);
const temporaryRoot = path.join(projectRoot, '.tmp');

if (!fixtureRoot.startsWith(`${temporaryRoot}${path.sep}`)) {
    throw new Error(`Admin browser fixture must stay under ${temporaryRoot}`);
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });
fs.mkdirSync(fixtureRoot, { recursive: true });
fs.cpSync(path.join(projectRoot, 'archive'), path.join(fixtureRoot, 'archive'), { recursive: true });
fs.symlinkSync(path.join(projectRoot, 'resources'), path.join(fixtureRoot, 'resources'), 'dir');

process.env.HOST ||= '127.0.0.1';
process.env.PORT ||= '43118';
process.env.AI_HISTORY_ARCHIVE_ROOT = fixtureRoot;

require('../../manage/server');
