import { test, expect } from '../fixtures/auth';
import { apiDeleteGroup } from '../helpers/api';

const LOADING_SETTLED = '[data-testid="global-loading"][data-loading="false"]';
const LOADING_ACTIVE  = '[data-testid="global-loading"][data-loading="true"]';

test('route navigation: loading bar activates then settles', async ({ authedPage: page }) => {
  // Intercept the loading bar before navigation starts
  const activatedPromise = page.waitForSelector(LOADING_ACTIVE, { state: 'attached', timeout: 5_000 });
  await page.goto('/');
  await activatedPromise;
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  const attr = await page
    .locator('[data-testid="global-loading"]')
    .getAttribute('data-loading');
  expect(attr).toBe('false');
});

test('API action (create group) activates loading bar, then settles', async ({ authedPage: page }) => {
  await page.goto('/');
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  const name = `Loading-Test-${Date.now()}`;
  await page.getByPlaceholder(/Group Name/).fill(name);

  // Start watching for active state before the click
  const activatedPromise = page.waitForSelector(LOADING_ACTIVE, { state: 'attached', timeout: 5_000 });
  await page.getByRole('button', { name: /Create Group/ }).click();

  await activatedPromise;
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  // Cleanup
  const res = await page.request.get('/api/groups');
  const body = await res.json();
  const groups: { id: number; name: string }[] = body.groups ?? body ?? [];
  const created = groups.find((g) => g.name === name);
  if (created) await apiDeleteGroup(page.request, created.id);
});

test('loading bar stays active until all concurrent requests settle', async ({ authedPage: page, request }) => {
  await page.goto('/');
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  // Fire two concurrent API writes from the page context (triggers the Axios interceptors)
  const results = await page.evaluate(async () => {
    const [a, b] = await Promise.all([
      fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Concurrent-A-${Date.now()}` }),
        credentials: 'include',
      }),
      fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Concurrent-B-${Date.now()}` }),
        credentials: 'include',
      }),
    ]);
    return [a.status, b.status];
  });

  // Both requests must complete
  expect(results[0]).toBe(201);
  expect(results[1]).toBe(201);

  // Loading must have settled
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });
  const attr = await page
    .locator('[data-testid="global-loading"]')
    .getAttribute('data-loading');
  expect(attr).toBe('false');

  // Cleanup concurrent groups
  const res = await request.get('/api/groups');
  const body = await res.json();
  const groups: { id: number; name: string }[] = body.groups ?? body ?? [];
  await Promise.all(
    groups
      .filter((g) => g.name.startsWith('Concurrent-'))
      .map((g) => apiDeleteGroup(request, g.id)),
  );
});

test('final state invariant: data-loading is always false after page load', async ({ authedPage: page }) => {
  for (const route of ['/', '/profile']) {
    await page.goto(route);
    await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });
    const attr = await page
      .locator('[data-testid="global-loading"]')
      .getAttribute('data-loading');
    expect(attr).toBe('false');
  }
});
