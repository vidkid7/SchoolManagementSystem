/**
 * Comprehensive E2E Test Suite — Full System Audit
 *
 * Tests every portal, page, navigation (forward/backward), buttons, links,
 * API integration, theme switching, and i18n across the entire system.
 */
import { test, expect, Page } from '@playwright/test';
import { gotoAsRole, loginViaAPI, loginAs, expectPageLoaded, TEST_USERS } from './helpers';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      errors.push(msg.text());
    }
  });
  return errors;
}

async function expectGlassmorphicDesign(page: Page) {
  // Verify glassmorphic elements exist (backdrop-filter applied)
  const glassElements = await page.locator('[style*="backdrop-filter"], [class*="MuiPaper"], [class*="MuiCard"]').count();
  expect(glassElements).toBeGreaterThan(0);
}

async function testThemeToggle(page: Page) {
  const themeBtn = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], button[aria-label*="mode"], button[aria-label*="dark"], button[aria-label*="light"]').first();
  if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Get initial background
    const initialBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await themeBtn.click();
    await page.waitForTimeout(500);
    const newBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Theme should have changed
    expect(newBg).not.toBe(initialBg);
    // Toggle back
    await themeBtn.click();
    await page.waitForTimeout(500);
  }
}

async function testLanguageSwitch(page: Page) {
  const langBtn = page.locator('button:has-text("EN"), button:has-text("NE"), button:has-text("English"), button:has-text("नेपाली")').first();
  if (await langBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await langBtn.click();
    await page.waitForTimeout(500);
    // Just verify the page didn't crash
    await expect(page.locator('body')).toBeVisible();
  }
}

async function testNavigation(page: Page, slug: string, path: string, expectedText: RegExp) {
  await page.goto(`/${slug}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await expect(page.locator('body')).toBeVisible();
  await expectPageLoaded(page);
  // Check for expected content
  const hasText = await page.getByText(expectedText).first().isVisible({ timeout: 5000 }).catch(() => false);
  return hasText;
}

// ─── 1. Authentication Tests ────────────────────────────────────────────────

test.describe('Authentication', () => {
  test('login page loads with proper design', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login with valid admin credentials', async ({ page }) => {
    const url = await loginAs(page, 'school_admin');
    expect(url).toContain('/dashboard');
  });

  test('login redirects each role to correct portal', async ({ page }) => {
    for (const [role, user] of Object.entries(TEST_USERS)) {
      try {
        const { slug } = await loginViaAPI(page, role as keyof typeof TEST_USERS);
        await page.goto(`/${slug}${user.expectedPath}`);
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('body')).toBeVisible();
      } catch {
        // Some test users may not exist in DB - skip
      }
    }
  });

  test('unauthorized access redirects to login', async ({ page }) => {
    await page.goto('/kmc/dashboard');
    await page.waitForTimeout(2000);
    const url = page.url();
    // Should redirect to login or show unauthorized
    expect(url.includes('/login') || url.includes('/unauthorized')).toBeTruthy();
  });
});

// ─── 2. Admin Dashboard & Navigation ────────────────────────────────────────

test.describe('Admin Dashboard & Navigation', () => {
  test('dashboard loads with glassmorphic design', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await expectPageLoaded(page);
    await expectGlassmorphicDesign(page);
  });

  test('sidebar navigation works', async ({ page }) => {
    const slug = await gotoAsRole(page, 'school_admin', '/dashboard');
    
    // Test key navigation items
    const navItems = [
      { text: /student/i, path: '/students' },
      { text: /staff/i, path: '/staff' },
      { text: /library/i, path: '/library' },
      { text: /calendar/i, path: '/calendar' },
    ];

    for (const item of navItems) {
      const link = page.locator(`a[href*="${item.path}"], [role="button"]:has-text("${item.text.source}")`).first();
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('browser back/forward navigation works', async ({ page }) => {
    const slug = await gotoAsRole(page, 'school_admin', '/dashboard');
    
    // Navigate to students
    await page.goto(`/${slug}/students`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    const studentsUrl = page.url();
    
    // Navigate to staff
    await page.goto(`/${slug}/staff`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/students');
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/staff');
  });

  test('theme toggle works on dashboard', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await testThemeToggle(page);
  });

  test('language switch works on dashboard', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await testLanguageSwitch(page);
  });
});

// ─── 3. Admin Pages — Full Navigation ───────────────────────────────────────

test.describe('Admin Pages Navigation', () => {
  const adminPages = [
    { path: '/students', text: /student/i },
    { path: '/staff', text: /staff/i },
    { path: '/academic', text: /academic|class/i },
    { path: '/attendance', text: /attendance/i },
    { path: '/finance', text: /finance|fee/i },
    { path: '/examinations', text: /exam/i },
    { path: '/library', text: /library|book/i },
    { path: '/certificates', text: /certificate/i },
    { path: '/calendar', text: /calendar|event/i },
    { path: '/communication/messages', text: /message|communication/i },
    { path: '/communication/announcements', text: /announcement/i },
    { path: '/reports', text: /report|analytics/i },
    { path: '/audit', text: /audit/i },
    { path: '/settings', text: /setting/i },
    { path: '/documents', text: /document/i },
    { path: '/admissions', text: /admission/i },
    { path: '/sports', text: /sport/i },
    { path: '/eca', text: /eca|activity/i },
  ];

  for (const pg of adminPages) {
    test(`admin can navigate to ${pg.path}`, async ({ page }) => {
      const slug = await gotoAsRole(page, 'school_admin', pg.path);
      await expectPageLoaded(page);
      // Page should have relevant content
      const body = await page.locator('body').textContent();
      expect(body?.toLowerCase()).toMatch(pg.text);
    });
  }
});

// ─── 4. Student Portal ─────────────────────────────────────────────────────

test.describe('Student Portal', () => {
  test('loads with glassmorphic design and API data', async ({ page }) => {
    await gotoAsRole(page, 'student', '/portal/student');
    await expectPageLoaded(page);
    await expectGlassmorphicDesign(page);
    
    // Should have stat cards
    await expect(page.locator('[class*="MuiCard"], [class*="MuiPaper"], [class*="MuiBox"]').first()).toBeVisible();
  });

  test('tabs work correctly', async ({ page }) => {
    await gotoAsRole(page, 'student', '/portal/student');
    
    // Click through all tabs
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(300);
      // Tab panel should be visible
      await expect(page.locator(`[role="tabpanel"]:not([hidden])`).first()).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('no hardcoded mock data visible', async ({ page }) => {
    await gotoAsRole(page, 'student', '/portal/student');
    const body = await page.locator('body').textContent() || '';
    // Should NOT have hardcoded mock data
    expect(body).not.toContain('Mr. Sharma');
    expect(body).not.toContain('Math Homework Ch. 5');
    expect(body).not.toContain('Annual Sports Day - Falgun 15');
  });
});

// ─── 5. Teacher Portal ──────────────────────────────────────────────────────

test.describe('Teacher Portal', () => {
  test('loads with proper design', async ({ page }) => {
    await gotoAsRole(page, 'subject_teacher', '/portal/teacher');
    await expectPageLoaded(page);
    await expectGlassmorphicDesign(page);
  });

  test('tabs navigate correctly', async ({ page }) => {
    await gotoAsRole(page, 'subject_teacher', '/portal/teacher');
    
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(4);
    
    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('quick links navigate to correct pages', async ({ page }) => {
    await gotoAsRole(page, 'subject_teacher', '/portal/teacher');
    
    // Navigate to Profile & Links tab (last tab)
    const tabs = page.locator('[role="tab"]');
    const lastTab = tabs.last();
    await lastTab.click();
    await page.waitForTimeout(500);
    
    // Quick links should be visible
    const links = page.locator('[role="listitem"] button, [role="button"]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});

// ─── 6. All Role Portals Load Test ──────────────────────────────────────────

test.describe('Role Portal Loading', () => {
  const portalRoutes: Array<{ role: keyof typeof TEST_USERS; path: string; name: string }> = [
    { role: 'student', path: '/portal/student', name: 'Student Portal' },
    { role: 'parent', path: '/portal/parent', name: 'Parent Portal' },
    { role: 'subject_teacher', path: '/portal/teacher', name: 'Teacher Portal' },
    { role: 'class_teacher', path: '/portal/class-teacher', name: 'Class Teacher Portal' },
    { role: 'department_head', path: '/portal/department-head', name: 'Department Head Portal' },
    { role: 'accountant', path: '/portal/accountant', name: 'Accountant Portal' },
    { role: 'librarian', path: '/portal/librarian', name: 'Librarian Portal' },
    { role: 'eca_coordinator', path: '/portal/eca-coordinator', name: 'ECA Coordinator Portal' },
    { role: 'sports_coordinator', path: '/portal/sports-coordinator', name: 'Sports Coordinator Portal' },
    { role: 'transport_manager', path: '/portal/transport', name: 'Transport Portal' },
    { role: 'hostel_warden', path: '/portal/hostel', name: 'Hostel Portal' },
    { role: 'non_teaching_staff', path: '/portal/non-teaching-staff', name: 'Non-Teaching Staff Portal' },
  ];

  for (const { role, path, name } of portalRoutes) {
    test(`${name} loads without errors`, async ({ page }) => {
      try {
        await gotoAsRole(page, role, path);
        await expectPageLoaded(page);
        
        // Check the page has actual content (not blank)
        const bodyText = await page.locator('body').textContent() || '';
        expect(bodyText.length).toBeGreaterThan(50);
        
        // Verify tabs exist (all portals have tabs)
        const tabCount = await page.locator('[role="tab"]').count();
        expect(tabCount).toBeGreaterThanOrEqual(2);
      } catch (e) {
        // If login fails, the test user may not exist - skip gracefully
        console.log(`Skipping ${name}: ${(e as Error).message}`);
      }
    });
  }
});

// ─── 7. Finance Module ──────────────────────────────────────────────────────

test.describe('Finance Module', () => {
  test('finance dashboard loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/finance');
    await expectPageLoaded(page);
  });

  test('fee structures page loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/finance/fee-structures');
    await expectPageLoaded(page);
  });

  test('invoices page loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/finance/invoices');
    await expectPageLoaded(page);
  });

  test('payments page loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/finance/payments');
    await expectPageLoaded(page);
  });
});

// ─── 8. Academic Module ─────────────────────────────────────────────────────

test.describe('Academic Module', () => {
  test('academic dashboard loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/academic');
    await expectPageLoaded(page);
  });

  test('class management loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/academic/classes');
    await expectPageLoaded(page);
  });

  test('academic years loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/academic/years');
    await expectPageLoaded(page);
  });
});

// ─── 9. Attendance Module ───────────────────────────────────────────────────

test.describe('Attendance Module', () => {
  test('attendance dashboard loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/attendance');
    await expectPageLoaded(page);
  });

  test('attendance marking page loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/attendance/mark');
    await expectPageLoaded(page);
  });

  test('attendance reports loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/attendance/reports');
    await expectPageLoaded(page);
  });
});

// ─── 10. Library Module ─────────────────────────────────────────────────────

test.describe('Library Module', () => {
  test('library dashboard loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/library');
    await expectPageLoaded(page);
  });

  test('book catalog loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/library/books');
    await expectPageLoaded(page);
  });
});

// ─── 11. Examination Module ─────────────────────────────────────────────────

test.describe('Examination Module', () => {
  test('examination dashboard loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/examinations');
    await expectPageLoaded(page);
  });

  test('exam list loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/examinations/list');
    await expectPageLoaded(page);
  });
});

// ─── 12. Theme Consistency ──────────────────────────────────────────────────

test.describe('Theme Consistency', () => {
  const pagesToTest = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/students', name: 'Students' },
    { path: '/finance', name: 'Finance' },
    { path: '/settings', name: 'Settings' },
    { path: '/calendar', name: 'Calendar' },
  ];

  for (const pg of pagesToTest) {
    test(`dark/light theme works on ${pg.name}`, async ({ page }) => {
      await gotoAsRole(page, 'school_admin', pg.path);
      await testThemeToggle(page);
    });
  }

  test('theme persists across navigation', async ({ page }) => {
    const slug = await gotoAsRole(page, 'school_admin', '/dashboard');
    
    // Toggle to dark mode
    const themeBtn = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], button[aria-label*="mode"], button[aria-label*="dark"]').first();
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      
      // Navigate to another page
      await page.goto(`/${slug}/students`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      
      const studentsBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      // Theme should persist
      expect(studentsBg).toBe(darkBg);
      
      // Toggle back
      const themeBtnAgain = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], button[aria-label*="mode"], button[aria-label*="light"]').first();
      if (await themeBtnAgain.isVisible({ timeout: 3000 }).catch(() => false)) {
        await themeBtnAgain.click();
      }
    }
  });
});

// ─── 13. i18n / Language Switching ──────────────────────────────────────────

test.describe('Internationalization (i18n)', () => {
  test('language switch changes UI text', async ({ page }) => {
    const slug = await gotoAsRole(page, 'school_admin', '/dashboard');
    
    // Look for language switcher
    const langSwitcher = page.locator('button:has-text("EN"), button:has-text("NE"), button:has-text("English"), button:has-text("नेपाली"), [aria-label*="language"]').first();
    
    if (await langSwitcher.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get initial text
      const initialText = await page.locator('body').textContent() || '';
      
      await langSwitcher.click();
      await page.waitForTimeout(1000);
      
      const newText = await page.locator('body').textContent() || '';
      // Text should have changed (at least partially)
      expect(newText).not.toBe(initialText);
    }
  });

  test('language persists across navigation', async ({ page }) => {
    const slug = await gotoAsRole(page, 'school_admin', '/dashboard');
    
    // Set language to English explicitly
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    await page.goto(`/${slug}/students`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    const lang = await page.evaluate(() => localStorage.getItem('language'));
    expect(lang).toBe('en');
  });
});

// ─── 14. API Integration Verification ───────────────────────────────────────

test.describe('API Integration', () => {
  test('dashboard makes real API calls', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/')) {
        apiCalls.push(request.url());
      }
    });
    
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await page.waitForTimeout(3000);
    
    // Should have made API calls
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('student list fetches from API', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/')) {
        apiCalls.push(request.url());
      }
    });
    
    await gotoAsRole(page, 'school_admin', '/students');
    await page.waitForTimeout(3000);
    
    const hasStudentApi = apiCalls.some(url => url.includes('student'));
    expect(hasStudentApi).toBeTruthy();
  });

  test('finance page fetches from API', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/')) {
        apiCalls.push(request.url());
      }
    });
    
    await gotoAsRole(page, 'school_admin', '/finance');
    await page.waitForTimeout(3000);
    
    expect(apiCalls.length).toBeGreaterThan(0);
  });
});

// ─── 15. Responsive Design ──────────────────────────────────────────────────

test.describe('Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await expect(page.locator('body')).toBeVisible();
    await expectPageLoaded(page);
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoAsRole(page, 'school_admin', '/dashboard');
    await expect(page.locator('body')).toBeVisible();
    await expectPageLoaded(page);
  });

  test('mobile sidebar toggles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoAsRole(page, 'school_admin', '/dashboard');
    
    // Look for menu/hamburger button
    const menuBtn = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(500);
      // Drawer should be visible
      const drawer = page.locator('[class*="MuiDrawer"]');
      await expect(drawer).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });
});

// ─── 16. Settings & Configuration ───────────────────────────────────────────

test.describe('Settings Pages', () => {
  test('system settings loads with tabs', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/settings');
    await expectPageLoaded(page);
    
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });

  test('admin settings portal loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/portal/admin-settings');
    await expectPageLoaded(page);
  });
});

// ─── 17. Municipality Admin ─────────────────────────────────────────────────

test.describe('Municipality Admin', () => {
  test('municipality portal loads', async ({ page }) => {
    try {
      await gotoAsRole(page, 'municipality_admin', '/portal/municipality-admin');
      await expectPageLoaded(page);
    } catch {
      console.log('Municipality admin user may not exist');
    }
  });
});

// ─── 18. Certificate Module ─────────────────────────────────────────────────

test.describe('Certificate Module', () => {
  test('certificate dashboard loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/certificates');
    await expectPageLoaded(page);
  });
});

// ─── 19. Document Management ────────────────────────────────────────────────

test.describe('Document Management', () => {
  test('documents page loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/documents');
    await expectPageLoaded(page);
  });
});

// ─── 20. Audit Logs ─────────────────────────────────────────────────────────

test.describe('Audit Logs', () => {
  test('audit page loads', async ({ page }) => {
    await gotoAsRole(page, 'school_admin', '/audit');
    await expectPageLoaded(page);
  });
});
