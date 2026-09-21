'use strict';

const { execFile } = require('node:child_process');

function runGit(root, args) {
    return new Promise((resolve, reject) => {
        execFile(
            'git',
            args,
            {
                cwd: root,
                maxBuffer: 20 * 1024 * 1024,
                env: process.env
            },
            (error, stdout, stderr) => {
                if (error) {
                    const failure = new Error((stderr || stdout || error.message).trim());
                    failure.code = error.code;
                    failure.stdout = stdout || '';
                    failure.stderr = stderr || '';
                    reject(failure);
                    return;
                }
                resolve({ stdout: stdout || '', stderr: stderr || '' });
            }
        );
    });
}

function parseStatus(output) {
    return output
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean)
        .map((line) => ({
            code: line.slice(0, 2),
            path: line.slice(3)
        }));
}

function pathMatchesPathspec(filePath, pathspec) {
    const normalizedFile = filePath.replace(/\\/g, '/');
    const normalizedSpec = String(pathspec || '')
        .replace(/\\/g, '/')
        .replace(/\/$/, '');
    return normalizedFile === normalizedSpec || normalizedFile.startsWith(`${normalizedSpec}/`);
}

function validateStagedFiles(files, requestedPaths) {
    const unexpected = files.filter(
        (filePath) => !requestedPaths.some((pathspec) => pathMatchesPathspec(filePath, pathspec))
    );
    if (unexpected.length) {
        throw Object.assign(
            new Error(`Git 暂存区包含不属于本次 Admin 提交的文件，请先清理暂存区：${unexpected.join(', ')}`),
            { code: 'UNEXPECTED_STAGED_FILES', files: unexpected }
        );
    }
}

function isAllowedSubmissionPath(filePath) {
    const raw = String(filePath || '').replace(/\\/g, '/');
    if (raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) return false;
    const segments = raw.split('/');
    if (segments.includes('..')) return false;
    const normalized = segments.filter((segment) => segment && segment !== '.').join('/');
    return (
        normalized === 'milestones-data.js' ||
        normalized === 'archive' ||
        normalized.startsWith('archive/') ||
        normalized === 'resources' ||
        normalized.startsWith('resources/')
    );
}

function validateRequestedPaths(requestedPaths) {
    const unexpected = requestedPaths.filter((filePath) => !isAllowedSubmissionPath(filePath));
    if (unexpected.length) {
        throw Object.assign(new Error(`Admin 提交路径包含禁止提交的文件：${unexpected.join(', ')}`), {
            code: 'UNSUPPORTED_SUBMISSION_PATHS',
            files: unexpected
        });
    }
}

function createAdminGitService(root) {
    async function context(remoteName = process.env.ADMIN_GIT_REMOTE || 'origin') {
        const [{ stdout: branchOutput }, { stdout: remoteOutput }] = await Promise.all([
            runGit(root, ['branch', '--show-current']),
            runGit(root, ['remote', 'get-url', remoteName])
        ]);
        const branch = (process.env.ADMIN_GIT_BRANCH || branchOutput.trim()).trim();
        if (!branch) throw new Error('当前 Git 仓库没有可提交的分支');
        return {
            remote: remoteName,
            remoteUrl: remoteOutput.trim(),
            branch
        };
    }

    async function status(paths = []) {
        const args = ['status', '--short', '--untracked-files=all'];
        if (paths.length) args.push('--', ...paths);
        const result = await runGit(root, args);
        return parseStatus(result.stdout);
    }

    async function submit({ paths, message, remoteName, branch } = {}) {
        const contextResult = await context(remoteName);
        const targetBranch = branch || contextResult.branch;
        const requestedPaths = [...new Set((paths || []).filter(Boolean))];
        validateRequestedPaths(requestedPaths);
        if (!requestedPaths.length) {
            return {
                ok: true,
                committed: false,
                pushed: false,
                message: '没有需要提交的内容。',
                ...contextResult,
                branch: targetBranch,
                files: [],
                commit: ''
            };
        }

        const beforeAdd = await status();
        const stagedBeforeAdd = beforeAdd.filter(
            (entry) => entry.code[0] === 'A' || entry.code[0] === 'M' || entry.code[0] === 'D' || entry.code[0] === 'R'
        );
        validateStagedFiles(
            stagedBeforeAdd.map((entry) => entry.path),
            requestedPaths
        );
        await runGit(root, ['add', '--', ...requestedPaths]);
        const { stdout: stagedOutput } = await runGit(root, ['diff', '--cached', '--name-only']);
        const files = stagedOutput.split(/\r?\n/).filter(Boolean);
        validateStagedFiles(files, requestedPaths);
        if (!files.length) {
            return {
                ok: true,
                committed: false,
                pushed: false,
                message: '指定的内容没有新的 Git 变化。',
                ...contextResult,
                branch: targetBranch,
                files: [],
                commit: ''
            };
        }

        const commitMessage = String(message || '').trim() || 'content: update Archive from Admin';
        const commitResult = await runGit(root, ['commit', '-m', commitMessage]);
        const { stdout: commitOutput } = await runGit(root, ['rev-parse', 'HEAD']);
        const commit = commitOutput.trim();
        const pushResult = await runGit(root, ['push', contextResult.remote, `HEAD:${targetBranch}`]);
        return {
            ok: true,
            committed: true,
            pushed: true,
            ...contextResult,
            branch: targetBranch,
            files,
            commit,
            commitOutput: commitResult.stdout,
            pushOutput: pushResult.stdout
        };
    }

    return { context, status, submit };
}

module.exports = { createAdminGitService, isAllowedSubmissionPath, parseStatus, validateRequestedPaths };
