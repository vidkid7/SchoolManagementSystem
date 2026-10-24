import { expect, Page, test } from '@playwright/test';

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

test('assignment form choices come from the academic API', async ({ page }) => {
  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/academic/subjects')
      ? { subjects: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }] }
      : path.endsWith('/academic/classes')
        ? { classes: [{ classId: 1, gradeLevel: 1, section: 'K' }] }
        : { assignments: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/KMC/teacher/assignments');
  await page.getByRole('button', { name: 'Create Assignment' }).click();
  const dialog = page.getByRole('dialog');
  const selectors = dialog.getByRole('combobox');

  await selectors.nth(0).click();
  await expect(page.getByRole('option', { name: 'QA Subject' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Mathematics' })).toHaveCount(0);
  await page.getByRole('option', { name: 'QA Subject' }).click();
  await selectors.nth(1).click();
  await expect(page.getByRole('option', { name: 'Class 1 - Section K' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Class 10 A' })).toHaveCount(0);
  await page.getByRole('option', { name: 'Class 1 - Section K' }).click();

  await expect(dialog.getByRole('combobox').nth(0)).toContainText('QA Subject');
  await expect(dialog.getByRole('combobox').nth(1)).toContainText('Class 1 - Section K');
  await expect(dialog.getByRole('button', { name: 'Create Assignment' })).toBeVisible();
});
