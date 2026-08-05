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
    const mergeAssetsFile = path.join(
        temporaryRoot,
        'archive',
        'events',
        'asset-merge-event',
        'assets.json'
    );
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
    assert.equal(
        readJson(mergeAssetsFile)[0].path,
        'resources/images/primary-person.jpg'
    );
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
    assert.equal(service.getFigureAssets('second-person', 'test-event').length, 1);
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
    assert.equal(service.getFigureAssets('second-person', 'test-event').length, 2);

    const adminHtml = fs.readFileSync(path.join(projectRoot, 'manage', 'admin.html'), 'utf8');
    const adminCss = fs.readFileSync(path.join(projectRoot, 'manage', 'admin.css'), 'utf8');
    const adminJs = fs.readFileSync(path.join(projectRoot, 'manage', 'admin.js'), 'utf8');
    const adminServer = fs.readFileSync(path.join(projectRoot, 'manage', 'server.js'), 'utf8');
    assert.match(adminHtml, /全局身份资料/);
    assert.match(adminHtml, /人物关系/);
    assert.match(adminHtml, /人物审计/);
    assert.match(adminHtml, /身份合并/);
    assert.match(adminHtml, /导入人物图片/);
    assert.match(adminHtml, /人物资产/);
    assert.match(adminHtml, /合并选中图片/);
    assert.match(adminHtml, /关联事件/);
    assert.match(adminHtml, /figureAssetGallery/);
    assert.match(adminHtml, /figureEventList/);
    assert.match(adminHtml, /figureAlphabet/);
    assert.match(adminHtml, /eventDisplayActions/);
    assert.match(adminHtml, /openEventDisplayBtn/);
    assert.match(adminJs, /api\/archive\/figure-assets/);
    assert.match(adminJs, /api\/archive\/figure-default-avatar/);
    assert.match(adminJs, /groupFigureAssets/);
    assert.match(adminJs, /mergeSelectedFigureAssets/);
    assert.match(adminJs, /data-asset-merge-select/);
    assert.match(adminJs, /data-asset-merge-canonical/);
    assert.match(adminJs, /renderFigureAssetCards/);
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
    assert.match(adminJs, /buildPresentationEventUrl/);
    assert.match(adminJs, /api\/archive\/event-display-targets/);
    assert.match(adminJs, /renderEventDisplayActions/);
    assert.match(adminJs, /openFigureDetails/);
    assert.match(adminJs, /data-action="open-figure"/);
    assert.match(adminJs, /data-event-action="open-admin"/);
    assert.match(adminJs, /data-event-action="open-display"/);
    assert.match(adminJs, /api\/archive\/figure-merge/);
    assert.match(adminJs, /api\/archive\/figure-image/);
    assert.match(adminJs, /data-avatar-style/);
    assert.match(adminJs, /avatarPreview\.style\.cssText/);
    assert.match(adminJs, /runTask\('generate'\)/);
    assert.match(adminServer, /POST \/api\/archive\/figure-merge/);
    assert.match(adminServer, /POST \/api\/archive\/figure-image/);
    assert.match(adminServer, /POST \/api\/archive\/figure-default-avatar/);
    assert.match(adminServer, /POST \/api\/archive\/figure-asset-merge-preview/);
    assert.match(adminServer, /POST \/api\/archive\/figure-asset-merge/);
    assert.match(adminServer, /GET \/api\/archive\/event-display-targets/);
    assert.match(adminServer, /year: event\.year/);

    console.log('PASS Archive figure management service and UI contract');
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
