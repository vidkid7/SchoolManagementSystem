import { test, expect } from '@playwright/test';

test.describe('Exam Grading Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('teacher@school.edu.np');
    await page.getByLabel(/password/i).fill('Teacher@123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should navigate to grade entry page', async ({ page }) => {
    await page.goto('/examinations/grades');
    await expect(page.getByText(/grade|exam/i)).toBeVisible();
  });

  test('should display grade entry form with NEB grading', async ({ page }) => {
    await page.goto('/examinations/grades');
    await expect(page.getByText(/grade|marks|subject/i)).toBeVisible({ timeout: 10000 });
  });
});
