import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999015,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

type SyntheticFee = {
  feeStructureId: number;
  name: string;
  academicYearId: number;
  academicYearName: string;
  applicableClasses: number[];
  applicableShifts: string[];
  amount: number;
  totalAmount: number;
  description?: string;
  isActive: boolean;
};

test('Fee Structures completes synthetic CRUD and opens invoice generation with the selected fee', async ({ page }) => {
  const fees: SyntheticFee[] = [];
  const writes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path.endsWith('/academic/years/current')) {
      await route.fulfill({ json: { success: true, data: {
        academicYearId: 12, name: '2082-83', startDateBS: '2082-04-01', endDateBS: '2083-03-30',
        startDateAD: '2025-07-17', endDateAD: '2026-07-16', isCurrent: true,
      } } });
      return;
    }
    if (method === 'GET' && path.endsWith('/academic/years')) {
      await route.fulfill({ json: { success: true, data: [{
        academicYearId: 12, name: '2082-83', startDateBS: '2082-04-01', endDateBS: '2083-03-30',
        startDateAD: '2025-07-17', endDateAD: '2026-07-16', isCurrent: true,
      }] } });
      return;
    }
    if (method === 'GET' && path.endsWith('/finance/fee-structures')) {
      await route.fulfill({ json: { success: true, data: fees } });
      return;
    }
    if (method === 'GET' && path.endsWith('/students')) {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }
    if (method === 'GET' && path.endsWith('/academic/classes')) {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }

    const feeMatch = path.match(/\/finance\/fee-structures(?:\/(\d+))?$/);
    if (feeMatch && method !== 'GET') {
      const body = method === 'DELETE' ? undefined : request.postDataJSON() as Record<string, unknown>;
      writes.push({ method, path, body });
      if (method === 'POST') {
        const component = (body?.feeComponents as Array<{ amount: number }>)[0];
        fees.push({
          feeStructureId: 701,
          name: String(body?.name ?? ''),
          academicYearId: Number(body?.academicYearId),
          academicYearName: '2082-83',
          applicableClasses: body?.applicableClasses as number[],
          applicableShifts: body?.applicableShifts as string[],
          amount: component.amount,
          totalAmount: component.amount,
          description: body?.description as string | undefined,
          isActive: true,
        });
        await route.fulfill({ status: 201, json: { success: true, data: fees[0] } });
        return;
      }
      const feeId = Number(feeMatch[1]);
      const index = fees.findIndex(fee => fee.feeStructureId === feeId);
      if (method === 'PUT' && index >= 0) {
        fees[index] = { ...fees[index], ...body };
        await route.fulfill({ json: { success: true, data: fees[index] } });
        return;
      }
      if (method === 'DELETE' && index >= 0) {
        fees.splice(index, 1);
        await route.fulfill({ json: { success: true, data: { deleted: true } } });
        return;
      }
    }

    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/finance/fee-structures');
  await expect(page.getByRole('heading', { name: 'Fee Structures' })).toBeVisible();
  await expect(page.getByText('No fee structures found')).toBeVisible();

  await page.getByRole('button', { name: 'Create Fee Structure' }).click();
  let dialog = page.getByRole('dialog', { name: 'Create Fee Structure' });
  await dialog.getByRole('textbox', { name: 'Fee Name' }).fill('QA Tuition');
  await dialog.getByRole('combobox', { name: 'Select Class (Optional)' }).click();
  await page.getByRole('option', { name: 'Class 5' }).click();
  await dialog.getByRole('spinbutton', { name: 'Amount' }).fill('1250');
  await dialog.getByRole('textbox', { name: 'Description' }).fill('Synthetic monthly tuition');
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('Saved successfully')).toBeVisible();
  let row = page.getByRole('row', { name: /QA Tuition/ });
  await expect(row).toContainText('Class 5');
  await expect(row).toContainText('NPR 1,250');
  expect(writes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/finance/fee-structures',
    body: {
      name: 'QA Tuition', academicYearId: 12, applicableClasses: [5],
      applicableShifts: ['morning', 'day', 'evening'], description: 'Synthetic monthly tuition',
      feeComponents: [{ name: 'QA Tuition', amount: 1250, type: 'monthly', frequency: 'monthly', isMandatory: true, description: 'Synthetic monthly tuition' }],
    },
  });

  await row.getByRole('button', { name: 'Edit' }).click();
  dialog = page.getByRole('dialog', { name: 'Edit Fee Structure' });
  await expect(dialog.getByRole('combobox', { name: 'Academic Year' })).toBeDisabled();
  await expect(dialog.getByRole('spinbutton', { name: 'Amount' })).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Fee Name' }).fill('QA Tuition Updated');
  await dialog.getByRole('combobox', { name: 'Select Class (Optional)' }).click();
  await page.getByRole('option', { name: 'Class 6' }).click();
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved successfully')).toBeVisible();
  row = page.getByRole('row', { name: /QA Tuition Updated/ });
  await expect(row).toContainText('Class 6');
  expect(writes[1]).toMatchObject({
    method: 'PUT', path: '/api/v1/finance/fee-structures/701',
    body: { name: 'QA Tuition Updated', applicableClasses: [6], applicableShifts: ['morning', 'day', 'evening'], description: 'Synthetic monthly tuition' },
  });

  await row.getByRole('button', { name: 'Generate Invoice' }).click();
  await expect(page).toHaveURL(/\/KMC\/finance\/invoices\/generate$/);
  await expect(page.getByRole('heading', { name: 'Generate Invoices' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Fee Structure' })).toContainText('QA Tuition Updated');

  await page.goto('/KMC/finance/fee-structures');
  row = page.getByRole('row', { name: /QA Tuition Updated/ });
  page.once('dialog', browserDialog => browserDialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Deleted successfully')).toBeVisible();
  await expect(page.getByText('No fee structures found')).toBeVisible();

  expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/finance/fee-structures',
    'PUT /api/v1/finance/fee-structures/701',
    'DELETE /api/v1/finance/fee-structures/701',
  ]);
  expect(pageErrors).toEqual([]);
});
