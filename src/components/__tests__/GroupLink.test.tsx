import { render, screen } from '@testing-library/react';
import GroupLink from '../GroupLink';

const defaultProps = {
  name: 'Action Movies',
  user_count: 5,
  date: '2024-01-15',
};

describe('GroupLink', () => {
  test('renders the group name', () => {
    // Arrange
    const { name, user_count, date } = defaultProps;

    // Act
    render(<GroupLink name={name} user_count={user_count} date={date} />);

    // Assert
    expect(screen.getByText('Action Movies')).toBeInTheDocument();
  });

  test('renders the member count', () => {
    // Arrange
    const { name, user_count, date } = defaultProps;

    // Act
    render(<GroupLink name={name} user_count={user_count} date={date} />);

    // Assert
    expect(screen.getByText('5 members')).toBeInTheDocument();
  });

  test('renders the date', () => {
    // Arrange
    const { name, user_count, date } = defaultProps;

    // Act
    render(<GroupLink name={name} user_count={user_count} date={date} />);

    // Assert
    expect(screen.getByText('Date: 2024-01-15')).toBeInTheDocument();
  });

  test('renders a Nominate Movie button', () => {
    // Arrange
    const { name, user_count, date } = defaultProps;

    // Act
    render(<GroupLink name={name} user_count={user_count} date={date} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Nominate Movie' })).toBeInTheDocument();
  });

  test('renders an Open button', () => {
    // Arrange
    const { name, user_count, date } = defaultProps;

    // Act
    render(<GroupLink name={name} user_count={user_count} date={date} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  test('renders a Leave Group button', () => {
    // Arrange
    const { name, user_count, date } = defaultProps;

    // Act
    render(<GroupLink name={name} user_count={user_count} date={date} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Leave Group' })).toBeInTheDocument();
  });
});
