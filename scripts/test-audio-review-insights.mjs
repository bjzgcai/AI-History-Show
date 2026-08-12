#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
    parseArgs,
    renderReport,
    resolveDateRange,
    runQuery
} from '../.agents/skills/audio-review-insights/scripts/query-audio-reviews.mjs';

const root = path.resolve(import.meta.dirname, '..');
const queryScript = path.join(root, '.agents/skills/audio-review-insights/scripts/query-audio-reviews.mjs');

const data = {
    schemaVersion: 1,
    exportedAt: '2026-08-13T00:00:00.000Z',
    candidates: [
        {
            candidateId: 'candidate-a',
            revisionId: 'revision-a',
            audioPath: 'resources/audio/generated/a.mp3',
            locale: 'zh',
            mode: 'storyline',
            eventId: '2017-transformer',
            scopeId: 'deep-learning',
            sequenceIndex: 1,
            title: { zh: 'Transformer', en: 'Transformer' },
            contexts: [
                { scopeId: 'deep-learning', eventId: '2017-transformer' },
                { scopeId: 'humanistic-cycle', eventId: '2017-transformer' }
            ],
            active: true
        },
        {
            candidateId: 'candidate-b',
            revisionId: 'revision-b',
            audioPath: 'resources/audio/generated/b.mp3',
            locale: 'en',
            mode: 'storyline',
            eventId: '2012-alexnet',
            scopeId: 'deep-learning',
            sequenceIndex: 2,
            title: { zh: 'AlexNet', en: 'AlexNet' },
            contexts: [{ scopeId: 'deep-learning', eventId: '2012-alexnet' }],
            active: true
        },
        {
            candidateId: 'candidate-c',
            revisionId: 'revision-c',
            audioPath: 'resources/audio/generated/c.mp3',
            locale: 'zh',
            mode: 'storyline',
            eventId: '1956-dartmouth',
            scopeId: 'humanistic-cycle',
            sequenceIndex: 3,
            title: { zh: '达特茅斯会议', en: 'Dartmouth Workshop' },
            contexts: [{ scopeId: 'humanistic-cycle', eventId: '1956-dartmouth' }],
            active: false
        }
    ],
    records: [
        {
            id: 'record-before-day',
            candidateId: 'candidate-c',
            reviewer: { id: 'reviewer-a', name: '审核人甲' },
            result: 'fail',
            note: '前一天的记录',
            createdAt: '2026-08-11T15:59:59.000Z',
            invalidatedAt: null,
            invalidatedBy: null,
            invalidationReason: null
        },
        {
            id: 'record-fail-a',
            candidateId: 'candidate-a',
            reviewer: { id: 'reviewer-a', name: '审核人甲' },
            result: 'fail',
            note: '01:25 人名发音需要调整',
            createdAt: '2026-08-11T16:00:00.000Z',
            invalidatedAt: null,
            invalidatedBy: null,
            invalidationReason: null
        },
        {
            id: 'record-fail-b',
            candidateId: 'candidate-b',
            reviewer: { id: 'reviewer-b', name: '审核人乙' },
            result: 'fail',
            note: '',
            createdAt: '2026-08-12T02:00:00.000Z',
            invalidatedAt: null,
            invalidatedBy: null,
            invalidationReason: null
        },
        {
            id: 'record-invalidated',
            candidateId: 'candidate-c',
            reviewer: { id: 'reviewer-a', name: '审核人甲' },
            result: 'pass',
            note: '误操作',
            createdAt: '2026-08-12T03:00:00.000Z',
            invalidatedAt: '2026-08-12T04:00:00.000Z',
            invalidatedBy: 'admin',
            invalidationReason: '误点通过'
        },
        {
            id: 'record-pass-a-later',
            candidateId: 'candidate-a',
            reviewer: { id: 'reviewer-b', name: '审核人乙' },
            result: 'pass',
            note: '修改后通过',
            createdAt: '2026-08-12T16:30:00.000Z',
            invalidatedAt: null,
            invalidatedBy: null,
            invalidationReason: null
        }
    ]
};

const now = new Date('2026-08-12T06:00:00.000Z');

function writeSqliteFixture(databasePath) {
    const database = new DatabaseSync(databasePath);
    database.exec(`
        CREATE TABLE candidates (
            candidate_id TEXT PRIMARY KEY,
            revision_id TEXT NOT NULL,
            audio_path TEXT NOT NULL,
            locale TEXT NOT NULL,
            mode TEXT NOT NULL,
            event_id TEXT NOT NULL,
            scope_id TEXT NOT NULL,
            sequence_index INTEGER NOT NULL,
            title_json TEXT NOT NULL,
            contexts_json TEXT NOT NULL,
            active INTEGER NOT NULL,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL
        );
        CREATE TABLE review_records (
            id TEXT PRIMARY KEY,
            request_id TEXT NOT NULL UNIQUE,
            candidate_id TEXT NOT NULL,
            reviewer_id TEXT NOT NULL,
            reviewer_name TEXT NOT NULL,
            result TEXT NOT NULL,
            note TEXT NOT NULL,
            created_at TEXT NOT NULL,
            invalidated_at TEXT,
            invalidated_by TEXT,
            invalidation_reason TEXT
        );
    `);
    const insertCandidate = database.prepare(`
        INSERT INTO candidates VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const candidate of data.candidates) {
        insertCandidate.run(
            candidate.candidateId,
            candidate.revisionId,
            candidate.audioPath,
            candidate.locale,
            candidate.mode,
            candidate.eventId,
            candidate.scopeId,
            candidate.sequenceIndex,
            JSON.stringify(candidate.title),
            JSON.stringify(candidate.contexts),
            candidate.active ? 1 : 0,
            '2026-08-01T00:00:00.000Z',
            '2026-08-13T00:00:00.000Z'
        );
    }
    const insertRecord = database.prepare(`
        INSERT INTO review_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const record of data.records) {
        insertRecord.run(
            record.id,
            `request-${record.id}`,
            record.candidateId,
            record.reviewer.id,
            record.reviewer.name,
            record.result,
            record.note,
            record.createdAt,
            record.invalidatedAt,
            record.invalidatedBy,
            record.invalidationReason
        );
    }
    database.close();
}

function runCli(args) {
    return spawnSync(process.execPath, [queryScript, ...args], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, AUDIO_REVIEW_TIMEZONE: 'Asia/Shanghai' }
    });
}

async function main() {
    const range = resolveDateRange({ date: '2026-08-12', timezone: 'Asia/Shanghai' }, now);
    assert.equal(range.start.toISOString(), '2026-08-11T16:00:00.000Z');
    assert.equal(range.endExclusive.toISOString(), '2026-08-12T16:00:00.000Z');

    const daily = await runQuery({ command: 'daily', date: '2026-08-12' }, { data, now });
    assert.deepEqual(daily.totals, {
        submissions: 3,
        effectiveRecords: 2,
        selectedRecords: 2,
        pass: 0,
        fail: 2,
        invalidatedSubmissions: 1,
        invalidationsInRange: 1,
        candidateCount: 2,
        eventCount: 2,
        reviewerCount: 2
    });
    assert.equal(daily.failures.length, 2);
    assert.equal(daily.failures[0].currentReview.status, 'pass');
    assert.equal(daily.failures[1].currentReview.status, 'revise');
    assert.equal(daily.failures[1].note, '');

    const failed = await runQuery({ command: 'failed', date: '2026-08-12' }, { data, now });
    assert.equal(failed.totals.submissions, 2);
    assert.equal(failed.totals.fail, 2);
    assert.equal(failed.totals.pass, 0);

    const stillFailing = await runQuery({ command: 'failed', date: '2026-08-12', stillFailing: true }, { data, now });
    assert.equal(stillFailing.totals.submissions, 1);
    assert.equal(stillFailing.failures[0].eventId, '2012-alexnet');

    const allContexts = await runQuery(
        { command: 'failed', date: '2026-08-12', storylineMode: 'all-contexts' },
        { data, now }
    );
    assert.deepEqual(
        allContexts.byStoryline.map((item) => [item.label, item.total]),
        [
            ['deep-learning', 2],
            ['humanistic-cycle', 1]
        ]
    );

    const reviewer = await runQuery({ command: 'reviewer', date: '2026-08-12', reviewer: '审核人甲' }, { data, now });
    assert.equal(reviewer.totals.submissions, 2);
    assert.equal(reviewer.totals.effectiveRecords, 1);
    assert.equal(reviewer.totals.selectedRecords, 1);
    assert.equal(reviewer.byReviewer[0].label, '审核人甲');

    const history = await runQuery({ command: 'event-history', eventId: '2017-transformer' }, { data, now });
    assert.equal(history.records.length, 2);
    assert.equal(history.candidates[0].currentReview.status, 'pass');

    const markdown = renderReport(daily, 'markdown');
    assert.match(markdown, /01:25 人名发音需要调整/);
    assert.match(markdown, /当前状态：已通过/);
    assert.match(markdown, /备注：（无备注）/);

    const json = JSON.parse(renderReport(failed, 'json'));
    assert.equal(json.failures.length, 2);

    const csv = renderReport(failed, 'csv');
    assert.match(csv, /^eventId,title,candidateId/);
    assert.match(csv, /2017-transformer/);

    await assert.rejects(
        () => runQuery({ command: 'daily', date: '2026-08-12', stillFailing: true }, { data, now }),
        /only supported by the failed command/
    );

    assert.throws(() => parseArgs(['daily', '--dat', 'today']), /Unknown option/);

    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-review-insights-'));
    try {
        const exportPath = path.join(temporaryRoot, 'review-export.json');
        const databasePath = path.join(temporaryRoot, 'reviews.sqlite');
        fs.writeFileSync(exportPath, JSON.stringify(data));
        writeSqliteFixture(databasePath);

        const jsonCli = runCli(['failed', '--date', '2026-08-12', '--input', exportPath, '--format', 'json']);
        assert.equal(jsonCli.status, 0, jsonCli.stderr);
        assert.equal(JSON.parse(jsonCli.stdout).failures.length, 2);

        const sqliteCli = runCli(['daily', '--date', '2026-08-12', '--db', databasePath, '--format', 'json']);
        assert.equal(sqliteCli.status, 0, sqliteCli.stderr);
        assert.equal(JSON.parse(sqliteCli.stdout).totals.fail, 2);
    } finally {
        fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }

    console.log('PASS audio review insight date, status, grouping, history, and output semantics');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
