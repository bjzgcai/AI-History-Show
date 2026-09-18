#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEXT_EXTENSIONS = new Set([
    '',
    '.cjs',
    '.conf',
    '.css',
    '.csv',
    '.env',
    '.example',
    '.html',
    '.ini',
    '.js',
    '.json',
    '.jsonl',
    '.md',
    '.mjs',
    '.py',
    '.sh',
    '.toml',
    '.ts',
    '.tsx',
    '.txt',
    '.svg',
    '.xml',
    '.yaml',
    '.yml'
]);
const SENSITIVE_DATA_PATH = /(^|\/)(data|exports|questions|uploads)(\/|$)/i;
const URL = /https?:\/\/[^\s"'<>]+/gi;
const UNTRACKED_EXCLUDED_PREFIXES = ['exports/'];
const RETIRED_OSS_BUCKET = new RegExp(['zgca', 'medias'].join('-'), 'i');

const GLOBAL_RULES = [
    {
        id: 'private-ipv4',
        pattern:
            /(^|[^0-9])(10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(?:1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3})([^0-9]|$)/
    },
    { id: 'internal-hostname', pattern: /\b[a-z0-9.-]+\.inner\.[a-z0-9.-]+\b/i },
    { id: 'aliyun-oss-host', pattern: /\b(?:[a-z0-9][a-z0-9.-]*\.)?oss-[a-z0-9-]+\.aliyuncs\.com\b/i },
    { id: 'retired-oss-bucket', pattern: RETIRED_OSS_BUCKET },
    { id: 'internal-email', pattern: /\b[a-z0-9._%+-]+@(zgci\.ac\.cn|bjzgca\.edu\.cn|bza\.edu\.cn)\b/i }
];
const DATA_RULES = [
    { id: 'personal-email-in-data', pattern: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i },
    { id: 'cn-mobile-in-data', pattern: /(^|[^0-9])1[3-9][0-9]{9}([^0-9]|$)/ }
];

function gitFiles(args) {
    const result = spawnSync('git', ['ls-files', '-z', ...args], { cwd: ROOT, encoding: 'buffer' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr.toString('utf8').trim() || 'git ls-files failed');
    return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

function repositoryFiles() {
    const tracked = gitFiles(['--cached']);
    const untracked = gitFiles(['--others', '--exclude-standard']).filter(
        (file) => !UNTRACKED_EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))
    );
    return [...new Set([...tracked, ...untracked])];
}

function isTextCandidate(file) {
    const name = path.basename(file);
    return name === 'Dockerfile' || TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function scanLine(file, line) {
    const findings = [];
    const withoutUrls = line.replace(URL, '');
    for (const rule of GLOBAL_RULES) {
        if (rule.pattern.test(line)) findings.push(rule.id);
    }
    if (SENSITIVE_DATA_PATH.test(file)) {
        for (const rule of DATA_RULES) {
            if (rule.pattern.test(withoutUrls)) findings.push(rule.id);
        }
    }
    return findings;
}

function scanFile(file) {
    if (!isTextCandidate(file)) return [];
    const absolutePath = path.join(ROOT, file);
    let source;
    try {
        source = fs.readFileSync(absolutePath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
    if (source.includes('\0')) return [];
    const findings = [];
    source.split(/\r?\n/).forEach((line, index) => {
        for (const ruleId of scanLine(file, line)) findings.push({ file, line: index + 1, ruleId });
    });
    return findings;
}

function main() {
    const findings = repositoryFiles().flatMap(scanFile);
    if (findings.length > 0) {
        console.error('Sensitive content scan failed:');
        for (const finding of findings) console.error(`- ${finding.file}:${finding.line} (${finding.ruleId})`);
        process.exitCode = 1;
        return;
    }
    console.log('Sensitive content scan passed.');
}

if (require.main === module) main();

module.exports = { repositoryFiles, scanLine };
