import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DangerButton from '../DangerButton';

describe('DangerButton', () => {
  test('renders the label text', () => {
    // Arrange
    const label = 'Leave Group';

    // Act
    render(<DangerButton label={label} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  test('is enabled by default when isDisabled is not provided', () => {
    // Arrange
    const label = 'Leave Group';

    // Act
    render(<DangerButton label={label} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).not.toBeDisabled();
  });

  test('is disabled when isDisabled is true', () => {
    // Arrange
    const label = 'Leave Group';

    // Act
    render(<DangerButton label={label} isDisabled={true} />);

    // Assert
    expect(screen.getByRole('button', { name: label })).toBeDisabled();
  });

  test('fires onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = jest.fn();

    // Act
    render(<DangerButton label="Leave Group" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Leave Group' }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
