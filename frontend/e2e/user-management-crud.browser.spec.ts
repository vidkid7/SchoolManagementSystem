import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999011,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

type SyntheticUser = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  roleName: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
};

test('User Management completes synthetic create, update, status, activity and delete flows', async ({ page }) => {
  const users: SyntheticUser[] = [];
  const writes: Array<{ method: string; path: string; body?: unknown }> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();
    if (method !== 'GET') {
      writes.push({ method, path: pathname, body: method === 'DELETE' ? undefined : request.postDataJSON() });
    }

    if (method === 'GET' && pathname === '/api/v1/users/stats') {
      await route.fulfill({ json: { success: true, data: {
        total: users.length,
        active: users.filter(user => user.status === 'active').length,
        inactive: users.filter(user => user.status === 'inactive').length,
        suspended: users.filter(user => user.status === 'suspended').length,
      } } });
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/users') {
      const filtered = users.filter(user => {
        const query = searchParams.get('search')?.toLowerCase();
        return (!query || `${user.username} ${user.email} ${user.firstName} ${user.lastName}`.toLowerCase().includes(query))
          && (!searchParams.get('role') || user.role === searchParams.get('role'))
          && (!searchParams.get('status') || user.status === searchParams.get('status'));
      });
      await route.fulfill({ json: { success: true, data: filtered, meta: { total: filtered.length } } });
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/users/99101/activity') {
      await route.fulfill({ json: { success: true, data: [{
        id: 99102,
        action: 'LOGIN',
        ipAddress: '192.0.2.10',
        userAgent: 'Synthetic QA browser',
        timestamp: '2026-10-24T10:00:00.000Z',
      }] } });
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/users') {
      const payload = request.postDataJSON() as Record<string, string | undefined>;
      const created: SyntheticUser = {
        userId: 99101,
        username: String(payload.username),
        email: String(payload.email),
        firstName: String(payload.firstName),
        lastName: String(payload.lastName),
        phone: payload.phone,
        role: String(payload.roleId),
        roleName: 'Class Teacher',
        status: 'active',
        createdAt: '2026-10-24T10:00:00.000Z',
      };
      users.splice(0, users.length, created);
      await route.fulfill({ status: 201, json: { success: true, message: 'User created successfully', data: created } });
      return;
    }
    if (method === 'PUT' && pathname === '/api/v1/users/99101') {
      const patch = request.postDataJSON() as Partial<SyntheticUser> & { roleId?: string };
      users[0] = { ...users[0], ...patch, role: patch.roleId ?? patch.role ?? users[0].role };
      await route.fulfill({ json: { success: true, message: 'User updated successfully', data: users[0] } });
      return;
    }
    if (method === 'DELETE' && pathname === '/api/v1/users/99101') {
      users.length = 0;
      await route.fulfill({ json: { success: true, message: 'User deleted successfully', data: { deleted: true } } });
      return;
    }

    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${pathname}` } });
  });

  await page.goto('/KMC/users');
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  await expect(page.getByText('No users found')).toBeVisible();

  await page.getByRole('button', { name: 'Add User' }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByRole('textbox', { name: 'Username' }).fill('qa-user-99101');
  await createDialog.getByRole('textbox', { name: 'Email' }).fill('qa-user-99101@example.test');
  await createDialog.getByRole('textbox', { name: 'First Name' }).fill('Synthetic');
  await createDialog.getByRole('textbox', { name: 'Last Name' }).fill('User');
  await createDialog.locator('input[type="password"]').fill('SyntheticOnly123!');
  await createDialog.getByRole('combobox', { name: 'Role' }).click();
  await page.getByRole('option', { name: 'Class Teacher' }).click();
  await createDialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('User created successfully')).toBeVisible();
  await expect(page.getByText('@qa-user-99101')).toBeVisible();
  expect(writes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/users',
    body: {
      username: 'qa-user-99101',
      email: 'qa-user-99101@example.test',
      firstName: 'Synthetic',
      lastName: 'User',
      roleId: 'Class_Teacher',
      status: 'active',
    },
  });

  let row = page.getByRole('row', { name: /qa-user-99101/ });
  await row.getByRole('button', { name: /actions/i }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByRole('textbox', { name: 'First Name' }).fill('Updated Synthetic');
  await editDialog.getByRole('textbox', { name: 'Phone' }).fill('9800000001');
  await editDialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByText('User updated successfully')).toBeVisible();
  await expect(page.getByText('Updated Synthetic User')).toBeVisible();
  expect(writes[1]).toMatchObject({
    method: 'PUT',
    path: '/api/v1/users/99101',
    body: { firstName: 'Updated Synthetic', phone: '9800000001' },
  });

  row = page.getByRole('row', { name: /qa-user-99101/ });
  await row.getByRole('button', { name: /actions/i }).click();
  await page.getByRole('menuitem', { name: 'View Activity' }).click();
  const activityDialog = page.getByRole('dialog');
  await expect(activityDialog.getByText('LOGIN')).toBeVisible();
  await expect(activityDialog.getByText('192.0.2.10')).toBeVisible();
  await activityDialog.getByRole('button', { name: 'Close' }).click();

  await row.getByRole('button', { name: /actions/i }).click();
  await page.getByRole('menuitem', { name: 'Deactivate' }).click();
  await expect(page.getByText('User status updated successfully')).toBeVisible();
  await expect(page.getByText('inactive', { exact: true })).toBeVisible();
  expect(writes[2]).toMatchObject({ method: 'PUT', path: '/api/v1/users/99101', body: { status: 'inactive' } });

  row = page.getByRole('row', { name: /qa-user-99101/ });
  await row.getByRole('button', { name: /actions/i }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByText('User deleted successfully')).toBeVisible();
  await expect(page.getByText('No users found')).toBeVisible();

  expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/users',
    'PUT /api/v1/users/99101',
    'PUT /api/v1/users/99101',
    'DELETE /api/v1/users/99101',
  ]);
  expect(pageErrors).toEqual([]);
});
