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

const createdDocument = {
  documentId: 99001,
  documentNumber: 'DOC-QA-99001',
  name: 'QA Policy Draft',
  originalName: 'qa-policy.pdf',
  description: 'Synthetic CRUD fixture',
  category: 'academic',
  mimeType: 'application/pdf',
  size: 1024,
  version: 1,
  uploadedBy: 999001,
  uploadedByName: 'qa-local-admin',
  accessLevel: 'private',
  tags: ['qa'],
  status: 'active',
  createdAt: '2026-10-24T10:00:00.000Z',
  updatedAt: '2026-10-24T10:00:00.000Z',
};

test('Document Management completes synthetic upload, preview, download, edit and delete', async ({ page }) => {
  const documents: typeof createdDocument[] = [];
  const requests: Array<{ method: string; path: string; contentType?: string }> = [];
  const pageErrors: string[] = [];
  let uploadBody = '';
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method !== 'GET') {
      requests.push({ method, path: url.pathname, contentType: request.headers()['content-type'] });
    }

    if (method === 'GET' && url.pathname === '/api/v1/documents') {
      await route.fulfill({ json: { success: true, data: documents, meta: { total: documents.length } } });
      return;
    }
    if (method === 'POST' && url.pathname === '/api/v1/documents') {
      uploadBody = request.postData() ?? '';
      documents.splice(0, documents.length, { ...createdDocument });
      await route.fulfill({ json: { success: true, message: 'Document uploaded successfully', data: documents[0] } });
      return;
    }
    if (method === 'GET' && url.pathname.endsWith('/preview')) {
      await route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4 synthetic preview\n%%EOF' });
      return;
    }
    if (method === 'GET' && url.pathname.endsWith('/download')) {
      await route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4 synthetic download\n%%EOF' });
      return;
    }
    if (method === 'PUT' && url.pathname === `/api/v1/documents/${createdDocument.documentId}`) {
      const patch = request.postDataJSON() as { name: string; description: string };
      documents[0] = { ...documents[0], ...patch };
      await route.fulfill({ json: { success: true, data: documents[0] } });
      return;
    }
    if (method === 'DELETE' && url.pathname === `/api/v1/documents/${createdDocument.documentId}`) {
      documents.length = 0;
      await route.fulfill({ json: { success: true, data: { deleted: true } } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${url.pathname}` } });
  });

  await page.goto('/KMC/documents');
  await expect(page.getByRole('heading', { name: 'Document Management' })).toBeVisible();
  await expect(page.getByText('No documents found')).toBeVisible();

  await page.getByRole('button', { name: 'Upload Document' }).click();
  const uploadDialog = page.getByRole('dialog');
  const fileInput = uploadDialog.locator('input[type="file"]');
  await expect(uploadDialog.getByRole('button', { name: 'Upload', exact: true })).toBeDisabled();
  await fileInput.setInputFiles({
    name: 'too-large.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(uploadDialog.getByRole('alert')).toContainText('File size exceeds maximum limit of 10MB');
  await expect(uploadDialog.getByRole('button', { name: 'Upload', exact: true })).toBeDisabled();

  await fileInput.setInputFiles({
    name: 'qa-policy.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 synthetic QA document\n%%EOF'),
  });
  await expect(uploadDialog.getByRole('textbox', { name: 'Document Name' })).toHaveValue('qa-policy');
  await uploadDialog.getByRole('textbox', { name: 'Description' }).fill('Synthetic CRUD fixture');
  await uploadDialog.getByRole('textbox', { name: 'Add Tags' }).fill('qa');
  await uploadDialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(uploadDialog.getByText('qa', { exact: true })).toBeVisible();
  await uploadDialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page.getByText('Document uploaded successfully')).toBeVisible();
  const row = page.getByRole('row', { name: /QA Policy Draft/ });
  await expect(row).toBeVisible();
  expect(requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/documents' });
  expect(requests[0].contentType).toContain('multipart/form-data');
  expect(uploadBody).toContain('name="name"');
  expect(uploadBody).toContain('qa-policy');
  expect(uploadBody).toContain('Synthetic CRUD fixture');
  expect(uploadBody).toContain('application/pdf');

  await row.getByRole('button', { name: 'Preview' }).click();
  const previewDialog = page.getByRole('dialog');
  await expect(previewDialog.getByTitle('QA Policy Draft')).toBeVisible();
  await previewDialog.getByRole('tab', { name: 'Details' }).click();
  await expect(previewDialog.getByText('DOC-QA-99001')).toBeVisible();
  await previewDialog.getByRole('button', { name: 'Close' }).click();

  const downloadPromise = page.waitForEvent('download');
  await row.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('qa-policy.pdf');

  await row.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Edit Document' });
  await editDialog.getByRole('textbox', { name: 'Document Name' }).fill('QA Policy Updated');
  await editDialog.getByRole('textbox', { name: 'Description' }).fill('Updated synthetic fixture');
  await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('row', { name: /QA Policy Updated/ })).toBeVisible();

  const updatedRow = page.getByRole('row', { name: /QA Policy Updated/ });
  await updatedRow.getByRole('button', { name: 'Actions' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByText('Document deleted successfully')).toBeVisible();
  await expect(page.getByText('No documents found')).toBeVisible();

  expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/documents',
    'PUT /api/v1/documents/99001',
    'DELETE /api/v1/documents/99001',
  ]);
  expect(pageErrors).toEqual([]);
});
