import { test, expect } from '@playwright/test';

test.describe('Municipality Isolation', () => {
  test('unauthenticated user is redirected to login from municipality route', async ({ page }) => {
    await page.goto('/kmc/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated user cannot access different municipality URL', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Should be redirected to their municipality dashboard
    await expect(page).toHaveURL(/kmc.*dashboard/i, { timeout: 10000 });

    // Try to access a different (non-existent) municipality
    await page.goto('/other-mun-xyz/dashboard');

    // Should be redirected back to their own municipality or login — not stay on wrong slug
    await expect(page).not.toHaveURL(/\/other-mun-xyz\//);
  });

  test('login redirects to municipality-scoped dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'municipalityadmin');
    await page.fill('input[name="password"]', 'Municipality@123');
    await page.click('button[type="submit"]');

    // URL should contain municipality slug
    await expect(page).toHaveURL(/\/kmc\//i, { timeout: 10000 });
  });

  test('API requests include X-Municipality-Id header', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');

    const apiRequests: Array<{ url: string; headers: Record<string, string> }> = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/')) {
        apiRequests.push({ url: request.url(), headers: request.headers() });
      }
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const authenticatedRequests = apiRequests.filter(r => !r.url.includes('/auth/login'));
    for (const req of authenticatedRequests) {
      expect(req.headers['x-municipality-id']).toBeTruthy();
    }
  });

  test('navigation stays within municipality scope', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    const url = page.url();
    const municipalitySlug = url.match(/\/([^/]+)\/dashboard/)?.[1];
    expect(municipalitySlug).toBeTruthy();

    const studentsLink = page.locator('a[href*="students"]').first();
    if (await studentsLink.isVisible()) {
      await studentsLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain(`/${municipalitySlug}/`);
    }
  });

  test('direct URL manipulation to wrong municipality shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Manually navigate to a completely different municipality
    await page.goto('/nonexistent-mun-xyz/students');

    // Should NOT stay on the wrong municipality path
    await expect(page).not.toHaveURL(/nonexistent-mun-xyz/);
  });
});
