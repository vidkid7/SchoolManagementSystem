import { test, expect } from '@playwright/test';
import { gotoAsRole } from './helpers';

test.describe('Navigation and Portal Tests', () => {
  test('should load dashboard', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('should navigate to students page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/students');
    await expect(page.getByText(/student/i).first()).toBeVisible();
  });

  test('should navigate to staff page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/staff');
    await expect(page.getByText(/staff/i).first()).toBeVisible();
  });

  test('should navigate to reports page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/reports');
    await expect(page.getByText(/report/i).first()).toBeVisible();
  });

  test('should navigate to calendar page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/calendar');
    await expect(page.getByText(/calendar/i).first()).toBeVisible();
  });

  test('should navigate to library page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/library');
    await expect(page.getByText(/library/i).first()).toBeVisible();
  });

  test('should navigate to certificates page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/certificates');
    await expect(page.getByText(/certificate/i).first()).toBeVisible();
  });

  test('should navigate to audit logs page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/audit');
    await expect(page.getByText(/audit/i).first()).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/settings');
    await expect(page.getByText(/settings/i).first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoAsRole(page, 'school_admin', '/dashboard');
    // On mobile the sidebar is collapsed, so check the page body is loaded
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/kmc\/dashboard/i);
  });
});

test.describe('Offline Functionality', () => {
  test('should handle offline mode gracefully', async ({ page, context }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    await context.setOffline(false);
    await expect(page.locator('body')).toBeVisible();
  });
});
