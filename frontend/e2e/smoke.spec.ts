import { test, expect } from '@playwright/test';

test('smoke: can open login page', async ({ page }) => {
  await page.goto('/login', { timeout: 15000 });
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  const title = await page.title();
  console.log('Page title:', title);
  console.log('URL:', page.url());
});
