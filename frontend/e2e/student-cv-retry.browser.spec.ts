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

test('Student CV retry uses supported GET endpoints and loads after a transient failure', async ({ page }) => {
  let dataRequests = 0;
  const requests: Array<{ method: string; path: string }> = [];

  await installQaSession(page);
  await page.route(/\/api\/v1\/cv\//, async (route) => {
    const method = route.request().method();
    const path = new URL(route.request().url()).pathname;
    requests.push({ method, path });

    if (method === 'GET' && path.endsWith('/data')) {
      dataRequests += 1;
      if (dataRequests === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Service unavailable' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            studentId: 570001,
            generatedAt: '2026-10-21T00:00:00.000Z',
            verificationUrl: 'https://example.test/verify/570001',
            personalInfo: {
              studentId: 570001,
              studentCode: 'QA-STUDENT-CV-001',
              fullNameEn: 'QA CV Student',
              dateOfBirthBS: '2069-07-03',
              dateOfBirthAD: '2012-01-01',
              gender: 'female',
              addressEn: 'QA test address',
              addressNp: '',
            },
            attendance: { overallPercentage: 0, totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0, yearWise: [] },
            customFields: { skills: [], hobbies: [], careerGoals: '', personalStatement: '' },
          },
        }),
      });
      return;
    }

    if (method === 'GET' && path.endsWith('/needs-regeneration')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { needsRegeneration: false } }) });
      return;
    }

    if (method === 'GET' && /^\/api\/v1\/cv\/\d+$/.test(path)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            studentId: 570001,
            showPersonalInfo: true,
            showAcademicPerformance: true,
            showAttendance: true,
            showECA: true,
            showSports: true,
            showCertificates: true,
            showAwards: false,
            showTeacherRemarks: false,
            skills: [],
            hobbies: [],
            careerGoals: '',
            personalStatement: '',
            templateId: 'standard',
            schoolBrandingEnabled: true,
          },
        }),
      });
      return;
    }

    if (method === 'PUT' && path === '/api/v1/cv/570001') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Save rejected' }) });
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unexpected CV endpoint' }) });
  });

  await page.goto('/KMC/students/570001/cv');
  await expect(page.getByRole('alert')).toContainText('Service unavailable');
  await page.getByRole('button', { name: 'Retry' }).click();

  await expect.poll(() => dataRequests).toBe(2);
  await expect(page.getByRole('heading', { name: 'Student CV' })).toBeVisible();
  expect(dataRequests).toBe(2);
  expect(requests.some((request) => request.method === 'POST')).toBe(false);

  await page.getByRole('tab', { name: 'Customization' }).click();
  const personalInfoToggle = page.getByRole('checkbox', { name: 'Personal Information' });
  await expect(personalInfoToggle).toBeChecked();
  await personalInfoToggle.click();
  await expect(page.getByRole('alert')).toContainText('Save rejected');
  await expect(personalInfoToggle).toBeChecked();
  expect(requests.some((request) => request.method === 'PUT' && request.path === '/api/v1/cv/570001')).toBe(true);
});
