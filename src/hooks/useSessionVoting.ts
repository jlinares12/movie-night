import { useCallback, useEffect, useState } from 'react';
import { castVote as castVoteRequest, getMyVote, getTally } from '../services/voting';
import { ApiError } from '../services/apiError';
import type { MyVote, VoteTally } from '../types/voting';

export function useSessionVoting(groupId: number, sessionId: number) {
  const [myVote, setMyVote] = useState<MyVote | null>(null);
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [castingId, setCastingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Empty deps, so consumers can put refetch in their own dependency arrays
  // without retriggering it.
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    // Without this guard, switching sessions mid-flight lands a stale tally
    // over the new one — and a wrong count renders with nothing marking it wrong.
    let cancelled = false;
    setLoading(true);
    Promise.all([getMyVote(groupId, sessionId), getTally(groupId, sessionId)])
      .then(([voteRes, tallyRes]) => {
        if (cancelled) return;
        setMyVote(voteRes.data);
        setTally(tallyRes.data);
        // Cleared on success so one failure doesn't poison the hook for the
        // rest of its lifetime.
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load voting data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [groupId, sessionId, reloadKey]);

  const castVote = useCallback(async (proposalId: number) => {
    setCastingId(proposalId);
    setError('');
    try {
      const res = await castVoteRequest(groupId, sessionId, proposalId);
      setMyVote(res.data);
      // Counts just moved. Only the tally is re-read, so `loading` stays false
      // and the panel doesn't flash — consumers key in-flight state off castingId.
      const tallyRes = await getTally(groupId, sessionId);
      setTally(tallyRes.data);
    } catch (err) {
      // The ApiError message is the backend's own wording ("voting is closed",
      // "proposal not found") and reaches the user unchanged.
      setError(err instanceof ApiError ? err.message : 'Could not cast vote.');
    } finally {
      setCastingId(null);
    }
  }, [groupId, sessionId]);

  return { myVote, tally, loading, error, castingId, castVote, refetch };
}
