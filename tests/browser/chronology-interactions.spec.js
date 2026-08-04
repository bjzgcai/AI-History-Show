const { test, expect } = require('@playwright/test');

async function openChronology(page) {
    await page.goto('/index.html');
    const scroller = page.locator('.chrono-scroll');
    await expect(scroller).toBeVisible();
    return scroller;
}

async function getVisibleCardPoint(scroller, excludedEventId = '') {
    return scroller.evaluate((element, excludedId) => {
        const bounds = element.getBoundingClientRect();
        const card = Array.from(element.querySelectorAll('.chrono-event-card')).find((item) => {
            if (item.dataset.eventId === excludedId) return false;
            const box = item.getBoundingClientRect();
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            return (
                centerX > bounds.x + 80 &&
                centerX < bounds.right - 80 &&
                centerY > bounds.y + 20 &&
                centerY < Math.min(bounds.bottom, window.innerHeight) - 20
            );
        });
        if (!card) return null;
        const box = card.getBoundingClientRect();
        return {
            eventId: card.dataset.eventId,
            x: box.x + box.width / 2,
            y: box.y + box.height / 2
        };
    }, excludedEventId);
}

async function performTouchSwipe(page, options) {
    const { x, y, xDistance = 0, yDistance = 0, steps = 12 } = options;
    const session = await page.context().newCDPSession(page);
    try {
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y, id: 1 }]
        });
        for (let step = 1; step <= steps; step += 1) {
            await session.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [
                    {
                        x: x + (xDistance * step) / steps,
                        y: y + (yDistance * step) / steps,
                        id: 1
                    }
                ]
            });
        }
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: []
        });
    } finally {
        await session.detach();
    }
}

test('@desktop desktop wheel and card drag follow the scaled timeline', async ({ page }) => {
    const scroller = await openChronology(page);
    const metrics = await scroller.evaluate((element) => {
        element.scrollLeft = 1000;
        const bounds = element.getBoundingClientRect();
        return {
            scale: bounds.width / element.clientWidth,
            scrollLeft: element.scrollLeft,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    });

    await page.mouse.move(metrics.x + metrics.width / 2, metrics.y + metrics.height / 2);
    await page.mouse.wheel(0, 600);
    let wheelVisualDelta = 0;
    await expect
        .poll(async () => {
            wheelVisualDelta =
                ((await scroller.evaluate((element) => element.scrollLeft)) - metrics.scrollLeft) * metrics.scale;
            return wheelVisualDelta;
        })
        .toBeGreaterThan(580);
    expect(wheelVisualDelta).toBeLessThan(620);

    await scroller.evaluate((element) => {
        element.scrollLeft = 5000;
    });
    const dragStart = await getVisibleCardPoint(scroller);
    expect(dragStart).not.toBeNull();
    const beforeDrag = await scroller.evaluate((element) => element.scrollLeft);

    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(dragStart.x - 500, dragStart.y, { steps: 12 });
    await page.mouse.up();

    const afterDrag = await scroller.evaluate((element) => element.scrollLeft);
    const dragVisualDelta = (afterDrag - beforeDrag) * metrics.scale;
    expect(dragVisualDelta).toBeGreaterThan(480);
    expect(dragVisualDelta).toBeLessThan(520);
    await expect(page).toHaveURL(/\/index\.html$/);

    const otherCard = await getVisibleCardPoint(scroller, dragStart.eventId);
    expect(otherCard).not.toBeNull();
    await page.mouse.click(otherCard.x, otherCard.y);
    await expect(page).toHaveURL(new RegExp(`uiMode=detail&event=${otherCard.eventId}`));
});

test('@mobile mobile touch gestures keep vertical page and horizontal timeline scrolling', async ({ page }) => {
    let scroller = await openChronology(page);
    const initial = await scroller.evaluate((element) => {
        element.scrollLeft = 1000;
        window.scrollTo(0, 0);
        const bounds = element.getBoundingClientRect();
        return {
            scrollLeft: element.scrollLeft,
            scrollHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight,
            centerX: bounds.x + bounds.width / 2,
            startY: Math.min(window.innerHeight - 60, bounds.y + bounds.height / 2)
        };
    });
    expect(initial.scrollHeight).toBeGreaterThan(initial.viewportHeight);

    await performTouchSwipe(page, {
        x: initial.centerX,
        y: initial.startY,
        yDistance: -250
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    expect(await scroller.evaluate((element) => element.scrollLeft)).toBe(initial.scrollLeft);

    scroller = await openChronology(page);
    const horizontal = await scroller.evaluate((element) => {
        element.scrollLeft = 1000;
        window.scrollTo(0, 0);
        const bounds = element.getBoundingClientRect();
        return {
            startX: bounds.right - 48,
            y: Math.min(window.innerHeight - 80, bounds.y + bounds.height / 2)
        };
    });
    await performTouchSwipe(page, {
        x: horizontal.startX,
        y: horizontal.y,
        xDistance: -250
    });
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(1200);
    expect(await scroller.evaluate((element) => element.scrollLeft)).toBeLessThan(1350);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    scroller = await openChronology(page);
    await scroller.evaluate((element) => {
        element.scrollLeft = 1000;
    });
    const card = await getVisibleCardPoint(scroller);
    expect(card).not.toBeNull();
    await page.touchscreen.tap(card.x, card.y);
    await expect(page).toHaveURL(new RegExp(`uiMode=detail&event=${card.eventId}`));
});
