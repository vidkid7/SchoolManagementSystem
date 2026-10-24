import { expect, Page, test } from '@playwright/test';

async function installQaSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-local-only-token');
    localStorage.setItem('refreshToken', 'qa-local-only-refresh');
    localStorage.setItem('user', JSON.stringify({
      userId: 999001,
      username: 'qa-local-admin',
      email: 'qa-local@example.test',
      role: 'School_Admin',
      municipalityCode: 'KMC',
      schoolConfigId: 'qa-local-school',
    }));
  });
}

test('sports tournament list handles missing or malformed dates', async ({ page }) => {
  await installQaSession(page);
  await page.route(/\/api\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/sports/tournaments')
      ? [{ tournamentId: 1, sportId: 1, name: 'QA Tournament', startDate: null, endDate: 'not-a-date', status: 'active' }]
      : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta: { total: data.length } }) });
  });

  await page.goto('/KMC/sports/management?tab=2');
  const row = page.getByRole('row', { name: /QA Tournament/ });

  await expect(row).toBeVisible();
  await expect(row.getByText('—')).toHaveCount(2);
  await expect(row).not.toContainText('Invalid Date');
});
