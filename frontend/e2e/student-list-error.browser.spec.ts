import { expect, Page, test } from '@playwright/test';

const student = {
  studentId: 780009,
  studentCode: 'QA-STUDENT-RECOVERY-001',
  firstNameEn: 'QA Recovery',
  lastNameEn: 'Student',
  status: 'active',
};

async function installQaSession(page: Page) {
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

test('student list shows a retry action after an API failure and recovers', async ({ page }) => {
  const studentListRequests: string[] = [];

  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'GET' && path.endsWith('/academic/classes')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
      return;
    }
    if (route.request().method() === 'GET' && path.endsWith('/students')) {
      studentListRequests.push(path);
      if (studentListRequests.length <= 2) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Service unavailable' }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [student], meta: { total: 1 } }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  await page.goto('/KMC/students');
  await expect(page.getByRole('alert')).toContainText('Failed to load data');
  await expect(page.getByText('QA Recovery Student')).toHaveCount(0);

  await page.getByRole('button', { name: 'Retry' }).click();

  await expect(page.getByText('QA Recovery Student')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(studentListRequests).toHaveLength(3);
});
