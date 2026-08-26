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
 * Step 5 of `docs/plans/mobile-friendly.md` extends this file rather than adding new ones.
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
  // Unbroken on purpose, which inverts this name's original rationale. It used to carry
  // spaces so a 13-digit `Date.now()` could not blow the gutter and mask the rest of the
  // route — but now that `GroupPage.tsx`'s heading is `[overflow-wrap:anywhere]`, a spaced
  // name proves nothing: it wraps at its spaces either way. The unbroken run is what
  // actually exercises the fix.
  groupName = `PWMobile${Date.now()}`;
  const group = await apiCreateGroup(ownerRequest, groupName);
  groupId = group.id;
  const session = await apiCreateSession(ownerRequest, groupId);
  sessionId = session.id;
  // A nomination so the session route renders NominationCard's poster row rather than the
  // empty state — that row is the likeliest thing to overflow at 375px, and an empty
  // nominations column cannot overflow at all. Note this spends the owner's single
  // allowed proposal (`api/app/routes/proposals.py:46-51`), which is why the nominating
  // test below has to remove before it can add.
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
  // Four authenticated page loads plus four whole-DOM measurements lands near the 30s
  // default and has blown it once on a cold Vite container. Scoped to this test rather
  // than the file — at file scope `test.slow()` would slow every test here.
  test.slow();

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
 * The route step 4 exists for. `SessionPage`'s grid used to be twelve tracks at every
 * breakpoint — 11 gaps x 48px = 528px of gutter inside a 335px content box — so it
 * overflowed before either column got any width. `beforeEach` puts a real nomination on
 * screen, so the poster row is measured too rather than an empty column.
 */
test('the session route does not scroll horizontally at 375px', async ({
  authedPage: page,
}) => {
  await gotoRendered(page, `/group/${groupId}/session/${sessionId}`, 'Call Time Session');
  await expectNoHorizontalOverflow(page, 'session');
});

/*
 * The core loop, end to end at 375px: remove -> search -> nominate -> advance.
 *
 * Fat on purpose — each test here pays a real Clerk sign-in, so assertions are cheap and
 * test count is not. It removes before it adds because `beforeEach` already spent this
 * user's one allowed proposal (`api/app/routes/proposals.py:46-51`).
 *
 * The overflow re-measure at the end is the point of the whole test: it happens with a
 * poster-bearing card on screen, because an empty nominations column cannot overflow and
 * measuring before one exists would be the same silent pass `gotoRendered` guards against.
 */
test('nominating works at 375px', async ({ authedPage: page }) => {
  // An inline pixel, not a TMDB CDN URL. What is measured is the poster's *box* — a
  // remote image only adds flake.
  const POSTER =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  await page.route('**/api/movies/search**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        tmdb_id: 27205,
        title: 'Inception',
        poster_url: POSTER,
        overview: 'A thief who steals corporate secrets through dream-sharing technology.',
        release_date: '2010-07-16',
        vote_average: 8.4,
        runtime_minutes: 148,
      }]),
    }),
  );

  await gotoRendered(page, `/group/${groupId}/session/${sessionId}`, 'Call Time Session');

  // ── Remove: 28x28 before step 4, and the only way to free this user's proposal slot ──
  const remove = page.getByRole('button', { name: 'Remove nomination' });
  await expectMinTouchTarget(remove, 'Remove nomination');
  await remove.click();
  await expect(page.getByText('The Grand Budapest Hotel')).toBeHidden();

  // ── Search and nominate ──
  await page.getByRole('button', { name: 'Add Nomination' }).click();
  await page.getByPlaceholder('Search for a movie…').fill('Inception');

  const nominate = page.getByRole('button', { name: 'Nominate' });
  await expect(nominate).toBeVisible();
  // ~25px tall before step 4, and the single most important target in the loop.
  await expectMinTouchTarget(nominate, 'Nominate');
  await expectTappable(nominate, 'Nominate button');
  await nominate.click();

  await expect(page.getByPlaceholder('Search for a movie…')).toBeHidden();
  await expect(page.getByRole('img', { name: 'Inception' })).toBeVisible();

  // ── The measurement this test exists for — taken with a poster on screen ──
  await expectNoHorizontalOverflow(page, 'session with a nomination');

  // ── Advance to voting ──
  // This is the ceiling: there is no ballot UI. `api/app/models/vote.py` exists, but
  // `api/app/routes/` has no `votes.py`, and `SessionPage.tsx` renders a static panel for
  // the `voting` status. Measuring that panel is the honest end of this ticket's loop.
  await page.getByRole('button', { name: /Advance to voting/i }).click();
  // The panel's own body copy, not its "Voting in Progress" heading — the hero badge
  // reads VOTING IN PROGRESS too, and would make that locator ambiguous.
  await expect(page.getByText('Members are casting their votes.')).toBeVisible();
  await expectNoHorizontalOverflow(page, 'session in voting');
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
