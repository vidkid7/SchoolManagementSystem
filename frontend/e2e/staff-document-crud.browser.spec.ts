import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999008,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('staff document UI performs upload, read, edit, and confirmed delete', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: Array<{ method: string; path: string }> = [];
  let updatePayload: Record<string, unknown> | undefined;
  let uploadEvidence: { contentType?: string; hasName: boolean; hasCategory: boolean; hasFileName: boolean } | undefined;
  let bulkUploadEvidence: { contentType?: string; hasCategory: boolean; hasBothFileNames: boolean } | undefined;
  let documentRecord: Record<string, unknown> | null = null;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path.endsWith('/staff/85003')) {
      await route.fulfill({ json: { success: true, data: {
        staffId: 85003,
        firstNameEn: 'QA Documents',
        lastNameEn: 'Teacher',
        position: 'teacher',
        department: 'academic',
        status: 'active',
        email: 'qa.documents@example.test',
        phone: '9801112223',
        joinDate: '2084-04-15',
        addressEn: 'QA Road, Kathmandu, Kathmandu',
      } } });
      return;
    }

    if (method === 'GET' && path.endsWith('/documents/statistics')) {
      const count = documentRecord ? 1 : 0;
      await route.fulfill({ json: { success: true, data: { totalDocuments: count, expiredCount: 0, expiringSoonCount: 0 } } });
      return;
    }

    if (method === 'GET' && path.endsWith('/staff/85003/documents')) {
      await route.fulfill({ json: { success: true, data: documentRecord ? [documentRecord] : [] } });
      return;
    }

    if (method === 'GET' && path.endsWith('/staff/documents/86001')) {
      await route.fulfill(documentRecord
        ? { json: { success: true, data: documentRecord } }
        : { status: 404, json: { success: false, message: 'Document not found' } });
      return;
    }

    if (method === 'POST' && path.endsWith('/staff/85003/documents')) {
      writes.push({ method, path });
      const body = request.postData() || '';
      const headers = await request.allHeaders();
      uploadEvidence = {
        contentType: headers['content-type'],
        hasName: body.includes('license'),
        hasCategory: body.includes('contract'),
        hasFileName: body.includes('license.pdf'),
      };
      documentRecord = {
        documentId: 86001,
        documentName: 'license',
        mimeType: 'application/pdf',
        documentUrl: '/uploads/qa/license.pdf',
        category: 'contract',
        fileSize: 18,
        version: 1,
        expiryDate: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      await route.fulfill({ status: 201, json: { success: true, data: documentRecord } });
      return;
    }

    if (method === 'POST' && path.endsWith('/staff/85003/documents/bulk')) {
      writes.push({ method, path });
      const body = request.postData() || '';
      const headers = await request.allHeaders();
      bulkUploadEvidence = {
        contentType: headers['content-type'],
        hasCategory: body.includes('certificate'),
        hasBothFileNames: body.includes('bulk-one.pdf') && body.includes('bulk-two.pdf'),
      };
      await route.fulfill({ status: 201, json: { success: true, data: [] } });
      return;
    }

    if (method === 'PUT' && path.endsWith('/staff/documents/86001')) {
      writes.push({ method, path });
      const body = request.postDataJSON();
      updatePayload = body;
      if (documentRecord) {
        documentRecord = { ...documentRecord, documentName: body.documentName, category: body.category, expiryDate: body.expiryDate };
      }
      await route.fulfill({ json: { success: true, data: documentRecord } });
      return;
    }

    if (method === 'DELETE' && path.endsWith('/staff/documents/86001')) {
      writes.push({ method, path });
      documentRecord = null;
      await route.fulfill({ json: { success: true, data: { deleted: true } } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push({ method, path });
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
  });

  await page.goto('/KMC/staff/85003');
  await expect(page.getByRole('heading', { name: 'QA Documents Teacher' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload Document' })).toBeVisible();
  await page.getByRole('button', { name: 'Upload Document' }).click();
  const uploadDialog = page.getByRole('dialog');
  await uploadDialog.getByRole('combobox', { name: 'Category' }).click();
  await page.getByRole('option', { name: 'Contract', exact: true }).click();
  await uploadDialog.getByRole('button', { name: /Select File/ }).click();
  await uploadDialog.locator('input[type="file"]').setInputFiles({
    name: 'license.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('synthetic QA document'),
  });
  await expect(uploadDialog.getByText(/license\.pdf/)).toBeVisible();
  await uploadDialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page.getByText('Document uploaded successfully')).toBeVisible();
  await expect(page.getByRole('row', { name: /license/ })).toBeVisible();

  expect(uploadEvidence).toMatchObject({
    contentType: expect.stringContaining('multipart/form-data'),
    hasName: true,
    hasCategory: true,
    hasFileName: true,
  });

  await page.getByTitle('View Details').click();
  await expect(page.getByText('Document Details')).toBeVisible();
  await expect(page.getByText('/uploads/qa/license.pdf')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByTitle('Edit').click();
  const editDialog = page.getByRole('dialog');
  const nameField = editDialog.getByLabel('Document Name');
  await nameField.fill('Updated license');
  await editDialog.getByRole('combobox', { name: 'Category' }).click();
  await page.getByRole('option', { name: 'Qualification', exact: true }).click();
  await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Document updated successfully')).toBeVisible();
  await expect(page.getByRole('row', { name: /Updated license/ })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTitle('Delete').click();
  await expect(page.getByText('Document deleted successfully')).toBeVisible();
  await expect(page.getByText('No documents found')).toBeVisible();

  await page.getByRole('button', { name: 'Bulk Upload' }).click();
  const bulkDialog = page.getByRole('dialog');
  const bulkInput = bulkDialog.locator('input[type="file"]');
  const testFile = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('synthetic QA file') });
  await bulkInput.setInputFiles(Array.from({ length: 11 }, (_, index) => testFile(`too-many-${index}.pdf`)));
  await expect(page.getByText('Maximum 10 files allowed')).toBeVisible();
  await bulkInput.setInputFiles([testFile('bulk-one.pdf'), testFile('bulk-two.pdf')]);
  await bulkDialog.getByRole('button', { name: 'Upload 2 Files' }).click();
  await expect(page.getByText('2 documents uploaded successfully')).toBeVisible();
  expect(bulkUploadEvidence).toMatchObject({
    contentType: expect.stringContaining('multipart/form-data'),
    hasCategory: true,
    hasBothFileNames: true,
  });

  expect(writes).toEqual([
    { method: 'POST', path: '/api/v1/staff/85003/documents' },
    { method: 'PUT', path: '/api/v1/staff/documents/86001' },
    { method: 'DELETE', path: '/api/v1/staff/documents/86001' },
    { method: 'POST', path: '/api/v1/staff/85003/documents/bulk' },
  ]);
  expect(updatePayload).toMatchObject({
    documentName: 'Updated license',
    category: 'qualification',
    expiryDate: null,
  });
  expect(pageErrors).toEqual([]);
});
