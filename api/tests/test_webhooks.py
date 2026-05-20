from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User


def test_user_created_stores_user_in_database(app, webhook_post):
    response = webhook_post('user.created', {'id': 'clerk_abc', 'username': 'alice'})

    assert response.status_code == 201
    with app.app_context():
        user = User.query.filter_by(user_id='clerk_abc').first()
        assert user is not None
        assert user.username == 'alice'


def test_user_created_is_idempotent(app, webhook_post):
    webhook_post('user.created', {'id': 'clerk_abc', 'username': 'alice'})
    response = webhook_post('user.created', {'id': 'clerk_abc', 'username': 'alice'})

    assert response.status_code == 200
    with app.app_context():
        assert User.query.filter_by(user_id='clerk_abc').count() == 1


def test_user_updated_changes_username(app, webhook_post):
    webhook_post('user.created', {'id': 'clerk_abc', 'username': 'alice'})

    response = webhook_post('user.updated', {'id': 'clerk_abc', 'username': 'alice_new'})

    assert response.status_code == 200
    with app.app_context():
        user = User.query.filter_by(user_id='clerk_abc').first()
        assert user.username == 'alice_new'


def test_user_updated_for_nonexistent_user_returns_404(webhook_post):
    response = webhook_post('user.updated', {'id': 'clerk_ghost', 'username': 'nobody'})

    assert response.status_code == 404


def test_user_deleted_removes_user_from_database(app, webhook_post):
    webhook_post('user.created', {'id': 'clerk_abc', 'username': 'alice'})

    response = webhook_post('user.deleted', {'id': 'clerk_abc'})

    assert response.status_code == 200
    with app.app_context():
        assert User.query.filter_by(user_id='clerk_abc').first() is None


def test_user_deleted_as_sole_group_owner_deletes_group(app, webhook_post):
    with app.app_context():
        owner = User(user_id='clerk_owner', username='owner')
        db.session.add(owner)
        db.session.flush()

        group = Group(name='Lone Group', created_by_id=owner.id)
        db.session.add(group)
        db.session.flush()

        db.session.add(GroupMember(user_id=owner.id, group_id=group.id, role='owner'))
        db.session.commit()
        group_id = group.id

    webhook_post('user.deleted', {'id': 'clerk_owner'})

    with app.app_context():
        assert db.session.get(Group, group_id) is None


def test_user_deleted_as_owner_transfers_ownership_to_oldest_member(app, webhook_post):
    with app.app_context():
        owner = User(user_id='clerk_owner', username='owner')
        member = User(user_id='clerk_member', username='member')
        db.session.add_all([owner, member])
        db.session.flush()

        group = Group(name='Shared Group', created_by_id=owner.id)
        db.session.add(group)
        db.session.flush()

        db.session.add(GroupMember(user_id=owner.id, group_id=group.id, role='owner'))
        db.session.flush()
        db.session.add(GroupMember(user_id=member.id, group_id=group.id, role='member'))
        db.session.commit()
        group_id = group.id
        member_id = member.id

    webhook_post('user.deleted', {'id': 'clerk_owner'})

    with app.app_context():
        membership = GroupMember.query.filter_by(user_id=member_id, group_id=group_id).first()
        assert membership is not None
        assert membership.role == 'owner'


def test_unhandled_event_type_returns_200(webhook_post):
    response = webhook_post('session.created', {'id': 'session_xyz'})

    assert response.status_code == 200


def test_invalid_webhook_signature_returns_401(client):
    response = client.post(
        '/api/webhook/clerk',
        data=b'{"type":"user.created","data":{}}',
        content_type='application/json',
        headers={
            'svix-id': 'msg_bad',
            'svix-timestamp': '1234567890',
            'svix-signature': 'v1,invalidsignature',
        },
    )

    assert response.status_code == 401
