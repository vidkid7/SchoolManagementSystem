import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999003,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('calendar event start and end date pickers allow direct year selection', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    const method = route.request().method();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [], pagination: { total: 0 } } });
  });

  await page.goto('/KMC/calendar/events');
  await expect(page.getByRole('button', { name: 'Add Event' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Event' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const startDate = dialog.getByRole('textbox', { name: 'Start Date' });
  await dialog.getByRole('button', { name: 'Choose date' }).nth(0).click();
  await page.getByRole('radio', { name: '2030' }).click();
  await expect(startDate).toHaveValue(/2030/);

  const endDate = dialog.getByRole('textbox', { name: 'End Date' });
  await dialog.getByRole('button', { name: 'Choose date' }).nth(1).click();
  await page.getByRole('radio', { name: '2031' }).click();
  await expect(endDate).toHaveValue(/2031/);

  expect(pageErrors).toEqual([]);
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible();
});

test('main calendar year selector updates BS and AD calendar years', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    const method = route.request().method();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto('/KMC/calendar');
  const yearSelect = page.getByRole('combobox', { name: 'Select year' });
  await expect(yearSelect).toBeVisible();

  await yearSelect.click();
  await page.getByRole('option', { name: '2085', exact: true }).click();
  await expect(page.getByText(/2085 \(BS\)/)).toBeVisible();

  await page.getByRole('button', { name: 'AD', exact: true }).click();
  await yearSelect.click();
  await page.getByRole('option', { name: '2030', exact: true }).click();
  await expect(page.getByText(/2030.*\(AD\)/)).toBeVisible();
  expect(pageErrors).toEqual([]);
});
