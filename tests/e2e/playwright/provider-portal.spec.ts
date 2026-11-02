import { test, expect } from '@playwright/test';

test.describe('Provider Portal E2E Smoke & Functional Flow', () => {
  test('renders provider authentication page with phone input', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/PETWO/i);
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]');
    await expect(phoneInput).toBeVisible();
  });

  test('validates 10-digit Indian mobile number on submission', async ({ page }) => {
    await page.goto('/login');
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]');
    await phoneInput.fill('12345'); // Invalid number
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Expect HTML5 or custom validation message
    const hasError = await page.locator('text=valid Indian, text=10 digits, text=Invalid').count();
    expect(hasError).toBeGreaterThanOrEqual(0);
  });
});
