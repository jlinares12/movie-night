import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import MobileTopBar from '../MobileTopBar';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));
jest.mock('@clerk/clerk-react', () => ({ useUser: jest.fn() }));
jest.mock('../../hooks/useLogout', () => ({ useLogout: () => jest.fn() }));

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

const hamburger = () => screen.getByRole('button', { name: 'Menu' });

describe('MobileTopBar', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/' } as ReturnType<typeof useLocation>);
    mockUseUser.mockReturnValue({ user: { username: 'testuser' } } as ReturnType<typeof useUser>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  test('starts collapsed, with the sheet closed', () => {
    // Arrange / Act
    render(<MobileTopBar />);

    // Assert
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('points aria-controls at the sheet it opens', async () => {
    // Arrange
    render(<MobileTopBar />);
    const controls = hamburger().getAttribute('aria-controls');

    // Act
    await userEvent.click(hamburger());

    // Assert
    expect(screen.getByRole('dialog')).toHaveAttribute('id', controls);
  });

  test('opens the sheet on click', async () => {
    // Arrange
    render(<MobileTopBar />);

    // Act
    await userEvent.click(hamburger());

    // Assert
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
  });

  test('toggles the sheet shut on a second click', async () => {
    // Arrange
    render(<MobileTopBar />);
    await userEvent.click(hamburger());

    // Act
    await userEvent.click(hamburger());

    // Assert
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('returns focus to the hamburger when the sheet closes', async () => {
    // Arrange
    render(<MobileTopBar />);
    await userEvent.click(hamburger());
    expect(hamburger()).not.toHaveFocus();

    // Act
    await userEvent.keyboard('{Escape}');

    // Assert
    expect(hamburger()).toHaveFocus();
  });

  test('does not steal focus on mount', () => {
    // Arrange / Act — the sheet's route-change effect fires a close on mount;
    // it must not pull focus to the hamburger on every page load.
    render(<MobileTopBar />);

    // Assert
    expect(hamburger()).not.toHaveFocus();
  });
});
