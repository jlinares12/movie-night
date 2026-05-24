import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinGroup from '../JoinGroup';
import { joinGroup } from '../../services/groups';

jest.mock('../../services/groups');
const mockJoinGroup = joinGroup as jest.MockedFunction<typeof joinGroup>;

describe('JoinGroup', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders the invite code input and Join button', () => {
    // Arrange / Act
    render(<JoinGroup onJoined={jest.fn()} />);

    // Assert
    expect(screen.getByPlaceholderText(/group code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  });

  test('calls joinGroup with the trimmed invite code on button click', async () => {
    // Arrange
    const user = userEvent.setup();
    mockJoinGroup.mockResolvedValue({} as any);
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText(/group code/i), '  aB3xYz  ');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockJoinGroup).toHaveBeenCalledWith('aB3xYz');
  });

  test('calls onJoined and clears the input after successfully joining', async () => {
    // Arrange
    const user = userEvent.setup();
    const onJoined = jest.fn();
    mockJoinGroup.mockResolvedValue({} as any);
    render(<JoinGroup onJoined={onJoined} />);
    const input = screen.getByPlaceholderText(/group code/i);

    // Act
    await user.type(input, 'aB3xYz');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  test('shows "Invalid invite code" on a 404 response', async () => {
    // Arrange
    const user = userEvent.setup();
    mockJoinGroup.mockRejectedValue({ response: { status: 404 } });
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText(/group code/i), 'badcode');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('Invalid invite code.')).toBeInTheDocument();
  });

  test('shows "already a member" on a 409 response', async () => {
    // Arrange
    const user = userEvent.setup();
    mockJoinGroup.mockRejectedValue({ response: { status: 409 } });
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText(/group code/i), 'aB3xYz');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/already a member/i)).toBeInTheDocument();
  });

  test('shows a validation error without calling the API when the code is empty', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Join' }));

    // Assert
    expect(screen.getByText(/code is required/i)).toBeInTheDocument();
    expect(mockJoinGroup).not.toHaveBeenCalled();
  });
});
