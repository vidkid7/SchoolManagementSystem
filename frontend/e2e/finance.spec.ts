import { test, expect } from '@playwright/test';
import { gotoAsRole } from './helpers';

test.describe('Fee Payment Flow', () => {
  test('should display invoice list', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/finance/invoices');
    await expect(page.getByText(/invoice|fee/i).first()).toBeVisible();
  });

  test('should show payment status filters', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/finance/invoices');
    await expect(page.getByText(/paid|pending|overdue/i)).toBeVisible({ timeout: 10000 });
  });
});
