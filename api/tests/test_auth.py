import pytest
from unittest.mock import patch
from app.models import User
from app.extensions import db as _db


@pytest.fixture()
def test_user(app):
    user = User(user_id='user_test123', username='testuser')
    _db.session.add(user)
    _db.session.commit()
    return user.user_id


def _patch_verify(user_id):
    """Patch _verify_clerk_token to return a specific user_id string."""
    return patch('app.routes.auth._verify_clerk_token', return_value=user_id)


def _patch_verify_fail():
    """Patch _verify_clerk_token to raise ValueError (invalid token)."""
    return patch('app.routes.auth._verify_clerk_token', side_effect=ValueError('invalid token'))


class _FakeClerkResponse:
    def __init__(self, username):
        self._username = username

    def raise_for_status(self):
        pass

    def json(self):
        return {'username': self._username}


def _patch_clerk_user_fetch(username, on_fetch=None):
    """Patch the Clerk Backend API lookup in _fetch_and_create_user.

    on_fetch runs while the request is notionally out at the network, which is
    where a competing request can land its own insert.
    """

    def _get(*_args, **_kwargs):
        if on_fetch is not None:
            on_fetch()
        return _FakeClerkResponse(username)

    return patch('app.routes.auth.httpx.get', side_effect=_get)


def _with_clerk_secret(app):
    """Temporarily set CLERK_SECRET_KEY; the app fixture is session-scoped."""
    return patch.dict(app.config, {'CLERK_SECRET_KEY': 'sk_test_fake'})


class TestCreateSession:
    def test_valid_token(self, client, test_user):
        with _patch_verify('user_test123'):
            resp = client.post('/api/auth/session', json={'token': 'fake_token'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user']['id'] == 'user_test123'
        assert data['user']['username'] == 'testuser'

    def test_invalid_token(self, client, test_user):
        with _patch_verify_fail():
            resp = client.post('/api/auth/session', json={'token': 'bad_token'})
        assert resp.status_code == 401

    def test_missing_body(self, client):
        resp = client.post('/api/auth/session', content_type='application/json', data='')
        assert resp.status_code == 400

    def test_missing_token_field(self, client):
        resp = client.post('/api/auth/session', json={})
        assert resp.status_code == 400

    def test_user_not_in_db(self, client):
        with _patch_verify('user_unknown'):
            resp = client.post('/api/auth/session', json={'token': 'fake_token'})
        assert resp.status_code == 404

    def test_creates_user_missing_from_db(self, app, client):
        with _with_clerk_secret(app), _patch_verify('user_new'), _patch_clerk_user_fetch(
            'newuser'
        ):
            resp = client.post('/api/auth/session', json={'token': 'fake_token'})
        assert resp.status_code == 200
        assert resp.get_json()['user']['username'] == 'newuser'

    def test_concurrent_creation_of_same_user(self, app, client):
        """Losing the insert race must still authenticate, not 404.

        Two requests for a user with no row yet both miss the lookup and both
        try to insert. One wins; the other hits the unique constraint on
        user.user_id. That is a lost race, not a missing user.
        """

        def competing_insert():
            _db.session.add(User(user_id='user_raced', username='racedwinner'))
            _db.session.commit()

        with _with_clerk_secret(app), _patch_verify('user_raced'), _patch_clerk_user_fetch(
            'racedloser', on_fetch=competing_insert
        ):
            resp = client.post('/api/auth/session', json={'token': 'fake_token'})

        assert resp.status_code == 200
        # The winner's row is the one that survives, and it is what we sign in as.
        assert resp.get_json()['user']['username'] == 'racedwinner'
        assert User.query.filter_by(user_id='user_raced').count() == 1

    def test_clerk_fetch_failure_is_404(self, app, client):
        with _with_clerk_secret(app), _patch_verify('user_new'), patch(
            'app.routes.auth.httpx.get', side_effect=RuntimeError('clerk down')
        ):
            resp = client.post('/api/auth/session', json={'token': 'fake_token'})
        assert resp.status_code == 404


class TestDeleteSession:
    def test_clears_session(self, client, test_user):
        with _patch_verify('user_test123'):
            client.post('/api/auth/session', json={'token': 'fake_token'})
        resp = client.delete('/api/auth/session')
        assert resp.status_code == 200
        # session is gone — /me should now be 401
        assert client.get('/api/auth/me').status_code == 401

    def test_without_existing_session(self, client):
        resp = client.delete('/api/auth/session')
        assert resp.status_code == 200


class TestGetMe:
    def test_authenticated(self, client, test_user):
        with _patch_verify('user_test123'):
            client.post('/api/auth/session', json={'token': 'fake_token'})
        resp = client.get('/api/auth/me')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user_id'] == 'user_test123'
        assert data['username'] == 'testuser'

    def test_unauthenticated(self, client):
        resp = client.get('/api/auth/me')
        assert resp.status_code == 401


class TestRequireAuth:
    def test_protected_route_without_session(self, client):
        resp = client.get('/api/groups')
        assert resp.status_code == 401

    def test_protected_route_with_valid_session(self, client, test_user):
        with _patch_verify('user_test123'):
            client.post('/api/auth/session', json={'token': 'fake_token'})
        resp = client.get('/api/groups')
        assert resp.status_code == 200

    def test_protected_route_after_user_deleted(self, client, test_user):
        with _patch_verify('user_test123'):
            client.post('/api/auth/session', json={'token': 'fake_token'})
        user = User.query.filter_by(user_id='user_test123').first()
        _db.session.delete(user)
        _db.session.commit()
        resp = client.get('/api/groups')
        assert resp.status_code == 401
