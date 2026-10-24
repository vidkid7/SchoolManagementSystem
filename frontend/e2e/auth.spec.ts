import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const apiRequests: string[] = [];
    await page.route(/\/api\/v1\//, async (route) => {
      const request = route.request();
      apiRequests.push(`${request.method()} ${new URL(request.url()).pathname}`);
      if (new URL(request.url()).pathname.endsWith('/auth/login')) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.goto('/login');
    await page.locator('input[name="username"]').fill('qa-invalid-user');
    await page.locator('input[name="password"]').fill('qa-invalid-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
    expect(apiRequests).toEqual(['POST /api/v1/auth/login']);
  });

  test('should not submit with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Form should not navigate away — still on /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/kmc/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    const apiRequests: string[] = [];
    await page.route(/\/api\/v1\//, async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      apiRequests.push(`${request.method()} ${pathname}`);
      if (pathname.endsWith('/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { userId: 999001, username: 'qa-local-admin', email: 'qa-local@example.test', role: 'School_Admin' },
              accessToken: 'qa-local-access-token',
              refreshToken: 'qa-local-refresh-token',
            },
          }),
        });
        return;
      }
      if (request.method() !== 'GET') {
        await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unexpected QA write' }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.goto('/login');
    await page.locator('input[name="username"]').fill('qa-local-admin');
    await page.locator('input[name="password"]').fill('qa-local-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    expect(apiRequests[0]).toBe('POST /api/v1/auth/login');
    expect(apiRequests.every((request) => request.startsWith('GET ') || request === 'POST /api/v1/auth/login')).toBe(true);
  });
});
