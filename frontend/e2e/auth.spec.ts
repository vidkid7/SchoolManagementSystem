import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email|username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show validation for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page.getByText(/required|email|username/i)).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill('admin@school.edu.np');
    await page.getByLabel(/password/i).fill('Admin@123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });
});
