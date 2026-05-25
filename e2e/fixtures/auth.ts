import { test as base, type Page } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import fs from 'node:fs';
import path from 'node:path';

interface Users {
  ownerId: string;
  ownerEmail: string;
  memberId: string;
  memberEmail: string;
}

function readUsers(): Users {
  return JSON.parse(fs.readFileSync(path.join('e2e', '.auth', 'users.json'), 'utf-8'));
}

type AuthFixtures = {
  authedPage: Page;
  memberPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Refreshes the Clerk session for the owner. storageState is already set to
  // owner.json in playwright.config.ts so the Flask session cookie is pre-loaded.
  authedPage: async ({ page }, use) => {
    const { ownerEmail } = readUsers();
    await setupClerkTestingToken({ page });
    await page.goto('/login');
    await clerk.signIn({ page, emailAddress: ownerEmail });
    await use(page);
  },

  // Separate browser context authenticated as the member user.
  memberPage: async ({ browser }, use) => {
    const { memberEmail } = readUsers();
    const context = await browser.newContext({
      storageState: path.join('e2e', '.auth', 'member.json'),
    });
    const page = await context.newPage();
    await setupClerkTestingToken({ page });
    await page.goto('/login');
    await clerk.signIn({ page, emailAddress: memberEmail });
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
