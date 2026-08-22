import { defineConfig, devices } from '@playwright/test';

/*
 * Mobile specs run under `mobile-chrome` only. `chromium` must ignore them — the mobile
 * shell is `lg:hidden`, so at a desktop viewport every nav assertion in them fails. The
 * split also keeps the PR gate cheap: the existing 7 specs stay single-viewport rather
 * than running twice.
 */
const MOBILE_SPECS = /mobile\..*\.spec\.ts$/;

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: './e2e/global-setup',
  globalTeardown: './e2e/global-teardown',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  timeout: 30_000,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: MOBILE_SPECS },
    {
      // Pixel 5's mobile UA, touch support and deviceScaleFactor, but pinned to the
      // iPhone SE's 375px — the narrowest realistic target, and the width the ticket's
      // definition of done names. Pixel 5's own 393px passes cases that 375px does not.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 667 } },
      testMatch: MOBILE_SPECS,
    },
  ],
});
