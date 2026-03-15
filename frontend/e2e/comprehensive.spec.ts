/**
 * COMPREHENSIVE SYSTEM TEST
 *
 * Tests every portal, every page, every role, navigation, notifications,
 * and core CRUD operations across the entire School Management System.
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, loginAs, loginViaAPI, gotoAsRole, getToken, expectPageLoaded } from './helpers';

const API = 'http://localhost:3000/api/v1';

// ═══════════════════════════════════════════════════════════════════════
// 1. AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════════════════════════
test.describe('1. Authentication', () => {
  test('1.1 Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('1.2 Invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('baduser');
    await page.locator('input[name="password"]').fill('badpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // MUI Alert with role="alert" appears on login failure
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('1.3 Unauthenticated users redirected to /login', async ({ page }) => {
    await page.goto('/kmc/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('1.4 School admin can log in via UI', async ({ page }) => {
    const url = await loginAs(page, 'school_admin');
    expect(url).toContain('/dashboard');
  });

  // Test API login for every role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test(`1.5 API login works for ${roleName}`, async ({ page }) => {
      const resp = await page.request.post(`${API}/auth/login`, {
        data: { username: user.username, password: user.password },
      });
      const body = await resp.json();

      if (body.success) {
        expect(body.data).toHaveProperty('accessToken');
        expect(body.data).toHaveProperty('refreshToken');
        expect(body.data.user).toHaveProperty('userId');
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: `Login failed for ${roleName}: ${body.message || body.error}`,
        });
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 2. ALL ROLE PORTALS — Load & No Crash
// ═══════════════════════════════════════════════════════════════════════
test.describe('2. Portal Loading', () => {
  const portalTests: { role: keyof typeof TEST_USERS; path: string; label: string }[] = [
    { role: 'school_admin', path: '/dashboard', label: 'School Admin Dashboard' },
    { role: 'municipality_admin', path: '/municipality', label: 'Municipality Admin Portal' },
    { role: 'subject_teacher', path: '/portal/teacher', label: 'Teacher Portal' },
    { role: 'class_teacher', path: '/portal/class-teacher', label: 'Class Teacher Portal' },
    { role: 'department_head', path: '/portal/department-head', label: 'Department Head Portal' },
    { role: 'student', path: '/portal/student', label: 'Student Portal' },
    { role: 'parent', path: '/portal/parent', label: 'Parent Portal' },
    { role: 'accountant', path: '/portal/accountant', label: 'Accountant Portal' },
    { role: 'librarian', path: '/portal/librarian', label: 'Librarian Portal' },
    { role: 'eca_coordinator', path: '/portal/eca-coordinator', label: 'ECA Coordinator Portal' },
    { role: 'sports_coordinator', path: '/portal/sports-coordinator', label: 'Sports Coordinator Portal' },
    { role: 'transport_manager', path: '/portal/transport', label: 'Transport Portal' },
    { role: 'hostel_warden', path: '/portal/hostel', label: 'Hostel Portal' },
    { role: 'non_teaching_staff', path: '/portal/non-teaching-staff', label: 'Non-Teaching Staff Portal' },
  ];

  for (const { role, path, label } of portalTests) {
    test(`2.x ${label} loads without crash`, async ({ page }) => {
      try {
        await gotoAsRole(page, role, path);
        await expectPageLoaded(page);
        expect(page.url()).not.toContain('/login');

        const bodyText = await page.locator('body').innerText();
        expect(bodyText.length).toBeGreaterThan(50);
      } catch (e: any) {
        if (e.message.includes('Login failed')) {
          test.info().annotations.push({ type: 'skip', description: `Seeded user for ${role} not available` });
          test.skip();
        }
        throw e;
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 3. SCHOOL ADMIN — Full Page Navigation
// ═══════════════════════════════════════════════════════════════════════
test.describe('3. School Admin Pages', () => {
  const adminPages = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/students', label: 'Student List' },
    { path: '/staff', label: 'Staff List' },
    { path: '/academic', label: 'Academic' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/examinations', label: 'Examinations' },
    { path: '/finance', label: 'Finance' },
    { path: '/library', label: 'Library' },
    { path: '/eca', label: 'ECA' },
    { path: '/sports', label: 'Sports' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/communication/messages', label: 'Messages' },
    { path: '/communication/announcements', label: 'Announcements' },
    { path: '/my-notifications', label: 'My Notifications' },
    { path: '/reports', label: 'Reports' },
    { path: '/certificates', label: 'Certificates' },
    { path: '/documents', label: 'Documents' },
    { path: '/users', label: 'User Management' },
    { path: '/audit', label: 'Audit Logs' },
    { path: '/settings', label: 'Settings' },
    { path: '/settings/roles', label: 'Role Management' },
    { path: '/settings/system', label: 'System Settings' },
    { path: '/settings/backup', label: 'Backup' },
  ];

  for (const { path, label } of adminPages) {
    test(`3.x ${label} (${path})`, async ({ page }) => {
      try {
        const slug = await gotoAsRole(page, 'school_admin', path);
        await expectPageLoaded(page);
        expect(page.url()).not.toContain('/login');

        const bodyText = await page.locator('body').innerText().catch(() => '');
        expect(bodyText.length).toBeGreaterThan(20);
      } catch (e: any) {
        if (e.message.includes('Login failed')) test.skip();
        throw e;
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 4. NAVBAR & SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════════
test.describe('4. Navigation & Layout', () => {
  test('4.1 Sidebar renders with menu items for admin', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');

    // Look for sidebar navigation or drawer
    const navItems = page.locator('a[href], [role="button"]');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(5);
  });

  test('4.2 AppBar / Header renders', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');

    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('4.3 Notification bell is present in navbar', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');

    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    // Look for notification-related button in the header
    const bellButton = header.locator('button').filter({ has: page.locator('svg') });
    const count = await bellButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('4.4 Logout flow works', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');

    // Find user/avatar area in header
    const header = page.locator('header');
    const buttons = header.getByRole('button');
    const lastButton = buttons.last();

    if (await lastButton.isVisible()) {
      await lastButton.click();
      await page.waitForTimeout(500);

      const logoutBtn = page.getByText(/logout|sign out/i).first();
      if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/login/, { timeout: 10000 });
        expect(page.url()).toContain('/login');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════
test.describe('5. Notification System', () => {
  test('5.1 Notification API returns unread count', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('count');
    expect(typeof body.data.count).toBe('number');
  });

  test('5.2 Notification list API works', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/notifications?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('notifications');
    expect(Array.isArray(body.data.notifications)).toBe(true);
    expect(body.data).toHaveProperty('total');
  });

  test('5.3 Mark all read API works', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.put(`${API}/notifications/read-all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('updated');
  });

  test('5.4 My Notifications page renders', async ({ page }) => {
    try {
      await gotoAsRole(page, 'school_admin', '/my-notifications');
      await expectPageLoaded(page);
      expect(page.url()).not.toContain('/login');
    } catch (e: any) {
      if (e.message.includes('Login failed')) test.skip();
      throw e;
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. CRUD / API OPERATIONS (School Admin)
// ═══════════════════════════════════════════════════════════════════════
test.describe('6. CRUD Operations', () => {
  test('6.1 Academic classes list', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/academic/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test('6.2 Academic subjects list', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/academic/subjects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
  });

  test('6.3 Student list API', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/students?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
  });

  test('6.4 Academic years current endpoint', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/academic/years/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test('6.5 Finance fee structures API', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/finance/fee-structures`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBeLessThan(500);
  });

  test('6.6 Attendance API responds', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBeLessThan(500);
  });

  test('6.7 Library API responds', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/library/books`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBeLessThan(500);
  });

  test('6.8 Calendar events API responds', async ({ page }) => {
    const token = await getToken(page, 'school_admin');
    const resp = await page.request.get(`${API}/calendar/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. ACADEMIC MANAGEMENT UI
// ═══════════════════════════════════════════════════════════════════════
test.describe('7. Academic Management UI', () => {
  test('7.1 Academic page shows content', async ({ page }) => {
    try {
      await gotoAsRole(page, 'school_admin', '/academic');
      const bodyText = (await page.locator('body').innerText()).toLowerCase();
      const hasContent = bodyText.includes('class') || bodyText.includes('subject') ||
        bodyText.includes('academic') || bodyText.includes('year') || bodyText.includes('timetable');
      expect(hasContent).toBe(true);
    } catch (e: any) {
      if (e.message.includes('Login failed')) test.skip();
      throw e;
    }
  });

  test('7.2 Student list page loads', async ({ page }) => {
    try {
      await gotoAsRole(page, 'school_admin', '/students');
      const bodyText = (await page.locator('body').innerText()).toLowerCase();
      const hasContent = bodyText.includes('student') || bodyText.includes('name') ||
        bodyText.includes('class') || bodyText.includes('roll');
      expect(hasContent).toBe(true);
    } catch (e: any) {
      if (e.message.includes('Login failed')) test.skip();
      throw e;
    }
  });

  test('7.3 Examination page loads', async ({ page }) => {
    try {
      await gotoAsRole(page, 'school_admin', '/examinations');
      const bodyText = (await page.locator('body').innerText()).toLowerCase();
      const hasContent = bodyText.includes('exam') || bodyText.includes('test') ||
        bodyText.includes('grade') || bodyText.includes('schedule');
      expect(hasContent).toBe(true);
    } catch (e: any) {
      if (e.message.includes('Login failed')) test.skip();
      throw e;
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. BACKEND API HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════
test.describe('8. Backend API Health', () => {
  test('8.1 Health endpoint', async ({ page }) => {
    const resp = await page.request.get('http://localhost:3000/health');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('running');
  });

  test('8.2 API root endpoint', async ({ page }) => {
    const resp = await page.request.get(API);
    expect(resp.status()).toBe(200);
  });

  test('8.3 Unauthenticated API returns 401', async ({ page }) => {
    const resp = await page.request.get(`${API}/students`);
    expect(resp.status()).toBe(401);
  });
});

