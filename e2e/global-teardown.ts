import { createClerkClient } from '@clerk/backend';
import fs from 'node:fs';
import { USERS_FILE, type WorkerUsers } from './users';

export default async function globalTeardown() {
  if (!fs.existsSync(USERS_FILE)) return;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return;

  const pairs = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as WorkerUsers[];

  const clerk = createClerkClient({ secretKey });

  await Promise.allSettled(
    pairs.flatMap(({ ownerId, memberId }) => [
      clerk.users.deleteUser(ownerId),
      clerk.users.deleteUser(memberId),
    ]),
  );

  fs.unlinkSync(USERS_FILE);
}
