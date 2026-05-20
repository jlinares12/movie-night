import os
import requests


class TMDBError(Exception):
    pass


_BASE = 'https://api.themoviedb.org/3'
_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
_TIMEOUT = 5


def _api_key() -> str:
    key = os.environ.get('TMDB_API_KEY')
    if not key:
        raise TMDBError('TMDB_API_KEY is not set')
    return key


def _get(path: str, params: dict | None = None) -> dict:
    params = params or {}
    params['api_key'] = _api_key()
    response = requests.get(f'{_BASE}{path}', params=params, timeout=_TIMEOUT)
    if not response.ok:
        raise TMDBError(f'TMDB request failed: {response.status_code} {response.text}')
    return response.json()


def _poster_url(path: str | None) -> str | None:
    return f'{_IMAGE_BASE}{path}' if path else None


def search_movies(query: str, page: int = 1) -> list[dict]:
    data = _get('/search/movie', {'query': query, 'page': page})
    results = []
    for item in data.get('results', []):
        results.append({
            'tmdb_id':           item['id'],
            'title':             item.get('title', ''),
            'original_title':    item.get('original_title'),
            'overview':          item.get('overview'),
            'poster_url':        _poster_url(item.get('poster_path')),
            'backdrop_url':      _poster_url(item.get('backdrop_path')),
            'release_date':      item.get('release_date') or None,
            'popularity':        item.get('popularity'),
            'vote_average':      item.get('vote_average'),
            'original_language': item.get('original_language'),
            'genres':            [],
            'runtime_minutes':   None,
        })
    return results


def get_movie_details(tmdb_id: int) -> dict:
    item = _get(f'/movie/{tmdb_id}')
    return {
        'tmdb_id':           item['id'],
        'title':             item.get('title', ''),
        'original_title':    item.get('original_title'),
        'overview':          item.get('overview'),
        'poster_url':        _poster_url(item.get('poster_path')),
        'backdrop_url':      _poster_url(item.get('backdrop_path')),
        'release_date':      item.get('release_date') or None,
        'popularity':        item.get('popularity'),
        'vote_average':      item.get('vote_average'),
        'original_language': item.get('original_language'),
        'genres':            [g['name'] for g in item.get('genres', [])],
        'runtime_minutes':   item.get('runtime'),
    }
