import { test, expect } from '../fixtures/auth';
import {
  apiCreateGroup,
  apiDeleteGroup,
  apiCreateSession,
  apiCreateProposal,
} from '../helpers/api';
import {
  expectNoHorizontalOverflow,
  expectTappable,
  expectMinTouchTarget,
} from '../helpers/mobile';

/**
 * The mobile shell's regression gate. Runs only under the `mobile-chrome` project
 * (375x667 — see `playwright.config.ts`), because everything asserted here is
 * `lg:hidden` and simply absent at a desktop viewport.
 *
 * Deliberately few, fat tests: each one pays a real Clerk sign-in through the
 * `authedPage` fixture, so test count — not assertion count — is what costs CI time.
 *
 * Steps 4 and 5 of `docs/plans/mobile-friendly.md` extend this file rather than adding
 * new ones.
 */

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

const HAMBURGER = { role: 'button', name: 'Menu' } as const;

let groupId = 0;
let groupName = '';
let sessionId = 0;

/**
 * Wait for a route to have actually rendered before measuring it.
 *
 * The `LOADING` sentinel alone is not enough: `GlobalLoadingBar` mounts with
 * `data-loading="false"` and only flips to `true` once a request is in flight, so
 * `waitForSelector` on it resolves on an empty DOM. Anything measured at that point
 * reports a perfectly clean layout for a page that has not rendered — the exact silent
 * pass this spec exists to prevent.
 *
 * The anchor is awaited as `attached` rather than `visible` on purpose. A broken layout
 * can squeeze content to zero width, which Playwright reports as hidden; waiting for
 * `visible` would then blow the test timeout instead of producing the overflow failure
 * that says what is actually wrong.
 */
async function gotoRendered(
  page: import('@playwright/test').Page,
  route: string,
  anchor: string,
): Promise<void> {
  await page.goto(route);
  await page.getByRole('heading', { name: anchor }).waitFor({ state: 'attached' });
  await page.waitForSelector(LOADING, { state: 'attached' });
}

test.beforeEach(async ({ ownerRequest }) => {
  // Spaces on purpose. `Date.now()` alone is a 13-digit unbreakable run, and this name
  // is rendered at `type-display-lg` (48px/800) by `GroupPage.tsx:129` — it would blow
  // the gutter on its own and mask whatever else the route is doing. See the long-name
  // note in step 4 of `docs/plans/mobile-friendly.md`.
  groupName = `PW Mobile ${Date.now() % 100000}`;
  const group = await apiCreateGroup(ownerRequest, groupName);
  groupId = group.id;
  const session = await apiCreateSession(ownerRequest, groupId);
  sessionId = session.id;
  // A nomination so the session route renders NominationCard's 120px poster row rather
  // than the empty state — that row is the likeliest thing to overflow at 375px. Only
  // the currently-deferred session test reads it; kept here so dropping that `.fixme`
  // in step 4 needs no setup change.
  await apiCreateProposal(ownerRequest, groupId, sessionId, {
    title: 'The Grand Budapest Hotel',
    overview: 'A concierge and his protege become entangled in the theft of a painting.',
  });
});

test.afterEach(async ({ ownerRequest }) => {
  if (groupId) {
    // Cascades to the session and its proposals.
    try { await apiDeleteGroup(ownerRequest, groupId); } catch { /* already gone */ }
    groupId = 0;
    groupName = '';
    sessionId = 0;
  }
});

test('no route scrolls horizontally at 375px', async ({ authedPage: page }) => {
  const routes: Array<[route: string, anchor: string]> = [
    ['/', 'Your Movie Groups'],
    [`/group/${groupId}`, groupName],
    // Both are ComingSoon, whose negative insets cancel MainLayout's gutter and were
    // changed in lockstep with it in step 1. Nothing else guards that pairing.
    ['/discover', 'Find Your Next Feature'],
    ['/profile', 'Your Cinematic Legacy'],
  ];

  for (const [route, anchor] of routes) {
    await gotoRendered(page, route, anchor);
    // Soft, so one bad route still reports every other route instead of hiding them.
    await expectNoHorizontalOverflow(page, route, { soft: true });
  }
});

/*
 * TODO(step-4): `SessionPage.tsx:20` is `GRID = 'grid grid-cols-12 gap-lg'` — twelve
 * tracks at every breakpoint, not just `lg`. At 375px that is 11 gaps x 48px = 528px of
 * gutter inside a 335px content box, so the grid overflows by ~173px before any column
 * gets width. (The plan describes this line as `lg:grid-cols-12`; only the spans on
 * `:21-22` carry the `lg:` prefix.) The fix belongs with step 4's session-loop work:
 * an explicit single-column base, which means dropping the `col-span-12` base off
 * MAIN_COL/SIDE_COL too — `col-span-12` inside a one-column grid conjures eleven
 * implicit tracks and reintroduces the same overflow.
 *
 * Drop the `.fixme` when step 4 lands; the body is already correct.
 */
test.fixme('the session route does not scroll horizontally at 375px', async ({
  authedPage: page,
}) => {
  await gotoRendered(page, `/group/${groupId}/session/${sessionId}`, 'Call Time Session');
  await expectNoHorizontalOverflow(page, 'session');
});

/*
 * The auth routes are the only ones outside `MainLayout`, and the only ones whose content
 * is drawn by a third-party script. Both anchors are Clerk's own headings, deliberately
 * not the app's `<h1>Call Time</h1>`: that renders immediately either way, so anchoring on
 * it would measure a page holding nothing but the wordmark and footer — which fits 375px
 * exactly, and reports a flawless layout for a route that is broken. Any future route whose
 * content arrives from a third-party script needs the same treatment.
 *
 * Uses the plain `page` fixture — these routes are unauthenticated, and a live session
 * makes `<SignIn>` render its already-signed-in state instead of the card. (`beforeEach`
 * still pulls `ownerRequest`, so a sign-in is paid regardless.)
 */
test('the auth routes do not scroll horizontally at 375px', async ({ page }) => {
  const routes: Array<[route: string, anchor: string]> = [
    ['/login', 'Sign in to Call Time'],
    ['/register', 'Create your account'],
  ];

  for (const [route, anchor] of routes) {
    await gotoRendered(page, route, anchor);
    await expectNoHorizontalOverflow(page, route, { soft: true });
  }
});

test('the mobile shell replaces the desktop sidebar', async ({ authedPage: page }) => {
  await gotoRendered(page, '/', 'Your Movie Groups');

  // Assert the mobile chrome is up *first*. `toBeHidden` is satisfied by an element that
  // does not exist, so checking the sidebar before anything has mounted would pass
  // vacuously — waiting on the hamburger pins the DOM down before that check runs.
  const hamburger = page.getByRole(HAMBURGER.role, { name: HAMBURGER.name });
  await expect(hamburger).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

  // `Sidebar.tsx:17` is the only <aside> in src/. Below `lg` it must be gone entirely —
  // if a breakpoint gets flipped you end up with both shells or neither, and no other
  // spec in the suite would notice.
  await expect(page.locator('aside')).toBeHidden();

  await expectMinTouchTarget(hamburger, 'hamburger');
});

test('the menu sheet opens, closes every way, and locks the page behind it', async ({
  authedPage: page,
}) => {
  await gotoRendered(page, '/', 'Your Movie Groups');

  const hamburger = page.getByRole(HAMBURGER.role, { name: HAMBURGER.name });
  const sheet = page.getByRole('dialog', { name: 'Menu' });
  const bodyOverflow = () => page.evaluate(() => document.body.style.overflow);

  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet).toBeHidden();

  // ── Escape closes, and returns focus to the hamburger (MobileTopBar.tsx:24-29) ──
  await hamburger.click();
  await expect(sheet).toBeVisible();
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  expect(await bodyOverflow()).toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(hamburger).toBeFocused();
  expect(await bodyOverflow()).not.toBe('hidden');

  // ── Backdrop click closes ──
  await hamburger.click();
  await expect(sheet).toBeVisible();
  // The backdrop is the sheet's aria-hidden sibling; click near the right edge, well
  // clear of the w-72 panel on the left.
  await page.mouse.click(350, 400);
  await expect(sheet).toBeHidden();

  // ── A sheet link navigates AND the sheet closes itself ──
  // This is the assertion that guards MobileMenu.tsx:30-32: the route-change effect only
  // fires correctly because `onClose` is referentially stable via the `openRef` dance in
  // MobileTopBar. Break that stability and the sheet stays open over the new route.
  await hamburger.click();
  await expect(sheet).toBeVisible();
  await page.getByRole('navigation', { name: 'Secondary' })
    .getByRole('link', { name: 'Settings' })
    .click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect(sheet).toBeHidden();
  await expect(bodyOverflow()).resolves.not.toBe('hidden');
});

test('the bottom bar navigates and never covers the page', async ({ authedPage: page }) => {
  await gotoRendered(page, '/', 'Your Movie Groups');

  const bar = page.getByRole('navigation', { name: 'Primary' });
  const links = bar.getByRole('link');
  await expect(links).toHaveCount(3);

  // These links are icon-only — their accessible name comes solely from `aria-label` in
  // MobileNavBar.tsx, so resolving them by name IS the a11y assertion. Scoping through
  // the landmark keeps them distinct from Sidebar's identically-labelled links.
  for (const label of ['My Groups', 'Discover', 'Profile']) {
    await expectMinTouchTarget(bar.getByRole('link', { name: label }), `bottom bar: ${label}`);
  }

  await expect(bar.getByRole('link', { name: 'My Groups' })).toHaveAttribute('aria-current', 'page');

  await bar.getByRole('link', { name: 'Discover' }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(bar.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
  await expect(bar.getByRole('link', { name: 'My Groups' })).not.toHaveAttribute('aria-current', 'page');

  // ── The floating bar must not eat the last control on the page ──
  // This is what MainLayout's `pb-32` exists for. "Join Group" (JoinGroup.tsx:54) is the
  // last interactive element on Home and is always rendered.
  await gotoRendered(page, '/', 'Your Movie Groups');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expectTappable(page.getByRole('button', { name: 'Join Group' }), 'Join Group button');
});
