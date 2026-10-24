import { expect, Page, test } from '@playwright/test';

async function installQaSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999001,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('change-password form enforces the server password policy without submitting', async ({ page }) => {
  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  await page.goto('/KMC/change-password');
  await page.getByLabel('Current password').fill('LocalOnly1');
  const newPassword = page.locator('input[autocomplete="new-password"]').nth(0);
  const confirmPassword = page.locator('input[autocomplete="new-password"]').nth(1);
  await newPassword.fill('weakpass');
  await confirmPassword.fill('weakpass');

  const submit = page.getByRole('button', { name: 'Change password' });
  await expect(page.getByText('Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.')).toBeVisible();
  await expect(submit).toBeDisabled();

  await newPassword.fill('ValidPass1');
  await confirmPassword.fill('ValidPass1');
  await expect(submit).toBeEnabled();
  await expect(page.getByText('Passwords do not match')).toHaveCount(0);
});
