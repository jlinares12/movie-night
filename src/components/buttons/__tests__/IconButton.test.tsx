import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IconButton from '../IconButton';

/**
 * jsdom has no layout engine and `identity-obj-proxy` stubs the CSS, so size is asserted
 * as classes rather than as pixels — the 44px minimum itself is proved by
 * `expectMinTouchTarget` in `e2e/specs/mobile.layout.spec.ts`, in a real browser.
 */
describe('IconButton', () => {
  test('renders the icon ligature', () => {
    // Arrange / Act
    render(<IconButton icon="refresh" title="Regenerate code" />);

    // Assert
    expect(screen.getByText('refresh')).toBeInTheDocument();
  });

  test('clears the 44px minimum touch target at every breakpoint', () => {
    // Arrange / Act
    render(<IconButton icon="person_remove" title="Remove member" />);

    // Assert — unprefixed on purpose: WCAG 2.5.8 is about pointer input generally, so this
    // must not become a `lg:`-only concession.
    expect(screen.getByRole('button')).toHaveClass(
      'inline-flex', 'items-center', 'justify-center', 'min-h-11', 'min-w-11',
    );
  });

  test('announces its title, not its Material Symbols ligature', () => {
    // Arrange
    const title = 'Remove member';

    // Act
    render(<IconButton icon="person_remove" title={title} />);

    // Assert — a ligature *is* text and `title` is only a fallback, so without an explicit
    // label this button announced itself as "person remove".
    expect(screen.getByRole('button', { name: title })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'person_remove' })).not.toBeInTheDocument();
  });

  test('hides the glyph from the accessibility tree', () => {
    // Arrange / Act
    render(<IconButton icon="logout" title="Leave group" />);

    // Assert — the other half of the pair above; the label only wins if the text is hidden
    expect(screen.getByText('logout')).toHaveAttribute('aria-hidden', 'true');
  });

  test('keeps the title attribute for its tooltip', () => {
    // Arrange / Act
    render(<IconButton icon="refresh" title="Regenerate code" />);

    // Assert
    expect(screen.getByTitle('Regenerate code')).toBeInTheDocument();
  });

  test('fires onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = jest.fn();

    // Act
    render(<IconButton icon="refresh" title="Regenerate code" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Regenerate code' }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when isDisabled is true', () => {
    // Arrange / Act
    render(<IconButton icon="refresh" title="Regenerate code" isDisabled />);

    // Assert
    expect(screen.getByRole('button', { name: 'Regenerate code' })).toBeDisabled();
  });

  test('spins the glyph while loading', () => {
    // Arrange / Act
    const { rerender } = render(<IconButton icon="refresh" title="Regenerate code" />);

    // Assert
    expect(screen.getByText('refresh')).not.toHaveClass('animate-spin');

    // Act
    rerender(<IconButton icon="refresh" title="Regenerate code" loading />);

    // Assert
    expect(screen.getByText('refresh')).toHaveClass('animate-spin');
  });

  test('sizes the glyph from the size prop, defaulting to 16px', () => {
    // Arrange / Act
    const { rerender } = render(<IconButton icon="refresh" title="Regenerate code" />);

    // Assert
    expect(screen.getByText('refresh')).toHaveStyle({ fontSize: '16px' });

    // Act
    rerender(<IconButton icon="refresh" title="Regenerate code" size={18} />);

    // Assert
    expect(screen.getByText('refresh')).toHaveStyle({ fontSize: '18px' });
  });

  test('applies the variant colours, defaulting to default', () => {
    // Arrange / Act
    const { rerender } = render(<IconButton icon="person_remove" title="Remove member" />);

    // Assert
    expect(screen.getByRole('button')).toHaveClass('hover:text-on-surface');

    // Act
    rerender(<IconButton icon="person_remove" title="Remove member" variant="danger" />);

    // Assert
    expect(screen.getByRole('button')).toHaveClass('hover:text-error');

    // Act
    rerender(<IconButton icon="arrow_upward" title="Promote to admin" variant="secondary" />);

    // Assert
    expect(screen.getByRole('button')).toHaveClass('hover:text-secondary');
  });
});
