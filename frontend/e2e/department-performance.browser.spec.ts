import { expect, test } from '@playwright/test';

test('department head sees class average exam scores from the department performance API', async ({ page }) => {
  const blockedWrites: string[] = [];

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999043,
      username: 'qa-local-department-head',
      email: 'qa-local-department-head@example.test',
      role: 'Department_Head',
      department: 'Science',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });

  await page.route(/\/api\/v1\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      blockedWrites.push(`${request.method()} ${path}`);
      await route.fulfill({ status: 422, contentType: 'application/json', body: '{"success":false}' });
      return;
    }

    let data: unknown = {};
    if (path.endsWith('/department/teachers')) {
      data = { teachers: [{ staffId: 11, firstName: 'QA', lastName: 'Teacher', department: 'Science', position: 'Teacher', classCount: 1, attendanceRate: 92, status: 'active' }], stats: { totalTeachers: 1, activeTeachers: 1, onLeave: 0, avgAttendance: 92 } };
    } else if (path.endsWith('/department/stats')) {
      data = { totalTeachers: 1, totalClasses: 1, avgPerformance: 84.5, pendingReviews: 0 };
    } else if (path.endsWith('/department/performance')) {
      data = [{ class: 'Class 8-A', averageScore: 84.5 }];
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/KMC/portal/department-head');
  await page.getByRole('tab', { name: 'Performance' }).click();

  await expect(page.getByRole('cell', { name: 'Class 8-A' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Average Score' })).toBeVisible();
  await expect(page.getByText('84.5%')).toBeVisible();
  expect(blockedWrites).toEqual([]);
});
