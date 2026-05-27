import { test, expect } from '../fixtures/auth';
import { apiDeleteGroup } from '../helpers/api';

const LOADING_SETTLED = '[data-testid="global-loading"][data-loading="false"]';
const LOADING_ACTIVE  = '[data-testid="global-loading"][data-loading="true"]';

test('route navigation: loading bar activates then settles', async ({ authedPage: page }) => {
  await page.goto('/profile');
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  // Hold the groups fetch so React has a guaranteed window to flush
  // data-loading="true". Without this, React 18 batches setLoading(true) +
  // setLoading(false) into one render and the "true" state is never painted.
  let release!: () => void;
  // { times: 1 } — auto-deregisters after the first match so subsequent
  // requests to /api/groups pass through and don't get stuck holding "true".
  await page.route('**/api/groups', async (route) => {
    await new Promise<void>((r) => { release = r; });
    await route.continue();
  }, { times: 1 });

  // SPA navigation — triggers the paused groups fetch
  await page.getByRole('link', { name: /My Groups/i }).click();

  // With the fetch held open, the loading bar must become active
  await expect(page.locator('[data-testid="global-loading"]'))
    .toHaveAttribute('data-loading', 'true', { timeout: 5_000 });

  // Release the fetch — route auto-deregisters, all further requests pass through
  release();

  await expect(page.locator('[data-testid="global-loading"]'))
    .toHaveAttribute('data-loading', 'false');
});

test('API action (create group) activates loading bar, then settles', async ({ authedPage: page }) => {
  await page.goto('/');
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  // Delay the POST so React has time to flush data-loading="true" before the
  // response arrives. Without this, React 18 batches setLoading(true) +
  // setLoading(false) into one render and the DOM never shows "true".
  await page.route('**/api/groups', async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    await route.continue();
  });

  const name = `Loading-Test-${Date.now()}`;
  await page.getByPlaceholder(/Group Name/).fill(name);

  // waitForSelector registered before the click so the observer is in place
  // when the request interceptor fires setLoading(true).
  const activatedPromise = page.waitForSelector(LOADING_ACTIVE, { state: 'attached', timeout: 5_000 });
  await page.getByRole('button', { name: /Create Group/ }).click();

  await activatedPromise;
  await page.waitForSelector(LOADING_SETTLED, { state: 'attached' });

  await page.unroute('**/api/groups');

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
