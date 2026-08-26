import { clerkSetup } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';
import type { FullConfig } from '@playwright/test';
import fs from 'node:fs';
import { AUTH_DIR, USERS_FILE, type WorkerUsers } from './users';

export default async function globalSetup(config: FullConfig) {
  // clerkSetup sets CLERK_FAPI (the Frontend API URL) which setupClerkTestingToken
  // requires to inject the bypass token into pages. It also mints CLERK_TESTING_TOKEN,
  // but the auth fixture calls refreshTestingToken() per-worker to get a fresh token.
  await clerkSetup();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY must be set for E2E tests');

  const clerkClient = createClerkClient({ secretKey });

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  // One owner/member pair per worker. A single shared pair meant every worker
  // authenticated as the same two Clerk users, and therefore shared the same
  // two Flask User rows: one worker's beforeEach group showed up in another
  // worker's GET /api/groups assertions, and its afterEach delete could pull a
  // group out from under a test still using it. Per-worker users give each
  // worker its own data island, which worker-scoped sessions alone do not fix.
  const stamp = Date.now();
  const pairs = await Promise.all(
    Array.from({ length: config.workers }, async (_, worker) => {
      const ownerEmail = `e2e-owner-${stamp}-w${worker}@clerk-test.com`;
      const memberEmail = `e2e-member-${stamp}-w${worker}@clerk-test.com`;

      const [ownerUser, memberUser] = await Promise.all([
        clerkClient.users.createUser({
          emailAddress: [ownerEmail],
          password: 'E2eTestPass1!',
          username: `e2e-owner-${stamp}-w${worker}`,
        }),
        clerkClient.users.createUser({
          emailAddress: [memberEmail],
          password: 'E2eTestPass1!',
          username: `e2e-member-${stamp}-w${worker}`,
        }),
      ]);

      return {
        ownerId: ownerUser.id,
        ownerEmail,
        memberId: memberUser.id,
        memberEmail,
      } satisfies WorkerUsers;
    }),
  );

  // Indexed by workerIndex; the fixture reads its own entry.
  fs.writeFileSync(USERS_FILE, JSON.stringify(pairs));
}
