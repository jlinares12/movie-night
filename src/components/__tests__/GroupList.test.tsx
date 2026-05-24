import { render, screen, act } from '@testing-library/react';
import GroupList from '../GroupList';
import { listGroups } from '../../services/groups';
import type { GroupSummary } from '../../types/groups';

jest.mock('../../services/groups');
jest.mock('react-router-dom', () => ({
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockListGroups = listGroups as jest.MockedFunction<typeof listGroups>;

const makeGroup = (id: number, name: string): GroupSummary => ({
  id,
  name,
  description: null,
  invite_code: 'abc',
  created_by_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  member_count: 2,
  your_role: 'member',
});

describe('GroupList', () => {
  afterEach(() => jest.clearAllMocks());

  test('shows "No groups" when the API returns an empty list', async () => {
    // Arrange
    mockListGroups.mockResolvedValue({ data: [] } as any);

    // Act
    render(<GroupList />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/no groups/i)).toBeInTheDocument();
  });

  test('renders a link for each group returned by the API', async () => {
    // Arrange
    mockListGroups.mockResolvedValue({
      data: [makeGroup(1, 'Action Fans'), makeGroup(2, 'Horror Club')],
    } as any);

    // Act
    render(<GroupList />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('Action Fans')).toBeInTheDocument();
    expect(screen.getByText('Horror Club')).toBeInTheDocument();
  });

  test('each group link points to the correct group URL', async () => {
    // Arrange
    mockListGroups.mockResolvedValue({ data: [makeGroup(5, 'Cine Club')] } as any);

    // Act
    render(<GroupList />);
    await act(async () => { await Promise.resolve(); });

    // Assert
    const link = screen.getByRole('link', { name: 'Cine Club' });
    expect(link).toHaveAttribute('href', '/group/5');
  });
});
