import jwt
import httpx
from jwt import PyJWKClient, PyJWKClientError, DecodeError, ExpiredSignatureError
from flask import Blueprint, request, session, g, current_app, jsonify
from app.models import User
from app.extensions import db
from app.utils.auth import require_auth

bp = Blueprint('auth', __name__)

# One client per process; PyJWKClient caches signing keys internally.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(current_app.config['CLERK_JWKS_URL'])
    return _jwks_client


def _verify_clerk_token(token: str) -> str:
    """Return the Clerk user_id (sub) from a valid session JWT, or raise ValueError."""
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=['RS256'],
            options={'verify_aud': False},
        )
        return payload['sub']
    except (PyJWKClientError, DecodeError, ExpiredSignatureError, KeyError) as exc:
        raise ValueError('invalid token') from exc


def _fetch_and_create_user(user_id: str) -> 'User | None':
    """Call Clerk's API to get user details and insert a User row. Returns None on failure."""
    secret_key = current_app.config.get('CLERK_SECRET_KEY')
    if not secret_key:
        return None
    try:
        resp = httpx.get(
            f'https://api.clerk.com/v1/users/{user_id}',
            headers={'Authorization': f'Bearer {secret_key}'},
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()
        username = data.get('username') or user_id
        user = User(user_id=user_id, username=username)
        db.session.add(user)
        db.session.commit()
        return user
    except Exception:
        db.session.rollback()
        return None


@bp.route('/api/auth/session', methods=['POST'])
def create_session():
    data = request.get_json(silent=True)
    if not data or 'token' not in data:
        return jsonify({'error': 'token required'}), 400

    try:
        user_id = _verify_clerk_token(data['token'])
    except ValueError:
        return jsonify({'error': 'invalid token'}), 401

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        # Webhook hasn't synced this user yet — fetch from Clerk and create
        user = _fetch_and_create_user(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404

    session.clear()
    session['user_id'] = user.user_id
    session.permanent = True
    return jsonify({'user': {'id': user.user_id, 'username': user.username}}), 200


@bp.route('/api/auth/session', methods=['DELETE'])
def delete_session():
    session.clear()
    return jsonify({'message': 'logged out'}), 200


@bp.route('/api/auth/me', methods=['GET'])
@require_auth
def get_me():
    return jsonify(g.current_user.to_dict()), 200
