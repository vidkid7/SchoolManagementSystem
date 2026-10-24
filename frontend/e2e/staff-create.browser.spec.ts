import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999006,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('staff create form validates inputs, allows BS year selection, and submits the expected request', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: Array<{ path: string; body: unknown }> = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'POST' && path.endsWith('/staff')) {
      const body = request.postDataJSON();
      writes.push({ path, body });
      await route.fulfill({ status: 201, json: { success: true, data: { staffId: 85001, ...body } } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push({ path, body: request.postData() });
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
  });

  await page.goto('/KMC/staff/create');
  await expect(page.getByRole('heading', { name: 'Add Staff' })).toBeVisible();

  for (const [label, year, day] of [
    ['Date of Birth (BS) *', '2083', '10'],
    ['Joining Date (BS) *', '2084', '11'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`Open ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} calendar`) }).click();
    await page.getByRole('combobox', { name: 'Select year' }).click();
    await page.getByRole('option', { name: year, exact: true }).click();
    await page.getByRole('button', { name: day, exact: true }).click();
    await expect(page.getByRole('textbox', { name: label })).toHaveValue(new RegExp(`${year}-\\d{2}-${day.padStart(2, '0')} BS`));
  }

  await page.getByLabel('First Name *').fill('QA Staff');
  await page.getByLabel('Last Name *').fill('Browser');
  await page.getByRole('combobox', { name: 'Position *' }).click();
  await page.getByRole('option', { name: 'Teacher', exact: true }).click();
  await page.getByLabel('Qualification *').fill('Bachelor of Education');
  await page.getByLabel('Contact Number *', { exact: true }).fill('123');
  await page.getByLabel('Email *').fill('qa.staff@example.test');
  await page.getByLabel('Address *').fill('QA Road');
  await page.getByLabel('City *').fill('Kathmandu');
  await page.getByLabel('District *').fill('Kathmandu');
  await page.getByLabel('Emergency Contact Name *').fill('QA Contact');
  await page.getByLabel('Emergency Contact Number *').fill('9812345678');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Phone number must be 10 digits')).toBeVisible();
  expect(writes).toEqual([]);

  await page.getByLabel('Contact Number *', { exact: true }).fill('9801234567');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Staff saved successfully' })).toBeVisible();

  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({
    path: '/api/v1/staff',
    body: {
      firstNameEn: 'QA Staff',
      lastNameEn: 'Browser',
      dateOfBirthBS: expect.stringMatching(/^2083-\d{2}-10$/),
      position: 'teacher',
      department: 'academic',
      joinDate: expect.stringMatching(/^2084-\d{2}-11$/),
      phone: '9801234567',
      email: 'qa.staff@example.test',
      addressEn: 'QA Road, Kathmandu, Kathmandu',
      emergencyContact: 'QA Contact: 9812345678',
      status: 'active',
      category: 'teaching',
      employmentType: 'full_time',
    },
  });
  expect(pageErrors).toEqual([]);
});

test('staff create form stays within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.request().method())) {
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
  });

  await page.goto('/KMC/staff/create');
  await expect(page.getByRole('heading', { name: 'Add Staff' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});
