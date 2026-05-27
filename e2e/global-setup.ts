import { clerkSetup } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join('e2e', '.auth');

export default async function globalSetup() {
  // clerkSetup sets CLERK_FAPI (the Frontend API URL) which setupClerkTestingToken
  // requires to inject the bypass token into pages. It also mints CLERK_TESTING_TOKEN,
  // but the auth fixture calls refreshTestingToken() per-test to get a fresh token.
  await clerkSetup();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY must be set for E2E tests');

  const clerkClient = createClerkClient({ secretKey });

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const stamp = Date.now();
  const ownerEmail = `e2e-owner-${stamp}@clerk-test.com`;
  const memberEmail = `e2e-member-${stamp}@clerk-test.com`;

  const [ownerUser, memberUser] = await Promise.all([
    clerkClient.users.createUser({
      emailAddress: [ownerEmail],
      password: 'E2eTestPass1!',
      username: `e2e-owner-${stamp}`,
    }),
    clerkClient.users.createUser({
      emailAddress: [memberEmail],
      password: 'E2eTestPass1!',
      username: `e2e-member-${stamp}`,
    }),
  ]);

  fs.writeFileSync(
    path.join(AUTH_DIR, 'users.json'),
    JSON.stringify({
      ownerId: ownerUser.id,
      ownerEmail,
      memberId: memberUser.id,
      memberEmail,
    }),
  );
}
