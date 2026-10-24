import { expect, Page, test } from '@playwright/test';

const sampleLog = {
  auditLogId: 44001,
  userId: 7,
  entityType: 'Student',
  entityId: 91,
  entityUuid: 'qa-student-uuid',
  action: 'update',
  oldValue: { status: 'pending' },
  newValue: { status: 'active' },
  changedFields: ['status'],
  ipAddress: '192.0.2.10',
  userAgent: 'QA Chromium',
  metadata: null,
  timestamp: '2026-10-22T10:00:00.000Z',
};

async function installSyntheticLocalAdmin(page: Page) {
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

test('Audit Logs filters, expands details, exports and cancels destructive rotation safely', async ({ page }) => {
  const pageErrors: string[] = [];
  const logQueries: URL[] = [];
  const attemptedWrites: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/v1/audit/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET') {
      attemptedWrites.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({ status: 405, json: { success: false, message: 'Write blocked by local QA test' } });
      return;
    }
    if (url.pathname.endsWith('/logs')) logQueries.push(url);

    const data = url.pathname.endsWith('/stats')
      ? { totalLogs: 1, logsByAction: { create: 0, update: 1, delete: 0, restore: 0 } }
      : url.pathname.endsWith('/export')
        ? [sampleLog]
        : [sampleLog];
    const body = url.pathname.endsWith('/logs')
      ? { success: true, data, pagination: { total: 1 } }
      : { success: true, data };
    await route.fulfill({ json: body });
  });

  await page.goto('/KMC/audit');
  await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
  await expect(page.getByText('Student #qa-student-uuid')).toBeVisible();

  await page.getByRole('button', { name: 'Filters' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('qa-student-uuid');
  await page.getByRole('combobox', { name: 'Action' }).click();
  await page.getByRole('option', { name: 'Update' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect.poll(() => logQueries.at(-1)?.searchParams.get('search')).toBe('qa-student-uuid');
  expect(logQueries.at(-1)?.searchParams.get('action')).toBe('update');

  await page.getByRole('button', { name: 'Details' }).click();
  await expect(page.getByText('Old Value:')).toBeVisible();
  await expect(page.getByText(/"status": "active"/)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^audit-logs-.*\.json$/);

  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Rotate Logs' }).click();
  expect(attemptedWrites).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('Audit Logs remains within a narrow mobile viewport', async ({ page }) => {
  await installSyntheticLocalAdmin(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('**/api/v1/audit/**', async route => {
    const url = new URL(route.request().url());
    const data = url.pathname.endsWith('/stats')
      ? { totalLogs: 0, logsByAction: {} }
      : [];
    await route.fulfill({ json: url.pathname.endsWith('/logs')
      ? { success: true, data, pagination: { total: 0 } }
      : { success: true, data } });
  });

  await page.goto('/KMC/audit');
  await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
  await expect(page.getByText('No audit logs found')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
