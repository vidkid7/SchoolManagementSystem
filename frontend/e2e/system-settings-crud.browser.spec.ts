import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999013,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('System Settings completes synthetic CRUD for grading schemes, attendance rules, and notification templates', async ({ page }) => {
  const collections: Record<string, Array<Record<string, unknown>>> = {
    'grading-schemes': [],
    'attendance-rules': [],
    'notification-templates': [],
  };
  const writes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [];
  const pageErrors: string[] = [];
  let nextId = 88000;
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (path === '/api/v1/system-settings/date-format' && method === 'GET') {
      await route.fulfill({ json: { success: true, data: { dateFormat: 'YYYY-MM-DD' } } });
      return;
    }

    const match = path.match(/^\/api\/v1\/system-settings\/(grading-schemes|attendance-rules|notification-templates)(?:\/(\d+))?$/);
    if (!match) {
      await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
      return;
    }
    const [, collectionName, id] = match;
    const collection = collections[collectionName];
    if (method === 'GET') {
      await route.fulfill({ json: { success: true, data: collection } });
      return;
    }
    const body = method === 'DELETE' ? undefined : request.postDataJSON() as Record<string, unknown>;
    writes.push({ method, path, body });
    if (method === 'POST') {
      collection.push({ id: String(++nextId), ...body });
      await route.fulfill({ status: 201, json: { success: true, data: collection[collection.length - 1] } });
      return;
    }
    const index = collection.findIndex(item => String(item.id) === id);
    if (method === 'PUT' && index >= 0) {
      collection[index] = { ...collection[index], ...body };
      await route.fulfill({ json: { success: true, data: collection[index] } });
      return;
    }
    if (method === 'DELETE' && index >= 0) {
      collection.splice(index, 1);
      await route.fulfill({ json: { success: true, data: { deleted: true } } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/settings/system');
  await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Add Grading Scheme' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Scheme Name' }).fill('QA Grade Scale');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Settings saved successfully')).toBeVisible();
  let row = page.getByRole('row', { name: /QA Grade Scale/ });
  await expect(row).toBeVisible();
  expect(writes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/system-settings/grading-schemes',
    body: { name: 'QA Grade Scale', grades: [{ grade: 'A', minPercentage: 90, maxPercentage: 100, gradePoint: 4, description: 'Excellent' }] },
  });
  await row.getByRole('button', { name: 'Edit Grading Scheme' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Scheme Name' }).fill('QA Grade Scale Updated');
  await dialog.getByRole('button', { name: 'Save' }).click();
  row = page.getByRole('row', { name: /QA Grade Scale Updated/ });
  await expect(row).toBeVisible();
  page.once('dialog', browserDialog => browserDialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No grading schemes found')).toBeVisible();

  await page.getByRole('tab', { name: 'Attendance Rules' }).click();
  await page.getByRole('button', { name: 'Add Attendance Rule' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Rule Name' }).fill('QA Attendance Rule');
  await dialog.getByRole('spinbutton', { name: 'Min Attendance (%)' }).fill('82');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Settings saved successfully')).toBeVisible();
  row = page.getByRole('row', { name: /QA Attendance Rule/ });
  await expect(row).toContainText('82%');
  expect(writes[3]).toMatchObject({
    method: 'POST',
    path: '/api/v1/system-settings/attendance-rules',
    body: { name: 'QA Attendance Rule', minimumAttendancePercentage: 82, allowTeacherCorrection: true },
  });
  await row.getByRole('button', { name: 'Edit Attendance Rule' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Rule Name' }).fill('QA Attendance Rule Updated');
  await dialog.getByRole('spinbutton', { name: 'Min Attendance (%)' }).fill('85');
  await dialog.getByRole('checkbox', { name: 'Alert Parents' }).uncheck();
  await dialog.getByRole('button', { name: 'Save' }).click();
  row = page.getByRole('row', { name: /QA Attendance Rule Updated/ });
  await expect(row).toContainText('85%');
  expect(writes[4].path).toBe('/api/v1/system-settings/attendance-rules/88002');
  page.once('dialog', browserDialog => browserDialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No attendance rules found')).toBeVisible();

  await page.getByRole('tab', { name: 'Notification Templates' }).click();
  await page.getByRole('button', { name: 'Add Template' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Template Name' }).fill('QA Notice');
  await dialog.getByRole('textbox', { name: 'Template Code' }).fill('qa_notice');
  await dialog.getByRole('textbox', { name: 'English Template' }).fill('Hello {{student_name}}');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Settings saved successfully')).toBeVisible();
  row = page.getByRole('row', { name: /QA Notice/ });
  await expect(row).toContainText('QA_NOTICE');
  expect(writes[6]).toMatchObject({
    method: 'POST',
    path: '/api/v1/system-settings/notification-templates',
    body: { name: 'QA Notice', code: 'QA_NOTICE', templateEn: 'Hello {{student_name}}', variables: ['student_name'] },
  });
  await row.getByRole('button', { name: 'Edit Template' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Template Name' }).fill('QA Notice Updated');
  await dialog.getByRole('textbox', { name: 'English Template' }).fill('Welcome {{student_name}}');
  await dialog.getByRole('button', { name: 'Save' }).click();
  row = page.getByRole('row', { name: /QA Notice Updated/ });
  await expect(row).toBeVisible();
  expect(writes[7].path).toBe('/api/v1/system-settings/notification-templates/88003');
  page.once('dialog', browserDialog => browserDialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No notification templates found')).toBeVisible();

  expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/system-settings/grading-schemes',
    'PUT /api/v1/system-settings/grading-schemes/88001',
    'DELETE /api/v1/system-settings/grading-schemes/88001',
    'POST /api/v1/system-settings/attendance-rules',
    'PUT /api/v1/system-settings/attendance-rules/88002',
    'DELETE /api/v1/system-settings/attendance-rules/88002',
    'POST /api/v1/system-settings/notification-templates',
    'PUT /api/v1/system-settings/notification-templates/88003',
    'DELETE /api/v1/system-settings/notification-templates/88003',
  ]);
  expect(writes[4].body).toMatchObject({ name: 'QA Attendance Rule Updated', minimumAttendancePercentage: 85, alertParents: false });
  expect(writes[7].body).toMatchObject({ name: 'QA Notice Updated', templateEn: 'Welcome {{student_name}}', variables: ['student_name'] });
  expect(pageErrors).toEqual([]);
});
