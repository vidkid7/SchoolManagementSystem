import { expect, Page, test } from '@playwright/test';

const adminRoutes = [
  'dashboard',
  'calendar', 'calendar/view', 'communication/messages', 'communication/announcements', 'change-password', 'profile',
  'calendar/dashboard', 'calendar/events',
  'students', 'students/570001', 'students/570001/cv', 'students/create', 'students/bulk-import', 'students/bulk-add', 'students/570001/edit',
  'staff', 'staff/create', 'staff/570001', 'staff/570001/edit', 'staff/570001/assignments',
  'academic', 'academic/classes', 'academic/years', 'academic/calendar', 'academic/timetable', 'academic/syllabus', 'academic/class-subjects', 'academic/subjects',
  'academic/classes/1/teacher', 'academic/classes/1/subjects/1/teachers',
  'attendance', 'attendance/student/mark', 'attendance/mark', 'attendance/reports', 'attendance/leave', 'attendance/staff/mark', 'attendance/settings',
  'admissions', 'admissions/list', 'admissions/new', 'admissions/570001',
  'finance', 'finance/dashboard', 'finance/fee-structures', 'finance/invoices', 'finance/invoices/generate', 'finance/invoices/create', 'finance/invoices/bulk-generate',
  'finance/payments', 'finance/refunds', 'finance/payment-gateways', 'finance/reports', 'finance/students',
  'examinations', 'examinations/list', 'examinations/grading-scheme', 'examinations/grading-schemes', 'examinations/570001',
  'examinations/create', 'examinations/570001/edit', 'examinations/grades', 'examinations/570001/grades', 'examinations/reports',
  'library', 'library/dashboard', 'library/circulation', 'library/reports', 'library/management', 'library/books/new', 'library/books', 'library/catalog', 'library/categories',
  'eca', 'eca/dashboard', 'eca/management', 'eca/list', 'sports', 'sports/dashboard', 'sports/management',
  'documents', 'reports', 'teacher/dashboard', 'teacher/lesson-planning', 'teacher/lessons', 'teacher/assignments', 'teacher/my-class', 'teacher/classes', 'teacher/behavior', 'department/teachers',
  'certificates', 'certificates/dashboard', 'certificates/manage', 'certificates/templates', 'certificates/verify',
  'audit', 'notifications', 'my-notifications', 'users', 'settings', 'settings/school', 'settings/roles', 'settings/system', 'settings/backup', 'settings/archive',
];

async function installLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999001,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

async function smokeRouteBatch(page: Page, batchNumber: number) {
  const pageErrors: string[] = [];
  const attemptedWrites: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installLocalAdmin(page);
  await page.route('**/api/**', async (route) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
      attemptedWrites.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  const failures: string[] = [];
  const routes = adminRoutes.slice(batchNumber * 20, (batchNumber + 1) * 20);
  for (const route of routes) {
    const target = `/KMC/${route}`;
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded' });
      // The communication routes load the websocket and conversation chunks on first visit;
      // allow the lazy page to mount after the route document is ready.
      await page.locator('main').first().waitFor({ state: 'visible', timeout: 15_000 });
      await expect(page.locator('main').first()).not.toBeEmpty({ timeout: 3_000 });
    } catch (error) {
      const diagnostics = await page.evaluate(() => ({
        url: location.pathname,
        mainCount: document.querySelectorAll('main').length,
        body: document.body.innerText.slice(-240),
      })).catch(() => ({ url: 'unavailable', mainCount: -1, body: 'page evaluation failed' }));
      failures.push(`${target}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}; page=${JSON.stringify(diagnostics)}`);
    }
  }

  expect(failures, `Routes without a visible, non-empty main region in batch ${batchNumber + 1}`).toEqual([]);
  expect(attemptedWrites, 'No API mutations should be attempted during route mounting').toEqual([]);
  expect(pageErrors, 'No uncaught browser exceptions should occur while mounting routes').toEqual([]);
}

for (let batch = 0; batch < Math.ceil(adminRoutes.length / 20); batch += 1) {
  test(`School Admin route smoke batch ${batch + 1}/${Math.ceil(adminRoutes.length / 20)} (${Math.min(20, adminRoutes.length - batch * 20)} routes)`, async ({ page }) => {
    test.setTimeout(180_000);
    await smokeRouteBatch(page, batch);
  });
}
