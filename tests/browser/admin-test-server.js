'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const fixtureRoot = path.resolve(
    process.env.AI_HISTORY_ADMIN_TEST_ROOT || path.join(projectRoot, '.tmp', 'admin-browser-fixture')
);
const temporaryRoot = path.join(projectRoot, '.tmp');

function linkTree(source, destination) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);
        if (entry.isDirectory()) linkTree(sourcePath, destinationPath);
        else if (entry.isFile()) fs.linkSync(sourcePath, destinationPath);
    }
}

if (!fixtureRoot.startsWith(`${temporaryRoot}${path.sep}`)) {
    throw new Error(`Admin browser fixture must stay under ${temporaryRoot}`);
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });
fs.mkdirSync(fixtureRoot, { recursive: true });
fs.cpSync(path.join(projectRoot, 'archive'), path.join(fixtureRoot, 'archive'), { recursive: true });
for (const name of ['milestones-data.js', 'milestones-data-default.js']) {
    fs.copyFileSync(path.join(projectRoot, name), path.join(fixtureRoot, name));
}
linkTree(path.join(projectRoot, 'resources'), path.join(fixtureRoot, 'resources'));
for (const name of ['.nojekyll', 'index.html', 'shared', 'public']) {
    const source = path.join(projectRoot, name);
    const type = fs.statSync(source).isDirectory() ? 'dir' : 'file';
    fs.symlinkSync(source, path.join(fixtureRoot, name), type);
}

process.env.HOST ||= '127.0.0.1';
process.env.PORT ||= '43118';
process.env.AI_HISTORY_ARCHIVE_ROOT = fixtureRoot;

require('../../manage/server');
