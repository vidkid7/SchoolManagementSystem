import { expect, Page, test } from '@playwright/test';

const student = {
  studentId: 780001,
  studentCode: 'QA-TRANSFER-001',
  firstNameEn: 'QA Transfer',
  lastNameEn: 'Student',
  status: 'active',
  currentClassId: 63,
  class: { section: 'B' },
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

test('student transfer browser flow sends the selected same-year class and reason', async ({ page }) => {
  const writes: Array<{ method: string; path: string; body: unknown }> = [];
  let currentStudent = { ...student };

  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      writes.push({ method: request.method(), path, body: request.postDataJSON() });
      if (path.endsWith('/students/780001/transfer')) {
        const body = request.postDataJSON() as { newClassId: number; newRollNumber?: number; reason: string };
        currentStudent = { ...currentStudent, currentClassId: body.newClassId };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: currentStudent }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
      }
      return;
    }

    let data: unknown = [];
    if (path.endsWith('/academic/years')) {
      data = [{ academicYearId: 15, isCurrent: true }];
    } else if (path.endsWith('/academic/classes')) {
      data = [
        { classId: 63, gradeLevel: 6, section: 'B', academicYearId: 15 },
        { classId: 117, gradeLevel: 7, section: 'A', academicYearId: 15 },
        { classId: 118, gradeLevel: 7, section: 'B', academicYearId: 14 },
      ];
    } else if (path.endsWith('/students/780001')) {
      data = currentStudent;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/KMC/students/780001');
  await page.getByRole('button', { name: 'Transfer Student' }).click();
  const classSelect = page.getByRole('combobox', { name: 'New Class' });
  await expect(classSelect).toBeVisible();
  await classSelect.click();
  await expect(page.getByRole('option', { name: 'Class 7 — Section A' })).toBeVisible();
  await expect(page.getByRole('option', { name: /Section B/ })).toHaveCount(0);
  await page.getByRole('option', { name: 'Class 7 — Section A' }).click();
  const reason = page.getByRole('textbox', { name: 'Reason', exact: true });
  expect(await reason.getAttribute('maxlength')).toBe('500');
  await reason.fill('   ');
  const transferButton = page.getByRole('button', { name: 'Transfer Student' }).last();
  await expect(transferButton).toBeDisabled();
  await reason.fill('QA section reassignment');
  const rollNumber = page.getByRole('spinbutton', { name: 'New Roll Number' });
  await rollNumber.fill('2.5');
  await expect(page.getByText('Roll number must be a positive whole number')).toBeVisible();
  await expect(transferButton).toBeDisabled();
  await rollNumber.fill('0');
  await expect(transferButton).toBeDisabled();
  await rollNumber.fill('9');
  await expect(transferButton).toBeEnabled();
  await transferButton.click();

  await expect(page.getByRole('alert').filter({ hasText: 'Student transferred successfully!' })).toBeVisible();
  expect(writes).toEqual([{
    method: 'POST',
    path: '/api/v1/students/780001/transfer',
    body: { newClassId: 117, newRollNumber: 9, reason: 'QA section reassignment' },
  }]);
  expect(currentStudent.currentClassId).toBe(117);
});

test('student transfer keeps the dialog open and displays the server error', async ({ page }) => {
  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== 'GET') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Transfer service unavailable' }),
      });
      return;
    }
    let data: unknown = [];
    if (path.endsWith('/academic/years')) data = [{ academicYearId: 15, isCurrent: true }];
    else if (path.endsWith('/academic/classes')) data = [
      { classId: 63, gradeLevel: 6, section: 'B', academicYearId: 15 },
      { classId: 117, gradeLevel: 7, section: 'A', academicYearId: 15 },
    ];
    else if (path.endsWith('/students/780001')) data = student;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/KMC/students/780001');
  await page.getByRole('button', { name: 'Transfer Student' }).first().click();
  const classSelect = page.getByRole('combobox', { name: 'New Class' });
  await classSelect.click();
  await page.getByRole('option', { name: 'Class 7 — Section A' }).click();
  await page.getByRole('textbox', { name: 'Reason', exact: true }).fill('QA server error check');
  await page.getByRole('button', { name: 'Transfer Student' }).last().click();

  await expect(page.getByRole('alert').filter({ hasText: 'Transfer service unavailable' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transfer Student', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Transfer Student' }).last()).toBeEnabled();
});
