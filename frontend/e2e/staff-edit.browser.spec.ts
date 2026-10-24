import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999007,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('staff edit loads the existing record and submits changed fields', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: Array<{ path: string; body: unknown }> = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path.endsWith('/staff/85002')) {
      await route.fulfill({ json: { success: true, data: {
        staffId: 85002,
        firstNameEn: 'QA Existing',
        lastNameEn: 'Teacher',
        dateOfBirthBS: '2083-03-09',
        gender: 'female',
        position: 'teacher',
        department: 'academic',
        highestQualification: 'Bachelor of Education',
        joinDate: '2084-04-15',
        phone: '9801112222',
        email: 'existing.staff@example.test',
        addressEn: 'Old Road, Kathmandu, Kathmandu',
        emergencyContact: 'Existing Contact: 9811112222',
        status: 'active',
      } } });
      return;
    }

    if (method === 'PUT' && path.endsWith('/staff/85002')) {
      writes.push({ path, body: request.postDataJSON() });
      await route.fulfill({ json: { success: true, data: { staffId: 85002, ...request.postDataJSON() } } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push({ path, body: request.postData() });
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
  });

  await page.goto('/KMC/staff/85002/edit');
  await expect(page.getByRole('heading', { name: 'Edit Staff' })).toBeVisible();
  await expect(page.getByLabel('First Name *')).toHaveValue('QA Existing');
  await expect(page.getByRole('textbox', { name: 'Date of Birth (BS) *' })).toHaveValue(/2083-03-09 BS/);
  await expect(page.getByRole('textbox', { name: 'Joining Date (BS) *' })).toHaveValue(/2084-04-15 BS/);

  await page.getByLabel('First Name *').fill('QA Updated');
  await page.getByLabel('Emergency Contact Name *').fill('Updated QA Contact');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Staff saved successfully' })).toBeVisible();

  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({
    path: '/api/v1/staff/85002',
    body: {
      firstNameEn: 'QA Updated',
      lastNameEn: 'Teacher',
      dateOfBirthBS: '2083-03-09',
      joinDate: '2084-04-15',
      emergencyContact: 'Updated QA Contact: 9811112222',
    },
  });
  expect(pageErrors).toEqual([]);
});
