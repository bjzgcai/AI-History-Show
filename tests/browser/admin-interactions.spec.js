'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { test, expect } = require('@playwright/test');

const projectRoot = path.resolve(__dirname, '../..');
const fixtureRoot = path.join(projectRoot, '.tmp', 'admin-browser-fixture');

function fixturePath(...parts) {
    return path.join(fixtureRoot, ...parts);
}

function readJson(...parts) {
    return JSON.parse(fs.readFileSync(fixturePath(...parts), 'utf8'));
}

async function openAdmin(page) {
    await page.goto('/admin');
    await expect(page.locator('#entityCount')).not.toHaveText('0');
}

async function clickButton(locator) {
    await locator.click({ force: true });
}

async function loadEvent(page, eventId) {
    await page.locator('#entitySearch').fill(eventId);
    await clickButton(page.locator(`#entityList button[data-id="${eventId}"]`));
    await expect(page.locator('#status')).toHaveText('内容已加载');
}

async function selectMode(page, type) {
    await clickButton(page.locator(`#entityTypeNav button[data-entity-type="${type}"]`));
    await expect(page.locator(`#entityTypeNav button[data-entity-type="${type}"]`)).toHaveClass(/is-active/);
}

async function waitForDraft(page) {
    await expect(page.locator('#status')).toHaveText('变更已加入待处理草稿', { timeout: 20_000 });
}

async function keepAndApplyDraft(page) {
    await selectMode(page, 'publish');
    await expect(page.locator('#publishChangeSummary')).toContainText('未决');
    await expect(page.locator('#publishValidateBtn')).toBeDisabled();
    await expect(page.locator('#publishApplyValidateBtn')).toBeDisabled();
    await clickButton(page.locator('#keepAllDraftsBtn'));
    await expect(page.locator('#publishChangeSummary')).toContainText('未决 0');
    await clickButton(page.locator('#publishValidateBtn'));
    await expect(page.locator('#publishOperationSummary')).toContainText('校验保留变更 · 操作成功', {
        timeout: 120_000
    });
    page.once('dialog', (dialog) => dialog.accept());
    await clickButton(page.locator('#publishApplyValidateBtn'));
    await expect(page.locator('#publishOperationSummary')).toContainText('保存并校验 · 操作成功', {
        timeout: 120_000
    });
    await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
}

test.describe.serial('Archive Admin button feedback and file linkage', () => {
    test('admin loads API and media through a reverse-proxy subpath', async ({ page }) => {
        const requestedPaths = [];
        page.on('request', (request) => {
            const url = new URL(request.url());
            if (url.origin === 'http://127.0.0.1:43118') requestedPaths.push(url.pathname);
        });

        await page.goto('/nested-admin/admin');
        await expect(page.locator('#entityCount')).not.toHaveText('0');
        await loadEvent(page, '1956-dartmouth');

        expect(requestedPaths).toContain('/nested-admin/admin.css');
        expect(requestedPaths).toContain('/nested-admin/admin.js');
        expect(requestedPaths).toContain('/nested-admin/api/archive/events');
        expect(
            requestedPaths.filter(
                (pathname) =>
                    pathname.startsWith('/api/') ||
                    pathname.startsWith('/resources/') ||
                    pathname === '/admin.css' ||
                    pathname === '/admin.js'
            )
        ).toEqual([]);

        const localMediaSource = await page.evaluate(() => window.adminMediaUrl('resources/images/ui/brand.png'));
        expect(localMediaSource).toBe('/nested-admin/resources/images/ui/brand.png');
    });

    test('event and storyline display buttons open the corresponding presentation view', async ({ page }) => {
        await page.context().route('http://127.0.0.1:8000/**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: '<!doctype html><title>Admin test display</title>'
            })
        );
        await openAdmin(page);

        await loadEvent(page, '1956-dartmouth');
        await expect(page.locator('#openEventDisplayBtn')).toBeEnabled();
        const [eventPopup] = await Promise.all([
            page.waitForEvent('popup'),
            clickButton(page.locator('#openEventDisplayBtn'))
        ]);
        await expect.poll(() => new URL(eventPopup.url()).searchParams.get('uiMode')).toBe('detail');
        const eventUrl = new URL(eventPopup.url());
        expect(eventUrl.searchParams.get('event')).toMatch(/^milestone-/);
        expect(eventUrl.searchParams.get('storyline')).toBeTruthy();
        await eventPopup.close();

        await selectMode(page, 'storylines');
        const storylineCard = page.locator('#entityList [data-storyline-id]').first();
        await clickButton(storylineCard);
        await expect(page.locator('#storylineOverviewPanel')).toBeVisible();
        const [storylinePopup] = await Promise.all([
            page.waitForEvent('popup'),
            clickButton(page.locator('#openStorylineDisplayBtn'))
        ]);
        const storylineUrl = new URL(storylinePopup.url());
        expect(storylineUrl.searchParams.get('storyline')).toBeTruthy();
        expect(storylineUrl.searchParams.get('uiMode')).toBeNull();
        expect(storylineUrl.searchParams.get('event')).toBeNull();
        await storylinePopup.close();
    });

    test('event title, summary, and description are edited from basic information', async ({ page }) => {
        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');

        await expect(page.locator('[data-event-section="basic"]')).toHaveClass(/is-active/);
        await expect(page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]')).toBeVisible();
        await expect(page.locator('[data-structured-field="defaultPresentation.displaySummary.zh"]')).toBeVisible();
        await expect(page.locator('[data-structured-field="defaultPresentation.displayDescription.zh"]')).toBeVisible();

        await clickButton(page.locator('[data-event-section="presentation"]'));
        await expect(page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]')).toHaveCount(0);
        await expect(page.locator('[data-structured-field="defaultPresentation.displaySummary.zh"]')).toHaveCount(0);
        await expect(page.locator('[data-structured-field="defaultPresentation.displayDescription.zh"]')).toHaveCount(
            0
        );
    });

    test('test display is independent from the Admin service and no static bundle is required', async ({ page }) => {
        await openAdmin(page);
        await selectMode(page, 'publish');
        await expect(page.locator('#openTestDisplay')).toBeVisible();
        await expect(page.locator('#openTestDisplay')).toHaveAttribute('href', 'http://127.0.0.1:8000/');
        await expect(page.locator('#publishBuildBtn')).toHaveCount(0);
        const status = await page.evaluate(async () => (await fetch('/api/archive/publish-status')).json());
        expect(status.testDisplay.url).toBe('http://127.0.0.1:8000/');
        expect(status.bundle).toBeUndefined();
    });

    test('editing auto-saves a persistent draft and only publish management writes formal JSON', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const original = readJson('archive', 'events', '1956-dartmouth', 'event.json');
        const originalTitle = original.defaultPresentation.displayTitle.zh;
        const savedTitle = `${originalTitle} Admin E2E`;

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        const titleField = page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]');
        await expect(titleField).toHaveValue(originalTitle);
        await titleField.fill(savedTitle);
        await waitForDraft(page);
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(originalTitle);

        await page.reload();
        await expect(page.locator('#entityCount')).not.toHaveText('0');
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        await expect(titleField).toHaveValue(savedTitle);
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(originalTitle);

        await keepAndApplyDraft(page);
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(savedTitle);

        await expect(page.locator('#publishGenerateBtn')).toBeEnabled();
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#publishGenerateBtn'));
        await expect(page.locator('#publishOperationSummary')).toContainText('生成运行时数据 · 操作成功', {
            timeout: 120_000
        });
        await expect(page.locator('#publishTestDisplayStatus')).toHaveText('已更新');
        await expect(page.locator('#openTestDisplay')).toHaveAttribute('href', 'http://127.0.0.1:8000/');
        await expect(page.locator('#publishTestDisplayConfirmBtn')).toBeEnabled();
        expect(fs.readFileSync(fixturePath('milestones-data.js'), 'utf8')).toContain(savedTitle);
        expect(fs.readFileSync(fixturePath('milestones-data-default.js'), 'utf8')).toEqual(
            fs.readFileSync(path.join(projectRoot, 'milestones-data-default.js'), 'utf8')
        );
    });

    test('saving a draft requires successful draft validation and preserves formal files on rejection', async ({
        page
    }) => {
        const eventId = '1956-dartmouth';
        const eventPath = fixturePath('archive', 'events', eventId, 'event.json');
        const originalSource = fs.readFileSync(eventPath, 'utf8');
        const fileResponse = await page.request.get(
            `/api/archive/file?eventId=${eventId}&file=${encodeURIComponent('event.json')}`
        );
        const file = await fileResponse.json();
        const changed = JSON.parse(JSON.stringify(file.data));
        changed.defaultPresentation.displayTitle.zh = `${changed.defaultPresentation.displayTitle.zh} 未校验保存`;

        try {
            const draftResponse = await page.request.post('/api/archive/file', {
                data: {
                    type: 'events',
                    eventId,
                    file: 'event.json',
                    data: changed,
                    expectedRevision: file.revision
                }
            });
            expect(draftResponse.ok()).toBe(true);
            const decisionResponse = await page.request.post('/api/archive/draft-decision', {
                data: { all: true, decision: 'kept' }
            });
            expect(decisionResponse.ok()).toBe(true);

            const saveResponse = await page.request.post('/api/archive/draft-apply');
            expect(saveResponse.status()).toBe(409);
            expect(await saveResponse.json()).toEqual({ error: '请先校验保留变更，校验通过后才能保存文件' });
            expect(fs.readFileSync(eventPath, 'utf8')).toBe(originalSource);
        } finally {
            await page.request.post('/api/archive/draft-reset');
        }
    });

    test('publish steps cannot be skipped and each successful step enables the next one', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const original = readJson('archive', 'events', '1956-dartmouth', 'event.json');
        const changedTitle = `${original.defaultPresentation.displayTitle.zh} 流程依赖测试`;

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        await page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]').fill(changedTitle);
        await waitForDraft(page);
        await selectMode(page, 'publish');
        await clickButton(page.locator('#keepAllDraftsBtn'));

        await expect(page.locator('#publishApplyValidateBtn')).toBeDisabled();
        await expect(page.locator('#publishValidateBtn')).toBeEnabled();
        await clickButton(page.locator('#publishValidateBtn'));
        await expect(page.locator('#publishOperationSummary')).toContainText('校验保留变更 · 操作成功', {
            timeout: 120_000
        });
        await expect(page.locator('#publishApplyValidateBtn')).toBeEnabled();

        const applyAndValidate = await page.request.post('/api/archive/draft-apply-validate');
        expect(applyAndValidate.ok()).toBe(true);
        expect((await applyAndValidate.json()).steps.map((step) => step.name)).toEqual([
            'draft-validate',
            'apply-validate'
        ]);
        const prematureGeneration = await page.request.post('/api/archive/publish-generate');
        expect(prematureGeneration.ok()).toBe(true);

        const prematureSubmit = await page.request.post('/api/archive/submit-github');
        expect(prematureSubmit.ok()).toBe(true);
        const readyStatus = await page.request.get('/api/archive/publish-status');
        expect((await readyStatus.json()).workflow.runtimeGeneration.ready).toBe(true);
        const confirmResponse = await page.request.post('/api/archive/test-display-confirm');
        expect(confirmResponse.ok()).toBe(true);
        expect(
            (await (await page.request.get('/api/archive/publish-status')).json()).workflow.testDisplayConfirmation
                .ready
        ).toBe(true);
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(changedTitle);
    });

    test('undo last change creates a rollback draft without changing formal files', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const originalSource = fs.readFileSync(eventPath, 'utf8');
        await openAdmin(page);
        await selectMode(page, 'publish');
        const response = await page.request.post('/api/archive/undo-last-change');
        expect(response.ok()).toBe(true);
        const result = await response.json();
        expect(result.targetVersion.id).toBe(result.fromVersion.previousVersionId);
        expect(fs.readFileSync(eventPath, 'utf8')).toBe(originalSource);
        const status = await (await page.request.get('/api/archive/publish-status')).json();
        expect(status.draft.summary.active).toBeGreaterThan(0);
        await page.request.post('/api/archive/draft-reset');
    });

    test('failed saved validation clears old readiness and blocks generation', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const originalSource = fs.readFileSync(eventPath, 'utf8');

        await openAdmin(page);
        await selectMode(page, 'publish');
        expect((await (await page.request.post('/api/archive/publish-validate')).json()).ok).toBe(true);
        expect((await (await page.request.post('/api/archive/publish-generate')).json()).ok).toBe(true);
        expect(
            (await (await page.request.get('/api/archive/publish-status')).json()).workflow.savedValidation.ready
        ).toBe(true);

        const invalidEvent = JSON.parse(originalSource);
        invalidEvent.id = 'invalid-after-saved-validation';
        fs.writeFileSync(eventPath, `${JSON.stringify(invalidEvent, null, 2)}\n`, 'utf8');
        try {
            const validationResponse = await page.request.post('/api/archive/publish-validate');
            expect(validationResponse.ok()).toBe(true);
            expect((await validationResponse.json()).ok).toBe(false);

            const status = await (await page.request.get('/api/archive/publish-status')).json();
            expect(status.workflow.savedValidation.ready).toBe(false);
            expect(status.workflow.githubSubmission.ready).toBe(false);
            const generationResponse = await page.request.post('/api/archive/publish-generate');
            expect(generationResponse.status()).toBe(409);
            expect(await generationResponse.json()).toEqual({
                error: '请先完成“生效前先校验”，校验当前已保存的文件后才能生成运行时数据'
            });
        } finally {
            fs.writeFileSync(eventPath, originalSource, 'utf8');
            await page.request.post('/api/archive/publish-validate');
            await page.request.post('/api/archive/publish-generate');
        }
    });

    test('history versions create reviewable rollback drafts and retain resource files', async ({ page }) => {
        const resourcePath = fixturePath('resources', 'images', 'admin-history-retained.txt');
        const original = readJson('archive', 'events', '1956-dartmouth', 'event.json');
        const originalTitle = original.defaultPresentation.displayTitle.zh;
        const changedTitle = `${originalTitle} 历史版本测试`;

        await openAdmin(page);
        await selectMode(page, 'publish');
        const initialHistory = await (await page.request.get('/api/archive/history')).json();
        const rollbackTarget = initialHistory.versions[0];
        expect(rollbackTarget).toBeTruthy();

        await selectMode(page, 'events');
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        await page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]').fill(changedTitle);
        await waitForDraft(page);
        await keepAndApplyDraft(page);
        expect(readJson('archive', 'events', '1956-dartmouth', 'event.json').defaultPresentation.displayTitle.zh).toBe(
            changedTitle
        );
        fs.writeFileSync(resourcePath, 'resource remains after JSON rollback');

        await clickButton(page.locator('#publishHistoryTab'));
        await expect(page.locator('#publishHistoryPane')).toBeVisible();
        await expect(page.locator('#historyVersionList .history-version-item').first()).toContainText('1 个业务变更');
        await expect(page.locator('#historyChangeList')).toContainText('修改 zh');
        await expect(page.locator('#historyChangeList')).not.toContainText('event.json');
        await expect(page.locator('#createRollbackDraftBtn')).toBeDisabled();
        await expect(page.locator('#historyRollbackHint')).toHaveText(
            '当前已是正式版本，无需回滚；请选择较早的历史版本。'
        );
        await expect(page.locator('#historyVersionList .history-version-item')).toHaveCount(
            initialHistory.versions.length + 1
        );
        await clickButton(page.locator(`[data-history-version-id="${rollbackTarget.id}"]`));
        await expect(page.locator('#historyDetailTitle')).toContainText(rollbackTarget.id);
        await expect(page.locator('#createRollbackDraftBtn')).toBeEnabled();

        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#createRollbackDraftBtn'));
        await expect(page.locator('#publishChangesPane')).toBeVisible();
        await expect(page.locator('#publishChangeSummary')).toContainText(`回滚草稿，目标版本 ${rollbackTarget.id}`);
        expect(readJson('archive', 'events', '1956-dartmouth', 'event.json').defaultPresentation.displayTitle.zh).toBe(
            changedTitle
        );
        expect(fs.existsSync(resourcePath)).toBe(true);

        await keepAndApplyDraft(page);
        expect(readJson('archive', 'events', '1956-dartmouth', 'event.json').defaultPresentation.displayTitle.zh).toBe(
            originalTitle
        );
        expect(fs.existsSync(resourcePath)).toBe(true);

        await clickButton(page.locator('#publishHistoryTab'));
        await expect(page.locator('#historyVersionList .history-version-item').first()).toContainText('回滚版本');
        await expect(page.locator('#historyVersionList .history-version-item').first()).toContainText(
            rollbackTarget.id
        );
    });

    test('publish management records semantic changes and can discard one without changing formal JSON', async ({
        page
    }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const formalTitles = readJson('archive', 'events', '1956-dartmouth', 'event.json').defaultPresentation
            .displayTitle;

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        await page
            .locator('[data-structured-field="defaultPresentation.displayTitle.zh"]')
            .fill(`${formalTitles.zh} 待放弃`);
        await page
            .locator('[data-structured-field="defaultPresentation.displayTitle.en"]')
            .fill(`${formalTitles.en} pending decision`);
        await waitForDraft(page);

        await selectMode(page, 'publish');
        const prematureValidation = await page.request.post('/api/archive/draft-validate');
        expect(prematureValidation.status()).toBe(409);
        expect(await prematureValidation.json()).toEqual({
            error: '仍有未决策变更，请先逐项保留或放弃'
        });
        const prematureGeneration = await page.request.post('/api/archive/publish-generate');
        expect(prematureGeneration.status()).toBe(409);
        expect(await prematureGeneration.json()).toEqual({
            error: '存在待处理 Admin 草稿，请先完成保留、放弃和应用'
        });
        await expect(page.locator('body')).toHaveClass(/is-publish-mode/);
        await expect(page.locator('aside')).toBeHidden();
        await expect(page.locator('#publishPanel')).toBeVisible();
        const zhChange = page.locator('#publishChangeList .publish-change-item').filter({ hasText: '修改 zh' });
        const enChange = page.locator('#publishChangeList .publish-change-item').filter({ hasText: '修改 en' });
        await expect(zhChange).toContainText('编辑 · 事件');
        await clickButton(zhChange.locator('[data-draft-decision="discarded"]'));
        await expect(page.locator('#publishChangeSummary')).toContainText('未决 1');
        await expect(enChange.locator('[data-draft-decision="kept"]')).toBeEnabled();
        await expect(enChange.locator('[data-draft-decision="discarded"]')).toBeEnabled();
        await clickButton(enChange.locator('[data-draft-decision="kept"]'));
        await expect(enChange.locator('[data-draft-decision="discarded"]')).toBeEnabled();
        await clickButton(enChange.locator('[data-draft-decision="discarded"]'));
        await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
        await expect(page.locator('#publishChangeSummary')).toContainText('已放弃 2');
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle).toEqual(formalTitles);
    });

    test('one-click save changes keeps non-discarded changes and completes steps one through three', async ({
        page
    }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const original = readJson('archive', 'events', '1956-dartmouth', 'event.json');
        const changedTitle = `${original.defaultPresentation.displayTitle.zh} 一键保存测试`;

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        await page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]').fill(changedTitle);
        await waitForDraft(page);
        await selectMode(page, 'publish');

        await expect(page.locator('#saveChangesBtn')).toBeEnabled();
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#saveChangesBtn'));
        await expect(page.locator('#publishOperationSummary')).toContainText('一键保存变更 · 操作成功', {
            timeout: 120_000
        });
        await expect(page.locator('#publishOperationSteps .publish-operation-step')).toHaveCount(3);
        await expect(page.locator('#publishOperationSteps')).toContainText('处理变更');
        await expect(page.locator('#publishOperationSteps')).toContainText('保存并校验');
        await expect(page.locator('#publishOperationSteps')).toContainText('生成运行时数据');
        await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
        await expect(page.locator('#publishGenerateBtn')).toBeDisabled();
        expect(readJson('archive', 'events', '1956-dartmouth', 'event.json').defaultPresentation.displayTitle.zh).toBe(
            changedTitle
        );
        expect(fs.readFileSync(eventPath, 'utf8')).toContain(changedTitle);
    });

    test('one-click submission stops after validation failure', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const originalSource = fs.readFileSync(eventPath, 'utf8');
        const invalidEvent = JSON.parse(originalSource);
        invalidEvent.id = 'invalid-admin-publish-id';
        fs.writeFileSync(eventPath, `${JSON.stringify(invalidEvent, null, 2)}\n`, 'utf8');

        try {
            await openAdmin(page);
            await selectMode(page, 'publish');
            page.once('dialog', (dialog) => dialog.accept());
            await clickButton(page.locator('#preparePublishBtn'));
            await expect(page.locator('#publishOperationSummary')).toContainText('一键提交 GitHub · 操作失败', {
                timeout: 180_000
            });
            const steps = page.locator('#publishOperationSteps .publish-operation-step');
            await expect(steps).toHaveCount(3);
            await expect(steps.nth(0)).toContainText('失败');
            await expect(steps.nth(1)).toContainText('未执行');
            await expect(steps.nth(2)).toContainText('未执行');
        } finally {
            fs.writeFileSync(eventPath, originalSource, 'utf8');
        }
    });

    test('one-click submission follows validation, generation, and GitHub submission order', async ({ page }) => {
        const original = readJson('archive', 'events', '1956-dartmouth', 'event.json');
        const preparedTitle = `${original.defaultPresentation.displayTitle.zh} 一键提交测试`;

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        await page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]').fill(preparedTitle);
        await waitForDraft(page);
        await selectMode(page, 'publish');
        await expect(page.locator('#preparePublishBtn')).toBeEnabled();

        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#preparePublishBtn'));
        await expect(page.locator('#publishOperationSummary')).toContainText('一键提交 GitHub · 操作成功', {
            timeout: 180_000
        });
        await expect(page.locator('#publishOperationSteps .publish-operation-step')).toHaveCount(4);
        await expect(page.locator('#publishOperationSteps')).toContainText('处理变更');
        await expect(page.locator('#publishOperationSteps')).toContainText('保存并校验');
        await expect(page.locator('#publishOperationSteps')).toContainText('生成运行时数据');
        await expect(page.locator('#publishOperationSteps')).toContainText('提交 GitHub');
        await expect(page.locator('#publishOperationSteps')).toContainText('测试模式：未执行 Git commit 或 push');
    });

    test('one-click submission without a draft uses saved content and excludes fallback files', async ({ page }) => {
        await openAdmin(page);
        await selectMode(page, 'publish');
        const response = await page.request.post('/api/archive/prepare-submit');
        expect(response.ok()).toBe(true);
        const result = await response.json();
        expect(result.steps.map((step) => step.name)).toEqual(['validate', 'generate', 'submit']);
        expect(result.steps.every((step) => step.ok)).toBe(true);
        const submitStep = result.steps.find((step) => step.name === 'submit');
        expect(submitStep.files).toContain('milestones-data.js');
        expect(submitStep.files).not.toContain('milestones-data-default.js');
        expect(submitStep.files.some((file) => file.startsWith('manage/'))).toBe(false);
    });

    test('formal JSON revision conflicts block draft application', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const originalSource = fs.readFileSync(eventPath, 'utf8');

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="basic"]'));
        const titleField = page.locator('[data-structured-field="defaultPresentation.displayTitle.en"]');
        await titleField.fill(`${await titleField.inputValue()} conflict draft`);
        await waitForDraft(page);

        fs.writeFileSync(eventPath, originalSource.replace(/\n$/, ' \n'), 'utf8');

        await selectMode(page, 'publish');
        await expect(page.locator('#publishApplyValidateBtn')).toBeDisabled();
        await clickButton(page.locator('#keepAllDraftsBtn'));
        await expect(page.locator('#publishValidateBtn')).toBeEnabled();
        await clickButton(page.locator('#publishValidateBtn'));
        await expect(page.locator('#publishOperationSummary')).toContainText('校验保留变更 · 操作成功', {
            timeout: 120_000
        });
        await expect(page.locator('#publishApplyValidateBtn')).toBeEnabled();
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#publishApplyValidateBtn'));
        await expect(page.locator('#publishOperationSummary')).toContainText('保存并校验 · 操作失败', {
            timeout: 120_000
        });
        await expect(page.locator('#publishOperationSteps')).toContainText('正式文件已在草稿创建后发生变化');

        fs.writeFileSync(eventPath, originalSource, 'utf8');
        await expect(page.locator('#discardAllDraftsBtn')).toBeEnabled();
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#discardAllDraftsBtn'));
        await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
    });

    test('imported images stay staged until JSON application', async ({ page }) => {
        const eventId = '1956-dartmouth';
        const assetId = 'asset-admin-staged-image';
        const imageSource = path.join(
            projectRoot,
            'resources/images/_thumbs/humanistic-cycle/humanistic-2025-iit-ai/giulio-tononi-nih-portrait.jpg.webp'
        );
        const draftAssetsResponse = await page.request.get(
            `/api/archive/file?eventId=${eventId}&file=${encodeURIComponent('assets.json')}`
        );
        const draftAssets = await draftAssetsResponse.json();
        const sourceId = draftAssets.data[0].sourceId || draftAssets.data[0].sourceIds[0];
        draftAssets.data.push({
            id: assetId,
            type: 'image',
            path: `resources/images/${eventId}/${assetId}.png`,
            role: 'historical',
            caption: { en: 'Admin staged image', zh: '后台暂存图片' },
            subcaption: { en: 'Admin staging test.', zh: '后台暂存测试。' },
            sourceId,
            rights: { status: 'test-only' },
            usage: ['storyline:deep-learning'],
            editable: true
        });
        const saveResponse = await page.request.post('/api/archive/file', {
            data: {
                type: 'events',
                eventId,
                file: 'assets.json',
                data: draftAssets.data,
                expectedRevision: draftAssets.revision
            }
        });
        expect(saveResponse.ok()).toBe(true);

        const importResponse = await page.request.post('/api/archive/event-image', {
            data: {
                eventId,
                assetId,
                imageBase64: fs.readFileSync(imageSource).toString('base64')
            }
        });
        expect(importResponse.ok()).toBe(true);
        const imported = await importResponse.json();
        const formalImagePath = fixturePath(...imported.path.split('/'));
        expect(fs.existsSync(formalImagePath)).toBe(false);
        expect(
            (await (await page.request.get('/api/archive/publish-status')).json()).draft.summary.stagedResources
        ).toBe(1);

        const importedDraftAssetsResponse = await page.request.get(
            `/api/archive/file?eventId=${eventId}&file=${encodeURIComponent('assets.json')}`
        );
        const importedDraftAssets = await importedDraftAssetsResponse.json();
        const importedAsset = importedDraftAssets.data.find((asset) => asset.id === assetId);
        importedAsset.path = imported.path;
        const importedAssetSaveResponse = await page.request.post('/api/archive/file', {
            data: {
                type: 'events',
                eventId,
                file: 'assets.json',
                data: importedDraftAssets.data,
                expectedRevision: importedDraftAssets.revision
            }
        });
        expect(importedAssetSaveResponse.ok()).toBe(true);

        expect(readJson('archive', 'events', eventId, 'assets.json').some((asset) => asset.id === assetId)).toBe(false);
        expect(fs.existsSync(formalImagePath)).toBe(false);

        await openAdmin(page);
        await keepAndApplyDraft(page);
        expect(readJson('archive', 'events', eventId, 'assets.json').some((asset) => asset.id === assetId)).toBe(true);
        expect(fs.existsSync(formalImagePath)).toBe(true);
    });

    test('storyline add and remove buttons update JSON without duplicates and keep chronological order', async ({
        page
    }) => {
        const storylineId = 'deep-learning';
        const storylinePath = fixturePath('archive', 'storylines', `${storylineId}.json`);
        const original = readJson('archive', 'storylines', `${storylineId}.json`);
        const existingIds = new Set(original.events.map((membership) => membership.eventId));
        const eventDirectories = fs.readdirSync(fixturePath('archive', 'events')).sort();
        const candidateId = eventDirectories.find((eventId) => {
            if (existingIds.has(eventId)) return false;
            const eventFile = fixturePath('archive', 'events', eventId, 'event.json');
            if (!fs.existsSync(eventFile)) return false;
            return Boolean(JSON.parse(fs.readFileSync(eventFile, 'utf8')).defaultPresentation);
        });
        expect(candidateId).toBeTruthy();

        await openAdmin(page);
        await selectMode(page, 'storylines');
        await clickButton(page.locator(`#entityList [data-storyline-id="${storylineId}"]`));
        await expect(page.locator('#status')).toHaveText('内容已加载');

        await page.locator('#storylineEventSelect').selectOption(candidateId);
        await clickButton(page.locator('#addStorylineEventBtn'));
        await expect(page.locator('#status')).toHaveText('事件已加入故事线，尚未保存');
        const addedItem = page.locator(`[data-storyline-event-id="${candidateId}"]`);
        await expect(addedItem).toBeVisible();
        await expect(addedItem.locator('.storyline-timeline-open')).toBeFocused();
        await expect(page.locator(`#storylineEventSelect option[value="${candidateId}"]`)).toHaveCount(0);
        await waitForDraft(page);
        expect(
            JSON.parse(fs.readFileSync(storylinePath, 'utf8')).events.some((item) => item.eventId === candidateId)
        ).toBe(false);

        await selectMode(page, 'publish');
        await expect(page.locator('#publishChangeList .publish-change-item')).toHaveCount(1);
        await expect(page.locator('#publishChangeList')).toContainText(`添加事件到故事线 ${candidateId}`);
        await expect(page.locator('#publishChangeList')).not.toContainText('修改 order');
        await keepAndApplyDraft(page);
        const saved = JSON.parse(fs.readFileSync(storylinePath, 'utf8'));
        expect(saved.events.filter((item) => item.eventId === candidateId)).toHaveLength(1);
        expect(saved.events.map((item) => item.order)).toEqual(saved.events.map((_, index) => (index + 1) * 10));
        const savedYears = saved.events.map((item) => {
            const event = readJson('archive', 'events', item.eventId, 'event.json');
            const parsed = Number.parseFloat(String(event.year || ''));
            return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
        });
        expect(savedYears).toEqual([...savedYears].sort((left, right) => left - right));

        await selectMode(page, 'storylines');
        await clickButton(page.locator(`#entityList [data-storyline-id="${storylineId}"]`));
        await expect(page.locator('#status')).toHaveText('内容已加载');

        await page.evaluate((eventId) => {
            const confirm = window.confirm;
            window.confirm = () => true;
            document.querySelector(`[data-remove-storyline-event="${eventId}"]`).click();
            window.confirm = confirm;
        }, candidateId);
        await expect(page.locator('#status')).toHaveText('事件已从故事线移除，尚未保存');
        await expect(addedItem).toHaveCount(0);
        await waitForDraft(page);
        await selectMode(page, 'publish');
        await expect(page.locator('#publishChangeList .publish-change-item')).toHaveCount(1);
        await expect(page.locator('#publishChangeList')).toContainText(`从故事线移除事件 ${candidateId}`);
        await expect(page.locator('#publishChangeList')).not.toContainText('修改 order');
        await keepAndApplyDraft(page);
        expect(
            JSON.parse(fs.readFileSync(storylinePath, 'utf8')).events.some((item) => item.eventId === candidateId)
        ).toBe(false);
    });

    test('event relation cards show avatar details and update the preview when selection changes', async ({ page }) => {
        const eventId = '1957-perceptron';
        const event = readJson('archive', 'events', eventId, 'event.json');
        const assets = readJson('archive', 'events', eventId, 'assets.json');
        const figures = readJson('archive', 'figures', 'figures.json');
        const relation = event.figures[0];
        const figure = figures.find((candidate) => candidate.id === relation.figureId);
        const selectedAsset = assets.find((asset) => asset.id === relation.avatarAssetId);
        const alternativeAsset = assets.find(
            (asset) =>
                asset.type === 'image' &&
                asset.path !== selectedAsset.path &&
                Array.isArray(asset.figureIds) &&
                asset.figureIds.includes(relation.figureId)
        );
        expect(figure.defaultAvatar.path).toBeTruthy();
        expect(selectedAsset).toBeTruthy();
        expect(alternativeAsset).toBeTruthy();

        await openAdmin(page);
        await loadEvent(page, eventId);
        await clickButton(page.locator('[data-event-section="people"]'));
        const row = page.locator('#relationRows .relation-row').first();
        const avatarSelect = row.locator('[data-field="avatarAssetId"]');
        await expect(row.locator('[data-relation-avatar-kind]')).toHaveText('事件头像');
        await expect(row.locator('[data-relation-avatar-detail]')).toContainText(selectedAsset.id);
        await expect(row.locator('[data-relation-avatar-path]')).toHaveText(selectedAsset.path);
        await expect(row.locator('[data-relation-avatar] img')).toHaveAttribute('src', `/${selectedAsset.path}`);

        await avatarSelect.selectOption(alternativeAsset.id);
        await expect(row.locator('[data-relation-avatar-kind]')).toHaveText('事件头像');
        await expect(row.locator('[data-relation-avatar-detail]')).toContainText(alternativeAsset.id);
        await expect(row.locator('[data-relation-avatar-path]')).toHaveText(alternativeAsset.path);
        await expect(row.locator('[data-relation-avatar] img')).toHaveAttribute('src', `/${alternativeAsset.path}`);

        await avatarSelect.selectOption('');
        await expect(row.locator('[data-relation-avatar-kind]')).toHaveText('人物默认头像');
        await expect(row.locator('[data-relation-avatar-detail]')).toHaveText('来自人物资料');
        await expect(row.locator('[data-relation-avatar-path]')).toHaveText(figure.defaultAvatar.path);
        await expect(row.locator('[data-relation-avatar] img')).toHaveAttribute('src', `/${figure.defaultAvatar.path}`);
        await waitForDraft(page);

        await selectMode(page, 'publish');
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#discardAllDraftsBtn'));
        await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
    });

    test('figure image assets can open their owning event asset editor', async ({ page }) => {
        const eventId = '1957-perceptron';
        const assetId = 'asset-1957-perceptron-figure-avatar-frank-rosenblatt';
        const formalAssets = readJson('archive', 'events', eventId, 'assets.json');
        const assetIndex = formalAssets.findIndex((asset) => asset.id === assetId);
        const originalCaption = formalAssets[assetIndex].caption.zh;
        expect(assetIndex).toBeGreaterThanOrEqual(0);

        await openAdmin(page);
        await selectMode(page, 'figures');
        await page.locator('#entitySearch').fill('frank-rosenblatt');
        await clickButton(page.locator('#entityList button[data-id="frank-rosenblatt"]'));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await clickButton(page.locator('[data-figure-section="assets"]'));
        const assetCard = page.locator(`[data-event-id="${eventId}"][data-asset-id="${assetId}"]`);
        await expect(assetCard.locator('[data-asset-action="edit"]')).toBeVisible();
        await clickButton(assetCard.locator('[data-asset-action="edit"]'));

        await expect(page.locator('#entityTypeNav [data-entity-type="events"]')).toHaveClass(/is-active/);
        await expect(page.locator('#fileSelect')).toHaveValue('assets.json');
        await expect(page.locator('[data-event-section="assets"]')).toHaveClass(/is-active/);
        const editorCard = page.locator(`[data-collection-index="${assetIndex}"]`);
        await expect(editorCard).toBeVisible();
        const captionField = editorCard.locator('[data-structured-field="caption.zh"]');
        await expect(captionField).toBeEditable();
        await expect(page.locator('#status')).toHaveText(`已打开资产 ${assetId}`);
        await captionField.fill(`${originalCaption} 编辑测试`);
        await waitForDraft(page);
        expect(readJson('archive', 'events', eventId, 'assets.json')[assetIndex].caption.zh).toBe(originalCaption);

        await selectMode(page, 'publish');
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#discardAllDraftsBtn'));
        await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
    });

    test('linking an existing figure image lists all events when no event filter is selected', async ({ page }) => {
        const figureId = 'frank-rosenblatt';
        const eventId = '1957-perceptron';

        await openAdmin(page);
        await selectMode(page, 'figures');
        await page.locator('#entitySearch').fill(figureId);
        await clickButton(page.locator(`#entityList button[data-id="${figureId}"]`));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await clickButton(page.locator('[data-figure-section="assets"]'));
        await clickButton(page.locator('#openExistingFigureImageBtn'));
        await expect(page.locator('#existingFigureImageDialog')).toBeVisible();
        await expect(page.locator('#existingImageEvent')).toHaveValue('');
        const availableEventIds = await page
            .locator('#existingImageEvent option')
            .evaluateAll((options) => options.map((option) => option.value).filter(Boolean));
        const eligibleAssetsByEvent = new Map();
        for (const availableEventId of availableEventIds) {
            const assetsFile = fixturePath('archive', 'events', availableEventId, 'assets.json');
            if (!fs.existsSync(assetsFile)) continue;
            const assets = readJson('archive', 'events', availableEventId, 'assets.json');
            const eligible = assets.filter(
                (asset) =>
                    asset.type === 'image' &&
                    asset.path &&
                    !(Array.isArray(asset.figureIds) && asset.figureIds.includes(figureId))
            );
            if (eligible.length) eligibleAssetsByEvent.set(availableEventId, eligible);
        }
        const expectedOptionValues = [
            ...new Set(
                [...eligibleAssetsByEvent.entries()].flatMap(([availableEventId, assets]) =>
                    assets.map((asset) => `${availableEventId}::${asset.id}`)
                )
            )
        ];
        const allEligibleCount = expectedOptionValues.length;
        const targetAssets = eligibleAssetsByEvent.get(eventId) || [];
        expect(targetAssets.length).toBeGreaterThan(0);
        await expect(page.locator('#existingImageAsset option')).toHaveCount(allEligibleCount);
        const optionValues = await page
            .locator('#existingImageAsset option')
            .evaluateAll((options) => options.map((option) => option.value));
        expect(optionValues).toContain(`${eventId}::${targetAssets[0].id}`);

        await page.locator('#existingImageEvent').selectOption(eventId);
        await expect(page.locator('#existingImageAsset option')).toHaveCount(
            new Set(targetAssets.map((asset) => asset.id)).size
        );
        await clickButton(page.locator('#cancelExistingFigureImageBtn'));
    });

    test('new figure and profile source buttons give feedback, focus the new card, and save the registry', async ({
        page
    }) => {
        await openAdmin(page);
        await selectMode(page, 'figures');
        await clickButton(page.locator('#newFigureBtn'));
        await expect(page.locator('#status')).toHaveText('已创建人物草稿，尚未保存');
        await expect(page.locator('#figureId')).toBeFocused();
        await expect
            .poll(async () => (await page.locator('#figurePanel').boundingBox())?.y ?? -1)
            .toBeGreaterThanOrEqual(82);
        await expect
            .poll(async () => (await page.locator('#figurePanel').boundingBox())?.y ?? Number.POSITIVE_INFINITY)
            .toBeLessThan(180);
        await page.locator('#figureNameZh').fill('后台测试人物');
        await page.locator('#figureNameEn').fill('Admin Test Person');
        await expect(page.locator('#figureId')).toHaveValue('admin-test-person');
        const figureId = await page.locator('#figureId').inputValue();

        await clickButton(page.locator('[data-figure-section="sources"]'));
        await clickButton(page.locator('#addFigureProfileSourceBtn'));
        await expect(page.locator('#status')).toHaveText('已新增资料来源，尚未保存');
        const sourceCard = page.locator('[data-profile-source-index="0"]');
        await expect(sourceCard).toBeVisible();
        await expect(sourceCard.locator('[data-profile-source-field="label.zh"]')).toBeFocused();
        const sourceBox = await sourceCard.boundingBox();
        expect(sourceBox.y).toBeGreaterThanOrEqual(0);
        expect(sourceBox.y).toBeLessThan(900);
        await sourceCard.locator('[data-profile-source-field="type"]').fill('profile');
        await sourceCard.locator('[data-profile-source-field="label.zh"]').fill('测试资料');
        await sourceCard.locator('[data-profile-source-field="label.en"]').fill('Test profile');
        await sourceCard.locator('[data-profile-source-field="url"]').fill('https://example.com/admin-test-person');

        await clickButton(page.locator('#addFigureProfileSourceBtn'));
        const secondSource = page.locator('[data-profile-source-index="1"]');
        await secondSource.locator('[data-profile-source-field="type"]').fill('official-page');
        await secondSource.locator('[data-profile-source-field="label.zh"]').fill('待移除资料');
        await secondSource.locator('[data-profile-source-field="label.en"]').fill('Temporary profile');
        await secondSource.locator('[data-profile-source-field="url"]').fill('https://example.com/temporary');
        await clickButton(secondSource.locator('[data-profile-source-action="up"]'));
        await expect(page.locator('#status')).toHaveText('已修改资料来源，尚未保存');
        await expect(
            page.locator('[data-profile-source-index="0"] [data-profile-source-field="label.zh"]')
        ).toHaveValue('待移除资料');
        await clickButton(page.locator('[data-profile-source-index="0"] [data-profile-source-action="down"]'));
        await expect(
            page.locator('[data-profile-source-index="1"] [data-profile-source-field="label.zh"]')
        ).toHaveValue('待移除资料');
        await clickButton(page.locator('[data-profile-source-index="1"] [data-profile-source-action="remove"]'));
        await expect(page.locator('[data-profile-source-index]')).toHaveCount(1);

        await waitForDraft(page);
        expect(readJson('archive', 'figures', 'figures.json').some((item) => item.id === figureId)).toBe(false);

        await keepAndApplyDraft(page);
        const savedFigure = readJson('archive', 'figures', 'figures.json').find((item) => item.id === figureId);
        expect(savedFigure.name).toEqual({ en: 'Admin Test Person', zh: '后台测试人物' });
        expect(savedFigure.profileSources).toEqual([
            {
                type: 'profile',
                label: { en: 'Test profile', zh: '测试资料' },
                url: 'https://example.com/admin-test-person'
            }
        ]);
    });

    test('figure merges are staged as semantic draft changes and can be discarded', async ({ page }) => {
        const sourceFigureId = 'admin-test-person';
        const formalRegistryPath = fixturePath('archive', 'figures', 'figures.json');
        const formalRegistrySource = fs.readFileSync(formalRegistryPath, 'utf8');
        const figures = JSON.parse(formalRegistrySource);
        const sourceFigure = figures.find((figure) => figure.id === sourceFigureId);
        const targetFigure = figures.find(
            (figure) => figure.id !== sourceFigureId && figure.type === sourceFigure.type
        );
        expect(targetFigure).toBeTruthy();

        const previewResponse = await page.request.get(
            `/api/archive/figure-merge-preview?sourceFigureId=${sourceFigureId}&targetFigureId=${targetFigure.id}`
        );
        expect(previewResponse.ok()).toBe(true);
        const preview = await previewResponse.json();
        const mergeResponse = await page.request.post('/api/archive/figure-merge', {
            data: {
                sourceFigureId,
                targetFigureId: targetFigure.id,
                expectedRevision: preview.revision
            }
        });
        expect(mergeResponse.ok()).toBe(true);
        expect(fs.readFileSync(formalRegistryPath, 'utf8')).toBe(formalRegistrySource);

        const draftFiguresResponse = await page.request.get('/api/archive/figures');
        const draftFigures = await draftFiguresResponse.json();
        expect(draftFigures.items.some((figure) => figure.id === sourceFigureId)).toBe(false);
        const publishStatus = await (await page.request.get('/api/archive/publish-status')).json();
        expect(publishStatus.draft.summary.active).toBeGreaterThan(0);
        expect(publishStatus.draft.active.some((change) => change.group === '人物 / 实体')).toBe(true);

        const discardResponse = await page.request.post('/api/archive/draft-decision', {
            data: { all: true, decision: 'discarded' }
        });
        expect(discardResponse.ok()).toBe(true);
        expect(fs.readFileSync(formalRegistryPath, 'utf8')).toBe(formalRegistrySource);
    });

    test('default avatar failures are shown in an alert dialog', async ({ page }) => {
        const errorMessage =
            'archive/figures/figures.json assigns default avatar resources/images/test.jpg to multiple people';
        await page.route('**/api/archive/figure-default-avatar', (route) =>
            route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({ error: errorMessage })
            })
        );
        await openAdmin(page);
        await selectMode(page, 'figures');
        await page.locator('#entitySearch').fill('frank-rosenblatt');
        await clickButton(page.locator('#entityList button[data-id="frank-rosenblatt"]'));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await clickButton(page.locator('[data-figure-section="assets"]'));
        const setDefaultButton = page.locator(
            '[data-event-id="1957-perceptron"][data-asset-id="asset-1957-perceptron-figure-avatar-frank-rosenblatt"] [data-asset-action="set-default"]'
        );
        await expect(setDefaultButton).toBeEnabled();

        const alertMessage = new Promise((resolve) => {
            page.on('dialog', async (dialog) => {
                if (dialog.type() === 'confirm') {
                    await dialog.accept();
                    return;
                }
                resolve(dialog.message());
                await dialog.dismiss();
            });
        });
        await clickButton(setDefaultButton);
        await expect(page.locator('#status')).toHaveText('');
        expect(await alertMessage).toBe(`设置默认头像失败：${errorMessage}`);
    });

    test('other operation errors use alert dialogs without rendering page errors', async ({ page }) => {
        await openAdmin(page);
        await selectMode(page, 'storylines');
        await clickButton(page.locator('#entityList [data-storyline-id="deep-learning"]'));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await page.locator('#storylineEventSelect').selectOption('');

        const alertMessage = new Promise((resolve) => {
            page.once('dialog', async (dialog) => {
                resolve(dialog.message());
                await dialog.dismiss();
            });
        });
        await clickButton(page.locator('#addStorylineEventBtn'));

        await expect(page.locator('#status')).toHaveText('');
        expect(await alertMessage).toBe('请先选择要添加的事件');
    });

    test('collection action buttons report changes and keep newly added cards in view', async ({ page }) => {
        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="sources"]'));
        await expect(page.locator('#structuredTitle')).toHaveText('来源维护');
        await expect(page.locator('#structuredAddBtn')).toBeVisible();
        const initialCount = await page.locator('[data-collection-index]').count();

        await clickButton(page.locator('#structuredAddBtn'));
        await expect(page.locator('#status')).toHaveText('已修改条目，尚未保存');
        let newCard = page.locator(`[data-collection-index="${initialCount}"]`);
        await expect(newCard.locator('[data-structured-field="label.zh"]')).toBeFocused();
        const cardBox = await newCard.boundingBox();
        expect(cardBox.y).toBeGreaterThanOrEqual(0);
        expect(cardBox.y).toBeLessThan(900);

        await clickButton(newCard.locator('[data-collection-action="duplicate"]'));
        await expect(page.locator('#status')).toHaveText('已修改条目，尚未保存');
        await expect(page.locator('[data-collection-index]')).toHaveCount(initialCount + 2);

        newCard = page.locator(`[data-collection-index="${initialCount + 1}"]`);
        await clickButton(newCard.locator('[data-collection-action="up"]'));
        await expect(page.locator('#status')).toHaveText('已修改条目，尚未保存');
        await clickButton(page.locator(`[data-collection-index="${initialCount}"] [data-collection-action="down"]`));
        await expect(page.locator('#status')).toHaveText('已修改条目，尚未保存');
        await clickButton(
            page.locator(`[data-collection-index="${initialCount + 1}"] [data-collection-action="remove"]`)
        );
        await expect(page.locator('#status')).toHaveText('已修改条目，尚未保存');
        await waitForDraft(page);

        await clickButton(page.locator('#loadBtn'));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await expect(page.locator('[data-collection-index]')).toHaveCount(initialCount + 1);

        await selectMode(page, 'publish');
        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#discardAllDraftsBtn'));
        await expect(page.locator('#publishChangeSummary')).toContainText('待处理 0 项');
    });
});
