#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const { hashToken } = require('../audio-review/auth');
const { createAudioReviewServer } = require('../audio-review/server');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-review-service-'));
const publicRoot = path.join(temporaryRoot, 'public');
const audioDirectory = path.join(temporaryRoot, 'resources', 'audio', 'generated', 'test');
const reviewDataPath = path.join(temporaryRoot, 'review-data.json');
const databasePath = path.join(temporaryRoot, 'data', 'reviews.sqlite');
const audioRelativePath = 'resources/audio/generated/test/candidate.mp3';
const reviewerToken = 'reviewer-token';
const secondReviewerToken = 'second-reviewer-token';
const adminToken = 'admin-token';
const tokenEntries = [
    { id: 'reviewer-a', name: '审核人甲', role: 'reviewer', tokenHash: hashToken(reviewerToken) },
    { id: 'reviewer-b', name: '审核人乙', role: 'reviewer', tokenHash: hashToken(secondReviewerToken) },
    { id: 'admin', name: '审核管理员', role: 'admin', tokenHash: hashToken(adminToken) }
];

fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(audioDirectory, { recursive: true });
fs.writeFileSync(path.join(publicRoot, 'index.html'), '<!doctype html><title>Audio Review</title>');
fs.writeFileSync(path.join(publicRoot, 'app.js'), 'console.log("review");');
fs.writeFileSync(path.join(publicRoot, 'styles.css'), 'body { color: black; }');
fs.writeFileSync(path.join(temporaryRoot, audioRelativePath), Buffer.from('0123456789abcdef'));
fs.writeFileSync(
    reviewDataPath,
    `${JSON.stringify(
        {
            schemaVersion: 2,
            release: {
                status: 'candidate-listening-review',
                previews: [{ locale: 'zh', path: audioRelativePath, durationSec: 1 }]
            },
            scopes: { test: { eventCount: 1 } },
            events: [
                {
                    scopeId: 'test',
                    sequenceIndex: 1,
                    eventId: 'test-event',
                    title: { en: 'Test event', zh: '测试事件' },
                    variants: {
                        zh: {
                            storyline: {
                                audio: { path: audioRelativePath, durationSec: 1 },
                                revision: { id: 'test-revision', kind: 'previous', label: '测试修订' }
                            }
                        }
                    }
                }
            ]
        },
        null,
        2
    )}\n`
);

function createServer() {
    return createAudioReviewServer({
        projectRoot: temporaryRoot,
        publicRoot,
        reviewDataPath,
        databasePath,
        tokenEntries,
        secureCookie: false
    });
}

async function listen(server) {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    return `http://127.0.0.1:${server.address().port}`;
}

async function close(server) {
    server.close();
    await once(server, 'close');
}

async function login(baseUrl, token) {
    const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: baseUrl },
        body: JSON.stringify({ token })
    });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
}

async function requestJson(baseUrl, pathname, cookie, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json', Origin: baseUrl } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
            ...options.headers
        }
    });
    const payload = await response.json();
    return { response, payload };
}

async function main() {
    let server = createServer();
    try {
        let baseUrl = await listen(server);
        const index = await fetch(`${baseUrl}/`);
        assert.equal(index.status, 200);
        assert.match(await index.text(), /Audio Review/);

        const unauthorized = await fetch(`${baseUrl}/api/reviews`);
        assert.equal(unauthorized.status, 401);

        const reviewerCookie = await login(baseUrl, reviewerToken);
        const secondReviewerCookie = await login(baseUrl, secondReviewerToken);
        const adminCookie = await login(baseUrl, adminToken);

        const reviewData = await requestJson(baseUrl, '/api/review-data', reviewerCookie);
        assert.equal(reviewData.response.status, 200);
        const candidate = reviewData.payload.events[0].variants.zh.storyline;
        assert.match(candidate.candidateId, /^audio-[a-f0-9]{24}$/);
        assert.equal(candidate.audio.reviewUrl, `/api/audio/${candidate.candidateId}`);
        const [preview] = reviewData.payload.release.previews;
        assert.match(preview.reviewUrl, /^\/api\/audio\/audio-[a-f0-9]{24}$/);

        const initial = await requestJson(baseUrl, '/api/reviews', reviewerCookie);
        assert.equal(initial.payload.reviews[candidate.candidateId].status, 'pending');

        const missingCandidate = await requestJson(baseUrl, '/api/reviews', reviewerCookie, {
            method: 'POST',
            body: JSON.stringify({ result: 'fail', requestId: 'missing-candidate' })
        });
        assert.equal(missingCandidate.response.status, 400);
        assert.equal(missingCandidate.payload.error, 'candidateId is required');

        const range = await fetch(`${baseUrl}${candidate.audio.reviewUrl}`, {
            headers: { Cookie: reviewerCookie, Range: 'bytes=2-5' }
        });
        assert.equal(range.status, 206);
        assert.equal(await range.text(), '2345');

        const previewRange = await fetch(`${baseUrl}${preview.reviewUrl}`, {
            headers: { Cookie: reviewerCookie, Range: 'bytes=6-9' }
        });
        assert.equal(previewRange.status, 206);
        assert.equal(await previewRange.text(), '6789');

        const failed = await requestJson(baseUrl, '/api/reviews', reviewerCookie, {
            method: 'POST',
            body: JSON.stringify({
                candidateId: candidate.candidateId,
                result: 'fail',
                note: '需要调整停顿',
                requestId: 'review-request-fail'
            })
        });
        assert.equal(failed.response.status, 201);
        assert.equal(failed.payload.summary.status, 'revise');
        assert.equal(failed.payload.summary.failCount, 1);

        const passed = await requestJson(baseUrl, '/api/reviews', secondReviewerCookie, {
            method: 'POST',
            body: JSON.stringify({
                candidateId: candidate.candidateId,
                result: 'pass',
                note: '',
                requestId: 'review-request-pass'
            })
        });
        assert.equal(passed.payload.summary.status, 'pass');
        assert.equal(passed.payload.summary.approved, true);
        assert.equal(passed.payload.summary.passCount, 1);
        assert.equal(passed.payload.summary.failCount, 1);

        const duplicate = await requestJson(baseUrl, '/api/reviews', secondReviewerCookie, {
            method: 'POST',
            body: JSON.stringify({
                candidateId: candidate.candidateId,
                result: 'pass',
                requestId: 'review-request-pass'
            })
        });
        assert.equal(duplicate.payload.created, false);
        assert.equal(duplicate.payload.summary.recordCount, 2);

        const approved = await requestJson(baseUrl, '/api/reviews/approved-manifest', reviewerCookie);
        assert.equal(approved.payload.policy, 'any-valid-pass');
        assert.equal(approved.payload.candidates.length, 1);

        const invalidated = await requestJson(
            baseUrl,
            `/api/reviews/${passed.payload.record.id}/invalidate`,
            adminCookie,
            {
                method: 'POST',
                body: JSON.stringify({ reason: '误操作' })
            }
        );
        assert.equal(invalidated.payload.summary.approved, false);
        assert.equal(invalidated.payload.summary.status, 'revise');

        await close(server);
        server = createServer();
        baseUrl = await listen(server);
        const restoredCookie = await login(baseUrl, reviewerToken);
        const restored = await requestJson(baseUrl, '/api/reviews', restoredCookie);
        assert.equal(restored.payload.reviews[candidate.candidateId].recordCount, 1);
        assert.equal(restored.payload.reviews[candidate.candidateId].records.length, 2);

        console.log('PASS token-authenticated multi-user audio review persistence');
    } finally {
        if (server.listening) await close(server);
        fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
