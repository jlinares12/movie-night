import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import GroupPage from '../GroupPage';
import { getGroup, deleteGroup } from '../../services/groups';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ApiError } from '../../services/apiError';
import type { GroupDetail } from '../../types/groups';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn(), useParams: jest.fn(), Link: ({ children }: { children: ReactNode }) => children }));
jest.mock('../../services/groups');
jest.mock('../../hooks/useGroupEvents', () => ({ useGroupEvents: jest.fn() }));
jest.mock('../../hooks/useCurrentUser');
jest.mock('../../components/InviteCodePanel', () => ({
  default: () => <div data-testid="invite-panel" />,
}));
jest.mock('../../components/MemberList', () => ({
  default: () => <div data-testid="member-list" />,
}));
jest.mock('../../components/SessionList', () => ({
  default: () => <div data-testid="session-list" />,
}));

const mockNavigate = jest.fn();
const mockGetGroup = getGroup as jest.MockedFunction<typeof getGroup>;
const mockDeleteGroup = deleteGroup as jest.MockedFunction<typeof deleteGroup>;
const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

const makeGroupDetail = (overrides: Partial<GroupDetail> = {}): GroupDetail => ({
  id: 1,
  name: 'Rialto House',
  description: 'Friday nights',
  invite_code: 'abc123',
  created_by_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  your_role: 'owner',
  members: [],
  sessions: [],
  ...overrides,
});

describe('GroupPage', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockUseCurrentUser.mockReturnValue({ id: 1, user_id: 'clerk_abc', username: 'me', created_at: '' });
    mockNavigate.mockClear();
  });
  afterEach(() => jest.clearAllMocks());

  test('shows a prompt to select a group when no id param is provided', () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({});

    // Act
    render(<GroupPage />);

    // Assert
    expect(screen.getByText(/select a group/i)).toBeInTheDocument();
  });

  test('shows a loading indicator while fetching', () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    mockGetGroup.mockReturnValue(new Promise(() => {}));

    // Act
    render(<GroupPage />);

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders the group name after a successful fetch', async () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail() } as unknown as Awaited<ReturnType<typeof getGroup>>);

    // Act
    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('Rialto House')).toBeInTheDocument();
  });

  test('renders the invite panel, member list, and session list', async () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail() } as unknown as Awaited<ReturnType<typeof getGroup>>);

    // Act
    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByTestId('invite-panel')).toBeInTheDocument();
    expect(screen.getByTestId('member-list')).toBeInTheDocument();
    expect(screen.getByTestId('session-list')).toBeInTheDocument();
  });

  test('shows "Access denied" on a 403 response', async () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '2' });
    mockGetGroup.mockRejectedValue(new ApiError(403, 'Forbidden'));

    // Act
    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/access denied|not a member/i)).toBeInTheDocument();
  });

  test('shows "Group not found" on a 404 response', async () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '999' });
    mockGetGroup.mockRejectedValue(new ApiError(404, 'Not found'));

    // Act
    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  test('"Delete Group" button is visible to the owner', async () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as unknown as Awaited<ReturnType<typeof getGroup>>);

    // Act
    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByRole('button', { name: /delete group/i })).toBeInTheDocument();
  });

  test('"Delete Group" button is NOT visible to admin or member', async () => {
    // Arrange
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'admin' }) } as unknown as Awaited<ReturnType<typeof getGroup>>);

    // Act
    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.queryByRole('button', { name: /delete group/i })).not.toBeInTheDocument();
  });

  test('Delete Group calls deleteGroup and navigates to / after confirmation', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    mockGetGroup.mockResolvedValue({ data: makeGroupDetail({ your_role: 'owner' }) } as unknown as Awaited<ReturnType<typeof getGroup>>);
    mockDeleteGroup.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof deleteGroup>>);

    render(<GroupPage />);
    await act(async () => { await Promise.resolve(); });

    // Act
    await user.click(screen.getByRole('button', { name: /delete group/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockDeleteGroup).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
