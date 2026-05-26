import { test as base, type Page } from '@playwright/test';
import path from 'node:path';

type AuthFixtures = {
  authedPage: Page;
  memberPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await use(page);
  },

  // Separate browser context authenticated as the member user.
  memberPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join('e2e', '.auth', 'member.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
