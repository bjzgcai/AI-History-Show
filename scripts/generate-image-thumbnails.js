const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PYTHON_SCRIPT = path.join(__dirname, 'generate-image-thumbnails.py');

function candidatePythonCommands() {
    const commands = [];
    const push = (command) => {
        if (!command || commands.includes(command)) return;
        commands.push(command);
    };

    push(process.env.PYTHON);
    push(process.env.CODEX_PYTHON);

    const home = process.env.USERPROFILE || process.env.HOME || '';
    if (home) {
        push(path.join(
            home,
            '.cache',
            'codex-runtimes',
            'codex-primary-runtime',
            'dependencies',
            'python',
            process.platform === 'win32' ? 'python.exe' : 'bin/python'
        ));
    }

    push('python');
    push('python3');
    return commands;
}

function isMissingPillow(result) {
    return /No module named ['"]PIL['"]/.test(`${result.stderr || ''}\n${result.stdout || ''}`);
}

function runGenerator(command) {
    return spawnSync(command, [PYTHON_SCRIPT], {
        cwd: ROOT,
        encoding: 'utf8',
        windowsHide: true
    });
}

const skipped = [];
for (const command of candidatePythonCommands()) {
    if (path.isAbsolute(command) && !fs.existsSync(command)) {
        skipped.push(`${command} (not found)`);
        continue;
    }

    const result = runGenerator(command);
    if (result.error) {
        skipped.push(`${command} (${result.error.code || result.error.message})`);
        continue;
    }

    if (result.status === 0) {
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        process.exit(0);
    }

    if (isMissingPillow(result)) {
        skipped.push(`${command} (Pillow missing)`);
        continue;
    }

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
}

console.error('Unable to generate thumbnails: no available Python runtime with Pillow was found.');
if (skipped.length) console.error(`Tried: ${skipped.join('; ')}`);
process.exit(1);
