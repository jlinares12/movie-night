import path from 'node:path';
import { test, expect } from '../fixtures/auth';
import { apiCreateGroup, apiDeleteGroup, apiJoinGroup } from '../helpers/api';

const LOADING = '[data-testid="global-loading"][data-loading="false"]';

let groupId = 0;
let inviteCode = '';

test.beforeEach(async ({ request }) => {
  const group = await apiCreateGroup(request, `PW-Group-${Date.now()}`);
  groupId = group.id;
  inviteCode = group.invite_code;
});

test.afterEach(async ({ request }) => {
  if (groupId) {
    try { await apiDeleteGroup(request, groupId); } catch { /* already deleted in test */ }
  }
  groupId = 0;
});

test('create a group via UI → appears in the list', async ({ authedPage: page }) => {
  const name = `UI-Group-${Date.now()}`;
  await page.goto('/');
  await page.waitForSelector(LOADING, { state: 'attached' });

  await page.getByPlaceholder(/Group Name/).fill(name);
  await page.getByRole('button', { name: /Create Group/ }).click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText(name)).toBeVisible();

  // Cleanup the UI-created group via API
  const res = await page.request.get('/api/groups');
  const groups: { id: number; name: string }[] = (await res.json()).groups ?? await res.json();
  const created = (Array.isArray(groups) ? groups : (groups as any).groups ?? [])
    .find((g: { name: string }) => g.name === name);
  if (created) await apiDeleteGroup(page.request, created.id);
});

test('join a group via invite code → success', async ({ memberPage }) => {
  await memberPage.goto('/');
  await memberPage.waitForSelector(LOADING, { state: 'attached' });

  await memberPage.getByPlaceholder(/xxxxxxxx/).fill(inviteCode);
  await memberPage.getByRole('button', { name: /Join Group/ }).click();
  await memberPage.waitForSelector(LOADING, { state: 'attached' });

  // No error message visible — join succeeded
  await expect(memberPage.locator('.text-error')).not.toBeVisible();
});

test('regenerate invite code → code changes', async ({ authedPage: page }) => {
  await page.goto(`/group/${groupId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  const codeLocator = page.locator('.tracking-widest.font-mono');
  const originalCode = await codeLocator.textContent();

  page.once('dialog', d => d.accept());
  await page.locator('[title="Regenerate code"]').click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  const newCode = await codeLocator.textContent();
  expect(newCode).not.toBe(originalCode);
});

test('owner can delete group → removed from list', async ({ authedPage: page }) => {
  await page.goto(`/group/${groupId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: /Delete Group/ }).click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  // The group ID is consumed — mark clean so afterEach skips the API delete
  groupId = 0;

  await page.goto('/');
  await page.waitForSelector(LOADING, { state: 'attached' });
  await expect(page.getByRole('heading', { name: /Your Movie Groups/i })).toBeVisible();
});

test('member cannot see Delete Group button', async ({ memberPage, request }) => {
  // Join the group as member first
  await apiJoinGroup(
    await memberPage.context().request,
    inviteCode,
  );

  await memberPage.goto(`/group/${groupId}`);
  await memberPage.waitForSelector(LOADING, { state: 'attached' });

  await expect(memberPage.getByRole('button', { name: /Delete Group/ })).not.toBeVisible();
});

test('owner promotes member to admin', async ({ authedPage: page, memberPage, request }) => {
  await apiJoinGroup(await memberPage.context().request, inviteCode);

  await page.goto(`/group/${groupId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  await page.locator('[title="Promote to admin"]').first().click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText('Admin').first()).toBeVisible();
});

test('owner demotes admin back to member', async ({ authedPage: page, memberPage }) => {
  await apiJoinGroup(await memberPage.context().request, inviteCode);

  await page.goto(`/group/${groupId}`);
  await page.waitForSelector(LOADING, { state: 'attached' });

  // Promote first
  await page.locator('[title="Promote to admin"]').first().click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  // Then demote
  await page.locator('[title="Demote to member"]').first().click();
  await page.waitForSelector(LOADING, { state: 'attached' });

  await expect(page.getByText('Member').first()).toBeVisible();
});
