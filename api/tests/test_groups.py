"""
Route-level unit tests for the Call Time Groups API (TDD).

These tests will fail until the feature is implemented. Auth is stubbed via the
`as_user` fixture in conftest.py, which patches `app.routes.groups.get_current_user`.
Update that patch target when the auth decorator/helper is finalised.
"""
from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(clerk_id: str, username: str) -> User:
    return User(user_id=clerk_id, username=username)


def _make_group(owner: User, name: str = 'Test Group') -> Group:
    group = Group(name=name, created_by_id=owner.id)
    db.session.add(group)
    db.session.flush()
    db.session.add(GroupMember(user_id=owner.id, group_id=group.id, role='owner'))
    return group


def _add_member(user: User, group: Group, role: str = 'member') -> GroupMember:
    m = GroupMember(user_id=user.id, group_id=group.id, role=role)
    db.session.add(m)
    return m



# ===========================================================================
# Section 1 — Group Lifecycle
# ===========================================================================

def test_create_group_name_only(app, client, as_user):
    with app.app_context():
        user = _make_user('clerk_owner', 'owner')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    as_user(user_id)
    response = client.post('/api/groups', json={'name': 'Rialto House'})

    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == 'Rialto House'
    assert data['invite_code'] is not None

    with app.app_context():
        membership = GroupMember.query.filter_by(user_id=user_id, role='owner').first()
        assert membership is not None


def test_create_group_name_and_description(app, client, as_user):
    with app.app_context():
        user = _make_user('clerk_owner', 'owner')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    as_user(user_id)
    response = client.post('/api/groups', json={
        'name': 'Rialto House',
        'description': "Friday nights at Miguel's",
    })

    assert response.status_code == 201
    assert response.get_json()['description'] == "Friday nights at Miguel's"


def test_create_group_empty_name_returns_400(app, client, as_user):
    with app.app_context():
        user = _make_user('clerk_owner', 'owner')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    as_user(user_id)
    response = client.post('/api/groups', json={'name': ''})

    assert response.status_code == 400


def test_create_group_name_too_long_returns_400(app, client, as_user):
    with app.app_context():
        user = _make_user('clerk_owner', 'owner')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    as_user(user_id)
    response = client.post('/api/groups', json={'name': 'x' * 129})

    assert response.status_code == 400


def test_list_groups_returns_only_users_groups(app, client, as_user):
    with app.app_context():
        user = _make_user('clerk_user', 'user')
        other = _make_user('clerk_other', 'other')
        db.session.add_all([user, other])
        db.session.flush()

        _make_group(user, 'My Group')
        _make_group(other, 'Other Group')
        db.session.commit()
        user_id = user.id

    as_user(user_id)
    response = client.get('/api/groups')

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]['name'] == 'My Group'


def test_get_group_non_member_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        outsider = _make_user('clerk_other', 'other')
        db.session.add_all([owner, outsider])
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        outsider_id = outsider.id

    as_user(outsider_id)
    response = client.get(f'/api/groups/{group_id}')

    assert response.status_code == 403


def test_patch_group_as_owner_succeeds(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.patch(f'/api/groups/{group_id}', json={'name': 'New Name'})

    assert response.status_code == 200


def test_patch_group_as_admin_succeeds(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        db.session.add_all([owner, admin])
        db.session.flush()

        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        db.session.commit()
        group_id = group.id
        admin_id = admin.id

    as_user(admin_id)
    response = client.patch(f'/api/groups/{group_id}', json={'name': 'New Name'})

    assert response.status_code == 200


def test_patch_group_as_member_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        db.session.commit()
        group_id = group.id
        member_id = member.id

    as_user(member_id)
    response = client.patch(f'/api/groups/{group_id}', json={'name': 'New Name'})

    assert response.status_code == 403


def test_delete_group_as_owner_returns_204(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.delete(f'/api/groups/{group_id}')

    assert response.status_code == 204

    with app.app_context():
        assert db.session.get(Group, group_id) is None


def test_delete_group_as_admin_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        db.session.add_all([owner, admin])
        db.session.flush()

        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        db.session.commit()
        group_id = group.id
        admin_id = admin.id

    as_user(admin_id)
    response = client.delete(f'/api/groups/{group_id}')

    assert response.status_code == 403


# ===========================================================================
# Section 2 — Membership
# ===========================================================================

def test_join_via_valid_invite_code(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        joiner = _make_user('clerk_joiner', 'joiner')
        db.session.add_all([owner, joiner])
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        invite_code = group.invite_code
        group_id = group.id
        joiner_id = joiner.id

    as_user(joiner_id)
    response = client.post('/api/groups/join', json={'invite_code': invite_code})

    assert response.status_code in (200, 201)

    with app.app_context():
        membership = GroupMember.query.filter_by(user_id=joiner_id, group_id=group_id).first()
        assert membership is not None
        assert membership.role == 'member'


def test_join_second_time_returns_409(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        db.session.commit()
        invite_code = group.invite_code
        member_id = member.id

    as_user(member_id)
    response = client.post('/api/groups/join', json={'invite_code': invite_code})

    assert response.status_code == 409


def test_join_invalid_invite_code_returns_404(app, client, as_user):
    with app.app_context():
        user = _make_user('clerk_user', 'user')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    as_user(user_id)
    response = client.post('/api/groups/join', json={'invite_code': 'INVALID'})

    assert response.status_code == 404


def test_owner_cannot_leave_as_sole_member(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.delete(f'/api/groups/{group_id}/members/{owner_id}')

    assert response.status_code in (400, 403)


def test_admin_removes_plain_member(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, admin, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        _add_member(member, group, 'member')
        db.session.commit()
        group_id = group.id
        admin_id = admin.id
        member_id = member.id

    as_user(admin_id)
    response = client.delete(f'/api/groups/{group_id}/members/{member_id}')

    assert response.status_code == 204


def test_admin_removes_owner_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        db.session.add_all([owner, admin])
        db.session.flush()

        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        db.session.commit()
        group_id = group.id
        admin_id = admin.id
        owner_id = owner.id

    as_user(admin_id)
    response = client.delete(f'/api/groups/{group_id}/members/{owner_id}')

    assert response.status_code == 403


def test_member_removes_another_member_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member1 = _make_user('clerk_m1', 'member1')
        member2 = _make_user('clerk_m2', 'member2')
        db.session.add_all([owner, member1, member2])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member1, group, 'member')
        _add_member(member2, group, 'member')
        db.session.commit()
        group_id = group.id
        m1_id = member1.id
        m2_id = member2.id

    as_user(m1_id)
    response = client.delete(f'/api/groups/{group_id}/members/{m2_id}')

    assert response.status_code == 403


def test_member_leaves_group(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        db.session.commit()
        group_id = group.id
        member_id = member.id

    as_user(member_id)
    response = client.delete(f'/api/groups/{group_id}/members/{member_id}')

    assert response.status_code == 204


def test_owner_promotes_member_to_admin(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        db.session.commit()
        group_id = group.id
        owner_id = owner.id
        member_id = member.id

    as_user(owner_id)
    response = client.patch(
        f'/api/groups/{group_id}/members/{member_id}',
        json={'role': 'admin'},
    )

    assert response.status_code == 200

    with app.app_context():
        m = GroupMember.query.filter_by(user_id=member_id, group_id=group_id).first()
        assert m.role == 'admin'


def test_admin_promotes_member_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, admin, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        _add_member(member, group, 'member')
        db.session.commit()
        group_id = group.id
        admin_id = admin.id
        member_id = member.id

    as_user(admin_id)
    response = client.patch(
        f'/api/groups/{group_id}/members/{member_id}',
        json={'role': 'admin'},
    )

    assert response.status_code == 403


def test_regenerate_invite_code_as_owner(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id
        old_code = group.invite_code

    as_user(owner_id)
    response = client.post(f'/api/groups/{group_id}/invite/regenerate')

    assert response.status_code == 200
    assert response.get_json()['invite_code'] != old_code


def test_regenerate_invite_code_as_member_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        db.session.commit()
        group_id = group.id
        member_id = member.id

    as_user(member_id)
    response = client.post(f'/api/groups/{group_id}/invite/regenerate')

    assert response.status_code == 403


# ===========================================================================
# Section 3 — SSE Stream
# ===========================================================================

def test_member_subscribes_to_sse_stream(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.get(
        f'/api/groups/{group_id}/events',
        headers={'Accept': 'text/event-stream'},
    )

    assert response.status_code == 200
    assert 'text/event-stream' in response.content_type


def test_non_member_subscribes_to_sse_stream_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        outsider = _make_user('clerk_other', 'other')
        db.session.add_all([owner, outsider])
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        outsider_id = outsider.id

    as_user(outsider_id)
    response = client.get(
        f'/api/groups/{group_id}/events',
        headers={'Accept': 'text/event-stream'},
    )

    assert response.status_code == 403
