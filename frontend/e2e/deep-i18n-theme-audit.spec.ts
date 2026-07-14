/**
 * Deep i18n/theme audit.
 *
 * Verifies English/Nepali translation parity, language persistence, light/dark
 * and high-contrast preferences, raw translation-key leakage, API/console
 * health, and screenshot evidence across representative role surfaces.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, Page } from '@playwright/test';
import { API_BASE, gotoAsRole, TEST_USERS } from './helpers';

type TestRole = keyof typeof TEST_USERS;
type LanguageCode = 'en' | 'ne';
type ThemeMode = 'light' | 'dark';

type AuditTarget = {
  role: TestRole;
  path: string;
  label: string;
  viewports?: Array<'desktop' | 'mobile'>;
};

type AuditVariant = {
  language: LanguageCode;
  mode: ThemeMode;
  highContrast: boolean;
};

type AuditEntry = {
  label: string;
  role: TestRole;
  path: string;
  language: LanguageCode;
  mode: ThemeMode;
  highContrast: boolean;
  viewport: string;
  finalUrl: string;
  bodyLength: number;
  devanagariCount: number;
  languageStorage: string | null;
  themeStorage: string | null;
  highContrastStorage: string | null;
  documentTheme: string | null;
  bodyTheme: string | null;
  rootOverflowX: number;
  bodyOverflowX: number;
  rawKeyLeaks: string[];
  badTokens: string[];
  apiErrors: string[];
  consoleErrors: string[];
  screenshot: string;
  failureReasons: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '..', 'test-results', 'deep-i18n-theme-audit');
const OUT_FILE = path.join(OUT_DIR, 'latest-report.json');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const EN_TRANSLATION = path.resolve(__dirname, '..', 'src', 'i18n', 'locales', 'en', 'translation.json');
const NE_TRANSLATION = path.resolve(__dirname, '..', 'src', 'i18n', 'locales', 'ne', 'translation.json');

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const targets: AuditTarget[] = [
  { role: 'school_admin', path: '/dashboard', label: 'School admin dashboard', viewports: ['desktop', 'mobile'] },
  { role: 'school_admin', path: '/students', label: 'Students', viewports: ['desktop', 'mobile'] },
  { role: 'school_admin', path: '/finance/dashboard', label: 'Finance dashboard' },
  { role: 'school_admin', path: '/library/dashboard', label: 'Library dashboard' },
  { role: 'school_admin', path: '/settings/roles', label: 'Role settings' },
  { role: 'hostel_warden', path: '/portal/hostel', label: 'Hostel portal' },
  { role: 'student', path: '/portal/student', label: 'Student portal', viewports: ['desktop', 'mobile'] },
  { role: 'parent', path: '/portal/parent', label: 'Parent portal' },
];

const variants: AuditVariant[] = [
  { language: 'en', mode: 'light', highContrast: false },
  { language: 'ne', mode: 'light', highContrast: false },
  { language: 'en', mode: 'dark', highContrast: false },
  { language: 'ne', mode: 'dark', highContrast: true },
];

function flattenKeys(value: unknown, prefix = '', keys: string[] = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) keys.push(prefix);
    return keys;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenKeys(child, nextPrefix, keys);
    } else {
      keys.push(nextPrefix);
    }
  }
  return keys;
}

function translationParity() {
  const en = JSON.parse(fs.readFileSync(EN_TRANSLATION, 'utf8'));
  const ne = JSON.parse(fs.readFileSync(NE_TRANSLATION, 'utf8'));
  const enKeys = flattenKeys(en);
  const neKeys = flattenKeys(ne);
  const enSet = new Set(enKeys);
  const neSet = new Set(neKeys);
  return {
    enKeys: enKeys.length,
    neKeys: neKeys.length,
    missingInEn: neKeys.filter((key) => !enSet.has(key)),
    missingInNe: enKeys.filter((key) => !neSet.has(key)),
  };
}

function selectedTargets() {
  const requestedRoles = (process.env.E2E_I18N_ROLES || '').split(',').map((value) => value.trim()).filter(Boolean);
  const requestedRoutes = (process.env.E2E_I18N_ROUTES || '').split(',').map((value) => value.trim()).filter(Boolean);

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

function writeReport(entries: AuditEntry[], parity: ReturnType<typeof translationParity>, baseURL: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      baseURL,
      apiBase: API_BASE,
      translationParity: {
        enKeys: parity.enKeys,
        neKeys: parity.neKeys,
        missingInEn: parity.missingInEn,
        missingInNe: parity.missingInNe,
      },
      totals: {
        checks: entries.length,
        failures: entries.filter((entry) => entry.failureReasons.length > 0).length,
        screenshots: entries.filter((entry) => entry.screenshot).length,
        apiErrors: entries.reduce((sum, entry) => sum + entry.apiErrors.length, 0),
        consoleErrors: entries.reduce((sum, entry) => sum + entry.consoleErrors.length, 0),
        rawKeyLeaks: entries.reduce((sum, entry) => sum + entry.rawKeyLeaks.length, 0),
      },
      entries,
    }, null, 2)
  );
}

async function preparePreferences(page: Page, variant: AuditVariant) {
  await page.addInitScript(({ language, mode, highContrast }) => {
    localStorage.setItem('language', language);
    localStorage.setItem('i18nextLng', language);
    localStorage.setItem('sms_theme_mode', mode);
    localStorage.setItem('sms_high_contrast', String(highContrast));
  }, variant);
}

async function waitForPageSettled(page: Page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 12000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function collectSignals(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const main = document.querySelector('main') || body;
    const text = body.innerText || '';
    const rawKeyRegex = /\b(common|students|dashboard|menu|auth|finance|library|eca|sports|portal|settings|roles|theme|examinations|attendance|calendar|communication|certificates|hostel|reports|notifications|currency)\.[A-Za-z0-9_.]+\b/g;
    const rawKeyLeaks = Array.from(new Set(text.match(rawKeyRegex) || [])).slice(0, 20);
    const badTokens = ['[object Object]', 'undefined', '{{', '}}'].filter((token) => text.includes(token));
    const mainRect = main.getBoundingClientRect();

    return {
      bodyLength: text.trim().length,
      devanagariCount: (text.match(/[\u0900-\u097F]/g) || []).length,
      languageStorage: localStorage.getItem('language'),
      themeStorage: localStorage.getItem('sms_theme_mode'),
      highContrastStorage: localStorage.getItem('sms_high_contrast'),
      documentTheme: root.dataset.theme || root.dataset.muiColorScheme || null,
      bodyTheme: body.dataset.theme || null,
      rootOverflowX: Math.max(0, root.scrollWidth - root.clientWidth),
      bodyOverflowX: Math.max(0, body.scrollWidth - window.innerWidth),
      visibleMain: mainRect.width > 0 && mainRect.height > 0,
      viteOverlay: text.includes('[plugin:vite') || text.includes('Failed to resolve import'),
      redirectedToLogin: location.pathname.includes('/login'),
      accessDenied: /access denied|unauthorized|you do not have permission/i.test(text),
      rawKeyLeaks,
      badTokens,
    };
  });
}

test.describe('Deep i18n and theme audit', () => {
  test('representative role surfaces render languages and themes correctly', async ({ page }, testInfo) => {
    test.setTimeout(900_000);
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(20000);

    const parity = translationParity();
    expect(parity.missingInEn, `Missing English translation keys: ${parity.missingInEn.slice(0, 20).join(', ')}`).toEqual([]);
    expect(parity.missingInNe, `Missing Nepali translation keys: ${parity.missingInNe.slice(0, 20).join(', ')}`).toEqual([]);

    const entries: AuditEntry[] = [];
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
      for (const variant of variants) {
        for (const viewportName of target.viewports ?? ['desktop']) {
          const viewport = viewports[viewportName];
          activeApiErrors = [];
          activeConsoleErrors = [];

          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await preparePreferences(page, variant);
          await gotoAsRole(page, target.role, target.path);
          await waitForPageSettled(page);

          const signals = await collectSignals(page);
          const screenshotName = `${safeName([target.role, target.path, variant.language, variant.mode, variant.highContrast ? 'hc' : 'normal', viewportName])}.png`;
          const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          const entry: AuditEntry = {
            label: target.label,
            role: target.role,
            path: target.path,
            language: variant.language,
            mode: variant.mode,
            highContrast: variant.highContrast,
            viewport: viewportName,
            finalUrl: page.url(),
            bodyLength: signals.bodyLength,
            devanagariCount: signals.devanagariCount,
            languageStorage: signals.languageStorage,
            themeStorage: signals.themeStorage,
            highContrastStorage: signals.highContrastStorage,
            documentTheme: signals.documentTheme,
            bodyTheme: signals.bodyTheme,
            rootOverflowX: signals.rootOverflowX,
            bodyOverflowX: signals.bodyOverflowX,
            rawKeyLeaks: signals.rawKeyLeaks,
            badTokens: signals.badTokens,
            apiErrors: [...activeApiErrors],
            consoleErrors: [...activeConsoleErrors],
            screenshot: path.relative(OUT_DIR, screenshotPath).replace(/\\/g, '/'),
            failureReasons: [],
          };

          if (signals.bodyLength < 80 || !signals.visibleMain) entry.failureReasons.push('page body too small or main content hidden');
          if (signals.viteOverlay) entry.failureReasons.push('vite overlay visible');
          if (signals.redirectedToLogin) entry.failureReasons.push('redirected to login');
          if (signals.accessDenied) entry.failureReasons.push('access denied text visible');
          if (entry.languageStorage !== variant.language) entry.failureReasons.push('language did not persist');
          if (entry.themeStorage !== variant.mode || entry.documentTheme !== variant.mode || entry.bodyTheme !== variant.mode) entry.failureReasons.push('theme did not persist to DOM');
          if (entry.highContrastStorage !== String(variant.highContrast)) entry.failureReasons.push('high contrast did not persist');
          if (variant.language === 'ne' && entry.devanagariCount < 10) entry.failureReasons.push('Nepali mode did not render enough Nepali text');
          if (entry.rootOverflowX > 8 || entry.bodyOverflowX > 8) entry.failureReasons.push('root horizontal overflow');
          if (entry.rawKeyLeaks.length > 0) entry.failureReasons.push('raw translation key visible');
          if (entry.badTokens.length > 0) entry.failureReasons.push('bad unresolved token visible');
          if (entry.apiErrors.some((error) => /^5\d\d/.test(error))) entry.failureReasons.push('5xx API response');
          if (entry.consoleErrors.length > 0) entry.failureReasons.push('console errors');

          entries.push(entry);
          writeReport(entries, parity, testInfo.project.use.baseURL);
        }
      }
    }

    writeReport(entries, parity, testInfo.project.use.baseURL);
    const failures = entries.filter((entry) => entry.failureReasons.length > 0);
    expect(failures, JSON.stringify(failures.slice(0, 12), null, 2)).toEqual([]);
  });
});
