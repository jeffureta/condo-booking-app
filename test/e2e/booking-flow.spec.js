import { test, expect } from '@playwright/test';

test.describe('Condo Booking App - Full Booking Flow E2E', () => {

  test.beforeEach(async ({ page, request }) => {
    // Reset mock backend bookings before each test for clean isolation
    await request.post('/api/mock/reset');
    // Navigate to local dev server (backed by dev-server.js & GAS mocks)
    await page.goto('/');
  });

  test('loads condo information and calendar properly', async ({ page }) => {
    await expect(page).toHaveTitle(/Unit 418 Serin East Tagaytay/);
    
    // Check key hero information
    const heading = page.locator('h1');
    await expect(heading).toContainText('Unit 418 • Serin East Tagaytay');

    // Calendar container should be present
    const calendarMonth = page.locator('#calMonthTitle');
    await expect(calendarMonth).toBeVisible();
  });

  test('calculates stay quote and completes booking reservation with mock backend', async ({ page }) => {
    const checkInInput = page.locator('#checkInDate');
    const checkOutInput = page.locator('#checkOutDate');

    // Pick dates 35-38 days ahead to avoid mock booked dates
    const d1 = new Date();
    d1.setDate(d1.getDate() + 35);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 38); // 3 nights

    const checkInStr = d1.toISOString().split('T')[0];
    const checkOutStr = d2.toISOString().split('T')[0];

    await checkInInput.fill(checkInStr);
    await checkInInput.dispatchEvent('change');

    await checkOutInput.fill(checkOutStr);
    await checkOutInput.dispatchEvent('change');

    // Check pricing summary card update
    const staySummaryCard = page.locator('#staySummaryCard');
    await expect(staySummaryCard).toBeVisible();

    const summaryTotalPrice = page.locator('#summaryTotalPrice');
    await expect(summaryTotalPrice).toBeVisible();
    await expect(summaryTotalPrice).not.toBeEmpty();

    // Fill in Guest Details
    await page.locator('#guestCount').selectOption('4');
    await page.locator('#guestName').fill('Maria Santos');
    await page.locator('#guestEmail').fill('maria.santos@example.com');
    await page.locator('#guestPhone').fill('+63 917 123 4567');

    // Submit booking form
    const submitBtn = page.locator('#submitBtn');
    await submitBtn.click();

    // Verify confirmation box displays
    const confirmationBox = page.locator('#confirmationBox');
    await expect(confirmationBox).toBeVisible({ timeout: 10000 });

    const confText = page.locator('#confText');
    await expect(confText).toContainText('CND-');
    await expect(confText).toContainText('Maria Santos');

    // Verify Add to Google Calendar & ICS buttons exist
    const addToGCal = page.locator('#addToGoogleCalBtn');
    await expect(addToGCal).toBeVisible();
    await expect(addToGCal).toHaveAttribute('href', /calendar\.google\.com/);
  });

  test('validates required fields before allowing submission', async ({ page }) => {
    const submitBtn = page.locator('#submitBtn');
    await submitBtn.click();

    const statusMessage = page.locator('#statusMessage');
    await expect(statusMessage).toBeVisible();
    await expect(statusMessage).toContainText(/Please select both a check-in and check-out date/i);
  });

  test('interacts with Unit 418 Client-Side AI Concierge and applies dates via 1-tap action', async ({ page }) => {
    // Open AI Chat Drawer
    const launcher = page.locator('#aiChatLauncher');
    await expect(launcher).toBeVisible();
    await launcher.click();

    const drawer = page.locator('#aiChatDrawer');
    await expect(drawer).toBeVisible();

    // Click quick chip "Are dogs allowed?"
    const dogChip = page.locator('button:has-text("Are dogs allowed?")');
    await dogChip.click();

    // Verify AI response bubble appeared in the message log
    const lastBotMsg = page.locator('.ai-msg-bot .ai-msg-bubble').last();
    await expect(lastBotMsg).toContainText(/pet|dog/i);

    // Ask in Taglish about cooking
    const input = page.locator('#aiChatInput');
    await input.fill('Pwede ba mag-cook ng breakfast?');
    await page.locator('#aiChatSendBtn').click();

    await expect(page.locator('.ai-msg-bot .ai-msg-bubble').last()).toContainText(/light cooking/i);

    // Ask for date quote in January 2027 (avoiding any booked dates)
    await input.fill('Is 2027-01-15 to 2027-01-18 available for 3 guests?');
    await page.locator('#aiChatSendBtn').click();

    // Check for 1-tap Apply action button
    const applyBtn = page.locator('.ai-apply-booking-btn').last();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Drawer should close and form inputs should be auto-filled
    await expect(drawer).toBeHidden();
    await expect(page.locator('#checkInDate')).toHaveValue('2027-01-15');
    await expect(page.locator('#checkOutDate')).toHaveValue('2027-01-18');
    await expect(page.locator('#guestCount')).toHaveValue('3');

    // Summary card should be visible
    const staySummaryCard = page.locator('#staySummaryCard');
    await expect(staySummaryCard).toBeVisible();
  });
});
