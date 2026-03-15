import { test, expect } from '@playwright/test';
import { gotoAsRole } from './helpers';

test.describe('Exam Grading Flow', () => {
  test('should navigate to grade entry page', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/examinations/grades');
    await expect(page.getByText(/grade|exam/i).first()).toBeVisible();
  });

  test('should display grade entry form with NEB grading', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/examinations/grades');
    await expect(page.getByText(/grade|marks|subject|exam/i).first()).toBeVisible({ timeout: 10000 });
  });
});
