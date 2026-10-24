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

test('creates a synthetic student through the browser form without touching a database', async ({ page }) => {
  const writes: Array<{ method: string; path: string; body: unknown }> = [];
  const pageErrors: string[] = [];
  let createdPayload: Record<string, unknown> | undefined;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path.endsWith('/academic/classes')) {
      await route.fulfill({ json: { data: [] } });
      return;
    }

    if (method === 'POST' && path.endsWith('/students/detect-duplicates')) {
      writes.push({ method, path, body: request.postDataJSON() });
      await route.fulfill({ json: { data: { duplicates: [] } } });
      return;
    }

    if (method === 'POST' && path.endsWith('/students/validate')) {
      writes.push({ method, path, body: request.postDataJSON() });
      await route.fulfill({ json: { data: { isValid: true, errors: [], warnings: [] } } });
      return;
    }

    if (method === 'POST' && path.endsWith('/students')) {
      createdPayload = request.postDataJSON();
      writes.push({ method, path, body: createdPayload });
      await route.fulfill({ status: 201, json: { data: { studentId: 700001 } } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push({ method, path, body: request.postDataJSON() });
      await route.fulfill({ status: 404, json: { message: 'Unexpected write blocked by QA test' } });
      return;
    }

    await route.fulfill({ json: { data: [] } });
  });

  await page.goto('/KMC/students/create');
  await expect(page.getByRole('heading', { name: 'Add Student' })).toBeVisible();
  await expect(page.getByText(/No classes are configured/)).toBeVisible();

  const fields: Record<string, string> = {
    'First Name *': 'QA Browser',
    'Last Name *': 'Synthetic',
    'Date of Birth (AD) *': '04/01/2008',
    'Admission Date *': '01/01/2026',
    'Address (English) *': 'Synthetic Test Street',
    'Emergency Contact *': '9801110001',
    "Father's Name *": 'QA Father',
    "Father's Phone *": '9801110002',
    "Mother's Name *": 'QA Mother',
    "Mother's Phone *": '9801110003',
  };

  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/KMC\/students$/);

  expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/students/detect-duplicates',
    'POST /api/v1/students/validate',
    'POST /api/v1/students',
  ]);
  expect(createdPayload).toEqual(expect.objectContaining({
    firstNameEn: 'QA Browser',
    lastNameEn: 'Synthetic',
    dateOfBirthAD: '2008-04-01',
    addressEn: 'Synthetic Test Street',
    emergencyContact: '9801110001',
    admissionDate: '2026-01-01',
  }));
  expect(pageErrors).toEqual([]);
});
