import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NominationCard from '../NominationCard';
import type { MovieProposal } from '../../types/groups';

const makeProposal = (overrides: Partial<MovieProposal> = {}): MovieProposal => ({
  id: 1,
  session_id: 10,
  proposed_by_id: 99,
  proposed_by_username: 'alice',
  title: 'Inception',
  tmdb_id: 123,
  poster_url: null,
  overview: 'A mind-bending thriller.',
  runtime_minutes: 148,
  proposed_at: '2024-03-01T00:00:00Z',
  ...overrides,
});

describe('NominationCard', () => {
  test('renders_movieTitle', () => {
    // Arrange / Act
    render(<NominationCard proposal={makeProposal()} canDelete={false} onDelete={jest.fn()} />);

    // Assert
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });

  test('renders_nominatorUsername', () => {
    // Arrange / Act
    render(<NominationCard proposal={makeProposal({ proposed_by_username: 'alice' })} canDelete={false} onDelete={jest.fn()} />);

    // Assert
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  test('renders_posterImage_whenPosterUrlIsSet', () => {
    // Arrange / Act
    render(<NominationCard proposal={makeProposal({ poster_url: '/poster.jpg' })} canDelete={false} onDelete={jest.fn()} />);

    // Assert
    expect(screen.getByRole('img')).toHaveAttribute('src', '/poster.jpg');
  });

  test('renders_noPosterImage_whenPosterUrlIsNull', () => {
    // Arrange / Act
    render(<NominationCard proposal={makeProposal({ poster_url: null })} canDelete={false} onDelete={jest.fn()} />);

    // Assert
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('shows_deleteButton_whenCanDeleteIsTrue', () => {
    // Arrange / Act
    render(<NominationCard proposal={makeProposal()} canDelete={true} onDelete={jest.fn()} />);

    // Assert
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('hides_deleteButton_whenCanDeleteIsFalse', () => {
    // Arrange / Act
    render(<NominationCard proposal={makeProposal()} canDelete={false} onDelete={jest.fn()} />);

    // Assert
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('clickingDeleteButton_callsOnDelete_withProposalId', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(<NominationCard proposal={makeProposal({ id: 7 })} canDelete={true} onDelete={onDelete} />);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(onDelete).toHaveBeenCalledWith(7);
  });
});
