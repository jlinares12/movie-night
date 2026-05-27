import { test, expect } from '../fixtures/auth';
import { clerk } from '@clerk/testing/playwright';

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('visit / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visit /group/:id redirects to /login', async ({ page }) => {
    await page.goto('/group/999');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('authenticated', () => {
  test('/ loads the groups UI after auth', async ({ authedPage: page }) => {
    await page.goto('/');
    await page.waitForSelector(LOADING, { state: 'attached' });
    await expect(page.getByRole('heading', { name: /Your Movie Groups/i })).toBeVisible();
  });

  test('logout clears session and redirects to /login', async ({ authedPage: page }) => {
    await page.goto('/');
    await page.waitForSelector(LOADING, { state: 'attached' });
    await clerk.signOut({ page });
    await expect(page).toHaveURL(/\/login/);
  });

  test('tampered session cookie is rejected and redirects to /login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    try {
      await context.addCookies([
        { name: 'session', value: 'invalid_tampered_value', domain: 'localhost', path: '/' },
      ]);
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await context.close();
    }
  });
});
