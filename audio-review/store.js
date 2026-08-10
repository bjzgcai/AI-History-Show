'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function nowIso() {
    return new Date().toISOString();
}

function rowToRecord(row) {
    return {
        id: row.id,
        candidateId: row.candidate_id,
        reviewer: {
            id: row.reviewer_id,
            name: row.reviewer_name
        },
        result: row.result,
        note: row.note,
        createdAt: row.created_at,
        invalidatedAt: row.invalidated_at,
        invalidatedBy: row.invalidated_by,
        invalidationReason: row.invalidation_reason
    };
}

function rowToCandidate(row) {
    return {
        candidateId: row.candidate_id,
        revisionId: row.revision_id,
        audioPath: row.audio_path,
        locale: row.locale,
        mode: row.mode,
        eventId: row.event_id,
        scopeId: row.scope_id,
        sequenceIndex: row.sequence_index,
        title: JSON.parse(row.title_json),
        contexts: JSON.parse(row.contexts_json),
        active: row.active === 1,
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at
    };
}

function summarizeRecords(records) {
    const valid = records.filter((record) => !record.invalidatedAt);
    const passCount = valid.filter((record) => record.result === 'pass').length;
    const failCount = valid.filter((record) => record.result === 'fail').length;
    return {
        status: passCount > 0 ? 'pass' : failCount > 0 ? 'revise' : 'pending',
        approved: passCount > 0,
        passCount,
        failCount,
        recordCount: valid.length,
        records
    };
}

class AudioReviewStore {
    constructor(databasePath) {
        fs.mkdirSync(path.dirname(databasePath), { recursive: true });
        this.database = new DatabaseSync(databasePath);
        this.database.exec('PRAGMA journal_mode = WAL');
        this.database.exec('PRAGMA foreign_keys = ON');
        this.database.exec('PRAGMA busy_timeout = 5000');
        this.database.exec(`
            CREATE TABLE IF NOT EXISTS candidates (
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
                active INTEGER NOT NULL DEFAULT 1,
                first_seen_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS review_records (
                id TEXT PRIMARY KEY,
                request_id TEXT NOT NULL UNIQUE,
                candidate_id TEXT NOT NULL REFERENCES candidates(candidate_id),
                reviewer_id TEXT NOT NULL,
                reviewer_name TEXT NOT NULL,
                result TEXT NOT NULL CHECK (result IN ('pass', 'fail')),
                note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                invalidated_at TEXT,
                invalidated_by TEXT,
                invalidation_reason TEXT
            );
            CREATE INDEX IF NOT EXISTS review_records_candidate_idx
                ON review_records(candidate_id, created_at);
        `);
    }

    syncCandidates(candidates) {
        const timestamp = nowIso();
        const upsert = this.database.prepare(`
            INSERT INTO candidates (
                candidate_id, revision_id, audio_path, locale, mode, event_id, scope_id,
                sequence_index, title_json, contexts_json, active, first_seen_at, last_seen_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            ON CONFLICT(candidate_id) DO UPDATE SET
                revision_id = excluded.revision_id,
                audio_path = excluded.audio_path,
                locale = excluded.locale,
                mode = excluded.mode,
                event_id = excluded.event_id,
                scope_id = excluded.scope_id,
                sequence_index = excluded.sequence_index,
                title_json = excluded.title_json,
                contexts_json = excluded.contexts_json,
                active = 1,
                last_seen_at = excluded.last_seen_at
        `);
        this.database.exec('BEGIN IMMEDIATE');
        try {
            this.database.exec('UPDATE candidates SET active = 0');
            for (const candidate of candidates.values()) {
                upsert.run(
                    candidate.candidateId,
                    candidate.revisionId,
                    candidate.audioPath,
                    candidate.locale,
                    candidate.mode,
                    candidate.eventId,
                    candidate.scopeId,
                    candidate.sequenceIndex,
                    JSON.stringify(candidate.title || {}),
                    JSON.stringify(candidate.contexts || []),
                    timestamp,
                    timestamp
                );
            }
            this.database.exec('COMMIT');
        } catch (error) {
            this.database.exec('ROLLBACK');
            throw error;
        }
    }

    candidate(candidateId) {
        return this.database.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidateId) || null;
    }

    records(candidateId) {
        return this.database
            .prepare('SELECT * FROM review_records WHERE candidate_id = ? ORDER BY created_at DESC, id DESC')
            .all(candidateId)
            .map(rowToRecord);
    }

    summary(candidateId) {
        return summarizeRecords(this.records(candidateId));
    }

    summaries({ activeOnly = true } = {}) {
        const rows = this.database
            .prepare(
                `SELECT candidate_id FROM candidates${activeOnly ? ' WHERE active = 1' : ''} ORDER BY candidate_id`
            )
            .all();
        return Object.fromEntries(rows.map((row) => [row.candidate_id, this.summary(row.candidate_id)]));
    }

    candidates({ activeOnly = true } = {}) {
        return this.database
            .prepare(
                `SELECT * FROM candidates${activeOnly ? ' WHERE active = 1' : ''} ORDER BY scope_id, sequence_index, locale, candidate_id`
            )
            .all()
            .map(rowToCandidate);
    }

    approvedManifest() {
        const candidates = this.candidates();
        return {
            schemaVersion: 1,
            generatedAt: nowIso(),
            policy: 'any-valid-pass',
            candidates: candidates
                .map((candidate) => ({ ...candidate, review: this.summary(candidate.candidateId) }))
                .filter((candidate) => candidate.review.approved)
        };
    }

    unapprovedCandidates() {
        return this.candidates()
            .map((candidate) => ({ ...candidate, review: this.summary(candidate.candidateId) }))
            .filter((candidate) => !candidate.review.approved);
    }

    appendReview({ candidateId, reviewer, result, note = '', requestId }) {
        if (!['pass', 'fail'].includes(result))
            throw Object.assign(new Error('result must be pass or fail'), { statusCode: 400 });
        const normalizedCandidateId = String(candidateId || '').trim();
        if (!normalizedCandidateId) {
            throw Object.assign(new Error('candidateId is required'), { statusCode: 400 });
        }
        const candidate = this.candidate(normalizedCandidateId);
        if (!candidate || candidate.active !== 1) {
            throw Object.assign(new Error('Review candidate is not active'), { statusCode: 404 });
        }
        const normalizedRequestId = String(requestId || '').trim();
        if (!normalizedRequestId || normalizedRequestId.length > 128) {
            throw Object.assign(new Error('requestId is required'), { statusCode: 400 });
        }
        const existing = this.database
            .prepare('SELECT * FROM review_records WHERE request_id = ?')
            .get(normalizedRequestId);
        if (existing) {
            if (existing.reviewer_id !== reviewer.id || existing.candidate_id !== normalizedCandidateId) {
                throw Object.assign(new Error('requestId already belongs to another review'), { statusCode: 409 });
            }
            return { record: rowToRecord(existing), summary: this.summary(normalizedCandidateId), created: false };
        }
        const record = {
            id: crypto.randomUUID(),
            candidateId: normalizedCandidateId,
            reviewerId: reviewer.id,
            reviewerName: reviewer.name,
            result,
            note: String(note || '')
                .trim()
                .slice(0, 4000),
            createdAt: nowIso()
        };
        this.database
            .prepare(
                `
                INSERT INTO review_records (
                    id, request_id, candidate_id, reviewer_id, reviewer_name, result, note, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
            )
            .run(
                record.id,
                normalizedRequestId,
                record.candidateId,
                record.reviewerId,
                record.reviewerName,
                record.result,
                record.note,
                record.createdAt
            );
        return {
            record: rowToRecord(this.database.prepare('SELECT * FROM review_records WHERE id = ?').get(record.id)),
            summary: this.summary(normalizedCandidateId),
            created: true
        };
    }

    invalidateReview({ recordId, reviewer, reason }) {
        const record = this.database.prepare('SELECT * FROM review_records WHERE id = ?').get(recordId);
        if (!record) throw Object.assign(new Error('Review record not found'), { statusCode: 404 });
        if (record.invalidated_at) return { record: rowToRecord(record), summary: this.summary(record.candidate_id) };
        const normalizedReason = String(reason || '').trim();
        if (!normalizedReason) throw Object.assign(new Error('Invalidation reason is required'), { statusCode: 400 });
        this.database
            .prepare(
                `
                UPDATE review_records
                SET invalidated_at = ?, invalidated_by = ?, invalidation_reason = ?
                WHERE id = ?
            `
            )
            .run(nowIso(), reviewer.id, normalizedReason.slice(0, 1000), recordId);
        const updated = this.database.prepare('SELECT * FROM review_records WHERE id = ?').get(recordId);
        return { record: rowToRecord(updated), summary: this.summary(record.candidate_id) };
    }

    exportData() {
        const candidates = this.candidates({ activeOnly: false });
        const records = this.database
            .prepare('SELECT * FROM review_records ORDER BY created_at, id')
            .all()
            .map(rowToRecord);
        return {
            schemaVersion: 1,
            exportedAt: nowIso(),
            candidates,
            records
        };
    }

    close() {
        this.database.close();
    }
}

module.exports = { AudioReviewStore, summarizeRecords };
