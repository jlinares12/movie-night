import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MovieSearchPanel from '../MovieSearchPanel';
import { useMovieSearch } from '../../hooks/useMovieSearch';
import type { MovieSearchResult } from '../../types/movies';

jest.mock('../../hooks/useMovieSearch');
const mockUseMovieSearch = jest.mocked(useMovieSearch);

const makeMovieSearchResult = (overrides: Partial<MovieSearchResult> = {}): MovieSearchResult => ({
  id: 1,
  tmdb_id: 101,
  title: 'Inception',
  original_title: 'Inception',
  overview: 'A mind-bending thriller.',
  poster_url: '/poster.jpg',
  release_date: '2010-07-16',
  vote_average: 8.8,
  runtime_minutes: 148,
  ...overrides,
});

const defaultHook = () => ({
  query: '',
  setQuery: jest.fn(),
  results: [] as MovieSearchResult[],
  loading: false,
  error: '',
});

describe('MovieSearchPanel', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders_searchInput', () => {
    // Arrange
    mockUseMovieSearch.mockReturnValue(defaultHook());

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={null} />);

    // Assert
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('shows_loadingIndicator_whenHookReportsLoading', () => {
    // Arrange
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), loading: true });

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={null} />);

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders_oneResultCard_perMovieInResults', () => {
    // Arrange
    const movies = [
      makeMovieSearchResult({ id: 1, tmdb_id: 101, title: 'Inception' }),
      makeMovieSearchResult({ id: 2, tmdb_id: 102, title: 'Interstellar' }),
    ];
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), results: movies });

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={null} />);

    // Assert
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Interstellar')).toBeInTheDocument();
  });

  test('shows_noMoviesFound_whenQueryIsNonEmptyAndResultsAreEmpty', () => {
    // Arrange
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), query: 'xyz', results: [] });

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={null} />);

    // Assert
    expect(screen.getByText(/no movies found/i)).toBeInTheDocument();
  });

  test('does_not_show_noMoviesFound_whenQueryIsEmpty', () => {
    // Arrange
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), query: '', results: [] });

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={null} />);

    // Assert
    expect(screen.queryByText(/no movies found/i)).not.toBeInTheDocument();
  });

  test('nominateButton_callsOnNominate_withCorrectMovie', async () => {
    // Arrange
    const user = userEvent.setup();
    const movie = makeMovieSearchResult();
    const onNominate = jest.fn();
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), results: [movie] });

    // Act
    render(<MovieSearchPanel onNominate={onNominate} nominatingId={null} />);
    await user.click(screen.getByRole('button', { name: /nominate/i }));

    // Assert
    expect(onNominate).toHaveBeenCalledWith(movie);
  });

  test('nominateButton_isDisabled_whenNominatingIdMatchesMovieTmdbId', () => {
    // Arrange
    const movie = makeMovieSearchResult({ tmdb_id: 101 });
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), results: [movie] });

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={101} />);

    // Assert
    expect(screen.getByRole('button', { name: /nominate/i })).toBeDisabled();
  });

  test('nominateButton_isNotDisabled_forDifferentMovieWhileAnotherIsLoading', () => {
    // Arrange
    const movies = [
      makeMovieSearchResult({ id: 1, tmdb_id: 101, title: 'Inception' }),
      makeMovieSearchResult({ id: 2, tmdb_id: 102, title: 'Interstellar' }),
    ];
    mockUseMovieSearch.mockReturnValue({ ...defaultHook(), results: movies });

    // Act
    render(<MovieSearchPanel onNominate={jest.fn()} nominatingId={101} />);
    const buttons = screen.getAllByRole('button', { name: /nominate/i });

    // Assert — first movie's button disabled, second movie's button enabled
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
  });
});
