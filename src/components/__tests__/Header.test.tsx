import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useClerk, useUser } from '@clerk/clerk-react';
import Header from '../Header';

jest.mock('@clerk/clerk-react', () => ({
  useUser: jest.fn(),
  useClerk: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children }: { children: any }) => <div>{children}</div>,
}));

describe('Header', () => {
  const mockSignOut = jest.fn();

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: { username: 'testuser' } });
    (useClerk as jest.Mock).mockReturnValue({ signOut: mockSignOut });
    mockSignOut.mockClear();
  });

  test('renders the username from Clerk', () => {
    // Arrange — mocks configured in beforeEach

    // Act
    render(<Header />);

    // Assert
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('renders a logout button', () => {
    // Arrange — mocks configured in beforeEach

    // Act
    render(<Header />);

    // Assert
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls signOut with the login redirect when logout is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Header />);
    const logoutButton = screen.getByRole('button');

    // Act
    await user.click(logoutButton);

    // Assert
    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/login' });
  });
});
