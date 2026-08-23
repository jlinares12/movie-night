import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import AuthenticationLayout from '../AuthenticationLayout';

/*
 * `react-router-dom` is mocked wholesale, as everywhere else in this suite — importing it
 * for real pulls in `react-router`, which touches `TextEncoder` at module scope and is
 * absent from jsdom.
 */
jest.mock('react-router-dom', () => ({
  Outlet: () => <p>sign-in card</p>,
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

/**
 * The shell for `/login` and `/register`. Its whole job at 375px is to stack, so the
 * assertions below are about breakpoint classes rather than appearance: this file's
 * previous incarnation put the Clerk card in a non-wrapping row beside a 300px logo and
 * pushed the document 210px past the viewport.
 */
describe('AuthenticationLayout', () => {
  test('renders the routed child through its outlet', () => {
    // Act
    render(<AuthenticationLayout />);

    // Assert
    expect(screen.getByText('sign-in card')).toBeInTheDocument();
  });

  test('steps the wordmark down below lg instead of dropping it', () => {
    // Act
    render(<AuthenticationLayout />);

    // Assert
    const wordmark = screen.getByRole('heading', { name: 'Call Time' });
    expect(wordmark).toHaveClass('type-display-lg-mobile', 'lg:type-display-lg');
  });

  test('keeps the 300px logo off small screens', () => {
    // Act
    render(<AuthenticationLayout />);

    // Assert — the icon itself is mocked, so assert on the wrapper that carries the
    // breakpoint. This is what catches someone reintroducing the glyph on mobile.
    const icon = screen.getByTestId('mock-icon');
    expect(icon.parentElement).toHaveClass('hidden', 'lg:block', 'w-[300px]', 'h-[250px]');
  });

  test('stacks to a column below lg and only becomes a row at lg', () => {
    // Act
    const { container } = render(<AuthenticationLayout />);

    // Assert — the row/gap pair is the actual overflow fix: gaps do not shrink, so
    // `gap-[10em]` must never apply below `lg`.
    const content = container.querySelector('.flex-1')!;
    expect(content).toHaveClass('flex-col', 'lg:flex-row', 'gap-lg', 'lg:gap-[10em]');
    expect(content).toHaveClass('px-margin-mobile', 'lg:px-margin-desktop');
  });

  test('gives every footer link a 44px touch target', () => {
    // Act
    render(<AuthenticationLayout />);

    // Assert
    for (const label of ['About', 'Github', 'Contact us', 'Privacy']) {
      expect(screen.getByRole('link', { name: label })).toHaveClass('min-h-11');
    }
  });

  test('drops the dead classes the old footer carried', () => {
    // Act
    const { container } = render(<AuthenticationLayout />);

    // Assert — `align-center` is not a Tailwind class and emitted nothing; `h-10` sat
    // alongside `h-[60px]` on the same element.
    const footer = container.querySelector('footer')!;
    expect(footer).not.toHaveClass('align-center');
    expect(footer).not.toHaveClass('h-10');
    expect(footer).not.toHaveClass('h-[60px]');
    expect(footer).toHaveClass('items-center', 'flex-wrap');
  });
});
