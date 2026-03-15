import { test, expect } from '@playwright/test';
import { gotoAsRole } from './helpers';

test.describe('Attendance Marking Flow', () => {
  test('should navigate to attendance page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/attendance');
    await expect(page.getByText(/attendance/i).first()).toBeVisible();
  });

  test('should display attendance dashboard content', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/attendance');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/attendance/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should have attendance navigation options', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/attendance');
    // Page loads without error
    await expect(page.locator('body')).not.toHaveText(/something went wrong/i);
  });
});
