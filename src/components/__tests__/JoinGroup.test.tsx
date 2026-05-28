import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinGroup from '../JoinGroup';
import { joinGroup } from '../../services/groups';
import { ApiError } from '../../services/apiError';

jest.mock('../../services/groups');
const mockJoinGroup = joinGroup as jest.MockedFunction<typeof joinGroup>;

describe('JoinGroup', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders the invite code input and Join Group button', () => {
    // Arrange / Act
    render(<JoinGroup onJoined={jest.fn()} />);

    // Assert
    expect(screen.getByPlaceholderText('xxxxxxxx')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Group' })).toBeInTheDocument();
  });

  test('calls joinGroup with the trimmed invite code on button click', async () => {
    // Arrange
    const user = userEvent.setup();
    mockJoinGroup.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof joinGroup>>);
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('xxxxxxxx'), '  aB3xYz  ');
    await user.click(screen.getByRole('button', { name: 'Join Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockJoinGroup).toHaveBeenCalledWith('aB3xYz');
  });

  test('calls onJoined and clears the input after successfully joining', async () => {
    // Arrange
    const user = userEvent.setup();
    const onJoined = jest.fn();
    mockJoinGroup.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof joinGroup>>);
    render(<JoinGroup onJoined={onJoined} />);
    const input = screen.getByPlaceholderText('xxxxxxxx');

    // Act
    await user.type(input, 'aB3xYz');
    await user.click(screen.getByRole('button', { name: 'Join Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  test('shows "Invalid invite code" on a 404 response', async () => {
    // Arrange
    const user = userEvent.setup();
    mockJoinGroup.mockRejectedValue(new ApiError(404, 'Not found'));
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('xxxxxxxx'), 'badcode');
    await user.click(screen.getByRole('button', { name: 'Join Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('Invalid invite code.')).toBeInTheDocument();
  });

  test('shows "already a member" on a 409 response', async () => {
    // Arrange
    const user = userEvent.setup();
    mockJoinGroup.mockRejectedValue(new ApiError(409, 'Conflict'));
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('xxxxxxxx'), 'aB3xYz');
    await user.click(screen.getByRole('button', { name: 'Join Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText(/already a member/i)).toBeInTheDocument();
  });

  test('shows a validation error without calling the API when the code is empty', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<JoinGroup onJoined={jest.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Join Group' }));

    // Assert
    expect(screen.getByText(/code is required/i)).toBeInTheDocument();
    expect(mockJoinGroup).not.toHaveBeenCalled();
  });

  describe('input character filtering', () => {
    test('accepts uppercase and lowercase letters', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<JoinGroup onJoined={jest.fn()} />);
      const input = screen.getByPlaceholderText('xxxxxxxx');

      // Act
      await user.type(input, 'AbCdEfGh');

      // Assert
      expect(input).toHaveValue('AbCdEfGh');
    });

    test('accepts digits', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<JoinGroup onJoined={jest.fn()} />);
      const input = screen.getByPlaceholderText('xxxxxxxx');

      // Act
      await user.type(input, '12345678');

      // Assert
      expect(input).toHaveValue('12345678');
    });

    test('accepts hyphens', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<JoinGroup onJoined={jest.fn()} />);
      const input = screen.getByPlaceholderText('xxxxxxxx');

      // Act
      await user.type(input, 'ab-cd-ef');

      // Assert
      expect(input).toHaveValue('ab-cd-ef');
    });

    test('accepts underscores', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<JoinGroup onJoined={jest.fn()} />);
      const input = screen.getByPlaceholderText('xxxxxxxx');

      // Act
      await user.type(input, 'ab_cd_ef');

      // Assert
      expect(input).toHaveValue('ab_cd_ef');
    });

    test('accepts a realistic token_urlsafe code with mixed characters', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<JoinGroup onJoined={jest.fn()} />);
      const input = screen.getByPlaceholderText('xxxxxxxx');

      // Act
      await user.type(input, 'aB3-xY_z');

      // Assert
      expect(input).toHaveValue('aB3-xY_z');
    });

    test('strips characters outside the URL-safe base64 alphabet', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<JoinGroup onJoined={jest.fn()} />);
      const input = screen.getByPlaceholderText('xxxxxxxx');

      // Act
      await user.type(input, '!@#ab12');

      // Assert
      expect(input).toHaveValue('ab12');
    });

    test('submits a realistic invite code and calls joinGroup with the exact value', async () => {
      // Arrange
      const user = userEvent.setup();
      mockJoinGroup.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof joinGroup>>);
      render(<JoinGroup onJoined={jest.fn()} />);

      // Act
      await user.type(screen.getByPlaceholderText('xxxxxxxx'), 'aB3-xY_z');
      await user.click(screen.getByRole('button', { name: 'Join Group' }));
      await act(async () => { await Promise.resolve(); });

      // Assert
      expect(mockJoinGroup).toHaveBeenCalledWith('aB3-xY_z');
    });
  });
});
