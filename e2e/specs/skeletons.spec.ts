import type { Page, TestInfo } from '@playwright/test';
import { test, expect } from '../fixtures/auth';
import {
  apiCreateGroup,
  apiDeleteGroup,
  apiCreateSession,
  apiCreateProposal,
} from '../helpers/api';

/**
 * Skeletons are only on screen for as long as their fetch is in flight — locally that is
 * 50–200ms, which is too short to look at. Every test here holds the relevant responses
 * open, asserts the skeleton is standing in for the real layout, attaches a screenshot,
 * and only then releases.
 *
 * The screenshots are the point: run
 *   make test-e2e-file FILE=skeletons.spec.ts
 *   make test-e2e-report
 * to see each skeleton next to the layout it stands in for.
 */

const LOADING_SETTLED = '[data-testid="global-loading"][data-loading="false"]';

/**
 * Pause every matching response until the returned function is called.
 *
 * `/events` is always let through: it is the SSE stream, which by design never completes,
 * so holding it would hang the route handler instead of the fetch under test.
 */
async function holdResponses(page: Page, pattern: string): Promise<() => void> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });

  await page.route(pattern, async (route) => {
    if (route.request().url().includes('/events')) return route.continue();
    await gate;
    await route.continue();
  });

  return release;
}

async function shoot(page: Page, name: string, testInfo: TestInfo) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

let groupId = 0;

test.beforeEach(async ({ ownerRequest: request }) => {
  const group = await apiCreateGroup(request, `PW-Skeleton-${Date.now()}`, 'Skeleton parity fixture');
  groupId = group.id;
});

test.afterEach(async ({ ownerRequest: request }) => {
  if (groupId) {
    try { await apiDeleteGroup(request, groupId); } catch { /* already gone */ }
    groupId = 0;
  }
});

test('home holds group-card skeletons while /api/groups is in flight', async ({ authedPage: page }, testInfo) => {
  const release = await holdResponses(page, '**/api/groups');

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // One announcing region per card — the accepted cost of a self-contained skeleton
  await expect(page.getByRole('status')).toHaveCount(2);
  await expect(page.getByText('Loading group', { exact: true }).first()).toBeAttached();
  await shoot(page, 'home-group-cards', testInfo);

  release();
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  // Unmounted, not hidden — a live region left mounted would keep announcing "Loading…"
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /leave/i }).first()).toBeVisible();
});

test('group page holds a layout-matched skeleton while its fetch is in flight', async ({ authedPage: page }, testInfo) => {
  const release = await holdResponses(page, '**/api/groups/*');

  await page.goto(`/group/${groupId}`, { waitUntil: 'domcontentloaded' });

  // Header, invite panel, member list, session list
  await expect(page.getByRole('status')).toHaveCount(4);
  for (const label of ['Loading group', 'Loading invite code', 'Loading members', 'Loading sessions']) {
    await expect(page.getByText(label, { exact: true })).toBeAttached();
  }
  await shoot(page, 'group-page', testInfo);

  release();
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Invite Code' })).toBeVisible();
  await shoot(page, 'group-page-settled', testInfo);
});

test('session page holds a layout-matched skeleton across all three fetches', async ({ authedPage: page, ownerRequest: request }, testInfo) => {
  const session = await apiCreateSession(request, groupId);
  await apiCreateProposal(request, groupId, session.id, {
    title: 'Skeleton Crew',
    overview: 'A film that exists only so this fixture has a nomination to render.',
    runtime_minutes: 121,
  });

  // `**` rather than `*` so the nested /sessions/<id> and /proposals routes match too
  const release = await holdResponses(page, '**/api/groups/**');

  await page.goto(`/group/${groupId}/session/${session.id}`, { waitUntil: 'domcontentloaded' });

  // Hero, nomination card, session meta, potluck.
  // `exact` matters: "Loading session" is a prefix of "Loading session details", and
  // getByText is a substring match by default.
  await expect(page.getByRole('status')).toHaveCount(4);
  for (const label of ['Loading session', 'Loading nomination', 'Loading session details', 'Loading potluck list']) {
    await expect(page.getByText(label, { exact: true })).toBeAttached();
  }
  await shoot(page, 'session-page', testInfo);

  release();
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Skeleton Crew')).toBeVisible();
  await shoot(page, 'session-page-settled', testInfo);
});

test('skeletons degrade to a flat tint under prefers-reduced-motion', async ({ authedPage: page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const release = await holdResponses(page, '**/api/groups/*');

  await page.goto(`/group/${groupId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toHaveCount(4);

  // The Tailwind plugin only sets `animation: none`, which would park the gradient over
  // the block; `motion-reduce:hidden` is what leaves the intended flat tint behind.
  const sweepDisplay = await page
    .locator('[data-testid="skeleton-sweep"]')
    .first()
    .evaluate((el) => getComputedStyle(el).display);
  expect(sweepDisplay).toBe('none');

  await shoot(page, 'group-page-reduced-motion', testInfo);
  release();
});
