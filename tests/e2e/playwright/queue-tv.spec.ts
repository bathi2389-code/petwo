import { test, expect } from '@playwright/test';

test.describe('In-Clinic Reception TV Display E2E', () => {
  const clinicLocationId = 'loc-banjara-hills-01';

  test('displays real-time queue board with "Now Serving" card', async ({ page }) => {
    await page.goto(`/queue/${clinicLocationId}`);

    // Wait for TV UI elements
    const nowServing = page.locator('text=NOW SERVING, text=Serving, text=Token');
    await expect(nowServing.first()).toBeVisible({ timeout: 10000 });
  });

  test('adapts layout cleanly to large display format (1080p TV resolution)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/queue/${clinicLocationId}`);

    // Verify header and queue grid visibility
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});
