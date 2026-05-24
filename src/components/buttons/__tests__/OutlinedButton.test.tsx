import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutlinedButton from '../OutlinedButton';

describe('OutlinedButton', () => {
  test('renders the label text', () => {
    // Arrange
    const label = 'Nominate Movie';

    // Act
    render(<OutlinedButton label={label} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  test('is enabled by default when isDisabled is not provided', () => {
    // Arrange
    const label = 'Nominate Movie';

    // Act
    render(<OutlinedButton label={label} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).not.toBeDisabled();
  });

  test('is disabled when isDisabled is true', () => {
    // Arrange
    const label = 'Nominate Movie';

    // Act
    render(<OutlinedButton label={label} isDisabled={true} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toBeDisabled();
  });

  test('fires onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = jest.fn();

    // Act
    render(<OutlinedButton label="Copy" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
