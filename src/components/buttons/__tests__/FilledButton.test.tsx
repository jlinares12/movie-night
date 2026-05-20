import { render, screen } from '@testing-library/react';
import FilledButton from '../FilledButton';

describe('FilledButton', () => {
  test('renders the label text', () => {
    // Arrange
    const label = 'Submit';

    // Act
    render(<FilledButton label={label} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  test('is enabled by default when isDisabled is not provided', () => {
    // Arrange
    const label = 'Submit';

    // Act
    render(<FilledButton label={label} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).not.toBeDisabled();
  });

  test('is disabled when isDisabled is true', () => {
    // Arrange
    const label = 'Submit';

    // Act
    render(<FilledButton label={label} isDisabled={true} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toBeDisabled();
  });

  test('applies the pulse animation class when disabled', () => {
    // Arrange
    const label = 'Submit';

    // Act
    render(<FilledButton label={label} isDisabled={true} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toHaveClass('animate-pulse');
  });
});
