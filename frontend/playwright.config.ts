import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const shouldStartWebServer = process.env.E2E_SKIP_WEBSERVER !== '1';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never' }]],
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: shouldStartWebServer
    ? {
        command: process.env.E2E_WEB_COMMAND || 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
      }
    : undefined,
});
