import { render, screen } from '@testing-library/react';
import { UserProfile } from '@clerk/clerk-react';
import SettingsPage from '../Settings';
import { userProfileAppearance } from '../../utils/clerkAppearance';

jest.mock('@clerk/clerk-react', () => ({
  UserProfile: jest.fn(() => <div data-testid="user-profile" />),
}));

describe('SettingsPage', () => {
  test('renders the account management widget under a themed page header', () => {
    // Arrange — Clerk's widget is mocked; only the page shell is under test

    // Act
    render(<SettingsPage />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
  });

  test('hands the Midnight Neon appearance to Clerk', () => {
    // Arrange — the appearance is the whole point of the page; without it Clerk
    // falls back to its own light-mode defaults inside a dark app.

    // Act
    render(<SettingsPage />);

    // Assert
    expect((UserProfile as unknown as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({ appearance: userProfileAppearance }),
    );
  });
});
