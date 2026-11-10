import { test, expect } from '@playwright/test';

test.describe('Condo Booking App - Mobile Viewport & Responsiveness (320px - 375px)', () => {

  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/mock/reset');
  });

  test('no horizontal scrollbar on 375px (iPhone 13 / SE) and 320px (Small Phone)', async ({ page }) => {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 667 });
      await page.goto('/');
      await page.waitForSelector('#calMonthTitle');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    }
  });

  test('form inputs and AI chat input enforce 16px font-size to prevent iOS Safari auto-zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const inputSelectors = [
      '#checkInDate',
      '#checkOutDate',
      '#guestCount',
      '#guestName',
      '#guestEmail',
      '#guestPhone',
      '#aiChatInput'
    ];

    for (const selector of inputSelectors) {
      const el = page.locator(selector);
      await expect(el).toBeAttached();
      const fontSize = await el.evaluate(node => window.getComputedStyle(node).fontSize);
      expect(fontSize).toBe('16px');
    }
  });

  test('touch targets on navigation buttons and submit CTA are >= 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const prevBtnBox = await page.locator('#calPrevBtn').boundingBox();
    expect(prevBtnBox.width).toBeGreaterThanOrEqual(44);
    expect(prevBtnBox.height).toBeGreaterThanOrEqual(44);

    const nextBtnBox = await page.locator('#calNextBtn').boundingBox();
    expect(nextBtnBox.width).toBeGreaterThanOrEqual(44);
    expect(nextBtnBox.height).toBeGreaterThanOrEqual(44);

    const submitBtnBox = await page.locator('#submitBtn').boundingBox();
    expect(submitBtnBox.height).toBeGreaterThanOrEqual(44);

    const aiLauncherBox = await page.locator('#aiChatLauncher').boundingBox();
    expect(aiLauncherBox.height).toBeGreaterThanOrEqual(44);
  });

  test('calendar cells display compact pricing sub-labels and tap selection works without dragging', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#calMonthTitle');

    // Check that available dates render compact rates
    const firstSub = page.locator('.cal-cell:not(.cal-disabled):not(.cal-other-month):not(.cal-booked) .cal-cell-sub').first();
    await expect(firstSub).toBeVisible();
    await expect(firstSub).toHaveText(/^₱[\d\.]+k$/);

    // Pick two available cells by clicking/tapping
    const availableCells = page.locator('.cal-cell:not(.cal-disabled):not(.cal-other-month):not(.cal-booked)');
    const count = await availableCells.count();
    expect(count).toBeGreaterThan(5);

    const cell1 = availableCells.nth(2);
    const cell2 = availableCells.nth(4);

    const date1 = await cell1.getAttribute('data-date');
    const date2 = await cell2.getAttribute('data-date');

    // 1st tap: check-in
    await cell1.click();
    await expect(page.locator('#checkInDate')).toHaveValue(date1);
    await expect(page.locator('#checkOutDate')).toHaveValue('');

    // 2nd tap: check-out
    await cell2.click();
    await expect(page.locator('#checkInDate')).toHaveValue(date1);
    await expect(page.locator('#checkOutDate')).toHaveValue(date2);

    // Stay summary should appear without horizontal overflow
    const staySummary = page.locator('#staySummaryCard');
    await expect(staySummary).toBeVisible();

    const isOverflowingAfterSummary = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowingAfterSummary).toBe(false);
  });

  test('mobile AI drawer opens full-viewport with body scroll locked and quick-chips unobstructed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const launcher = page.locator('#aiChatLauncher');
    await launcher.click();

    const drawer = page.locator('#aiChatDrawer');
    await expect(drawer).toBeVisible();

    // Verify body overflow is locked to prevent background scrolling
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Verify drawer width matches viewport
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox.width).toBe(375);

    // Verify quick question chips are visible immediately
    const firstChip = page.locator('.ai-chip-btn').first();
    await expect(firstChip).toBeVisible();

    // Close drawer and verify body scroll unlocked
    await page.locator('#aiChatCloseBtn').click();
    await expect(drawer).toBeHidden();
    const bodyOverflowRestored = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowRestored).toBe('');
  });
});
