from datetime import datetime, timezone, date

from app.extensions import db
from app.models.movie import Movie
from app.services import tmdb_client


def _upsert_movie(data: dict) -> Movie:
    movie = Movie.query.filter_by(tmdb_id=data['tmdb_id']).first()
    if movie is None:
        movie = Movie(tmdb_id=data['tmdb_id'])
        db.session.add(movie)

    for field, value in data.items():
        if field == 'release_date' and isinstance(value, str) and value:
            try:
                value = date.fromisoformat(value)
            except ValueError:
                value = None
        setattr(movie, field, value)

    movie.cached_at = datetime.now(timezone.utc)
    db.session.commit()
    return movie


def search_movies(query: str) -> list[dict]:
    results = tmdb_client.search_movies(query)
    movies = [_upsert_movie(data) for data in results]
    return [m.to_dict() for m in movies]


def get_or_fetch_movie(tmdb_id: int) -> dict:
    movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
    if movie is not None and not movie.is_stale():
        return movie.to_dict()

    data = tmdb_client.get_movie_details(tmdb_id)
    movie = _upsert_movie(data)
    return movie.to_dict()
