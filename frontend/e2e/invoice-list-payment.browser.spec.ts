import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999018,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('Invoice List renders backend DTOs and submits valid, balance-limited payments', async ({ page }) => {
  const invoice = {
    invoiceId: 70001,
    invoiceNumber: 'INV-QA-70001',
    studentId: 80001,
    feeStructureId: 90001,
    academicYearId: 2073,
    dueDate: '2026-11-15',
    totalAmount: 1500,
    paidAmount: 500,
    balance: 1000,
    status: 'partial',
    student: {
      studentId: 80001,
      firstNameEn: 'QA',
      middleNameEn: null,
      lastNameEn: 'Invoice Student',
      currentClassId: 50001,
      currentClass: { classId: 50001, gradeLevel: 4, section: 'B' },
    },
  };
  const paymentRequests: Array<Record<string, unknown>> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/v1/finance/invoices') {
      await route.fulfill({ json: { success: true, data: [invoice], meta: { total: 1 } } });
      return;
    }
    if (method === 'POST' && path === '/api/v1/finance/payments') {
      paymentRequests.push(request.postDataJSON() as Record<string, unknown>);
      const body = paymentRequests[paymentRequests.length - 1];
      invoice.paidAmount = Number(invoice.paidAmount) + Number(body.amount);
      invoice.balance = Number(invoice.balance) - Number(body.amount);
      invoice.status = Number(invoice.balance) === 0 ? 'paid' : 'partial';
      await route.fulfill({ status: 201, json: { success: true, data: { paymentId: 71001 } } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/finance/invoices');
  await expect(page.getByRole('heading', { name: 'Invoices', exact: true })).toBeVisible();
  const row = page.getByRole('row', { name: /INV-QA-70001/ });
  await expect(row).toContainText('QA Invoice Student');
  await expect(row).toContainText('Class 4 - Section B');
  await expect(row).toContainText('1,500');
  await expect(row).toContainText('1,000');

  await row.getByRole('button', { name: 'Add Payment INV-QA-70001' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Payment' });
  await expect(dialog).toContainText('QA Invoice Student');
  const amount = dialog.getByRole('spinbutton', { name: 'Amount' });
  await expect(amount).toHaveValue('1000');
  await amount.fill('1001');
  await dialog.getByRole('button', { name: 'Add Payment' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Payment amount cannot exceed the invoice balance.');
  expect(paymentRequests).toHaveLength(0);

  await amount.fill('400');
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await dialog.getByRole('combobox', { name: 'Payment Method' }).click();
  await page.getByRole('option', { name: 'Bank Transfer' }).click();
  await dialog.getByRole('button', { name: 'Add Payment' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText('900');
  expect(paymentRequests).toHaveLength(1);
  expect(paymentRequests[0]).toMatchObject({
    invoiceId: 70001,
    studentId: 80001,
    amount: 400,
    paymentMethod: 'bank_transfer',
  });
  expect(paymentRequests[0].paymentDate).toEqual(expect.any(String));
  expect(pageErrors).toEqual([]);
});
