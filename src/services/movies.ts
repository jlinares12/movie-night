import api from '../utils/api';
import type { MovieSearchResult } from '../types/movies';

export const searchMovies = (q: string) =>
  api.get<MovieSearchResult[]>('/api/movies/search', { params: { q } });
