import { test, expect } from '../fixtures/auth';
import {
  apiCreateGroup,
  apiDeleteGroup,
  apiCreateSession,
  apiJoinGroup,
} from '../helpers/api';

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

let groupId = 0;

test.beforeEach(async ({ ownerRequest: request }) => {
  const group = await apiCreateGroup(request, `PW-Sessions-${Date.now()}`);
  groupId = group.id;
});

test.afterEach(async ({ ownerRequest: request }) => {
  if (groupId) {
    try { await apiDeleteGroup(request, groupId); } catch { /* already gone */ }
    groupId = 0;
  }
});

test('create session via UI → appears in session list', async ({ authedPage: page }) => {
  await page.goto(`/group/${groupId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  await page.getByRole('button', { name: /New Session/ }).click();
  await page.getByRole('button', { name: /^Create$/ }).click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText(/Session #1/i)).toBeVisible();
});

test('status transitions: open → voting → decided → closed', async ({ authedPage: page, ownerRequest: request }) => {
  const session = await apiCreateSession(request, groupId);

  await page.goto(`/group/${groupId}/session/${session.id}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  const transitions: Array<{ advanceTo: string; badge: string }> = [
    { advanceTo: 'voting',  badge: 'VOTING IN PROGRESS' },
    { advanceTo: 'decided', badge: 'WINNER SELECTED' },
    { advanceTo: 'closed',  badge: 'SESSION CLOSED' },
  ];

  for (const { advanceTo, badge } of transitions) {
    await page.getByRole('button', { name: new RegExp(`Advance to ${advanceTo}`, 'i') }).click();
    await page.waitForSelector(LOADING, { state: 'attached' });
    await expect(page.locator('section').getByText(badge)).toBeVisible();
  }
});

test('invalid transition (decided → open) is rejected by the API', async ({ ownerRequest: request }) => {
  const session = await apiCreateSession(request, groupId);

  // Advance to decided
  for (const status of ['voting', 'decided']) {
    const res = await request.patch(`/api/groups/${groupId}/sessions/${session.id}`, {
      data: { status },
    });
    expect(res.ok()).toBeTruthy();
  }

  // Attempt to go backwards
  const res = await request.patch(`/api/groups/${groupId}/sessions/${session.id}`, {
    data: { status: 'open' },
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
});

test('member cannot see New Session button', async ({ memberPage, memberRequest, ownerRequest: request }) => {
  const group = await request.get(`/api/groups/${groupId}`);
  const { invite_code } = await group.json();

  await apiJoinGroup(memberRequest, invite_code);

  await memberPage.goto(`/group/${groupId}`);
  await memberPage.waitForSelector(LOADING, { state: 'attached' });

  await expect(memberPage.getByRole('button', { name: /New Session/ })).not.toBeVisible();
});

test('admin can delete a session', async ({ authedPage: page, ownerRequest: request }) => {
  const session = await apiCreateSession(request, groupId);

  await page.goto(`/group/${groupId}/session/${session.id}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: /Delete Session/ }).click();

  // After deletion, SSE event navigates back to group page
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}$`));
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText(/Session #1/i)).not.toBeVisible();
});
