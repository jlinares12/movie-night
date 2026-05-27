import { createClerkClient } from '@clerk/backend';
import fs from 'node:fs';
import path from 'node:path';

export default async function globalTeardown() {
  const usersFile = path.join('e2e', '.auth', 'users.json');
  if (!fs.existsSync(usersFile)) return;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return;

  const { ownerId, memberId } = JSON.parse(fs.readFileSync(usersFile, 'utf-8')) as {
    ownerId: string;
    memberId: string;
  };

  const clerk = createClerkClient({ secretKey });

  await Promise.allSettled([
    clerk.users.deleteUser(ownerId),
    clerk.users.deleteUser(memberId),
  ]);

  fs.unlinkSync(usersFile);
}
