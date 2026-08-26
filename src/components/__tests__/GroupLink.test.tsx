import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import GroupLink, { GroupLinkSkeleton } from '../GroupLink';
import { removeMember } from '../../services/groups';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ApiError } from '../../services/apiError';
import type { GroupSummary } from '../../types/groups';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }));
jest.mock('../../services/groups');
jest.mock('../../hooks/useCurrentUser');

const mockNavigate = jest.fn();
const mockRemoveMember = removeMember as jest.MockedFunction<typeof removeMember>;
const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

const defaultGroup: GroupSummary = {
  id: 7,
  name: 'Action Fans',
  description: null,
  invite_code: 'xyz789',
  created_by_id: 1,
  created_at: '2024-01-15T00:00:00Z',
  member_count: 5,
  your_role: 'member',
};

describe('GroupLink', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockUseCurrentUser.mockReturnValue({ id: 42, user_id: 'clerk_abc', username: 'me', created_at: '' });
    mockNavigate.mockClear();
    mockRemoveMember.mockClear();
  });

  test('renders the group name', () => {
    // Arrange / Act
    render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

    // Assert
    expect(screen.getByText('Action Fans')).toBeInTheDocument();
  });

  test('renders the member count', () => {
    // Arrange / Act
    render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

    // Assert
    expect(screen.getByText(/5 members/i)).toBeInTheDocument();
  });

  test('renders "1 member" in singular when count is 1', () => {
    // Arrange
    const group = { ...defaultGroup, member_count: 1 };

    // Act
    render(<GroupLink group={group} onLeave={jest.fn()} />);

    // Assert
    expect(screen.getByText(/^1 member$/i)).toBeInTheDocument();
  });

  test('renders the user role badge', () => {
    // Arrange / Act
    render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

    // Assert — the role badge shows the role label
    expect(screen.getByText(/^Member$/)).toBeInTheDocument();
  });

  test('clicking the card navigates to the group detail page', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

    // Act
    await user.click(screen.getByText('Action Fans'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/group/7');
  });

  test('Leave Group button calls removeMember after confirmation', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    mockRemoveMember.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof removeMember>>);
    const onLeave = jest.fn();
    render(<GroupLink group={defaultGroup} onLeave={onLeave} />);

    // Act
    await user.click(screen.getByRole('button', { name: /leave/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockRemoveMember).toHaveBeenCalledWith(7, 42);
    expect(onLeave).toHaveBeenCalled();
  });

  test('Leave Group button does nothing when user cancels the confirmation', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(false);
    const onLeave = jest.fn();
    render(<GroupLink group={defaultGroup} onLeave={onLeave} />);

    // Act
    await user.click(screen.getByRole('button', { name: /leave/i }));

    // Assert
    expect(mockRemoveMember).not.toHaveBeenCalled();
    expect(onLeave).not.toHaveBeenCalled();
  });

  test('shows an alert when removeMember fails', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    global.alert = jest.fn();
    mockRemoveMember.mockRejectedValue(new ApiError(422, 'owner cannot leave as sole member'));
    render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: /leave/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(global.alert).toHaveBeenCalledWith('owner cannot leave as sole member');
  });

  test('Nominate Movie button is disabled', () => {
    // Arrange / Act
    render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Nominate Movie' })).toBeDisabled();
  });

  describe('GroupLinkSkeleton', () => {
    test('renders no interactive elements', () => {
      // Arrange / Act
      render(<GroupLinkSkeleton />);

      // Assert — the skeleton this replaced shipped three live disabled buttons
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    test('owns a single sweep for the whole card', () => {
      // Arrange / Act
      render(<GroupLinkSkeleton />);

      // Assert — the card catches one pass of light, not one per block
      expect(screen.getAllByTestId('skeleton-sweep')).toHaveLength(1);
    });

    test('announces once per card', () => {
      // Arrange / Act
      render(<GroupLinkSkeleton />);

      // Assert
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getByRole('status')).toHaveTextContent('Loading group');
    });

    test('occupies the same grid cell as the real card', () => {
      // Arrange / Act
      const { container: skeleton } = render(<GroupLinkSkeleton />);
      const { container: card } = render(<GroupLink group={defaultGroup} onLeave={jest.fn()} />);

      // Assert — the anti-jump guarantee: both roots span identically at every breakpoint.
      // No `col-span-12` base: the grid is single-column below `md`, where a 12-span would
      // conjure eleven implicit tracks and overflow 375px.
      const spans = ['md:col-span-6', 'lg:col-span-4'];
      expect(skeleton.firstChild).toHaveClass(...spans);
      expect(card.firstChild).toHaveClass(...spans);
    });

    test('hero block matches the real hero height', () => {
      // Arrange / Act
      const { container } = render(<GroupLinkSkeleton />);

      // Assert — the hero is the first block, and h-48 is what dominates the card's height
      expect(container.querySelector('[data-testid="skeleton"]')).toHaveClass('h-48');
    });
  });
});
