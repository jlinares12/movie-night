import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import MobileMenu from '../MobileMenu';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));
jest.mock('@clerk/clerk-react', () => ({ useUser: jest.fn() }));
jest.mock('../../hooks/useLogout', () => ({ useLogout: () => mockLogout }));

const mockLogout = jest.fn();
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

const atPath = (pathname: string) =>
  mockUseLocation.mockReturnValue({ pathname } as ReturnType<typeof useLocation>);

const renderMenu = (open = true) => {
  const onClose = jest.fn();
  render(<MobileMenu id="mobile-menu" open={open} onClose={onClose} />);
  return { onClose };
};

describe('MobileMenu', () => {
  beforeEach(() => {
    atPath('/');
    mockUseUser.mockReturnValue({ user: { username: 'testuser' } } as ReturnType<typeof useUser>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  test('renders nothing while closed', () => {
    // Arrange / Act
    renderMenu(false);

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders the secondary destinations, logout and username when open', () => {
    // Arrange / Act
    renderMenu();

    // Assert
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('marks the current route with aria-current', () => {
    // Arrange
    atPath('/settings');

    // Act
    renderMenu();

    // Assert
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Help' })).not.toHaveAttribute('aria-current');
  });

  test('closes on Escape', async () => {
    // Arrange
    const { onClose } = renderMenu();
    onClose.mockClear();  // the mount-time route-change effect fires one no-op close

    // Act
    await userEvent.keyboard('{Escape}');

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes on backdrop click', async () => {
    // Arrange
    const { onClose } = renderMenu();
    onClose.mockClear();

    // Act — the backdrop is aria-hidden, so reach for it directly
    const backdrop = screen.getByRole('dialog').parentElement!.firstElementChild!;
    await userEvent.click(backdrop);

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes when the route changes', () => {
    // Arrange
    const onClose = jest.fn();
    const { rerender } = render(<MobileMenu id="mobile-menu" open onClose={onClose} />);
    onClose.mockClear();

    // Act
    atPath('/help');
    rerender(<MobileMenu id="mobile-menu" open onClose={onClose} />);

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('locks body scroll while open and restores it on close', () => {
    // Arrange
    const onClose = jest.fn();
    const { rerender } = render(<MobileMenu id="mobile-menu" open onClose={onClose} />);

    // Assert — locked
    expect(document.body.style.overflow).toBe('hidden');

    // Act
    rerender(<MobileMenu id="mobile-menu" open={false} onClose={onClose} />);

    // Assert — restored
    expect(document.body.style.overflow).toBe('');
  });

  test('moves focus into the sheet when it opens', () => {
    // Arrange / Act
    renderMenu();

    // Assert
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('logs out when Logout is pressed', async () => {
    // Arrange
    renderMenu();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    // Assert
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
