import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberList from '../MemberList';
import { removeMember, updateMemberRole } from '../../services/groups';
import type { GroupMember } from '../../types/groups';

jest.mock('../../services/groups');
const mockRemove = removeMember as jest.MockedFunction<typeof removeMember>;
const mockUpdateRole = updateMemberRole as jest.MockedFunction<typeof updateMemberRole>;

const makeMember = (overrides: Partial<GroupMember>): GroupMember => ({
  id: 1,
  user_id: 10,
  group_id: 1,
  role: 'member',
  joined_at: '2024-01-01T00:00:00Z',
  username: 'alice',
  ...overrides,
});

const OWNER   = makeMember({ id: 1, user_id: 1, role: 'owner',  username: 'owner_user' });
const ADMIN   = makeMember({ id: 2, user_id: 2, role: 'admin',  username: 'admin_user' });
const MEMBER  = makeMember({ id: 3, user_id: 3, role: 'member', username: 'plain_user' });
const CURRENT = { id: 99, user_id: 'clerk', username: 'me', created_at: '' };

describe('MemberList', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders all member usernames', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[OWNER, ADMIN, MEMBER]}
        your_role="owner"
        currentUserId={999}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByText('owner_user')).toBeInTheDocument();
    expect(screen.getByText('admin_user')).toBeInTheDocument();
    expect(screen.getByText('plain_user')).toBeInTheDocument();
  });

  test('shows "(you)" next to the current user', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[MEMBER]}
        your_role="member"
        currentUserId={MEMBER.user_id}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  test('owner sees "Make Admin" button for plain members', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[MEMBER]}
        your_role="owner"
        currentUserId={1}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByTitle('Promote to admin')).toBeInTheDocument();
  });

  test('owner sees "Demote" button for admins', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[ADMIN]}
        your_role="owner"
        currentUserId={1}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByTitle('Demote to member')).toBeInTheDocument();
  });

  test('admin does NOT see promote or demote buttons', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[OWNER, MEMBER]}
        your_role="admin"
        currentUserId={ADMIN.user_id}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert
    expect(screen.queryByTitle('Promote to admin')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Demote to member')).not.toBeInTheDocument();
  });

  test('a member sees a "Leave" button for themselves only', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[OWNER, MEMBER]}
        your_role="member"
        currentUserId={MEMBER.user_id}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert — only their own Leave button
    const leaveButtons = screen.getAllByTitle('Leave group');
    expect(leaveButtons).toHaveLength(1);
    expect(screen.queryByTitle('Remove member')).not.toBeInTheDocument();
  });

  test('admin cannot remove the owner', () => {
    // Arrange / Act
    render(
      <MemberList
        groupId={1}
        members={[OWNER]}
        your_role="admin"
        currentUserId={ADMIN.user_id}
        onMembersChanged={jest.fn()}
      />
    );

    // Assert — no Remove button for the owner when caller is admin
    expect(screen.queryByTitle('Remove member')).not.toBeInTheDocument();
  });

  test('clicking "Make Admin" calls updateMemberRole and updates the list', async () => {
    // Arrange
    const user = userEvent.setup();
    const onMembersChanged = jest.fn();
    mockUpdateRole.mockResolvedValue({} as any);
    render(
      <MemberList
        groupId={1}
        members={[MEMBER]}
        your_role="owner"
        currentUserId={1}
        onMembersChanged={onMembersChanged}
      />
    );

    // Act
    await user.click(screen.getByTitle('Promote to admin'));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockUpdateRole).toHaveBeenCalledWith(1, MEMBER.user_id, 'admin');
    expect(onMembersChanged).toHaveBeenCalled();
  });

  test('clicking Remove calls removeMember and updates the list', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    const onMembersChanged = jest.fn();
    mockRemove.mockResolvedValue({} as any);
    render(
      <MemberList
        groupId={1}
        members={[MEMBER]}
        your_role="owner"
        currentUserId={1}
        onMembersChanged={onMembersChanged}
      />
    );

    // Act
    await user.click(screen.getByTitle('Remove member'));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockRemove).toHaveBeenCalledWith(1, MEMBER.user_id);
    expect(onMembersChanged).toHaveBeenCalled();
  });
});
