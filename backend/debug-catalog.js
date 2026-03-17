const { chromium } = require('playwright');
(async () => {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const { data: { accessToken, refreshToken, user } } = await loginRes.json();
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));
  
  await page.goto('http://localhost:5174/KMC/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, refresh, userData }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
  }, { token: accessToken, refresh: refreshToken, userData: user });
  
  await page.goto('http://localhost:5174/KMC/library/catalog', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  console.log('Errors:', errors);
  
  // Check what's in the DOM
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 300):', bodyText?.substring(0, 300));
  
  await page.screenshot({ path: 'C:/Users/A C E R/.copilot/session-state/171df193-ba5d-4ac8-a336-3c203cf48d32/files/screenshots/library-catalog-debug.png', fullPage: true });
  
  await browser.close();
})();
