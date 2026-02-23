import { test, expect } from '@playwright/test';

test.describe('Fee Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('admin@school.edu.np');
    await page.getByLabel(/password/i).fill('Admin@123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display invoice list', async ({ page }) => {
    await page.goto('/finance/invoices');
    await expect(page.getByText(/invoice|fee/i)).toBeVisible();
  });

  test('should show payment status filters', async ({ page }) => {
    await page.goto('/finance/invoices');
    await expect(page.getByText(/paid|pending|overdue/i)).toBeVisible({ timeout: 10000 });
  });
});
