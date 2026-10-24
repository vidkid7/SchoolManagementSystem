import { expect, Page, test } from '@playwright/test';

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999014,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

type SyntheticRole = {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Array<{ id: string; name: string; code: string; category: string; action: string; isActive: boolean }>;
};

test('Role Management validates and completes synthetic role and permission CRUD flows', async ({ page }) => {
  const permissions = [
    { id: 'perm-student-read', name: 'Read Students', code: 'STUDENT_READ', category: 'student', action: 'read', isActive: true },
    { id: 'perm-student-create', name: 'Create Students', code: 'STUDENT_CREATE', category: 'student', action: 'create', isActive: true },
  ];
  const systemRole: SyntheticRole = {
    id: 'system-admin',
    name: 'Built-in Administrator',
    code: 'SCHOOL_ADMIN',
    description: 'Immutable synthetic system role',
    isSystem: true,
    isActive: true,
    permissions: [],
  };
  const roles: SyntheticRole[] = [systemRole];
  const writes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [];
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path === '/api/v1/config/roles') {
      await route.fulfill({ json: { success: true, data: roles } });
      return;
    }
    if (method === 'GET' && path === '/api/v1/config/permissions') {
      await route.fulfill({ json: { success: true, data: permissions } });
      return;
    }

    const permissionMatch = path.match(/^\/api\/v1\/config\/roles\/([^/]+)\/permissions$/);
    if (method === 'POST' && permissionMatch) {
      const body = request.postDataJSON() as { permissionIds: string[] };
      writes.push({ method, path, body });
      const role = roles.find(item => item.id === permissionMatch[1]);
      if (!role) {
        await route.fulfill({ status: 404, json: { success: false } });
        return;
      }
      role.permissions = permissions.filter(permission => body.permissionIds.includes(permission.id));
      await route.fulfill({ json: { success: true, data: role } });
      return;
    }

    const roleMatch = path.match(/^\/api\/v1\/config\/roles(?:\/([^/]+))?$/);
    if (roleMatch && method !== 'GET') {
      const body = method === 'DELETE' ? undefined : request.postDataJSON() as Record<string, unknown>;
      writes.push({ method, path, body });
      const roleId = roleMatch[1];
      if (method === 'POST' && !roleId) {
        roles.push({
          id: 'qa-role-901',
          name: String(body?.name ?? ''),
          code: String(body?.code ?? ''),
          description: String(body?.description ?? ''),
          isSystem: false,
          isActive: Boolean(body?.isActive),
          permissions: [],
        });
        await route.fulfill({ status: 201, json: { success: true, data: roles[roles.length - 1] } });
        return;
      }
      const index = roles.findIndex(role => role.id === roleId);
      if (index >= 0 && method === 'PUT') {
        roles[index] = { ...roles[index], ...body };
        await route.fulfill({ json: { success: true, data: roles[index] } });
        return;
      }
      if (index >= 0 && method === 'DELETE' && !roles[index].isSystem) {
        roles.splice(index, 1);
        await route.fulfill({ json: { success: true, data: { deleted: true } } });
        return;
      }
    }

    await route.fulfill({ status: 404, json: { success: false, message: `Unexpected ${method} ${path}` } });
  });

  await page.goto('/KMC/settings/roles');
  await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  const systemRow = page.getByRole('row', { name: /Built-in Administrator/ });
  await expect(systemRow.getByRole('checkbox', { name: 'Deactivate Built-in Administrator' })).toBeDisabled();
  await expect(systemRow.getByRole('button', { name: 'Edit' })).toBeDisabled();
  await expect(systemRow.getByRole('button', { name: 'Delete' })).toBeDisabled();

  await page.getByRole('button', { name: 'Add Role' }).click();
  let roleDialog = page.getByRole('dialog', { name: 'Create Role' });
  await roleDialog.getByRole('textbox', { name: 'Role Name' }).fill('Discarded Draft');
  await roleDialog.getByRole('textbox', { name: 'Role Code' }).fill('DRAFT_ROLE');
  await roleDialog.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Add Role' }).click();
  roleDialog = page.getByRole('dialog', { name: 'Create Role' });
  await expect(roleDialog.getByRole('textbox', { name: 'Role Name' })).toHaveValue('');
  await expect(roleDialog.getByRole('textbox', { name: 'Role Code' })).toHaveValue('');
  await roleDialog.getByRole('textbox', { name: 'Role Name' }).fill('QA Test Role');
  await roleDialog.getByRole('textbox', { name: 'Role Code' }).fill('qa test role');
  await expect(roleDialog.getByRole('textbox', { name: 'Role Code' })).toHaveValue('QA_TEST_ROLE');
  await roleDialog.getByRole('textbox', { name: 'Description' }).fill('Synthetic role CRUD fixture');
  await roleDialog.getByRole('button', { name: 'Create Role' }).click();
  await expect(page.getByText('Role created successfully')).toBeVisible();
  let roleRow = page.getByRole('row', { name: /QA Test Role/ });
  await expect(roleRow).toContainText('QA_TEST_ROLE');
  expect(writes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/config/roles',
    body: { name: 'QA Test Role', code: 'QA_TEST_ROLE', description: 'Synthetic role CRUD fixture', isActive: true },
  });

  await roleRow.getByRole('button', { name: 'Manage Permissions (0)' }).click();
  const permissionDialog = page.getByRole('dialog', { name: 'Manage Permissions: QA Test Role' });
  await expect(permissionDialog.getByRole('button', { name: 'Save' })).toBeEnabled();
  await permissionDialog.getByRole('button', { name: 'Read', exact: true }).click();
  await permissionDialog.getByRole('button', { name: 'Create', exact: true }).click();
  await permissionDialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Permissions updated successfully')).toBeVisible();
  roleRow = page.getByRole('row', { name: /QA Test Role/ });
  await expect(roleRow.getByRole('button', { name: 'Manage Permissions (2)' })).toBeVisible();
  expect(writes[1]).toMatchObject({
    method: 'POST',
    path: '/api/v1/config/roles/qa-role-901/permissions',
    body: { permissionIds: ['perm-student-read', 'perm-student-create'] },
  });

  await roleRow.getByRole('button', { name: 'Edit' }).click();
  roleDialog = page.getByRole('dialog', { name: 'Update Role' });
  await expect(roleDialog.getByRole('textbox', { name: 'Role Code' })).toBeDisabled();
  await roleDialog.getByRole('textbox', { name: 'Role Name' }).fill('QA Test Role Updated');
  await roleDialog.getByRole('button', { name: 'Update Role' }).click();
  await expect(page.getByText('Role updated successfully')).toBeVisible();
  roleRow = page.getByRole('row', { name: /QA Test Role Updated/ });
  await expect(roleRow).toBeVisible();

  await roleRow.getByRole('button', { name: 'Expand details for QA Test Role Updated' }).click();
  await expect(page.getByText('student.read')).toBeVisible();
  await expect(page.getByText('student.create')).toBeVisible();
  await roleRow.getByRole('checkbox', { name: 'Deactivate QA Test Role Updated' }).click();
  await expect(roleRow.getByRole('checkbox', { name: 'Activate QA Test Role Updated' })).toBeChecked();

  page.once('dialog', browserDialog => browserDialog.accept());
  await roleRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Role deleted successfully')).toBeVisible();
  await expect(page.getByText('QA Test Role Updated')).toHaveCount(0);

  expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
    'POST /api/v1/config/roles',
    'POST /api/v1/config/roles/qa-role-901/permissions',
    'PUT /api/v1/config/roles/qa-role-901',
    'PUT /api/v1/config/roles/qa-role-901',
    'DELETE /api/v1/config/roles/qa-role-901',
  ]);
  expect(writes[2].body).toMatchObject({ name: 'QA Test Role Updated', code: 'QA_TEST_ROLE' });
  expect(writes[3].body).toEqual({ isActive: false });
  expect(pageErrors).toEqual([]);
});
