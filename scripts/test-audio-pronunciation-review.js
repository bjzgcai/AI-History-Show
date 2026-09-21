#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { URL } = require('node:url');
const { once } = require('node:events');

const { hashToken } = require('../audio-review/auth');
const { createAudioReviewServer } = require('../audio-review/server');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-pronunciation-review-'));
const publicRoot = path.join(root, 'public');
const configPath = path.join(root, 'audio', 'pronunciation', 'qualification-cases.json');
const glossaryPath = path.join(root, 'audio', 'pronunciation', 'glossary.json');
const manifestPath = path.join(root, '.tmp', 'pronunciation-qualification', 'manifest.json');
const turnPath = path.join(root, 'audio', 'revisions', 'test', 'turns', 'zh', 'test-term.json');
const reviewDataPath = path.join(root, 'review-data.json');
const databasePath = path.join(root, '.tmp', 'audio-review', 'reviews.sqlite');
const pronunciationAudioRoot = path.join(root, '.tmp', 'pronunciation-qualification', 'test-group');
const token = 'pronunciation-review-token';

fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.mkdirSync(path.dirname(turnPath), { recursive: true });
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.mkdirSync(pronunciationAudioRoot, { recursive: true });
fs.writeFileSync(path.join(publicRoot, 'index.html'), '<!doctype html><title>Audio Review</title>');
fs.writeFileSync(path.join(publicRoot, 'app.js'), '');
fs.writeFileSync(path.join(publicRoot, 'styles.css'), '');
fs.writeFileSync(
    turnPath,
    JSON.stringify({
        locale: 'zh',
        eventId: 'test-term-event',
        turns: [{ role: 'B', text: '这是 NAS 所在的测试句子。' }]
    })
);
fs.writeFileSync(
    glossaryPath,
    JSON.stringify({
        entries: [
            {
                id: 'nas',
                term: 'NAS',
                aliases: ['NAS'],
                category: 'initialism',
                verification: 'canonical',
                reading: { spoken: 'N A S' }
            }
        ]
    })
);
fs.writeFileSync(
    configPath,
    JSON.stringify({
        groups: [
            {
                id: 'test-group',
                qualificationId: 'test-nas-qualification',
                termId: 'nas',
                locale: 'zh',
                speechForm: 'N-A-S',
                reviewStatus: 'pending-human-review',
                contexts: [
                    { id: 'test-context', turnPath: path.relative(root, turnPath), turnIndex: 1, repeatCount: 2 }
                ]
            }
        ]
    })
);
fs.writeFileSync(
    manifestPath,
    JSON.stringify({
        samples: [
            {
                id: 'test-group-test-context-repeat-1',
                outputPath: '.tmp/pronunciation-qualification/test-group/test-context-repeat-1.mp3',
                speechText: '这是 N-A-S 所在的测试句子。',
                seed: 1
            },
            {
                id: 'test-group-test-context-term-repeat-1',
                outputPath: '.tmp/pronunciation-qualification/test-group/test-context-term-repeat-1.mp3',
                speechText: 'N-A-S',
                seed: 2
            }
        ]
    })
);
fs.writeFileSync(path.join(pronunciationAudioRoot, 'test-context-repeat-1.mp3'), Buffer.from('context-audio'));
fs.writeFileSync(path.join(pronunciationAudioRoot, 'test-context-term-repeat-1.mp3'), Buffer.from('term-audio'));
fs.writeFileSync(
    reviewDataPath,
    JSON.stringify({
        release: { previews: [] },
        scopes: {},
        events: []
    })
);

const server = createAudioReviewServer({
    projectRoot: root,
    publicRoot,
    reviewDataPath,
    databasePath,
    tokenEntries: [{ id: 'reviewer', name: '审核人', role: 'reviewer', tokenHash: hashToken(token) }],
    pronunciationConfigPath: configPath,
    pronunciationGlossaryPath: glossaryPath,
    pronunciationManifestPath: manifestPath
});

async function main() {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    try {
        const login = await fetch(`${baseUrl}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: baseUrl },
            body: JSON.stringify({ token })
        });
        assert.equal(login.status, 200);
        const cookie = login.headers.get('set-cookie').split(';')[0];
        const dataResponse = await fetch(`${baseUrl}/api/pronunciation-data`, { headers: { Cookie: cookie } });
        assert.equal(dataResponse.status, 200);
        const data = await dataResponse.json();
        assert.equal(data.groups.length, 1);
        assert.equal(data.groups[0].qualifications.length, 1);
        const qualification = data.groups[0].qualifications[0];
        assert.equal(qualification.contexts[0].samples.length, 4);
        assert.equal(qualification.contexts[0].samples.filter((sample) => sample.kind === 'term').length, 2);
        assert.equal(qualification.contexts[0].samples.filter((sample) => sample.kind === 'context').length, 2);

        const termSample = qualification.contexts[0].samples.find(
            (sample) => sample.kind === 'term' && sample.repeat === 1
        );
        assert.equal(termSample.audioAvailable, true);
        const audio = await fetch(new URL(termSample.audioUrl, `${baseUrl}/`), {
            headers: { Cookie: cookie, Range: 'bytes=0-3' }
        });
        assert.equal(audio.status, 206);
        assert.equal(await audio.text(), 'term');

        const review = await fetch(`${baseUrl}/api/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: baseUrl, Cookie: cookie },
            body: JSON.stringify({
                candidateId: termSample.candidateId,
                result: 'pass',
                requestId: 'pronunciation-review-1'
            })
        });
        assert.equal(review.status, 201);
        assert.equal((await review.json()).summary.status, 'pass');
        console.log('Pronunciation review service checks passed.');
    } finally {
        server.close();
        await once(server, 'close');
        fs.rmSync(root, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
