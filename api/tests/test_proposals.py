from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.movie_night_session import MovieNightSession
from app.models.movie_proposal import MovieProposal
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


def _make_session(group: Group, created_by: User, status: str = 'open') -> MovieNightSession:
    s = MovieNightSession(group_id=group.id, created_by_id=created_by.id, status=status)
    db.session.add(s)
    db.session.flush()
    return s


def _make_proposal(
    session: MovieNightSession,
    user: User,
    title: str = 'Inception',
    tmdb_id: int = 27205,
) -> MovieProposal:
    p = MovieProposal(session_id=session.id, proposed_by_id=user.id, title=title, tmdb_id=tmdb_id)
    db.session.add(p)
    db.session.flush()
    return p


# ===========================================================================
# POST /api/groups/<gid>/sessions/<sid>/proposals
# ===========================================================================

def test_create_proposal_as_member_returns_201(app, client, as_user):
    """Test that a group member can nominate a movie and receives 201."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member, group)
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        member_id = member.id

    # Act
    as_user(member_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'title': 'Inception', 'tmdb_id': 27205},
    )

    # Assert
    assert response.status_code == 201


def test_create_proposal_response_contains_expected_fields(app, client, as_user):
    """Test that a successful nomination returns all expected proposal fields."""

    # Arrange
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

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={
            'title': 'Inception',
            'tmdb_id': 27205,
            'poster_url': 'https://image.tmdb.org/t/p/w500/abc.jpg',
            'overview': 'A thief who steals corporate secrets.',
            'runtime_minutes': 148,
        },
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 201
    assert 'id' in data
    assert data['title'] == 'Inception'
    assert data['tmdb_id'] == 27205
    assert data['session_id'] == session_id
    assert 'proposed_by_id' in data
    assert data['poster_url'] == 'https://image.tmdb.org/t/p/w500/abc.jpg'
    assert data['overview'] == 'A thief who steals corporate secrets.'
    assert data['runtime_minutes'] == 148
    assert 'proposed_at' in data


def test_create_proposal_without_optional_fields_returns_201(app, client, as_user):
    """Test that only supplying title (no tmdb_id or other optionals) is accepted."""

    # Arrange
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

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'title': 'A Custom Movie'},
    )

    # Assert
    assert response.status_code == 201


def test_create_second_proposal_same_session_returns_409(app, client, as_user):
    """Test that a user who already nominated in a session cannot nominate again."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()
        group = _make_group(owner)
        session = _make_session(group, owner)
        _make_proposal(session, owner, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'title': 'The Matrix', 'tmdb_id': 603},
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'you already nominated a movie'


def test_create_proposal_duplicate_tmdb_id_returns_409(app, client, as_user):
    """Test that nominating the same TMDB movie already in the session returns 409."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member, group)
        session = _make_session(group, owner)
        _make_proposal(session, owner, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        member_id = member.id

    # Act
    as_user(member_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'title': 'Inception', 'tmdb_id': 27205},
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'this movie is already nominated'


def test_create_proposal_as_non_member_returns_403(app, client, as_user):
    """Test that a user who is not a group member cannot nominate a movie."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        outsider = _make_user('clerk_other', 'outsider')
        db.session.add_all([owner, outsider])
        db.session.flush()
        group = _make_group(owner)
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        outsider_id = outsider.id

    # Act
    as_user(outsider_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'title': 'Inception'},
    )

    # Assert
    assert response.status_code == 403


def test_create_proposal_session_not_open_returns_409(app, client, as_user):
    """Test that nominating when the session is not open returns 409."""

    # Arrange
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

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'title': 'Inception'},
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'nominations are closed'


def test_create_proposal_group_not_found_returns_404(app, client, as_user):
    """Test that using a non-existent group_id returns 404."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.commit()
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.post(
        '/api/groups/99999/sessions/1/proposals',
        json={'title': 'Inception'},
    )

    # Assert
    assert response.status_code == 404


def test_create_proposal_session_not_found_returns_404(app, client, as_user):
    """Test that using a non-existent session_id returns 404."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()
        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/99999/proposals',
        json={'title': 'Inception'},
    )

    # Assert
    assert response.status_code == 404


def test_create_proposal_session_wrong_group_returns_404(app, client, as_user):
    """Test that a session belonging to a different group returns 404."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()
        group1 = _make_group(owner, name='Group One')
        group2 = _make_group(owner, name='Group Two')
        session_in_group2 = _make_session(group2, owner)
        db.session.commit()
        group1_id = group1.id
        session_id = session_in_group2.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group1_id}/sessions/{session_id}/proposals',
        json={'title': 'Inception'},
    )

    # Assert
    assert response.status_code == 404


def test_create_proposal_missing_title_returns_400(app, client, as_user):
    """Test that omitting the required title field returns 400."""

    # Arrange
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

    # Act
    as_user(owner_id)
    response = client.post(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals',
        json={'tmdb_id': 27205},
    )

    # Assert
    assert response.status_code == 400


# ===========================================================================
# GET /api/groups/<gid>/sessions/<sid>/proposals
# ===========================================================================

def test_list_proposals_as_member_returns_200(app, client, as_user):
    """Test that a group member can list proposals and receives 200 with a list."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member, group)
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        member_id = member.id

    # Act
    as_user(member_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}/proposals')

    # Assert
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_list_proposals_includes_proposed_by_username(app, client, as_user):
    """Test that each proposal in the list includes the proposer's username."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner_user')
        db.session.add(owner)
        db.session.flush()
        group = _make_group(owner)
        session = _make_session(group, owner)
        _make_proposal(session, owner, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}/proposals')

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert len(data) == 1
    assert data[0]['proposed_by_username'] == 'owner_user'


def test_list_proposals_returns_all_proposals(app, client, as_user):
    """Test that all proposals seeded in a session are returned."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member, group)
        session = _make_session(group, owner)
        _make_proposal(session, owner, title='Inception', tmdb_id=27205)
        _make_proposal(session, member, title='The Matrix', tmdb_id=603)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}/proposals')

    # Assert
    assert response.status_code == 200
    assert len(response.get_json()) == 2


def test_list_proposals_empty_session_returns_empty_list(app, client, as_user):
    """Test that a session with no proposals returns an empty list."""

    # Arrange
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

    # Act
    as_user(owner_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}/proposals')

    # Assert
    assert response.status_code == 200
    assert response.get_json() == []


def test_list_proposals_as_non_member_returns_403(app, client, as_user):
    """Test that a non-member cannot list proposals."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        outsider = _make_user('clerk_other', 'outsider')
        db.session.add_all([owner, outsider])
        db.session.flush()
        group = _make_group(owner)
        session = _make_session(group, owner)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        outsider_id = outsider.id

    # Act
    as_user(outsider_id)
    response = client.get(f'/api/groups/{group_id}/sessions/{session_id}/proposals')

    # Assert
    assert response.status_code == 403


def test_list_proposals_group_not_found_returns_404(app, client, as_user):
    """Test that listing proposals for a non-existent group returns 404."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.commit()
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.get('/api/groups/99999/sessions/1/proposals')

    # Assert
    assert response.status_code == 404


def test_list_proposals_session_not_found_returns_404(app, client, as_user):
    """Test that listing proposals for a non-existent session returns 404."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()
        group = _make_group(owner)
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.get(f'/api/groups/{group_id}/sessions/99999/proposals')

    # Assert
    assert response.status_code == 404


# ===========================================================================
# DELETE /api/groups/<gid>/sessions/<sid>/proposals/<pid>
# ===========================================================================

def test_delete_proposal_as_proposer_returns_204(app, client, as_user):
    """Test that the user who created a proposal can delete it."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member, group)
        session = _make_session(group, owner)
        proposal = _make_proposal(session, member, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        proposal_id = proposal.id
        member_id = member.id

    # Act
    as_user(member_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 204


def test_delete_proposal_as_owner_returns_204(app, client, as_user):
    """Test that the group owner can delete any member's proposal."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member, group)
        session = _make_session(group, owner)
        proposal = _make_proposal(session, member, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        proposal_id = proposal.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 204


def test_delete_proposal_as_admin_returns_204(app, client, as_user):
    """Test that a group admin can delete any member's proposal."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        admin = _make_user('clerk_admin', 'admin_user')
        member = _make_user('clerk_member', 'member_user')
        db.session.add_all([owner, admin, member])
        db.session.flush()
        group = _make_group(owner)
        _add_member(admin, group, 'admin')
        _add_member(member, group)
        session = _make_session(group, owner)
        proposal = _make_proposal(session, member, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        proposal_id = proposal.id
        admin_id = admin.id

    # Act
    as_user(admin_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 204


def test_delete_proposal_as_other_member_returns_403(app, client, as_user):
    """Test that a regular member cannot delete another member's proposal."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        member1 = _make_user('clerk_m1', 'member_one')
        member2 = _make_user('clerk_m2', 'member_two')
        db.session.add_all([owner, member1, member2])
        db.session.flush()
        group = _make_group(owner)
        _add_member(member1, group)
        _add_member(member2, group)
        session = _make_session(group, owner)
        proposal = _make_proposal(session, member1, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        proposal_id = proposal.id
        member2_id = member2.id

    # Act
    as_user(member2_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 403


def test_delete_proposal_session_not_open_returns_409(app, client, as_user):
    """Test that deleting a proposal when the session is not open returns 409."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()
        group = _make_group(owner)
        session = _make_session(group, owner, status='voting')
        proposal = _make_proposal(session, owner, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        proposal_id = proposal.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'nominations are closed'


def test_delete_proposal_not_found_returns_404(app, client, as_user):
    """Test that deleting a non-existent proposal returns 404."""

    # Arrange
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

    # Act
    as_user(owner_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/99999'
    )

    # Assert
    assert response.status_code == 404


def test_delete_proposal_as_non_member_returns_403(app, client, as_user):
    """Test that a non-member cannot delete a proposal."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        outsider = _make_user('clerk_other', 'outsider')
        db.session.add_all([owner, outsider])
        db.session.flush()
        group = _make_group(owner)
        session = _make_session(group, owner)
        proposal = _make_proposal(session, owner, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session_id = session.id
        proposal_id = proposal.id
        outsider_id = outsider.id

    # Act
    as_user(outsider_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 403


def test_delete_proposal_wrong_session_returns_404(app, client, as_user):
    """Test that a proposal_id not belonging to the given session returns 404."""

    # Arrange
    with app.app_context():
        owner = _make_user('clerk_owner', 'owner')
        db.session.add(owner)
        db.session.flush()
        group = _make_group(owner)
        session1 = _make_session(group, owner)
        session2 = _make_session(group, owner)
        proposal = _make_proposal(session1, owner, title='Inception', tmdb_id=27205)
        db.session.commit()
        group_id = group.id
        session2_id = session2.id
        proposal_id = proposal.id
        owner_id = owner.id

    # Act
    as_user(owner_id)
    response = client.delete(
        f'/api/groups/{group_id}/sessions/{session2_id}/proposals/{proposal_id}'
    )

    # Assert
    assert response.status_code == 404
