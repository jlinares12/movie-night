import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NominationCard, { NominationCardSkeleton } from '../NominationCard';
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

  describe('NominationCardSkeleton', () => {
    test('renders no interactive elements', () => {
      // Arrange / Act
      render(<NominationCardSkeleton />);

      // Assert
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    test('owns a single sweep for the whole card', () => {
      // Arrange / Act
      render(<NominationCardSkeleton />);

      // Assert
      expect(screen.getAllByTestId('skeleton-sweep')).toHaveLength(1);
    });

    test('announces the region once', () => {
      // Arrange / Act
      render(<NominationCardSkeleton />);

      // Assert
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getByRole('status')).toHaveTextContent('Loading nomination');
    });

    test('occupies the same box as the real card', () => {
      // Arrange / Act
      const { container: skeleton } = render(<NominationCardSkeleton />);
      const { container: card } = render(
        <NominationCard proposal={makeProposal()} canDelete={false} onDelete={jest.fn()} />
      );

      // Assert — the anti-jump guarantee
      const box = ['flex', 'gap-md', 'p-md', 'rounded-[20px]'];
      expect(skeleton.firstChild).toHaveClass(...box);
      expect(card.firstChild).toHaveClass(...box);
    });

    test('poster block matches the real poster footprint', () => {
      // Arrange / Act
      const { container } = render(<NominationCardSkeleton />);

      // Assert — the poster is the first block, and it is what makes the card 228px tall
      expect(container.querySelector('[data-testid="skeleton"]')).toHaveClass(
        'w-[120px]',
        'h-[180px]',
      );
    });

    test('overview stands in at the real card\'s three-line clamp', () => {
      // Arrange / Act
      render(<NominationCardSkeleton />);

      // Assert — the real overview is line-clamp-3, so three lines is its ceiling
      expect(screen.getAllByTestId('skeleton-line')).toHaveLength(3);
    });
  });
});
