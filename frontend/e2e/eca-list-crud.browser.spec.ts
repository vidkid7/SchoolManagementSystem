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

type SyntheticECA = {
  ecaId: number;
  name: string;
  category: string;
  coordinatorId: number;
  coordinator: string;
  status: 'active' | 'inactive' | 'completed';
  enrolledCount: number;
  description?: string;
  schedule?: string;
  subcategory?: string;
  capacity?: number;
};

test('ECA List completes synthetic create, update, and confirmed delete flows', async ({ page }) => {
  const activities: SyntheticECA[] = [];
  const writes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path === '/api/v1/eca/list') {
      await route.fulfill({ json: { success: true, data: activities, meta: { total: activities.length } } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/staff') {
      await route.fulfill({ json: { success: true, data: [{ staffId: 30001, firstNameEn: 'QA', lastNameEn: 'Coordinator', status: 'active' }] } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/academic/years/current') {
      await route.fulfill({ json: { success: true, data: { academicYearId: 30001 } } });
      return;
    }

    const match = path.match(/^\/api\/v1\/eca(?:\/([^/]+))?$/);
    if (match && method !== 'GET') {
      const id = Number(match[1]);
      const body = method === 'DELETE' ? undefined : request.postDataJSON() as Record<string, unknown>;
      writes.push({ method, path, body });
      if (method === 'POST' && !match[1]) {
        activities.push({
          ecaId: 30001,
          name: String(body?.name ?? ''),
          category: String(body?.category ?? 'club'),
          coordinatorId: Number(body?.coordinatorId),
          coordinator: 'QA Coordinator',
          status: 'active',
          enrolledCount: 0,
          description: String(body?.description ?? ''),
          schedule: String(body?.schedule ?? ''),
          subcategory: String(body?.subcategory ?? ''),
          capacity: Number(body?.capacity),
        });
        await route.fulfill({ status: 201, json: { success: true, data: activities[0] } });
        return;
      }
      const index = activities.findIndex(activity => activity.ecaId === id);
      if (index >= 0 && method === 'PUT') {
        activities[index] = { ...activities[index], ...body, coordinator: 'QA Coordinator' };
        await route.fulfill({ json: { success: true, data: activities[index] } });
        return;
      }
      if (index >= 0 && method === 'DELETE') {
        activities.splice(index, 1);
        await route.fulfill({ json: { success: true, data: { deleted: true } } });
        return;
      }
    }

    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/eca/list');
  await expect(page.getByRole('heading', { name: 'ECA Activities' })).toBeVisible();
  await expect(page.getByText('No ECAs found')).toBeVisible();

  await page.getByRole('button', { name: 'Create ECA' }).click();
  let dialog = page.getByRole('dialog', { name: 'Create ECA' });
  await dialog.getByRole('textbox', { name: 'ECA Name' }).fill('QA Coding Club');
  await dialog.getByRole('textbox', { name: 'Schedule' }).fill('Wednesday after class');
  await dialog.getByRole('textbox', { name: 'Subcategory' }).fill('Technology');
  await dialog.getByRole('spinbutton', { name: 'Capacity' }).fill('24');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('ECA created successfully')).toBeVisible();
  let row = page.getByRole('row', { name: /QA Coding Club/ });
  await expect(row).toContainText('QA Coordinator');
  expect(writes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/eca',
    body: {
      name: 'QA Coding Club',
      category: 'club',
      coordinatorId: 30001,
      capacity: 24,
      academicYearId: 30001,
    },
  });

  await row.getByRole('button', { name: 'Edit QA Coding Club' }).click();
  dialog = page.getByRole('dialog', { name: 'Edit ECA' });
  await dialog.getByRole('textbox', { name: 'ECA Name' }).fill('QA Robotics Club');
  await dialog.getByRole('textbox', { name: 'Schedule' }).fill('Friday after class');
  await dialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByText('ECA updated successfully')).toBeVisible();
  row = page.getByRole('row', { name: /QA Robotics Club/ });
  await expect(row).toBeVisible();
  expect(writes[1]).toMatchObject({
    method: 'PUT',
    path: '/api/v1/eca/30001',
    body: { name: 'QA Robotics Club', schedule: 'Friday after class', status: 'active' },
  });

  page.once('dialog', browserDialog => browserDialog.accept());
  await row.getByRole('button', { name: 'Delete QA Robotics Club' }).click();
  await expect(page.getByText('ECA deleted successfully')).toBeVisible();
  await expect(page.getByText('No ECAs found')).toBeVisible();
  expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/eca',
    'PUT /api/v1/eca/30001',
    'DELETE /api/v1/eca/30001',
  ]);
  expect(pageErrors).toEqual([]);
});
