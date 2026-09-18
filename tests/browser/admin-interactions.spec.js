'use strict';

const fs = require('node:fs');
const path = require('node:path');
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

test.describe.serial('Archive Admin button feedback and file linkage', () => {
    test('draft validation, save, saved validation, and generation use the expected data', async ({ page }) => {
        const eventPath = fixturePath('archive', 'events', '1956-dartmouth', 'event.json');
        const original = readJson('archive', 'events', '1956-dartmouth', 'event.json');
        const originalTitle = original.defaultPresentation.displayTitle.zh;
        const savedTitle = `${originalTitle} Admin E2E`;
        const unsavedTitle = `${savedTitle} 未保存`;

        await openAdmin(page);
        await loadEvent(page, '1956-dartmouth');
        await clickButton(page.locator('[data-event-section="presentation"]'));
        const titleField = page.locator('[data-structured-field="defaultPresentation.displayTitle.zh"]');
        await expect(titleField).toHaveValue(originalTitle);
        await titleField.fill(savedTitle);
        await expect(page.locator('#status')).toHaveText('已修改结构化字段，尚未保存');

        await clickButton(page.locator('#validateDraftBtn'));
        await expect(page.locator('#status')).toHaveText('当前编辑内容校验通过，尚未保存', {
            timeout: 120_000
        });
        await expect(page.locator('#taskOutputPanel')).toBeVisible();
        await expect(page.locator('#taskOutputTitle')).toHaveText('校验结果');
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(originalTitle);

        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#generateBtn'));
        await expect(page.locator('#status')).toHaveText('运行时数据生成成功', { timeout: 120_000 });
        const generatedBeforeSave = fs.readFileSync(fixturePath('milestones-data.js'), 'utf8');
        expect(generatedBeforeSave).not.toContain(savedTitle);

        await clickButton(page.locator('#closeTaskOutputBtn'));
        await expect(page.locator('#taskOutputPanel')).toBeHidden();

        await clickButton(page.locator('#saveBtn'));
        await expect(page.locator('#status')).toHaveText('内容已保存');
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(savedTitle);

        await titleField.fill(unsavedTitle);
        await clickButton(page.locator('#loadBtn'));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await expect(titleField).toHaveValue(savedTitle);

        await clickButton(page.locator('[data-event-section="advanced"]'));
        const jsonEditor = page.locator('#editor');
        await jsonEditor.evaluate((editor) => {
            const draft = JSON.parse(editor.value);
            draft.id = 'wrong-id';
            editor.value = JSON.stringify(draft, null, 2);
            const ChangeEvent = editor.ownerDocument.defaultView.Event;
            editor.dispatchEvent(new ChangeEvent('change', { bubbles: true }));
        });
        await clickButton(page.locator('#validateDraftBtn'));
        await expect(page.locator('#status')).toHaveText('当前编辑内容校验失败，尚未保存', {
            timeout: 120_000
        });
        await expect(page.locator('#validationOutput')).toContainText('must match directory name');
        expect(JSON.parse(fs.readFileSync(eventPath, 'utf8')).defaultPresentation.displayTitle.zh).toBe(savedTitle);
        await clickButton(page.locator('#loadBtn'));
        await expect(jsonEditor).toHaveValue(/"id": "1956-dartmouth"/);

        await clickButton(page.locator('#validateBtn'));
        await expect(page.locator('#status')).toHaveText('Archive 校验已通过', { timeout: 120_000 });
        await expect(page.locator('#taskOutputTitle')).toHaveText('校验结果');

        page.once('dialog', (dialog) => dialog.accept());
        await clickButton(page.locator('#generateBtn'));
        await expect(page.locator('#status')).toHaveText('运行时数据生成成功', { timeout: 120_000 });
        expect(fs.readFileSync(fixturePath('milestones-data.js'), 'utf8')).toContain(savedTitle);
        expect(fs.readFileSync(fixturePath('milestones-data-default.js'), 'utf8')).toContain(savedTitle);
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
        expect(
            JSON.parse(fs.readFileSync(storylinePath, 'utf8')).events.some((item) => item.eventId === candidateId)
        ).toBe(false);

        await clickButton(page.locator('#saveBtn'));
        await expect(page.locator('#status')).toHaveText('内容已保存');
        const saved = JSON.parse(fs.readFileSync(storylinePath, 'utf8'));
        expect(saved.events.filter((item) => item.eventId === candidateId)).toHaveLength(1);
        expect(saved.events.map((item) => item.order)).toEqual(saved.events.map((_, index) => (index + 1) * 10));
        const savedYears = saved.events.map((item) => {
            const event = readJson('archive', 'events', item.eventId, 'event.json');
            const parsed = Number.parseFloat(String(event.year || ''));
            return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
        });
        expect(savedYears).toEqual([...savedYears].sort((left, right) => left - right));

        await page.evaluate((eventId) => {
            const confirm = window.confirm;
            window.confirm = () => true;
            document.querySelector(`[data-remove-storyline-event="${eventId}"]`).click();
            window.confirm = confirm;
        }, candidateId);
        await expect(page.locator('#status')).toHaveText('事件已从故事线移除，尚未保存');
        await expect(addedItem).toHaveCount(0);
        await clickButton(page.locator('#saveBtn'));
        await expect(page.locator('#status')).toHaveText('内容已保存');
        expect(
            JSON.parse(fs.readFileSync(storylinePath, 'utf8')).events.some((item) => item.eventId === candidateId)
        ).toBe(false);
    });

    test('new figure and profile source buttons give feedback, focus the new card, and save the registry', async ({
        page
    }) => {
        const figureId = 'admin-e2e-test-person';

        await openAdmin(page);
        await selectMode(page, 'figures');
        await clickButton(page.locator('#newFigureBtn'));
        await expect(page.locator('#status')).toHaveText('已创建人物草稿，尚未保存');
        await expect(page.locator('#figureId')).toBeFocused();
        await page.locator('#figureId').fill(figureId);
        await page.locator('#figureNameZh').fill('后台测试人物');
        await page.locator('#figureNameEn').fill('Admin Test Person');

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

        await clickButton(page.locator('#validateDraftBtn'));
        await expect(page.locator('#status')).toHaveText('当前编辑内容校验通过，尚未保存', {
            timeout: 120_000
        });
        expect(readJson('archive', 'figures', 'figures.json').some((item) => item.id === figureId)).toBe(false);

        await clickButton(page.locator('#saveBtn'));
        await expect(page.locator('#status')).toHaveText('内容已保存');
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

        await clickButton(page.locator('#loadBtn'));
        await expect(page.locator('#status')).toHaveText('内容已加载');
        await expect(page.locator('[data-collection-index]')).toHaveCount(initialCount);

        await clickButton(page.locator('#refreshBtn'));
        await expect(page.locator('#currentEntity')).toHaveText('尚未选择实体');
        await expect(page.locator('#taskOutputPanel')).toBeHidden();
    });
});
