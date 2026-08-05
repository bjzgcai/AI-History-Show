const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PYTHON_SCRIPT = path.join(__dirname, 'generate-image-thumbnails.py');
const IMAGE_ROOT = 'resources/images/';
const RASTER_EXTENSION_PATTERN = /\.(?:jpe?g|png|gif|webp)$/i;
const BRANCH_EXPLAINER_PATTERN = /\/explainers\/|explainer|diagram|search|database|policy|value|mcts|tree|perfect-play/i;

function normalizeLocalImagePath(value) {
    const raw = String(value || '').trim();
    const pathWithoutSuffix = raw.split(/[?#]/, 1)[0].replace(/\\/g, '/').replace(/^\.\//, '');
    if (!pathWithoutSuffix.startsWith(IMAGE_ROOT) || !RASTER_EXTENSION_PATTERN.test(pathWithoutSuffix)) return '';
    return pathWithoutSuffix;
}

function buildThumbnailTargets() {
    const { milestones } = require(path.join(ROOT, 'milestones-data.js'));
    const targets = new Set();
    const addTarget = (value) => {
        const imagePath = normalizeLocalImagePath(value);
        if (imagePath) targets.add(imagePath);
    };

    milestones.forEach((milestone) => {
        const images = Array.isArray(milestone && milestone.resources && milestone.resources.images)
            ? milestone.resources.images.filter(Boolean)
            : [];
        const overviewImage = milestone && milestone.resources && milestone.resources.overviewImage
            ? milestone.resources.overviewImage
            : images[0];
        addTarget(overviewImage);

        const demoImage = milestone && milestone.achievement ? milestone.achievement.demoImage : '';
        const branchImage = demoImage || images.find((image) => BRANCH_EXPLAINER_PATTERN.test(String(image))) || images[0];
        addTarget(branchImage);

        (milestone.figures || []).forEach((figure) => addTarget(figure && figure.avatar));
    });

    return [...targets].sort();
}

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

function runGenerator(command, targetsFile) {
    return spawnSync(command, [PYTHON_SCRIPT, '--targets-file', targetsFile], {
        cwd: ROOT,
        encoding: 'utf8',
        windowsHide: true
    });
}

let targetsDirectory = '';
try {
    targetsDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-history-thumbnails-'));
    const targetsFile = path.join(targetsDirectory, 'targets.json');
    const targets = buildThumbnailTargets();
    fs.writeFileSync(targetsFile, `${JSON.stringify(targets, null, 2)}\n`);
    console.log(`Thumbnail targets: ${targets.length}.`);

    const skipped = [];
    for (const command of candidatePythonCommands()) {
        if (path.isAbsolute(command) && !fs.existsSync(command)) {
            skipped.push(`${command} (not found)`);
            continue;
        }

        const result = runGenerator(command, targetsFile);
        if (result.error) {
            skipped.push(`${command} (${result.error.code || result.error.message})`);
            continue;
        }

        if (result.status === 0) {
            if (result.stdout) process.stdout.write(result.stdout);
            if (result.stderr) process.stderr.write(result.stderr);
            process.exitCode = 0;
            break;
        }

        if (isMissingPillow(result)) {
            skipped.push(`${command} (Pillow missing)`);
            continue;
        }

        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        process.exitCode = result.status || 1;
        break;
    }

    if (process.exitCode == null) {
        console.error('Unable to generate thumbnails: no available Python runtime with Pillow was found.');
        if (skipped.length) console.error(`Tried: ${skipped.join('; ')}`);
        process.exitCode = 1;
    }
} finally {
    if (targetsDirectory) fs.rmSync(targetsDirectory, { recursive: true, force: true });
}
