'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAdminGitService } = require('../manage/admin-git-service');

function git(cwd, args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function write(root, relativePath, content) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function createRepository() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-admin-git-'));
    const remote = path.join(root, 'remote.git');
    const checkout = path.join(root, 'checkout');
    git(root, ['init', '--bare', remote]);
    fs.mkdirSync(checkout);
    git(checkout, ['init']);
    git(checkout, ['config', 'user.email', 'admin-test@example.com']);
    git(checkout, ['config', 'user.name', 'Admin Test']);
    git(checkout, ['branch', '-M', 'main']);
    git(checkout, ['remote', 'add', 'origin', remote]);
    write(checkout, 'archive/events/example/event.json', '{"id":"example"}\n');
    write(checkout, 'milestones-data.js', 'window.MILESTONES = [];\n');
    write(checkout, 'milestones-data-default.js', 'window.MILESTONES_DEFAULT = [];\n');
    git(checkout, ['add', '.']);
    git(checkout, ['commit', '-m', 'test: baseline']);
    git(checkout, ['push', '-u', 'origin', 'main']);
    return { root, checkout };
}

function run() {
    const { root, checkout } = createRepository();
    try {
        const service = createAdminGitService(checkout);
        return Promise.resolve()
            .then(async () => {
                const context = await service.context();
                assert.equal(context.branch, 'main');
                assert.equal(context.remote, 'origin');

                write(checkout, 'archive/events/example/event.json', '{"id":"example","title":"updated"}\n');
                write(checkout, 'manage/not-for-content.js', 'should not be committed\n');
                write(checkout, 'milestones-data-default.js', 'window.MILESTONES_DEFAULT = ["changed"]\n');
                await assert.rejects(
                    service.submit({
                        paths: ['archive/events/example/event.json', 'milestones-data-default.js'],
                        message: 'content: reject fallback'
                    }),
                    (error) =>
                        error.code === 'UNSUPPORTED_SUBMISSION_PATHS' &&
                        error.files.includes('milestones-data-default.js')
                );
                write(checkout, 'milestones-data-default.js', 'window.MILESTONES_DEFAULT = [];\n');
                const submitted = await service.submit({
                    paths: ['archive/events/example/event.json', 'milestones-data.js'],
                    message: 'content: update example event'
                });
                assert.equal(submitted.committed, true);
                assert.equal(submitted.pushed, true);
                assert.deepEqual(submitted.files, ['archive/events/example/event.json']);
                assert.equal(fs.existsSync(path.join(checkout, 'manage/not-for-content.js')), true);
                assert.equal(git(checkout, ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'manage']), '');

                write(checkout, 'archive/events/example/event.json', '{"id":"example","title":"next"}\n');
                write(checkout, 'scripts/unrelated-test.js', 'must be rejected\n');
                git(checkout, ['add', 'scripts/unrelated-test.js']);
                await assert.rejects(
                    service.submit({ paths: ['archive/events/example/event.json'] }),
                    (error) =>
                        error.code === 'UNEXPECTED_STAGED_FILES' && error.files.includes('scripts/unrelated-test.js')
                );
                assert.equal(git(checkout, ['log', '-1', '--pretty=%s']), 'content: update example event');
            })
            .finally(() => fs.rmSync(root, { recursive: true, force: true }));
    } catch (error) {
        fs.rmSync(root, { recursive: true, force: true });
        throw error;
    }
}

run()
    .then(() => console.log('Admin Git service tests passed.'))
    .catch((error) => {
        console.error(error.stack || error.message);
        process.exitCode = 1;
    });
