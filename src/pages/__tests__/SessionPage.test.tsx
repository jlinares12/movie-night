import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useParams } from 'react-router-dom';
import SessionPage from '../SessionPage';
import { getSession, getGroup, updateSession, deleteSession, listProposals, createProposal, deleteProposal } from '../../services/groups';
import { ApiError } from '../../services/apiError';
import type { Session, GroupDetail, MovieProposal } from '../../types/groups';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { MovieSearchResult } from '../../types/movies';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn(), useParams: jest.fn() }));
jest.mock('../../services/groups');
jest.mock('../../hooks/useGroupEvents', () => ({ useGroupEvents: jest.fn() }));
jest.mock('../../hooks/useCurrentUser', () => ({ useCurrentUser: jest.fn() }));
jest.mock('../../components/MovieSearchPanel', () => ({
  __esModule: true,
  default: ({ onNominate }: { onNominate: (movie: MovieSearchResult) => Promise<void>; nominatingId: number | null }) => (
    <button
      onClick={() => onNominate({ id: 1, tmdb_id: 123, title: 'Inception', original_title: null, overview: null, poster_url: null, release_date: null, vote_average: null, runtime_minutes: null })}
    >
      Test Nominate
    </button>
  ),
}));
jest.mock('../../components/NominationCard', () => ({
  __esModule: true,
  default: ({ proposal, canDelete, onDelete }: { proposal: MovieProposal; canDelete: boolean; onDelete: (id: number) => void }) => (
    <div data-testid="nomination-card">
      <span>{proposal.title}</span>
      {canDelete && <button onClick={() => onDelete(proposal.id)}>Remove nomination</button>}
    </div>
  ),
}));

const mockNavigate = jest.fn();
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetGroup = getGroup as jest.MockedFunction<typeof getGroup>;
const mockUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>;
const mockDeleteSession = deleteSession as jest.MockedFunction<typeof deleteSession>;
const mockListProposals = listProposals as jest.MockedFunction<typeof listProposals>;
const mockCreateProposal = createProposal as jest.MockedFunction<typeof createProposal>;
const mockDeleteProposal = deleteProposal as jest.MockedFunction<typeof deleteProposal>;
const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 10,
  group_id: 1,
  created_by_id: 1,
  scheduled_for: null,
  status: 'open',
  created_at: '2024-03-01T00:00:00Z',
  ...overrides,
});

const makeGroupDetail = (overrides: Partial<GroupDetail> = {}): GroupDetail => ({
  id: 1, name: 'Rialto House', description: null, invite_code: 'abc',
  created_by_id: 1, created_at: '2024-01-01T00:00:00Z',
  your_role: 'owner', members: [], sessions: [],
  ...overrides,
});

const makeProposal = (overrides: Partial<MovieProposal> = {}): MovieProposal => ({
  id: 1,
  session_id: 10,
  proposed_by_id: 99,
  proposed_by_username: 'alice',
  title: 'Inception',
  tmdb_id: 123,
  poster_url: null,
  overview: null,
  runtime_minutes: null,
  proposed_at: '2024-03-01T00:00:00Z',
  ...overrides,
});

const setup = async (session: Session, group: GroupDetail, proposals: MovieProposal[] = []) => {
  mockGetSession.mockResolvedValue({ data: session } as unknown as Awaited<ReturnType<typeof getSession>>);
  mockGetGroup.mockResolvedValue({ data: group } as unknown as Awaited<ReturnType<typeof getGroup>>);
  mockListProposals.mockResolvedValue({ data: proposals } as unknown as Awaited<ReturnType<typeof listProposals>>);
  render(<SessionPage />);
  await act(async () => { await Promise.resolve(); });
};

describe('SessionPage', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: '1', sessionId: '10' });
    mockNavigate.mockClear();
    mockUseCurrentUser.mockReturnValue({ id: 42, user_id: 'clerk_42', username: 'me', created_at: '' });
  });
  afterEach(() => jest.clearAllMocks());

  // ── Loading / error states ────────────────────────────────────────────────

  test('shows a loading indicator while fetching', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));
    mockGetGroup.mockReturnValue(new Promise(() => {}));

    render(<SessionPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('shows "Access denied" on a 403 response', async () => {
    mockGetSession.mockRejectedValue(new ApiError(403, 'Forbidden'));
    mockGetGroup.mockRejectedValue(new ApiError(403, 'Forbidden'));

    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  test('shows "Session not found" on a 404 response', async () => {
    mockGetSession.mockRejectedValue(new ApiError(404, 'Not found'));
    mockGetGroup.mockRejectedValue(new ApiError(404, 'Not found'));

    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByText(/session not found/i)).toBeInTheDocument();
  });

  // ── Hero section ─────────────────────────────────────────────────────────

  test('always renders the "Call Time Session" hero title', async () => {
    await setup(makeSession(), makeGroupDetail());

    expect(screen.getByText('Call Time Session')).toBeInTheDocument();
  });

  test('shows the group name in the hero', async () => {
    await setup(makeSession(), makeGroupDetail({ name: 'The Cinephiles' }));

    expect(screen.getByText('The Cinephiles')).toBeInTheDocument();
  });

  test('hero badge reads "OPEN FOR NOMINATIONS" when status is open', async () => {
    await setup(makeSession({ status: 'open' }), makeGroupDetail());

    expect(screen.getByText('OPEN FOR NOMINATIONS')).toBeInTheDocument();
  });

  test('hero badge reads "VOTING IN PROGRESS" when status is voting', async () => {
    await setup(makeSession({ status: 'voting' }), makeGroupDetail());

    expect(screen.getByText('VOTING IN PROGRESS')).toBeInTheDocument();
  });

  test('hero badge reads "WINNER SELECTED" when status is decided', async () => {
    await setup(makeSession({ status: 'decided' }), makeGroupDetail());

    expect(screen.getByText('WINNER SELECTED')).toBeInTheDocument();
  });

  test('hero badge reads "SESSION CLOSED" when status is closed', async () => {
    await setup(makeSession({ status: 'closed' }), makeGroupDetail());

    expect(screen.getByText('SESSION CLOSED')).toBeInTheDocument();
  });

  test('shows "No date scheduled" in the hero when scheduled_for is null', async () => {
    await setup(makeSession({ scheduled_for: null }), makeGroupDetail());

    expect(screen.getByText(/no date scheduled/i)).toBeInTheDocument();
  });

  test('does not show "No date scheduled" when scheduled_for is set', async () => {
    await setup(makeSession({ scheduled_for: '2024-06-15T21:00:00Z' }), makeGroupDetail());

    expect(screen.queryByText(/no date scheduled/i)).not.toBeInTheDocument();
  });

  // ── Session meta card ─────────────────────────────────────────────────────

  test('renders the session status in the meta card', async () => {
    await setup(makeSession({ status: 'voting' }), makeGroupDetail());

    expect(screen.getByText('voting')).toBeInTheDocument();
  });

  test('renders the "Created" label in the session meta card', async () => {
    await setup(makeSession(), makeGroupDetail());

    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  // ── Member count ──────────────────────────────────────────────────────────

  test('shows "0 Members" when the group has no members', async () => {
    await setup(makeSession(), makeGroupDetail({ members: [] }));

    expect(screen.getByText('0 Members')).toBeInTheDocument();
  });

  test('shows the correct member count when the group has members', async () => {
    const members = [
      { id: 1, user_id: 1, group_id: 1, role: 'owner' as const, joined_at: '', username: 'alice' },
      { id: 2, user_id: 2, group_id: 1, role: 'member' as const, joined_at: '', username: 'bob' },
    ];
    await setup(makeSession(), makeGroupDetail({ members }));

    expect(screen.getByText('2 Members')).toBeInTheDocument();
  });

  // ── Nominations section heading ───────────────────────────────────────────

  test('nominations heading reads "Nominations" when status is open', async () => {
    await setup(makeSession({ status: 'open' }), makeGroupDetail());

    expect(screen.getByRole('heading', { name: 'Nominations' })).toBeInTheDocument();
  });

  test('nominations heading reads "Nominations" when status is voting', async () => {
    await setup(makeSession({ status: 'voting' }), makeGroupDetail());

    expect(screen.getByRole('heading', { name: 'Nominations' })).toBeInTheDocument();
  });

  test('nominations heading reads "Final Ballot Results" when status is decided', async () => {
    await setup(makeSession({ status: 'decided' }), makeGroupDetail());

    expect(screen.getByRole('heading', { name: 'Final Ballot Results' })).toBeInTheDocument();
  });

  test('nominations heading reads "Final Ballot Results" when status is closed', async () => {
    await setup(makeSession({ status: 'closed' }), makeGroupDetail());

    expect(screen.getByRole('heading', { name: 'Final Ballot Results' })).toBeInTheDocument();
  });

  // ── Status-driven nomination placeholders ─────────────────────────────────

  test('shows "No nominations yet" placeholder when session is open', async () => {
    await setup(makeSession({ status: 'open' }), makeGroupDetail());

    expect(screen.getByText(/no nominations yet/i)).toBeInTheDocument();
  });

  test('shows "Voting in Progress" placeholder when session is voting', async () => {
    await setup(makeSession({ status: 'voting' }), makeGroupDetail());

    expect(screen.getByText('Voting in Progress')).toBeInTheDocument();
  });

  test('shows "Session decided" placeholder when status is decided', async () => {
    await setup(makeSession({ status: 'decided' }), makeGroupDetail());

    expect(screen.getByText(/session decided/i)).toBeInTheDocument();
  });

  test('shows "Session closed" placeholder when status is closed', async () => {
    await setup(makeSession({ status: 'closed' }), makeGroupDetail());

    // exact match avoids colliding with the all-caps "SESSION CLOSED" hero badge
    expect(screen.getByText('Session closed')).toBeInTheDocument();
  });

  // ── Advance button (owner / admin / member / closed) ──────────────────────

  test('"Advance to voting" button is visible to the owner when status is open', async () => {
    await setup(makeSession({ status: 'open' }), makeGroupDetail({ your_role: 'owner' }));

    expect(screen.getByRole('button', { name: /advance to voting/i })).toBeInTheDocument();
  });

  test('"Advance to voting" button is visible to admin', async () => {
    await setup(makeSession({ status: 'open' }), makeGroupDetail({ your_role: 'admin' }));

    expect(screen.getByRole('button', { name: /advance to voting/i })).toBeInTheDocument();
  });

  test('no advance button is shown for a plain member', async () => {
    await setup(makeSession({ status: 'open' }), makeGroupDetail({ your_role: 'member' }));

    expect(screen.queryByRole('button', { name: /advance/i })).not.toBeInTheDocument();
  });

  test('no advance button is shown when session status is closed', async () => {
    await setup(makeSession({ status: 'closed' }), makeGroupDetail({ your_role: 'owner' }));

    expect(screen.queryByRole('button', { name: /advance/i })).not.toBeInTheDocument();
  });

  test('clicking the advance button calls updateSession with the next status', async () => {
    const user = userEvent.setup();
    const updatedSession = makeSession({ status: 'voting' });
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'open' }) } as unknown as Awaited<ReturnType<typeof getSession>>);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as unknown as Awaited<ReturnType<typeof getGroup>>);
    mockUpdateSession.mockResolvedValue({ data: updatedSession } as unknown as Awaited<ReturnType<typeof updateSession>>);

    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    await user.click(screen.getByRole('button', { name: /advance to voting/i }));
    await act(async () => { await Promise.resolve(); });

    expect(mockUpdateSession).toHaveBeenCalledWith(1, 10, { status: 'voting' });
    expect(screen.getByText('voting')).toBeInTheDocument();
  });

  // ── Danger zone / delete ─────────────────────────────────────────────────

  test('"Delete Session" button is visible to owner', async () => {
    await setup(makeSession(), makeGroupDetail({ your_role: 'owner' }));

    expect(screen.getByRole('button', { name: /delete session/i })).toBeInTheDocument();
  });

  test('"Delete Session" button is visible to admin', async () => {
    await setup(makeSession(), makeGroupDetail({ your_role: 'admin' }));

    expect(screen.getByRole('button', { name: /delete session/i })).toBeInTheDocument();
  });

  test('"Delete Session" button is NOT visible to a plain member', async () => {
    await setup(makeSession(), makeGroupDetail({ your_role: 'member' }));

    expect(screen.queryByRole('button', { name: /delete session/i })).not.toBeInTheDocument();
  });

  test('"Danger Zone" label is not shown to a plain member', async () => {
    await setup(makeSession(), makeGroupDetail({ your_role: 'member' }));

    expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
  });

  test('Delete Session calls deleteSession and navigates back to the group', async () => {
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    mockGetSession.mockResolvedValue({ data: makeSession() } as unknown as Awaited<ReturnType<typeof getSession>>);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as unknown as Awaited<ReturnType<typeof getGroup>>);
    mockDeleteSession.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof deleteSession>>);

    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    await user.click(screen.getByRole('button', { name: /delete session/i }));
    await act(async () => { await Promise.resolve(); });

    expect(mockDeleteSession).toHaveBeenCalledWith(1, 10);
    expect(mockNavigate).toHaveBeenCalledWith('/group/1');
  });

  test('Delete Session is cancelled when the user rejects the confirm dialog', async () => {
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(false);
    await setup(makeSession(), makeGroupDetail({ your_role: 'owner' }));

    await user.click(screen.getByRole('button', { name: /delete session/i }));

    expect(mockDeleteSession).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── Back button ───────────────────────────────────────────────────────────

  test('clicking "Back to group" navigates to the group page', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    await user.click(screen.getByRole('button', { name: /back to group/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/group/1');
  });

  // ── Potluck panel ─────────────────────────────────────────────────────────

  test('renders the potluck "Who\'s Bringing What?" heading', async () => {
    await setup(makeSession(), makeGroupDetail());

    expect(screen.getByRole('heading', { name: /who's bringing what/i })).toBeInTheDocument();
  });

  test('shows empty-state message when no contributions have been added', async () => {
    await setup(makeSession(), makeGroupDetail());

    expect(screen.getByText(/no contributions yet/i)).toBeInTheDocument();
  });

  test('renders the potluck input placeholder', async () => {
    await setup(makeSession(), makeGroupDetail());

    expect(screen.getByPlaceholderText(/i'll bring something/i)).toBeInTheDocument();
  });

  test('clicking the add button adds a contribution to the list', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    await user.type(screen.getByPlaceholderText(/i'll bring something/i), 'Popcorn');
    await user.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByText('Popcorn')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  test('pressing Enter in the potluck input adds the contribution', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    await user.type(screen.getByPlaceholderText(/i'll bring something/i), 'Nachos{Enter}');

    expect(screen.getByText('Nachos')).toBeInTheDocument();
  });

  test('potluck input is cleared after adding a contribution', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    const input = screen.getByPlaceholderText(/i'll bring something/i) as HTMLInputElement;
    await user.type(input, 'Soda{Enter}');

    expect(input.value).toBe('');
  });

  test('empty submission does not add an entry to the potluck list', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    await user.type(screen.getByPlaceholderText(/i'll bring something/i), '   {Enter}');

    expect(screen.queryByText('You')).not.toBeInTheDocument();
    expect(screen.getByText(/no contributions yet/i)).toBeInTheDocument();
  });

  test('empty-state message disappears after the first contribution is added', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    await user.type(screen.getByPlaceholderText(/i'll bring something/i), 'Drinks{Enter}');

    expect(screen.queryByText(/no contributions yet/i)).not.toBeInTheDocument();
  });

  test('multiple contributions are all rendered in the potluck list', async () => {
    const user = userEvent.setup();
    await setup(makeSession(), makeGroupDetail());

    const input = screen.getByPlaceholderText(/i'll bring something/i);
    await user.type(input, 'Popcorn{Enter}');
    await user.type(input, 'Soda{Enter}');
    await user.type(input, 'Nachos{Enter}');

    expect(screen.getByText('Popcorn')).toBeInTheDocument();
    expect(screen.getByText('Soda')).toBeInTheDocument();
    expect(screen.getByText('Nachos')).toBeInTheDocument();
  });

  // ── Nominations ───────────────────────────────────────────────────────────

  test('listProposals_isCalledOnMount_withCorrectGroupAndSessionIds', async () => {
    // Arrange / Act
    await setup(makeSession(), makeGroupDetail());

    // Assert
    expect(mockListProposals).toHaveBeenCalledWith(1, 10);
  });

  test('renders_aNominationCard_forEachProposalReturnedByListProposals', async () => {
    // Arrange
    const proposals = [makeProposal({ id: 1, title: 'Inception' }), makeProposal({ id: 2, title: 'Interstellar' })];

    // Act
    await setup(makeSession({ status: 'open' }), makeGroupDetail(), proposals);

    // Assert
    expect(screen.getAllByTestId('nomination-card')).toHaveLength(2);
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Interstellar')).toBeInTheDocument();
  });

  test('"Add Nomination" button is visible when session status is open', async () => {
    // Arrange / Act
    await setup(makeSession({ status: 'open' }), makeGroupDetail());

    // Assert
    expect(screen.getByRole('button', { name: /add nomination/i })).toBeInTheDocument();
  });

  test('"Add Nomination" button is NOT shown when session status is voting', async () => {
    // Arrange / Act
    await setup(makeSession({ status: 'voting' }), makeGroupDetail());

    // Assert
    expect(screen.queryByRole('button', { name: /add nomination/i })).not.toBeInTheDocument();
  });

  test('"Add Nomination" button is NOT shown when session status is decided', async () => {
    // Arrange / Act
    await setup(makeSession({ status: 'decided' }), makeGroupDetail());

    // Assert
    expect(screen.queryByRole('button', { name: /add nomination/i })).not.toBeInTheDocument();
  });

  test('clicking "Add Nomination" reveals the MovieSearchPanel', async () => {
    // Arrange
    const user = userEvent.setup();
    await setup(makeSession({ status: 'open' }), makeGroupDetail());

    // Act
    await user.click(screen.getByRole('button', { name: /add nomination/i }));

    // Assert — the mock MovieSearchPanel renders a "Test Nominate" button
    expect(screen.getByRole('button', { name: /test nominate/i })).toBeInTheDocument();
  });

  test('nominating a movie calls createProposal and adds a card to the list', async () => {
    // Arrange
    const user = userEvent.setup();
    const proposal = makeProposal({ title: 'Inception' });
    mockCreateProposal.mockResolvedValue({ data: proposal } as unknown as Awaited<ReturnType<typeof createProposal>>);
    await setup(makeSession({ status: 'open' }), makeGroupDetail());
    await user.click(screen.getByRole('button', { name: /add nomination/i }));

    // Act — mock panel's "Test Nominate" button triggers handleNominate
    await user.click(screen.getByRole('button', { name: /test nominate/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockCreateProposal).toHaveBeenCalledWith(1, 10, expect.objectContaining({ tmdb_id: 123, title: 'Inception' }));
    expect(screen.getAllByTestId('nomination-card')).toHaveLength(1);
  });

  test('shows an alert when createProposal rejects', async () => {
    // Arrange
    const user = userEvent.setup();
    global.alert = jest.fn();
    mockCreateProposal.mockRejectedValue(new ApiError(409, 'you already nominated a movie'));
    await setup(makeSession({ status: 'open' }), makeGroupDetail());
    await user.click(screen.getByRole('button', { name: /add nomination/i }));

    // Act
    await user.click(screen.getByRole('button', { name: /test nominate/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(global.alert).toHaveBeenCalledWith('you already nominated a movie');
  });

  test('deleting a proposal calls deleteProposal and removes the card', async () => {
    // Arrange
    const user = userEvent.setup();
    const proposal = makeProposal({ id: 5, proposed_by_id: 42 });
    mockDeleteProposal.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof deleteProposal>>);
    await setup(makeSession({ status: 'open' }), makeGroupDetail(), [proposal]);

    // Act
    await user.click(screen.getByRole('button', { name: /remove nomination/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockDeleteProposal).toHaveBeenCalledWith(1, 10, 5);
    expect(screen.queryByTestId('nomination-card')).not.toBeInTheDocument();
  });

  test('shows an alert when deleteProposal rejects', async () => {
    // Arrange
    const user = userEvent.setup();
    global.alert = jest.fn();
    const proposal = makeProposal({ id: 5, proposed_by_id: 42 });
    mockDeleteProposal.mockRejectedValue(new ApiError(403, 'forbidden'));
    await setup(makeSession({ status: 'open' }), makeGroupDetail(), [proposal]);

    // Act
    await user.click(screen.getByRole('button', { name: /remove nomination/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(global.alert).toHaveBeenCalledWith('forbidden');
  });

  test('trash icon is visible for own proposal when viewer is a plain member', async () => {
    // Arrange — proposal proposed by the current user (id 42)
    const proposal = makeProposal({ proposed_by_id: 42 });
    await setup(makeSession({ status: 'open' }), makeGroupDetail({ your_role: 'member' }), [proposal]);

    // Assert
    expect(screen.getByRole('button', { name: /remove nomination/i })).toBeInTheDocument();
  });

  test('trash icon is NOT visible for another user\'s proposal when viewer is a plain member', async () => {
    // Arrange — proposal by user 99, current user is 42
    const proposal = makeProposal({ proposed_by_id: 99 });
    await setup(makeSession({ status: 'open' }), makeGroupDetail({ your_role: 'member' }), [proposal]);

    // Assert
    expect(screen.queryByRole('button', { name: /remove nomination/i })).not.toBeInTheDocument();
  });

  test('trash icon is visible for any proposal when viewer is owner', async () => {
    // Arrange — proposal by someone else, viewer is owner
    const proposal = makeProposal({ proposed_by_id: 99 });
    await setup(makeSession({ status: 'open' }), makeGroupDetail({ your_role: 'owner' }), [proposal]);

    // Assert
    expect(screen.getByRole('button', { name: /remove nomination/i })).toBeInTheDocument();
  });
});
