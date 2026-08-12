#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEZONE = 'Asia/Shanghai';
const COMMANDS = new Set(['daily', 'failed', 'summary', 'reviewer', 'event-history']);
const VALUE_OPTIONS = new Set([
    'candidate-id',
    'date',
    'days',
    'db',
    'event-id',
    'format',
    'from',
    'input',
    'locale',
    'output',
    'result',
    'reviewer',
    'storyline',
    'storyline-mode',
    'timezone',
    'to',
    'token-file',
    'url'
]);
const SCRIPT_PATH = fileURLToPath(import.meta.url);

function usage() {
    return `Usage:
  query-audio-reviews.mjs <command> [options]

Commands:
  daily          Daily review summary plus failure details
  failed         Failure records and review notes
  summary        Aggregate results for a date range
  reviewer       Results grouped by reviewer
  event-history  Full history for one event or candidate

Source options (choose one; otherwise environment/defaults are used):
  --url <base-url>          Audio review service base URL
  --input <export.json|->   Export JSON file or stdin
  --db <reviews.sqlite>     Read a local SQLite database
  --token-file <path>       Read the API token from a file

Date and filter options:
  --date <today|yesterday|YYYY-MM-DD>
  --from <YYYY-MM-DD>       First local calendar date, inclusive
  --to <YYYY-MM-DD>         Last local calendar date, inclusive
  --days <n>                Last n local calendar days, including today
  --timezone <IANA zone>    Default: Asia/Shanghai
  --storyline <scope-id>
  --reviewer <id-or-name>
  --locale <zh|en>
  --result <pass|fail>
  --still-failing           Keep failures whose candidate currently has no valid pass
  --include-invalidated     Include invalidated submissions in selected record totals
  --storyline-mode <primary|all-contexts>

Output options:
  --format <markdown|json|csv>
  --output <path>

event-history requires --event-id <id> or --candidate-id <id>.

Environment:
  AUDIO_REVIEW_BASE_URL, AUDIO_REVIEW_TOKEN, AUDIO_REVIEW_EXPORT,
  AUDIO_REVIEW_DB, AUDIO_REVIEW_TIMEZONE
`;
}

function fail(message) {
    throw new Error(message);
}

function parseArgs(argv) {
    const command = argv[0];
    if (!command || command === '--help' || command === '-h') return { help: true };
    if (!COMMANDS.has(command)) fail(`Unknown command: ${command}`);

    const options = { command };
    const booleanOptions = new Set(['still-failing', 'include-invalidated', 'help']);
    for (let index = 1; index < argv.length; index += 1) {
        const argument = argv[index];
        if (!argument.startsWith('--')) fail(`Unexpected argument: ${argument}`);
        const key = argument.slice(2);
        if (booleanOptions.has(key)) {
            options[toCamelCase(key)] = true;
            continue;
        }
        if (!VALUE_OPTIONS.has(key)) fail(`Unknown option: --${key}`);
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) fail(`Missing value for --${key}`);
        options[toCamelCase(key)] = value;
        index += 1;
    }
    return options;
}

function toCamelCase(value) {
    return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function validateTimeZone(timeZone) {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
        return timeZone;
    } catch {
        fail(`Invalid timezone: ${timeZone}`);
    }
}

function zonedParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    return Object.fromEntries(
        parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
    );
}

function parseCalendarDate(value, label = 'date') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) fail(`${label} must be YYYY-MM-DD`);
    const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    const check = new Date(Date.UTC(date.year, date.month - 1, date.day));
    if (
        check.getUTCFullYear() !== date.year ||
        check.getUTCMonth() + 1 !== date.month ||
        check.getUTCDate() !== date.day
    ) {
        fail(`Invalid ${label}: ${value}`);
    }
    return date;
}

function formatCalendarDate(date) {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function shiftCalendarDate(date, days) {
    const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate()
    };
}

function zonedDateTimeToUtc(date, timeZone) {
    const desired = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0);
    let timestamp = desired;
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const actual = zonedParts(new Date(timestamp), timeZone);
        const represented = Date.UTC(
            actual.year,
            actual.month - 1,
            actual.day,
            actual.hour,
            actual.minute,
            actual.second
        );
        const correction = desired - represented;
        timestamp += correction;
        if (correction === 0) break;
    }
    return new Date(timestamp);
}

function todayInZone(timeZone, now = new Date()) {
    const parts = zonedParts(now, timeZone);
    return { year: parts.year, month: parts.month, day: parts.day };
}

function resolveNamedDate(value, timeZone, now) {
    if (value === 'today') return todayInZone(timeZone, now);
    if (value === 'yesterday') return shiftCalendarDate(todayInZone(timeZone, now), -1);
    return parseCalendarDate(value);
}

function resolveDateRange(options, now = new Date()) {
    const timeZone = validateTimeZone(options.timezone || process.env.AUDIO_REVIEW_TIMEZONE || DEFAULT_TIMEZONE);
    let startDate;
    let endDate;

    if (options.date) {
        startDate = resolveNamedDate(options.date, timeZone, now);
        endDate = startDate;
    } else if (options.days) {
        const days = Number(options.days);
        if (!Number.isInteger(days) || days <= 0 || days > 3660) fail('--days must be an integer between 1 and 3660');
        endDate = todayInZone(timeZone, now);
        startDate = shiftCalendarDate(endDate, 1 - days);
    } else if (options.from || options.to) {
        if (!options.from || !options.to) fail('--from and --to must be used together');
        startDate = parseCalendarDate(options.from, 'from');
        endDate = parseCalendarDate(options.to, 'to');
        if (formatCalendarDate(startDate) > formatCalendarDate(endDate)) fail('--from must not be after --to');
    } else {
        startDate = todayInZone(timeZone, now);
        endDate = startDate;
    }

    const start = zonedDateTimeToUtc(startDate, timeZone);
    const endExclusive = zonedDateTimeToUtc(shiftCalendarDate(endDate, 1), timeZone);
    return {
        timeZone,
        start,
        endExclusive,
        startDate: formatCalendarDate(startDate),
        endDate: formatCalendarDate(endDate),
        label:
            formatCalendarDate(startDate) === formatCalendarDate(endDate)
                ? formatCalendarDate(startDate)
                : `${formatCalendarDate(startDate)} 至 ${formatCalendarDate(endDate)}`
    };
}

function inRange(value, range) {
    if (!value) return false;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp >= range.start.getTime() && timestamp < range.endExclusive.getTime();
}

async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
}

function normalizeExport(data) {
    if (!data || !Array.isArray(data.candidates) || !Array.isArray(data.records)) {
        fail('Review export must contain candidates[] and records[]');
    }
    return {
        schemaVersion: data.schemaVersion || 1,
        exportedAt: data.exportedAt || null,
        candidates: data.candidates,
        records: data.records
    };
}

async function loadJsonFile(filePath) {
    const raw = filePath === '-' ? await readStdin() : await fs.readFile(path.resolve(filePath), 'utf8');
    return normalizeExport(JSON.parse(raw));
}

async function loadFromApi(baseUrl, tokenFile) {
    const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');
    const endpoint = normalizedBase.endsWith('/api/reviews/export')
        ? normalizedBase
        : `${normalizedBase}/api/reviews/export`;
    const token = tokenFile
        ? (await fs.readFile(path.resolve(tokenFile), 'utf8')).trim()
        : String(process.env.AUDIO_REVIEW_TOKEN || '').trim();
    if (!token) fail('Set AUDIO_REVIEW_TOKEN or provide --token-file for API access');
    const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) fail(`Audio review API returned HTTP ${response.status}`);
    return normalizeExport(await response.json());
}

async function loadFromSqlite(databasePath) {
    const { DatabaseSync } = await import('node:sqlite');
    const database = new DatabaseSync(path.resolve(databasePath), { readOnly: true });
    try {
        const candidates = database
            .prepare('SELECT * FROM candidates ORDER BY scope_id, sequence_index, locale, candidate_id')
            .all()
            .map((row) => ({
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
            }));
        const records = database
            .prepare('SELECT * FROM review_records ORDER BY created_at, id')
            .all()
            .map((row) => ({
                id: row.id,
                candidateId: row.candidate_id,
                reviewer: { id: row.reviewer_id, name: row.reviewer_name },
                result: row.result,
                note: row.note,
                createdAt: row.created_at,
                invalidatedAt: row.invalidated_at,
                invalidatedBy: row.invalidated_by,
                invalidationReason: row.invalidation_reason
            }));
        return normalizeExport({ schemaVersion: 1, exportedAt: new Date().toISOString(), candidates, records });
    } finally {
        database.close();
    }
}

async function loadReviewExport(options) {
    const input = options.input || process.env.AUDIO_REVIEW_EXPORT;
    const databasePath = options.db || process.env.AUDIO_REVIEW_DB;
    const baseUrl = options.url || process.env.AUDIO_REVIEW_BASE_URL;
    if (input) return loadJsonFile(input);
    if (databasePath) return loadFromSqlite(databasePath);
    if (baseUrl) return loadFromApi(baseUrl, options.tokenFile);

    const localDatabases = [
        path.resolve('.tmp/audio-review/reviews.sqlite'),
        path.resolve('.tmp/audio-review-data/reviews.sqlite')
    ];
    for (const localDatabase of localDatabases) {
        try {
            await fs.access(localDatabase);
            return loadFromSqlite(localDatabase);
        } catch {
            // Try the next conventional local database location.
        }
    }
    fail(
        'No review source found. Set AUDIO_REVIEW_BASE_URL, AUDIO_REVIEW_EXPORT, AUDIO_REVIEW_DB, or use --url/--input/--db'
    );
}

function candidateTitle(candidate) {
    return candidate?.title?.zh || candidate?.title?.en || candidate?.eventId || candidate?.candidateId || '未知事件';
}

function candidateStorylines(candidate, mode = 'primary') {
    if (!candidate) return ['unknown'];
    if (mode === 'all-contexts') {
        const values = [...new Set((candidate.contexts || []).map((context) => context.scopeId).filter(Boolean))];
        if (values.length) return values;
    }
    return [candidate.scopeId || 'unknown'];
}

function currentCandidateStatus(candidateId, allRecords) {
    const records = allRecords.filter((record) => record.candidateId === candidateId && !record.invalidatedAt);
    const passCount = records.filter((record) => record.result === 'pass').length;
    const failCount = records.filter((record) => record.result === 'fail').length;
    return {
        status: passCount > 0 ? 'pass' : failCount > 0 ? 'revise' : 'pending',
        approved: passCount > 0,
        passCount,
        failCount
    };
}

function textMatches(value, query) {
    return String(value || '')
        .toLocaleLowerCase()
        .includes(String(query || '').toLocaleLowerCase());
}

function recordMatchesFilters(record, candidate, options) {
    if (!candidate) return false;
    if (options.locale && candidate.locale !== options.locale) return false;
    if (options.result && record.result !== options.result) return false;
    if (
        options.reviewer &&
        !textMatches(record.reviewer?.id, options.reviewer) &&
        !textMatches(record.reviewer?.name, options.reviewer)
    ) {
        return false;
    }
    if (options.storyline) {
        const storylines = candidateStorylines(candidate, options.storylineMode);
        if (!storylines.includes(options.storyline)) return false;
    }
    return true;
}

function buildContext(data, options, now) {
    const range = resolveDateRange(options, now);
    const candidatesById = new Map(data.candidates.map((candidate) => [candidate.candidateId, candidate]));
    let submissions = data.records.filter((record) => {
        const candidate = candidatesById.get(record.candidateId);
        return inRange(record.createdAt, range) && recordMatchesFilters(record, candidate, options);
    });
    if (options.stillFailing) {
        submissions = submissions.filter(
            (record) => record.result === 'fail' && !currentCandidateStatus(record.candidateId, data.records).approved
        );
    }
    const validSubmissions = submissions.filter((record) => !record.invalidatedAt);
    const selectedRecords = options.includeInvalidated ? submissions : validSubmissions;
    const invalidationsInRange = data.records.filter((record) => {
        const candidate = candidatesById.get(record.candidateId);
        return inRange(record.invalidatedAt, range) && recordMatchesFilters(record, candidate, options);
    });
    return {
        data,
        options,
        range,
        candidatesById,
        submissions,
        validSubmissions,
        selectedRecords,
        invalidationsInRange
    };
}

function groupRecords(records, context, dimension) {
    const groups = new Map();
    for (const record of records) {
        const candidate = context.candidatesById.get(record.candidateId);
        const keys =
            dimension === 'storyline'
                ? candidateStorylines(candidate, context.options.storylineMode)
                : [`${record.reviewer?.id || 'unknown'}\0${record.reviewer?.name || '未知审核人'}`];
        for (const key of keys) {
            const item = groups.get(key) || {
                key,
                label: dimension === 'reviewer' ? key.split('\0')[1] : key,
                reviewerId: dimension === 'reviewer' ? key.split('\0')[0] : undefined,
                total: 0,
                pass: 0,
                fail: 0,
                invalidated: 0,
                candidateIds: new Set(),
                eventIds: new Set(),
                latestAt: null
            };
            item.total += 1;
            if (record.invalidatedAt) item.invalidated += 1;
            else item[record.result] += 1;
            item.candidateIds.add(record.candidateId);
            if (candidate?.eventId) item.eventIds.add(candidate.eventId);
            if (!item.latestAt || record.createdAt > item.latestAt) item.latestAt = record.createdAt;
            groups.set(key, item);
        }
    }
    return [...groups.values()]
        .map((item) => ({
            key: item.key,
            label: item.label,
            reviewerId: item.reviewerId,
            total: item.total,
            pass: item.pass,
            fail: item.fail,
            invalidated: item.invalidated,
            candidateCount: item.candidateIds.size,
            eventCount: item.eventIds.size,
            latestAt: item.latestAt
        }))
        .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label));
}

function failureDetails(context) {
    return context.selectedRecords
        .filter((record) => record.result === 'fail')
        .filter((record) => {
            if (!context.options.stillFailing) return true;
            return !currentCandidateStatus(record.candidateId, context.data.records).approved;
        })
        .map((record) => {
            const candidate = context.candidatesById.get(record.candidateId);
            return {
                recordId: record.id,
                eventId: candidate.eventId,
                title: candidateTitle(candidate),
                candidateId: candidate.candidateId,
                revisionId: candidate.revisionId,
                locale: candidate.locale,
                mode: candidate.mode,
                storylines: candidateStorylines(candidate, context.options.storylineMode),
                reviewer: record.reviewer,
                reviewedAt: record.createdAt,
                note: record.note || '',
                invalidatedAt: record.invalidatedAt || null,
                invalidationReason: record.invalidationReason || null,
                currentReview: currentCandidateStatus(record.candidateId, context.data.records)
            };
        })
        .sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt));
}

function buildSummary(context, includeFailures = false) {
    const effective = context.selectedRecords;
    const candidateIds = new Set(effective.map((record) => record.candidateId));
    const eventIds = new Set(
        effective.map((record) => context.candidatesById.get(record.candidateId)?.eventId).filter(Boolean)
    );
    const reviewerIds = new Set(effective.map((record) => record.reviewer?.id).filter(Boolean));
    const result = {
        reportType: context.options.command,
        generatedAt: new Date().toISOString(),
        range: {
            label: context.range.label,
            timezone: context.range.timeZone,
            start: context.range.start.toISOString(),
            endExclusive: context.range.endExclusive.toISOString()
        },
        filters: {
            storyline: context.options.storyline || null,
            reviewer: context.options.reviewer || null,
            locale: context.options.locale || null,
            result: context.options.result || null,
            includeInvalidated: Boolean(context.options.includeInvalidated),
            stillFailing: Boolean(context.options.stillFailing),
            storylineMode: context.options.storylineMode
        },
        totals: {
            submissions: context.submissions.length,
            effectiveRecords: context.validSubmissions.length,
            selectedRecords: effective.length,
            pass: effective.filter((record) => !record.invalidatedAt && record.result === 'pass').length,
            fail: effective.filter((record) => !record.invalidatedAt && record.result === 'fail').length,
            invalidatedSubmissions: context.submissions.filter((record) => record.invalidatedAt).length,
            invalidationsInRange: context.invalidationsInRange.length,
            candidateCount: candidateIds.size,
            eventCount: eventIds.size,
            reviewerCount: reviewerIds.size
        },
        byStoryline: groupRecords(effective, context, 'storyline'),
        byReviewer: groupRecords(effective, context, 'reviewer')
    };
    if (includeFailures) result.failures = failureDetails(context);
    return result;
}

function buildEventHistory(context) {
    const eventId = context.options.eventId;
    const candidateId = context.options.candidateId;
    if (!eventId && !candidateId) fail('event-history requires --event-id or --candidate-id');
    const candidates = context.data.candidates.filter(
        (candidate) =>
            (!eventId || candidate.eventId === eventId) && (!candidateId || candidate.candidateId === candidateId)
    );
    if (!candidates.length) fail('No matching event or candidate found');
    const candidateIds = new Set(candidates.map((candidate) => candidate.candidateId));
    const records = context.data.records
        .filter((record) => candidateIds.has(record.candidateId))
        .filter((record) => {
            const candidate = context.candidatesById.get(record.candidateId);
            return recordMatchesFilters(record, candidate, context.options);
        })
        .map((record) => {
            const candidate = context.candidatesById.get(record.candidateId);
            return {
                ...record,
                eventId: candidate.eventId,
                title: candidateTitle(candidate),
                revisionId: candidate.revisionId,
                locale: candidate.locale,
                storylines: candidateStorylines(candidate, context.options.storylineMode),
                currentReview: currentCandidateStatus(record.candidateId, context.data.records)
            };
        })
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    return {
        reportType: 'event-history',
        generatedAt: new Date().toISOString(),
        eventId: eventId || null,
        candidateId: candidateId || null,
        candidates: candidates.map((candidate) => ({
            ...candidate,
            currentReview: currentCandidateStatus(candidate.candidateId, context.data.records)
        })),
        records
    };
}

function markdownTable(headers, rows) {
    if (!rows.length) return '无';
    const escape = (value) =>
        String(value ?? '')
            .replaceAll('|', '\\|')
            .replaceAll('\n', ' ');
    return [
        `| ${headers.map(escape).join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`)
    ].join('\n');
}

function statusLabel(status) {
    return { pass: '已通过', revise: '仍未通过', pending: '未审核' }[status] || status;
}

function renderSummaryMarkdown(report) {
    const title =
        report.reportType === 'daily'
            ? '音频审核日报'
            : report.reportType === 'failed'
              ? '审核不通过信息'
              : '音频审核统计';
    const totals = report.totals;
    const sections = [
        `# ${title}`,
        '',
        `日期：${report.range.label}（${report.range.timezone}）`,
        '',
        `新增提交：${totals.submissions}；有效记录：${totals.effectiveRecords}；通过：${totals.pass}；不通过：${totals.fail}；涉及事件：${totals.eventCount}；审核人：${totals.reviewerCount}`,
        '',
        `已撤销的当期提交：${totals.invalidatedSubmissions}；当期发生的撤销：${totals.invalidationsInRange}`,
        '',
        '## 按故事线',
        '',
        markdownTable(
            ['故事线', '通过', '不通过', '已撤销', '总计', '事件数'],
            report.byStoryline.map((item) => [
                item.label,
                item.pass,
                item.fail,
                item.invalidated,
                item.total,
                item.eventCount
            ])
        ),
        '',
        '## 按审核人',
        '',
        markdownTable(
            ['审核人', '通过', '不通过', '已撤销', '总计', '事件数', '最近审核'],
            report.byReviewer.map((item) => [
                item.label,
                item.pass,
                item.fail,
                item.invalidated,
                item.total,
                item.eventCount,
                item.latestAt || ''
            ])
        )
    ];
    if (report.failures) {
        sections.push('', '## 不通过详情', '');
        if (!report.failures.length) sections.push('无');
        else {
            report.failures.forEach((failure, index) => {
                sections.push(
                    `${index + 1}. ${failure.title}（${failure.eventId}）`,
                    `   故事线：${failure.storylines.join('、')}；语言：${failure.locale}；审核人：${failure.reviewer.name}`,
                    `   审核时间：${failure.reviewedAt}；当前状态：${statusLabel(failure.currentReview.status)}`,
                    `   备注：${failure.note || '（无备注）'}`
                );
            });
        }
    }
    if (report.filters.storylineMode === 'all-contexts') {
        sections.push('', '> 共享候选按全部关联故事线重复计入分组，因此故事线分组合计可能大于全局总数。');
    }
    return `${sections.join('\n')}\n`;
}

function renderEventHistoryMarkdown(report) {
    const lines = ['# 音频审核历史', ''];
    for (const candidate of report.candidates) {
        lines.push(
            `## ${candidateTitle(candidate)}（${candidate.eventId}）`,
            '',
            `候选：${candidate.candidateId}；revision：${candidate.revisionId}；语言：${candidate.locale}；当前状态：${statusLabel(candidate.currentReview.status)}`,
            ''
        );
        const records = report.records.filter((record) => record.candidateId === candidate.candidateId);
        if (!records.length) lines.push('无审核记录', '');
        else {
            for (const record of records) {
                lines.push(
                    `- ${record.createdAt} ${record.reviewer.name}：${record.result === 'pass' ? '通过' : '不通过'}${record.note ? `；${record.note}` : ''}${record.invalidatedAt ? `；已于 ${record.invalidatedAt} 撤销（${record.invalidationReason || '未填写原因'}）` : ''}`
                );
            }
            lines.push('');
        }
    }
    return `${lines.join('\n')}\n`;
}

function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCsv(report) {
    let headers;
    let rows;
    if (report.reportType === 'event-history') {
        headers = [
            'eventId',
            'title',
            'candidateId',
            'revisionId',
            'locale',
            'storylines',
            'reviewer',
            'result',
            'reviewedAt',
            'note',
            'invalidatedAt',
            'invalidationReason',
            'currentStatus'
        ];
        rows = report.records.map((record) => [
            record.eventId,
            record.title,
            record.candidateId,
            record.revisionId,
            record.locale,
            record.storylines.join('|'),
            record.reviewer.name,
            record.result,
            record.createdAt,
            record.note,
            record.invalidatedAt || '',
            record.invalidationReason || '',
            record.currentReview.status
        ]);
    } else if (report.failures) {
        headers = [
            'eventId',
            'title',
            'candidateId',
            'revisionId',
            'locale',
            'storylines',
            'reviewer',
            'reviewedAt',
            'note',
            'currentStatus'
        ];
        rows = report.failures.map((failure) => [
            failure.eventId,
            failure.title,
            failure.candidateId,
            failure.revisionId,
            failure.locale,
            failure.storylines.join('|'),
            failure.reviewer.name,
            failure.reviewedAt,
            failure.note,
            failure.currentReview.status
        ]);
    } else {
        headers = [
            'dimension',
            'key',
            'label',
            'pass',
            'fail',
            'invalidated',
            'total',
            'candidateCount',
            'eventCount',
            'latestAt'
        ];
        rows = [
            ...report.byStoryline.map((item) => [
                'storyline',
                item.key,
                item.label,
                item.pass,
                item.fail,
                item.invalidated,
                item.total,
                item.candidateCount,
                item.eventCount,
                item.latestAt || ''
            ]),
            ...report.byReviewer.map((item) => [
                'reviewer',
                item.key,
                item.label,
                item.pass,
                item.fail,
                item.invalidated,
                item.total,
                item.candidateCount,
                item.eventCount,
                item.latestAt || ''
            ])
        ];
    }
    return `${[headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function renderReport(report, format) {
    if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`;
    if (format === 'csv') return renderCsv(report);
    if (format !== 'markdown') fail(`Unsupported format: ${format}`);
    return report.reportType === 'event-history' ? renderEventHistoryMarkdown(report) : renderSummaryMarkdown(report);
}

function normalizeOptions(options) {
    const normalized = { ...options };
    normalized.timezone = options.timezone || process.env.AUDIO_REVIEW_TIMEZONE || DEFAULT_TIMEZONE;
    normalized.format = options.format || 'markdown';
    normalized.storylineMode = options.storylineMode || 'primary';
    if (!['primary', 'all-contexts'].includes(normalized.storylineMode)) {
        fail('--storyline-mode must be primary or all-contexts');
    }
    if (normalized.result && !['pass', 'fail'].includes(normalized.result)) fail('--result must be pass or fail');
    if (normalized.locale && !['zh', 'en'].includes(normalized.locale)) fail('--locale must be zh or en');
    if (normalized.stillFailing && normalized.command !== 'failed') {
        fail('--still-failing is only supported by the failed command');
    }
    return normalized;
}

export async function runQuery(rawOptions, dependencies = {}) {
    const options = normalizeOptions(rawOptions);
    if (options.command === 'failed') options.result = 'fail';
    const data = dependencies.data || (await loadReviewExport(options));
    const context = buildContext(data, options, dependencies.now || new Date());
    if (options.command === 'event-history') return buildEventHistory(context);
    const includeFailures = options.command === 'daily' || options.command === 'failed';
    return buildSummary(context, includeFailures);
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        process.stdout.write(usage());
        return;
    }
    const report = await runQuery(options);
    const rendered = renderReport(report, options.format || 'markdown');
    if (options.output) await fs.writeFile(path.resolve(options.output), rendered);
    else process.stdout.write(rendered);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });
}

export { buildContext, buildSummary, currentCandidateStatus, parseArgs, renderReport, resolveDateRange };
