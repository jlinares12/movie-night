import api from '../utils/api';
import type { GroupSummary, GroupDetail, Session } from '../types/groups';

export const listGroups = () =>
  api.get<GroupSummary[]>('/api/groups');

export const getGroup = (id: number) =>
  api.get<GroupDetail>(`/api/groups/${id}`);

export const createGroup = (name: string, description?: string) =>
  api.post<GroupDetail>('/api/groups', { name, description });

export const updateGroup = (id: number, patch: { name?: string; description?: string }) =>
  api.patch<GroupDetail>(`/api/groups/${id}`, patch);

export const deleteGroup = (id: number) =>
  api.delete(`/api/groups/${id}`);

export const joinGroup = (invite_code: string) =>
  api.post('/api/groups/join', { invite_code });

export const regenerateInvite = (id: number) =>
  api.post<GroupDetail>(`/api/groups/${id}/invite/regenerate`);

export const updateMemberRole = (groupId: number, userId: number, role: 'admin' | 'member') =>
  api.patch(`/api/groups/${groupId}/members/${userId}`, { role });

export const removeMember = (groupId: number, userId: number) =>
  api.delete(`/api/groups/${groupId}/members/${userId}`);

export const listSessions = (groupId: number) =>
  api.get<Session[]>(`/api/groups/${groupId}/sessions`);

export const getSession = (groupId: number, sessionId: number) =>
  api.get<Session>(`/api/groups/${groupId}/sessions/${sessionId}`);

export const createSession = (groupId: number, scheduled_for?: string) =>
  api.post<Session>(`/api/groups/${groupId}/sessions`, { scheduled_for });

export const updateSession = (
  groupId: number,
  sessionId: number,
  patch: { status?: string; scheduled_for?: string },
) => api.patch<Session>(`/api/groups/${groupId}/sessions/${sessionId}`, patch);

export const deleteSession = (groupId: number, sessionId: number) =>
  api.delete(`/api/groups/${groupId}/sessions/${sessionId}`);
