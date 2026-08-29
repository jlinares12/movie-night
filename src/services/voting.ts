import api from '../utils/api';
import type { MyVote, Vote, VoteTally } from '../types/voting';

// 201 on a first cast, 200 on a change or an idempotent re-PUT of the same id.
export const castVote = (groupId: number, sessionId: number, proposal_id: number) =>
  api.put<Vote>(`/api/groups/${groupId}/sessions/${sessionId}/votes`, { proposal_id });

export const getMyVote = (groupId: number, sessionId: number) =>
  api.get<MyVote>(`/api/groups/${groupId}/sessions/${sessionId}/votes/me`);

export const getTally = (groupId: number, sessionId: number) =>
  api.get<VoteTally>(`/api/groups/${groupId}/sessions/${sessionId}/votes/tally`);

// There is deliberately no deleteVote — votes are mutable but never removable,
// and no DELETE route exists to back one.
