/**
 * Deep responsive visual audit.
 *
 * Verifies representative dashboards and portals across desktop/tablet/mobile
 * viewports for objective layout failures: blank pages, Vite overlays, root
 * horizontal overflow, console errors, and API errors. Screenshots are saved as
 * evidence for manual visual review.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, Page } from '@playwright/test';
import { API_BASE, gotoAsRole, TEST_USERS } from './helpers';

type TestRole = keyof typeof TEST_USERS;
type ThemeMode = 'light' | 'dark';

type ViewportTarget = {
  name: string;
  width: number;
  height: number;
};

type VisualTarget = {
  role: TestRole;
  path: string;
  label: string;
  modes?: ThemeMode[];
  viewports?: string[];
};

type VisualAudit = {
  label: string;
  role: TestRole;
  path: string;
  mode: ThemeMode;
  viewport: string;
  width: number;
  height: number;
  finalUrl: string;
  title: string | null;
  bodyLength: number;
  rootOverflowX: number;
  bodyOverflowX: number;
  visibleMain: boolean;
  viteOverlay: boolean;
  redirectedToLogin: boolean;
  accessDenied: boolean;
  apiErrors: string[];
  consoleErrors: string[];
  screenshot: string;
  failureReasons: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-responsive-visual-audit');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');

const viewports: Record<string, ViewportTarget> = {
  desktop: { name: 'desktop', width: 1440, height: 900 },
  tablet: { name: 'tablet', width: 1024, height: 768 },
  mobile: { name: 'mobile', width: 390, height: 844 },
};

const targets: VisualTarget[] = [
  { role: 'school_admin', path: '/dashboard', label: 'School admin dashboard', modes: ['light', 'dark'], viewports: ['desktop', 'tablet', 'mobile'] },
  { role: 'school_admin', path: '/students', label: 'Student list', viewports: ['desktop', 'mobile'] },
  { role: 'school_admin', path: '/finance/dashboard', label: 'Finance dashboard', viewports: ['desktop', 'mobile'] },
  { role: 'school_admin', path: '/library/dashboard', label: 'Library dashboard', viewports: ['desktop', 'mobile'] },
  { role: 'school_admin', path: '/eca/dashboard', label: 'ECA dashboard', viewports: ['desktop', 'mobile'] },
  { role: 'school_admin', path: '/sports/dashboard', label: 'Sports dashboard', viewports: ['desktop', 'mobile'] },
  { role: 'class_teacher', path: '/portal/teacher', label: 'Teacher portal', viewports: ['desktop', 'mobile'] },
  { role: 'student', path: '/portal/student', label: 'Student portal', viewports: ['desktop', 'mobile'] },
  { role: 'parent', path: '/portal/parent', label: 'Parent portal', viewports: ['desktop', 'mobile'] },
  { role: 'accountant', path: '/portal/accountant', label: 'Accountant portal', viewports: ['desktop', 'mobile'] },
  { role: 'librarian', path: '/portal/librarian', label: 'Librarian portal', viewports: ['desktop', 'mobile'] },
  { role: 'hostel_warden', path: '/portal/hostel', label: 'Hostel portal', viewports: ['desktop', 'mobile'] },
];

function selectedTargets() {
  const requestedRoles = (process.env.E2E_RESPONSIVE_ROLES || '').split(',').map((value) => value.trim()).filter(Boolean);
  const requestedRoutes = (process.env.E2E_RESPONSIVE_ROUTES || '').split(',').map((value) => value.trim()).filter(Boolean);

  return targets.filter((target) => {
    if (requestedRoles.length > 0 && !requestedRoles.includes(target.role)) return false;
    if (requestedRoutes.length > 0 && !requestedRoutes.includes(target.path)) return false;
    return true;
  });
}

function shortUrl(url: string) {
  return url.replace(API_BASE.replace('/api/v1', ''), '<api>');
}

function safeName(parts: string[]) {
  return parts.join('-').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function writeReport(entries: VisualAudit[], baseURL: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      baseURL,
      apiBase: API_BASE,
      entries,
      totals: {
        checks: entries.length,
        failures: entries.filter((entry) => entry.failureReasons.length > 0).length,
        screenshots: entries.filter((entry) => entry.screenshot).length,
        apiErrors: entries.reduce((sum, entry) => sum + entry.apiErrors.length, 0),
        consoleErrors: entries.reduce((sum, entry) => sum + entry.consoleErrors.length, 0),
        rootOverflowFailures: entries.filter((entry) => entry.rootOverflowX > 8 || entry.bodyOverflowX > 8).length,
      },
    }, null, 2)
  );
}

async function waitForPageSettled(page: Page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 12000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function prepareTheme(page: Page, mode: ThemeMode) {
  await page.addInitScript((themeMode) => {
    localStorage.setItem('sms_theme_mode', themeMode as string);
  }, mode);
}

async function collectLayoutSignals(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const main = document.querySelector('main') || body;
    const text = body.innerText || '';
    const rootOverflowX = Math.max(0, root.scrollWidth - root.clientWidth);
    const bodyOverflowX = Math.max(0, body.scrollWidth - window.innerWidth);
    const mainRect = main.getBoundingClientRect();
    const title = main.querySelector('h1,h2,h3,h4,.MuiTypography-h4,.MuiTypography-h5,.MuiTypography-h6')?.textContent?.trim()?.slice(0, 120) || null;

    return {
      title,
      bodyLength: text.trim().length,
      rootOverflowX,
      bodyOverflowX,
      visibleMain: mainRect.width > 0 && mainRect.height > 0,
      viteOverlay: text.includes('[plugin:vite') || text.includes('Failed to resolve import'),
      redirectedToLogin: location.pathname.includes('/login'),
      accessDenied: /access denied|unauthorized|you do not have permission/i.test(text),
    };
  });
}

test.describe('Deep responsive visual audit', () => {
  test('representative dashboards and portals fit key viewports', async ({ page }, testInfo) => {
    test.setTimeout(900_000);
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(20000);

    const entries: VisualAudit[] = [];
    let activeApiErrors: string[] = [];
    let activeConsoleErrors: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (!url.includes('/api/')) return;
      if (response.status() >= 400) {
        activeApiErrors.push(`${response.status()} ${response.request().method()} ${shortUrl(url)}`);
      }
    });

    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (/favicon|extension context invalidated|ResizeObserver loop/i.test(text)) return;
      activeConsoleErrors.push(text.slice(0, 500));
    });

    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    for (const target of selectedTargets()) {
      const modes = target.modes ?? ['light'];
      const viewportNames = target.viewports ?? ['desktop', 'mobile'];

      for (const mode of modes) {
        for (const viewportName of viewportNames) {
          const viewport = viewports[viewportName];
          if (!viewport) continue;

          activeApiErrors = [];
          activeConsoleErrors = [];
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await prepareTheme(page, mode);
          await gotoAsRole(page, target.role, target.path);
          await waitForPageSettled(page);

          const signals = await collectLayoutSignals(page);
          const screenshotName = `${safeName([target.role, target.path, mode, viewportName])}.png`;
          const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          const entry: VisualAudit = {
            label: target.label,
            role: target.role,
            path: target.path,
            mode,
            viewport: viewportName,
            width: viewport.width,
            height: viewport.height,
            finalUrl: page.url(),
            title: signals.title,
            bodyLength: signals.bodyLength,
            rootOverflowX: signals.rootOverflowX,
            bodyOverflowX: signals.bodyOverflowX,
            visibleMain: signals.visibleMain,
            viteOverlay: signals.viteOverlay,
            redirectedToLogin: signals.redirectedToLogin,
            accessDenied: signals.accessDenied,
            apiErrors: [...activeApiErrors],
            consoleErrors: [...activeConsoleErrors],
            screenshot: path.relative(OUT_DIR, screenshotPath).replace(/\\/g, '/'),
            failureReasons: [],
          };

          if (entry.bodyLength < 80) entry.failureReasons.push('page body too small or blank');
          if (!entry.visibleMain) entry.failureReasons.push('main content not visible');
          if (entry.viteOverlay) entry.failureReasons.push('vite overlay visible');
          if (entry.redirectedToLogin) entry.failureReasons.push('redirected to login');
          if (entry.accessDenied) entry.failureReasons.push('access denied text visible');
          if (entry.rootOverflowX > 8 || entry.bodyOverflowX > 8) entry.failureReasons.push('root horizontal overflow');
          if (entry.apiErrors.some((error) => /^5\d\d/.test(error))) entry.failureReasons.push('5xx API response');
          if (entry.consoleErrors.length > 0) entry.failureReasons.push('console errors');

          entries.push(entry);
          writeReport(entries, testInfo.project.use.baseURL);
        }
      }
    }

    writeReport(entries, testInfo.project.use.baseURL);
    const failures = entries.filter((entry) => entry.failureReasons.length > 0);
    expect(failures, JSON.stringify(failures.slice(0, 12), null, 2)).toEqual([]);
  });
});
