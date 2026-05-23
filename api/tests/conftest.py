import json
import pytest
from unittest.mock import patch

from app import create_app
from app.extensions import db as _db
from app.models import User


@pytest.fixture(scope='session')
def app():
    application = create_app()
    application.config['TESTING'] = True
    with application.app_context():
        _db.create_all()
        yield application
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_db(app):
    yield
    with app.app_context():
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()
        _db.session.remove()


@pytest.fixture()
def authenticated_client(client):
    """Returns (client, user_id) with an active Flask session cookie."""
    user = User(user_id='user_authed_test', username='autheduser')
    _db.session.add(user)
    _db.session.commit()

    with patch('app.routes.auth._verify_clerk_token', return_value='user_authed_test'):
        client.post('/api/auth/session', json={'token': 'fake_token'})

    return client, 'user_authed_test'


@pytest.fixture()
def webhook_post(client):
    """POST a Clerk webhook event with signature verification bypassed."""
    def _post(event_type, data):
        payload = json.dumps({'type': event_type, 'data': data})
        msg = {'type': event_type, 'data': data}
        with patch('app.routes.webhooks.Webhook') as MockWebhook:
            MockWebhook.return_value.verify.return_value = msg
            return client.post(
                '/api/webhook/clerk',
                data=payload,
                content_type='application/json',
                headers={
                    'svix-id': 'msg_test_id',
                    'svix-timestamp': '1234567890',
                    'svix-signature': 'v1,fakesignature',
                },
            )
    return _post
