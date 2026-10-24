import { expect, Page, test } from '@playwright/test';

type AssignmentRecord = {
  assignmentId: number;
  staffId: number;
  academicYearId: number;
  assignmentType: 'class_teacher' | 'subject_teacher';
  classId: number;
  subjectId: number | null;
  section: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
};

async function installSyntheticLocalAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999009,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('staff assignment UI creates, versions edits, and deletes a synthetic assignment', async ({ page }) => {
  const pageErrors: string[] = [];
  const writes: Array<{ method: string; path: string; body?: unknown }> = [];
  const assignments: AssignmentRecord[] = [];
  let nextAssignmentId = 87001;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installSyntheticLocalAdmin(page);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'GET' && path.endsWith('/staff/1')) {
      await route.fulfill({ json: { success: true, data: {
        staffId: 1,
        firstNameEn: 'QA Assignment',
        lastNameEn: 'Teacher',
        position: 'teacher',
      } } });
      return;
    }
    if (method === 'GET' && path.endsWith('/staff/1/assignments')) {
      await route.fulfill({ json: { success: true, data: assignments } });
      return;
    }
    if (method === 'GET' && path.endsWith('/academic/classes')) {
      await route.fulfill({ json: { success: true, data: [{ classId: 11, gradeLevel: 7, section: 'B' }] } });
      return;
    }
    if (method === 'GET' && path.endsWith('/academic/subjects')) {
      await route.fulfill({ json: { success: true, data: [{ subjectId: 21, nameEn: 'Science', nameNp: 'विज्ञान' }] } });
      return;
    }
    if (method === 'GET' && path.endsWith('/academic/years/current')) {
      await route.fulfill({ json: { success: true, data: { academicYearId: 31 } } });
      return;
    }

    if (method === 'POST' && path.endsWith('/staff/1/assign')) {
      const body = request.postDataJSON();
      writes.push({ method, path, body });
      const created: AssignmentRecord = { ...body, assignmentId: nextAssignmentId++ };
      assignments.push(created);
      await route.fulfill({ status: 201, json: { success: true, data: created } });
      return;
    }
    const endMatch = path.match(/\/staff\/assignments\/(\d+)\/end$/);
    if (method === 'PUT' && endMatch) {
      const body = request.postDataJSON();
      writes.push({ method, path, body });
      const assignment = assignments.find((record) => record.assignmentId === Number(endMatch[1]));
      if (assignment) {
        assignment.isActive = false;
        assignment.endDate = body.endDate;
      }
      await route.fulfill({ json: { success: true, data: assignment ?? null } });
      return;
    }
    const deleteMatch = path.match(/\/staff\/assignments\/(\d+)$/);
    if (method === 'DELETE' && deleteMatch) {
      writes.push({ method, path });
      const index = assignments.findIndex((record) => record.assignmentId === Number(deleteMatch[1]));
      if (index >= 0) assignments.splice(index, 1);
      await route.fulfill({ json: { success: true, data: { deleted: index >= 0 } } });
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push({ method, path, body: request.postData() });
      await route.fulfill({ status: 404, json: { success: false, message: 'Unexpected write blocked by QA test' } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto('/KMC/staff/1/assignments');
  await expect(page.getByRole('heading', { name: 'Teacher Assignments' })).toBeVisible();
  await expect(page.getByText('No assignments found')).toBeVisible();
  await page.getByRole('button', { name: 'Add Assignment' }).first().click();
  const dialog = page.getByRole('dialog');

  const addButton = dialog.getByRole('button', { name: 'Add Assignment' });
  await expect(addButton).toBeDisabled();
  await dialog.getByRole('combobox', { name: 'Class' }).click();
  await page.getByRole('option', { name: 'Class 7 - Section B' }).click();
  await expect(addButton).toBeDisabled();
  await dialog.getByRole('combobox', { name: 'Subject', exact: true }).click();
  await page.getByRole('option', { name: 'Science', exact: true }).click();
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await expect(page.getByText('Assignment added successfully')).toBeVisible();
  await expect(page.getByRole('row', { name: /Subject Teacher.*Class 7.*B.*Science/ })).toBeVisible();

  expect(assignments).toHaveLength(1);
  expect(assignments[0]).toMatchObject({
    assignmentId: 87001,
    staffId: 1,
    academicYearId: 31,
    assignmentType: 'subject_teacher',
    classId: 11,
    subjectId: 21,
    section: 'B',
    isActive: true,
  });

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog.getByRole('combobox', { name: 'Class' })).toHaveText(/Class 7 - Section B/);
  await editDialog.getByRole('combobox', { name: /^Subject/ }).click();
  await page.getByRole('option', { name: 'Science', exact: true }).click();
  await editDialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Assignment updated successfully')).toBeVisible();
  await expect(page.getByRole('table').getByText('Inactive', { exact: true })).toBeVisible();
  await expect(page.getByRole('row', { name: /Subject Teacher.*Class 7.*B.*Science/ })).toHaveCount(2);

  page.once('dialog', (dialogEvent) => dialogEvent.accept());
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await expect(page.getByText('Assignment deleted successfully')).toBeVisible();
  await expect(page.getByRole('row', { name: /Subject Teacher.*Class 7.*B.*Science/ })).toHaveCount(1);

  expect(writes.map(({ method, path }) => ({ method, path }))).toEqual([
    { method: 'POST', path: '/api/v1/staff/1/assign' },
    { method: 'PUT', path: '/api/v1/staff/assignments/87001/end' },
    { method: 'POST', path: '/api/v1/staff/1/assign' },
    { method: 'DELETE', path: '/api/v1/staff/assignments/87002' },
  ]);
  expect(writes[0].body).toMatchObject({ staffId: 1, academicYearId: 31, classId: 11, subjectId: 21, section: 'B' });
  expect(writes[2].body).toMatchObject({ staffId: 1, academicYearId: 31, classId: 11, subjectId: 21, section: 'B' });
  expect(pageErrors).toEqual([]);
});
