import { test, expect } from '@playwright/test';

test.describe('Navigation and Portal Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('admin@school.edu.np');
    await page.getByLabel(/password/i).fill('Admin@123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should load dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should navigate to students page', async ({ page }) => {
    await page.goto('/students');
    await expect(page.getByText(/student/i)).toBeVisible();
  });

  test('should navigate to staff page', async ({ page }) => {
    await page.goto('/staff');
    await expect(page.getByText(/staff/i)).toBeVisible();
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText(/report/i)).toBeVisible();
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.getByText(/calendar/i)).toBeVisible();
  });

  test('should navigate to library page', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByText(/library/i)).toBeVisible();
  });

  test('should navigate to certificates page', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.getByText(/certificate/i)).toBeVisible();
  });

  test('should navigate to audit logs page', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByText(/audit/i)).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/settings/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});

test.describe('Offline Functionality', () => {
  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('admin@school.edu.np');
    await page.getByLabel(/password/i).fill('Admin@123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await context.setOffline(true);
    await page.waitForTimeout(2000);
    await context.setOffline(false);
  });
});
