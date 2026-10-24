import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999012,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('System Settings saves date format changes and blocks saves when no active school is configured', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: Array<{ path: string; body: unknown }> = [];
  let dateSettings: Record<string, string> = {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    numberFormat: 'en-US',
    currency: 'NPR',
  };
  let configurationAvailable = true;
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/v1/system-settings/grading-schemes') {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/system-settings/attendance-rules') {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/system-settings/notification-templates') {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/system-settings/date-format') {
      await route.fulfill({ json: { success: true, data: configurationAvailable ? dateSettings : {} } });
      return;
    }
    if (method === 'PUT' && path === '/api/v1/system-settings/date-format') {
      const body = request.postDataJSON() as Record<string, string>;
      writes.push({ path, body });
      dateSettings = { ...body };
      await route.fulfill({ json: { success: true, data: dateSettings } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/settings/system');
  await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();
  await page.getByRole('tab', { name: 'Date Format' }).click();
  await expect(page.getByRole('textbox', { name: 'Date Display Format' })).toHaveValue('YYYY-MM-DD');
  await page.getByRole('textbox', { name: 'Date Display Format' }).fill('DD/MM/YYYY');
  await page.getByRole('textbox', { name: 'Time Format' }).fill('hh:mm A');
  await page.getByRole('textbox', { name: 'Currency Code' }).fill('USD');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Settings saved successfully' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Date Display Format' })).toHaveValue('DD/MM/YYYY');
  expect(writes).toEqual([{
    path: '/api/v1/system-settings/date-format',
    body: { dateFormat: 'DD/MM/YYYY', timeFormat: 'hh:mm A', numberFormat: 'en-US', currency: 'USD' },
  }]);

  configurationAvailable = false;
  await page.reload();
  await page.getByRole('tab', { name: 'Date Format' }).click();
  await expect(page.getByText('There is no active school configuration')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Date Display Format' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  await page.getByRole('button', { name: 'Save' }).click({ force: true });
  expect(writes).toHaveLength(1);
  expect(pageErrors).toEqual([]);
});
