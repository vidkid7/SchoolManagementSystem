import { test, expect } from '@playwright/test';

test.describe('Municipality Isolation', () => {
  test('unauthenticated user is redirected to login from municipality route', async ({ page }) => {
    await page.goto('/seed-mun-001/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated user cannot access different municipality URL', async ({ page }) => {
    // Login as a user from municipality SEED-MUN-001
    await page.goto('/login');
    await page.fill('input[name="username"]', 'seed-principal-1-1');
    await page.fill('input[name="password"]', 'SeedPass123!');
    await page.click('button[type="submit"]');

    // Should be redirected to their municipality dashboard
    await expect(page).toHaveURL(/seed-mun-001.*dashboard/i, { timeout: 10000 });

    // Try to access municipality 2
    await page.goto('/seed-mun-002/dashboard');

    // Should be redirected back to their own municipality
    await expect(page).not.toHaveURL(/seed-mun-002/);
    await expect(page).toHaveURL(/seed-mun-001/);
  });

  test('login redirects to municipality-scoped dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'seed-munadmin-1-1');
    await page.fill('input[name="password"]', 'SeedPass123!');
    await page.click('button[type="submit"]');

    // URL should contain municipality slug
    await expect(page).toHaveURL(/\/seed-mun-001\//i, { timeout: 10000 });
  });

  test('API requests include X-Municipality-Id header', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'seed-principal-1-1');
    await page.fill('input[name="password"]', 'SeedPass123!');

    // Intercept API calls
    const apiRequests: Array<{ url: string; headers: Record<string, string> }> = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/')) {
        apiRequests.push({
          url: request.url(),
          headers: request.headers(),
        });
      }
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check that API requests have the municipality header
    const authenticatedRequests = apiRequests.filter(r => !r.url.includes('/auth/login'));
    for (const req of authenticatedRequests) {
      expect(req.headers['x-municipality-id']).toBeTruthy();
    }
  });

  test('navigation stays within municipality scope', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'seed-principal-1-1');
    await page.fill('input[name="password"]', 'SeedPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Get the base municipality path
    const url = page.url();
    const municipalitySlug = url.match(/\/([^/]+)\/dashboard/)?.[1];
    expect(municipalitySlug).toBeTruthy();

    // Navigate to students page via sidebar if available
    const studentsLink = page.locator('a[href*="students"]').first();
    if (await studentsLink.isVisible()) {
      await studentsLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain(`/${municipalitySlug}/`);
    }
  });

  test('direct URL manipulation to wrong municipality shows error', async ({ page }) => {
    // Login as mun-1 user
    await page.goto('/login');
    await page.fill('input[name="username"]', 'seed-principal-1-1');
    await page.fill('input[name="password"]', 'SeedPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Manually navigate to a completely different municipality
    await page.goto('/seed-mun-003/students');

    // Should NOT see student data from municipality 3
    // Should be redirected to own municipality
    await expect(page).not.toHaveURL(/seed-mun-003/);
  });
});
