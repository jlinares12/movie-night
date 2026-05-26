import { request as playwrightRequest } from '@playwright/test';
import { test, expect } from '../fixtures/auth';
import { apiCreateGroup, apiDeleteGroup, apiJoinGroup } from '../helpers/api';

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

let groupId = 0;

test.beforeEach(async ({ request }) => {
  const group = await apiCreateGroup(request, `PW-Security-${Date.now()}`);
  groupId = group.id;
});

test.afterEach(async ({ request }) => {
  if (groupId) {
    try { await apiDeleteGroup(request, groupId); } catch { /* already gone */ }
    groupId = 0;
  }
});

test('user B cannot GET user A private group — API returns 403', async ({ memberPage }) => {
  // Owner created the group; member never joined
  const res = await memberPage.context().request.get(`/api/groups/${groupId}`);
  expect(res.status()).toBe(403);
});

test('non-member group page shows "not a member" error', async ({ memberPage }) => {
  await memberPage.goto(`/group/${groupId}`);
  await memberPage.waitForSelector(LOADING, { state: 'attached' });
  await expect(memberPage.getByText(/not a member/i)).toBeVisible();
});

test('member cannot self-promote to admin via direct API call', async ({ memberPage, request }) => {
  const group = await request.get(`/api/groups/${groupId}`);
  const { invite_code, members } = await group.json();

  // Member joins
  const memberReq = memberPage.context().request;
  await apiJoinGroup(memberReq, invite_code);

  // Get member's own user id
  const meRes = await memberReq.get('/api/auth/me');
  const { id: memberId } = await meRes.json();

  // Attempt self-promotion
  const res = await memberReq.patch(`/api/groups/${groupId}/members/${memberId}`, {
    data: { role: 'admin' },
  });
  expect(res.status()).toBe(403);
});

test('webhook endpoint with missing svix headers returns 401', async ({ request }) => {
  const res = await request.post('/api/webhook/clerk', {
    data: { type: 'user.created', data: {} },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.status()).toBe(401);
});

test('movie search with >200-char query returns 400', async ({ request }) => {
  const longQuery = 'a'.repeat(201);
  const res = await request.get(`/api/movies/search?q=${longQuery}`);
  expect(res.status()).toBe(400);
});

test('session cookie is HttpOnly — invisible to document.cookie', async ({ authedPage: page }) => {
  await page.goto('/');
  await page.waitForSelector(LOADING, { state: 'attached' });

  const cookieString: string = await page.evaluate(() => document.cookie);
  expect(cookieString).not.toMatch(/(^|;\s*)session=/);
});

test('forged session cookie returns 401 from /api/auth/me', async () => {
  const ctx = await playwrightRequest.newContext({
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    extraHTTPHeaders: { Cookie: 'session=forged_invalid_value' },
  });
  try {
    const res = await ctx.get('/api/auth/me');
    expect(res.status()).toBe(401);
  } finally {
    await ctx.dispose();
  }
});
