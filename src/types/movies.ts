export interface MovieSearchResult {
  id: number;
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  release_date: string | null;
  vote_average: number | null;
  runtime_minutes: number | null;
}
