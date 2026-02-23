import { test, expect } from '@playwright/test';

test.describe('Attendance Marking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('teacher@school.edu.np');
    await page.getByLabel(/password/i).fill('Teacher@123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should navigate to attendance page', async ({ page }) => {
    await page.goto('/attendance');
    await expect(page.getByText(/attendance/i)).toBeVisible();
  });

  test('should display student list for marking', async ({ page }) => {
    await page.goto('/attendance');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
  });

  test('should have Mark All Present button', async ({ page }) => {
    await page.goto('/attendance');
    await expect(page.getByRole('button', { name: /mark all present/i })).toBeVisible({ timeout: 10000 });
  });
});
