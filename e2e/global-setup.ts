import { chromium, type FullConfig } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join('e2e', '.auth');

async function saveStorageState(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseURL: string,
  email: string,
  filename: string,
) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  try {
    // setupClerkTestingToken must be called before the first goto
    await setupClerkTestingToken({ page });
    // Navigate to a non-protected page so Clerk JS loads
    await page.goto('/login');
    // Sign in via backend-generated ticket — no UI interaction
    await clerk.signIn({ page, emailAddress: email });
    // Navigate to the protected home page to trigger useBackendAuth
    const sessionReady = page.waitForResponse(
      (res) =>
        res.url().includes('/api/auth/session') &&
        res.request().method() === 'POST' &&
        res.status() === 200,
      { timeout: 15_000 },
    );
    await page.goto('/');
    await sessionReady;
    await context.storageState({ path: path.join(AUTH_DIR, filename) });
  } finally {
    await context.close();
  }
}

export default async function globalSetup(config: FullConfig) {
  await clerkSetup();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY must be set for E2E tests');

  const clerkClient = createClerkClient({ secretKey });

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const stamp = Date.now();
  const ownerEmail = `e2e-owner-${stamp}@clerk-test.com`;
  const memberEmail = `e2e-member-${stamp}@clerk-test.com`;

  const [ownerUser, memberUser] = await Promise.all([
    clerkClient.users.createUser({
      emailAddress: [ownerEmail],
      password: 'E2eTestPass1!',
      username: `e2e-owner-${stamp}`,
    }),
    clerkClient.users.createUser({
      emailAddress: [memberEmail],
      password: 'E2eTestPass1!',
      username: `e2e-member-${stamp}`,
    }),
  ]);

  fs.writeFileSync(
    path.join(AUTH_DIR, 'users.json'),
    JSON.stringify({
      ownerId: ownerUser.id,
      ownerEmail,
      memberId: memberUser.id,
      memberEmail,
    }),
  );

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';
  const browser = await chromium.launch();

  try {
    await saveStorageState(browser, baseURL, ownerEmail, 'owner.json');
    await saveStorageState(browser, baseURL, memberEmail, 'member.json');
  } finally {
    await browser.close();
  }
}
