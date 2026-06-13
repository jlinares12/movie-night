from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.call_time_session import CallTimeSession
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


def _make_session(group: Group, created_by: User, status: str = 'open') -> CallTimeSession:
    s = CallTimeSession(group_id=group.id, created_by_id=created_by.id, status=status)
    db.session.add(s)
    db.session.flush()
    return s


# ===========================================================================
# Create session
# ===========================================================================

def test_owner_creates_session_no_scheduled_for(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.post(f'/api/groups/{group_id}/sessions', json={})

    assert response.status_code == 201
    assert response.get_json()['status'] == 'open'


def test_admin_creates_session(app, client, as_user):
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
    response = client.post(f'/api/groups/{group_id}/sessions', json={})

    assert response.status_code == 201


def test_member_creates_session_returns_403(app, client, as_user):
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
    response = client.post(f'/api/groups/{group_id}/sessions', json={})

    assert response.status_code == 403


def test_create_session_malformed_scheduled_for_returns_400(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions',
        json={'scheduled_for': 'not-a-date'},
    )

    assert response.status_code == 400


def test_create_session_with_status_field_ignores_status(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions',
        json={'status': 'voting'},
    )

    assert response.status_code == 201
    assert response.get_json()['status'] == 'open'


# ===========================================================================
# List sessions
# ===========================================================================

def test_list_sessions_as_member(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        _make_session(group, owner)
        _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        member_id = member.id

    as_user(member_id)
    response = client.get(f'/api/groups/{group_id}/sessions')

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_list_sessions_non_member_returns_403(app, client, as_user):
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
    response = client.get(f'/api/groups/{group_id}/sessions')

    assert response.status_code == 403


# ===========================================================================
# Get session
# ===========================================================================

def test_get_session_as_member(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        member_id = member.id

    as_user(member_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}')

    assert response.status_code == 200
    assert response.get_json()['id'] == session_id


def test_get_session_not_found_returns_404(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.get(f'/api/groups/{group_id}/sessions/99999')

    assert response.status_code == 404


def test_get_session_non_member_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        outsider = _make_user('clerk_other', 'other')
        db.session.add_all([owner, outsider])
        db.session.flush()

        group = _make_group(owner)
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        outsider_id = outsider.id

    as_user(outsider_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}')

    assert response.status_code == 403


# ===========================================================================
# Update session
# ===========================================================================

def test_advance_status_open_to_voting(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        session = _make_session(group, owner, status='open')
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.patch(
        f'/api/groups/{group_id}/sessions/{session_id}',
        json={'status': 'voting'},
    )

    assert response.status_code == 200
    assert response.get_json()['status'] == 'voting'


def test_advance_status_voting_to_decided(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        session = _make_session(group, owner, status='voting')
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.patch(
        f'/api/groups/{group_id}/sessions/{session_id}',
        json={'status': 'decided'},
    )

    assert response.status_code == 200
    assert response.get_json()['status'] == 'decided'


def test_advance_status_decided_to_closed(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        session = _make_session(group, owner, status='decided')
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.patch(
        f'/api/groups/{group_id}/sessions/{session_id}',
        json={'status': 'closed'},
    )

    assert response.status_code == 200
    assert response.get_json()['status'] == 'closed'


def test_reverse_status_transition_returns_400(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        session = _make_session(group, owner, status='voting')
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.patch(
        f'/api/groups/{group_id}/sessions/{session_id}',
        json={'status': 'open'},
    )

    assert response.status_code == 400


def test_update_session_scheduled_for(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()

        group = _make_group(owner)
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    as_user(owner_id)
    response = client.patch(
        f'/api/groups/{group_id}/sessions/{session_id}',
        json={'scheduled_for': '2026-08-01T20:00:00Z'},
    )

    assert response.status_code == 200
    assert response.get_json()['scheduled_for'] is not None


# ===========================================================================
# Delete session
# ===========================================================================

def test_admin_deletes_session(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        db.session.add_all([owner, admin])
        db.session.flush()

        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        admin_id = admin.id

    as_user(admin_id)
    response = client.delete(f'/api/groups/{group_id}/sessions/{session_id}')

    assert response.status_code == 204


def test_member_deletes_session_returns_403(app, client, as_user):
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()

        group = _make_group(owner)
        _add_member(member, group, 'member')
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        member_id = member.id

    as_user(member_id)
    response = client.delete(f'/api/groups/{group_id}/sessions/{session_id}')

    assert response.status_code == 403
