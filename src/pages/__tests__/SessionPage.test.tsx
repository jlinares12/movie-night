import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useParams } from 'react-router-dom';
import SessionPage from '../SessionPage';
import { getSession, getGroup, updateSession, deleteSession } from '../../services/groups';
import { useGroupEvents } from '../../hooks/useGroupEvents';
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

describe('SessionPage', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: '1', sessionId: '10' });
    mockNavigate.mockClear();
  });
  afterEach(() => jest.clearAllMocks());

  test('shows a loading indicator while fetching', () => {
    // Arrange
    mockGetSession.mockReturnValue(new Promise(() => {}));
    mockGetGroup.mockReturnValue(new Promise(() => {}));

    // Act
    render(<SessionPage />);

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders the session status after a successful fetch', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'voting' }) } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail() } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('voting')).toBeInTheDocument();
  });

  test('shows "Access denied" on a 403 response', async () => {
    // Arrange
    mockGetSession.mockRejectedValue({ response: { status: 403 } });
    mockGetGroup.mockRejectedValue({ response: { status: 403 } });

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  test('"Advance to voting" button is visible to the owner when status is open', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'open' }) } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByRole('button', { name: /advance to voting/i })).toBeInTheDocument();
  });

  test('"Advance to voting" button is visible to admin', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'open' }) } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'admin' }) } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByRole('button', { name: /advance to voting/i })).toBeInTheDocument();
  });

  test('no advance button is shown for a plain member', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'open' }) } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'member' }) } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.queryByRole('button', { name: /advance/i })).not.toBeInTheDocument();
  });

  test('no advance button is shown when session status is closed', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'closed' }) } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.queryByRole('button', { name: /advance/i })).not.toBeInTheDocument();
  });

  test('clicking the advance button calls updateSession with the next status', async () => {
    // Arrange
    const user = userEvent.setup();
    const updatedSession = makeSession({ status: 'voting' });
    mockGetSession.mockResolvedValue({ data: makeSession({ status: 'open' }) } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as any);
    mockUpdateSession.mockResolvedValue({ data: updatedSession } as any);

    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Act
    await user.click(screen.getByRole('button', { name: /advance to voting/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockUpdateSession).toHaveBeenCalledWith(1, 10, { status: 'voting' });
    expect(screen.getByText('voting')).toBeInTheDocument();
  });

  test('"Delete Session" button is visible to owner/admin', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession() } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByRole('button', { name: 'Delete Session' })).toBeInTheDocument();
  });

  test('"Delete Session" button is NOT visible to a plain member', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: makeSession() } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'member' }) } as any);

    // Act
    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.queryByRole('button', { name: 'Delete Session' })).not.toBeInTheDocument();
  });

  test('Delete Session calls deleteSession and navigates back to the group', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    mockGetSession.mockResolvedValue({ data: makeSession() } as any);
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as any);
    mockDeleteSession.mockResolvedValue({} as any);

    render(<SessionPage />);
    await act(async () => { await Promise.resolve(); });

    // Act
    await user.click(screen.getByRole('button', { name: 'Delete Session' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockDeleteSession).toHaveBeenCalledWith(1, 10);
    expect(mockNavigate).toHaveBeenCalledWith('/group/1');
  });
});
