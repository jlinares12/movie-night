import api from '../../utils/api';
import { searchMovies } from '../movies';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe('searchMovies', () => {
  afterEach(() => jest.clearAllMocks());

  test('searchMovies_withQuery_callsApiGetWithCorrectPathAndParams', async () => {
    // Arrange
    jest.mocked(api.get).mockResolvedValue({ data: [] });

    // Act
    await searchMovies('Inception');

    // Assert
    expect(api.get).toHaveBeenCalledWith('/api/movies/search', { params: { q: 'Inception' } });
  });

  test('searchMovies_withQuery_returnsApiResponse', async () => {
    // Arrange
    const response = { data: [{ id: 1, tmdb_id: 123, title: 'Inception' }] };
    jest.mocked(api.get).mockResolvedValue(response);

    // Act
    const result = await searchMovies('Inception');

    // Assert
    expect(result).toBe(response);
  });
});
