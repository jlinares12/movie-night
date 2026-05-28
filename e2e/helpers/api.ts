import type { APIRequestContext } from '@playwright/test';

export interface Group {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
}

export interface Session {
  id: number;
  group_id: number;
  status: string;
  scheduled_for: string | null;
}

export async function apiCreateGroup(
  request: APIRequestContext,
  name: string,
  description?: string,
): Promise<Group> {
  const res = await request.post('/api/groups', { data: { name, description } });
  if (!res.ok()) throw new Error(`createGroup ${res.status()}: ${await res.text()}`);
  return res.json();
}

export async function apiGetGroup(
  request: APIRequestContext,
  groupId: number,
): Promise<Group> {
  const res = await request.get(`/api/groups/${groupId}`);
  if (!res.ok()) throw new Error(`getGroup ${res.status()}`);
  return res.json();
}

export async function apiDeleteGroup(
  request: APIRequestContext,
  groupId: number,
): Promise<void> {
  await request.delete(`/api/groups/${groupId}`);
}

export async function apiJoinGroup(
  request: APIRequestContext,
  inviteCode: string,
): Promise<Group> {
  const res = await request.post('/api/groups/join', {
    data: { invite_code: inviteCode },
  });
  if (!res.ok()) throw new Error(`joinGroup ${res.status()}: ${await res.text()}`);
  return res.json();
}

export async function apiCreateSession(
  request: APIRequestContext,
  groupId: number,
): Promise<Session> {
  const res = await request.post(`/api/groups/${groupId}/sessions`, { data: {} });
  if (!res.ok()) throw new Error(`createSession ${res.status()}: ${await res.text()}`);
  return res.json();
}

export async function apiDeleteSession(
  request: APIRequestContext,
  groupId: number,
  sessionId: number,
): Promise<void> {
  await request.delete(`/api/groups/${groupId}/sessions/${sessionId}`);
}

export interface Proposal {
  id: number;
  session_id: number;
  proposed_by_id: number;
  proposed_by_username: string | null;
  title: string;
  tmdb_id: number | null;
  poster_url: string | null;
  overview: string | null;
  runtime_minutes: number | null;
  proposed_at: string;
}

export async function apiCreateProposal(
  request: APIRequestContext,
  groupId: number,
  sessionId: number,
  body: { title: string; tmdb_id?: number; poster_url?: string; overview?: string; runtime_minutes?: number },
): Promise<Proposal> {
  const res = await request.post(
    `/api/groups/${groupId}/sessions/${sessionId}/proposals`,
    { data: body },
  );
  if (!res.ok()) throw new Error(`createProposal ${res.status()}: ${await res.text()}`);
  return res.json();
}

export async function apiDeleteProposal(
  request: APIRequestContext,
  groupId: number,
  sessionId: number,
  proposalId: number,
): Promise<void> {
  await request.delete(
    `/api/groups/${groupId}/sessions/${sessionId}/proposals/${proposalId}`,
  );
}
