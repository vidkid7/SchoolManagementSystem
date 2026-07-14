/**
 * Deep open-action audit.
 *
 * Opens non-destructive workflow entry points such as Add/Create/New/Edit
 * dialogs and form routes, then closes or returns without submitting.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, Page } from '@playwright/test';
import { API_BASE, gotoAsRole, TEST_USERS } from './helpers';

type TestRole = keyof typeof TEST_USERS;

type ActionAudit = {
  role: TestRole;
  path: string;
  actionLabel: string;
  result: 'dialog' | 'route-change' | 'menu-or-inline' | 'skipped' | 'failed';
  finalUrl?: string;
  apiErrors: string[];
  consoleErrors: string[];
  writeRequests: string[];
  failureReasons: string[];
};

type RouteTarget = {
  role: TestRole;
  path: string;
  maxActions?: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-action-open-audit');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');

const routeTargets: RouteTarget[] = [
  { role: 'school_admin', path: '/dashboard', maxActions: 4 },
  { role: 'school_admin', path: '/students', maxActions: 3 },
  { role: 'school_admin', path: '/staff', maxActions: 3 },
  { role: 'school_admin', path: '/academic/classes', maxActions: 3 },
  { role: 'school_admin', path: '/academic/years', maxActions: 3 },
  { role: 'school_admin', path: '/academic/subjects', maxActions: 3 },
  { role: 'school_admin', path: '/calendar/events', maxActions: 3 },
  { role: 'school_admin', path: '/communication/announcements', maxActions: 3 },
  { role: 'school_admin', path: '/finance/fee-structures', maxActions: 3 },
  { role: 'school_admin', path: '/finance/invoices', maxActions: 3 },
  { role: 'school_admin', path: '/library/books', maxActions: 3 },
  { role: 'school_admin', path: '/library/categories', maxActions: 3 },
  { role: 'school_admin', path: '/eca/list', maxActions: 4 },
  { role: 'school_admin', path: '/sports/management', maxActions: 5 },
  { role: 'school_admin', path: '/certificates/manage', maxActions: 3 },
  { role: 'school_admin', path: '/settings/roles', maxActions: 3 },
  { role: 'librarian', path: '/library/management', maxActions: 4 },
  { role: 'accountant', path: '/finance/invoices', maxActions: 3 },
  { role: 'eca_coordinator', path: '/eca/list', maxActions: 4 },
  { role: 'sports_coordinator', path: '/sports/management', maxActions: 5 },
  { role: 'hostel_warden', path: '/portal/hostel', maxActions: 6 },
];

const openActionText = /\b(add|new|create|schedule|compose|write|assign|enroll|record|issue|return|manage|edit|view)\b/i;
const blockedActionText = /\b(delete|remove|save|submit|send|pay|approve|reject|checkout|logout|log out|sign out|archive|reset|import|upload|bulk|publish|generate|mark all|mark attendance|process|confirm)\b/i;
const writeMethod = /^(POST|PUT|PATCH|DELETE)$/i;

function selectedTargets() {
  const requestedRoles = (process.env.E2E_ACTION_ROLES || '').split(',').map((value) => value.trim()).filter(Boolean);
  const requestedRoutes = (process.env.E2E_ACTION_ROUTES || '').split(',').map((value) => value.trim()).filter(Boolean);

  return routeTargets.filter((target) => {
    if (requestedRoles.length > 0 && !requestedRoles.includes(target.role)) return false;
    if (requestedRoutes.length > 0 && !requestedRoutes.includes(target.path)) return false;
    return true;
  });
}

function shortUrl(url: string) {
  return url.replace(API_BASE.replace('/api/v1', ''), '<api>');
}

function writeReport(entries: ActionAudit[], baseURL: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      baseURL,
      apiBase: API_BASE,
      entries,
      totals: {
        routes: new Set(entries.map((entry) => `${entry.role}:${entry.path}`)).size,
        actions: entries.length,
        failures: entries.filter((entry) => entry.failureReasons.length > 0).length,
        writeRequests: entries.reduce((sum, entry) => sum + entry.writeRequests.length, 0),
        apiErrors: entries.reduce((sum, entry) => sum + entry.apiErrors.length, 0),
        consoleErrors: entries.reduce((sum, entry) => sum + entry.consoleErrors.length, 0),
      },
    }, null, 2)
  );
}

async function waitForPageSettled(page: Page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 12000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(150);
}

async function closeOpenSurfaces(page: Page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(100);

  for (const label of ['Cancel', 'Close']) {
    const buttons = page.getByRole('button', { name: label });
    const count = Math.min(await buttons.count().catch(() => 0), 2);
    for (let index = 0; index < count; index += 1) {
      const button = buttons.nth(index);
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        await button.click({ timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(100);
      }
    }
  }

  const iconClose = page.locator('button[aria-label="Close"], button[aria-label="close"]').first();
  if (await iconClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await iconClose.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(100);
  }
}

async function collectCandidateIndexes(page: Page, maxActions: number) {
  return page.locator('button:visible').evaluateAll((buttons, args) => {
    const { maxActions: limit, openSource, blockedSource } = args as { maxActions: number; openSource: string; blockedSource: string };
    const openPattern = new RegExp(openSource, 'i');
    const blockedPattern = new RegExp(blockedSource, 'i');
    return buttons
      .map((button, index) => ({
        index,
        label: `${button.textContent || ''} ${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`.replace(/\s+/g, ' ').trim(),
      }))
      .filter((item) => item.label && openPattern.test(item.label) && !blockedPattern.test(item.label))
      .slice(0, limit);
  }, {
    maxActions,
    openSource: openActionText.source,
    blockedSource: blockedActionText.source,
  });
}

test.describe('Deep open-action audit', () => {
  test('workflow entry buttons open without accidental writes', async ({ page }, testInfo) => {
    test.setTimeout(900_000);
    page.setDefaultTimeout(4000);
    page.setDefaultNavigationTimeout(15000);

    const entries: ActionAudit[] = [];
    const apiErrors: string[] = [];
    const consoleErrors: string[] = [];
    const writeRequests: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (!url.includes('/api/')) return;
      if (response.status() >= 400) {
        apiErrors.push(`${response.status()} ${response.request().method()} ${shortUrl(url)}`);
      }
    });

    page.on('request', (request) => {
      const url = request.url();
      if (!url.includes('/api/')) return;
      if (!writeMethod.test(request.method())) return;
      if (url.includes('/auth/login')) return;
      writeRequests.push(`${request.method()} ${shortUrl(url)}`);
    });

    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (/favicon|extension context invalidated|ResizeObserver loop/i.test(text)) return;
      consoleErrors.push(text.slice(0, 500));
    });

    for (const target of selectedTargets()) {
      await gotoAsRole(page, target.role, target.path);
      await waitForPageSettled(page);
      const startUrl = page.url();
      const candidates = await collectCandidateIndexes(page, target.maxActions ?? 3);

      if (candidates.length === 0) {
        const entry: ActionAudit = {
          role: target.role,
          path: target.path,
          actionLabel: 'no open-action button found',
          result: 'skipped',
          finalUrl: page.url(),
          apiErrors: [],
          consoleErrors: [],
          writeRequests: [],
          failureReasons: [],
        };
        entries.push(entry);
        writeReport(entries, testInfo.project.use.baseURL);
        continue;
      }

      for (const candidate of candidates) {
        apiErrors.length = 0;
        consoleErrors.length = 0;
        writeRequests.length = 0;

        const entry: ActionAudit = {
          role: target.role,
          path: target.path,
          actionLabel: candidate.label,
          result: 'failed',
          finalUrl: page.url(),
          apiErrors: [],
          consoleErrors: [],
          writeRequests: [],
          failureReasons: [],
        };

        const button = page.locator('button:visible').nth(candidate.index);
        if (!(await button.isVisible({ timeout: 1000 }).catch(() => false)) || !(await button.isEnabled().catch(() => false))) {
          entry.result = 'skipped';
          entries.push(entry);
          writeReport(entries, testInfo.project.use.baseURL);
          continue;
        }

        await button.click({ timeout: 2500 }).catch((error) => {
          entry.failureReasons.push(`click failed: ${(error as Error).message}`);
        });
        await page.waitForTimeout(300);

        const dialogCount = await page.locator('[role="dialog"]:visible').count().catch(() => 0);
        const menuCount = await page.locator('[role="menu"]:visible, [role="listbox"]:visible').count().catch(() => 0);
        if (page.url() !== startUrl) {
          entry.result = 'route-change';
        } else if (dialogCount > 0) {
          entry.result = 'dialog';
        } else if (menuCount > 0) {
          entry.result = 'menu-or-inline';
        } else if (entry.failureReasons.length === 0) {
          entry.result = 'menu-or-inline';
        }

        entry.finalUrl = page.url();
        entry.apiErrors = [...apiErrors];
        entry.consoleErrors = [...consoleErrors];
        entry.writeRequests = [...writeRequests];

        if (entry.apiErrors.some((error) => /^5\d\d/.test(error))) entry.failureReasons.push('5xx API response after action');
        if (entry.consoleErrors.length > 0) entry.failureReasons.push('console error after action');
        if (entry.writeRequests.length > 0) entry.failureReasons.push('open action triggered write request');

        entries.push(entry);
        writeReport(entries, testInfo.project.use.baseURL);

        if (page.url() !== startUrl) {
          await page.goto(startUrl).catch(() => {});
          await waitForPageSettled(page);
        } else {
          await closeOpenSurfaces(page);
          await waitForPageSettled(page);
        }
      }
    }

    writeReport(entries, testInfo.project.use.baseURL);

    const failures = entries.filter((entry) => entry.failureReasons.length > 0);
    expect(failures, JSON.stringify(failures.slice(0, 12), null, 2)).toEqual([]);
  });
});
