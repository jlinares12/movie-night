import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useParams } from 'react-router-dom';
import SessionPage from '../SessionPage';
import { getSession, getGroup, updateSession, deleteSession } from '../../services/groups';
import { ApiError } from '../../services/apiError';
import type { Session, GroupDetail } from '../../types/groups';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn(), useParams: jest.fn() }));
jest.mock('../../services/groups');
jest.mock('../../hooks/useGroupEvents', () => ({ useGroupEvents: jest.fn() }));

const mockNavigate = jest.fn();
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetGroup = getGroup as jest.MockedFunction<typeof getGroup>;
const mockUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>;
const mockDeleteSession = deleteSession as jest.MockedFunction<typeof deleteSession>;

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

const setup = async (session: Session, group: GroupDetail) => {
  mockGetSession.mockResolvedValue({ data: session } as unknown as Awaited<ReturnType<typeof getSession>>);
  mockGetGroup.mockResolvedValue({ data: group } as unknown as Awaited<ReturnType<typeof getGroup>>);
  render(<SessionPage />);
  await act(async () => { await Promise.resolve(); });
};

describe('SessionPage', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: '1', sessionId: '10' });
    mockNavigate.mockClear();
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

  test('always renders the "Movie Night Session" hero title', async () => {
    await setup(makeSession(), makeGroupDetail());

    expect(screen.getByText('Movie Night Session')).toBeInTheDocument();
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
});
