import { act, renderHook, waitFor } from '@testing-library/react';
import { useSessionVoting } from '../useSessionVoting';
import { castVote, getMyVote, getTally } from '../../services/voting';
import { ApiError } from '../../services/apiError';
import type { MyVote, Vote, VoteTally } from '../../types/voting';

jest.mock('../../services/voting');
// The service export and the hook's returned function are both named castVote —
// the mock is aliased, the hook's is reached through result.current.
const mockCastVote = jest.mocked(castVote);
const mockGetMyVote = jest.mocked(getMyVote);
const mockGetTally = jest.mocked(getTally);

const makeVote = (overrides: Partial<Vote> = {}): Vote => ({
  id: 7,
  proposal_id: 12,
  user_id: 4,
  session_id: 10,
  voted_at: '2026-08-26T18:04:11+00:00',
  ...overrides,
});

const makeMyVote = (overrides: Partial<MyVote> = {}): MyVote => ({
  ...makeVote(),
  ...overrides,
});

const makeTally = (overrides: Partial<VoteTally> = {}): VoteTally => ({
  session_status: 'voting',
  total_votes: 3,
  eligible_voters: 5,
  identities_revealed: false,
  results: [
    { proposal_id: 12, title: 'Inception', poster_url: '/poster.jpg', vote_count: 2, voters: null },
  ],
  ...overrides,
});

const myVoteRes = (data: MyVote) => ({ data }) as unknown as Awaited<ReturnType<typeof getMyVote>>;
const tallyRes = (data: VoteTally) => ({ data }) as unknown as Awaited<ReturnType<typeof getTally>>;
const voteRes = (data: Vote) => ({ data }) as unknown as Awaited<ReturnType<typeof castVote>>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const renderVoting = (groupId = 1, sessionId = 10) =>
  renderHook(
    ({ groupId, sessionId }) => useSessionVoting(groupId, sessionId),
    { initialProps: { groupId, sessionId } },
  );

describe('useSessionVoting', () => {
  beforeEach(() => {
    // Automocked members return undefined; every test needs both endpoints
    // resolving or the mount would fail on unrelated grounds.
    mockGetMyVote.mockResolvedValue(myVoteRes(makeMyVote()));
    mockGetTally.mockResolvedValue(tallyRes(makeTally()));
    mockCastVote.mockResolvedValue(voteRes(makeVote()));
  });

  afterEach(() => jest.clearAllMocks());

  test('useSessionVoting_onMount_callsBothEndpointsWithGroupAndSessionIds', async () => {
    // Arrange
    const pending = deferred<Awaited<ReturnType<typeof getMyVote>>>();
    mockGetMyVote.mockReturnValue(pending.promise);

    // Act
    const { result } = renderVoting(1, 10);

    // Assert
    expect(mockGetMyVote).toHaveBeenCalledTimes(1);
    expect(mockGetMyVote).toHaveBeenCalledWith(1, 10);
    expect(mockGetTally).toHaveBeenCalledTimes(1);
    expect(mockGetTally).toHaveBeenCalledWith(1, 10);
    expect(result.current.loading).toBe(true);

    await act(async () => { pending.resolve(myVoteRes(makeMyVote())); });
    expect(result.current.loading).toBe(false);
  });

  test('useSessionVoting_onSuccessfulLoad_populatesMyVoteAndTallyFromResponseData', async () => {
    // Arrange
    const myVote = makeMyVote({ proposal_id: 12 });
    const tally = makeTally({ total_votes: 3 });
    mockGetMyVote.mockResolvedValue(myVoteRes(myVote));
    mockGetTally.mockResolvedValue(tallyRes(tally));

    // Act
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(result.current.myVote).toEqual(myVote);
    expect(result.current.tally).toEqual(tally);
    expect(result.current.error).toBe('');
  });

  test('useSessionVoting_whenCallerHasNotVoted_exposesNullProposalIdWithNoError', async () => {
    // Arrange
    // /votes/me is never a 404 — the not-yet-voted state arrives as a 200 with
    // nulls, and must not surface to the user as a failure.
    const placeholder = makeMyVote({ id: null, proposal_id: null, voted_at: null });
    mockGetMyVote.mockResolvedValue(myVoteRes(placeholder));

    // Act
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(result.current.myVote?.proposal_id).toBeNull();
    expect(result.current.myVote?.user_id).toBe(4);
    expect(result.current.error).toBe('');
  });

  test('useSessionVoting_onFailedLoad_setsApiErrorMessageAndLeavesTallyNull', async () => {
    // Arrange
    mockGetTally.mockRejectedValue(new ApiError(403, 'forbidden'));

    // Act
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(result.current.error).toBe('forbidden');
    expect(result.current.tally).toBeNull();
  });

  test('useSessionVoting_onNonApiErrorLoadFailure_setsGenericMessage', async () => {
    // Arrange
    mockGetTally.mockRejectedValue(new Error('Network Error'));

    // Act
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(result.current.error).toBe('Could not load voting data.');
  });

  test('useSessionVoting_castVote_callsServiceThenRefetchesTally', async () => {
    // Arrange
    const updated = makeVote({ proposal_id: 42 });
    const refreshed = makeTally({ total_votes: 4 });
    mockCastVote.mockResolvedValue(voteRes(updated));
    mockGetTally
      .mockResolvedValueOnce(tallyRes(makeTally({ total_votes: 3 })))
      .mockResolvedValueOnce(tallyRes(refreshed));
    const { result } = renderVoting(1, 10);
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    await act(async () => { await result.current.castVote(42); });

    // Assert
    expect(mockCastVote).toHaveBeenCalledWith(1, 10, 42);
    expect(mockGetTally).toHaveBeenCalledTimes(2);
    expect(result.current.myVote).toEqual(updated);
    expect(result.current.tally).toEqual(refreshed);
  });

  test('useSessionVoting_castVoteInFlight_setsCastingIdAndClearsItOnSettle', async () => {
    // Arrange
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));
    const success = deferred<Awaited<ReturnType<typeof castVote>>>();
    mockCastVote.mockReturnValueOnce(success.promise);

    // Act
    act(() => { void result.current.castVote(42); });

    // Assert
    expect(result.current.castingId).toBe(42);
    // loading is owned by the initial fetch — a cast must not make the panel flash.
    expect(result.current.loading).toBe(false);

    await act(async () => { success.resolve(voteRes(makeVote({ proposal_id: 42 }))); });
    expect(result.current.castingId).toBeNull();

    // Arrange — the rejection path must clear it too.
    const failure = deferred<Awaited<ReturnType<typeof castVote>>>();
    mockCastVote.mockReturnValueOnce(failure.promise);

    // Act
    act(() => { void result.current.castVote(43); });
    expect(result.current.castingId).toBe(43);
    await act(async () => {
      failure.reject(new Error('Network Error'));
      await failure.promise.catch(() => {});
    });

    // Assert
    expect(result.current.castingId).toBeNull();
    expect(result.current.error).toBe('Could not cast vote.');
  });

  test('useSessionVoting_castVoteRejectsWith409_surfacesVotingIsClosedMessage', async () => {
    // Arrange
    const myVote = makeMyVote({ proposal_id: 12 });
    const tally = makeTally({ total_votes: 3 });
    mockGetMyVote.mockResolvedValue(myVoteRes(myVote));
    mockGetTally.mockResolvedValue(tallyRes(tally));
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockCastVote.mockRejectedValue(new ApiError(409, 'voting is closed'));

    // Act
    await act(async () => { await result.current.castVote(42); });

    // Assert
    // The backend's own wording reaches the user unchanged.
    expect(result.current.error).toBe('voting is closed');
    expect(result.current.myVote).toEqual(myVote);
    expect(result.current.tally).toEqual(tally);
  });

  test('useSessionVoting_refetch_reReadsBothEndpoints', async () => {
    // Arrange
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetMyVote).toHaveBeenCalledTimes(1);
    expect(mockGetTally).toHaveBeenCalledTimes(1);

    // Act
    await act(async () => { result.current.refetch(); });

    // Assert
    expect(mockGetMyVote).toHaveBeenCalledTimes(2);
    expect(mockGetTally).toHaveBeenCalledTimes(2);
  });

  test('useSessionVoting_successfulReloadAfterFailure_clearsError', async () => {
    // Arrange
    mockGetTally.mockRejectedValueOnce(new ApiError(500, 'boom'));
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.error).toBe('boom'));

    // Act
    await act(async () => { result.current.refetch(); });

    // Assert
    // A single failure must not poison the hook for the rest of its lifetime.
    expect(result.current.error).toBe('');
    expect(result.current.tally).not.toBeNull();
  });

  test('useSessionVoting_whenSessionIdChangesMidFlight_discardsStaleResponse', async () => {
    // Arrange
    // Session 10's tally is held in flight while the caller navigates to 11.
    const stale = deferred<Awaited<ReturnType<typeof getTally>>>();
    mockGetTally
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValue(tallyRes(makeTally({ total_votes: 3 })));
    const { result, rerender } = renderVoting(1, 10);

    // Act
    rerender({ groupId: 1, sessionId: 11 });
    await waitFor(() => expect(result.current.tally?.total_votes).toBe(3));
    await act(async () => { stale.resolve(tallyRes(makeTally({ total_votes: 99 }))); });

    // Assert
    // Without the cancelled guard the stale tally lands over the new one, and
    // nothing about the rendered count marks it wrong.
    expect(mockGetTally).toHaveBeenLastCalledWith(1, 11);
    expect(result.current.tally?.total_votes).toBe(3);
  });

  test('useSessionVoting_preservesVotersNullVersusEmptyArray', async () => {
    // Arrange
    // null means identities are hidden; [] means revealed-but-nobody-voted-for-it.
    const hidden = makeTally({
      identities_revealed: false,
      results: [
        { proposal_id: 12, title: 'Inception', poster_url: null, vote_count: 2, voters: null },
      ],
    });
    const revealed = makeTally({
      session_status: 'decided',
      identities_revealed: true,
      results: [
        {
          proposal_id: 12, title: 'Inception', poster_url: null, vote_count: 1,
          voters: [{ user_id: 4, username: 'ada' }],
        },
        { proposal_id: 13, title: 'Heat', poster_url: null, vote_count: 0, voters: [] },
      ],
    });
    mockGetTally
      .mockResolvedValueOnce(tallyRes(hidden))
      .mockResolvedValueOnce(tallyRes(revealed));

    // Act
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));
    const whileHidden = result.current.tally?.results[0].voters;
    await act(async () => { result.current.refetch(); });

    // Assert
    expect(whileHidden).toBeNull();
    expect(result.current.tally?.results[0].voters).toEqual([{ user_id: 4, username: 'ada' }]);
    expect(result.current.tally?.results[1].voters).toEqual([]);
    expect(result.current.tally?.results[1].voters).not.toBeNull();
  });

  test('useSessionVoting_preservesBackendResultOrderingAndZeroVoteEntries', async () => {
    // Arrange
    // Already sorted vote_count DESC then proposal_id ASC by the backend, and
    // built from the proposals so zero-vote nominations still appear.
    const tally = makeTally({
      total_votes: 3,
      results: [
        { proposal_id: 12, title: 'Inception', poster_url: null, vote_count: 2, voters: null },
        { proposal_id: 11, title: 'Heat', poster_url: null, vote_count: 1, voters: null },
        { proposal_id: 14, title: 'Arrival', poster_url: null, vote_count: 1, voters: null },
        { proposal_id: 13, title: 'Sicario', poster_url: null, vote_count: 0, voters: null },
      ],
    });
    mockGetTally.mockResolvedValue(tallyRes(tally));

    // Act
    const { result } = renderVoting();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    // Ordering is a backend guarantee the hook inherits rather than re-derives.
    expect(result.current.tally?.results.map((r) => r.proposal_id)).toEqual([12, 11, 14, 13]);
    expect(result.current.tally?.results).toHaveLength(4);
  });
});
