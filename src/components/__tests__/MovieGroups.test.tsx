import { render, screen, act } from '@testing-library/react';
import axios from 'axios';
import MovieGroups from '../MovieGroups';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MovieGroups', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('shows loading skeletons while the fetch is pending', () => {
    // Arrange
    mockedAxios.get.mockReturnValue(new Promise(() => {}));

    // Act
    render(<MovieGroups />);

    // Assert — disabled Open buttons indicate the skeleton state is active
    const openButtons = screen.getAllByRole('button', { name: 'Open' });
    expect(openButtons[0]).toBeDisabled();
  });

  test('renders group cards after a successful fetch', async () => {
    // Arrange
    const groups = [
      { id: 1, name: 'Action Fans', user_count: 3, date: '2024-01-10' },
      { id: 2, name: 'Horror Club', user_count: 7, date: '2024-02-20' },
    ];
    mockedAxios.get.mockResolvedValue({ data: groups });

    // Act
    render(<MovieGroups />);
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(screen.getByText('Action Fans')).toBeInTheDocument();
    expect(screen.getByText('Horror Club')).toBeInTheDocument();
  });

  test('renders an empty list when the API returns no groups', async () => {
    // Arrange
    mockedAxios.get.mockResolvedValue({ data: [] });

    // Act
    render(<MovieGroups />);
    await act(async () => {
      await Promise.resolve();
    });

    // Assert — no "members" text means no group cards are rendered
    expect(screen.queryByText(/members/)).not.toBeInTheDocument();
  });

  test('stays in loading state when the API call throws', async () => {
    // Arrange
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    // Act
    render(<MovieGroups />);
    await act(async () => {
      await Promise.resolve();
    });

    // Assert — skeletons remain (disabled Open buttons) when loading stays true
    const openButtons = screen.getAllByRole('button', { name: 'Open' });
    expect(openButtons[0]).toBeDisabled();
  });
});
