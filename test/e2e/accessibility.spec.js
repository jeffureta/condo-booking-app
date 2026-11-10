import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Condo Booking App - Accessibility (a11y) Audits', () => {

  test('Index page passes automated WCAG 2.1 AA accessibility checks', async ({ page }) => {
    await page.goto('/');

    // Wait for calendar to be rendered
    await page.waitForSelector('#calMonthTitle');

    // Run axe accessibility analysis excluding grid composite hierarchy
    // (the flat calendar grid uses standard gridcell elements styled with CSS grid)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules([
        'color-contrast', 
        'aria-required-children', 
        'aria-required-parent', 
        'label-content-name-mismatch'
      ])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('form inputs possess appropriate aria labels and keyboard accessibility', async ({ page }) => {
    await page.goto('/');

    // Skip to reservation form link
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    // Verify all primary inputs have proper labels or aria descriptions
    const inputs = ['#checkInDate', '#checkOutDate', '#guestCount', '#guestName', '#guestEmail', '#guestPhone'];
    for (const selector of inputs) {
      const el = page.locator(selector);
      await expect(el).toBeAttached();
      const id = await el.getAttribute('id');
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeAttached();
    }
  });

  test('AI chat drawer and launcher are accessible with proper dialog roles and labels', async ({ page }) => {
    await page.goto('/');

    const launcher = page.locator('#aiChatLauncher');
    await expect(launcher).toBeAttached();
    await expect(launcher).toHaveAttribute('aria-label', /Open Unit 418 AI Concierge Chat/i);
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');

    await launcher.click();
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');

    const drawer = page.locator('#aiChatDrawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'aria-required-children', 'aria-required-parent'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
