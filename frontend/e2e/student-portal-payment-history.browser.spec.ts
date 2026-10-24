import { expect, test } from '@playwright/test';

test('student payment history shows a visible error when its API is unavailable', async ({ page }) => {
  const blockedWrites: string[] = [];

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999042,
      username: 'qa-local-student',
      email: 'qa-local-student@example.test',
      role: 'Student',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });

  await page.route(/\/api\/v1\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      blockedWrites.push(`${request.method()} ${path}`);
      await route.fulfill({ status: 422, contentType: 'application/json', body: '{"success":false}' });
      return;
    }

    if (path.endsWith('/finance/payments/student/42')) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'QA simulated payment service outage' }),
      });
      return;
    }

    const data = path.endsWith('/students/me/profile')
      ? { studentId: 42, studentCode: 'QA-42', firstName: 'QA' }
      : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/KMC/portal/student');
  await expect(page.getByRole('tab', { name: 'Fees' })).toBeVisible();
  await page.getByRole('tab', { name: 'Fees' }).click();
  await page.getByRole('button', { name: 'View Payment History' }).click();

  const dialog = page.getByRole('dialog', { name: 'Payment History' });
  await expect(dialog.getByRole('alert')).toHaveText('Failed to load data');
  await expect(dialog.getByText('No payments have been recorded yet.')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toHaveCount(0);
  expect(blockedWrites).toEqual([]);
});
