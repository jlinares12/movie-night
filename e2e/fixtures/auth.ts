import { test as base, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';

type AuthFixtures = {
  authedPage: Page;
  memberPage: Page;
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
// and a valid movie_night_session cookie before the test body runs.
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
    // Explicitly empty storageState to prevent inheriting the project-level
    // owner.json from playwright.config.ts. If the context loads with an existing
    // Clerk session, page.goto('/login') finds the user already signed in and
    // window.Clerk.client is undefined when clerk.signIn() evaluates.
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
});

export { expect } from '@playwright/test';
