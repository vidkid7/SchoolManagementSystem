import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999016,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('Payments and Refund Management validate and complete synthetic payment/refund flows', async ({ page }) => {
  const payments: Array<Record<string, unknown>> = [];
  const refunds: Array<Record<string, unknown>> = [];
  const writes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/v1/finance/payments') {
      await route.fulfill({ json: { success: true, data: payments, meta: { total: payments.length } } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/finance/refunds') {
      await route.fulfill({ json: { success: true, data: refunds, meta: { total: refunds.length } } });
      return;
    }
    if (method === 'POST' && path === '/api/v1/finance/payments') {
      const body = request.postDataJSON() as Record<string, unknown>;
      writes.push({ method, path, body });
      payments.push({
        paymentId: 30001,
        invoiceId: Number(body.invoiceId),
        invoiceNumber: 'INV-QA-30001',
        studentId: 40001,
        studentName: 'QA Student',
        amount: Number(body.amount),
        paymentMethod: String(body.paymentMethod),
        transactionId: String(body.transactionId ?? ''),
        paymentDate: String(body.paymentDate),
        status: 'completed',
      });
      await route.fulfill({ status: 201, json: { success: true, data: payments[0] } });
      return;
    }
    if (method === 'POST' && path === '/api/v1/finance/refunds') {
      const body = request.postDataJSON() as Record<string, unknown>;
      writes.push({ method, path, body });
      refunds.push({
        refundId: 30001,
        paymentId: Number(body.paymentId),
        receiptNumber: 'REF-QA-30001',
        studentName: 'QA Student',
        amount: 1250,
        reason: String(body.reason),
        status: 'processed',
        requestedDate: '2026-10-24',
      });
      await route.fulfill({ status: 201, json: { success: true, data: refunds[0] } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/finance/payments');
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
  await expect(page.getByText('No payments found')).toBeVisible();
  await page.getByRole('button', { name: 'Record Payment' }).click();
  const paymentDialog = page.getByRole('dialog', { name: 'Record Payment' });
  await paymentDialog.getByRole('button', { name: 'Record Payment' }).click();
  await expect(paymentDialog.getByRole('alert')).toBeVisible();
  expect(writes).toHaveLength(0);

  await paymentDialog.getByRole('spinbutton', { name: 'Invoice ID' }).fill('10001');
  await paymentDialog.getByRole('spinbutton', { name: 'Amount' }).fill('1250');
  await paymentDialog.getByRole('textbox', { name: 'Transaction Reference' }).fill('QA-TXN-30001');
  await paymentDialog.getByRole('button', { name: 'Record Payment' }).click();
  await expect(page.getByText('Payment recorded successfully')).toBeVisible();
  const paymentRow = page.getByRole('row', { name: /INV-QA-30001/ });
  await expect(paymentRow).toContainText('QA Student');
  await expect(paymentRow.getByRole('button', { name: 'Download INV-QA-30001' })).toBeVisible();
  await expect(paymentRow.getByRole('button', { name: 'Process a Refund INV-QA-30001' })).toBeVisible();
  expect(writes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/finance/payments',
    body: { invoiceId: 10001, amount: 1250, paymentMethod: 'cash', transactionId: 'QA-TXN-30001' },
  });

  await page.goto('/KMC/finance/refunds');
  await expect(page.getByRole('heading', { name: 'Refund Management' })).toBeVisible();
  await expect(page.getByText('No refund requests')).toBeVisible();
  await page.getByRole('button', { name: 'Process a Refund' }).click();
  const refundDialog = page.getByRole('dialog', { name: 'Process a Refund' });
  await refundDialog.getByRole('button', { name: 'Process a Refund' }).click();
  await expect(refundDialog.getByText('Payment ID is required')).toBeVisible();
  await expect(refundDialog.getByText('Select a refund reason')).toBeVisible();
  expect(writes).toHaveLength(1);

  await refundDialog.getByRole('spinbutton', { name: 'Payment ID' }).fill('30001');
  await refundDialog.getByRole('combobox', { name: 'Reason' }).click();
  await page.getByRole('option', { name: 'Overpayment' }).click();
  page.once('dialog', browserDialog => browserDialog.accept());
  await refundDialog.getByRole('button', { name: 'Process a Refund' }).click();
  await expect(page.getByText('Refund processed successfully')).toBeVisible();
  const refundRow = page.getByRole('row', { name: /REF-QA-30001/ });
  await expect(refundRow).toContainText('QA Student');
  await expect(refundRow).toContainText('processed');
  expect(writes[1]).toMatchObject({
    method: 'POST',
    path: '/api/v1/finance/refunds',
    body: { paymentId: 30001, reason: 'overpayment' },
  });
  expect(pageErrors).toEqual([]);
});
