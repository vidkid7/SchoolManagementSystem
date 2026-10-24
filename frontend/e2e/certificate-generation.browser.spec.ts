import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999005,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('single certificate generation uses an active template and sends the selected fields', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: Array<{ path: string; body: unknown }> = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path.endsWith('/certificate-templates')) {
      const activeOnly = new URL(request.url()).searchParams.get('isActive') === 'true';
      const templates = [
        { templateId: 82001, name: 'QA Active Character Certificate', type: 'character', isActive: true },
        { templateId: 82002, name: 'QA Inactive Transfer Certificate', type: 'transfer', isActive: false },
      ].filter((template) => !activeOnly || template.isActive);
      await route.fulfill({ json: { success: true, data: templates, meta: { total: templates.length } } });
      return;
    }

    if (method === 'GET' && path.endsWith('/students')) {
      await route.fulfill({ json: { success: true, data: [{
        studentId: 83001,
        firstName: 'QA',
        lastName: 'Student',
        studentCode: 'QA-LOCAL-83001',
      }] } });
      return;
    }

    if (method === 'GET' && path.endsWith('/certificates')) {
      await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
      return;
    }

    if (method === 'POST' && path.endsWith('/certificates/generate')) {
      writes.push({ path, body: request.postDataJSON() });
      await route.fulfill({ status: 201, json: { success: true, data: { certificateId: 84001 } } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push({ path, body: request.postData() });
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
  });

  await page.goto('/KMC/certificates/manage');
  await page.getByRole('tab', { name: 'Generate' }).click();
  await page.getByRole('button', { name: 'Generate Single Certificate' }).click();
  const dialog = page.getByRole('dialog');

  await dialog.getByRole('combobox', { name: 'Template' }).click();
  await expect(page.getByRole('option', { name: /QA Active Character Certificate/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /QA Inactive Transfer Certificate/ })).toHaveCount(0);
  await page.getByRole('option', { name: /QA Active Character Certificate/ }).click();

  await dialog.getByRole('combobox', { name: 'Student' }).click();
  await page.getByRole('option', { name: /QA Student \(QA-LOCAL-83001\)/ }).click();
  await dialog.getByLabel('Issued Date (BS)').fill('2083/07/08');
  await dialog.getByLabel('Academic Year').fill('2083-2084');
  await dialog.getByLabel('Parent/Guardian Name').fill('QA Guardian');
  await dialog.getByLabel('Class').fill('8');
  await dialog.getByLabel('Roll Number').fill('17');
  await dialog.getByRole('button', { name: 'Generate', exact: true }).click();

  await expect(page.getByText('Certificate generated successfully!')).toBeVisible();
  expect(writes).toEqual([{
    path: '/api/v1/certificates/generate',
    body: {
      templateId: 82001,
      studentId: 83001,
      issuedDateBS: '2083/07/08',
      data: {
        studentName: 'QA Student',
        parentName: 'QA Guardian',
        className: '8',
        rollNumber: '17',
        academicYear: '2083-2084',
      },
    },
  }]);
  expect(pageErrors).toEqual([]);
});
