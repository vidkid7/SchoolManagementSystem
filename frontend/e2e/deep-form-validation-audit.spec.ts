/**
 * Deep form validation audit.
 *
 * Opens important create dialogs, submits them empty/defaulted, and verifies the
 * UI stays stable without creating records. Non-auth write requests are blocked
 * by the test harness and reported as validation write attempts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, Page, Locator } from '@playwright/test';
import { API_BASE, gotoAsRole, TEST_USERS } from './helpers';

type TestRole = keyof typeof TEST_USERS;

type ValidationTarget = {
  role: TestRole;
  path: string;
  openLabel: RegExp;
  submitLabel: RegExp;
};

type ValidationAudit = {
  role: TestRole;
  path: string;
  openLabel: string;
  submitLabel: string;
  submitState: 'clicked' | 'disabled' | 'missing' | 'failed';
  surface: 'dialog' | 'page';
  validationSignal: boolean;
  dialogRemainedOpen: boolean;
  urlStable: boolean;
  blockedWrites: string[];
  readApiErrors: string[];
  consoleErrors: string[];
  failureReasons: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-form-validation-audit');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');

const targets: ValidationTarget[] = [
  { role: 'school_admin', path: '/academic/classes', openLabel: /^add class$/i, submitLabel: /^(save|create|add)/i },
  { role: 'school_admin', path: '/academic/years', openLabel: /^add academic year$/i, submitLabel: /^(save|create|add)/i },
  { role: 'school_admin', path: '/calendar/events', openLabel: /^add event$/i, submitLabel: /^(save|create|add)/i },
  { role: 'school_admin', path: '/communication/announcements', openLabel: /^create announcement$/i, submitLabel: /^(create|save|submit)/i },
  { role: 'school_admin', path: '/finance/fee-structures', openLabel: /^create fee structure$/i, submitLabel: /^(create|save|add)/i },
  { role: 'school_admin', path: '/library/books', openLabel: /^add book$/i, submitLabel: /^(add|save|create)/i },
  { role: 'school_admin', path: '/library/categories', openLabel: /^add category$/i, submitLabel: /^(add|save|create)/i },
  { role: 'school_admin', path: '/eca/list', openLabel: /^create eca$/i, submitLabel: /^(create|save|add)/i },
  { role: 'school_admin', path: '/sports/management', openLabel: /^create sport$/i, submitLabel: /^(submit|create|save|add)/i },
  { role: 'school_admin', path: '/certificates/manage', openLabel: /^add template$/i, submitLabel: /^(create|save|add)/i },
  { role: 'school_admin', path: '/settings/roles', openLabel: /^add role$/i, submitLabel: /^(create|save|add)/i },
  { role: 'librarian', path: '/library/management', openLabel: /^issue book$/i, submitLabel: /^(issue|save|submit)/i },
  { role: 'eca_coordinator', path: '/eca/list', openLabel: /^create eca$/i, submitLabel: /^(create|save|add)/i },
  { role: 'sports_coordinator', path: '/sports/management', openLabel: /^create sport$/i, submitLabel: /^(submit|create|save|add)/i },
];

const validationText = /required|invalid|select|enter|choose|missing|failed|error|validation|blocked|must be|please/i;
const writeMethod = /^(POST|PUT|PATCH|DELETE)$/i;
const expectedBlockedWriteConsole = /422|Validation audit blocked|Request failed with status code 422/i;

function selectedTargets() {
  const requestedRoles = (process.env.E2E_FORM_ROLES || '').split(',').map((value) => value.trim()).filter(Boolean);
  const requestedRoutes = (process.env.E2E_FORM_ROUTES || '').split(',').map((value) => value.trim()).filter(Boolean);

  return targets.filter((target) => {
    if (requestedRoles.length > 0 && !requestedRoles.includes(target.role)) return false;
    if (requestedRoutes.length > 0 && !requestedRoutes.includes(target.path)) return false;
    return true;
  });
}

function shortUrl(url: string) {
  return url.replace(API_BASE.replace('/api/v1', ''), '<api>');
}

function writeReport(entries: ValidationAudit[], baseURL: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      baseURL,
      apiBase: API_BASE,
      entries,
      totals: {
        targets: entries.length,
        failures: entries.filter((entry) => entry.failureReasons.length > 0).length,
        disabledSubmits: entries.filter((entry) => entry.submitState === 'disabled').length,
        clickedSubmits: entries.filter((entry) => entry.submitState === 'clicked').length,
        blockedWrites: entries.reduce((sum, entry) => sum + entry.blockedWrites.length, 0),
        readApiErrors: entries.reduce((sum, entry) => sum + entry.readApiErrors.length, 0),
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

async function clickFirstVisibleButton(page: Page, label: RegExp) {
  const buttons = page.getByRole('button').filter({ hasText: label });
  const count = await buttons.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      await button.click({ timeout: 2500 });
      return true;
    }
  }
  return false;
}

async function newestDialogOrMain(page: Page): Promise<{ scope: Locator; surface: 'dialog' | 'page' }> {
  const dialogs = page.locator('[role="dialog"]:visible');
  const dialogCount = await dialogs.count().catch(() => 0);
  if (dialogCount > 0) return { scope: dialogs.nth(dialogCount - 1), surface: 'dialog' };
  return { scope: page.locator('main').or(page.locator('body')), surface: 'page' };
}

async function findSubmitButton(scope: Locator, label: RegExp) {
  const buttons = scope.getByRole('button').filter({ hasText: label });
  const count = await buttons.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) return button;
  }
  return null;
}

async function surfaceHasValidation(scope: Locator) {
  const text = await scope.innerText({ timeout: 1500 }).catch(() => '');
  const invalidInputs = await scope.locator('input:invalid, textarea:invalid, [aria-invalid="true"]').count().catch(() => 0);
  return validationText.test(text) || invalidInputs > 0;
}

test.describe('Deep form validation audit', () => {
  test('empty/default create forms do not create records', async ({ page }, testInfo) => {
    test.setTimeout(600_000);
    page.setDefaultTimeout(4000);
    page.setDefaultNavigationTimeout(15000);

    const entries: ValidationAudit[] = [];
    let activeBlockedWrites: string[] = [];
    let activeReadApiErrors: string[] = [];
    let activeConsoleErrors: string[] = [];

    await page.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const url = request.url();
      if (writeMethod.test(request.method()) && !url.includes('/auth/login')) {
        activeBlockedWrites.push(`${request.method()} ${shortUrl(url)}`);
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Validation audit blocked this write request before it reached the API.',
          }),
        });
        return;
      }
      await route.continue();
    });

    page.on('response', (response) => {
      const url = response.url();
      if (!url.includes('/api/')) return;
      if (writeMethod.test(response.request().method())) return;
      if (response.status() >= 400) {
        activeReadApiErrors.push(`${response.status()} ${response.request().method()} ${shortUrl(url)}`);
      }
    });

    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (/favicon|extension context invalidated|ResizeObserver loop/i.test(text)) return;
      activeConsoleErrors.push(text.slice(0, 500));
    });

    for (const target of selectedTargets()) {
      activeBlockedWrites = [];
      activeReadApiErrors = [];
      activeConsoleErrors = [];

      await gotoAsRole(page, target.role, target.path);
      await waitForPageSettled(page);
      const startUrl = page.url();

      const entry: ValidationAudit = {
        role: target.role,
        path: target.path,
        openLabel: target.openLabel.source,
        submitLabel: target.submitLabel.source,
        submitState: 'failed',
        surface: 'page',
        validationSignal: false,
        dialogRemainedOpen: false,
        urlStable: true,
        blockedWrites: [],
        readApiErrors: [],
        consoleErrors: [],
        failureReasons: [],
      };

      const opened = await clickFirstVisibleButton(page, target.openLabel).catch(() => false);
      if (!opened) {
        entry.failureReasons.push('open button not found');
        entries.push(entry);
        writeReport(entries, testInfo.project.use.baseURL);
        continue;
      }

      await page.waitForTimeout(250);
      const { scope, surface } = await newestDialogOrMain(page);
      entry.surface = surface;

      const submitButton = await findSubmitButton(scope, target.submitLabel);
      if (!submitButton) {
        entry.submitState = 'missing';
        entry.validationSignal = await surfaceHasValidation(scope);
      } else if (!(await submitButton.isEnabled().catch(() => false))) {
        entry.submitState = 'disabled';
        entry.validationSignal = true;
      } else {
        entry.submitState = 'clicked';
        await submitButton.click({ timeout: 2500 }).catch((error) => {
          entry.submitState = 'failed';
          entry.failureReasons.push(`submit click failed: ${(error as Error).message}`);
        });
        await page.waitForTimeout(500);
        entry.validationSignal = await surfaceHasValidation(scope);
      }

      const dialogCount = await page.locator('[role="dialog"]:visible').count().catch(() => 0);
      entry.dialogRemainedOpen = surface === 'dialog' ? dialogCount > 0 : true;
      entry.urlStable = page.url() === startUrl;
      entry.blockedWrites = [...activeBlockedWrites];
      entry.readApiErrors = [...activeReadApiErrors];
      entry.consoleErrors = activeBlockedWrites.length > 0
        ? activeConsoleErrors.filter((error) => !expectedBlockedWriteConsole.test(error))
        : [...activeConsoleErrors];

      if (!entry.validationSignal && entry.blockedWrites.length === 0 && entry.submitState !== 'disabled') {
        entry.failureReasons.push('no validation, disabled-submit, or blocked-write signal after empty submit');
      }
      if (entry.surface === 'dialog' && !entry.dialogRemainedOpen) entry.failureReasons.push('dialog closed after invalid submit');
      if (!entry.urlStable) entry.failureReasons.push('route changed after invalid submit');
      if (entry.readApiErrors.some((error) => /^5\d\d/.test(error))) entry.failureReasons.push('5xx read API response');
      if (entry.consoleErrors.length > 0) entry.failureReasons.push('console error during validation flow');

      entries.push(entry);
      writeReport(entries, testInfo.project.use.baseURL);

      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(100);
    }

    writeReport(entries, testInfo.project.use.baseURL);
    const failures = entries.filter((entry) => entry.failureReasons.length > 0);
    expect(failures, JSON.stringify(failures.slice(0, 12), null, 2)).toEqual([]);
  });
});
