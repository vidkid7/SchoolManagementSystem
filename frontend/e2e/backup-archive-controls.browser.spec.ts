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

const sampleBackup = {
  filename: 'school-backup-qa-2026-10-24.sql.gz',
  path: '/backups/school-backup-qa-2026-10-24.sql.gz',
  size: 2048,
  createdAt: '2026-10-24T10:00:00.000Z',
  timestamp: '2026-10-24T10:00:00.000Z',
};

test('Backup management creates and verifies a synthetic backup; restore and cleanup stay canceled', async ({ page }) => {
  const writes: string[] = [];
  let backupCreated = false;
  let backupVerified = false;
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/v1/backup/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname.endsWith('/config')) {
      await route.fulfill({ json: { success: true, data: {
        enabled: true, schedule: '0 2 * * *', retentionDays: 30,
        backupPath: '/backups', compressionEnabled: true,
        jobStatus: { running: true },
      } } });
      return;
    }
    if (request.method() === 'GET' && url.pathname.endsWith('/list')) {
      await route.fulfill({ json: { success: true, data: backupCreated ? [sampleBackup] : [sampleBackup] } });
      return;
    }
    writes.push(`${request.method()} ${url.pathname}`);
    if (url.pathname.endsWith('/create')) {
      backupCreated = true;
      await route.fulfill({ json: { success: true, data: { filename: sampleBackup.filename } } });
      return;
    }
    if (url.pathname.endsWith('/verify')) {
      backupVerified = true;
      await route.fulfill({ json: { success: true, data: { valid: true } } });
      return;
    }
    await route.fulfill({ status: 405, json: { success: false, message: 'Unexpected mutation blocked by QA test' } });
  });

  await page.goto('/KMC/settings/backup');
  await expect(page.getByRole('heading', { name: 'Backup & Restore' })).toBeVisible();
  await expect(page.getByText('Enabled', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(sampleBackup.filename)).toBeVisible();

  await page.getByRole('button', { name: 'Backup Configuration' }).click();
  const configDialog = page.getByRole('dialog');
  await expect(configDialog.getByText('/backups')).toBeVisible();
  await configDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Create Backup' }).click();
  await expect(page.getByRole('alert')).toContainText(sampleBackup.filename);
  expect(backupCreated).toBe(true);
  await page.getByRole('button', { name: 'Verify Backup' }).click();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();
  expect(backupVerified).toBe(true);

  await page.getByRole('button', { name: 'Restore Backup' }).click();
  const restoreDialog = page.getByRole('dialog');
  await expect(restoreDialog.getByText(/replace ALL current data/i)).toBeVisible();
  await restoreDialog.getByRole('button', { name: 'Cancel' }).click();

  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Cleanup Old' }).click();
  expect(writes).toEqual(['POST /api/v1/backup/create', 'POST /api/v1/backup/verify']);
});

const completedArchive = {
  archiveId: 30001,
  academicYearId: 8,
  academicYearName: 'QA Academic Year 2080/81',
  archivedAt: '2026-10-20T10:00:00.000Z',
  archivedBy: 7,
  status: 'completed',
  recordCounts: { students: 3, attendance: 5 },
  tablesArchived: ['students', 'attendance'],
  retentionUntil: '2027-10-20T10:00:00.000Z',
  size: 4096,
};

test('Archive management filters and inspects synthetic archives while canceling restore and cleanup', async ({ page }) => {
  const writes: string[] = [];
  const archiveQueries: URL[] = [];
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET') {
      writes.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({ status: 405, json: { success: false, message: 'Mutation blocked by QA test' } });
      return;
    }
    if (url.pathname.endsWith('/academic/years')) {
      await route.fulfill({ json: { success: true, data: [
        { academicYearId: 7, yearName: '2079/80', startDate: '2025-04-14', endDate: '2026-04-13', isCurrent: false },
        { academicYearId: 8, yearName: '2080/81', startDate: '2026-04-14', endDate: '2027-04-13', isCurrent: true },
      ] } });
      return;
    }
    if (url.pathname === '/api/v1/archive') {
      archiveQueries.push(url);
      await route.fulfill({ json: { success: true, data: url.searchParams.has('status') ? [] : [completedArchive] } });
      return;
    }
    if (url.pathname.endsWith('/30001')) {
      await route.fulfill({ json: { success: true, data: completedArchive } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false } });
  });

  await page.goto('/KMC/settings/archive');
  await expect(page.getByRole('heading', { name: 'Archive Management' })).toBeVisible();
  await expect(page.getByText('QA Academic Year 2080/81')).toBeVisible();

  await page.getByRole('button', { name: 'View Details' }).click();
  const details = page.getByRole('dialog');
  await expect(details.getByText('STUDENTS', { exact: true })).toBeVisible();
  await expect(details.getByText('Total: 8 records')).toBeVisible();
  await details.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('combobox', { name: 'Status' }).click();
  await page.getByRole('option', { name: 'Failed' }).click();
  await expect.poll(() => archiveQueries.at(-1)?.searchParams.get('status')).toBe('failed');
  await expect(page.getByText('No archives found')).toBeVisible();

  await page.getByRole('button', { name: 'Archive Year' }).click();
  const archiveDialog = page.getByRole('dialog');
  await archiveDialog.getByRole('combobox', { name: 'Select Academic Year' }).click();
  await expect(page.getByRole('option', { name: /2080\/81/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /2079\/80/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await archiveDialog.locator('button').filter({ hasText: 'Cancel' }).click();

  // Reopen the unfiltered list to inspect the restore warning, then cancel safely.
  await page.getByRole('combobox', { name: 'Status' }).click();
  await page.getByRole('option', { name: 'All' }).click();
  await page.getByRole('button', { name: 'Restore Archive' }).click();
  const restoreDialog = page.getByRole('dialog');
  await expect(restoreDialog.getByText(/restoring archived data/i)).toBeVisible();
  await restoreDialog.getByRole('button', { name: 'Cancel' }).click();

  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Cleanup Expired' }).click();
  expect(writes).toEqual([]);
});
