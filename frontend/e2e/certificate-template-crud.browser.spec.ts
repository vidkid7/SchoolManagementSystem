import { expect, Page, test } from '@playwright/test';

type TemplateRecord = {
  templateId: number;
  name: string;
  type: string;
  templateHtml: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
};

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999004,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('certificate template UI performs create, edit/read-back and soft delete', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: string[] = [];
  const records: TemplateRecord[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (path.endsWith('/certificate-templates') && method === 'GET') {
      const params = new URL(request.url()).searchParams;
      const activeFilter = params.get('isActive');
      const search = params.get('search')?.toLowerCase();
      const data = records.filter((record) =>
        (activeFilter === null || record.isActive === (activeFilter === 'true'))
        && (!search || record.name.toLowerCase().includes(search))
      );
      await route.fulfill({ json: { success: true, data, meta: { total: data.length } } });
      return;
    }

    if (path.endsWith('/certificate-templates') && method === 'POST') {
      writes.push(`${method} ${path}`);
      const body = request.postDataJSON();
      const record: TemplateRecord = {
        templateId: 81001,
        name: body.name,
        type: body.type,
        templateHtml: body.templateHtml,
        variables: body.variables,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      records.push(record);
      await route.fulfill({ status: 201, json: { success: true, data: record } });
      return;
    }

    const templateMatch = path.match(/\/certificate-templates\/(\d+)$/);
    if (templateMatch && method === 'GET') {
      const record = records.find((item) => item.templateId === Number(templateMatch[1]));
      await route.fulfill(record
        ? { json: { success: true, data: record } }
        : { status: 404, json: { success: false } });
      return;
    }
    if (templateMatch && method === 'PUT') {
      writes.push(`${method} ${path}`);
      const record = records.find((item) => item.templateId === Number(templateMatch[1]))!;
      Object.assign(record, request.postDataJSON());
      await route.fulfill({ json: { success: true, data: record } });
      return;
    }
    if (templateMatch && method === 'DELETE') {
      writes.push(`${method} ${path}`);
      const record = records.find((item) => item.templateId === Number(templateMatch[1]))!;
      record.isActive = false;
      await route.fulfill({ json: { success: true } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push(`${method} ${path}`);
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
  });

  await page.goto('/KMC/certificates/manage');
  await expect(page.getByRole('button', { name: 'Add Template' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Template' }).click();
  const dialog = page.getByRole('dialog');
  await page.getByLabel('Template Name').fill('Local QA Certificate Template');
  await page.getByRole('combobox', { name: 'Certificate Type' }).click();
  await page.getByRole('option', { name: 'Character Certificate' }).click();
  await page.getByLabel('Template HTML').fill('<div>Certificate for {{student_name}}</div>');
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Template created successfully')).toBeVisible();
  await expect(page.getByText('Local QA Certificate Template')).toBeVisible();

  await page.getByRole('button', { name: 'Edit Template Local QA Certificate Template' }).click();
  await expect(dialog.getByLabel('Template HTML')).toHaveValue('<div>Certificate for {{student_name}}</div>');
  await dialog.getByLabel('Template Name').fill('Local QA Certificate Template Updated');
  await dialog.getByLabel('Template HTML').fill('<p>Updated for {{student_name}}</p>');
  await dialog.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Template updated successfully')).toBeVisible();
  await expect(page.getByText('Local QA Certificate Template Updated')).toBeVisible();

  page.once('dialog', (dialogEvent) => dialogEvent.accept());
  await page.getByRole('button', { name: 'Delete Local QA Certificate Template Updated' }).click();
  await expect(page.getByText('Template deleted successfully')).toBeVisible();
  const deletedRow = page.getByRole('row', { name: /Local QA Certificate Template Updated/ });
  await expect(deletedRow).toBeVisible();
  await expect(deletedRow.getByText('Inactive')).toBeVisible();

  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    name: 'Local QA Certificate Template Updated',
    templateHtml: '<p>Updated for {{student_name}}</p>',
    isActive: false,
  });
  expect(writes).toEqual([
    'POST /api/v1/certificate-templates',
    'PUT /api/v1/certificate-templates/81001',
    'DELETE /api/v1/certificate-templates/81001',
  ]);
  expect(pageErrors).toEqual([]);
});
