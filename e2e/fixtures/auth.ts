import { test as base, type Page, type APIRequestContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';

type AuthFixtures = {
  authedPage: Page;
  memberPage: Page;
  ownerRequest: APIRequestContext;
  memberRequest: APIRequestContext;
};

// Mint a fresh token per fixture call. clerkSetup() skips generation if
// CLERK_TESTING_TOKEN is already set, so we bypass it and call directly.
async function refreshTestingToken() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY must be set for E2E tests');
  const clerkClient = createClerkClient({ secretKey });
  const { token } = await clerkClient.testingTokens.createTestingToken();
  process.env.CLERK_TESTING_TOKEN = token;
}

// Mirror the global-setup sign-in flow so the context has a live Clerk session
// and a valid call_time_session cookie before the test body runs.
// Relying on storageState alone fails because the __session JWT expires after
// 60 s and the async FAPI refresh resolves after waitForURL/waitForSelector,
// causing Clerk to report SignedOut and redirect to /login mid-test.
async function signInUser(page: Page, emailAddress: string) {
  await page.goto('/login');
  await clerk.signIn({ page, emailAddress });
  const backendSessionReady = page.waitForResponse(
    (res) =>
      res.url().includes('/api/auth/session') &&
      res.request().method() === 'POST' &&
      res.status() === 200,
    { timeout: 15_000 },
  );
  await page.goto('/');
  await backendSessionReady;
}

function readTestUsers(): { ownerEmail: string; memberEmail: string } {
  return JSON.parse(
    fs.readFileSync(path.join('e2e', '.auth', 'users.json'), 'utf-8'),
  );
}

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ browser }, run) => {
    await refreshTestingToken();
    // Explicitly empty storageState so the context starts clean and
    // clerk.signIn() can run without finding a pre-existing session.
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await setupClerkTestingToken({ page });
    await signInUser(page, readTestUsers().ownerEmail);
    try {
      await run(page);
    } finally {
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
      await context.close();
    }
  },

  memberPage: async ({ browser }, run) => {
    await refreshTestingToken();
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await setupClerkTestingToken({ page });
    await signInUser(page, readTestUsers().memberEmail);
    try {
      await run(page);
    } finally {
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
      await context.close();
    }
  },

  // Expose the authenticated request context from authedPage so tests and
  // hooks can make owner-authenticated API calls without depending on the
  // project-level storageState default.
  ownerRequest: async ({ authedPage }, run) => {
    await run(authedPage.context().request);
  },

  // Expose the authenticated request context from memberPage so tests can
  // make member-authenticated API calls without memberPage.context().request.
  memberRequest: async ({ memberPage }, run) => {
    await run(memberPage.context().request);
  },
});

export { expect } from '@playwright/test';
