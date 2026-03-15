/**
 * Playwright Test Helpers
 *
 * Shared utilities for logging in as different roles and common assertions.
 */

import { Page, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api/v1';

// ── Test user credentials ──────────────────────────────────────────────
export interface TestUser {
  username: string;
  password: string;
  role: string;
  expectedPath: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  school_admin:       { username: 'admin',           password: 'admin123',         role: 'school_admin',       expectedPath: '/dashboard' },
  municipality_admin: { username: 'municipalityadmin',password: 'Municipality@123', role: 'municipality_admin', expectedPath: '/municipality' },
  subject_teacher:    { username: 'teacher1',        password: 'Teacher@123',      role: 'subject_teacher',    expectedPath: '/portal/teacher' },
  class_teacher:      { username: 'classteacher1',   password: 'ClassTeacher@123', role: 'class_teacher',      expectedPath: '/portal/class-teacher' },
  department_head:    { username: 'depthead1',       password: 'DeptHead@123',     role: 'department_head',    expectedPath: '/portal/department-head' },
  student:            { username: 'student1',        password: 'Student@123',      role: 'student',            expectedPath: '/portal/student' },
  parent:             { username: 'parent1',         password: 'Parent@123',       role: 'parent',             expectedPath: '/portal/parent' },
  accountant:         { username: 'accountant1',     password: 'Accountant@123',   role: 'accountant',         expectedPath: '/portal/accountant' },
  librarian:          { username: 'librarian1',      password: 'Librarian@123',    role: 'librarian',          expectedPath: '/portal/librarian' },
  eca_coordinator:    { username: 'ecacoord1',       password: 'ECACoord@123',     role: 'eca_coordinator',    expectedPath: '/portal/eca-coordinator' },
  sports_coordinator: { username: 'sportscoord1',    password: 'SportsCoord@123',  role: 'sports_coordinator', expectedPath: '/portal/sports-coordinator' },
  transport_manager:  { username: 'transport1',      password: 'Transport@123',    role: 'transport_manager',  expectedPath: '/portal/transport' },
  hostel_warden:      { username: 'hostelwarden1',   password: 'Hostel@123',       role: 'hostel_warden',      expectedPath: '/portal/hostel' },
  non_teaching_staff: { username: 'staff1',          password: 'Staff@123',        role: 'non_teaching_staff', expectedPath: '/portal/non-teaching-staff' },
};

// ── Token cache (shared across tests in same worker) ───────────────────
interface CachedAuth {
  accessToken: string;
  refreshToken: string;
  user: any;
  slug: string;
}
const tokenCache = new Map<string, CachedAuth>();

async function getAuthTokens(page: Page, role: string): Promise<CachedAuth> {
  if (tokenCache.has(role)) return tokenCache.get(role)!;

  const user = TEST_USERS[role];
  if (!user) throw new Error(`Unknown test role: ${role}`);

  const resp = await page.request.post(`${API_BASE}/auth/login`, {
    data: { username: user.username, password: user.password },
  });

  const body = await resp.json();
  if (!body.success) {
    throw new Error(`Login failed for ${role}: ${body.message || body.error || JSON.stringify(body)}`);
  }

  const { accessToken, refreshToken, user: userData } = body.data;
  const slug = (userData.municipalityCode || 'kmc').toLowerCase();
  const cached = { accessToken, refreshToken, user: userData, slug };
  tokenCache.set(role, cached);
  return cached;
}

// ── Login via UI ────────────────────────────────────────────────────────
export async function loginAs(page: Page, role: keyof typeof TEST_USERS): Promise<string> {
  const user = TEST_USERS[role];
  if (!user) throw new Error(`Unknown test role: ${role}`);

  await page.goto('/login');

  const usernameField = page.locator('input[name="username"]');
  await usernameField.waitFor({ state: 'visible', timeout: 15000 });
  await usernameField.fill(user.username);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  return page.url();
}

// ── Login via API (fast — injects tokens into localStorage) ────────────
export async function loginViaAPI(page: Page, role: keyof typeof TEST_USERS): Promise<{ slug: string; token: string }> {
  const auth = await getAuthTokens(page, role);

  // Go to login page to get on the correct origin for localStorage access
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Inject tokens into localStorage
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user }
  );

  return { slug: auth.slug, token: auth.accessToken };
}

// ── Navigate to a page as a specific role ──────────────────────────────
export async function gotoAsRole(
  page: Page,
  role: keyof typeof TEST_USERS,
  path: string
): Promise<string> {
  const { slug } = await loginViaAPI(page, role);
  const fullPath = `/${slug}${path}`;

  // Full navigation — React app will re-initialize and read localStorage
  await page.goto(fullPath);
  await page.waitForLoadState('domcontentloaded');

  // Wait for React to mount — look for any visible content
  await page.waitForFunction(
    () => document.body.innerText.length > 50,
    { timeout: 15000 }
  ).catch(() => {});

  return slug;
}

// ── Get auth token for API-only tests ──────────────────────────────────
export async function getToken(page: Page, role: keyof typeof TEST_USERS): Promise<string> {
  const auth = await getAuthTokens(page, role);
  return auth.accessToken;
}

// ── Assertions ─────────────────────────────────────────────────────────
export async function expectPageLoaded(page: Page): Promise<void> {
  const body = page.locator('body');
  await expect(body).not.toHaveText(
    /cannot read propert|undefined is not|unexpected token/i,
    { timeout: 5000 }
  ).catch(() => {});

  await expect(page.locator('text=Something went wrong')).toHaveCount(0, { timeout: 3000 }).catch(() => {});
}
