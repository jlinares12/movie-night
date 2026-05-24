import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateGroup from '../CreateGroup';
import { createGroup } from '../../services/groups';

jest.mock('../../services/groups');
const mockCreateGroup = createGroup as jest.MockedFunction<typeof createGroup>;

describe('CreateGroup', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders the name input and Create button', () => {
    // Arrange / Act
    render(<CreateGroup onCreated={jest.fn()} />);

    // Assert
    expect(screen.getByPlaceholderText(/group name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Group' })).toBeInTheDocument();
  });

  test('calls createGroup with the trimmed name on button click', async () => {
    // Arrange
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({} as any);
    render(<CreateGroup onCreated={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText(/group name/i), '  Weekend Club  ');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockCreateGroup).toHaveBeenCalledWith('Weekend Club');
  });

  test('calls createGroup when Enter is pressed in the input', async () => {
    // Arrange
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({} as any);
    render(<CreateGroup onCreated={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText(/group name/i), 'Horror Nights{Enter}');
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockCreateGroup).toHaveBeenCalledWith('Horror Nights');
  });

  test('calls onCreated and clears the input after a successful creation', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCreated = jest.fn();
    mockCreateGroup.mockResolvedValue({} as any);
    render(<CreateGroup onCreated={onCreated} />);
    const input = screen.getByPlaceholderText(/group name/i);

    // Act
    await user.type(input, 'My Group');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  test('shows an error message when the API returns 400', async () => {
    // Arrange
    const user = userEvent.setup();
    mockCreateGroup.mockRejectedValue({ response: { status: 400, data: { error: 'name is required' } } });
    render(<CreateGroup onCreated={jest.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText(/group name/i), 'x');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByText('name is required')).toBeInTheDocument();
  });

  test('shows a validation error without calling the API when the name is empty', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<CreateGroup onCreated={jest.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Create Group' }));

    // Assert
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });
});
