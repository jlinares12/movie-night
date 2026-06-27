import { act, renderHook } from '@testing-library/react';
import { useMovieSearch } from '../useMovieSearch';
import { searchMovies } from '../../services/movies';

jest.mock('../../services/movies');
const mockSearchMovies = jest.mocked(searchMovies);

describe('useMovieSearch', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('useMovieSearch_onMount_hasEmptyResultsNoLoadingNoError', () => {
    // Arrange / Act
    const { result } = renderHook(() => useMovieSearch());

    // Assert
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  test('useMovieSearch_withEmptyQuery_doesNotCallSearchMovies', async () => {
    // Arrange
    const { result } = renderHook(() => useMovieSearch());

    // Act
    await act(async () => {
      result.current.setQuery('');
      jest.advanceTimersByTime(400);
    });

    // Assert
    expect(mockSearchMovies).not.toHaveBeenCalled();
  });

  test('useMovieSearch_withQueryBeforeDebounce_doesNotCallSearchMovies', () => {
    // Arrange
    const { result } = renderHook(() => useMovieSearch());

    // Act
    act(() => { result.current.setQuery('Inception'); });
    act(() => { jest.advanceTimersByTime(200); });

    // Assert
    expect(mockSearchMovies).not.toHaveBeenCalled();
  });

  test('useMovieSearch_withQueryAfterDebounce_callsSearchMoviesWithQuery', async () => {
    // Arrange
    mockSearchMovies.mockResolvedValue({ data: [] } as unknown as Awaited<ReturnType<typeof searchMovies>>);
    const { result } = renderHook(() => useMovieSearch());

    // Act
    act(() => { result.current.setQuery('Inception'); });
    await act(async () => { jest.advanceTimersByTime(300); });

    // Assert
    expect(mockSearchMovies).toHaveBeenCalledWith('Inception');
  });

  test('useMovieSearch_onSuccessfulSearch_setsResultsAndClearsLoading', async () => {
    // Arrange
    const movies = [{ id: 1, tmdb_id: 123, title: 'Inception' }];
    mockSearchMovies.mockResolvedValue({ data: movies } as unknown as Awaited<ReturnType<typeof searchMovies>>);
    const { result } = renderHook(() => useMovieSearch());

    // Act
    act(() => { result.current.setQuery('Inception'); });
    await act(async () => { jest.advanceTimersByTime(300); });

    // Assert
    expect(result.current.results).toEqual(movies);
    expect(result.current.loading).toBe(false);
  });

  test('useMovieSearch_onFailedSearch_setsErrorMessageAndKeepsResultsEmpty', async () => {
    // Arrange
    mockSearchMovies.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMovieSearch());

    // Act
    act(() => { result.current.setQuery('Inception'); });
    await act(async () => { jest.advanceTimersByTime(300); });

    // Assert
    expect(result.current.error).toBe('Search failed.');
    expect(result.current.results).toEqual([]);
  });

  test('useMovieSearch_whenQueryClearedAfterResults_resetsResultsToEmpty', async () => {
    // Arrange
    const movies = [{ id: 1, tmdb_id: 123, title: 'Inception' }];
    mockSearchMovies.mockResolvedValue({ data: movies } as unknown as Awaited<ReturnType<typeof searchMovies>>);
    const { result } = renderHook(() => useMovieSearch());
    act(() => { result.current.setQuery('Inception'); });
    await act(async () => { jest.advanceTimersByTime(300); });

    // Act
    act(() => { result.current.setQuery(''); });

    // Assert
    expect(result.current.results).toEqual([]);
  });
});
