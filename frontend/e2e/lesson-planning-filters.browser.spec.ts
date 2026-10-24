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

test('lesson planning uses live academic options and applies the selected subject filter', async ({ page }) => {
  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/academic/subjects')
      ? [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }]
      : path.endsWith('/academic/classes')
        ? [{ classId: 1, gradeLevel: 1, section: 'K' }]
        : path.endsWith('/syllabus-progress')
          ? { progress: [] }
          : { lessonPlans: [
            { id: 1, topic: 'QA subject plan', subject: 'QA Subject', className: 'Class 1 - Section K', status: 'draft', objectives: [] },
            { id: 2, topic: 'Other subject plan', subject: 'Other Subject', className: 'Class 1 - Section K', status: 'draft', objectives: [] },
          ] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/KMC/teacher/lesson-planning');
  await expect(page.getByText('QA subject plan')).toBeVisible();
  await expect(page.getByText('Other subject plan')).toBeVisible();
  await expect(page.getByText('Mathematics', { exact: true })).toHaveCount(0);

  await page.getByRole('combobox', { name: 'Subject' }).click();
  await page.getByRole('option', { name: 'QA Subject' }).click();

  await expect(page.getByText('QA subject plan')).toBeVisible();
  await expect(page.getByText('Other subject plan')).toHaveCount(0);
});
