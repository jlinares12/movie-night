from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch

from app.extensions import db
from app.models.movie import Movie


_TMDB_MOVIE_ITEM = {
    'id': 27205,
    'title': 'Inception',
    'original_title': 'Inception',
    'overview': 'A thief who steals corporate secrets through dream-sharing.',
    'poster_path': '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    'backdrop_path': '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    'release_date': '2010-07-16',
    'popularity': 95.5,
    'vote_average': 8.8,
    'original_language': 'en',
    'genres': [{'id': 28, 'name': 'Action'}, {'id': 878, 'name': 'Science Fiction'}],
    'runtime': 148,
}

_TMDB_SEARCH_RESPONSE = {'results': [_TMDB_MOVIE_ITEM]}


def _ok_response(json_body):
    mock = Mock()
    mock.ok = True
    mock.json.return_value = json_body
    return mock


def _error_response(status_code):
    mock = Mock()
    mock.ok = False
    mock.status_code = status_code
    mock.text = 'Error'
    return mock


def test_search_missing_q_param_returns_400(client):
    response = client.get('/api/movies/search')

    assert response.status_code == 400


def test_search_empty_q_returns_400(client):
    response = client.get('/api/movies/search?q=')

    assert response.status_code == 400


def test_search_q_over_200_chars_returns_400(client):
    response = client.get(f'/api/movies/search?q={"x" * 201}')

    assert response.status_code == 400


def test_search_returns_movies_from_tmdb(client):
    with patch('app.services.tmdb_client.requests.get', return_value=_ok_response(_TMDB_SEARCH_RESPONSE)):
        response = client.get('/api/movies/search?q=inception')

    assert response.status_code == 200
    results = response.get_json()
    assert isinstance(results, list)
    assert len(results) == 1
    assert results[0]['title'] == 'Inception'
    assert results[0]['tmdb_id'] == 27205


def test_search_caches_results_in_database(app, client):
    with patch('app.services.tmdb_client.requests.get', return_value=_ok_response(_TMDB_SEARCH_RESPONSE)):
        client.get('/api/movies/search?q=inception')

    with app.app_context():
        movie = Movie.query.filter_by(tmdb_id=27205).first()
        assert movie is not None
        assert movie.title == 'Inception'


def test_search_when_tmdb_unavailable_returns_502(client):
    with patch('app.services.tmdb_client.requests.get', return_value=_error_response(503)):
        response = client.get('/api/movies/search?q=inception')

    assert response.status_code == 502


def test_get_movie_fetches_from_tmdb_when_not_cached(client):
    with patch('app.services.tmdb_client.requests.get', return_value=_ok_response(_TMDB_MOVIE_ITEM)) as mock_get:
        response = client.get('/api/movies/27205')
        assert mock_get.called

    assert response.status_code == 200
    assert response.get_json()['title'] == 'Inception'


def test_get_movie_returns_cached_result_without_calling_tmdb(app, client):
    with app.app_context():
        db.session.add(Movie(
            tmdb_id=27205,
            title='Inception',
            genres=[],
            cached_at=datetime.now(timezone.utc),
        ))
        db.session.commit()

    with patch('app.services.tmdb_client.requests.get') as mock_get:
        response = client.get('/api/movies/27205')
        assert mock_get.call_count == 0

    assert response.status_code == 200
    assert response.get_json()['title'] == 'Inception'


def test_get_movie_re_fetches_when_cache_is_stale(app, client):
    stale_time = datetime.now(timezone.utc) - timedelta(days=31)
    with app.app_context():
        db.session.add(Movie(
            tmdb_id=27205,
            title='Old Title',
            genres=[],
            cached_at=stale_time,
        ))
        db.session.commit()

    updated_item = {**_TMDB_MOVIE_ITEM, 'title': 'Inception Refreshed'}
    with patch('app.services.tmdb_client.requests.get', return_value=_ok_response(updated_item)) as mock_get:
        response = client.get('/api/movies/27205')
        assert mock_get.called

    assert response.status_code == 200
    assert response.get_json()['title'] == 'Inception Refreshed'


def test_get_movie_when_not_found_in_tmdb_returns_404(client):
    with patch('app.services.tmdb_client.requests.get', return_value=_error_response(404)):
        response = client.get('/api/movies/99999')

    assert response.status_code == 404


def test_get_movie_when_tmdb_fails_returns_502(client):
    with patch('app.services.tmdb_client.requests.get', return_value=_error_response(500)):
        response = client.get('/api/movies/99999')

    assert response.status_code == 502
