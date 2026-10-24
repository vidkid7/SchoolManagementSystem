import { expect, Page, test } from '@playwright/test';

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

test('Reports tabs, class and section filters, and PDF export use the selected scope', async ({ page }) => {
  const pageErrors: string[] = [];
  const reportRequests: URL[] = [];
  const exportRequests: URL[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET') {
      await route.fulfill({ status: 405, json: { success: false, message: 'Write blocked by local QA test' } });
      return;
    }
    if (url.pathname.endsWith('/academic/classes')) {
      await route.fulfill({ json: { success: true, data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      return;
    }
    if (url.pathname.includes('/reports/export/')) {
      exportRequests.push(url);
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4\nQA export fixture\n%%EOF',
      });
      return;
    }
    if (url.pathname.includes('/reports/')) reportRequests.push(url);
    await route.fulfill({ json: { success: true, data: {} } });
  });

  await page.goto('/KMC/reports');
  await expect(page.getByRole('heading', { name: 'Reports & Analytics' })).toBeVisible();

  await page.getByRole('tab', { name: /Library/ }).click();
  await expect(page.getByRole('heading', { name: 'Library Overview' })).toBeVisible();
  await page.getByRole('tab', { name: /Enrollment/ }).click();

  await page.getByRole('combobox', { name: 'Class' }).click();
  await page.getByRole('option', { name: 'Class 1 - K' }).click();
  await page.getByRole('combobox', { name: 'Section' }).click();
  await page.getByRole('option', { name: 'K', exact: true }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect.poll(() => reportRequests.some(url =>
    url.pathname.endsWith('/reports/enrollment') &&
    url.searchParams.get('classId') === '1' &&
    url.searchParams.get('section') === 'K'
  )).toBe(true);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF' }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('enrollment-report.pdf');
  expect(exportRequests).toHaveLength(1);
  expect(exportRequests[0].pathname).toContain('/reports/export/pdf/enrollment');
  expect(exportRequests[0].searchParams.get('classId')).toBe('1');
  expect(exportRequests[0].searchParams.get('section')).toBe('K');
  expect(pageErrors).toEqual([]);
});

test('Reports Analytics has no horizontal overflow on a narrow screen', async ({ page }) => {
  await installSyntheticLocalAdmin(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('**/api/**', async route => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 405, json: { success: false } });
      return;
    }
    const url = new URL(route.request().url());
    await route.fulfill({ json: url.pathname.endsWith('/academic/classes')
      ? { success: true, data: [] }
      : { success: true, data: {} } });
  });

  await page.goto('/KMC/reports');
  await expect(page.getByRole('heading', { name: 'Reports & Analytics' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
