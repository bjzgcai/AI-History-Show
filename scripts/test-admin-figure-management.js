#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createArchiveFigureService } = require('../manage/archive-figure-service');

const projectRoot = path.join(__dirname, '..');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-figure-admin-'));

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function figure(id, name, overrides = {}) {
    return {
        id,
        name,
        aliases: [],
        type: 'person',
        organizationIds: [],
        profileSources: [],
        review: {
            status: 'draft',
            reviewedAt: '2026-08-05',
            reviewer: 'test'
        },
        ...overrides
    };
}

try {
    fs.mkdirSync(path.join(temporaryRoot, 'archive'), { recursive: true });
    fs.cpSync(path.join(projectRoot, 'archive', 'schemas'), path.join(temporaryRoot, 'archive', 'schemas'), {
        recursive: true
    });
    writeJson(path.join(temporaryRoot, 'archive', 'figures', 'figures.json'), [
        figure('primary-person', { en: 'Primary Person', zh: '主要人物' })
    ]);
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'event.json'), {
        id: 'test-event',
        figures: [
            {
                figureId: 'primary-person',
                role: { en: 'Project lead', zh: '项目负责人' },
                primary: true,
                avatarAssetId: 'primary-portrait',
                avatarStyle: 'object-position: 50% 20%; transform: scale(1.1);'
            }
        ]
    });
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'), [
        {
            id: 'primary-portrait',
            type: 'image',
            path: 'resources/images/primary-person.jpg',
            role: 'portrait',
            caption: { en: 'Primary Person portrait', zh: '主要人物肖像' },
            sourceId: 'source-test',
            rights: {
                status: 'licensed',
                license: { en: 'Test license', zh: '测试许可' }
            },
            displayUsage: { en: 'Test usage', zh: '测试用途' },
            figureIds: ['primary-person']
        },
        {
            id: 'existing-unlinked-image',
            type: 'image',
            path: 'resources/images/existing-unlinked.jpg',
            role: 'historical',
            caption: { en: 'Existing unlinked image', zh: '已有未关联图片' },
            sourceId: 'source-test'
        },
        {
            id: 'second-existing-unlinked-image',
            type: 'image',
            path: 'resources/images/second-existing-unlinked.jpg',
            role: 'historical',
            caption: { en: 'Second existing unlinked image', zh: '第二张已有未关联图片' },
            sourceId: 'source-test'
        }
    ]);
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'sources.json'), [
        {
            id: 'source-test',
            type: 'web',
            label: { en: 'Test source', zh: '测试来源' },
            url: 'https://example.com/source'
        }
    ]);
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'variants', 'test.json'), {
        storylineId: 'test',
        eventId: 'test-event',
        figures: [
            {
                figureId: 'primary-person',
                role: { en: 'Variant lead', zh: '变体负责人' }
            }
        ]
    });
    writeJson(path.join(temporaryRoot, 'archive', 'storylines', 'test.json'), {
        id: 'test',
        title: { en: 'Test Storyline', zh: '测试故事线' },
        events: [
            {
                eventId: 'test-event',
                variant: 'test',
                order: 10,
                enabled: true,
                milestoneId: 'milestone-test-event'
            }
        ]
    });
    fs.mkdirSync(path.join(temporaryRoot, 'resources', 'images'), { recursive: true });
    fs.writeFileSync(path.join(temporaryRoot, 'resources', 'images', 'primary-person.jpg'), 'test');
    fs.writeFileSync(path.join(temporaryRoot, 'resources', 'images', 'existing-unlinked.jpg'), 'test');
    fs.writeFileSync(path.join(temporaryRoot, 'resources', 'images', 'second-existing-unlinked.jpg'), 'test');

    const service = createArchiveFigureService(temporaryRoot);
    const initialList = service.listFigures();
    assert.equal(initialList.length, 1);
    assert.equal(initialList[0].eventCount, 1);
    assert.equal(initialList[0].assetCount, 1);
    assert.equal(initialList[0].used, true);
    assert.equal(initialList[0].usageCount, 1);
    assert.equal(initialList[0].usedEventCount, 1);

    writeJson(path.join(temporaryRoot, 'archive', 'events', 'duplicate-asset-event', 'event.json'), {
        id: 'duplicate-asset-event',
        year: 2026,
        title: { en: 'Duplicate asset event', zh: '重复资产事件' }
    });
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'duplicate-asset-event', 'assets.json'), [
        {
            id: 'duplicate-primary-portrait',
            type: 'image',
            path: 'resources/images/primary-person.jpg',
            role: 'portrait',
            caption: { en: 'Primary Person portrait', zh: '主要人物肖像' },
            sourceId: 'source-test',
            rights: {
                status: 'licensed',
                license: { en: 'Test license', zh: '测试许可' }
            },
            displayUsage: { en: 'Test usage', zh: '测试用途' },
            figureIds: ['primary-person']
        }
    ]);
    const duplicateAssetList = service.listFigures();
    assert.equal(duplicateAssetList[0].assetCount, 1, 'figure list should count unique asset files by path');
    fs.rmSync(path.join(temporaryRoot, 'archive', 'events', 'duplicate-asset-event'), { recursive: true });

    const duplicateImagePath = 'resources/images/primary-person-copy.jpg';
    fs.copyFileSync(
        path.join(temporaryRoot, 'resources', 'images', 'primary-person.jpg'),
        path.join(temporaryRoot, duplicateImagePath)
    );
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'asset-merge-event', 'event.json'), {
        id: 'asset-merge-event',
        year: 2026,
        title: { en: 'Asset merge event', zh: '资产合并事件' }
    });
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'asset-merge-event', 'assets.json'), [
        {
            id: 'duplicate-path-portrait',
            type: 'image',
            path: duplicateImagePath,
            role: 'portrait',
            caption: { en: 'Duplicate portrait', zh: '重复肖像' },
            figureIds: ['primary-person']
        }
    ]);
    const assetMergePreview = service.previewFigureAssetMerge({
        figureId: 'primary-person',
        canonicalPath: 'resources/images/primary-person.jpg',
        duplicatePaths: [duplicateImagePath]
    });
    assert.equal(assetMergePreview.contentMatch, true);
    assert.equal(assetMergePreview.impact.assets, 1);
    assert.equal(assetMergePreview.impact.events, 1);
    assert.match(assetMergePreview.revision, /^[a-f0-9]{64}$/);
    const mergeAssetsFile = path.join(temporaryRoot, 'archive', 'events', 'asset-merge-event', 'assets.json');
    const changedAfterPreview = readJson(mergeAssetsFile);
    changedAfterPreview[0].caption.zh = '预览后更新的重复肖像';
    writeJson(mergeAssetsFile, changedAfterPreview);
    assert.throws(
        () =>
            service.mergeFigureAssets({
                figureId: 'primary-person',
                canonicalPath: 'resources/images/primary-person.jpg',
                duplicatePaths: [duplicateImagePath],
                expectedRevision: assetMergePreview.revision
            }),
        (error) => error.statusCode === 409,
        'asset merge should reject changes made after preview'
    );
    const refreshedAssetMergePreview = service.previewFigureAssetMerge({
        figureId: 'primary-person',
        canonicalPath: 'resources/images/primary-person.jpg',
        duplicatePaths: [duplicateImagePath]
    });
    const assetMergeResult = service.mergeFigureAssets({
        figureId: 'primary-person',
        canonicalPath: 'resources/images/primary-person.jpg',
        duplicatePaths: [duplicateImagePath],
        expectedRevision: refreshedAssetMergePreview.revision
    });
    assert.ok(assetMergeResult.changedFiles.includes('archive/events/asset-merge-event/assets.json'));
    assert.equal(readJson(mergeAssetsFile)[0].path, 'resources/images/primary-person.jpg');
    assert.ok(fs.existsSync(path.join(temporaryRoot, duplicateImagePath)), 'asset merge must not delete old files');
    fs.rmSync(path.join(temporaryRoot, 'archive', 'events', 'asset-merge-event'), { recursive: true });
    fs.rmSync(path.join(temporaryRoot, duplicateImagePath));

    const usage = service.getFigureUsage('primary-person');
    assert.deepEqual(usage.events, ['test-event']);
    assert.equal(usage.eventRelations.length, 1);
    assert.equal(usage.variantRelations.length, 1);
    assert.equal(usage.assets.length, 1);
    assert.equal(usage.eventDetails.length, 1);
    assert.equal(usage.eventDetails[0].eventId, 'test-event');
    assert.equal(usage.eventDetails[0].eventRelations.length, 1);
    assert.equal(usage.eventDetails[0].variantRelations.length, 1);
    assert.deepEqual(usage.eventDetails[0].displayTargets, [
        {
            storylineId: 'test',
            storylineTitle: { en: 'Test Storyline', zh: '测试故事线' },
            variant: 'test',
            milestoneId: 'milestone-test-event'
        }
    ]);
    assert.deepEqual(service.getEventDisplayTargets('test-event'), usage.eventDetails[0].displayTargets);
    const initialAsset = service.getFigureAssets('primary-person', 'test-event')[0];
    assert.equal(initialAsset.id, 'primary-portrait');
    assert.deepEqual(initialAsset.source.name, { en: 'Test source', zh: '测试来源' });
    assert.equal(initialAsset.source.url, 'https://example.com/source');
    assert.deepEqual(initialAsset.rights.usage, { en: 'Test usage', zh: '测试用途' });
    assert.equal(initialAsset.usedByRelations, true);
    assert.equal(initialAsset.relationUsages.length, 1);
    assert.equal(initialAsset.preferredAvatarStyle, 'object-position: 50% 20%; transform: scale(1.1);');
    assert.equal(initialAsset.isDefaultAvatar, false);
    assert.equal(initialAsset.canSetAsDefaultAvatar, true);
    assert.match(initialAsset.assetsRevision, /^[a-f0-9]{64}$/);
    assert.throws(
        () =>
            service.unlinkFigureAsset({
                figureId: 'primary-person',
                eventId: 'test-event',
                assetId: 'primary-portrait',
                expectedRevision: initialAsset.assetsRevision
            }),
        (error) => error.statusCode === 409 && /event avatar/i.test(error.message),
        'assets used by a figure relation avatar cannot be unlinked'
    );

    const avatarRevision = service.getRegistryRevision();
    const defaultAvatarResult = service.setDefaultAvatar({
        figureId: 'primary-person',
        eventId: 'test-event',
        assetId: 'primary-portrait',
        expectedRevision: avatarRevision
    });
    assert.match(defaultAvatarResult.revision, /^[a-f0-9]{64}$/);
    assert.equal(defaultAvatarResult.defaultAvatar.path, 'resources/images/primary-person.jpg');
    assert.equal(defaultAvatarResult.defaultAvatar.avatarStyle, initialAsset.preferredAvatarStyle);
    assert.equal(service.getFigureAssets('primary-person', 'test-event')[0].isDefaultAvatar, true);
    assert.throws(
        () =>
            service.unlinkFigureAsset({
                figureId: 'primary-person',
                eventId: 'test-event',
                assetId: 'primary-portrait',
                expectedRevision: initialAsset.assetsRevision
            }),
        (error) => error.statusCode === 409 && /current default avatar/i.test(error.message),
        'the current default avatar cannot be unlinked'
    );
    assert.throws(
        () =>
            service.setDefaultAvatar({
                figureId: 'primary-person',
                eventId: 'test-event',
                assetId: 'primary-portrait',
                expectedRevision: avatarRevision
            }),
        (error) => error.statusCode === 409,
        'stale avatar updates should be rejected'
    );

    const revision = service.getRegistryRevision();
    const createResult = service.saveFigure({
        figureId: 'second-person',
        create: true,
        expectedRevision: revision,
        data: figure('second-person', { en: 'Second Person', zh: '第二人物' })
    });
    assert.equal(createResult.created, true);
    assert.equal(service.getFigure('second-person').data.name.zh, '第二人物');
    const linkedAssetResult = service.linkFigureAsset({
        figureId: 'second-person',
        eventId: 'test-event',
        assetId: 'existing-unlinked-image'
    });
    assert.equal(linkedAssetResult.changed, true);
    assert.deepEqual(linkedAssetResult.asset.figureIds, ['second-person']);
    assert.equal(service.getFigureAssets('second-person', 'test-event').length, 1);
    assert.equal(
        service.linkFigureAsset({
            figureId: 'second-person',
            eventId: 'test-event',
            assetId: 'existing-unlinked-image',
            expectedRevision: linkedAssetResult.revision
        }).changed,
        false,
        'linking an already-associated image should be idempotent'
    );
    const staleAssetRevision = linkedAssetResult.revision;
    const assetsChangedAfterLoad = readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'));
    assetsChangedAfterLoad[2].caption.zh = '并发修改后的第二张图片';
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'), assetsChangedAfterLoad);
    assert.throws(
        () =>
            service.linkFigureAsset({
                figureId: 'second-person',
                eventId: 'test-event',
                assetId: 'second-existing-unlinked-image',
                expectedRevision: staleAssetRevision
            }),
        (error) => error.statusCode === 409,
        'linking should reject a stale assets revision'
    );
    assert.throws(
        () =>
            service.unlinkFigureAsset({
                figureId: 'second-person',
                associations: [
                    {
                        eventId: 'test-event',
                        assetId: 'existing-unlinked-image',
                        expectedRevision: staleAssetRevision
                    }
                ]
            }),
        (error) => error.statusCode === 409,
        'unlinking should reject a stale assets revision'
    );
    service.linkFigureAsset({
        figureId: 'second-person',
        eventId: 'test-event',
        assetId: 'second-existing-unlinked-image'
    });
    const secondPersonAssets = service.getFigureAssets('second-person', 'test-event');
    const unlinkResult = service.unlinkFigureAsset({
        figureId: 'second-person',
        associations: secondPersonAssets.map((asset) => ({
            eventId: asset.eventId,
            assetId: asset.id,
            expectedRevision: asset.assetsRevision
        }))
    });
    assert.equal(unlinkResult.changed, true);
    assert.equal(unlinkResult.unlinkedAssociations.length, 2);
    assert.equal(service.getFigureAssets('second-person', 'test-event').length, 0);
    const unlinkedAssets = readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'));
    assert.equal(unlinkedAssets.find((asset) => asset.id === 'existing-unlinked-image').figureIds, undefined);
    assert.equal(unlinkedAssets.find((asset) => asset.id === 'second-existing-unlinked-image').figureIds, undefined);
    assert.equal(
        service.unlinkFigureAsset({
            figureId: 'second-person',
            associations: secondPersonAssets.map((asset) => ({
                eventId: asset.eventId,
                assetId: asset.id,
                expectedRevision: unlinkResult.revisions[asset.eventId]
            }))
        }).changed,
        false,
        'unlinking an already-unlinked image should be idempotent'
    );
    service.linkFigureAsset({
        figureId: 'second-person',
        eventId: 'test-event',
        assetId: 'existing-unlinked-image'
    });
    assert.throws(
        () =>
            service.setDefaultAvatar({
                figureId: 'second-person',
                eventId: 'test-event',
                assetId: 'primary-portrait',
                expectedRevision: service.getRegistryRevision()
            }),
        (error) => error.statusCode === 404,
        'assets belonging to another figure cannot become the default avatar'
    );

    assert.throws(
        () =>
            service.saveFigure({
                figureId: 'second-person',
                expectedRevision: revision,
                data: figure('second-person', { en: 'Changed Person', zh: '修改人物' })
            }),
        (error) => error.statusCode === 409 && /changed since it was loaded/i.test(error.message),
        'stale registry revisions should be rejected'
    );

    fs.writeFileSync(path.join(temporaryRoot, 'resources', 'images', 'shared.jpg'), 'test');
    const avatar = {
        path: 'resources/images/shared.jpg',
        avatarStyle: 'transform: scale(1.2);',
        sourceName: { en: 'Test source', zh: '测试来源' },
        sourceUrl: 'https://example.com/avatar',
        rights: {
            status: 'test',
            license: { en: 'Test license', zh: '测试许可' },
            usage: { en: 'Test usage', zh: '测试用途' }
        }
    };
    const latestRevision = service.getRegistryRevision();
    service.saveFigure({
        figureId: 'primary-person',
        expectedRevision: latestRevision,
        data: figure('primary-person', { en: 'Primary Person', zh: '主要人物' }, { defaultAvatar: avatar })
    });
    assert.equal(
        service.listFigures().find((item) => item.id === 'primary-person').defaultAvatarStyle,
        avatar.avatarStyle
    );
    assert.throws(
        () =>
            service.saveFigure({
                figureId: 'second-person',
                expectedRevision: service.getRegistryRevision(),
                data: figure('second-person', { en: 'Second Person', zh: '第二人物' }, { defaultAvatar: avatar })
            }),
        /multiple people/,
        'different people should not share one default avatar through the admin service'
    );

    const audit = service.getAudit();
    assert.equal(audit.summary.figures, 2);
    assert.ok(audit.categories.some((category) => category.code === 'review-needed'));

    const eventBeforeMerge = readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'event.json'));
    eventBeforeMerge.figures.push({
        figureId: 'second-person',
        role: { en: 'Existing target role', zh: '目标身份已有角色' }
    });
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'event.json'), eventBeforeMerge);
    const variantBeforeMerge = readJson(
        path.join(temporaryRoot, 'archive', 'events', 'test-event', 'variants', 'test.json')
    );
    variantBeforeMerge.figures.push({
        figureId: 'second-person',
        role: { en: 'Existing variant role', zh: '目标身份已有变体角色' }
    });
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'variants', 'test.json'), variantBeforeMerge);
    const assetsBeforeMerge = readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'));
    assetsBeforeMerge[0].figureIds.push('second-person');
    writeJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'), assetsBeforeMerge);

    const mergePreview = service.previewFigureMerge('primary-person', 'second-person');
    assert.equal(mergePreview.impact.events, 1);
    assert.equal(mergePreview.impact.eventRelations, 1);
    assert.equal(mergePreview.impact.variantRelations, 1);
    assert.equal(mergePreview.impact.assets, 1);
    assert.throws(
        () =>
            service.mergeFigures({
                sourceFigureId: 'primary-person',
                targetFigureId: 'second-person',
                expectedRevision: revision
            }),
        (error) => error.statusCode === 409,
        'merge should reject a stale preview revision'
    );
    const mergeResult = service.mergeFigures({
        sourceFigureId: 'primary-person',
        targetFigureId: 'second-person',
        expectedRevision: mergePreview.revision
    });
    assert.ok(mergeResult.changedFiles.includes('archive/figures/figures.json'));
    assert.throws(
        () => service.getFigure('primary-person'),
        (error) => error.statusCode === 404
    );
    const mergedFigure = service.getFigure('second-person').data;
    assert.ok(mergedFigure.aliases.includes('primary-person'));
    assert.equal(mergedFigure.defaultAvatar.path, 'resources/images/shared.jpg');
    assert.equal(service.getFigureUsage('second-person').eventRelations.length, 1);
    assert.equal(service.getFigureUsage('second-person').variantRelations.length, 1);
    assert.equal(service.getFigureAssets('second-person', 'test-event').length, 2);
    const eventAfterMerge = readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'event.json'));
    assert.equal(eventAfterMerge.figures.length, 1);
    assert.equal(eventAfterMerge.figures[0].figureId, 'second-person');
    assert.equal(eventAfterMerge.figures[0].role.en, 'Existing target role');
    assert.deepEqual(
        readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json'))[0].figureIds,
        ['second-person']
    );

    const truncatedPng = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    assert.throws(
        () =>
            service.importFigureImage({
                figureId: 'second-person',
                eventId: 'test-event',
                assetId: 'asset-invalid-image',
                sourceId: 'source-test',
                imageBase64: Buffer.from('not-an-image').toString('base64'),
                caption: { en: 'Invalid image', zh: '无效图片' },
                rights: {
                    status: 'test',
                    license: { en: 'Test license', zh: '测试许可' },
                    usage: { en: 'Test usage', zh: '测试用途' }
                }
            }),
        /Unsupported or invalid image/
    );
    assert.throws(
        () =>
            service.importFigureImage({
                figureId: 'second-person',
                eventId: 'test-event',
                assetId: 'asset-truncated-image',
                sourceId: 'source-test',
                imageBase64: truncatedPng.toString('base64'),
                caption: { en: 'Truncated image', zh: '截断图片' },
                rights: {
                    status: 'test',
                    license: { en: 'Test license', zh: '测试许可' },
                    usage: { en: 'Test usage', zh: '测试用途' }
                }
            }),
        /PNG file is truncated/
    );
    const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64'
    );
    const assetsBeforeEventImageImport = readJson(
        path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json')
    );
    const eventImageResult = service.importEventImage({
        eventId: 'test-event',
        assetId: 'asset-test-event-imported-image',
        imageBase64: png.toString('base64')
    });
    assert.equal(eventImageResult.path, 'resources/images/test-event/asset-test-event-imported-image.png');
    assert.equal(eventImageResult.type, 'image');
    assert.equal(eventImageResult.mimeType, 'image/png');
    assert.ok(fs.existsSync(path.join(temporaryRoot, eventImageResult.path)));
    assert.deepEqual(
        readJson(path.join(temporaryRoot, 'archive', 'events', 'test-event', 'assets.json')),
        assetsBeforeEventImageImport,
        'event image import should only write the binary; the current admin draft owns assets.json'
    );
    const imageWithoutRights = service.importFigureImage({
        figureId: 'second-person',
        eventId: 'test-event',
        assetId: 'asset-test-event-secondary-second-person',
        sourceId: 'source-test',
        imageBase64: png.toString('base64'),
        caption: { en: 'Second Person alternate image', zh: '第二人物备用图片' }
    });
    assert.equal(imageWithoutRights.asset.rights.status, 'needs-source');
    assert.equal(imageWithoutRights.asset.rights.license, undefined);
    const imageResult = service.importFigureImage({
        figureId: 'second-person',
        eventId: 'test-event',
        assetId: 'asset-test-event-portrait-second-person',
        sourceId: 'source-test',
        imageBase64: png.toString('base64'),
        caption: { en: 'Second Person portrait', zh: '第二人物肖像' },
        subcaption: { en: 'Imported in the admin.', zh: '通过管理后台导入。' },
        sourceName: { en: 'Test source', zh: '测试来源' },
        sourceUrl: 'https://example.com/source',
        rights: {
            status: 'test',
            license: { en: 'Test license', zh: '测试许可' },
            usage: { en: 'Test usage', zh: '测试用途' }
        },
        setAsDefaultAvatar: true,
        expectedRevision: service.getRegistryRevision()
    });
    assert.equal(imageResult.asset.role, 'portrait');
    assert.ok(fs.existsSync(path.join(temporaryRoot, imageResult.asset.path)));
    assert.equal(service.getFigure('second-person').data.defaultAvatar.path, imageResult.asset.path);
    assert.equal(service.getFigureAssets('second-person', 'test-event').length, 4);

    const adminHtml = fs.readFileSync(path.join(projectRoot, 'manage', 'admin.html'), 'utf8');
    const adminCss = fs.readFileSync(path.join(projectRoot, 'manage', 'admin.css'), 'utf8');
    const adminJs = fs.readFileSync(path.join(projectRoot, 'manage', 'admin.js'), 'utf8');
    const adminServer = fs.readFileSync(path.join(projectRoot, 'manage', 'server.js'), 'utf8');
    const assetFormSource = adminJs.slice(
        adminJs.indexOf('function assetItemForm'),
        adminJs.indexOf('function quizItemForm')
    );
    const sourceFormSource = adminJs.slice(
        adminJs.indexOf('function sourceItemForm'),
        adminJs.indexOf('function assetItemForm')
    );
    const quizFormSource = adminJs.slice(
        adminJs.indexOf('function quizItemForm'),
        adminJs.indexOf('function nextCollectionId')
    );
    const presentationFormSource = adminJs.slice(
        adminJs.indexOf('function renderPresentationForm'),
        adminJs.indexOf('function collectionOptions')
    );
    const eventFormSource = adminJs.slice(
        adminJs.indexOf('function renderEventForm'),
        adminJs.indexOf('function presentationFieldPath')
    );
    const figureAssetCardsSource = adminJs.slice(
        adminJs.indexOf('function renderFigureAssetCards'),
        adminJs.indexOf('async function renderFigureAssets')
    );
    assert.match(adminHtml, /id="entityTypeNav"/);
    assert.match(adminHtml, /id="taskOutputPanel"[^>]*hidden/);
    assert.match(adminHtml, /id="closeTaskOutputBtn"/);
    assert.doesNotMatch(adminHtml, /id="saveValidateBtn"/);
    assert.doesNotMatch(adminHtml, /保存并验证|校验并保存/);
    assert.match(adminHtml, /id="saveBtn"[^>]*hidden[^>]*>保存<\/button>/);
    assert.doesNotMatch(adminHtml, />保存草稿<\/button>/);
    assert.match(adminHtml, /id="validateDraftBtn" hidden>校验改动<\/button>/);
    assert.match(adminHtml, /编辑操作会自动加入待处理草稿，不会直接修改正式 Json/);
    assert.match(adminHtml, /请到“发布管理”逐项保留或放弃，统一校验并应用/);
    assert.match(adminCss, /\.archive-workflow-note\s*\{/);
    assert.match(adminCss, /\.output-panel pre\s*\{[\s\S]*color:\s*#eef7f3/);
    assert.match(adminHtml, /data-entity-type="events"[^>]*>事件/);
    assert.match(adminHtml, /data-entity-type="storylines"[^>]*>故事线/);
    assert.match(adminHtml, /id="storylineEventSelect"/);
    assert.match(adminHtml, /id="storylineEventSelect"[^>]*required/);
    assert.match(adminHtml, /id="addStorylineEventBtn"[^>]*>添加/);
    assert.match(adminJs, /const memberIds = new Set\(memberships\.map\(\(membership\) => membership\.eventId\)\)/);
    assert.match(adminJs, /state\.eventOptions\.filter\(\(event\) => !memberIds\.has\(event\.id\)\)/);
    assert.match(adminJs, /state\.document\.events\.some\(\(membership\) => membership\.eventId === eventId\)/);
    assert.match(adminHtml, /data-entity-type="figures"[^>]*>人物 \/ 实体/);
    assert.match(adminHtml, /data-entity-type="audit"[^>]*hidden[^>]*>人物审计/);
    assert.match(adminHtml, /data-entity-type="publish"[^>]*>发布管理/);
    assert.ok(
        adminHtml.indexOf('data-entity-type="publish"') > adminHtml.indexOf('data-entity-type="figures"'),
        'publish management should be the last visible top-level tab'
    );
    assert.match(adminHtml, /id="publishPanel"[^>]*hidden/);
    assert.match(adminHtml, /id="publishChangesTab"[\s\S]*?>\s*当前变更/);
    assert.match(adminHtml, /id="publishHistoryTab"[\s\S]*?>\s*历史版本/);
    assert.match(adminHtml, /id="createRollbackDraftBtn"[\s\S]*?>\s*创建回滚草稿/);
    assert.match(adminHtml, /回滚只恢复 Json，不删除图片、音视频或其他资料文件/);
    assert.match(adminHtml, /id="preparePublishBtn"[^>]*>一键准备发布/);
    assert.match(adminHtml, /id="generateTestPreviewBtn"[^>]*>生成测试预览/);
    assert.match(adminHtml, /id="openTestPreview"[^>]*href="\/test-preview\/"/);
    assert.match(adminHtml, /id="publishTestPreviewStatus"/);
    assert.match(adminHtml, /id="publishValidateBtn"[^>]*>校验保留变更/);
    assert.match(adminHtml, /id="publishApplyBtn"[^>]*>应用到 Json/);
    assert.match(adminHtml, /id="publishSavedValidateBtn"[^>]*>校验正式 Json/);
    assert.match(adminHtml, /id="keepAllDraftsBtn"[^>]*>全部保留/);
    assert.match(adminHtml, /id="discardAllDraftsBtn"[^>]*>全部放弃/);
    assert.match(adminHtml, /id="publishGenerateBtn"[^>]*>生成数据/);
    assert.match(adminHtml, /id="publishBuildBtn"[^>]*>构建发布包/);
    assert.match(adminCss, /\.entity-type-nav\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,/);
    assert.doesNotMatch(adminHtml, /id="auditBtn"/);
    assert.match(adminHtml, /id="entityType" hidden/);
    assert.match(adminHtml, /id="refreshBtn"[^>]*sidebar-refresh-button[^>]*title="刷新列表"/);
    assert.doesNotMatch(adminHtml, /class="sidebar-tools"/);
    assert.ok(
        adminHtml.indexOf('id="newFigureBtn"') < adminHtml.indexOf('id="entitySearch"'),
        'new figure action should appear above search in the sidebar'
    );
    assert.match(adminJs, /function syncEntityTypeNavigation/);
    assert.match(adminJs, /function loadPublishStatus/);
    assert.match(adminJs, /api\/archive\/publish-status/);
    assert.match(adminJs, /api\/archive\/prepare-publish/);
    assert.match(adminJs, /api\/archive\/test-preview/);
    assert.match(adminJs, /api\/archive\/history/);
    assert.match(adminJs, /api\/archive\/history-restore/);
    assert.match(adminJs, /window\.open\('about:blank', '_blank'\)/);
    assert.match(adminServer, /GET \/api\/archive\/publish-status/);
    assert.match(adminServer, /POST \/api\/archive\/prepare-publish/);
    assert.match(adminServer, /POST \/api\/archive\/test-preview/);
    assert.match(adminServer, /GET \/api\/archive\/history/);
    assert.match(adminServer, /GET \/api\/archive\/history-version/);
    assert.match(adminServer, /POST \/api\/archive\/history-restore/);
    const historyListRoute = adminServer.slice(
        adminServer.indexOf("'GET /api/archive/history':"),
        adminServer.indexOf("'GET /api/archive/history-version':")
    );
    assert.doesNotMatch(historyListRoute, /ensureCurrentVersion/);
    assert.match(adminServer, /historyService\.ensureCurrentVersion\(\);/);
    assert.match(adminServer, /\/test-preview\//);
    assert.match(adminServer, /POST \/api\/archive\/draft-decision/);
    assert.match(adminServer, /POST \/api\/archive\/draft-validate/);
    assert.match(adminServer, /POST \/api\/archive\/draft-apply/);
    assert.match(adminServer, /runPublishSteps\(\['validate', 'generate', 'build'\]\)/);
    assert.match(adminJs, /const archiveTaskConfig =/);
    assert.match(adminJs, /function setTaskOutputVisible\(visible\)/);
    assert.match(adminJs, /elements\.taskOutputPanel\.hidden = !visible/);
    assert.match(adminJs, /elements\.validationOutput\.textContent = error\.message/);
    assert.match(adminJs, /function validateEntity\(\)/);
    assert.match(adminJs, /api\/archive\/validate-draft/);
    assert.match(adminJs, /正在校验当前编辑内容/);
    assert.match(adminJs, /当前编辑内容校验通过，尚未保存/);
    assert.doesNotMatch(adminJs, /api\/archive\/validate-and-save|saveValidateBtn/);
    assert.match(adminJs, /生成只读取已经保存的 Archive/);
    assert.doesNotMatch(adminJs, /if \(runValidation\) await runTask\('validate'\)/);
    assert.match(adminJs, /function syncTaskActionAvailability\(\)/);
    assert.match(adminJs, /elements\.validateBtn\.disabled = state\.taskRunning/);
    assert.match(
        adminJs,
        /elements\.validateDraftBtn\.disabled = state\.taskRunning \|\| state\.type === 'audit' \|\| !state\.document/
    );
    assert.match(adminJs, /elements\.validateDraftBtn\.addEventListener\('click'/);
    assert.match(adminJs, /elements\.validateBtn\.addEventListener\('click',[\s\S]*runTask\('validate'\)/);
    assert.match(adminJs, /function scheduleDraftSave/);
    assert.match(adminJs, /function flushDraftSave/);
    assert.match(adminJs, /elements\.saveBtn\.hidden = true/);
    assert.match(adminJs, /entityTypeNav\.addEventListener\('click'/);
    assert.match(adminJs, /elements\.entitySearch\.hidden = state\.type === 'audit'/);
    assert.match(adminJs, /function normalizeStorylineEventOrder/);
    assert.match(adminJs, /data-remove-storyline-event/);
    assert.match(adminJs, /elements\.addStorylineEventBtn\.addEventListener\('click', addStorylineEvent\)/);
    assert.match(adminCss, /\.entity-type-nav\s*\{[\s\S]*grid-template-columns:\s*repeat\(4/);
    assert.match(adminHtml, /id="figureSectionNav"/);
    assert.match(adminHtml, /data-figure-section="basic"[^>]*>基础信息/);
    assert.doesNotMatch(adminHtml, /data-figure-section="identity"/);
    assert.match(adminHtml, /data-figure-section="sources"[^>]*>资料来源（内部）/);
    assert.match(adminHtml, /data-figure-section="assets"[^>]*>图片资产/);
    assert.match(adminHtml, /data-figure-section="events"[^>]*>关联事件/);
    assert.match(adminHtml, /data-figure-section="review"[^>]*>审核信息（内部）/);
    assert.match(adminHtml, /data-figure-section="advanced"[^>]*>高级 JSON/);
    assert.match(adminHtml, /id="figureSectionTitle"/);
    assert.match(adminHtml, /id="figureSectionSummary"/);
    assert.match(adminHtml, /data-figure-section-panel="basic"/);
    assert.doesNotMatch(adminHtml, /data-figure-section-panel="identity"/);
    assert.match(adminHtml, /data-figure-section-panel="sources"/);
    assert.match(adminHtml, /data-figure-section-panel="assets"/);
    assert.match(adminHtml, /data-figure-section-panel="events"/);
    assert.match(adminHtml, /data-figure-section-panel="review"/);
    assert.match(
        adminHtml,
        /data-figure-section="events"[^>]*>关联事件<\/button>[\s\S]*data-figure-section="sources"[^>]*>资料来源（内部）<\/button>[\s\S]*data-figure-section="review"[^>]*>审核信息（内部）<\/button>/
    );
    assert.match(adminHtml, /展示字段/);
    assert.match(adminHtml, /<h3>默认头像<\/h3>/);
    assert.doesNotMatch(adminHtml, /<h3>图片信息<\/h3>/);
    assert.doesNotMatch(adminHtml, /id="defaultAvatarPathSummary"/);
    assert.doesNotMatch(adminHtml, /id="defaultAvatarSourceSummary"/);
    assert.doesNotMatch(adminHtml, /id="defaultAvatarRightsSummary"/);
    assert.match(adminHtml, /身份与检索/);
    assert.match(adminHtml, /id="figureIdentityDetails"[\s\S]*更多（内部资料）/);
    assert.match(adminHtml, /默认头像引用信息/);
    assert.match(adminHtml, /id="openDefaultAvatarAssetBtn"/);
    assert.match(
        adminHtml,
        /data-figure-section-panel="assets"[\s\S]*id="figureAssetGallery"[\s\S]*id="figureAvatarEditor"/
    );
    assert.match(adminHtml, /<details\s+id="figureAvatarEditor"[\s\S]*更多（内部资料）/);
    assert.doesNotMatch(adminHtml, /<details\s+id="figureAvatarEditor"[^>]*\sopen(?:\s|>)/);
    assert.match(adminHtml, /人物资料来源/);
    assert.match(adminHtml, /内部字段/);
    assert.match(adminHtml, /id="figureProfileSourcesList"/);
    assert.match(adminHtml, /id="addFigureProfileSourceBtn"/);
    assert.doesNotMatch(adminHtml, /Profile sources JSON 数组/);
    assert.doesNotMatch(adminHtml, /id="figureProfileSources"/);
    assert.match(adminHtml, /人物关系/);
    assert.doesNotMatch(adminHtml, /data-event-section="claims"/);
    assert.doesNotMatch(adminHtml, /reviewNotesEn/);
    assert.match(adminHtml, /选择文件展开完整原始 JSON/);
    assert.match(adminHtml, /id="advancedJsonFiles"/);
    assert.match(adminHtml, /id="advancedJsonEditorShell"/);
    assert.match(adminHtml, /id="structuredFieldHint"[^>]*file-link-button/);
    assert.match(adminHtml, /id="relationFileLink"[\s\S]*data-open-advanced-file="event.json"/);
    assert.match(adminHtml, /人物审计/);
    assert.doesNotMatch(adminHtml, /高级操作/);
    assert.doesNotMatch(adminHtml, /身份合并/);
    assert.doesNotMatch(adminHtml, /导入人物图片/);
    assert.doesNotMatch(adminHtml, /mergeTargetSelect/);
    assert.match(adminHtml, /人物资产/);
    assert.match(adminHtml, /id="openExistingFigureImageBtn"[^>]*>关联已有图片/);
    assert.match(adminHtml, /id="existingFigureImageDialog"/);
    assert.match(adminHtml, /id="existingImageEvent"/);
    assert.match(adminHtml, /id="existingImageAsset"/);
    assert.match(adminHtml, /id="linkExistingFigureImageBtn"/);
    assert.match(adminHtml, /id="openFigureImageUploadBtn"[^>]*>新增图片/);
    assert.match(adminHtml, /id="figureImageUploadDialog"/);
    assert.match(adminHtml, /id="imageImportFile"[^>]*type="file"/);
    assert.match(adminHtml, /id="imageImportUrl"[^>]*type="url"/);
    assert.match(adminHtml, /id="imageImportUrl"[^>]*type="url"/);
    assert.match(adminHtml, /图片 URL（自动拉取）/);
    assert.match(adminHtml, /上传后设为默认头像/);
    assert.match(adminHtml, /上传本地图片或填写图片 URL（二选一）/);
    assert.match(adminHtml, /class="required-mark"/);
    assert.match(adminHtml, /id="figureNameZh" required/);
    assert.match(adminHtml, /id="figureNameEn" required/);
    assert.doesNotMatch(adminHtml, /id="imageImportFile"[^>]*required/);
    assert.match(adminHtml, /id="imageImportCaptionZh" required/);
    assert.match(adminHtml, /id="imageImportCaptionEn" required/);
    assert.match(adminHtml, /id="imageImportEvent"[^>]*required/);
    assert.match(adminHtml, /id="imageImportSourceId"[^>]*required/);
    assert.doesNotMatch(adminHtml, /id="imageImportLicenseZh"[^>]*required/);
    assert.doesNotMatch(adminHtml, /id="imageImportAssetId"[^>]*required/);
    assert.doesNotMatch(adminHtml, /合并选中图片/);
    assert.match(adminHtml, /关联事件/);
    assert.match(adminHtml, /figureAssetGallery/);
    assert.match(adminHtml, /figureEventList/);
    assert.match(adminHtml, /figureAlphabet/);
    assert.match(adminHtml, /eventDisplayActions/);
    assert.match(adminHtml, /openEventDisplayBtn/);
    assert.doesNotMatch(adminHtml, /inspectEventPresentationBtn/);
    assert.doesNotMatch(adminHtml, /restorePresentationInheritanceBtn/);
    assert.doesNotMatch(adminHtml, /eventVariantSelect/);
    assert.doesNotMatch(adminHtml, /eventPresentationPanel/);
    assert.doesNotMatch(adminJs, /updateEventPresentationControls/);
    assert.doesNotMatch(adminJs, /function restorePresentationInheritance/);
    assert.doesNotMatch(adminJs, /storyline-timeline-variant/);
    assert.doesNotMatch(adminJs, /const sourceLabel = target\.hasOverride/);
    assert.match(adminHtml, /data-event-section="assets"[^>]*>\s*图片与音视频\s*<\/button>/);
    assert.doesNotMatch(adminHtml, />资产与音频<\/button>/);
    assert.match(adminHtml, /id="structuredAddBtn"[\s\S]*data-collection-action="add"[\s\S]*新增条目/);
    assert.doesNotMatch(adminHtml, /id="eventContext"/);
    assert.doesNotMatch(adminJs, /renderEventContext/);
    assert.doesNotMatch(adminJs, /eventContext(?:Year|Usage|Title|Summary)?/);
    assert.match(adminCss, /\.event-section-nav\s*\{[\s\S]*position:\s*sticky/);
    assert.match(adminCss, /\.event-section-nav\s*\{[\s\S]*background:\s*var\(--bg\)/);
    assert.match(adminCss, /\.toolbar\s*\{[\s\S]*background:\s*var\(--bg\)/);
    assert.match(adminCss, /\.toolbar\s*\{[\s\S]*top:\s*var\(--admin-header-sticky-height\)/);
    assert.match(adminJs, /--admin-header-sticky-height/);
    assert.match(adminJs, /function renderAdvancedJsonFiles/);
    assert.match(adminJs, /function openAdvancedJsonFile/);
    assert.match(adminJs, /data-advanced-json-file/);
    assert.match(adminJs, /structuredFieldHint\.dataset\.openAdvancedFile = state\.file/);
    assert.match(adminJs, /elements\.structuredFieldHint\.hidden = true/);
    assert.match(adminJs, /if \(item\.open\) \{[\s\S]*item\.open = false/);
    assert.match(adminJs, /item\.dataset\.advancedJsonFile === state\.file/);
    assert.match(adminJs, /api\/archive\/figure-assets/);
    assert.match(adminJs, /api\/archive\/figure-default-avatar/);
    assert.match(adminJs, /function showError/);
    assert.match(adminJs, /elements\.status\.textContent = ''/);
    assert.match(adminJs, /window\.alert\(message\)/);
    assert.doesNotMatch(adminJs, /setStatus\([\s\S]{0,160}?['"]bad['"]/);
    assert.match(adminJs, /groupFigureAssets/);
    assert.doesNotMatch(adminJs, /mergeSelectedFigureAssets/);
    assert.doesNotMatch(adminJs, /data-asset-merge-select/);
    assert.doesNotMatch(adminJs, /data-asset-merge-canonical/);
    assert.match(adminJs, /renderFigureAssetCards/);
    assert.match(adminJs, /function updateDefaultAvatarAssetLink/);
    assert.match(adminJs, /function openDefaultAvatarAsset/);
    assert.match(adminJs, /if \(!target\) elements\.figureAvatarEditor\.open = true/);
    assert.match(adminJs, /function replaceDefaultAvatar/);
    assert.match(adminJs, /function removeDefaultAvatar/);
    assert.match(adminJs, /function openExistingFigureImage/);
    assert.match(adminJs, /function loadExistingImageAssets/);
    assert.match(adminJs, /function linkExistingFigureImage/);
    assert.match(adminJs, /api\/archive\/figure-asset-link/);
    assert.match(adminJs, /function unlinkFigureAssetGroup/);
    assert.match(adminJs, /api\/archive\/figure-asset-unlink/);
    assert.match(figureAssetCardsSource, /data-asset-action="edit"/);
    assert.match(figureAssetCardsSource, /data-asset-edit-target/);
    assert.match(adminJs, /function openFigureAssetEditor/);
    assert.match(figureAssetCardsSource, /data-asset-action="unlink"/);
    assert.match(figureAssetCardsSource, />解除关联<\/button>/);
    assert.match(adminJs, /图片资产和文件会保留/);
    assert.match(adminJs, /asset\.type === 'image'/);
    assert.match(adminJs, /asset\.figureIds\.includes\(state\.entityId\)/);
    assert.match(adminJs, /function openFigureImageUpload/);
    assert.match(adminJs, /function importFigureImage/);
    assert.match(adminJs, /function syncRemoteFigureImage/);
    assert.match(adminJs, /const imageUrl = elements\.imageImportUrl\.value\.trim\(\)/);
    assert.match(adminJs, /本地图片和图片 URL 只能选择一种/);
    assert.match(adminJs, /\{ imageBase64: await readFileAsDataUrl\(file\) \} : \{ imageUrl \}/);
    assert.match(adminJs, /elements\.imageImportSourceUrl\.value = ''/);
    assert.doesNotMatch(adminJs, /imageImportSourceUrl\.value = option\.dataset\.url/);
    assert.doesNotMatch(adminJs, /function updateDefaultAvatarUploadRequirements/);
    assert.match(adminJs, /imageImportSourceId\.selectedIndex = 1/);
    assert.match(adminJs, /const existingAssetIds = new Set\(assetResult\.data\.map\(\(asset\) => asset\.id\)\)/);
    assert.match(adminJs, /while \(existingAssetIds\.has\(assetId\)\)/);
    assert.match(adminJs, /querySelectorAll\('\[required\]'\)/);
    assert.match(adminJs, /openFigureImageUploadBtn\.addEventListener/);
    assert.match(adminJs, /elements\.figureAvatarEditor\.open = false/);
    assert.match(adminJs, /data-asset-path=/);
    assert.match(figureAssetCardsSource, /<dt>文件路径<\/dt>/);
    assert.doesNotMatch(figureAssetCardsSource, /<dt>来源<\/dt>/);
    assert.doesNotMatch(figureAssetCardsSource, /<dt>授权<\/dt>/);
    assert.doesNotMatch(figureAssetCardsSource, /<dt>引用记录<\/dt>/);
    assert.doesNotMatch(figureAssetCardsSource, /来源或授权元数据不一致/);
    assert.doesNotMatch(figureAssetCardsSource, /参与合并|保留此路径/);
    assert.match(adminJs, /openDefaultAvatarAssetBtn\.addEventListener\('click', openDefaultAvatarAsset\)/);
    assert.match(adminJs, /function renderFigureProfileSources/);
    assert.match(adminJs, /function collectFigureProfileSources/);
    assert.match(adminJs, /function handleFigureProfileSourceAction/);
    assert.match(adminJs, /data-profile-source-field="label\.zh"/);
    assert.match(adminJs, /data-profile-source-action="remove"/);
    assert.match(adminJs, /addFigureProfileSourceBtn\.addEventListener/);
    assert.doesNotMatch(adminJs, /JSON\.parse\(elements\.figureProfileSources/);
    assert.match(adminJs, /const figureSectionConfig =/);
    assert.match(adminJs, /function renderFigureSectionNav/);
    assert.match(adminJs, /function activateFigureSection/);
    assert.match(adminJs, /figureSectionNav\.addEventListener/);
    assert.match(
        adminJs,
        /async function loadEntity\(\)[\s\S]*updatePanelVisibility\(\);\s*renderEventSectionNav\(\);\s*renderFigureSectionNav\(\);/
    );
    assert.match(adminJs, /state\.figureSection === 'advanced'/);
    assert.match(adminJs, /panel\.dataset\.figureSectionPanel !== state\.figureSection/);
    assert.match(adminCss, /\.figure-display-layout\s*\{/);
    assert.match(adminCss, /\.figure-tab-section\s*\{/);
    assert.match(adminCss, /\.figure-internal-section\s*\{/);
    assert.match(adminCss, /\.figure-profile-sources\s*\{/);
    assert.match(adminJs, /class="relation-name-line">[\s\S]*data-field="primary"/);
    assert.match(adminJs, /class="relation-avatar"/);
    assert.match(adminJs, /function relationAvatarSelection/);
    assert.match(adminJs, /function updateRelationAvatarPreview/);
    assert.match(adminJs, /data-relation-avatar-kind/);
    assert.match(adminJs, /data-relation-avatar-detail/);
    assert.match(adminJs, /data-relation-avatar-path/);
    assert.match(adminJs, /figure\.defaultAvatar \? \{ useDefaultAvatar: true \} : \{\}/);
    assert.match(adminJs, /delete relation\.useDefaultAvatar/);
    assert.match(adminJs, /<details class="collection-more event-review-more"><summary>更多（内部用途）<\/summary>/);
    assert.match(adminJs, /structuredAddBtn\.hidden = !collectionConfig\(state\.file\)/);
    assert.doesNotMatch(adminJs, /collection-toolbar[\s\S]*config\.title/);
    assert.doesNotMatch(adminJs, /<h3>事件基本信息<\/h3>/);
    assert.doesNotMatch(adminJs, /<h3>\$\{escapeHtml\(title\)\}<\/h3>/);
    assert.match(adminJs, /function loadPresentationReferences/);
    assert.match(adminJs, /function renderPresentationReferenceField/);
    assert.match(adminJs, /function renderPresentationReferenceCard/);
    assert.match(adminJs, /function renderPresentationReferenceList/);
    assert.match(adminJs, /function handlePresentationReferenceAction/);
    assert.match(adminJs, /data-presentation-reference-action="add"/);
    assert.match(adminJs, /data-presentation-reference-action="remove"/);
    assert.match(adminJs, /data-presentation-reference-action="up"/);
    assert.match(adminJs, /data-presentation-reference-action="down"/);
    assert.doesNotMatch(presentationFormSource, /'展示模式'/);
    assert.doesNotMatch(presentationFormSource, /'视觉类型'/);
    assert.doesNotMatch(presentationFormSource, /presentationFieldPath\(prefix, 'presentationMode'\)/);
    assert.doesNotMatch(presentationFormSource, /presentationFieldPath\(prefix, 'visual'\)/);
    assert.match(presentationFormSource, /renderPresentationReferenceList\('展示图片'/);
    assert.match(presentationFormSource, /未设置，默认使用展示图片第一张/);
    assert.match(presentationFormSource, /未设置首图资产时，将默认使用“展示图片”中的第一张图片/);
    assert.match(presentationFormSource, /filter: isPresentationImageAsset/);
    assert.match(presentationFormSource, /renderPresentationReferenceList\('展示音视频'/);
    assert.match(presentationFormSource, /filter: isPresentationAudioVideoAsset/);
    assert.match(
        presentationFormSource,
        /renderPresentationReferenceList\('展示来源', 'sourceIds', presentation\.sourceIds, 'source'\)/
    );
    assert.match(
        adminJs,
        /renderPresentationReferenceList\('段落来源（内部用途）', `commentarySections\.\$\{index\}\.sourceIds`, section\.sourceIds, 'source'\)/
    );
    assert.match(adminJs, /function getPath/);
    assert.match(adminJs, /getPath\(presentation, field\)/);
    assert.match(adminJs, /setPath\(presentation, field, \[\]\)/);
    assert.doesNotMatch(presentationFormSource, /formTextarea\('展示资产/);
    assert.doesNotMatch(presentationFormSource, /formTextarea\('展示来源/);
    assert.doesNotMatch(adminJs, /formTextarea\('强调项 ID/);
    assert.doesNotMatch(adminJs, /formInput\('段落 ID'/);
    assert.match(adminJs, /renderPresentationReview\(review, prefix\)/);
    assert.match(adminJs, /function renderAssetMedia/);
    assert.match(adminJs, /<audio controls preload="none"/);
    assert.match(adminJs, /<video controls preload="none"/);
    assert.match(adminJs, /data-reference-swap-index/);
    assert.match(adminCss, /\.presentation-reference-field:not\(\[open\]\) > :not\(summary\)/);
    assert.match(adminCss, /\.presentation-reference-manager\s*\{/);
    assert.match(adminCss, /\.presentation-reference-manager\.is-image-assets\s*\{/);
    assert.match(adminCss, /\.presentation-reference-manager\.is-audio-video-assets\s*\{/);
    assert.match(adminCss, /\.presentation-reference-list-item > details:not\(\[open\]\) > :not\(summary\)/);
    assert.match(adminCss, /\.asset-media-preview img/);
    assert.doesNotMatch(assetFormSource, /collectionField\('资产 ID'/);
    assert.match(assetFormSource, /renderAssetSourceManager\(asset\)/);
    assert.doesNotMatch(assetFormSource, /collectionField\('来源 ID/);
    assert.match(assetFormSource, /collectionField\('角色', 'role', asset\.role, \{/);
    assert.match(assetFormSource, /options: assetRoleOptions\(asset\.type, asset\.role\)/);
    assert.match(assetFormSource, /内部资源路径（导入后自动回填）/);
    assert.doesNotMatch(assetFormSource, /collectionField\('人物 ID/);
    assert.match(assetFormSource, /isAudio \? collectionField\('语言'/);
    assert.match(assetFormSource, /collectionField\('OSS 音频 URL'/);
    assert.match(assetFormSource, /pattern: 'https:\/\/\.\*'/);
    assert.match(
        assetFormSource,
        /<div class="form-grid">\$\{technicalFields\}\$\{isAudio \? collectionField\('语言'[\s\S]*\$\{descriptionFields\}/
    );
    assert.doesNotMatch(assetFormSource, /音频 \/ 视频存储（按需填写）/);
    assert.doesNotMatch(assetFormSource, /asset-storage-fields/);
    assert.doesNotMatch(assetFormSource, /storage\.(?:profileId|provider|bucket|objectKey|contentType|publicUrl)/);
    assert.match(assetFormSource, /const isImage = asset\.type === 'image'/);
    assert.match(
        assetFormSource,
        /const isPendingImage = isImportableImage && state\.pendingAssetPaths\.has\(asset\.path\)/
    );
    assert.match(assetFormSource, /class="asset-image-layout"/);
    assert.match(
        assetFormSource,
        /class="form-grid asset-image-primary-fields">\$\{technicalFields\}\$\{descriptionFields\}/
    );
    assert.match(
        assetFormSource,
        /<div class="asset-image-sidebar">\$\{renderAssetMedia\(asset\)\}\$\{renderAssetImageImport\(asset\)\}<\/div>/
    );
    assert.doesNotMatch(assetFormSource, /<aside class="asset-image-sidebar"/);
    assert.match(assetFormSource, /class="form-grid asset-image-supplemental-fields" hidden><\/div>/);
    assert.match(adminJs, /function balanceImageAssetLayout/);
    assert.match(adminJs, /function scheduleImageAssetLayout/);
    assert.match(adminJs, /availableHeight = preview\.getBoundingClientRect\(\)\.height/);
    assert.match(adminJs, /fields\.slice\(Math\.max\(visibleCount, 1\)\)/);
    assert.match(adminJs, /scheduleImageAssetLayout\(\);/);
    assert.match(adminCss, /\.asset-image-layout\s*\{[\s\S]*grid-template-columns/);
    assert.match(adminCss, /\.form-grid\.asset-image-primary-fields\s*\{[\s\S]*grid-template-columns:\s*1fr/);
    assert.match(adminCss, /\.asset-image-sidebar\s*\{/);
    assert.match(adminCss, /\.asset-image-sidebar \.asset-media-preview\s*\{[\s\S]*min-height:\s*0/);
    assert.match(
        adminCss,
        /\.asset-image-sidebar \.asset-media-preview img\s*\{[\s\S]*height:\s*auto[\s\S]*max-height:\s*none/
    );
    assert.match(adminCss, /\.asset-image-supplemental-fields\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
    assert.match(adminCss, /\.asset-image-supplemental-fields\[hidden\]\s*\{[\s\S]*display:\s*none/);
    assert.match(adminCss, /\.asset-image-import\s*\{/);
    assert.match(adminCss, /\.asset-image-import-separator::before/);
    assert.match(
        assetFormSource,
        /<details class="collection-more asset-internal-usage"><summary>更多（内部用途）<\/summary>/
    );
    assert.match(assetFormSource, /const internalUsageFields = `\$\{collectionField\('使用位置/);
    assert.match(assetFormSource, /const technicalFields = `[\s\S]*collectionField\('角色', 'role'/);
    assert.match(assetFormSource, /: isPendingImage\s*\? ''\s*: collectionField\(isImportableImage/);
    assert.match(assetFormSource, /内部资源路径（导入后自动回填）/);
    assert.match(assetFormSource, /collectionField\('版权状态', 'rights\.status'/);
    assert.match(assetFormSource, /internalNoteField\('rights\.license'/);
    assert.match(assetFormSource, /internalNoteField\('rights\.usage'/);
    assert.match(adminCss, /\.collection-more:not\(\[open\]\) > :not\(summary\)\s*\{[\s\S]*display:\s*none/);
    assert.doesNotMatch(quizFormSource, /collectionField\('Quiz ID'/);
    assert.doesNotMatch(quizFormSource, /collectionField\('来源 ID/);
    assert.doesNotMatch(quizFormSource, /collectionField\('资产 ID/);
    assert.match(adminJs, /const id = nextCollectionId\('asset'\)/);
    assert.match(adminJs, /function generatedAssetPath\(assetId, type\)/);
    assert.match(adminJs, /pendingAssetPaths: new Set\(\)/);
    assert.match(adminJs, /pendingAssetIds: new Set\(\)/);
    assert.match(adminJs, /state\.pendingAssetPaths\.add\(created\.path\)/);
    assert.match(adminJs, /state\.pendingAssetPaths\.has\(asset\.path\)/);
    assert.match(adminCss, /\.asset-media-pending\s*\{/);
    assert.match(adminJs, /path: generatedAssetPath\(id, 'image'\)/);
    assert.match(adminJs, /role: defaultAssetRole\('image'\)/);
    assert.match(adminJs, /duplicate\.path = generatedAssetPath\(duplicate\.id, duplicate\.type\)/);
    assert.match(adminJs, /asset\.path = generatedAssetPath\(asset\.id, value\)/);
    assert.match(adminJs, /function validatePendingAssetRequirements\(\)/);
    assert.match(adminJs, /必须填写 HTTPS OSS 音频 URL/);
    assert.match(adminJs, /function renderAssetImageImport\(asset\)/);
    assert.match(adminJs, /function importAssetImage\(target\)/);
    assert.match(adminJs, /api\/archive\/event-image/);
    assert.match(adminJs, /id: nextCollectionId\('quiz'\)/);
    assert.doesNotMatch(sourceFormSource, /collectionField\('来源 ID'/);
    assert.doesNotMatch(sourceFormSource, /collectionField\('档案地址'/);
    assert.match(sourceFormSource, /<details class="collection-more"><summary>更多（内部用途）<\/summary>/);
    assert.match(adminJs, /id: nextCollectionId\('source'\)/);
    assert.match(sourceFormSource, /source\.id \|\| '保存时生成 ID'/);
    assert.match(adminJs, /function loadAssetSources\(force = false\)/);
    assert.match(adminJs, /state\.file === 'assets\.json'\) await loadAssetSources\(true\)/);
    assert.match(adminJs, /function renderAssetSourceManager\(asset\)/);
    assert.match(adminJs, /这里只能添加当前事件已有的来源信息/);
    assert.match(adminJs, /如需新增来源，请先到“来源”Tab 创建并保存/);
    assert.match(adminJs, /当前事件暂无来源，请先到“来源”Tab 创建/);
    assert.match(adminJs, /function handleAssetSourceAction\(target\)/);
    assert.match(adminJs, /请先选择需要添加的来源/);
    assert.match(adminJs, /function syncAssetSourceAddButton\(select\)/);
    assert.match(adminJs, /syncAssetSourceAddButton\(assetSourceSelect\)/);
    assert.match(adminJs, /focusNewEntry\(addedItem\)/);
    assert.match(adminJs, /asset\.sourceIds = ids/);
    assert.match(adminJs, /delete asset\.sourceId/);
    assert.match(adminJs, /sourceIds: \[\]/);
    assert.match(adminCss, /\.asset-source-manager\s*\{/);
    assert.match(adminCss, /\.asset-source-item\.is-new-entry/);
    assert.match(adminJs, /function focusNewEntry\(entry, focusSelector\)/);
    assert.match(adminJs, /entry\.scrollIntoView\(\{ behavior: 'auto', block: 'start' \}\)/);
    assert.match(adminCss, /scroll-margin-top:\s*calc\(var\(--event-nav-sticky-top\) \+ 64px\)/);
    assert.match(adminJs, /focusField: '\[data-structured-field="caption\.zh"\]'/);
    assert.match(adminJs, /focusNewEntry\(lastItem, '\[data-profile-source-field="label\.zh"\]'/);
    assert.match(adminJs, /'\[data-field="role\.zh"\]'/);
    assert.match(adminJs, /function fieldLabel\(label, required = false/);
    assert.match(
        adminJs,
        /localizedFields\('label', source\.label, \{ label: '标签', className: 'short', required: true \}\)/
    );
    assert.match(adminJs, /fieldLabel\('中文角色', true\)/);
    assert.match(adminCss, /\.collection-item\.is-new-entry/);
    assert.match(adminJs, /duplicate\.id = nextCollectionId\(config\.idPrefix\)/);
    assert.match(adminCss, /\.relation-primary-toggle\s*\{[\s\S]*display:\s*inline-flex/);
    assert.match(adminCss, /#editor\s*\{[\s\S]*color:\s*#edf7f3/);
    assert.match(adminCss, /#editor::selection\s*\{[\s\S]*background:\s*#286d63/);
    assert.doesNotMatch(adminJs, /formInput\('事件 ID'/);
    assert.doesNotMatch(adminJs, /formInput\('正式事件'/);
    assert.doesNotMatch(adminJs, /formInput\('地区 ID'/);
    assert.doesNotMatch(adminJs, /formTextarea\('主题 ID/);
    assert.doesNotMatch(eventFormSource, /localizedFields\('title'/);
    assert.doesNotMatch(eventFormSource, /localizedFields\('description'/);
    assert.match(adminJs, /页面标题与描述在展示配置中编辑/);
    assert.doesNotMatch(adminJs, /Claim ID（每行一个）/);
    assert.doesNotMatch(adminJs, /function claimItemForm/);
    assert.doesNotMatch(adminJs, /localizedFields\('review\.notes'/);
    assert.match(adminJs, /function internalNoteField/);
    assert.match(adminJs, /entity-usage/);
    assert.match(adminJs, /已使用/);
    assert.match(adminJs, /未使用/);
    assert.match(adminJs, /figureSortName/);
    assert.match(adminJs, /figureInitial/);
    assert.match(adminJs, /eventYear/);
    assert.match(adminJs, /entityIndexKey/);
    assert.match(adminJs, /data-entity-index/);
    assert.match(adminJs, /data-index-group/);
    assert.match(adminJs, /事件年份索引/);
    assert.match(adminJs, /entityList\.scrollTop/);
    assert.match(adminJs, /is-active/);
    assert.match(adminCss, /\.figure-alphabet\.is-years/);
    assert.match(adminJs, /class="figure-asset-image"/);
    assert.doesNotMatch(adminJs, /figureAssetGallery\.querySelectorAll\('img\[data-avatar-style\]'\)/);
    assert.match(adminCss, /\.figure-asset-image\s*{[\s\S]*?position:\s*absolute;[\s\S]*?object-fit:\s*contain;/);
    assert.match(adminJs, /renderFigureEvents/);
    assert.match(adminJs, /function figureEventRoleChips\(detail\)/);
    assert.match(adminJs, /\.\.\.detail\.eventRelations, \.\.\.detail\.variantRelations/);
    assert.match(adminJs, /<span class="figure-event-label">角色<\/span>/);
    assert.doesNotMatch(adminHtml, /分别展示人物的事件基础关系、故事线展示关系/);
    assert.match(adminJs, /\['图片资产', groupFigureAssets\(\)\.length\]/);
    assert.doesNotMatch(adminJs, /\['唯一资产', groupFigureAssets\(\)\.length\]/);
    assert.doesNotMatch(adminJs, /\['事件基础关系', usage\.eventRelations\.length\]/);
    assert.doesNotMatch(adminJs, /\['故事线展示关系', usage\.variantRelations\.length\]/);
    assert.doesNotMatch(adminJs, /个唯一资产|个唯一文件/);
    assert.doesNotMatch(adminJs, /无事件基础关系|无故事线展示关系/);
    assert.doesNotMatch(adminJs, /<span class="figure-event-label">事件基础关系<\/span>/);
    assert.doesNotMatch(adminJs, /<span class="figure-event-label">故事线展示关系<\/span>/);
    assert.doesNotMatch(adminJs, />Canonical</);
    assert.doesNotMatch(adminJs, />Variants</);
    assert.match(adminJs, /buildPresentationEventUrl/);
    assert.match(adminJs, /api\/archive\/event-presentation-targets/);
    assert.doesNotMatch(adminJs, /api\/archive\/event-presentation-restore-inheritance/);
    assert.doesNotMatch(adminJs, /restorePresentationInheritance/);
    assert.match(adminJs, /renderEventDisplayActions/);
    assert.match(adminJs, /openFigureDetails/);
    assert.match(adminJs, /data-action="open-figure"/);
    assert.match(adminJs, /data-event-action="open-admin"/);
    assert.match(adminJs, /data-event-action="open-display"/);
    assert.doesNotMatch(adminJs, /api\/archive\/figure-merge(?:['"?])/);
    assert.match(adminJs, /api\/archive\/figure-image/);
    assert.doesNotMatch(figureAssetCardsSource, /data-asset-action="delete"|>删除</);
    assert.match(adminJs, /data-avatar-style/);
    assert.match(adminJs, /avatarPreview\.style\.cssText/);
    assert.match(adminJs, /runTask\('generate'\)/);
    assert.match(adminServer, /POST \/api\/archive\/figure-merge/);
    assert.match(adminServer, /POST \/api\/archive\/figure-image/);
    assert.match(adminServer, /currentFigureService\(\)\.importFigureImage\(\{ \.\.\.body, imageBase64 \}\)/);
    assert.match(adminServer, /draftService\.trackResource\(draftResult\.asset\.path\)/);
    assert.match(adminServer, /function assertUniqueStorylineEvents\(storyline\)/);
    assert.match(adminServer, /Storyline cannot contain duplicate event/);
    assert.match(adminServer, /POST \/api\/archive\/event-image/);
    assert.match(adminServer, /downloadRemoteImage/);
    assert.match(adminServer, /POST \/api\/archive\/figure-default-avatar/);
    assert.match(adminServer, /POST \/api\/archive\/figure-asset-link/);
    assert.match(adminServer, /POST \/api\/archive\/figure-asset-unlink/);
    assert.match(adminServer, /POST \/api\/archive\/validate-draft/);
    assert.doesNotMatch(adminServer, /POST \/api\/archive\/validate-and-save/);
    assert.match(adminServer, /AI_HISTORY_ARCHIVE_ROOT/);
    assert.match(adminServer, /ai-history-archive-validation-/);
    assert.match(adminServer, /POST \/api\/archive\/figure-asset-merge-preview/);
    assert.match(adminServer, /POST \/api\/archive\/figure-asset-merge/);
    assert.match(adminServer, /GET \/api\/archive\/event-display-targets/);
    assert.match(adminServer, /GET \/api\/archive\/event-presentation-targets/);
    assert.match(adminServer, /POST \/api\/archive\/event-presentation-restore-inheritance/);
    assert.match(adminServer, /year: event\.year/);

    console.log('PASS Archive figure management service and UI contract');
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
