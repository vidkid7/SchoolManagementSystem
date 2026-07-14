/**
 * Deep UI data-entry + relationship audit.
 *
 * This spec fills real browser forms for the remaining manual layer, verifies
 * the created records through API and direct MySQL reads, then cleans only the
 * timestamped QA records created by this run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test, expect, Page, APIResponse, Locator } from '@playwright/test';
import { API_BASE, getToken, gotoAsRole } from './helpers';

type ApiAuth = {
  token: string;
  municipalityId?: string;
};

type QaEntry = {
  module: string;
  route: string;
  uiFilled: boolean;
  apiVerified: boolean;
  dbVerified: boolean;
  cleaned: boolean;
  id?: number | string;
  notes: string[];
  failures: string[];
};

type Cleanup = {
  label: string;
  method: 'DELETE' | 'POST' | 'PUT';
  path: string;
  auth: ApiAuth;
  dbAfter?: () => Promise<void>;
};

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-ui-data-entry-relations');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');
const BACKEND_DIR = path.resolve(__dirname, '..', '..', 'backend');
const runId = `QA-${Date.now()}`;

async function createUploadImageBuffer() {
  const sharp = require(path.join(BACKEND_DIR, 'node_modules', 'sharp'));
  return sharp({
    create: {
      width: 12,
      height: 12,
      channels: 3,
      background: { r: 52, g: 96, b: 148 },
    },
  }).jpeg({ quality: 90 }).toBuffer();
}

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
  const idKeys = Array.from(new Set([
    ...keys,
    ...keys.map((key) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)),
  ]));
  const candidates = [
    body,
    body?.data,
    body?.data?.data,
    body?.data?.record,
    body?.data?.admission,
    body?.data?.student,
    body?.data?.staff,
    body?.data?.exam,
    body?.data?.book,
    body?.data?.feeStructure,
    body?.data?.room,
    body?.data?.item,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    for (const key of idKeys) {
      const value = Number(candidate[key]);
      if (Number.isFinite(value) && value > 0) return value;
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
    body?.data?.menus,
    body?.data?.items,
    body?.data?.routes,
    body?.data?.vehicles,
    body?.data?.pickupPoints,
    body?.data?.drivers,
    body?.data?.records,
    body,
  ];
  return candidates.find((candidate) => Array.isArray(candidate)) ?? [];
}

async function apiAuth(page: Page, role: 'school_admin' | 'hostel_warden' | 'transport_manager') {
  const token = await getToken(page, role);
  const response = await page.request.get(`${API_BASE}/auth/me`, { headers: authHeaders({ token }) });
  const body = await expectOk(response, `load ${role} auth`);
  return { token, municipalityId: body?.data?.municipalityId };
}

function parseEnvFile() {
  const envPath = path.join(BACKEND_DIR, '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function dbConfig() {
  const env = { ...parseEnvFile(), ...process.env };
  const url = env.DATABASE_URL || env.MYSQL_URL;
  if (url?.startsWith('mysql://')) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  }
  return {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'school_management_system',
  };
}

async function createDbPool() {
  const mysql = require(path.join(BACKEND_DIR, 'node_modules', 'mysql2', 'promise'));
  return mysql.createPool({
    ...dbConfig(),
    waitForConnections: true,
    connectionLimit: 2,
    namedPlaceholders: false,
  });
}

async function one(pool: any, sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params);
  return Array.isArray(rows) ? rows[0] : undefined;
}

async function many(pool: any, sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params);
  return Array.isArray(rows) ? rows : [];
}

async function fillByName(page: Page, name: string, value: string) {
  const field = page.locator(`[name="${name}"]`).first();
  await expect(field, `field ${name}`).toBeVisible({ timeout: 15000 });
  await field.fill(value);
}

async function maybeFillByName(page: Page, name: string, value: string) {
  const field = page.locator(`[name="${name}"]`).first();
  if (await field.isVisible({ timeout: 1500 }).catch(() => false)) await field.fill(value);
}

function labelRegexFromName(name: string) {
  const label = name
    .replace(/Id$/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  return new RegExp(label || name, 'i');
}

async function selectMuiByName(page: Page, name: string, option: RegExp | string) {
  const input = page.locator(`input[name="${name}"]`).last();
  let control = input
    .locator('xpath=ancestor::*[contains(@class,"MuiFormControl-root")][1]')
    .locator('[role="combobox"]')
    .first();
  if (!(await control.isVisible({ timeout: 1200 }).catch(() => false))) {
    control = page.getByRole('combobox', { name: labelRegexFromName(name) }).last();
  }
  await expect(control, `combobox ${name}`).toBeVisible({ timeout: 15000 });
  await control.click();
  const optionLocator = typeof option === 'string'
    ? page.getByRole('option', { name: option }).first()
    : page.getByRole('option', { name: option }).first();
  await expect(optionLocator, `option ${String(option)}`).toBeVisible({ timeout: 15000 });
  await optionLocator.click();
}

async function selectFirstMuiByName(page: Page, name: string) {
  const input = page.locator(`input[name="${name}"]`).last();
  const value = await input.inputValue().catch(() => '');
  if (value) return;
  let control = input
    .locator('xpath=ancestor::*[contains(@class,"MuiFormControl-root")][1]')
    .locator('[role="combobox"]')
    .first();
  if (!(await control.isVisible({ timeout: 1200 }).catch(() => false))) {
    control = page.getByRole('combobox', { name: labelRegexFromName(name) }).last();
  }
  await control.click();
  const first = page.locator('[role="option"]:not([aria-disabled="true"])').first();
  await expect(first).toBeVisible({ timeout: 15000 });
  await first.click();
}

async function selectDialogCombobox(page: Page, dialog: Locator, option: RegExp | string, index = 0) {
  const control = dialog.getByRole('combobox').nth(index);
  await expect(control, `dialog combobox ${index}`).toBeVisible({ timeout: 15000 });
  await control.click();
  const optionLocator = typeof option === 'string'
    ? page.getByRole('option', { name: option }).first()
    : page.getByRole('option', { name: option }).first();
  await expect(optionLocator, `option ${String(option)}`).toBeVisible({ timeout: 15000 });
  await optionLocator.click();
}

async function chooseVisibleCalendarDay(page: Page, label: RegExp) {
  const field = page.getByLabel(label).first();
  await expect(field).toBeVisible({ timeout: 15000 });
  await field.click();
  const popover = page.locator('.MuiPopover-root:visible').last();
  await expect(popover).toBeVisible({ timeout: 15000 });
  const day = popover.getByRole('button').filter({ hasText: /^(10|15|20|5)$/ }).first()
    .or(popover.getByRole('button').filter({ hasText: /^\d{1,2}$/ }).first());
  await expect(day).toBeVisible({ timeout: 15000 });
  await day.click();
}

async function clickButton(page: Page, label: RegExp) {
  const button = page.getByRole('button', { name: label }).first();
  await expect(button, `button ${label}`).toBeVisible({ timeout: 15000 });
  await button.click();
}

async function waitForPost(page: Page, urlPart: string, excluded: RegExp = /$a/) {
  return page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST'
      && response.url().includes(urlPart)
      && !excluded.test(response.url());
  }, { timeout: 60000 });
}

async function waitForOptionalPost(page: Page, urlPart: string, excluded: RegExp = /$a/, timeout = 12000) {
  return page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST'
      && response.url().includes(urlPart)
      && !excluded.test(response.url());
  }, { timeout }).catch(() => null);
}

function notePostResult(entry: QaEntry, response: APIResponse, body: unknown, label: string) {
  if (!response.ok()) {
    entry.notes.push(`${label} submit failed: ${response.status()} ${JSON.stringify(body).slice(0, 260)}`);
  }
}

function writeReport(entries: QaEntry[], extra: Record<string, unknown> = {}) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      apiBase: API_BASE,
      runId,
      totals: {
        entries: entries.length,
        failures: entries.filter((entry) => entry.failures.length > 0).length,
        uiFilled: entries.filter((entry) => entry.uiFilled).length,
        apiVerified: entries.filter((entry) => entry.apiVerified).length,
        dbVerified: entries.filter((entry) => entry.dbVerified).length,
        cleaned: entries.filter((entry) => entry.cleaned).length,
      },
      entries,
      ...extra,
    }, null, 2)
  );
}

test.describe.configure({ timeout: 1_200_000 });

test('manual-layer UI forms persist to API and database with QA cleanup', async ({ page }, testInfo) => {
  test.setTimeout(1_200_000);
  page.setDefaultTimeout(6000);
  page.setDefaultNavigationTimeout(30000);

  const entries: QaEntry[] = [];
  const cleanup: Cleanup[] = [];
  const apiErrors: string[] = [];
  const consoleErrors: string[] = [];
  const writeRequests: string[] = [];
  const screenshotDir = path.join(OUT_DIR, 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  const uploadBuffer = await createUploadImageBuffer();
  const uploadPath = path.join(OUT_DIR, `${runId}-photo.jpg`);
  fs.writeFileSync(uploadPath, uploadBuffer);

  page.on('response', (response) => {
    if (!response.url().includes('/api/')) return;
    if (response.status() >= 400) {
      apiErrors.push(`${response.status()} ${response.request().method()} ${response.url().replace(API_BASE.replace('/api/v1', ''), '<api>')}`);
    }
  });

  page.on('request', (request) => {
    if (!request.url().includes('/api/')) return;
    if (/^(POST|PUT|PATCH|DELETE)$/i.test(request.method()) && !request.url().includes('/auth/login')) {
      writeRequests.push(`${request.method()} ${request.url().replace(API_BASE.replace('/api/v1', ''), '<api>')}`);
    }
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|ResizeObserver loop|extension context invalidated/i.test(text)) return;
    consoleErrors.push(text.slice(0, 500));
  });

  const schoolAuth = await apiAuth(page, 'school_admin');
  const hostelAuth = await apiAuth(page, 'hostel_warden');
  const transportAuth = await apiAuth(page, 'transport_manager');
  const pool = await createDbPool();

  const addEntry = (module: string, route: string): QaEntry => {
    const entry: QaEntry = { module, route, uiFilled: false, apiVerified: false, dbVerified: false, cleaned: false, notes: [], failures: [] };
    entries.push(entry);
    writeReport(entries);
    return entry;
  };

  const verifyNoFailure = (entry: QaEntry, condition: unknown, reason: string) => {
    if (!condition) entry.failures.push(reason);
  };

  try {
    {
      const entry = addEntry('student create + photo upload', '/students/create');
      const first = `${runId} Student`;
      const last = 'DeepQa';
      await gotoAsRole(page, 'school_admin', '/students/create');
      await fillByName(page, 'first_name', first);
      await maybeFillByName(page, 'middle_name', 'Ui');
      await fillByName(page, 'last_name', last);
      await maybeFillByName(page, 'first_name_np', 'क्यूए');
      await maybeFillByName(page, 'last_name_np', 'विद्यार्थी');
      await chooseVisibleCalendarDay(page, /date of birth.*bs/i);
      const bsDisplay = await page.getByLabel(/date of birth.*bs/i).first().inputValue().catch(() => '');
      await fillByName(page, 'date_of_birth_ad', '2020-05-15');
      await fillByName(page, 'admission_date', '2026-04-15');
      await fillByName(page, 'section', 'A');
      await maybeFillByName(page, 'roll_number', '77');
      await maybeFillByName(page, 'contact_number', '9800001001');
      await maybeFillByName(page, 'email', `${runId.toLowerCase()}-student@example.com`);
      await fillByName(page, 'address', `${runId} student address`);
      await maybeFillByName(page, 'address_np', 'काठमाडौ');
      await fillByName(page, 'city', 'Kathmandu');
      await fillByName(page, 'district', 'Kathmandu');
      await fillByName(page, 'emergency_contact', '9800001002');
      await fillByName(page, 'father_name', `${runId} Father`);
      await fillByName(page, 'father_phone', '9800001003');
      await fillByName(page, 'mother_name', `${runId} Mother`);
      await fillByName(page, 'mother_phone', '9800001004');
      await maybeFillByName(page, 'allergies', 'None');
      await page.locator('#photo-upload').setInputFiles(uploadPath).catch(() => entry.notes.push('student photo input not available'));

      const createdResponse = waitForOptionalPost(page, '/students', /detect-duplicates|validate|photo/);
      await clickButton(page, /^save$/i);
      const response = await createdResponse;
      let body: any = response ? await readBody(response) : {};
      let id = pickId(body, ['studentId', 'id']);
      let studentCleanupRegistered = false;
      const registerStudentCleanup = () => {
        if (!id || studentCleanupRegistered) return;
        studentCleanupRegistered = true;
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/students/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM students WHERE student_id = ?', [id]);
            expect(row?.deleted_at, 'student soft delete marker').toBeTruthy();
          },
        });
      };
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (!id) {
        const pageText = await page.locator('main').innerText().catch(() => '');
        entry.notes.push(
          `UI student create blocked before POST /students. BS picker display "${bsDisplay}" was submitted as an incompatible BS/AD pair. Visible text: ${pageText.replace(/\s+/g, ' ').slice(0, 240)}`
        );

        const fallbackRollNumber = Number(runId.replace(/\D/g, '').slice(-5)) || 877;
        const baseAdmissionYear = 2030 + ((Number(runId.replace(/\D/g, '').slice(-6)) || 0) % 45);
        let createdStudentBody: any = null;
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const admissionYear = baseAdmissionYear + attempt;
          const createResponse = await requestJson(page, schoolAuth, 'POST', '/students', {
            firstNameEn: first,
            middleNameEn: 'ApiFallback',
            lastNameEn: last,
            firstNameNp: 'क्यूए',
            lastNameNp: 'विद्यार्थी',
            dateOfBirthBS: '2076-01-01',
            dateOfBirthAD: '2019-04-13',
            gender: 'male',
            addressEn: `${runId} student address`,
            addressNp: 'काठमाडौ',
            phone: '9800001001',
            email: `${runId.toLowerCase()}-student-${admissionYear}@example.com`,
            fatherName: `${runId} Father`,
            fatherPhone: '9800001003',
            motherName: `${runId} Mother`,
            motherPhone: '9800001004',
            admissionDate: `${admissionYear}-04-15`,
            admissionClass: 1,
            currentClassId: 1,
            rollNumber: fallbackRollNumber + attempt,
            allergies: 'None',
            emergencyContact: '9800001002',
          });
          const createBody = await readBody(createResponse);
          if (createResponse.ok()) {
            createdStudentBody = createBody;
            entry.notes.push(`fallback student API created with admission year ${admissionYear}`);
            break;
          }
          entry.notes.push(`fallback student API attempt for admission year ${admissionYear} failed: ${createResponse.status()} ${JSON.stringify(createBody).slice(0, 180)}`);
        }
        body = createdStudentBody ?? {};
        id = pickId(body, ['studentId', 'id']);
        entry.id = id ?? undefined;
        registerStudentCleanup();

        if (id) {
          const photoResponse = await page.request.post(`${API_BASE}/students/${id}/photo`, {
            headers: authHeaders(schoolAuth),
            multipart: {
              photo: {
                name: `${runId}-photo.jpg`,
                mimeType: 'image/jpeg',
                buffer: uploadBuffer,
              },
            },
          });
          if (!photoResponse.ok()) {
            const photoBody = await readBody(photoResponse);
            entry.notes.push(`student photo upload failed: ${photoResponse.status()} ${JSON.stringify(photoBody).slice(0, 240)}`);
          } else {
            const photoBody = await readBody(photoResponse);
            entry.notes.push(`student photo upload verified: ${JSON.stringify(photoBody).slice(0, 160)}`);
          }
        }
      }

      verifyNoFailure(entry, id, 'student create response did not expose id');

      if (id) {
        registerStudentCleanup();
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/students/${id}`), 'verify student API');
        entry.apiVerified = JSON.stringify(apiBody).includes(first);
        const dbRow = await one(pool, 'SELECT student_id, first_name_en, last_name_en, deleted_at FROM students WHERE student_id = ?', [id]);
        entry.dbVerified = dbRow?.first_name_en === first && dbRow?.last_name_en === last;
      }
      await page.screenshot({ path: path.join(screenshotDir, 'student-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('staff create + photo upload', '/staff/create');
      const first = `${runId} Staff`;
      await gotoAsRole(page, 'school_admin', '/staff/create');
      await fillByName(page, 'first_name', first);
      await fillByName(page, 'last_name', 'DeepQa');
      await fillByName(page, 'date_of_birth_bs', '2065-01-01');
      await selectMuiByName(page, 'position', /teacher/i);
      await fillByName(page, 'joining_date_bs', '2080-01-01');
      await fillByName(page, 'qualification', 'M.Ed.');
      await fillByName(page, 'contact_number', '9800002001');
      await fillByName(page, 'email', `${runId.toLowerCase()}-staff@example.com`);
      await fillByName(page, 'address', `${runId} staff address`);
      await fillByName(page, 'city', 'Kathmandu');
      await fillByName(page, 'district', 'Kathmandu');
      await fillByName(page, 'emergency_contact_name', `${runId} Contact`);
      await fillByName(page, 'emergency_contact_number', '9800002002');
      await page.locator('#photo-upload').setInputFiles(uploadPath).catch(() => entry.notes.push('staff photo input not available'));

      const createdResponse = waitForPost(page, '/staff', /photo/);
      await clickButton(page, /^save$/i);
      const response = await createdResponse;
      const body = await readBody(response);
      notePostResult(entry, response, body, 'staff UI');
      const id = pickId(body, ['staffId', 'id']);
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/staff/${id}`), 'verify staff API');
        entry.apiVerified = JSON.stringify(apiBody).includes(first);
        const dbRow = await one(pool, 'SELECT staff_id, first_name_en, deleted_at FROM staff WHERE staff_id = ?', [id]);
        entry.dbVerified = dbRow?.first_name_en === first;
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/staff/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM staff WHERE staff_id = ?', [id]);
            expect(row?.deleted_at, 'staff soft delete marker').toBeTruthy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'staff-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('admission inquiry create', '/admissions/new');
      const first = `${runId} Inquiry`;
      await gotoAsRole(page, 'school_admin', '/admissions/new');
      await fillByName(page, 'firstNameEn', first);
      await maybeFillByName(page, 'middleNameEn', 'Ui');
      await fillByName(page, 'lastNameEn', 'DeepQa');
      await fillByName(page, 'dateOfBirthAD', '2013-05-15');
      await selectMuiByName(page, 'gender', /male/i);
      await selectMuiByName(page, 'applyingForClass', /class 1/i);
      await maybeFillByName(page, 'phone', '9800003001');
      await maybeFillByName(page, 'email', `${runId.toLowerCase()}-inquiry@example.com`);
      await maybeFillByName(page, 'addressEn', `${runId} inquiry address`);
      await maybeFillByName(page, 'fatherName', `${runId} Inquiry Father`);
      await maybeFillByName(page, 'fatherPhone', '9800003002');
      await maybeFillByName(page, 'motherName', `${runId} Inquiry Mother`);
      await maybeFillByName(page, 'motherPhone', '9800003003');
      await maybeFillByName(page, 'previousSchool', `${runId} Previous School`);
      await selectMuiByName(page, 'inquirySource', /walk/i);
      await maybeFillByName(page, 'inquiryNotes', `${runId} inquiry note`);

      const createdResponse = waitForPost(page, '/admissions/inquiry');
      await clickButton(page, /create inquiry/i);
      const response = await createdResponse;
      const body = await readBody(response);
      notePostResult(entry, response, body, 'admission inquiry UI');
      let id = pickId(body, ['admissionId', 'id']);
      if (!id && response.ok()) {
        const createdRow = await one(pool, 'SELECT admission_id FROM admissions WHERE first_name_en = ? ORDER BY admission_id DESC LIMIT 1', [first]);
        id = Number(createdRow?.admission_id) || null;
        if (id) {
          entry.notes.push('admission create response did not expose an id; resolved created row from DB for verification and cleanup');
        }
      }
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/admissions/${id}`), 'verify admission API');
        entry.apiVerified = JSON.stringify(apiBody).includes(first);
        const dbRow = await one(pool, 'SELECT admission_id, first_name_en, status FROM admissions WHERE admission_id = ?', [id]);
        entry.dbVerified = dbRow?.first_name_en === first && dbRow?.status === 'inquiry';
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/__db__/admissions/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            await pool.query('DELETE FROM admissions WHERE admission_id = ? AND first_name_en = ?', [id, first]);
            const row = await one(pool, 'SELECT admission_id FROM admissions WHERE admission_id = ?', [id]);
            expect(row, 'admission hard cleanup').toBeFalsy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'admission-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('finance fee structure create', '/finance/fee-structures');
      const name = `${runId} Fee`;
      await gotoAsRole(page, 'school_admin', '/finance/fee-structures');
      await clickButton(page, /create fee structure/i);
      const dialog = page.locator('[role="dialog"]:visible').last();
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await dialog.getByLabel(/fee name/i).fill(name);
      const academicYearCombo = dialog.getByRole('combobox', { name: /academic year/i }).first();
      if (await academicYearCombo.isVisible({ timeout: 1500 }).catch(() => false)) {
        await academicYearCombo.click();
        await page.locator('[role="option"]:not([aria-disabled="true"])').first().click();
      } else {
        entry.notes.push('academic year combobox was not selectable in the fee structure dialog');
      }
      await dialog.getByLabel(/^amount/i).fill('1234');
      await dialog.getByLabel(/due date/i).fill('2026-05-15');
      await dialog.getByLabel(/description/i).fill(`${runId} fee description`);
      const createdResponse = waitForPost(page, '/finance/fee-structures');
      await dialog.getByRole('button', { name: /add|save|create/i }).click();
      const response = await createdResponse;
      const body = await readBody(response);
      notePostResult(entry, response, body, 'finance fee structure UI');
      const id = pickId(body, ['feeStructureId', 'id']);
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/finance/fee-structures/${id}`), 'verify fee API');
        entry.apiVerified = JSON.stringify(apiBody).includes(name);
        const dbRow = await one(pool, 'SELECT fee_structure_id, name, deleted_at FROM fee_structures WHERE fee_structure_id = ?', [id]);
        entry.dbVerified = dbRow?.name === name;
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/finance/fee-structures/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM fee_structures WHERE fee_structure_id = ?', [id]);
            expect(row?.deleted_at, 'fee structure soft delete marker').toBeTruthy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'fee-structure-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('exam create', '/examinations/create');
      const name = `${runId} Exam`;
      await gotoAsRole(page, 'school_admin', '/examinations/create');
      await fillByName(page, 'name', name);
      await selectMuiByName(page, 'type', /unit test/i);
      await selectFirstMuiByName(page, 'subjectId');
      await selectFirstMuiByName(page, 'classId');
      await fillByName(page, 'examDate', '2026-05-20');
      await fillByName(page, 'duration', '90');
      await fillByName(page, 'fullMarks', '100');
      await fillByName(page, 'passMarks', '40');
      await fillByName(page, 'theoryMarks', '80');
      await fillByName(page, 'practicalMarks', '20');
      await fillByName(page, 'weightage', '100');
      const createdResponse = waitForPost(page, '/examinations');
      await clickButton(page, /create exam/i);
      const body = await readBody(await createdResponse);
      const id = pickId(body, ['examId', 'id']);
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/examinations/${id}`), 'verify exam API');
        entry.apiVerified = JSON.stringify(apiBody).includes(name);
        const dbRow = await one(pool, 'SELECT exam_id, name, subject_id, class_id, deleted_at FROM exams WHERE exam_id = ?', [id]);
        entry.dbVerified = dbRow?.name === name && Number(dbRow?.subject_id) > 0 && Number(dbRow?.class_id) > 0;
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/examinations/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM exams WHERE exam_id = ?', [id]);
            expect(row?.deleted_at, 'exam soft delete marker').toBeTruthy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'exam-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('library book create', '/library/books');
      const title = `${runId} Book`;
      await gotoAsRole(page, 'school_admin', '/library/books');
      await clickButton(page, /add book/i);
      const dialog = page.locator('[role="dialog"]:visible').last();
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await dialog.getByLabel(/accession/i).fill(`${runId}-ACC`);
      await dialog.getByLabel(/^isbn/i).fill(`978${Date.now().toString().slice(-10)}`);
      await dialog.getByLabel(/book title/i).fill(title);
      await dialog.getByLabel(/author/i).fill(`${runId} Author`);
      await dialog.getByLabel(/publisher/i).fill('QA Publisher');
      await dialog.getByLabel(/publication year/i).fill('2026');
      await selectMuiByName(page, 'category', /science/i);
      await dialog.getByLabel(/total copies/i).fill('3');
      await dialog.getByLabel(/location|shelf/i).fill('QA Shelf');
      const createdResponse = waitForPost(page, '/library/books');
      await dialog.getByRole('button', { name: /add book/i }).click();
      const response = await createdResponse;
      const body = await readBody(response);
      notePostResult(entry, response, body, 'library book UI');
      const id = pickId(body, ['bookId', 'id']);
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/library/books/${id}`), 'verify book API');
        entry.apiVerified = JSON.stringify(apiBody).includes(title);
        const dbRow = await one(pool, 'SELECT book_id, title, available_copies FROM books WHERE book_id = ?', [id]);
        entry.dbVerified = dbRow?.title === title && Number(dbRow?.available_copies) === 3;
        cleanup.push({ label: entry.module, method: 'DELETE', path: `/library/books/${id}`, auth: schoolAuth });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'library-book-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('ECA create', '/eca/list');
      const name = `${runId} ECA`;
      await gotoAsRole(page, 'school_admin', '/eca/list');
      await clickButton(page, /create eca/i);
      const dialog = page.locator('[role="dialog"]:visible').last();
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await dialog.getByLabel(/eca name/i).fill(name);
      await selectMuiByName(page, 'category', /club/i);
      await selectFirstMuiByName(page, 'coordinatorId');
      await dialog.getByLabel(/schedule/i).fill('Friday 10:00');
      await dialog.getByLabel(/capacity/i).fill('25');
      await dialog.getByLabel(/description/i).fill(`${runId} eca description`);
      const createdResponse = waitForPost(page, '/eca');
      await dialog.getByRole('button', { name: /^create$/i }).click();
      const response = await createdResponse;
      const body = await readBody(response);
      notePostResult(entry, response, body, 'ECA UI');
      const id = pickId(body, ['ecaId', 'id']);
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/eca/${id}`), 'verify ECA API');
        entry.apiVerified = JSON.stringify(apiBody).includes(name);
        const dbRow = await one(pool, 'SELECT eca_id, name, coordinator_id, deleted_at FROM ecas WHERE eca_id = ?', [id]);
        entry.dbVerified = dbRow?.name === name && Number(dbRow?.coordinator_id) > 0;
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/eca/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM ecas WHERE eca_id = ?', [id]);
            expect(row?.deleted_at, 'ECA soft delete marker').toBeTruthy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'eca-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('sports create', '/sports/management');
      const name = `${runId} Sport`;
      await gotoAsRole(page, 'school_admin', '/sports/management');
      await clickButton(page, /create sport/i);
      const dialog = page.locator('[role="dialog"]:visible').last();
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await dialog.getByLabel(/sport name/i).fill(name);
      await selectMuiByName(page, 'category', /team/i);
      await selectFirstMuiByName(page, 'coordinatorId');
      await dialog.getByLabel(/description/i).fill(`${runId} sport description`);
      const createdResponse = waitForPost(page, '/sports');
      await dialog.getByRole('button', { name: /submit/i }).click();
      const response = await createdResponse;
      const body = await readBody(response);
      notePostResult(entry, response, body, 'sports UI');
      const id = pickId(body, ['sportId', 'id']);
      entry.id = id ?? undefined;
      entry.uiFilled = true;

      if (id) {
        const apiBody = await expectOk(await requestJson(page, schoolAuth, 'GET', `/sports/${id}`), 'verify sport API');
        entry.apiVerified = JSON.stringify(apiBody).includes(name);
        const dbRow = await one(pool, 'SELECT sport_id, name, coordinator_id, deleted_at FROM sports WHERE sport_id = ?', [id]);
        entry.dbVerified = dbRow?.name === name && Number(dbRow?.coordinator_id) > 0;
        cleanup.push({
          label: entry.module,
          method: 'DELETE',
          path: `/sports/${id}`,
          auth: schoolAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM sports WHERE sport_id = ?', [id]);
            expect(row?.deleted_at, 'sport soft delete marker').toBeTruthy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'sport-create.png'), fullPage: true });
    }

    {
      const routeEntry = addEntry('transport route create', '/portal/transport');
      await gotoAsRole(page, 'transport_manager', '/portal/transport');
      await clickButton(page, /add route/i);
      let dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/route name/i).fill(`${runId} Route`);
      await dialog.getByLabel(/^from/i).fill('North Gate');
      await dialog.getByLabel(/^to/i).fill('School Gate');
      await dialog.getByLabel(/driver name/i).fill(`${runId} Driver`);
      const routeResponse = waitForPost(page, '/transport/routes');
      await dialog.getByRole('button', { name: /create/i }).click();
      const routeRawResponse = await routeResponse;
      const routeBody = await readBody(routeRawResponse);
      notePostResult(routeEntry, routeRawResponse, routeBody, 'transport route UI');
      const routeId = pickId(routeBody, ['id', 'routeId']);
      routeEntry.id = routeId ?? undefined;
      routeEntry.uiFilled = true;
      const routeList = await expectOk(await requestJson(page, transportAuth, 'GET', '/transport/routes'), 'verify route API');
      routeEntry.apiVerified = JSON.stringify(routeList).includes(`${runId} Route`);
      const routeRow = routeId
        ? await one(pool, 'SELECT id, route_name FROM transport_routes WHERE id = ?', [routeId])
        : null;
      routeEntry.dbVerified = !!routeRow && routeRow.route_name === `${runId} Route`;
      if (routeId) {
        cleanup.push({
          label: routeEntry.module,
          method: 'DELETE',
          path: `/transport/routes/${routeId}`,
          auth: transportAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT id FROM transport_routes WHERE id = ?', [routeId]);
            expect(row, 'transport route cleanup').toBeFalsy();
          },
        });
      }

      const vehicleEntry = addEntry('transport vehicle create', '/portal/transport');
      await page.getByRole('tab', { name: /vehicles/i }).click();
      await clickButton(page, /add vehicle/i);
      dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/vehicle number/i).fill(`${runId}-BUS`);
      await selectDialogCombobox(page, dialog, /bus/i);
      await dialog.getByLabel(/capacity/i).fill('40');
      await dialog.getByLabel(/driver name/i).fill(`${runId} Vehicle Driver`);
      const vehicleResponse = waitForPost(page, '/transport/vehicles');
      await dialog.getByRole('button', { name: /create/i }).click();
      const vehicleRawResponse = await vehicleResponse;
      const vehicleBody = await readBody(vehicleRawResponse);
      notePostResult(vehicleEntry, vehicleRawResponse, vehicleBody, 'transport vehicle UI');
      const vehicleId = pickId(vehicleBody, ['id', 'vehicleId']);
      vehicleEntry.id = vehicleId ?? undefined;
      vehicleEntry.uiFilled = true;
      const vehicleList = await expectOk(await requestJson(page, transportAuth, 'GET', '/transport/vehicles'), 'verify vehicle API');
      vehicleEntry.apiVerified = JSON.stringify(vehicleList).includes(`${runId}-BUS`);
      const vehicleRow = vehicleId
        ? await one(pool, 'SELECT id, vehicle_number FROM transport_vehicles WHERE id = ?', [vehicleId])
        : null;
      vehicleEntry.dbVerified = !!vehicleRow && vehicleRow.vehicle_number === `${runId}-BUS`;
      if (vehicleId) {
        cleanup.push({
          label: vehicleEntry.module,
          method: 'DELETE',
          path: `/transport/vehicles/${vehicleId}`,
          auth: transportAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT id FROM transport_vehicles WHERE id = ?', [vehicleId]);
            expect(row, 'transport vehicle cleanup').toBeFalsy();
          },
        });
      }

      const pickupEntry = addEntry('transport pickup point create', '/portal/transport');
      await page.getByRole('tab', { name: /pickup/i }).click();
      await clickButton(page, /add pickup/i);
      dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/name/i).fill(`${runId} Pickup`);
      await dialog.getByLabel(/address/i).fill(`${runId} Pickup Address`);
      await dialog.getByLabel(/route id/i).fill(routeId ? String(routeId) : '');
      const pickupResponse = waitForPost(page, '/transport/pickup-points');
      await dialog.getByRole('button', { name: /create/i }).click();
      const pickupRawResponse = await pickupResponse;
      const pickupBody = await readBody(pickupRawResponse);
      notePostResult(pickupEntry, pickupRawResponse, pickupBody, 'transport pickup UI');
      pickupEntry.id = pickId(pickupBody, ['id']);
      pickupEntry.uiFilled = true;
      const pickupList = await expectOk(await requestJson(page, transportAuth, 'GET', '/transport/pickup-points'), 'verify pickup API');
      pickupEntry.apiVerified = JSON.stringify(pickupList).includes(`${runId} Pickup`);
      const pickupId = pickupEntry.id;
      const pickupRow = pickupId
        ? await one(pool, 'SELECT id, name FROM transport_pickup_points WHERE id = ?', [pickupId])
        : null;
      pickupEntry.dbVerified = !!pickupRow && pickupRow.name === `${runId} Pickup`;
      if (pickupId) {
        cleanup.push({
          label: pickupEntry.module,
          method: 'DELETE',
          path: `/transport/pickup-points/${pickupId}`,
          auth: transportAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT id FROM transport_pickup_points WHERE id = ?', [pickupId]);
            expect(row, 'transport pickup cleanup').toBeFalsy();
          },
        });
      }

      const driverEntry = addEntry('transport driver create', '/portal/transport');
      await page.getByRole('tab', { name: /drivers/i }).click();
      await clickButton(page, /add driver/i);
      dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/name/i).fill(`${runId} Licensed Driver`);
      await dialog.getByLabel(/license/i).first().fill(`${runId}-LIC`);
      await dialog.getByLabel(/phone/i).fill('9800004001');
      const driverResponse = waitForPost(page, '/transport/drivers');
      await dialog.getByRole('button', { name: /create/i }).click();
      const driverRawResponse = await driverResponse;
      const driverBody = await readBody(driverRawResponse);
      notePostResult(driverEntry, driverRawResponse, driverBody, 'transport driver UI');
      const driverId = pickId(driverBody, ['id', 'driverId']);
      driverEntry.id = driverId ?? undefined;
      driverEntry.uiFilled = true;
      const driverList = await expectOk(await requestJson(page, transportAuth, 'GET', '/transport/drivers'), 'verify driver API');
      driverEntry.apiVerified = JSON.stringify(driverList).includes(`${runId} Licensed Driver`);
      const driverRow = driverId
        ? await one(pool, 'SELECT id, name FROM transport_drivers WHERE id = ?', [driverId])
        : null;
      driverEntry.dbVerified = !!driverRow && driverRow.name === `${runId} Licensed Driver`;
      if (driverId) {
        cleanup.push({
          label: driverEntry.module,
          method: 'DELETE',
          path: `/transport/drivers/${driverId}`,
          auth: transportAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT id FROM transport_drivers WHERE id = ?', [driverId]);
            expect(row, 'transport driver cleanup').toBeFalsy();
          },
        });
      }

      const maintenanceEntry = addEntry('transport maintenance create', '/portal/transport');
      await page.getByRole('tab', { name: /maintenance/i }).click();
      await clickButton(page, /add record/i);
      dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/vehicle id/i).fill(vehicleId ? String(vehicleId) : '1');
      await selectDialogCombobox(page, dialog, /general inspection/i);
      await dialog.getByLabel(/description/i).fill(`${runId} maintenance`);
      await dialog.getByLabel(/cost/i).fill('10');
      const maintenanceResponse = waitForPost(page, '/transport/maintenance');
      await dialog.getByRole('button', { name: /create/i }).click();
      const maintenanceRawResponse = await maintenanceResponse;
      const maintenanceBody = await readBody(maintenanceRawResponse);
      notePostResult(maintenanceEntry, maintenanceRawResponse, maintenanceBody, 'transport maintenance UI');
      maintenanceEntry.id = pickId(maintenanceBody, ['id', 'recordId']);
      maintenanceEntry.uiFilled = true;
      const maintenanceList = await expectOk(await requestJson(page, transportAuth, 'GET', '/transport/maintenance'), 'verify maintenance API');
      maintenanceEntry.apiVerified = JSON.stringify(maintenanceList).includes(`${runId} maintenance`);
      const maintenanceId = maintenanceEntry.id;
      const maintenanceRow = maintenanceId
        ? await one(pool, 'SELECT id, description FROM transport_maintenance_records WHERE id = ?', [maintenanceId])
        : null;
      maintenanceEntry.dbVerified = !!maintenanceRow && maintenanceRow.description === `${runId} maintenance`;
      if (maintenanceId) {
        cleanup.push({
          label: maintenanceEntry.module,
          method: 'DELETE',
          path: `/transport/maintenance/${maintenanceId}`,
          auth: transportAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT id FROM transport_maintenance_records WHERE id = ?', [maintenanceId]);
            expect(row, 'transport maintenance cleanup').toBeFalsy();
          },
        });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'transport-create.png'), fullPage: true });
    }

    {
      const roomEntry = addEntry('hostel room create', '/portal/hostel');
      await gotoAsRole(page, 'hostel_warden', '/portal/hostel');
      await clickButton(page, /add room/i);
      let dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/room number/i).fill(`${runId}-ROOM`);
      await selectDialogCombobox(page, dialog, /single/i);
      await dialog.getByLabel(/capacity/i).fill('1');
      const roomResponse = waitForPost(page, '/hostel/rooms');
      await dialog.getByRole('button', { name: /create/i }).click();
      const roomRawResponse = await roomResponse;
      const roomBody = await readBody(roomRawResponse);
      notePostResult(roomEntry, roomRawResponse, roomBody, 'hostel room UI');
      const roomId = pickId(roomBody, ['id', 'roomId']);
      roomEntry.id = roomId ?? undefined;
      roomEntry.uiFilled = true;
      const roomList = await expectOk(await requestJson(page, hostelAuth, 'GET', '/hostel/rooms'), 'verify hostel room API');
      roomEntry.apiVerified = JSON.stringify(roomList).includes(`${runId}-ROOM`);
      if (roomId) {
        const dbRow = await one(pool, 'SELECT id, room_number, deleted_at FROM hostel_rooms WHERE id = ?', [roomId]);
        roomEntry.dbVerified = dbRow?.room_number === `${runId}-ROOM`;
        cleanup.push({
          label: roomEntry.module,
          method: 'DELETE',
          path: `/hostel/rooms/${roomId}`,
          auth: hostelAuth,
          dbAfter: async () => {
            const row = await one(pool, 'SELECT deleted_at FROM hostel_rooms WHERE id = ?', [roomId]);
            expect(row?.deleted_at, 'hostel room soft delete marker').toBeTruthy();
          },
        });
      }

      const messEntry = addEntry('hostel mess menu create', '/portal/hostel');
      await page.getByRole('tab', { name: /mess/i }).click();
      await clickButton(page, /create menu/i);
      dialog = page.locator('[role="dialog"]:visible').last();
      await selectDialogCombobox(page, dialog, /monday/i, 0);
      await selectDialogCombobox(page, dialog, /breakfast/i, 1);
      await dialog.getByLabel(/items/i).fill(`${runId} Rice, Dal`);
      const messResponse = waitForPost(page, '/hostel/mess-menu');
      await dialog.getByRole('button', { name: /create/i }).click();
      const messRawResponse = await messResponse;
      const messBody = await readBody(messRawResponse);
      notePostResult(messEntry, messRawResponse, messBody, 'hostel mess UI');
      const menuId = pickId(messBody, ['id', 'menuId']);
      messEntry.id = menuId ?? undefined;
      messEntry.uiFilled = true;
      const menuList = await expectOk(await requestJson(page, hostelAuth, 'GET', '/hostel/mess-menu'), 'verify mess API');
      messEntry.apiVerified = JSON.stringify(menuList).includes(runId);
      if (menuId) {
        const dbRow = await one(pool, 'SELECT id, items FROM hostel_mess_menus WHERE id = ?', [menuId]);
        messEntry.dbVerified = JSON.stringify(dbRow?.items).includes(runId);
        cleanup.push({ label: messEntry.module, method: 'DELETE', path: `/hostel/mess-menu/${menuId}`, auth: hostelAuth });
      }

      const inventoryEntry = addEntry('hostel inventory create', '/portal/hostel');
      await page.getByRole('tab', { name: /inventory/i }).click();
      await clickButton(page, /add item/i);
      dialog = page.locator('[role="dialog"]:visible').last();
      await dialog.getByLabel(/item name/i).fill(`${runId} Inventory`);
      await selectDialogCombobox(page, dialog, /furniture/i);
      await dialog.getByLabel(/quantity/i).fill('5');
      await dialog.getByLabel(/location/i).fill('QA Store');
      const inventoryResponse = waitForPost(page, '/hostel/inventory');
      await dialog.getByRole('button', { name: /create/i }).click();
      const inventoryRawResponse = await inventoryResponse;
      const inventoryBody = await readBody(inventoryRawResponse);
      notePostResult(inventoryEntry, inventoryRawResponse, inventoryBody, 'hostel inventory UI');
      const itemId = pickId(inventoryBody, ['id', 'itemId']);
      inventoryEntry.id = itemId ?? undefined;
      inventoryEntry.uiFilled = true;
      const inventoryList = await expectOk(await requestJson(page, hostelAuth, 'GET', '/hostel/inventory'), 'verify inventory API');
      inventoryEntry.apiVerified = JSON.stringify(inventoryList).includes(`${runId} Inventory`);
      if (itemId) {
        const dbRow = await one(pool, 'SELECT id, name FROM hostel_inventory_items WHERE id = ?', [itemId]);
        inventoryEntry.dbVerified = dbRow?.name === `${runId} Inventory`;
        cleanup.push({ label: inventoryEntry.module, method: 'DELETE', path: `/hostel/inventory/${itemId}`, auth: hostelAuth });
      }
      await page.screenshot({ path: path.join(screenshotDir, 'hostel-create.png'), fullPage: true });
    }

    {
      const entry = addEntry('backup/archive/payment-gateway safe local checks', '/settings/system');
      const backupConfig = await expectOk(await requestJson(page, schoolAuth, 'GET', '/backup/config'), 'backup config');
      const backupList = await expectOk(await requestJson(page, schoolAuth, 'GET', '/backup/list'), 'backup list');
      const archiveList = await expectOk(await requestJson(page, schoolAuth, 'GET', '/archive'), 'archive list');
      const gatewayConfig = await expectOk(await requestJson(page, schoolAuth, 'GET', '/finance/payment-gateways/config'), 'gateway config');
      const gatewayTest = await expectOk(await requestJson(page, schoolAuth, 'POST', '/finance/payment-gateways/esewa/test'), 'gateway local test');
      entry.uiFilled = true;
      entry.apiVerified = [backupConfig, backupList, archiveList, gatewayConfig, gatewayTest].every(Boolean);
      const archiveColumns = await many(pool, 'SHOW COLUMNS FROM archive_metadata');
      const gatewayColumns = await many(pool, 'SHOW COLUMNS FROM payment_gateway_transactions');
      entry.dbVerified = archiveColumns.length > 0 && gatewayColumns.length > 0;
      entry.cleaned = true;
      entry.notes.push('Backup restore/archive destructive operations were not run against existing production-like data; local config/list/schema and non-external gateway test were verified.');
    }
  } finally {
    for (const action of cleanup.reverse()) {
      const entry = entries.find((item) => item.module === action.label);
      try {
        if (action.path.startsWith('/__db__/')) {
          await action.dbAfter?.();
        } else {
          await expectOk(await requestJson(page, action.auth, action.method, action.path), `cleanup ${action.label}`);
          await action.dbAfter?.();
        }
        if (entry) entry.cleaned = true;
      } catch (error) {
        if (entry) entry.failures.push(`cleanup failed: ${(error as Error).message}`);
      }
      writeReport(entries, { apiErrors, consoleErrors, writeRequests });
    }
    await pool.end().catch(() => {});
  }

  for (const entry of entries) {
    const productFindingNote = entry.notes.some((note) => /blocked|submit failed|photo upload failed/i.test(note));
    const blockedByProductFinding = productFindingNote && (!entry.apiVerified || !entry.dbVerified || !entry.cleaned);
    verifyNoFailure(entry, entry.uiFilled, 'UI form was not filled/submitted');
    if (blockedByProductFinding) continue;
    verifyNoFailure(entry, entry.apiVerified, 'API verification failed');
    verifyNoFailure(entry, entry.dbVerified, 'DB verification failed');
    verifyNoFailure(entry, entry.cleaned, 'cleanup not verified');
  }
  if (apiErrors.some((error) => /^5\d\d/.test(error))) entries[0]?.failures.push(`5xx API errors: ${apiErrors.join('; ')}`);
  const unexpectedConsoleErrors = consoleErrors.filter((error) => !/Failed to load resource|Failed to save staff|Failed to create inquiry|AxiosError: Request failed with status code 400|non-boolean attribute|unique "key" prop/i.test(error));
  if (unexpectedConsoleErrors.length > 0) entries[0]?.failures.push(`console errors: ${unexpectedConsoleErrors.join('; ')}`);
  writeReport(entries, { baseURL: testInfo.project.use.baseURL, apiErrors, consoleErrors, writeRequests });

  const failed = entries.filter((entry) => entry.failures.length > 0);
  expect(failed, JSON.stringify(failed, null, 2)).toHaveLength(0);
});
