import { test, expect } from '../fixtures/auth';
import { clerk } from '@clerk/testing/playwright';

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /*
   * `clerk.loaded` before the URL assertion, in both cases. `ProtectedRoutes` is
   * <SignedIn>/<SignedOut>, and Clerk renders *neither* branch until it has loaded — so
   * before then the route simply sits there with no redirect issued. Asserting straight
   * after `goto` races the Clerk script against toHaveURL's 5s budget, which the suite
   * loses intermittently once four workers are competing for the stack. Waiting on the
   * thing the redirect actually depends on tests the redirect rather than the load time.
   */
  test('visit / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await clerk.loaded({ page });
    await expect(page).toHaveURL(/\/login/);
  });

  test('visit /group/:id redirects to /login', async ({ page }) => {
    await page.goto('/group/999');
    await clerk.loaded({ page });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('authenticated', () => {
  test('/ loads the groups UI after auth', async ({ authedPage: page }) => {
    await page.goto('/');
    await page.waitForSelector(LOADING, { state: 'attached' });
    await expect(page.getByRole('heading', { name: /Your Movie Groups/i })).toBeVisible();
  });

  // disposableAuthedPage, not authedPage: clerk.signOut() ends the Clerk session
  // for its whole context, and authedPage's context is shared by every test in
  // this worker.
  test('logout clears session and redirects to /login', async ({
    disposableAuthedPage: page,
  }) => {
    await page.goto('/');
    await page.waitForSelector(LOADING, { state: 'attached' });
    await clerk.signOut({ page });
    /*
     * Landing on /login here is a three-step chain, not one redirect: signOut navigates
     * to ClerkProvider's afterSignOutUrl ('/'), that route is protected, and only once
     * Clerk has re-initialised on the new document does <SignedOut> render the Navigate.
     * 5s is too tight for that under four-worker load — it is what run 5 lost on.
     *
     * A `clerk.loaded` wait is the wrong tool for this one: signOut kicks off its
     * navigation asynchronously, so `loaded` can observe the still-loaded pre-signOut
     * page and resolve before the chain even starts. Budgeting the assertion itself has
     * no such ordering hazard.
     */
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
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
