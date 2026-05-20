from flask import Blueprint, jsonify, request

from app.services import movie_service, tmdb_client

bp = Blueprint('movies', __name__, url_prefix='/api/movies')


@bp.get('/search')
def search():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'q is required'}), 400
    if len(q) > 200:
        return jsonify({'error': 'q must be 200 characters or fewer'}), 400

    try:
        results = movie_service.search_movies(q)
    except tmdb_client.TMDBError as exc:
        return jsonify({'error': str(exc)}), 502

    return jsonify(results)


@bp.get('/<int:tmdb_id>')
def get_movie(tmdb_id: int):
    try:
        movie = movie_service.get_or_fetch_movie(tmdb_id)
    except tmdb_client.TMDBError as exc:
        error_msg = str(exc)
        if '404' in error_msg:
            return jsonify({'error': 'Movie not found'}), 404
        return jsonify({'error': error_msg}), 502

    return jsonify(movie)
