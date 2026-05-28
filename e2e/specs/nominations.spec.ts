import { test, expect } from '../fixtures/auth';
import {
  apiCreateGroup,
  apiDeleteGroup,
  apiJoinGroup,
  apiCreateSession,
  apiDeleteSession,
  apiCreateProposal,
  apiDeleteProposal,
} from '../helpers/api';

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

let groupId = 0;
let sessionId = 0;
let proposalId = 0;

test.beforeEach(async ({ ownerRequest, memberRequest }) => {
  const group = await apiCreateGroup(ownerRequest, `Nominations Test ${Date.now()}`);
  groupId = group.id;
  await apiJoinGroup(memberRequest, group.invite_code);
  const session = await apiCreateSession(ownerRequest, groupId);
  sessionId = session.id;
});

test.afterEach(async ({ ownerRequest }) => {
  if (proposalId) { try { await apiDeleteProposal(ownerRequest, groupId, sessionId, proposalId); } catch {} }
  proposalId = 0;
  if (sessionId) { try { await apiDeleteSession(ownerRequest, groupId, sessionId); } catch {} }
  sessionId = 0;
  if (groupId) { try { await apiDeleteGroup(ownerRequest, groupId); } catch {} }
  groupId = 0;
});

test('shows empty nominations state for open session', async ({ authedPage: page }) => {
  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByText('No nominations yet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Nomination' })).toBeVisible();
});

test('nomination card appears after member creates a proposal', async ({ authedPage: page, memberRequest }) => {
  const proposal = await apiCreateProposal(memberRequest, groupId, sessionId, { title: 'Inception' });
  proposalId = proposal.id;

  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByText('Inception')).toBeVisible();
});

test('member can search and nominate a movie', async ({ memberPage: page }) => {
  await page.route('**/api/movies/search**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        tmdb_id: 27205,
        title: 'Inception',
        poster_url: null,
        overview: 'A thief who steals corporate secrets through dream-sharing technology.',
        release_date: '2010-07-16',
        vote_average: 8.4,
        runtime_minutes: 148,
      }]),
    }),
  );

  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  await page.getByRole('button', { name: 'Add Nomination' }).click();
  await page.getByPlaceholder('Search for a movie…').fill('Inception');
  await expect(page.getByText('Inception')).toBeVisible();
  await page.getByRole('button', { name: 'Nominate' }).click();

  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByText('Inception')).toBeVisible();
  await expect(page.getByPlaceholder('Search for a movie…')).not.toBeVisible();
});

test('member can delete their own nomination', async ({ memberPage: page, memberRequest }) => {
  const proposal = await apiCreateProposal(memberRequest, groupId, sessionId, { title: 'The Matrix' });
  proposalId = proposal.id;

  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText('The Matrix')).toBeVisible();
  await page.getByRole('button', { name: 'Remove nomination' }).click();
  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByText('The Matrix')).not.toBeVisible();
  proposalId = 0;
});

test('owner can delete a member nomination', async ({ authedPage: page, memberRequest }) => {
  const proposal = await apiCreateProposal(memberRequest, groupId, sessionId, { title: 'Parasite' });
  proposalId = proposal.id;

  await page.goto(`/group/${groupId}/session/${sessionId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText('Parasite')).toBeVisible();
  await page.getByRole('button', { name: 'Remove nomination' }).click();
  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByText('Parasite')).not.toBeVisible();
  proposalId = 0;
});
