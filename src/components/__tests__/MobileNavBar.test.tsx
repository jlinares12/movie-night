import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import MobileNavBar from '../MobileNavBar';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

const atPath = (pathname: string) =>
  mockUseLocation.mockReturnValue({ pathname } as ReturnType<typeof useLocation>);

describe('MobileNavBar', () => {
  afterEach(() => jest.clearAllMocks());

  test('exposes the three primary destinations by accessible name', () => {
    // Arrange
    atPath('/');

    // Act
    render(<MobileNavBar />);

    // Assert — the links are icon-only, so the name has to come from aria-label
    expect(screen.getByRole('link', { name: 'My Groups' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });

  test('names the landmark so it is distinguishable from the sheet nav', () => {
    // Arrange
    atPath('/');

    // Act
    render(<MobileNavBar />);

    // Assert
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  test('marks only the current route with aria-current', () => {
    // Arrange
    atPath('/discover');

    // Act
    render(<MobileNavBar />);

    // Assert
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'My Groups' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });
});
