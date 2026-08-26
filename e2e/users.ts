import path from 'node:path';

/** One owner/member Clerk user pair, provisioned per worker by global setup. */
export type WorkerUsers = {
  ownerId: string;
  ownerEmail: string;
  memberId: string;
  memberEmail: string;
};

/** Written by global setup as a WorkerUsers[] indexed by parallelIndex. */
export const USERS_FILE = path.join('e2e', '.auth', 'users.json');
export const AUTH_DIR = path.dirname(USERS_FILE);
