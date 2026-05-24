import { render, screen, act } from '@testing-library/react';
import MovieGroups from '../MovieGroups';
import { listGroups } from '../../services/groups';
import type { GroupSummary } from '../../types/groups';

jest.mock('../../services/groups');
jest.mock('../GroupLink', () => ({
  default: ({ group }: { group: GroupSummary }) => (
    <li data-testid="group-link">{group.name}</li>
  ),
}));

const mockListGroups = listGroups as jest.MockedFunction<typeof listGroups>;

const makeGroup = (overrides: Partial<GroupSummary> = {}): GroupSummary => ({
  id: 1,
  name: 'Action Fans',
  description: null,
  invite_code: 'abc123',
  created_by_id: 1,
  created_at: '2024-01-10T00:00:00Z',
  member_count: 3,
  your_role: 'member',
  ...overrides,
});

describe('MovieGroups', () => {
  afterEach(() => jest.clearAllMocks());

  test('shows loading skeletons while the fetch is pending', () => {
    // Arrange
    mockListGroups.mockReturnValue(new Promise(() => {}));

    // Act
    render(<MovieGroups />);

    // Assert — skeletons render animated disabled "Open" buttons
    const openButtons = screen.getAllByRole('button', { name: 'Open' });
    expect(openButtons[0]).toBeDisabled();
  });

  test('renders a group card for each group returned by the API', async () => {
    // Arrange
    const groups = [makeGroup({ id: 1, name: 'Action Fans' }), makeGroup({ id: 2, name: 'Horror Club' })];
    mockListGroups.mockResolvedValue({ data: groups } as any);

    // Act
    render(<MovieGroups />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('Action Fans')).toBeInTheDocument();
    expect(screen.getByText('Horror Club')).toBeInTheDocument();
    expect(screen.getAllByTestId('group-link')).toHaveLength(2);
  });

  test('shows an empty-state message when the API returns no groups', async () => {
    // Arrange
    mockListGroups.mockResolvedValue({ data: [] } as any);

    // Act
    render(<MovieGroups />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('group-link')).not.toBeInTheDocument();
  });

  test('stays in loading state when the API call throws', async () => {
    // Arrange
    mockListGroups.mockRejectedValue(new Error('Network error'));

    // Act
    render(<MovieGroups />);
    await act(async () => { await Promise.resolve(); });

    // Assert — skeletons still present
    const openButtons = screen.getAllByRole('button', { name: 'Open' });
    expect(openButtons[0]).toBeDisabled();
  });

  test('exposes a refresh function via refreshRef', async () => {
    // Arrange
    mockListGroups.mockResolvedValue({ data: [makeGroup()] } as any);
    const refreshRef = { current: null as (() => void) | null };

    // Act
    render(<MovieGroups refreshRef={refreshRef} />);
    await act(async () => { await Promise.resolve(); });

    // Assert — ref is populated and callable
    expect(typeof refreshRef.current).toBe('function');
    mockListGroups.mockClear();
    await act(async () => { refreshRef.current!(); });
    expect(mockListGroups).toHaveBeenCalledTimes(1);
  });
});
