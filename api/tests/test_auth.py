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
