import {
  test as base,
  type Page,
  type Browser,
  type BrowserContext,
  type APIRequestContext,
} from '@playwright/test';
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

// Worker-scoped: one signed-in context per role, per worker. Signing in is the
// only genuinely Clerk-expensive step in the suite — clerk.signIn() costs a
// Backend API user lookup plus a sign-in-token mint, and refreshTestingToken()
// costs another Backend API call. At test scope that ran ~70 times per suite
// across 8 workers, which trips Clerk's rate limits and fails the run; at
// worker scope it runs twice per worker.
type AuthWorkerFixtures = {
  ownerContext: BrowserContext;
  memberContext: BrowserContext;
};

// Mint a fresh token per worker. clerkSetup() skips generation if
// CLERK_TESTING_TOKEN is already set, so we bypass it and call directly.
async function refreshTestingToken() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY must be set for E2E tests');
  const clerkClient = createClerkClient({ secretKey });
  const { token } = await clerkClient.testingTokens.createTestingToken();
  process.env.CLERK_TESTING_TOKEN = token;
}

// Sign in once and hand back the context holding the resulting cookies.
//
// Reusing a live context is what makes this safe, where a saved storageState
// was not: storageState restores cookies into a cold context, so clerk-js has
// to redo the __client -> __session exchange from scratch and the async FAPI
// refresh can resolve after waitForURL/waitForSelector, leaving Clerk briefly
// SignedOut and bouncing the test to /login. Here the long-lived __client
// cookie stays in a warm jar and every new page mints its own short-lived
// __session JWT off it — a FAPI refresh, not a sign-in.
async function signedInContext(
  browser: Browser,
  emailAddress: string,
): Promise<BrowserContext> {
  await refreshTestingToken();
  // Explicitly empty storageState so the context starts clean and
  // clerk.signIn() can run without finding a pre-existing session.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  // Context-level rather than page-level: the route handler then covers every
  // page this worker opens, so one testing token serves the whole worker.
  await setupClerkTestingToken({ context });

  const page = await context.newPage();
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
  await page.close();

  return context;
}

function readTestUsers(): { ownerEmail: string; memberEmail: string } {
  return JSON.parse(
    fs.readFileSync(path.join('e2e', '.auth', 'users.json'), 'utf-8'),
  );
}

// A fresh page per test, from the worker's already-signed-in context. Fresh
// rather than one long-lived shared page because specs register one-shot
// listeners (page.once('dialog', ...)) that leak into the next test if the
// handler never fires.
async function newPageFrom(context: BrowserContext, run: (page: Page) => Promise<void>) {
  const page = await context.newPage();
  try {
    await run(page);
  } finally {
    // SSE keeps a request open, so networkidle never settles — bounded wait.
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    await page.close();
  }
}

export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  ownerContext: [
    async ({ browser }, run) => {
      const context = await signedInContext(browser, readTestUsers().ownerEmail);
      await run(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  memberContext: [
    async ({ browser }, run) => {
      const context = await signedInContext(browser, readTestUsers().memberEmail);
      await run(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  authedPage: async ({ ownerContext }, run) => {
    await newPageFrom(ownerContext, run);
  },

  memberPage: async ({ memberContext }, run) => {
    await newPageFrom(memberContext, run);
  },

  // Depend on the context, not the page: an owner-authenticated API call in a
  // beforeEach no longer drags a whole owner page into member-only tests.
  // context.request shares the context's cookie jar, so it is already authed.
  ownerRequest: async ({ ownerContext }, run) => {
    await run(ownerContext.request);
  },

  memberRequest: async ({ memberContext }, run) => {
    await run(memberContext.request);
  },
});

export { expect } from '@playwright/test';
