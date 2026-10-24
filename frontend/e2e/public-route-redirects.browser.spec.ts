import { expect, test } from '@playwright/test';

test('inactive registration route redirects to login without API traffic', async ({ page }) => {
  const apiRequests: string[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/register');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
