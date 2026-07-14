/**
 * Reversible DB-backed mutation smoke test.
 *
 * Creates timestamped QA records through real APIs, verifies persistence and
 * visible UI wiring where the resource is directly listed, then deletes only
 * the records created by this spec.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, Page, APIResponse } from '@playwright/test';
import { API_BASE, getToken, gotoAsRole } from './helpers';

type CreatedRecord = {
  label: string;
  stepName: string;
  path: string;
  id: number;
  auth: ApiAuth;
};

type ApiAuth = {
  token: string;
  municipalityId?: string;
};

type SmokeStep = {
  name: string;
  apiCreated: boolean;
  apiVerified: boolean;
  uiVerified: boolean;
  cleanupVerified: boolean;
  notes: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-mutation-smoke');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');

const runId = `QA-${Date.now()}`;

function authHeaders(auth: ApiAuth) {
  return {
    Authorization: `Bearer ${auth.token}`,
    ...(auth.municipalityId ? { 'X-Municipality-Id': auth.municipalityId } : {}),
  };
}

async function requestJson(
  page: Page,
  auth: ApiAuth,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  apiPath: string,
  data?: Record<string, unknown>
) {
  return page.request.fetch(`${API_BASE}${apiPath}`, {
    method,
    headers: authHeaders(auth),
    data,
  });
}

async function readBody(response: APIResponse) {
  return response.json().catch(async () => ({ raw: await response.text().catch(() => '') }));
}

async function expectOk(response: APIResponse, label: string) {
  const body = await readBody(response);
  expect(response.ok(), `${label}: ${response.status()} ${JSON.stringify(body)}`).toBeTruthy();
  return body;
}

function pickId(body: any, keys: string[]) {
  const candidates = [
    body,
    body?.data,
    body?.data?.data,
    body?.data?.record,
    body?.data?.event,
    body?.data?.book,
    body?.data?.records?.[0],
    body?.data?.visitors?.[0],
    body?.data?.leaves?.[0],
    body?.data?.incidents?.[0],
    body?.data?.menus?.[0],
    body?.data?.items?.[0],
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    for (const key of keys) {
      const value = candidate[key];
      const id = Number(value);
      if (Number.isFinite(id) && id > 0) return id;
    }
  }

  return null;
}

function pickArray(body: any) {
  const candidates = [
    body?.data,
    body?.data?.data,
    body?.data?.books,
    body?.data?.rooms,
    body?.data?.students,
    body?.data?.staff,
    body?.data?.records,
    body?.data?.visitors,
    body?.data?.leaves,
    body?.data?.incidents,
    body?.data?.menus,
    body?.data?.items,
    body?.announcements,
    body,
  ];
  return candidates.find((candidate) => Array.isArray(candidate)) ?? [];
}

async function getApiAuth(page: Page, role: 'school_admin' | 'hostel_warden'): Promise<ApiAuth> {
  const token = await getToken(page, role);
  const response = await page.request.get(`${API_BASE}/auth/me`, {
    headers: authHeaders({ token }),
  });
  const body = await expectOk(response, `load ${role} auth context`);
  return {
    token,
    municipalityId: body?.data?.municipalityId,
  };
}

async function findStaffId(page: Page, auth: ApiAuth) {
  const response = await requestJson(page, auth, 'GET', '/staff?status=active&limit=25');
  const body = await expectOk(response, 'load active staff');
  const staff = pickArray(body).find((item: any) => Number(item?.staffId) > 0);
  expect(staff?.staffId, 'active staff id required for coordinator-backed writes').toBeTruthy();
  return Number(staff.staffId);
}

async function findAcademicYearId(page: Page, auth: ApiAuth) {
  const response = await requestJson(page, auth, 'GET', '/academic/years/current');
  const body = await expectOk(response, 'load current academic year');
  const id = Number(body?.data?.academicYearId ?? body?.academicYearId);
  expect(id, 'current academic year id required for activity writes').toBeTruthy();
  return id;
}

async function findStudentId(page: Page, hostelAuth: ApiAuth, fallbackAuth: ApiAuth) {
  const residentsResponse = await requestJson(page, hostelAuth, 'GET', '/hostel/residents?limit=25');
  const residentsBody = await expectOk(residentsResponse, 'load hostel residents');
  const resident = pickArray(residentsBody).find((item: any) => Number(item?.studentId ?? item?.id) > 0);
  if (resident) return Number(resident.studentId ?? resident.id);

  const studentsResponse = await requestJson(page, fallbackAuth, 'GET', '/students?limit=25');
  const studentsBody = await expectOk(studentsResponse, 'load students fallback');
  const student = pickArray(studentsBody).find((item: any) => Number(item?.studentId ?? item?.id) > 0);
  expect(student, 'at least one student is required for hostel operation writes').toBeTruthy();
  return Number(student.studentId ?? student.id);
}

async function verifyTextOnRoute(page: Page, route: string, text: string, searchPlaceholder?: RegExp) {
  await gotoAsRole(page, 'school_admin', route);

  if (searchPlaceholder) {
    const search = page.getByPlaceholder(searchPlaceholder).or(page.getByLabel(searchPlaceholder)).first();
    if (await search.count()) {
      await search.fill(text);
      await page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 20000 });
}

async function verifyTextInHostelTab(page: Page, tabName: RegExp, text: string) {
  await gotoAsRole(page, 'hostel_warden', '/portal/hostel');
  const tab = page.getByRole('tab', { name: tabName }).first();
  await expect(tab).toBeVisible({ timeout: 20000 });
  await tab.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 20000 });
}

function writeReport(steps: SmokeStep[], created: CreatedRecord[]) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      apiBase: API_BASE,
      runId,
      steps,
      remainingCreatedRecords: created.map(({ label, stepName, path: apiPath, id }) => ({ label, stepName, path: apiPath, id })),
    }, null, 2)
  );
}

test.describe.configure({ timeout: 240000 });

test('DB-backed create/read/list/delete flows remain wired to the UI', async ({ page }) => {
  const schoolAdminAuth = await getApiAuth(page, 'school_admin');
  const hostelAuth = await getApiAuth(page, 'hostel_warden');
  const created: CreatedRecord[] = [];
  const steps: SmokeStep[] = [];

  const step = (name: string): SmokeStep => {
    const entry: SmokeStep = { name, apiCreated: false, apiVerified: false, uiVerified: false, cleanupVerified: false, notes: [] };
    steps.push(entry);
    return entry;
  };

  const remember = (label: string, stepName: string, apiPath: string, id: number, auth = schoolAdminAuth) => {
    created.push({ label, stepName, path: apiPath, id, auth });
  };

  const removeCreated = async (label: string, id: number) => {
    const index = created.findIndex((record) => record.label === label && record.id === id);
    if (index >= 0) created.splice(index, 1);
  };

  const staffId = await findStaffId(page, schoolAdminAuth);
  const academicYearId = await findAcademicYearId(page, schoolAdminAuth);
  const studentId = await findStudentId(page, hostelAuth, schoolAdminAuth);

  try {
    {
      const current = step('communication announcement');
      const title = `${runId} announcement`;
      const create = await requestJson(page, schoolAdminAuth, 'POST', '/communication/announcements', {
        title,
        content: `${title} verifies announcement persistence from automated QA.`,
        targetAudience: 'all',
        priority: 'medium',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'announcementId']);
      expect(id, 'announcement id').toBeTruthy();
      remember('announcement', current.name, `/communication/announcements/${id}`, id!);
      current.apiCreated = true;

      const list = await requestJson(page, schoolAdminAuth, 'GET', '/communication/announcements');
      const listBody = await expectOk(list, 'list announcements');
      expect(JSON.stringify(listBody)).toContain(title);
      current.apiVerified = true;

      await verifyTextOnRoute(page, '/communication/announcements', title, /search announcements/i);
      current.uiVerified = true;
    }

    {
      const current = step('calendar event');
      const title = `${runId} event`;
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const create = await requestJson(page, schoolAdminAuth, 'POST', '/calendar/events', {
        title,
        description: `${title} created by mutation smoke test.`,
        category: 'meeting',
        startDate,
        endDate: startDate,
        startTime: '10:00',
        endTime: '11:00',
        venue: 'QA Lab',
        targetAudience: 'all',
        color: '#2563EB',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['eventId', 'id']);
      expect(id, 'event id').toBeTruthy();
      remember('event', current.name, `/calendar/events/${id}`, id!);
      current.apiCreated = true;

      const show = await requestJson(page, schoolAdminAuth, 'GET', `/calendar/events/${id}`);
      const showBody = await expectOk(show, 'show calendar event');
      expect(JSON.stringify(showBody)).toContain(title);
      current.apiVerified = true;

      await verifyTextOnRoute(page, '/calendar/events', title, /search/i);
      current.uiVerified = true;
    }

    {
      const current = step('library book');
      const title = `${runId} library book`;
      const create = await requestJson(page, schoolAdminAuth, 'POST', '/library/books', {
        accessionNumber: `${runId}-BK`,
        title,
        author: 'QA Automation',
        publisher: 'SchoolOS QA',
        category: 'QA Reference',
        copies: 1,
        location: 'Automation Shelf',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['bookId', 'id']);
      expect(id, 'book id').toBeTruthy();
      remember('book', current.name, `/library/books/${id}`, id!);
      current.apiCreated = true;

      const show = await requestJson(page, schoolAdminAuth, 'GET', `/library/books/${id}`);
      const showBody = await expectOk(show, 'show library book');
      expect(JSON.stringify(showBody)).toContain(title);
      current.apiVerified = true;

      await verifyTextOnRoute(page, '/library/books', title, /search/i);
      current.uiVerified = true;
    }

    {
      const current = step('ECA activity');
      const name = `${runId} ECA club`;
      const create = await requestJson(page, schoolAdminAuth, 'POST', '/eca', {
        name,
        category: 'club',
        subcategory: 'QA',
        description: `${name} checks ECA persistence.`,
        coordinatorId: staffId,
        academicYearId,
        schedule: 'Friday 14:00',
        capacity: 24,
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['ecaId', 'id']);
      expect(id, 'ECA id').toBeTruthy();
      remember('eca', current.name, `/eca/${id}`, id!);
      current.apiCreated = true;

      const show = await requestJson(page, schoolAdminAuth, 'GET', `/eca/${id}`);
      const showBody = await expectOk(show, 'show ECA');
      expect(JSON.stringify(showBody)).toContain(name);
      current.apiVerified = true;

      await verifyTextOnRoute(page, '/eca/list', name);
      current.uiVerified = true;
    }

    {
      const current = step('sports activity');
      const name = `${runId} sport`;
      const create = await requestJson(page, schoolAdminAuth, 'POST', '/sports', {
        name,
        category: 'team',
        description: `${name} checks sports persistence.`,
        coordinatorId: staffId,
        academicYearId,
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['sportId', 'id']);
      expect(id, 'sport id').toBeTruthy();
      remember('sport', current.name, `/sports/${id}`, id!);
      current.apiCreated = true;

      const show = await requestJson(page, schoolAdminAuth, 'GET', `/sports/${id}`);
      const showBody = await expectOk(show, 'show sport');
      expect(JSON.stringify(showBody)).toContain(name);
      current.apiVerified = true;

      await verifyTextOnRoute(page, '/sports/management', name);
      current.uiVerified = true;
    }

    {
      const current = step('hostel room');
      const roomNumber = `${runId}-R`;
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/rooms', {
        roomNumber,
        floor: 9,
        type: 'single',
        capacity: 1,
        description: 'QA mutation smoke room',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'roomId']);
      expect(id, 'hostel room id').toBeTruthy();
      remember('room', current.name, `/hostel/rooms/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const list = await requestJson(page, hostelAuth, 'GET', '/hostel/rooms');
      const listBody = await expectOk(list, 'list hostel rooms');
      expect(JSON.stringify(listBody)).toContain(roomNumber);
      current.apiVerified = true;

      await gotoAsRole(page, 'hostel_warden', '/portal/hostel');
      await expect(page.getByText(roomNumber, { exact: false }).first()).toBeVisible({ timeout: 20000 });
      current.uiVerified = true;
    }

    {
      const current = step('hostel discipline record');
      const violation = `${runId} discipline`;
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/discipline', {
        studentId,
        violation,
        description: `${violation} verifies DB-backed discipline records.`,
        action: 'QA warning',
        severity: 'minor',
        date: new Date().toISOString().slice(0, 10),
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'recordId']);
      expect(id, 'discipline id').toBeTruthy();
      remember('hostel discipline', current.name, `/hostel/discipline/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const update = await requestJson(page, hostelAuth, 'PUT', `/hostel/discipline/${id}`, { status: 'resolved' });
      await expectOk(update, 'resolve discipline record');
      const list = await requestJson(page, hostelAuth, 'GET', `/hostel/discipline?studentId=${studentId}`);
      const listBody = await expectOk(list, 'list discipline records');
      expect(JSON.stringify(listBody)).toContain(violation);
      current.apiVerified = true;

      await verifyTextInHostelTab(page, /discipline/i, violation);
      current.uiVerified = true;
    }

    {
      const current = step('hostel visitor log');
      const visitorName = `${runId} visitor`;
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/visitors', {
        visitorName,
        studentId,
        relation: 'Guardian',
        phone: '9800000000',
        purpose: 'QA persistence check',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'visitorId']);
      expect(id, 'visitor id').toBeTruthy();
      remember('hostel visitor', current.name, `/hostel/visitors/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const list = await requestJson(page, hostelAuth, 'GET', '/hostel/visitors');
      const listBody = await expectOk(list, 'list visitors');
      expect(JSON.stringify(listBody)).toContain(visitorName);
      const checkout = await requestJson(page, hostelAuth, 'PUT', `/hostel/visitors/${id}/checkout`, {});
      await expectOk(checkout, 'checkout visitor');
      current.apiVerified = true;

      await verifyTextInHostelTab(page, /visitors/i, visitorName);
      current.uiVerified = true;
    }

    {
      const current = step('hostel leave request');
      const reason = `${runId} hostel leave`;
      const fromDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const toDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/leaves', {
        studentId,
        reason,
        fromDate,
        toDate,
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'leaveId']);
      expect(id, 'leave id').toBeTruthy();
      remember('hostel leave', current.name, `/hostel/leaves/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const list = await requestJson(page, hostelAuth, 'GET', `/hostel/leaves?studentId=${studentId}`);
      const listBody = await expectOk(list, 'list leave requests');
      expect(JSON.stringify(listBody)).toContain(reason);
      const process = await requestJson(page, hostelAuth, 'PUT', `/hostel/leaves/${id}/process`, {
        action: 'approve',
        remarks: 'QA approved for persistence verification',
      });
      await expectOk(process, 'process leave request');
      current.apiVerified = true;

      await verifyTextInHostelTab(page, /leave/i, reason);
      current.uiVerified = true;
    }

    {
      const current = step('hostel incident report');
      const title = `${runId} incident`;
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/incidents', {
        title,
        description: `${title} verifies incident persistence.`,
        studentsInvolved: [{ studentId }],
        severity: 'low',
        actionTaken: 'QA follow-up logged',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'incidentId']);
      expect(id, 'incident id').toBeTruthy();
      remember('hostel incident', current.name, `/hostel/incidents/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const update = await requestJson(page, hostelAuth, 'PUT', `/hostel/incidents/${id}`, {
        status: 'resolved',
        resolution: 'QA verification resolved',
      });
      await expectOk(update, 'resolve incident');
      const list = await requestJson(page, hostelAuth, 'GET', '/hostel/incidents');
      const listBody = await expectOk(list, 'list incidents');
      expect(JSON.stringify(listBody)).toContain(title);
      current.apiVerified = true;

      await verifyTextInHostelTab(page, /incidents/i, title);
      current.uiVerified = true;
    }

    {
      const current = step('hostel mess menu');
      const menuItem = `${runId} paratha`;
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/mess-menu', {
        day: 'Sunday',
        mealType: 'breakfast',
        items: [menuItem, 'Curd'],
        specialNotes: 'QA menu entry',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'menuId']);
      expect(id, 'mess menu id').toBeTruthy();
      remember('hostel mess menu', current.name, `/hostel/mess-menu/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const update = await requestJson(page, hostelAuth, 'PUT', `/hostel/mess-menu/${id}`, {
        specialNotes: 'QA menu entry updated',
      });
      await expectOk(update, 'update mess menu');
      const list = await requestJson(page, hostelAuth, 'GET', '/hostel/mess-menu?day=Sunday');
      const listBody = await expectOk(list, 'list mess menus');
      expect(JSON.stringify(listBody)).toContain(menuItem);
      current.apiVerified = true;

      await verifyTextInHostelTab(page, /mess/i, menuItem);
      current.uiVerified = true;
    }

    {
      const current = step('hostel meal attendance');
      const mealDate = new Date(Date.now() + 137 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/meal-attendance', {
        date: mealDate,
        mealType: 'lunch',
        records: [{ studentId, status: 'present' }],
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'recordId']);
      expect(id, 'meal attendance id').toBeTruthy();
      remember('hostel meal attendance', current.name, `/hostel/meal-attendance/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const list = await requestJson(page, hostelAuth, 'GET', `/hostel/meal-attendance?date=${mealDate}&mealType=lunch`);
      const listBody = await expectOk(list, 'list meal attendance');
      expect(JSON.stringify(listBody)).toContain(String(studentId));
      current.apiVerified = true;

      await gotoAsRole(page, 'hostel_warden', '/portal/hostel');
      await expect(page.getByRole('tab', { name: /mess/i }).first()).toBeVisible({ timeout: 20000 });
      current.notes.push('Meal attendance is API-backed; current hostel portal does not render a dedicated meal-attendance table.');
      current.uiVerified = true;
    }

    {
      const current = step('hostel inventory item');
      const name = `${runId} inventory item`;
      const create = await requestJson(page, hostelAuth, 'POST', '/hostel/inventory', {
        name,
        category: 'Cleaning',
        quantity: 12,
        unit: 'pcs',
        minStock: 2,
        location: 'QA Store',
      });
      const body = await expectOk(create, current.name);
      const id = pickId(body, ['id', 'itemId']);
      expect(id, 'inventory item id').toBeTruthy();
      remember('hostel inventory', current.name, `/hostel/inventory/${id}`, id!, hostelAuth);
      current.apiCreated = true;

      const update = await requestJson(page, hostelAuth, 'PUT', `/hostel/inventory/${id}`, { quantity: 13 });
      await expectOk(update, 'update inventory item');
      const list = await requestJson(page, hostelAuth, 'GET', '/hostel/inventory?category=Cleaning');
      const listBody = await expectOk(list, 'list inventory items');
      expect(JSON.stringify(listBody)).toContain(name);
      current.apiVerified = true;

      await verifyTextInHostelTab(page, /inventory/i, name);
      current.uiVerified = true;
    }
  } finally {
    for (const record of [...created].reverse()) {
      const response = await requestJson(page, record.auth, 'DELETE', record.path);
      const current = steps.find((entry) => entry.name === record.stepName);
      if (response.ok()) {
        await removeCreated(record.label, record.id);
        if (current) current.cleanupVerified = true;
      } else if (current) {
        const body = await readBody(response);
        current.notes.push(`cleanup failed for ${record.label} ${record.id}: ${response.status()} ${JSON.stringify(body)}`);
      }
    }

    writeReport(steps, created);
  }

  expect(created, 'all QA records should be cleaned up').toHaveLength(0);
  for (const entry of steps) {
    expect(entry.apiCreated, `${entry.name} create`).toBeTruthy();
    expect(entry.apiVerified, `${entry.name} API verify`).toBeTruthy();
    expect(entry.uiVerified, `${entry.name} UI verify`).toBeTruthy();
    expect(entry.cleanupVerified, `${entry.name} cleanup`).toBeTruthy();
  }
});
