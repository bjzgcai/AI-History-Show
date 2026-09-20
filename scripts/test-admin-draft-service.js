'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAdminDraftService } = require('../manage/admin-draft-service');

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findChange(status, operation, value) {
    return status.active.find((change) => change.operation === operation && change.value === value);
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-draft-service-'));

try {
    const relativePath = 'archive/events/test-event/assets.json';
    const formalPath = path.join(temporaryRoot, relativePath);
    const deletedRelativePath = 'archive/events/test-event/variants/temporary.json';
    const deletedFormalPath = path.join(temporaryRoot, deletedRelativePath);
    const storylineRelativePath = 'archive/storylines/test-storyline.json';
    const storylineFormalPath = path.join(temporaryRoot, storylineRelativePath);
    const missingOrderStorylineRelativePath = 'archive/storylines/missing-order-storyline.json';
    const missingOrderStorylineFormalPath = path.join(temporaryRoot, missingOrderStorylineRelativePath);
    const baseline = [
        { id: 'asset-a', figureIds: ['person-a', 'person-b', 'person-c'] },
        { id: 'asset-b', figureIds: [] }
    ];
    writeJson(formalPath, baseline);
    writeJson(deletedFormalPath, { id: 'temporary', title: { en: 'Temporary', zh: '临时' } });
    writeJson(storylineFormalPath, {
        id: 'test-storyline',
        events: [
            { eventId: 'event-a', order: 10 },
            { eventId: 'event-b', order: 20 }
        ]
    });
    writeJson(missingOrderStorylineFormalPath, {
        id: 'missing-order-storyline',
        events: [{ eventId: 'event-a' }, { eventId: 'event-b', order: 20 }]
    });
    fs.mkdirSync(path.join(temporaryRoot, 'resources'), { recursive: true });

    const service = createAdminDraftService(temporaryRoot);
    service.ensureInitialized();
    const workspacePath = path.join(service.workspaceRoot, relativePath);
    const changed = readJson(workspacePath);
    changed[0].figureIds = ['person-c', 'person-d', 'person-a'];
    changed[1].figureIds = ['person-e', 'person-f'];
    writeJson(workspacePath, changed);
    service.noteFileChanged(relativePath);

    let status = service.status();
    const initialFingerprint = status.fingerprint;
    assert.equal(status.summary.active, 5);
    assert.match(initialFingerprint, /^[a-f0-9]{64}$/);
    assert.equal(new Set(status.active.map((change) => change.id)).size, 5);
    assert.match(findChange(status, 'add-value', 'person-d').summary, /test-event \/ asset-a：关联人物 person-d/);
    assert.match(
        findChange(status, 'remove-value', 'person-b').summary,
        /test-event \/ asset-a：解除人物关联 person-b/
    );
    assert.equal(status.active.filter((change) => change.operation === 'reorder').length, 1);

    service.decide(findChange(status, 'add-value', 'person-d').id, 'discarded');
    assert.deepEqual(readJson(workspacePath)[0].figureIds, ['person-c', 'person-a']);
    assert.notEqual(service.status().fingerprint, initialFingerprint);

    status = service.status();
    const reorderChange = status.active.find((change) => change.operation === 'reorder');
    service.decide(reorderChange.id, 'discarded');
    assert.deepEqual(readJson(workspacePath)[0].figureIds, ['person-a', 'person-c']);

    status = service.status();
    service.decide(findChange(status, 'remove-value', 'person-b').id, 'discarded');
    assert.deepEqual(readJson(workspacePath)[0].figureIds, baseline[0].figureIds);

    status = service.status();
    service.decide(findChange(status, 'add-value', 'person-e').id, 'discarded');
    status = service.status();
    service.decide(findChange(status, 'add-value', 'person-f').id, 'discarded');
    assert.deepEqual(readJson(workspacePath), baseline);
    assert.equal(service.status().summary.active, 0);
    assert.equal(service.status().summary.discarded, 5);
    assert.deepEqual(readJson(formalPath), baseline);

    service.ensureInitialized();
    fs.rmSync(path.join(service.workspaceRoot, deletedRelativePath));
    service.noteFileChanged(deletedRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].operation, 'replace');
    service.decide(status.active[0].id, 'discarded');
    assert.deepEqual(readJson(path.join(service.workspaceRoot, deletedRelativePath)), {
        id: 'temporary',
        title: { en: 'Temporary', zh: '临时' }
    });
    assert.equal(fs.existsSync(deletedFormalPath), true);

    service.ensureInitialized();
    fs.rmSync(path.join(service.workspaceRoot, deletedRelativePath));
    service.noteFileChanged(deletedRelativePath);
    status = service.status();
    service.decide(status.active[0].id, 'kept');
    service.apply();
    assert.equal(fs.existsSync(deletedFormalPath), false);

    const addedJsonRelativePath = 'archive/events/test-event/variants/added.json';
    service.ensureInitialized();
    writeJson(path.join(service.workspaceRoot, addedJsonRelativePath), {
        id: 'added',
        title: { en: 'Added', zh: '新增' }
    });
    service.noteFileChanged(addedJsonRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    service.decide(status.active[0].id, 'discarded');
    assert.equal(fs.existsSync(path.join(service.workspaceRoot, addedJsonRelativePath)), false);
    assert.equal(fs.existsSync(path.join(temporaryRoot, addedJsonRelativePath)), false);

    service.ensureInitialized();
    const storylineWorkspacePath = path.join(service.workspaceRoot, storylineRelativePath);
    writeJson(storylineWorkspacePath, {
        id: 'test-storyline',
        events: [
            { eventId: 'event-new', order: 10 },
            { eventId: 'event-a', order: 20 },
            { eventId: 'event-b', order: 30 }
        ]
    });
    service.noteFileChanged(storylineRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].operation, 'add-item');
    assert.match(status.active[0].summary, /添加事件到故事线 event-new/);
    assert.doesNotMatch(status.active[0].summary, /order/);
    const pendingStorylineFingerprint = status.fingerprint;
    service.decideAll('kept');
    assert.notEqual(service.status().fingerprint, pendingStorylineFingerprint);
    service.decideAll('discarded');
    assert.deepEqual(readJson(storylineFormalPath), {
        id: 'test-storyline',
        events: [
            { eventId: 'event-a', order: 10 },
            { eventId: 'event-b', order: 20 }
        ]
    });

    service.ensureInitialized();
    writeJson(storylineWorkspacePath, {
        id: 'test-storyline',
        events: [
            { eventId: 'event-new', order: 10 },
            { eventId: 'event-a', order: 20 },
            { eventId: 'event-b', order: 30 }
        ]
    });
    service.noteFileChanged(storylineRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].operation, 'add-item');
    service.decide(status.active[0].id, 'discarded');
    assert.equal(service.status().summary.active, 0);
    assert.deepEqual(readJson(storylineWorkspacePath), readJson(storylineFormalPath));

    service.ensureInitialized();
    writeJson(storylineWorkspacePath, {
        id: 'test-storyline',
        events: [{ eventId: 'event-b', order: 10 }]
    });
    service.noteFileChanged(storylineRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].operation, 'remove-item');
    assert.doesNotMatch(status.active.map((change) => change.summary).join('\n'), /order/);
    service.decide(status.active[0].id, 'discarded');
    assert.equal(service.status().summary.active, 0);
    assert.deepEqual(readJson(storylineWorkspacePath), readJson(storylineFormalPath));

    service.ensureInitialized();
    writeJson(storylineWorkspacePath, {
        id: 'test-storyline',
        events: [
            { eventId: 'event-new-a', order: 10 },
            { eventId: 'event-new-b', order: 20 },
            { eventId: 'event-a', order: 30 },
            { eventId: 'event-b', order: 40 }
        ]
    });
    service.noteFileChanged(storylineRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 2);
    assert.ok(status.active.every((change) => change.operation === 'add-item'));
    const firstAddedChange = status.active.find((change) => change.key === 'event-new-a');
    service.decide(firstAddedChange.id, 'discarded');
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].key, 'event-new-b');
    assert.doesNotMatch(status.active.map((change) => change.summary).join('\n'), /order/);
    service.decide(status.active[0].id, 'discarded');
    assert.equal(service.status().summary.active, 0);
    assert.deepEqual(readJson(storylineWorkspacePath), readJson(storylineFormalPath));

    service.ensureInitialized();
    writeJson(storylineWorkspacePath, {
        id: 'test-storyline',
        events: [
            { eventId: 'event-a', order: 99 },
            { eventId: 'event-b', order: 20 }
        ]
    });
    service.noteFileChanged(storylineRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].operation, 'replace');
    assert.match(status.active[0].summary, /修改 order/);
    service.decide(status.active[0].id, 'discarded');
    assert.equal(service.status().summary.active, 0);

    service.ensureInitialized();
    const missingOrderStorylineWorkspacePath = path.join(service.workspaceRoot, missingOrderStorylineRelativePath);
    writeJson(missingOrderStorylineWorkspacePath, {
        id: 'missing-order-storyline',
        events: [
            { eventId: 'event-new', order: 10 },
            { eventId: 'event-a', order: 20 },
            { eventId: 'event-b', order: 30 }
        ]
    });
    service.noteFileChanged(missingOrderStorylineRelativePath);
    status = service.status();
    assert.equal(status.summary.active, 1);
    assert.equal(status.active[0].operation, 'add-item');
    service.decide(status.active[0].id, 'discarded');
    assert.equal(service.status().summary.active, 0);
    assert.deepEqual(readJson(missingOrderStorylineWorkspacePath), readJson(missingOrderStorylineFormalPath));

    service.ensureInitialized();
    const assetsBeforeRoundTrip = fs.readFileSync(workspacePath, 'utf8');
    const roundTripAssets = readJson(workspacePath);
    roundTripAssets.push({
        id: 'asset-temporary',
        path: '',
        caption: {},
        figureIds: [],
        editable: true
    });
    writeJson(workspacePath, roundTripAssets);
    service.noteFileChanged(relativePath);
    assert.equal(service.status().summary.active, 1);

    roundTripAssets.pop();
    roundTripAssets[0] = Object.fromEntries(
        Object.entries(roundTripAssets[0])
            .reverse()
            .concat([['sourceUrl', '']])
    );
    writeJson(workspacePath, roundTripAssets);
    service.noteFileChanged(relativePath);
    assert.equal(service.status().summary.active, 0);
    assert.equal(service.hasDraft(), false);
    assert.equal(fs.readFileSync(formalPath, 'utf8'), assetsBeforeRoundTrip);

    service.ensureInitialized();
    const changedAssets = readJson(workspacePath);
    changedAssets[0].figureIds.push('person-new');
    changedAssets[0] = Object.fromEntries(
        Object.entries(changedAssets[0])
            .reverse()
            .concat([['sourceUrl', '']])
    );
    writeJson(workspacePath, changedAssets);
    service.noteFileChanged(relativePath);
    const normalizedChangedAssets = readJson(workspacePath);
    assert.equal(normalizedChangedAssets[0].sourceUrl, undefined);
    assert.deepEqual(Object.keys(normalizedChangedAssets[0]), Object.keys(baseline[0]));
    assert.equal(service.status().summary.active, 1);
    service.decideAll('discarded');
    assert.deepEqual(readJson(formalPath), baseline);

    console.log('PASS Admin draft semantic array changes');
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
