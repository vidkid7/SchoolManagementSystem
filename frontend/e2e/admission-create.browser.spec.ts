import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999002,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('creates an admission inquiry through the browser and navigates to its detail', async ({ page }) => {
  const pageErrors: string[] = [];
  let createdPayload: Record<string, unknown> | undefined;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() === 'POST' && path.endsWith('/admissions/inquiry')) {
      createdPayload = request.postDataJSON();
      await route.fulfill({
        status: 201,
        json: { success: true, data: { admissionId: 900002 } },
      });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }

    await route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto('/KMC/admissions/new');
  await expect(page.getByRole('heading', { name: 'New Admission Inquiry' })).toBeVisible();
  await page.getByLabel('First Name (English)').fill(' QA Browser ');
  await page.getByLabel('Last Name (English)').fill(' Inquiry ');
  await page.getByRole('combobox', { name: 'Applying for Class' }).click();
  await page.getByRole('option', { name: 'Class 5' }).click();
  await page.getByRole('button', { name: 'Create Inquiry' }).click();

  await expect(page.getByText('Inquiry created successfully!')).toBeVisible();
  await expect(page).toHaveURL(/\/KMC\/admissions\/900002$/);
  expect(createdPayload).toEqual(expect.objectContaining({
    firstNameEn: 'QA Browser',
    lastNameEn: 'Inquiry',
    applyingForClass: 5,
  }));
  expect(pageErrors).toEqual([]);
});
