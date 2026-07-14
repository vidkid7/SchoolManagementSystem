/**
 * Deep role/route interaction audit.
 *
 * This is intentionally report-heavy: it traverses real protected routes,
 * captures API/console failures, and safely exercises non-destructive controls.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, Page, APIResponse } from '@playwright/test';
import { API_BASE, gotoAsRole, getToken, TEST_USERS } from './helpers';

type TestRole = keyof typeof TEST_USERS;

type ApiHit = {
  method: string;
  status: number;
  url: string;
};

type RouteAudit = {
  role: string;
  path: string;
  finalUrl?: string;
  title?: string | null;
  bodyLength: number;
  loaded: boolean;
  redirectedToLogin: boolean;
  accessDenied: boolean;
  viteOverlay: boolean;
  networkErrorText: boolean;
  hardcodedMockText: string[];
  controls: Record<string, number>;
  interactions: string[];
  apiHits: ApiHit[];
  apiErrors: ApiHit[];
  consoleErrors: string[];
  failureReasons: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-role-route-audit');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');

const schoolAdminRoutes = [
  '/dashboard',
  '/calendar',
  '/calendar/view',
  '/calendar/dashboard',
  '/calendar/events',
  '/communication/messages',
  '/communication/announcements',
  '/change-password',
  '/profile',
  '/students',
  '/students/create',
  '/students/bulk-import',
  '/students/bulk-add',
  '/staff',
  '/staff/create',
  '/academic',
  '/academic/classes',
  '/academic/years',
  '/academic/calendar',
  '/academic/timetable',
  '/academic/syllabus',
  '/academic/class-subjects',
  '/academic/subjects',
  '/attendance',
  '/attendance/student/mark',
  '/attendance/mark',
  '/attendance/reports',
  '/attendance/leave',
  '/attendance/staff/mark',
  '/attendance/settings',
  '/admissions',
  '/admissions/list',
  '/admissions/new',
  '/finance',
  '/finance/dashboard',
  '/finance/fee-structures',
  '/finance/invoices',
  '/finance/invoices/generate',
  '/finance/invoices/create',
  '/finance/invoices/bulk-generate',
  '/finance/payments',
  '/finance/refunds',
  '/finance/payment-gateways',
  '/finance/reports',
  '/finance/students',
  '/examinations',
  '/examinations/list',
  '/examinations/grading-scheme',
  '/examinations/grading-schemes',
  '/examinations/create',
  '/examinations/grades',
  '/examinations/reports',
  '/library',
  '/library/dashboard',
  '/library/circulation',
  '/library/reports',
  '/library/management',
  '/library/books',
  '/library/catalog',
  '/library/categories',
  '/eca',
  '/eca/dashboard',
  '/eca/management',
  '/eca/list',
  '/sports',
  '/sports/dashboard',
  '/sports/management',
  '/documents',
  '/reports',
  '/teacher/dashboard',
  '/teacher/lesson-planning',
  '/teacher/lessons',
  '/teacher/assignments',
  '/teacher/my-class',
  '/teacher/classes',
  '/teacher/behavior',
  '/certificates',
  '/certificates/dashboard',
  '/certificates/manage',
  '/certificates/templates',
  '/certificates/verify',
  '/audit',
  '/notifications',
  '/my-notifications',
  '/users',
  '/settings',
  '/settings/school',
  '/settings/roles',
  '/settings/system',
  '/settings/backup',
  '/settings/archive',
];

const routesByRole: Record<TestRole, string[]> = {
  school_admin: schoolAdminRoutes,
  municipality_admin: ['/municipality', '/admin/municipality/dashboard', '/calendar', '/communication/messages', '/communication/announcements', '/change-password', '/profile'],
  class_teacher: ['/dashboard', '/portal/class-teacher', '/portal/teacher', '/students', '/academic', '/academic/classes', '/academic/subjects', '/attendance', '/attendance/mark', '/attendance/reports', '/attendance/leave', '/examinations', '/examinations/list', '/examinations/grades', '/examinations/reports', '/library/books', '/library/categories', '/eca/list', '/teacher/dashboard', '/teacher/lesson-planning', '/teacher/assignments', '/teacher/my-class', '/teacher/behavior', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  subject_teacher: ['/dashboard', '/portal/teacher', '/students', '/academic', '/academic/classes', '/academic/subjects', '/attendance', '/attendance/mark', '/attendance/reports', '/attendance/leave', '/examinations', '/examinations/list', '/examinations/grades', '/examinations/reports', '/library/books', '/library/categories', '/eca/list', '/teacher/dashboard', '/teacher/lesson-planning', '/teacher/assignments', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  department_head: ['/dashboard', '/portal/department-head', '/portal/teacher', '/students', '/academic', '/academic/classes', '/academic/subjects', '/attendance', '/attendance/mark', '/attendance/reports', '/attendance/leave', '/examinations', '/examinations/list', '/examinations/reports', '/library/books', '/library/categories', '/eca', '/eca/list', '/sports', '/department/teachers', '/reports', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  eca_coordinator: ['/dashboard', '/portal/eca-coordinator', '/eca', '/eca/dashboard', '/eca/management', '/eca/list', '/documents', '/reports', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  sports_coordinator: ['/dashboard', '/portal/sports-coordinator', '/sports', '/sports/dashboard', '/sports/management', '/eca/list', '/documents', '/reports', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  student: ['/portal/student', '/my-certificates', '/examinations/reports', '/library/books', '/library/catalog', '/library/categories', '/eca/list', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  parent: ['/portal/parent', '/examinations/reports', '/library/books', '/library/catalog', '/library/categories', '/eca/list', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  librarian: ['/dashboard', '/portal/librarian', '/library', '/library/dashboard', '/library/circulation', '/library/reports', '/library/management', '/library/books', '/library/catalog', '/library/categories', '/documents', '/reports', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  accountant: ['/portal/accountant', '/admissions', '/admissions/list', '/admissions/new', '/finance', '/finance/dashboard', '/finance/fee-structures', '/finance/invoices', '/finance/invoices/generate', '/finance/payments', '/finance/refunds', '/finance/payment-gateways', '/finance/reports', '/finance/students', '/reports', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  transport_manager: ['/portal/transport', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  hostel_warden: ['/portal/hostel', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
  non_teaching_staff: ['/portal/non-teaching-staff', '/documents', '/communication/messages', '/communication/announcements', '/calendar', '/profile'],
};

const mockStrings = [
  'Mr. Sharma',
  'Math Homework Ch. 5',
  'Annual Sports Day - Falgun 15',
  'Lorem ipsum',
  'mock data',
  'dummy data',
];

const excludedButtonText = /delete|remove|archive|revoke|rotate|logout|log out|sign out|submit|save|create|new |add |pay|payment|send|generate|mark all|read all|upload|import|bulk|reset password|lock|unlock|view|details|open|start/i;
const safeButtonText = /refresh|filter|clear|cancel|close|more|search|collapse|expand/i;

function selectedRoles(): TestRole[] {
  const requested = (process.env.E2E_DEEP_ROLES || '').split(',').map((v) => v.trim()).filter(Boolean);
  if (requested.length === 0) return Object.keys(routesByRole) as TestRole[];
  return requested.filter((role): role is TestRole => role in routesByRole);
}

function applyRouteSlice(routes: string[]) {
  const requestedRoutes = (process.env.E2E_DEEP_ROUTES || '').split(',').map((route) => route.trim()).filter(Boolean);
  const startAfter = process.env.E2E_DEEP_START_AFTER;
  const requestedLimit = Number(process.env.E2E_DEEP_LIMIT || 0);
  let sliced = routes;

  if (requestedRoutes.length > 0) {
    sliced = sliced.filter((route) => requestedRoutes.includes(route));
  }

  if (startAfter) {
    const index = sliced.indexOf(startAfter);
    if (index >= 0) {
      sliced = sliced.slice(index + 1);
    }
  }

  if (Number.isFinite(requestedLimit) && requestedLimit > 0) {
    sliced = sliced.slice(0, requestedLimit);
  }

  return sliced;
}

function writeRoleReport(role: TestRole, report: RouteAudit[], baseURL: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const existing = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};
  existing.generatedAt = new Date().toISOString();
  existing.baseURL = baseURL;
  existing.apiBase = API_BASE;
  existing.roles = existing.roles || {};
  existing.roles[role] = report;
  fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
}

function shortUrl(url: string) {
  return url.replace(API_BASE.replace('/api/v1', ''), '<api>');
}

async function extractFirstId(response: APIResponse, keys: string[]) {
  if (!response.ok()) return null;
  const body = await response.json().catch(() => null);
  const candidates = [
    body?.data,
    body?.data?.students,
    body?.data?.staff,
    body?.data?.admissions,
    body?.data?.exams,
    body?.data?.items,
    body?.data?.rows,
  ];
  const list = candidates.find((value) => Array.isArray(value));
  const row = list?.[0];
  if (!row) return null;
  for (const key of keys) {
    if (row[key]) return String(row[key]);
  }
  return null;
}

async function dynamicRoutesForRole(page: Page, role: TestRole) {
  if (role !== 'school_admin') return [];
  const token = await getToken(page, role);
  const headers = { Authorization: `Bearer ${token}` };
  const routes: string[] = [];
  const [student, staff, admission, exam] = await Promise.all([
    page.request.get(`${API_BASE}/students?limit=1`, { headers }).then((res) => extractFirstId(res, ['studentId', 'id'])).catch(() => null),
    page.request.get(`${API_BASE}/staff?limit=1`, { headers }).then((res) => extractFirstId(res, ['staffId', 'id'])).catch(() => null),
    page.request.get(`${API_BASE}/admissions?limit=1`, { headers }).then((res) => extractFirstId(res, ['admissionId', 'id'])).catch(() => null),
    page.request.get(`${API_BASE}/examinations?limit=1`, { headers }).then((res) => extractFirstId(res, ['examId', 'id'])).catch(() => null),
  ]);

  if (student) routes.push(`/students/${student}`, `/students/${student}/cv`, `/students/${student}/edit`);
  if (staff) routes.push(`/staff/${staff}`, `/staff/${staff}/edit`, `/staff/${staff}/assignments`);
  if (admission) routes.push(`/admissions/${admission}`);
  if (exam) routes.push(`/examinations/${exam}`, `/examinations/${exam}/grades`, `/examinations/${exam}/edit`);

  return routes;
}

async function waitForPageSettled(page: Page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 12000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(150);
}

async function visibleCount(page: Page, selector: string) {
  return page.locator(selector).count().catch(() => 0);
}

async function collectStaticSignals(page: Page, entry: RouteAudit) {
  const signals = await page.evaluate((knownMockStrings) => {
    const main = document.querySelector('main') || document.body;
    const bodyText = document.body.innerText || '';
    const titleEl = main.querySelector('h1,h2,h3,h4,.MuiTypography-h4,.MuiTypography-h5,.MuiTypography-h6');
    return {
      title: titleEl?.textContent?.trim()?.slice(0, 120) || null,
      bodyLength: bodyText.trim().length,
      redirectedToLogin: location.pathname.includes('/login'),
      accessDenied: /access denied|unauthorized|you do not have permission/i.test(bodyText),
      viteOverlay: bodyText.includes('[plugin:vite') || bodyText.includes('Failed to resolve import'),
      networkErrorText: /network error|failed to fetch|cannot read properties|undefined is not/i.test(bodyText),
      hardcodedMockText: (knownMockStrings as string[]).filter((txt) => bodyText.toLowerCase().includes(txt.toLowerCase())),
    };
  }, mockStrings);

  entry.title = signals.title;
  entry.bodyLength = signals.bodyLength;
  entry.redirectedToLogin = signals.redirectedToLogin;
  entry.accessDenied = signals.accessDenied;
  entry.viteOverlay = signals.viteOverlay;
  entry.networkErrorText = signals.networkErrorText;
  entry.hardcodedMockText = signals.hardcodedMockText;

  entry.controls = {
    buttons: await visibleCount(page, 'button:visible'),
    links: await visibleCount(page, 'a:visible'),
    inputs: await visibleCount(page, 'input:visible, textarea:visible'),
    tabs: await visibleCount(page, '[role="tab"]:visible'),
    comboboxes: await visibleCount(page, '[role="combobox"]:visible, .MuiSelect-select:visible'),
    dialogs: await visibleCount(page, '[role="dialog"]:visible'),
    tables: await visibleCount(page, 'table:visible, [role="table"]:visible'),
  };
}

async function clickLocator(locator: ReturnType<Page['locator']>, entry: RouteAudit, label: string) {
  if (!(await locator.isVisible({ timeout: 1000 }).catch(() => false))) return;
  const beforeUrl = locator.page().url();
  await locator.click({ timeout: 2500 }).catch(() => undefined);
  await locator.page().waitForTimeout(150);
  if (locator.page().url() !== beforeUrl) {
    entry.interactions.push(`${label} changed route`);
    await locator.page().goto(beforeUrl).catch(() => undefined);
    await waitForPageSettled(locator.page());
    return;
  }
  entry.interactions.push(label);
  await locator.page().keyboard.press('Escape').catch(() => undefined);
}

async function exerciseSafeControls(page: Page, entry: RouteAudit) {
  const searchInputs = page.locator('input[placeholder*="Search"], input[aria-label*="Search"], input[type="search"]');
  const searchCount = Math.min(await searchInputs.count().catch(() => 0), 3);
  for (let i = 0; i < searchCount; i++) {
    const input = searchInputs.nth(i);
    if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
      await input.fill('qa').catch(() => undefined);
      await page.waitForTimeout(150);
      await input.fill('').catch(() => undefined);
      entry.interactions.push('search input fill/clear');
    }
  }

  const tabs = page.locator('[role="tab"]:visible');
  const tabCount = Math.min(await tabs.count().catch(() => 0), 10);
  for (let i = 0; i < tabCount; i++) {
    await clickLocator(tabs.nth(i), entry, `tab ${i + 1}`);
  }

  const expandable = page.locator('button[aria-expanded]:visible');
  const expandableCount = Math.min(await expandable.count().catch(() => 0), 8);
  for (let i = 0; i < expandableCount; i++) {
    await clickLocator(expandable.nth(i), entry, `expandable button ${i + 1}`);
  }

  const comboboxes = page.locator('[role="combobox"]:visible, .MuiSelect-select:visible');
  const comboCount = Math.min(await comboboxes.count().catch(() => 0), 5);
  for (let i = 0; i < comboCount; i++) {
    const combo = comboboxes.nth(i);
    if (await combo.isVisible({ timeout: 1000 }).catch(() => false)) {
      await combo.click({ timeout: 2500 }).catch(() => undefined);
      await page.waitForTimeout(150);
      const option = page.locator('[role="option"]:visible').first();
      if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
        await option.click({ timeout: 2500 }).catch(() => undefined);
      }
      await page.keyboard.press('Escape').catch(() => undefined);
      entry.interactions.push(`combobox ${i + 1}`);
    }
  }

  const safeButtons = page.getByRole('button').filter({ hasText: safeButtonText }).filter({ hasNotText: excludedButtonText });
  const buttonCount = Math.min(await safeButtons.count().catch(() => 0), 8);
  for (let i = 0; i < buttonCount; i++) {
    await clickLocator(safeButtons.nth(i), entry, `safe button ${i + 1}`);
  }
}

async function auditRoute(page: Page, role: TestRole, routePath: string, apiHits: ApiHit[], consoleErrors: string[]) {
  const entry: RouteAudit = {
    role,
    path: routePath,
    bodyLength: 0,
    loaded: false,
    redirectedToLogin: false,
    accessDenied: false,
    viteOverlay: false,
    networkErrorText: false,
    hardcodedMockText: [],
    controls: {},
    interactions: [],
    apiHits: [],
    apiErrors: [],
    consoleErrors: [],
    failureReasons: [],
  };

  apiHits.length = 0;
  consoleErrors.length = 0;

  try {
    await gotoAsRole(page, role, routePath);
    await waitForPageSettled(page);
    await collectStaticSignals(page, entry);
    await exerciseSafeControls(page, entry);
    await waitForPageSettled(page);
    await collectStaticSignals(page, entry);
    entry.finalUrl = page.url();
    entry.apiHits = [...apiHits];
    entry.apiErrors = apiHits.filter((hit) => hit.status >= 400);
    entry.consoleErrors = [...consoleErrors];
    const interactiveContentCount = Object.values(entry.controls).reduce((sum, value) => sum + (Number(value) || 0), 0);
    entry.loaded = (entry.bodyLength > 50 || interactiveContentCount >= 4) && !entry.redirectedToLogin && !entry.viteOverlay;
  } catch (error) {
    entry.failureReasons.push((error as Error).message);
  }

  if (!entry.loaded) entry.failureReasons.push('route did not load real content');
  if (entry.redirectedToLogin) entry.failureReasons.push('redirected to login');
  if (entry.accessDenied) entry.failureReasons.push('access denied text visible');
  if (entry.viteOverlay) entry.failureReasons.push('vite overlay visible');
  if (entry.networkErrorText) entry.failureReasons.push('network/runtime error text visible');
  if (entry.apiErrors.some((hit) => hit.status >= 500)) entry.failureReasons.push('5xx API response');
  if (entry.consoleErrors.length > 0) entry.failureReasons.push('console errors');

  return entry;
}

test.describe('Deep role route interaction audit', () => {
  test.describe.configure({ mode: 'serial' });

  for (const role of selectedRoles()) {
    test(`${role} route and control audit`, async ({ page }) => {
      test.setTimeout(900_000);
      page.setDefaultTimeout(4000);
      page.setDefaultNavigationTimeout(15000);

      const report: RouteAudit[] = [];
      const apiHits: ApiHit[] = [];
      const consoleErrors: string[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if (!url.includes('/api/')) return;
        apiHits.push({
          method: response.request().method(),
          status: response.status(),
          url: shortUrl(url),
        });
      });

      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        if (/favicon|extension context invalidated|ResizeObserver loop/i.test(text)) return;
        consoleErrors.push(text.slice(0, 500));
      });

      const staticRoutes = [...new Set(routesByRole[role])];
      const dynamicRoutes = await dynamicRoutesForRole(page, role);
      const routes = applyRouteSlice([...new Set([...staticRoutes, ...dynamicRoutes])]);

      for (const routePath of routes) {
        report.push(await auditRoute(page, role, routePath, apiHits, consoleErrors));
        writeRoleReport(role, report, test.info().project.use.baseURL);
      }

      writeRoleReport(role, report, test.info().project.use.baseURL);

      const critical = report.filter((entry) => entry.failureReasons.length > 0);
      expect(critical, JSON.stringify(critical.slice(0, 12), null, 2)).toEqual([]);
    });
  }
});
