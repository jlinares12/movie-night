import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import NotFound from '../NotFound';

/*
 * `react-router-dom` is mocked wholesale, as everywhere else in this suite — importing it
 * for real pulls in `react-router`, which touches `TextEncoder` at module scope and is
 * absent from jsdom.
 */
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

/**
 * The catch-all route, and the last hard overflow in the app: it used to render two 384px
 * glyphs either side of a 384px icon box — roughly 1150px of fixed-width content in a
 * non-wrapping row, on a page with no gutter and no clipping ancestor. (Those sizes are
 * spelled out in prose rather than as class names on purpose: `tailwind.config.js`'s
 * content glob covers `src/**`, tests included, so a class name written in a comment here
 * would resurrect the very rule this file exists to keep out of the stylesheet.)
 *
 * jsdom has no layout engine and `identity-obj-proxy` stubs the CSS, so none of that is
 * measurable here; these assertions pin the *classes*, following `AuthenticationLayout`'s
 * and `IconButton`'s precedent. The measurement lives in `e2e/specs/mobile.layout.spec.ts`.
 */
describe('NotFound', () => {
  test('renders the 404 glyphs and the way back', () => {
    // Act
    render(<NotFound />);

    // Assert
    expect(screen.getAllByRole('heading', { name: '4' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/');
  });

  test('sizes all three glyphs off one fluid step rather than a fixed 384px', () => {
    // Act
    render(<NotFound />);

    // Assert — this is what catches someone reintroducing a fixed width. The cap and the
    // vw step have to stay identical across the two `4`s and the icon box, or the row
    // stops being three equal glyphs.
    for (const four of screen.getAllByRole('heading', { name: '4' })) {
      expect(four).toHaveClass('text-[min(22vw,384px)]');
      // Without this the `h1` base rule's 1.15 line-height makes the painted box taller
      // than the font size, and the arithmetic behind the 22vw step stops holding.
      expect(four).toHaveClass('leading-none');
    }

    const iconBox = screen.getByTestId('mock-icon').parentElement;
    expect(iconBox).toHaveClass('w-[min(22vw,384px)]', 'h-[min(22vw,384px)]');
  });

  test('carries its own page gutter, since it renders outside MainLayout', () => {
    // Act
    const { container } = render(<NotFound />);

    // Assert — as a top-level route it inherits nothing from `MainLayout`, so the
    // responsive gutter pair has to be on its own shell.
    const shell = container.firstElementChild!;
    expect(shell).toHaveClass('px-margin-mobile', 'lg:px-margin-desktop');
    // `min-h-screen`, not `h-screen`: a fixed viewport height clips overflowing content
    // instead of letting the page scroll.
    expect(shell).toHaveClass('min-h-screen');
    expect(shell).not.toHaveClass('h-screen');
  });

  test('gives the return link a 44px touch target', () => {
    // Act
    render(<NotFound />);

    // Assert — `type-headline-sm` (27px) plus `p-2` (16px) landed at 43px, one pixel
    // under the minimum, so the height is pinned rather than derived from padding.
    const link = screen.getByRole('link', { name: 'Return Home' });
    expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center', 'min-h-11');
    expect(link).not.toHaveClass('p-2');
  });

  test('is off the legacy CSS variable aliases', () => {
    // Act
    const { container } = render(<NotFound />);

    // Assert — this was the last file in `src/` still on `index.css`'s `--bk-color` /
    // `--primary-color` / `--text-color` aliases. The substitutions are 1:1, so this is
    // about keeping one colour vocabulary, not about appearance.
    expect(container.innerHTML).not.toMatch(/var\(--(bk|primary|text)-color\)/);
    expect(container.firstElementChild).toHaveClass('bg-surface');
  });
});
