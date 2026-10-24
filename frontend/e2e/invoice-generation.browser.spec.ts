import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999017,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('Invoice Generation creates a synthetic student invoice with selected fee and date', async ({ page }) => {
  const posts: Array<{ path: string; body: Record<string, unknown> }> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/v1/finance/fee-structures') {
      await route.fulfill({ json: { success: true, data: [{ feeStructureId: 30001, name: 'QA Annual Tuition', amount: 15000, totalAmount: 15000, academicYearId: 2073 }] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/students') {
      await route.fulfill({ json: { success: true, data: [{ studentId: 40001, firstNameEn: 'QA', lastNameEn: 'Student', currentClassId: 50001 }] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/academic/classes') {
      await route.fulfill({ json: { success: true, data: [{ classId: 50001, gradeLevel: 5, section: 'A' }] } });
      return;
    }
    if (method === 'POST' && path === '/api/v1/finance/invoices') {
      posts.push({ path, body: request.postDataJSON() as Record<string, unknown> });
      await route.fulfill({ status: 201, json: { success: true, data: { invoiceId: 60001, invoiceNumber: 'INV-QA-60001' } } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/finance/invoices/generate');
  await expect(page.getByRole('heading', { name: 'Generate Invoices' })).toBeVisible();
  const studentSelect = page.getByRole('combobox', { name: 'Student', exact: true });
  await studentSelect.click();
  await page.getByRole('option', { name: /QA Student - Class 5 - Section A/ }).click();
  const feeSelect = page.getByRole('combobox', { name: 'Fee Structure' });
  await feeSelect.click();
  await page.getByRole('option', { name: /QA Annual Tuition/ }).click();
  await page.getByRole('button', { name: 'Choose date' }).click();
  await page.getByRole('radio', { name: '2026', exact: true }).click();
  await page.getByRole('radio', { name: 'November', exact: true }).click();
  await page.getByRole('gridcell', { name: '15', exact: true }).click();

  const generateButton = page.getByRole('button', { name: 'Generate Invoice', exact: true });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(posts).toEqual([{
    path: '/api/v1/finance/invoices',
    body: {
      studentId: 40001,
      feeStructureId: 30001,
      academicYearId: 2073,
      dueDate: '2026-11-15',
      discount: 0,
      discountReason: '',
      remarks: '',
    },
  }]);
  expect(pageErrors).toEqual([]);
});

test('bulk invoice generation limits students to the selected class', async ({ page }) => {
  const posts: Array<{ path: string; body: Record<string, unknown> }> = [];
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/v1/finance/fee-structures') {
      await route.fulfill({ json: { success: true, data: [{ feeStructureId: 30002, name: 'QA Science Fee', amount: 7000, totalAmount: 7000, academicYearId: 2073 }] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/students') {
      await route.fulfill({ json: { success: true, data: [
        { studentId: 40002, firstNameEn: 'Asha', lastNameEn: 'QA', currentClassId: 50002 },
        { studentId: 40003, firstNameEn: 'Biraj', lastNameEn: 'QA', currentClassId: 50003 },
      ] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/academic/classes') {
      await route.fulfill({ json: { success: true, data: [
        { classId: 50002, gradeLevel: 5, section: 'A' },
        { classId: 50003, gradeLevel: 6, section: 'B' },
      ] } });
      return;
    }
    if (method === 'POST' && path === '/api/v1/finance/invoices/bulk-generate') {
      posts.push({ path, body: request.postDataJSON() as Record<string, unknown> });
      await route.fulfill({ status: 201, json: { success: true, data: { successful: 1, failed: 0 } } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/finance/invoices/generate');
  await page.getByRole('radio', { name: 'Generate Invoices', exact: true }).check();
  await page.getByRole('combobox', { name: 'Select Class (Optional)' }).click();
  await page.getByRole('option', { name: 'Class 5 - Section A' }).click();
  await page.getByRole('combobox', { name: 'Fee Structure', exact: true }).click();
  await page.getByRole('option', { name: /QA Science Fee/ }).click();
  await page.getByRole('button', { name: 'Choose date' }).click();
  await page.getByRole('radio', { name: '2026', exact: true }).click();
  await page.getByRole('radio', { name: 'December', exact: true }).click();
  await page.getByRole('gridcell', { name: '1', exact: true }).click();
  await expect(page.getByText('Class: Class 5 - Section A')).toBeVisible();
  await expect(page.getByText('Student Name: All matching students')).toBeVisible();

  const generateButton = page.getByRole('button', { name: 'Generate Invoices', exact: true });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();
  await expect(page.getByRole('alert')).toContainText('Success: 1');
  expect(posts).toEqual([{
    path: '/api/v1/finance/invoices/bulk-generate',
    body: {
      studentIds: [40002],
      feeStructureId: 30002,
      academicYearId: 2073,
      dueDate: '2026-12-01',
    },
  }]);
});
