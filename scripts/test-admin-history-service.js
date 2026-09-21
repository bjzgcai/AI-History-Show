'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAdminDraftService } = require('../manage/admin-draft-service');
const { createAdminHistoryService } = require('../manage/admin-history-service');

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-history-service-'));
const migrationRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-history-migration-'));

try {
    const eventRelativePath = 'archive/events/test-event/event.json';
    const addedRelativePath = 'archive/events/test-event/extra.json';
    const eventPath = path.join(temporaryRoot, eventRelativePath);
    const addedPath = path.join(temporaryRoot, addedRelativePath);
    const resourcePath = path.join(temporaryRoot, 'resources/images/test-event/retained.jpg');
    writeJson(eventPath, { id: 'test-event', title: { en: 'Initial', zh: '初始' } });
    fs.mkdirSync(path.dirname(resourcePath), { recursive: true });
    fs.writeFileSync(resourcePath, 'append-only-resource');

    const draftService = createAdminDraftService(temporaryRoot);
    const historyService = createAdminHistoryService(temporaryRoot);
    const initial = historyService.ensureInitialVersion();
    assert.equal(initial.action, 'initial');
    assert.equal(initial.fileCount, 1);
    assert.equal(fs.existsSync(path.join(historyService.versionRoot(initial.id), 'resources')), false);
    assert.equal(historyService.ensureCurrentVersion().created, false);
    assert.equal(historyService.listVersions().length, 1);
    assert.equal(fs.existsSync(path.join(temporaryRoot, '.admin-history', 'index.json')), true);
    assert.equal(fs.existsSync(path.join(temporaryRoot, '.tmp', 'admin-history')), false);

    writeJson(eventPath, { id: 'test-event', title: { en: 'External', zh: '外部变更' } });
    const externalVersion = historyService.ensureCurrentVersion();
    assert.equal(externalVersion.created, true);
    assert.equal(externalVersion.action, 'external');
    assert.equal(historyService.listVersions().length, 2);

    draftService.ensureInitialized();
    writeJson(path.join(draftService.workspaceRoot, eventRelativePath), {
        id: 'test-event',
        title: { en: 'Applied', zh: '已应用' }
    });
    writeJson(path.join(draftService.workspaceRoot, addedRelativePath), { id: 'extra', enabled: true });
    draftService.noteFileChanged(eventRelativePath);
    draftService.noteFileChanged(addedRelativePath);
    draftService.decideAll('kept');
    const applied = draftService.apply();
    const appliedVersion = historyService.createVersion({
        action: 'apply',
        note: '测试应用',
        changedFiles: applied.changedFiles,
        changePoints: applied.changePoints
    });
    assert.equal(readJson(eventPath).title.zh, '已应用');
    assert.equal(fs.existsSync(addedPath), true);
    assert.equal(historyService.listVersions().length, 3);
    assert.equal(appliedVersion.changeCount, 2);
    assert.equal(appliedVersion.changePointCount, 3);
    assert.ok(appliedVersion.changePoints.some((change) => change.summary === 'test-event：修改 zh'));

    const rollback = historyService.createRollbackDraft(initial.id, draftService);
    assert.equal(rollback.draft.origin.type, 'rollback');
    assert.equal(rollback.draft.origin.versionId, initial.id);
    assert.equal(rollback.draft.summary.active, 3);
    assert.equal(readJson(eventPath).title.zh, '已应用');
    assert.equal(fs.existsSync(addedPath), true);
    assert.equal(fs.existsSync(resourcePath), true);
    assert.throws(
        () => historyService.createRollbackDraft(appliedVersion.id, draftService),
        /当前存在待处理 Admin 草稿/
    );

    draftService.decideAll('kept');
    const rollbackApply = draftService.apply();
    const rollbackVersion = historyService.createVersion({
        action: 'rollback',
        note: `回滚到历史版本 ${initial.id}`,
        rollbackFromVersionId: initial.id,
        changedFiles: rollbackApply.changedFiles,
        changePoints: rollbackApply.changePoints
    });
    assert.equal(readJson(eventPath).title.zh, '初始');
    assert.equal(fs.existsSync(addedPath), false);
    assert.equal(fs.existsSync(resourcePath), true);
    assert.equal(rollbackVersion.action, 'rollback');
    assert.equal(rollbackVersion.rollbackFromVersionId, initial.id);
    assert.equal(rollbackVersion.rollbackExact, true);
    assert.equal(rollbackVersion.changePointCount, 3);
    assert.equal(historyService.listVersions()[0].id, rollbackVersion.id);

    const partialRollback = historyService.createRollbackDraft(appliedVersion.id, draftService);
    draftService.decide(partialRollback.draft.active[0].id, 'discarded');
    draftService.decideAll('kept');
    const partialApply = draftService.apply();
    const partialVersion = historyService.createVersion({
        action: 'rollback',
        rollbackFromVersionId: appliedVersion.id,
        changedFiles: partialApply.changedFiles,
        changePoints: partialApply.changePoints
    });
    assert.equal(partialVersion.rollbackExact, false);
    assert.match(partialVersion.note, /部分回滚/);
    assert.equal(fs.existsSync(resourcePath), true);
    assert.throws(() => historyService.getVersion('../invalid'), /Invalid history version id/);

    writeJson(path.join(migrationRoot, eventRelativePath), {
        id: 'test-event',
        title: { en: 'Migration', zh: '迁移' }
    });
    const migrationService = createAdminHistoryService(migrationRoot);
    const migrationInitial = migrationService.ensureInitialVersion();
    fs.mkdirSync(path.join(migrationRoot, '.tmp'), { recursive: true });
    fs.renameSync(path.join(migrationRoot, '.admin-history'), path.join(migrationRoot, '.tmp', 'admin-history'));
    const migratedService = createAdminHistoryService(migrationRoot);
    assert.equal(migratedService.ensureCurrentVersion().id, migrationInitial.id);
    assert.equal(fs.existsSync(path.join(migrationRoot, '.admin-history', 'index.json')), true);
    assert.equal(fs.existsSync(path.join(migrationRoot, '.tmp', 'admin-history')), false);

    console.log('PASS Admin history snapshots and rollback drafts');
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    fs.rmSync(migrationRoot, { recursive: true, force: true });
}
