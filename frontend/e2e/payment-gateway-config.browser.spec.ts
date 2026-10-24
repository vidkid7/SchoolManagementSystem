import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999019,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('Payment Gateway config hides stored secrets and safely updates test settings', async ({ page }) => {
  const updates: Array<{ path: string; body: Record<string, unknown> }> = [];
  const testCalls: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/v1/finance/payment-gateways/config') {
      await route.fulfill({ json: { success: true, data: {
        esewa: { name: 'eSewa', enabled: false, merchantId: '', secretKey: '', secretKeyConfigured: true, testMode: true },
        khalti: { name: 'Khalti', enabled: false, merchantId: '', secretKey: '', secretKeyConfigured: false, testMode: true },
        imepay: { name: 'IME Pay', enabled: false, merchantId: '', secretKey: '', secretKeyConfigured: false, testMode: true },
      } } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/finance/payment-gateways/transactions') {
      await route.fulfill({ json: { success: true, data: [{
        id: 85001,
        gateway: 'eSewa',
        transactionId: 'QA-GATEWAY-TXN-85001',
        amount: 500,
        status: 'success',
        date: '2026-10-24T10:00:00.000Z',
        studentName: 'QA Student',
      }] } });
      return;
    }
    if (method === 'PUT' && path === '/api/v1/finance/payment-gateways/esewa') {
      updates.push({ path, body: request.postDataJSON() as Record<string, unknown> });
      await route.fulfill({ json: { success: true, data: {
        name: 'eSewa', enabled: true, merchantId: 'QA-MERCHANT-85001',
        secretKey: '', secretKeyConfigured: true, testMode: false,
      } } });
      return;
    }
    if (method === 'POST' && path === '/api/v1/finance/payment-gateways/esewa/test') {
      testCalls.push(path);
      await route.fulfill({ status: 501, json: {
        success: false,
        message: 'Payment provider connectivity checks are not configured',
        error: { code: 'GATEWAY_TEST_UNAVAILABLE' },
      } });
      return;
    }
    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/finance/payment-gateways');
  await expect(page.getByRole('heading', { name: 'Payment Gateways' })).toBeVisible();
  await expect(page.getByText('QA-GATEWAY-TXN-85001')).toBeVisible();

  const gatewaySecret = page.getByRole('textbox', { name: 'Secret Key' }).first();
  await expect(gatewaySecret).toBeDisabled();
  await expect(gatewaySecret).toHaveValue('');
  await expect(gatewaySecret).toHaveAttribute('placeholder', 'Configured. Enter a new key only to replace it.');
  expect(await page.locator('input[type="password"]').evaluateAll(inputs =>
    inputs.every(input => (input as HTMLInputElement).value !== 'SYNTHETIC-STORED-SECRET'),
  )).toBe(true);

  await page.getByRole('checkbox', { name: 'Enable eSewa' }).check();
  await page.getByRole('textbox', { name: 'Merchant ID' }).first().fill('QA-MERCHANT-85001');
  await page.getByRole('checkbox', { name: 'Test mode for eSewa' }).uncheck();
  await expect(gatewaySecret).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Save' }).first()).toBeEnabled();
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText('eSewa configuration saved successfully')).toBeVisible();
  expect(updates).toHaveLength(1);
  expect(updates[0]).toMatchObject({
    path: '/api/v1/finance/payment-gateways/esewa',
    body: { name: 'eSewa', enabled: true, merchantId: 'QA-MERCHANT-85001', testMode: false },
  });
  expect(updates[0].body).not.toHaveProperty('secretKey');

  await page.getByRole('button', { name: 'Test', exact: true }).first().click();
  await expect(page.getByText('Payment provider connectivity checks are not configured')).toBeVisible();
  expect(testCalls).toEqual(['/api/v1/finance/payment-gateways/esewa/test']);
  expect(pageErrors).toEqual([]);
});
