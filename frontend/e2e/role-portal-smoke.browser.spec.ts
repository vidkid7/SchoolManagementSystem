import { expect, test } from '@playwright/test';

const rolePortals = [
  { role: 'Municipality_Admin', route: 'municipality' },
  { role: 'Student', route: 'portal/student' },
  { role: 'Parent', route: 'portal/parent' },
  { role: 'Class_Teacher', route: 'portal/class-teacher' },
  { role: 'Class_Teacher', route: 'portal/teacher' },
  { role: 'Department_Head', route: 'portal/department-head' },
  { role: 'Transport_Manager', route: 'portal/transport' },
  { role: 'Hostel_Warden', route: 'portal/hostel' },
  { role: 'Non_Teaching_Staff', route: 'portal/non-teaching-staff' },
  { role: 'Accountant', route: 'portal/accountant' },
  { role: 'Sports_Coordinator', route: 'portal/sports-coordinator' },
  { role: 'ECA_Coordinator', route: 'portal/eca-coordinator' },
  { role: 'Librarian', route: 'portal/librarian' },
  { role: 'Student', route: 'my-certificates' },
  { role: 'Municipality_Admin', route: 'admin/municipality/dashboard' },
];

for (const { role, route } of rolePortals) {
  test(`${role} can mount /${route} without API writes`, async ({ page }) => {
    test.setTimeout(45_000);
    const attemptedWrites: string[] = [];
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.addInitScript((profileRole) => {
      localStorage.setItem('accessToken', 'qa-local-only-token');
      localStorage.setItem('refreshToken', 'qa-local-only-refresh');
      localStorage.setItem('user', JSON.stringify({
        userId: 999001,
        username: `qa-${profileRole.toLowerCase()}`,
        email: 'qa-local@example.test',
        role: profileRole,
        municipalityCode: 'KMC',
        schoolConfigId: 'qa-local-school',
      }));
    }, role);
    await page.route('**/api/**', async (routeRequest) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(routeRequest.request().method())) {
        attemptedWrites.push(`${routeRequest.request().method()} ${new URL(routeRequest.request().url()).pathname}`);
        await routeRequest.abort('blockedbyclient');
        return;
      }
      await routeRequest.continue();
    });

    await page.goto(`/KMC/${route}`, { waitUntil: 'domcontentloaded' });
    await page.locator('main').first().waitFor({ state: 'visible', timeout: 20_000 });
    await expect(page.locator('main').first()).not.toBeEmpty();
    expect(new URL(page.url()).pathname).toBe(`/KMC/${route}`);
    expect(attemptedWrites).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}

const forbiddenRoleRoutes = [
  { role: 'School_Admin', route: 'portal/student' },
  { role: 'Student', route: 'users' },
  { role: 'Class_Teacher', route: 'attendance/settings' },
];

for (const { role, route } of forbiddenRoleRoutes) {
  test(`${role} is denied access to /${route}`, async ({ page }) => {
    await page.addInitScript((profileRole) => {
      localStorage.setItem('accessToken', 'qa-local-only-token');
      localStorage.setItem('refreshToken', 'qa-local-only-refresh');
      localStorage.setItem('user', JSON.stringify({
        userId: 999001,
        username: `qa-${profileRole.toLowerCase()}`,
        email: 'qa-local@example.test',
        role: profileRole,
        municipalityCode: 'KMC',
        schoolConfigId: 'qa-local-school',
      }));
    }, role);
    await page.goto(`/KMC/${route}`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
  });
}
