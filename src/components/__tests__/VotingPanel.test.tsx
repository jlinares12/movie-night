import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VotingPanel from '../VotingPanel';
import { useSessionVoting } from '../../hooks/useSessionVoting';
import type { ComponentProps } from 'react';
import type { MovieProposal } from '../../types/groups';
import type { MyVote, VoteTally } from '../../types/voting';

/*
 * Written before the components (docs/plans/voting-ui.md), so this suite fails on
 * `Cannot find module '../VotingPanel'` until #197 lands — the same "expected red"
 * the data layer shipped under in #209.
 *
 * `VotingPanel` is tested as an integration over the whole tree it owns —
 * `BallotPosterWall`, `BallotPoster`, `BallotBox` and `HoldToStampButton` all render
 * for real here, and are reached through the roles the plan's accessibility section
 * already commits to (a radiogroup of radios plus a submit button). That is a
 * deliberate trade against the plan's five separate suites: it covers the same
 * behaviour while pinning only *one* component's prop signature, so the child
 * components stay free to change shape without a test edit. `HoldToStampButton`
 * keeps its own suite because its pointer branch is the highest-defect-risk code
 * here and cannot be driven through a panel.
 *
 * The contract under test:
 *
 *   interface Props {
 *     groupId: number;
 *     sessionId: number;
 *     status: SessionStatus;              // SessionPage's own copy
 *     proposals: MovieProposal[];         // already fetched by SessionPage
 *     onStatusChange?: (s: SessionStatus) => void;
 *   }
 *
 * Two DOM contracts the e2e spec also relies on, so keep them in step:
 *   - the ballot box carries `data-testid="ballot-box"`
 *   - the commit control carries `data-testid="ballot-commit"`
 *   - each rendered voter identity carries `data-testid="ballot-voter"`
 *   - each rendered per-movie count carries `data-testid="vote-count"`
 * The last two are what make the secrecy assertions below checkable at all: an
 * absence assertion needs a name for the thing that must be absent.
 */

jest.mock('../../hooks/useSessionVoting');
const mockUseSessionVoting = jest.mocked(useSessionVoting);

const mockCastVote = jest.fn();
const mockRefetch = jest.fn();

type VotingState = ReturnType<typeof useSessionVoting>;

const hookState = (overrides: Partial<VotingState> = {}): VotingState => ({
  myVote: makeMyVote(),
  tally: makeTally(),
  loading: false,
  error: '',
  castingId: null,
  castVote: mockCastVote,
  refetch: mockRefetch,
  ...overrides,
});

function makeMyVote(overrides: Partial<MyVote> = {}): MyVote {
  return {
    id: null,
    proposal_id: null,
    user_id: 4,
    session_id: 10,
    voted_at: null,
    ...overrides,
  };
}

/*
 * Counts are deliberately odd numbers that appear nowhere else in the fixture —
 * 17 and 9 against a participation line of "26 of 40". Any per-movie count that
 * leaked into the DOM during `voting` would therefore be unmistakable, where a
 * count of 2 next to "2 of 5 have voted" would not be.
 */
function makeTally(overrides: Partial<VoteTally> = {}): VoteTally {
  return {
    session_status: 'voting',
    total_votes: 26,
    eligible_voters: 40,
    identities_revealed: false,
    results: [
      { proposal_id: 12, title: 'Inception', poster_url: '/inception.jpg', vote_count: 17, voters: null },
      { proposal_id: 13, title: 'Arrival',   poster_url: null,             vote_count: 9,  voters: null },
      { proposal_id: 14, title: 'Parasite',  poster_url: null,             vote_count: 0,  voters: null },
    ],
    ...overrides,
  };
}

function makeProposal(overrides: Partial<MovieProposal> = {}): MovieProposal {
  return {
    id: 12,
    session_id: 10,
    proposed_by_id: 99,
    proposed_by_username: 'alice',
    title: 'Inception',
    tmdb_id: 27205,
    poster_url: '/inception.jpg',
    overview: null,
    runtime_minutes: 148,
    proposed_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

const PROPOSALS = [
  makeProposal({ id: 12, title: 'Inception', proposed_by_username: 'alice' }),
  makeProposal({ id: 13, title: 'Arrival', proposed_by_username: 'bob' }),
  makeProposal({ id: 14, title: 'Parasite', proposed_by_username: 'carol' }),
];

const renderPanel = (props: Partial<ComponentProps<typeof VotingPanel>> = {}) =>
  render(
    <VotingPanel
      groupId={1}
      sessionId={10}
      status="voting"
      proposals={PROPOSALS}
      {...props}
    />,
  );

const poster = (title: string) => screen.getByRole('radio', { name: new RegExp(title, 'i') });

beforeEach(() => {
  // HoldToStampButton reads prefers-reduced-motion, and jsdom has no matchMedia.
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  }));
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
  mockUseSessionVoting.mockReturnValue(hookState());
});

afterEach(() => jest.clearAllMocks());

describe('VotingPanel', () => {
  // ── Secrecy ───────────────────────────────────────────────────────────────
  //
  // These are the tests that would let a regression deanonymise a small group,
  // so they come first. Note there is no role prop anywhere in this file: role
  // does not unlock identities and there is no flag that does, so "hidden for an
  // owner too" is expressed by the panel having no way to know who is asking.

  test('votingPanel_duringVoting_rendersNoPerMovieVoteCounts', () => {
    // Arrange — the tally carries real, non-zero counts during `voting`
    const { container } = renderPanel();

    // Assert — and none of them reach the DOM. A running score visibly steers the
    // last voters in a five-person group, and in a three-member group it is
    // partially deanonymising on its own.
    // No word boundaries: a count glued to a title ("Inception17") is exactly the
    // leak this is looking for, and \b would let it through. 17 and 9 appear in no
    // other field of the fixture — not in the ids, the runtime, or "26 of 40".
    expect(screen.queryAllByTestId('vote-count')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/17/);
    expect(container.textContent).not.toMatch(/9/);
  });

  test('votingPanel_duringVoting_rendersNoVoterIdentities', () => {
    // Arrange — `voters` is null for every entry while identities are hidden
    renderPanel();

    // Assert
    expect(screen.queryAllByTestId('ballot-voter')).toHaveLength(0);
  });

  test('votingPanel_duringVoting_rendersParticipationLine', () => {
    // Arrange — the one social signal that helps ("vote already") and names nobody.
    // Both numbers come straight off the tally; neither is derived.
    renderPanel();

    // Assert
    expect(screen.getByText(/26 of 40/)).toBeInTheDocument();
  });

  // ── The staging contract ──────────────────────────────────────────────────

  test('votingPanel_tappingPoster_doesNotCallCastVote', async () => {
    // Arrange — tapping a poster stages, it never casts. This is what makes a
    // stray tap free, which is why the wall never needs a locked state.
    const user = userEvent.setup();
    renderPanel();

    // Act
    await user.click(poster('Arrival'));

    // Assert
    expect(mockCastVote).not.toHaveBeenCalled();
  });

  test('votingPanel_tappingPoster_marksItCheckedWithoutCasting', async () => {
    // Arrange — aria-checked follows the *effective* selection (staged ?? myVote)
    const user = userEvent.setup();
    renderPanel();

    // Act
    await user.click(poster('Arrival'));

    // Assert
    expect(poster('Arrival')).toBeChecked();
    expect(poster('Inception')).not.toBeChecked();
  });

  test('votingPanel_confirmingStagedSelection_callsCastVoteOnceWithProposalId', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPanel();

    // Act — stage, then commit at the box. A mouse click commits with no hold.
    await user.click(poster('Arrival'));
    await user.click(screen.getByTestId('ballot-commit'));

    // Assert
    expect(mockCastVote).toHaveBeenCalledTimes(1);
    expect(mockCastVote).toHaveBeenCalledWith(13);
  });

  test('votingPanel_withNothingStaged_offersNoCommitControl', () => {
    // Arrange — EMPTY state: there is nothing to confirm, so no confirm button
    renderPanel();

    // Assert
    expect(screen.queryByTestId('ballot-commit')).not.toBeInTheDocument();
  });

  test('votingPanel_whenVoteAlreadyCast_marksThatPosterChecked', () => {
    // Arrange — CAST state, straight off the server
    mockUseSessionVoting.mockReturnValue(
      hookState({ myVote: makeMyVote({ id: 7, proposal_id: 12, voted_at: '2026-08-01T00:00:00Z' }) }),
    );
    renderPanel();

    // Assert
    expect(poster('Inception')).toBeChecked();
  });

  test('votingPanel_stagingADifferentPoster_showsTheSwapWithoutCasting', async () => {
    // Arrange — STAGED_CHANGE. The swap preview is the whole reason staging
    // exists: "you are replacing X with Y" is one legible moment, and it makes
    // the no-DELETE semantics visible — you replace, never add or remove.
    const user = userEvent.setup();
    mockUseSessionVoting.mockReturnValue(
      hookState({ myVote: makeMyVote({ id: 7, proposal_id: 12, voted_at: '2026-08-01T00:00:00Z' }) }),
    );
    renderPanel();

    // Act
    await user.click(poster('Arrival'));

    // Assert — staged wins over the cast vote, and still nothing was sent
    expect(poster('Arrival')).toBeChecked();
    expect(poster('Inception')).not.toBeChecked();
    expect(mockCastVote).not.toHaveBeenCalled();
    // Both slips are named in the box, so the member can see what is being replaced
    expect(screen.getByTestId('ballot-box')).toHaveTextContent(/Inception/);
    expect(screen.getByTestId('ballot-box')).toHaveTextContent(/Arrival/);
  });

  test('votingPanel_tappingTheVotedPoster_clearsTheStagedSelection', async () => {
    // Arrange — "never mind, I'll keep it", with no separate control for it
    const user = userEvent.setup();
    mockUseSessionVoting.mockReturnValue(
      hookState({ myVote: makeMyVote({ id: 7, proposal_id: 12, voted_at: '2026-08-01T00:00:00Z' }) }),
    );
    renderPanel();

    // Act
    await user.click(poster('Arrival'));
    await user.click(poster('Inception'));

    // Assert — back to CAST: nothing staged, so nothing to confirm
    expect(poster('Inception')).toBeChecked();
    expect(screen.queryByTestId('ballot-commit')).not.toBeInTheDocument();
  });

  // ── Ordering and the join ─────────────────────────────────────────────────

  test('votingPanel_preservesBackendResultOrderingAndUnjoinedEntries', () => {
    // Arrange — `results` is pre-sorted vote_count DESC then proposal_id ASC, and
    // includes zero-vote nominations. Both are inherited guarantees: the ordering
    // is what stops a tie reshuffling under the user between refetches.
    // Only two of the three have a matching proposal here — the join adds the
    // proposer, it does not decide which posters exist.
    renderPanel({ proposals: [PROPOSALS[0], PROPOSALS[2]] });

    // Assert
    const titles = screen.getAllByRole('radio').map((el) => el.textContent);
    expect(titles).toHaveLength(3);
    expect(titles[0]).toMatch(/Inception/);
    expect(titles[1]).toMatch(/Arrival/);
    expect(titles[2]).toMatch(/Parasite/);
  });

  // ── Refresh policy ────────────────────────────────────────────────────────

  test('votingPanel_onWindowFocus_refetches', () => {
    // Arrange — focus-refetch, not polling: there is no SSE, and with counts
    // hidden the only stale things are the participation line and the status.
    renderPanel();
    expect(mockRefetch).not.toHaveBeenCalled();

    // Act
    act(() => { fireEvent(window, new Event('focus')); });

    // Assert
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  test('votingPanel_whenCastFails_refetchesOnceAndClearsTheStagedSelection', async () => {
    // Arrange — the mid-vote race: the owner can advance to `decided` while a
    // member is deciding, and with no SSE the client learns of it only when its
    // PUT returns 409. The hook swallows the rejection into `error`, so the panel
    // reacts to `error` becoming non-empty rather than to a rejected promise.
    const user = userEvent.setup();
    const { rerender } = renderPanel();
    await user.click(poster('Arrival'));

    // Act — the cast comes back failed
    mockUseSessionVoting.mockReturnValue(hookState({ error: 'voting is closed' }));
    rerender(<VotingPanel groupId={1} sessionId={10} status="voting" proposals={PROPOSALS} />);

    // Assert — refetching on *any* error rather than on a matched message avoids
    // string-matching backend copy, and covers `404 proposal not found` too
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(poster('Arrival')).not.toBeChecked();

    // Act — a re-render carrying the same error must not refetch again. A refetch
    // that itself fails would otherwise re-arm this and spin.
    rerender(<VotingPanel groupId={1} sessionId={10} status="voting" proposals={PROPOSALS} />);

    // Assert
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  test('votingPanel_whenTallyStatusDiffersFromProp_callsOnStatusChange', () => {
    // Arrange — after that refetch the tally's session_status is fresher than the
    // status SessionPage holds, which would leave the hero badge stale next to a
    // corrected panel. One source of truth, flowing upward.
    const onStatusChange = jest.fn();
    mockUseSessionVoting.mockReturnValue(
      hookState({ tally: makeTally({ session_status: 'decided', identities_revealed: true }) }),
    );

    // Act
    renderPanel({ status: 'voting', onStatusChange });

    // Assert
    expect(onStatusChange).toHaveBeenCalledWith('decided');
  });

  test('votingPanel_whenTallyStatusMatchesProp_doesNotCallOnStatusChange', () => {
    // Arrange
    const onStatusChange = jest.fn();

    // Act
    renderPanel({ status: 'voting', onStatusChange });

    // Assert — otherwise SessionPage re-sets state on every render
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  // ── Results state ─────────────────────────────────────────────────────────

  test('votingPanel_whenIdentitiesRevealed_rendersCountsAndVoters', () => {
    // Arrange — the reveal at `decided` is a genuine event precisely because
    // nothing above published these numbers early
    mockUseSessionVoting.mockReturnValue(
      hookState({
        myVote: makeMyVote({ id: 7, proposal_id: 12, voted_at: '2026-08-01T00:00:00Z' }),
        tally: makeTally({
          session_status: 'decided',
          identities_revealed: true,
          results: [
            { proposal_id: 12, title: 'Inception', poster_url: null, vote_count: 17, voters: [{ user_id: 4, username: 'dave' }] },
            { proposal_id: 13, title: 'Arrival', poster_url: null, vote_count: 9, voters: [] },
          ],
        }),
      }),
    );

    // Act
    renderPanel({ status: 'decided' });

    // Assert — read through the testid rather than the whole subtree's text, so
    // the assertion does not depend on how the count is laid out next to a title
    const counts = screen.getAllByTestId('vote-count').map((el) => el.textContent).join(' ');
    expect(counts).toMatch(/17/);
    expect(screen.getByTestId('ballot-voter')).toHaveTextContent('dave');
  });

  test('votingPanel_whenSessionIsClosed_offersNoCommitControl', () => {
    // Arrange — the box becomes a read-only receipt; the wall becomes results
    mockUseSessionVoting.mockReturnValue(
      hookState({
        myVote: makeMyVote({ id: 7, proposal_id: 12, voted_at: '2026-08-01T00:00:00Z' }),
        tally: makeTally({ session_status: 'closed', identities_revealed: true }),
      }),
    );

    // Act
    renderPanel({ status: 'closed' });

    // Assert — no way to cast from a phase the backend answers with 409
    expect(screen.queryByTestId('ballot-commit')).not.toBeInTheDocument();
    expect(screen.getByTestId('ballot-box')).toHaveTextContent(/Inception/);
  });

  // ── Accessibility floor ───────────────────────────────────────────────────

  test('votingPanel_rendersTheWallAsALabelledRadioGroup', () => {
    // Arrange / Act — the interaction is structurally a radio group plus a submit
    // button, and building it as one is what makes it legible to a screen reader
    // (and to Playwright) for free
    renderPanel();

    // Assert
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAccessibleName();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  test('votingPanel_announcesBallotTransitions_inALiveRegion', async () => {
    // Arrange — the box's own state changes are otherwise silent to a screen
    // reader, since staging moves focus nowhere
    const user = userEvent.setup();
    renderPanel();

    // Act
    await user.click(poster('Arrival'));

    // Assert — `role="status"` rather than a bare `aria-live`, so the region is
    // queryable by role and carries the polite live semantics implicitly
    expect(screen.getByRole('status')).toHaveTextContent(/Arrival/);
  });
});
