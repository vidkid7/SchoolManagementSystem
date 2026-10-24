import { expect, test } from '@playwright/test';

test('student create form blocks an empty submission before any API write', async ({ page }) => {
  const blockedWrites: string[] = [];

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

  await page.route(/\/api\/v1\//, async (route) => {
    const request = route.request();
    const method = request.method();
    if (method !== 'GET') {
      blockedWrites.push(`${method} ${new URL(request.url()).pathname}`);
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'QA intercepted write' }),
      });
      return;
    }

    const payload = new URL(request.url()).pathname.endsWith('/academic/classes')
      ? { success: true, data: [] }
      : { success: true, data: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });

  await page.goto('/KMC/students/create');

  const form = page.locator('form').first();
  const saveButton = form.getByRole('button', { name: /save/i });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  await expect(form.locator('[aria-invalid="true"]')).not.toHaveCount(0);
  expect(blockedWrites).toEqual([]);
  await expect(page).toHaveURL(/\/KMC\/students\/create$/i);
});

test('calendar year selector changes the visible year without API writes', async ({ page }) => {
  const blockedWrites: string[] = [];

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

  await page.route(/\/api\/v1\//, async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') {
      blockedWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'QA intercepted write' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.goto('/KMC/calendar');

  const yearSelector = page.getByRole('combobox', { name: 'Select year' });
  await expect(yearSelector).toBeVisible();
  await yearSelector.click();
  await page.getByRole('option', { name: '2085' }).click();

  await expect(yearSelector).toHaveText('2085');
  await expect(page.getByText(/Academic Year: 2085/)).toBeVisible();
  expect(blockedWrites).toEqual([]);
});

test('student create sends duplicate-check, validation, and create requests for a valid browser form', async ({ page }) => {
  const writes: Array<{ path: string; body: unknown }> = [];
  let studentRecord: Record<string, unknown> | null = null;

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

  await page.route(/\/api\/v1\//, async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      const body = request.postDataJSON();
      writes.push({ path: pathname, body });
      if (pathname.endsWith('/students/detect-duplicates')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { duplicates: [] } }) });
      } else if (pathname.endsWith('/students/validate')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { isValid: true, errors: [], warnings: [] } }) });
      } else if (pathname.endsWith('/students')) {
        studentRecord = { ...(body as Record<string, unknown>), studentId: 999002, studentCode: 'QA-LOCAL-0001' };
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { studentId: 999002 } }) });
      } else if (request.method() === 'PUT' && pathname.endsWith('/students/999002')) {
        studentRecord = { ...studentRecord, ...(body as Record<string, unknown>) };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: studentRecord }) });
      } else {
        await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unexpected QA write' }) });
      }
      return;
    }

    if (pathname.endsWith('/academic/classes')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    } else if (pathname.endsWith('/students/999002/siblings')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    } else if (pathname.endsWith('/students/999002')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: studentRecord }) });
    } else if (pathname.endsWith('/students')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: studentRecord ? [studentRecord] : [], meta: { total: studentRecord ? 1 : 0 } }) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }
  });

  await page.goto('/KMC/students/create');
  const today = await page.evaluate(() => {
    const date = new Date();
    return {
      year: String(date.getFullYear()),
      month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date),
      day: String(date.getDate()),
    };
  });

  await page.getByLabel('First Name *').fill('QA Browser');
  await page.getByLabel('Last Name *').fill('Student');

  await page.getByRole('textbox', { name: 'Date of Birth (BS) *' }).click();
  await page.getByRole('button', { name: 'Today' }).click();

  await page.getByRole('button', { name: 'Choose date', exact: true }).click();
  await page.getByRole('radio', { name: today.year, exact: true }).click();
  await page.getByRole('radio', { name: today.month, exact: true }).click();
  await page.getByRole('gridcell', { name: today.day, exact: true }).click();

  await page.getByRole('textbox', { name: 'Address (English) *' }).fill('QA Browser Test Street');
  await page.getByLabel('Emergency Contact *').fill('9801234567');
  await page.getByLabel("Father's Name *").fill('QA Father');
  await page.getByLabel("Father's Phone *").fill('9801234568');
  await page.getByLabel("Mother's Name *").fill('QA Mother');
  await page.getByLabel("Mother's Phone *").fill('9801234569');

  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page).toHaveURL(/\/KMC\/students$/i);
  const createdRow = page.getByRole('row').filter({ hasText: 'QA Browser Student' });
  await expect(createdRow).toBeVisible();

  expect(writes.map(({ path }) => path)).toEqual([
    '/api/v1/students/detect-duplicates',
    '/api/v1/students/validate',
    '/api/v1/students',
  ]);
  expect(writes[2].body).toMatchObject({
    firstNameEn: 'QA Browser',
    lastNameEn: 'Student',
    emergencyContact: '9801234567',
    fatherPhone: '9801234568',
    motherPhone: '9801234569',
  });
  const createPayload = writes[2].body as Record<string, unknown>;
  expect(createPayload.dateOfBirthBS).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(createPayload.dateOfBirthAD).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(createPayload.admissionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await createdRow.getByRole('button', { name: /view/i }).click();
  await expect(page).toHaveURL(/\/KMC\/students\/999002$/i);
  await expect(page.getByText('QA Browser Student', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /edit/i }).click();
  await expect(page).toHaveURL(/\/KMC\/students\/999002\/edit$/i);
  await page.getByLabel('First Name *').fill('QA Browser Edited');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page).toHaveURL(/\/KMC\/students$/i);

  const updatedRow = page.getByRole('row').filter({ hasText: 'QA Browser Edited Student' });
  await expect(updatedRow).toBeVisible();
  expect(writes.map(({ path }) => path)).toEqual([
    '/api/v1/students/detect-duplicates',
    '/api/v1/students/validate',
    '/api/v1/students',
    '/api/v1/students/validate',
    '/api/v1/students/999002',
  ]);
  expect(writes[4].body).toMatchObject({ firstNameEn: 'QA Browser Edited', lastNameEn: 'Student' });
});
