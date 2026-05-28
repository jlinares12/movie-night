import { useState, useEffect } from 'react';
import { searchMovies } from '../services/movies';
import type { MovieSearchResult } from '../types/movies';

export function useMovieSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchMovies(query);
        setResults(res.data);
      } catch {
        setError('Search failed.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  return { query, setQuery, results, loading, error };
}
