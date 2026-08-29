import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth';
import {
  apiCreateGroup,
  apiDeleteGroup,
  apiJoinGroup,
  apiCreateSession,
  apiDeleteSession,
  apiCreateProposal,
  apiSetSessionStatus,
  apiCastVote,
} from '../helpers/api';

/*
 * The member-facing voting experience, end to end. Written before the UI
 * (docs/plans/voting-ui.md), so it is red until #197 lands.
 *
 * Scope is deliberately the happy path plus the secrecy rules, because Playwright
 * is expensive: each spec pays a Clerk sign-in per worker, and the unit suites in
 * src/components/__tests__ already cover the state machine exhaustively. What
 * lives here is what jsdom cannot prove — real pointer events, the real API, and
 * the real cross-user visibility between two signed-in browsers.
 *
 * These run under the `chromium` project only, i.e. a desktop viewport, where the
 * ballot box is the always-expanded sticky sidebar. The mobile collapsed bar is
 * out of scope for this iteration; add a `mobile.voting.spec.ts` when it earns one.
 *
 * DOM contracts shared with src/components/__tests__/VotingPanel.test.tsx — keep
 * the two in step:
 *   data-testid="ballot-box"     the ballot box
 *   data-testid="ballot-commit"  the commit control
 *   data-testid="ballot-voter"   one revealed voter identity
 *   data-testid="vote-count"     one per-movie vote count
 */

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

let groupId = 0;
let sessionId = 0;
let otherSessionId = 0;
let inceptionId = 0;
let arrivalId = 0;

/** Count PUTs to the votes endpoint, so "staging never casts" is provable. */
function countVotePuts(page: Page) {
  const seen = { total: 0 };
  page.on('request', (req) => {
    if (req.method() === 'PUT' && /\/votes$/.test(new URL(req.url()).pathname)) seen.total += 1;
  });
  return seen;
}

const posterFor = (page: Page, title: string) => page.getByRole('radio', { name: new RegExp(title, 'i') });

test.beforeEach(async ({ ownerRequest, memberRequest }) => {
  const group = await apiCreateGroup(ownerRequest, `PW-Voting-${Date.now()}`);
  groupId = group.id;
  await apiJoinGroup(memberRequest, group.invite_code);

  const session = await apiCreateSession(ownerRequest, groupId);
  sessionId = session.id;

  // Nominations only accept writes while the session is `open`, so they go in first.
  const inception = await apiCreateProposal(ownerRequest, groupId, sessionId, { title: 'Inception' });
  const arrival = await apiCreateProposal(memberRequest, groupId, sessionId, { title: 'Arrival' });
  inceptionId = inception.id;
  arrivalId = arrival.id;

  await apiSetSessionStatus(ownerRequest, groupId, sessionId, 'voting');
});

test.afterEach(async ({ ownerRequest }) => {
  for (const id of [otherSessionId, sessionId]) {
    if (!id) continue;
    try {
      await apiDeleteSession(ownerRequest, groupId, id);
    } catch (err) {
      console.warn(`Cleanup: failed to delete session ${id}:`, err);
    }
  }
  otherSessionId = 0;
  sessionId = 0;
  if (groupId) {
    try {
      await apiDeleteGroup(ownerRequest, groupId);
    } catch (err) {
      console.warn(`Cleanup: failed to delete group ${groupId}:`, err);
    }
  }
  groupId = 0;
});

test('member stages a poster, casts the vote, then changes it', async ({ memberPage: page }) => {
  const puts = countVotePuts(page);

  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  // The wall is a radio group, and every nomination is on it — including one with
  // no votes, which the backend keeps in `results` rather than dropping.
  await expect(page.getByRole('radiogroup')).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(2);

  // ── Stage ── tapping a poster must not fire a request
  await posterFor(page, 'Inception').click();
  await expect(posterFor(page, 'Inception')).toBeChecked();
  await expect(page.getByTestId('ballot-box')).toContainText(/Inception/);
  expect(puts.total).toBe(0);

  // ── Commit ── a separate, deliberate act at the box. A mouse click commits
  // outright; only touch pays the 600ms hold.
  const firstCast = page.waitForResponse(
    (res) => res.url().includes(`/sessions/${sessionId}/votes`) && res.request().method() === 'PUT',
  );
  await page.getByTestId('ballot-commit').click();
  expect((await firstCast).status()).toBe(201);
  await expect(page.getByTestId('ballot-box')).toContainText(/Inception/);

  // ── Swap ── staging a second poster shows the replacement, still without casting
  await posterFor(page, 'Arrival').click();
  await expect(posterFor(page, 'Arrival')).toBeChecked();
  await expect(posterFor(page, 'Inception')).not.toBeChecked();
  await expect(page.getByTestId('ballot-box')).toContainText(/Arrival/);
  expect(puts.total).toBe(1);

  // ── Change ── 200, not 201, and still exactly one vote
  const change = page.waitForResponse(
    (res) => res.url().includes(`/sessions/${sessionId}/votes`) && res.request().method() === 'PUT',
  );
  await page.getByTestId('ballot-commit').click();
  expect((await change).status()).toBe(200);
  await expect(page.getByTestId('ballot-box')).toContainText(/Arrival/);
});

test('per-movie counts and voter identities stay hidden during voting — for the owner too', async ({
  authedPage: page,
  memberRequest,
}) => {
  // Arrange — someone else has already voted, so there is something to leak
  const cast = await apiCastVote(memberRequest, groupId, sessionId, inceptionId);
  expect(cast.status()).toBe(201);

  // Act — viewed by the group owner, the most privileged role there is
  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByRole('radiogroup')).toBeVisible();

  // Assert — role does not unlock identities and there is no flag that does.
  // The tally response really does carry vote_count during `voting`; not
  // rendering it is the mitigation.
  await expect(page.getByTestId('vote-count')).toHaveCount(0);
  await expect(page.getByTestId('ballot-voter')).toHaveCount(0);

  // Participation is the one thing that is published: a count, never a name.
  await expect(page.getByTestId('ballot-box')).toContainText(/1 of 2/);
});

test('counts and voters are revealed once the session is decided', async ({
  memberPage: page,
  memberRequest,
  ownerRequest,
}) => {
  // Arrange
  await apiCastVote(memberRequest, groupId, sessionId, inceptionId);
  await apiSetSessionStatus(ownerRequest, groupId, sessionId, 'decided');

  // Act
  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  // Assert — the reveal is a genuine event precisely because nothing published
  // these numbers early
  await expect(page.getByTestId('vote-count').first()).toBeVisible();
  await expect(page.getByTestId('ballot-voter').first()).toBeVisible();
  // The box keeps the member's own slip as a read-only receipt, with no way to recast
  await expect(page.getByTestId('ballot-box')).toContainText(/Inception/);
  await expect(page.getByTestId('ballot-commit')).toHaveCount(0);
});

test('the votes endpoint rejects unauthenticated, cross-session and out-of-phase casts', async ({
  request,
  memberRequest,
  ownerRequest,
}) => {
  // Unauthenticated — no session cookie at all
  const anonymous = await request.put(`/api/groups/${groupId}/sessions/${sessionId}/votes`, {
    data: { proposal_id: inceptionId },
  });
  expect(anonymous.status()).toBe(401);

  // A proposal belonging to a different session — 404 rather than 400, so the
  // response cannot confirm that some other session's proposal id is real
  const other = await apiCreateSession(ownerRequest, groupId);
  otherSessionId = other.id;
  const foreign = await apiCreateProposal(ownerRequest, groupId, otherSessionId, { title: 'Parasite' });
  const crossSession = await apiCastVote(memberRequest, groupId, sessionId, foreign.id);
  expect(crossSession.status()).toBe(404);

  // Frozen the moment the session leaves `voting`
  await apiSetSessionStatus(ownerRequest, groupId, sessionId, 'decided');
  const late = await apiCastVote(memberRequest, groupId, sessionId, arrivalId);
  expect(late.status()).toBe(409);
});
