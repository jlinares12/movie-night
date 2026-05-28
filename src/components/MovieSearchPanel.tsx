import { useMovieSearch } from '../hooks/useMovieSearch';
import type { MovieSearchResult } from '../types/movies';

interface Props {
  onNominate: (movie: MovieSearchResult) => Promise<void>;
  nominatingId: number | null;
}

export default function MovieSearchPanel({ onNominate, nominatingId }: Props) {
  const { query, setQuery, results, loading } = useMovieSearch();

  return (
    <div className="flex flex-col gap-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a movie…"
        className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-md py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface text-body-md"
      />

      {loading && (
        <div role="progressbar" aria-label="Searching" className="text-label-sm text-on-surface-variant animate-pulse px-sm">
          Searching…
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-label-sm text-on-surface-variant px-sm py-md text-center">No movies found.</p>
      )}

      <ul className="flex flex-col gap-xs max-h-[360px] overflow-y-auto">
        {results.map((movie) => {
          const isNominating = nominatingId === movie.tmdb_id;
          return (
            <li key={movie.tmdb_id} className="flex items-center gap-sm p-sm bg-surface-container rounded-xl">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-[50px] h-[75px] rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-[50px] h-[75px] rounded bg-surface-container-high flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-label-md text-on-surface truncate">{movie.title}</p>
                {movie.release_date && (
                  <p className="text-label-sm text-on-surface-variant">{movie.release_date.slice(0, 4)}</p>
                )}
                {movie.vote_average != null && (
                  <p className="text-label-sm text-primary">★ {movie.vote_average.toFixed(1)}</p>
                )}
              </div>

              <button
                onClick={() => onNominate(movie)}
                disabled={isNominating}
                className="bg-primary text-on-primary text-label-sm font-bold px-sm py-xs rounded-lg disabled:opacity-50 flex-shrink-0"
              >
                Nominate
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
