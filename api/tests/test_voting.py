import pytest
from sqlalchemy import ForeignKeyConstraint, text
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.call_time_session import CallTimeSession
from app.models.movie_proposal import MovieProposal
from app.models.user import User
from app.models.vote import Vote


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TITLES = ['Inception', 'Arrival', 'Heat', 'Alien', 'Fargo', 'Dune']


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


def _make_session(group: Group, created_by: User, status: str = 'voting') -> CallTimeSession:
    s = CallTimeSession(group_id=group.id, created_by_id=created_by.id, status=status)
    db.session.add(s)
    db.session.flush()
    return s


def _make_proposal(
    session: CallTimeSession,
    user: User,
    title: str = 'Inception',
    tmdb_id: int = 27205,
    poster_url: str = None,
) -> MovieProposal:
    p = MovieProposal(
        session_id=session.id,
        proposed_by_id=user.id,
        title=title,
        tmdb_id=tmdb_id,
        poster_url=poster_url,
    )
    db.session.add(p)
    db.session.flush()
    return p


def _make_vote(session_id: int, user_id: int, proposal_id: int) -> Vote:
    v = Vote(session_id=session_id, user_id=user_id, proposal_id=proposal_id)
    db.session.add(v)
    db.session.flush()
    return v


def _seed_voting_session(app, status='voting', n_proposals=3, n_members=2, prefix='a'):
    """Build a group (owner + admin + members), a session, and its nominations.

    `uq_proposal_user_session` allows one proposal per user per session, so every
    nomination needs its own proposer; extra members are created when
    `n_proposals` outruns the requested membership. Returns plain ids only — the
    `app` fixture is session-scoped, so ids are captured before the ORM objects
    detach.
    """
    with app.app_context():
        owner = _make_user(f'clerk_{prefix}_owner', f'{prefix}_owner')
        admin = _make_user(f'clerk_{prefix}_admin', f'{prefix}_admin')
        db.session.add_all([owner, admin])
        db.session.flush()

        group = _make_group(owner, name=f'{prefix.upper()} Group')
        _add_member(admin, group, 'admin')

        members = []
        for i in range(n_members):
            u = _make_user(f'clerk_{prefix}_m{i}', f'{prefix}_member_{i}')
            db.session.add(u)
            db.session.flush()
            _add_member(u, group)
            members.append(u)

        movie_session = _make_session(group, owner, status=status)

        proposers = [owner, admin] + members
        while len(proposers) < n_proposals:
            i = len(proposers)
            u = _make_user(f'clerk_{prefix}_p{i}', f'{prefix}_proposer_{i}')
            db.session.add(u)
            db.session.flush()
            _add_member(u, group)
            proposers.append(u)
            members.append(u)

        proposals = [
            _make_proposal(
                movie_session,
                proposers[i],
                title=_TITLES[i],
                tmdb_id=1000 + i,
                poster_url=f'https://image.tmdb.org/t/p/w500/{prefix}{i}.jpg',
            )
            for i in range(n_proposals)
        ]

        db.session.commit()

        return {
            'group_id': group.id,
            'session_id': movie_session.id,
            'owner_id': owner.id,
            'owner_username': owner.username,
            'admin_id': admin.id,
            'admin_username': admin.username,
            'member_ids': [m.id for m in members],
            'member_usernames': [m.username for m in members],
            'proposal_ids': [p.id for p in proposals],
            'proposal_titles': [p.title for p in proposals],
            'proposal_posters': [p.poster_url for p in proposals],
            'eligible_voters': 2 + len(members),
        }


def _seed_extra_session(app, group_id, proposer_ids, status='voting', n_proposals=1,
                        tmdb_base=5000):
    """A second session inside an existing group, with its own nominations."""
    with app.app_context():
        s = CallTimeSession(group_id=group_id, created_by_id=proposer_ids[0], status=status)
        db.session.add(s)
        db.session.flush()

        proposal_ids = []
        for i in range(n_proposals):
            p = MovieProposal(
                session_id=s.id,
                proposed_by_id=proposer_ids[i],
                title=_TITLES[i],
                tmdb_id=tmdb_base + i,
                poster_url=f'https://image.tmdb.org/t/p/w500/x{i}.jpg',
            )
            db.session.add(p)
            db.session.flush()
            proposal_ids.append(p.id)

        db.session.commit()
        return {'session_id': s.id, 'proposal_ids': proposal_ids}


def _seed_votes(app, session_id, pairs):
    """Write ballots straight to the table. `pairs` is [(user_id, proposal_id)]."""
    with app.app_context():
        for user_id, proposal_id in pairs:
            _make_vote(session_id, user_id, proposal_id)
        db.session.commit()


def _join_group(app, user_id, group_id, role='member'):
    """Add an existing user to an existing group."""
    with app.app_context():
        db.session.add(GroupMember(user_id=user_id, group_id=group_id, role=role))
        db.session.commit()


def _stored_votes(app, session_id=None, user_id=None):
    """Vote rows read straight from the database, as plain dicts."""
    with app.app_context():
        q = Vote.query
        if session_id is not None:
            q = q.filter_by(session_id=session_id)
        if user_id is not None:
            q = q.filter_by(user_id=user_id)
        return [v.to_dict() for v in q.order_by(Vote.id).all()]


def _all_keys(node):
    """Every key name appearing anywhere in a nested JSON structure."""
    keys = set()
    if isinstance(node, dict):
        for k, v in node.items():
            keys.add(k)
            keys |= _all_keys(v)
    elif isinstance(node, list):
        for item in node:
            keys |= _all_keys(item)
    return keys


def _entry(data, proposal_id):
    """The tally result entry for one proposal."""
    return next(r for r in data['results'] if r['proposal_id'] == proposal_id)


def _vote_has_compound_fk() -> bool:
    """True once `fk_vote_proposal_session` is restored on the Vote model."""
    return any(
        isinstance(c, ForeignKeyConstraint) and len(c.columns) > 1
        for c in Vote.__table__.constraints
    )


# ===========================================================================
# 1. PUT /api/groups/<gid>/sessions/<sid>/votes — casting
# ===========================================================================

def test_cast_vote_as_member_returns_201(app, client, as_user):
    """Test that a plain group member can cast a vote in a voting session."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 201


def test_cast_vote_response_contains_expected_fields(app, client, as_user):
    """Test that a first cast returns the documented vote fields and values."""

    # Arrange
    # ASSUMPTION 2: the contract example omits user_id while Vote.to_dict()
    # includes it. Only the four documented keys are pinned; the presence or
    # absence of user_id on the caller's own vote is deliberately not asserted.
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 201
    assert 'id' in data
    assert data['proposal_id'] == seed['proposal_ids'][0]
    assert data['session_id'] == seed['session_id']
    assert data['voted_at'] is not None


def test_cast_vote_as_owner_returns_201(app, client, as_user):
    """Test that the group owner votes on the same terms as a member."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['owner_id'])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][1]},
    )

    # Assert
    assert response.status_code == 201


def test_cast_vote_as_admin_returns_201(app, client, as_user):
    """Test that a group admin votes on the same terms as a member."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['admin_id'])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][1]},
    )

    # Assert
    assert response.status_code == 201


def test_cast_vote_creates_exactly_one_row(app, client, as_user):
    """Test that a single cast writes exactly one vote row."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert len(_stored_votes(app)) == 1


def test_cast_vote_persists_correct_user_and_session(app, client, as_user):
    """Test that the stored vote is attributed to the caller and this session."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]

    # Act
    as_user(voter_id)
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    rows = _stored_votes(app)
    assert len(rows) == 1
    assert rows[0]['user_id'] == voter_id
    assert rows[0]['session_id'] == seed['session_id']
    assert rows[0]['proposal_id'] == seed['proposal_ids'][0]


# ===========================================================================
# 2. Changing a vote
# ===========================================================================

def test_change_vote_returns_200(app, client, as_user):
    """Test that re-voting for a different nomination returns 200, not 201."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][0])])

    # Act
    as_user(voter_id)
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][1]},
    )

    # Assert
    assert response.status_code == 200


def test_change_vote_updates_proposal_id(app, client, as_user):
    """Test that changing a vote actually persists the new proposal_id."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][0])])

    # Act
    as_user(voter_id)
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][1]},
    )

    # Assert
    rows = _stored_votes(app)
    assert len(rows) == 1
    assert rows[0]['proposal_id'] == seed['proposal_ids'][1]


def test_change_vote_does_not_create_second_row(app, client, as_user):
    """Test that a change mutates the existing row (uq_vote_user_session)."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][0])])

    # Act
    as_user(voter_id)
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][2]},
    )

    # Assert
    assert len(_stored_votes(app, user_id=voter_id)) == 1


def test_repeat_vote_same_proposal_returns_200(app, client, as_user):
    """Test that re-sending the same proposal_id is idempotent, not a conflict."""

    # Arrange
    # ASSUMPTION 1: re-PUTting the proposal the caller already chose is an
    # idempotent no-op change (200), not a 409.
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][0])])

    # Act
    as_user(voter_id)
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    rows = _stored_votes(app)
    assert response.status_code == 200
    assert len(rows) == 1
    assert rows[0]['proposal_id'] == seed['proposal_ids'][0]


def test_change_vote_does_not_affect_other_members_vote(app, client, as_user):
    """Test that one member changing their vote leaves another member's intact."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_a, voter_b = seed['member_ids'][0], seed['member_ids'][1]
    _seed_votes(app, seed['session_id'], [
        (voter_a, seed['proposal_ids'][0]),
        (voter_b, seed['proposal_ids'][1]),
    ])

    # Act
    as_user(voter_a)
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][2]},
    )

    # Assert
    b_rows = _stored_votes(app, user_id=voter_b)
    assert len(b_rows) == 1
    assert b_rows[0]['proposal_id'] == seed['proposal_ids'][1]


# ===========================================================================
# 3. Phase gates
# ===========================================================================

def test_cast_vote_when_session_open_returns_409(app, client, as_user):
    """Test that voting before the phase opens returns 409."""

    # Arrange
    seed = _seed_voting_session(app, status='open')

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'voting has not started'


def test_cast_vote_when_session_decided_returns_409(app, client, as_user):
    """Test that voting after the session is decided returns 409."""

    # Arrange
    seed = _seed_voting_session(app, status='decided')

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'voting is closed'


def test_cast_vote_when_session_closed_returns_409(app, client, as_user):
    """Test that voting after the session is closed returns 409."""

    # Arrange
    seed = _seed_voting_session(app, status='closed')

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 409
    assert response.get_json()['error'] == 'voting is closed'


def test_vote_is_locked_after_decided(app, client, as_user):
    """Test that a ballot already cast cannot be altered once decided."""

    # Arrange
    seed = _seed_voting_session(app, status='decided')
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][0])])

    # Act
    as_user(voter_id)
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][1]},
    )

    # Assert
    # A 409 alone does not prove the ballot is frozen — the row could have been
    # written anyway. Re-read it.
    rows = _stored_votes(app)
    assert response.status_code == 409
    assert len(rows) == 1
    assert rows[0]['proposal_id'] == seed['proposal_ids'][0]


# ===========================================================================
# 4. Authentication — 401
#
# Route test files here normally leave 401 to test_auth.py. Voting duplicates
# it on purpose: an unauthenticated write would corrupt a tally.
# ===========================================================================

def test_cast_vote_unauthenticated_returns_401(app, client):
    """Test that casting a vote without a session cookie returns 401."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 401
    assert _stored_votes(app) == []


def test_get_my_vote_unauthenticated_returns_401(app, client):
    """Test that reading your own vote without a session cookie returns 401."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    assert response.status_code == 401


def test_get_tally_unauthenticated_returns_401(app, client):
    """Test that the tally is not readable without a session cookie."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 401


def test_cast_vote_after_user_deleted_returns_401(app, client, as_user):
    """Test that a session cookie for a deleted user cannot cast a vote."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][1]
    as_user(voter_id)
    with app.app_context():
        db.session.delete(db.session.get(User, voter_id))
        db.session.commit()

    # Act
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 401
    assert _stored_votes(app) == []


# ===========================================================================
# 5. Authorization — 403
# ===========================================================================

def test_cast_vote_as_non_member_returns_403(app, client, as_user):
    """Test that a user outside the group cannot cast a vote in it."""

    # Arrange
    seed = _seed_voting_session(app)
    outsider = _seed_voting_session(app, prefix='b')

    # Act
    as_user(outsider['owner_id'])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 403


def test_get_my_vote_as_non_member_returns_403(app, client, as_user):
    """Test that a non-member cannot read a vote inside someone else's group."""

    # Arrange
    seed = _seed_voting_session(app)
    outsider = _seed_voting_session(app, prefix='b')

    # Act
    as_user(outsider['owner_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    assert response.status_code == 403


def test_get_tally_as_non_member_returns_403(app, client, as_user):
    """Test that a non-member cannot read another group's tally."""

    # Arrange
    seed = _seed_voting_session(app)
    outsider = _seed_voting_session(app, prefix='b')

    # Act
    as_user(outsider['owner_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 403


def test_non_member_cast_creates_no_row(app, client, as_user):
    """Test that a blocked non-member cast leaves no vote row behind."""

    # Arrange
    seed = _seed_voting_session(app)
    outsider = _seed_voting_session(app, prefix='b')

    # Act
    as_user(outsider['owner_id'])
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert _stored_votes(app) == []


# ===========================================================================
# 6. Resource scoping — 404
# ===========================================================================

def test_cast_vote_group_not_found_returns_404(app, client, as_user):
    """Test that voting against a non-existent group returns 404."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        '/api/groups/999999/sessions/1/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 404


def test_cast_vote_session_not_found_returns_404(app, client, as_user):
    """Test that voting against a non-existent session returns 404."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/999999/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 404


def test_cast_vote_session_wrong_group_returns_404(app, client, as_user):
    """Test that a session belonging to a different group returns 404."""

    # Arrange
    # The caller is a member of both groups, so a 403 cannot mask the 404.
    seed = _seed_voting_session(app)
    other = _seed_voting_session(app, prefix='b')
    _join_group(app, seed['member_ids'][0], other['group_id'])

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{other["session_id"]}/votes',
        json={'proposal_id': other['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 404


def test_get_my_vote_session_wrong_group_returns_404(app, client, as_user):
    """Test that /votes/me is scoped to the group named in the URL."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_voting_session(app, prefix='b')
    _join_group(app, seed['member_ids'][0], other['group_id'])

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{other["session_id"]}/votes/me'
    )

    # Assert
    assert response.status_code == 404


def test_get_tally_session_wrong_group_returns_404(app, client, as_user):
    """Test that the tally is scoped to the group named in the URL."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_voting_session(app, prefix='b')
    _join_group(app, seed['member_ids'][0], other['group_id'])

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{other["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 404


# ===========================================================================
# 7. Cross-session vote injection
#
# Migration 3ee9a76f3481 dropped fk_vote_proposal_session, so nothing at the
# database level currently stops a vote from pointing at another session's
# proposal. The failure is silent — it surfaces only as a quietly wrong tally
# somewhere else, possibly in a group the voter never joined.
# ===========================================================================

def test_cast_vote_for_proposal_in_another_session_returns_404(app, client, as_user):
    """Test that a proposal from a sibling session cannot be voted for here."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_extra_session(app, seed['group_id'], [seed['owner_id']])

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': other['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 404
    assert response.get_json()['error'] == 'proposal not found'


def test_cast_vote_for_proposal_in_another_group_returns_404(app, client, as_user):
    """Test that a proposal from an unrelated group cannot be voted for here."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_voting_session(app, prefix='b')

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': other['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 404


def test_cross_session_vote_creates_no_row(app, client, as_user):
    """Test that a rejected cross-session vote writes nothing at all."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_extra_session(app, seed['group_id'], [seed['owner_id']])

    # Act
    as_user(seed['member_ids'][0])
    client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': other['proposal_ids'][0]},
    )

    # Assert
    assert _stored_votes(app) == []


def test_cast_vote_for_nonexistent_proposal_returns_404(app, client, as_user):
    """Test that voting for a proposal id that does not exist returns 404."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': 999999},
    )

    # Assert
    assert response.status_code == 404
    assert _stored_votes(app) == []


@pytest.mark.skipif(
    not _vote_has_compound_fk(),
    reason='fk_vote_proposal_session is not on the Vote model yet',
)
def test_db_rejects_cross_session_vote_directly(app):
    """Test that Postgres itself refuses a vote pointing at another session."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_extra_session(app, seed['group_id'], [seed['owner_id']])

    # Act / Assert
    # The route's 404 owns the HTTP semantics; this only proves the backstop.
    with app.app_context():
        _make_vote(
            seed['session_id'], seed['member_ids'][0], other['proposal_ids'][0]
        )
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()


# ===========================================================================
# 8. Gate ordering and information disclosure
#
# Each gate can be individually correct while the sequence still leaks
# existence information through response codes.
# ===========================================================================

def test_non_member_nonexistent_session_returns_403_not_404(app, client, as_user):
    """Test that membership is checked before session lookup."""

    # Arrange
    seed = _seed_voting_session(app)
    outsider = _seed_voting_session(app, prefix='b')

    # Act
    as_user(outsider['owner_id'])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/999999/votes',
        json={'proposal_id': seed['proposal_ids'][0]},
    )

    # Assert
    # A 404 here would let an outsider enumerate which session ids exist inside
    # a group they do not belong to.
    assert response.status_code == 403


def test_non_member_other_group_proposal_returns_403_not_404(app, client, as_user):
    """Test that membership is checked before proposal validation."""

    # Arrange
    seed = _seed_voting_session(app)
    outsider = _seed_voting_session(app, prefix='b')

    # Act
    as_user(outsider['owner_id'])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': outsider['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 403


def test_open_session_with_foreign_proposal_returns_409_not_404(app, client, as_user):
    """Test that the status gate runs before proposal validation."""

    # Arrange
    seed = _seed_voting_session(app, status='open')
    other = _seed_extra_session(app, seed['group_id'], [seed['owner_id']])

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': other['proposal_ids'][0]},
    )

    # Assert
    # A phase violation must not double as an oracle for whether some other
    # session's proposal id is real.
    assert response.status_code == 409


# ===========================================================================
# 9. Request body validation — 400
# ===========================================================================

def test_cast_vote_missing_proposal_id_returns_400(app, client, as_user):
    """Test that a body without proposal_id is rejected and writes nothing."""

    # Arrange
    # ASSUMPTION 3: a malformed proposal_id is a 400 carrying an 'error' key.
    # Only the status and the presence of that key are asserted, not its text.
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal': seed['proposal_ids'][0]},
    )

    # Assert
    assert response.status_code == 400
    assert 'error' in response.get_json()
    assert _stored_votes(app) == []


def test_cast_vote_null_proposal_id_returns_400(app, client, as_user):
    """Test that an explicit null proposal_id is rejected and writes nothing."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': None},
    )

    # Assert
    assert response.status_code == 400
    assert 'error' in response.get_json()
    assert _stored_votes(app) == []


def test_cast_vote_non_integer_proposal_id_returns_400(app, client, as_user):
    """Test that a non-integer proposal_id is rejected and writes nothing."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': 'not-an-int'},
    )

    # Assert
    assert response.status_code == 400
    assert 'error' in response.get_json()
    assert _stored_votes(app) == []


def test_cast_vote_empty_body_returns_400(app, client, as_user):
    """Test that an empty JSON body is rejected and writes nothing."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={},
    )

    # Assert
    assert response.status_code == 400
    assert 'error' in response.get_json()
    assert _stored_votes(app) == []


# ===========================================================================
# 10. GET /api/groups/<gid>/sessions/<sid>/votes/me
# ===========================================================================

def test_get_my_vote_before_voting_returns_200_with_nulls(app, client, as_user):
    """Test that a member who has not voted gets nulls, not an error."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert data['proposal_id'] is None
    assert data['voted_at'] is None


def test_get_my_vote_before_voting_is_not_404(app, client, as_user):
    """Test that an unvoted ballot is never reported as a 404."""

    # Arrange
    # src/services/apiError.ts turns every non-2xx into a thrown ApiError, so
    # "you haven't voted yet" has to be a state, not an error.
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    assert response.status_code != 404


def test_get_my_vote_after_voting_reflects_choice(app, client, as_user):
    """Test that /votes/me returns the caller's current selection."""

    # Arrange
    # ASSUMPTION 4: the body is a superset of {proposal_id, voted_at}; any extra
    # keys are not pinned.
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][1])])

    # Act
    as_user(voter_id)
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert data['proposal_id'] == seed['proposal_ids'][1]
    assert data['voted_at'] is not None


def test_get_my_vote_isolated_per_member(app, client, as_user):
    """Test that a member sees only their own ballot, never another member's."""

    # Arrange
    seed = _seed_voting_session(app)
    voter_a, voter_b = seed['member_ids'][0], seed['member_ids'][1]
    _seed_votes(app, seed['session_id'], [
        (voter_a, seed['proposal_ids'][0]),
        (voter_b, seed['proposal_ids'][1]),
    ])

    # Act
    as_user(voter_b)
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    assert response.status_code == 200
    assert response.get_json()['proposal_id'] == seed['proposal_ids'][1]


def test_get_my_vote_readable_after_decided(app, client, as_user):
    """Test that a frozen ballot is still readable once the session is decided."""

    # Arrange
    seed = _seed_voting_session(app, status='decided')
    voter_id = seed['member_ids'][0]
    _seed_votes(app, seed['session_id'], [(voter_id, seed['proposal_ids'][0])])

    # Act
    as_user(voter_id)
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/me'
    )

    # Assert
    assert response.status_code == 200
    assert response.get_json()['proposal_id'] == seed['proposal_ids'][0]


# ===========================================================================
# 11. GET /api/groups/<gid>/sessions/<sid>/votes/tally — counts and shape
# ===========================================================================

def test_get_tally_returns_expected_top_level_keys(app, client, as_user):
    """Test that the tally carries the five documented top-level keys."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert data['session_status'] == 'voting'
    assert data['total_votes'] == 0
    assert data['eligible_voters'] == seed['eligible_voters']
    assert data['identities_revealed'] is False
    assert isinstance(data['results'], list)


def test_tally_counts_votes_per_proposal(app, client, as_user):
    """Test that each nomination reports its own vote count."""

    # Arrange
    seed = _seed_voting_session(app)
    pids = seed['proposal_ids']
    _seed_votes(app, seed['session_id'], [
        (seed['owner_id'], pids[0]),
        (seed['admin_id'], pids[0]),
        (seed['member_ids'][0], pids[1]),
    ])

    # Act
    as_user(seed['member_ids'][1])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert _entry(data, pids[0])['vote_count'] == 2
    assert _entry(data, pids[1])['vote_count'] == 1
    assert _entry(data, pids[2])['vote_count'] == 0


def test_tally_total_votes_matches_votes_cast(app, client, as_user):
    """Test that total_votes equals the number of ballots in this session."""

    # Arrange
    seed = _seed_voting_session(app)
    _seed_votes(app, seed['session_id'], [
        (seed['owner_id'], seed['proposal_ids'][0]),
        (seed['admin_id'], seed['proposal_ids'][1]),
    ])

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    assert response.get_json()['total_votes'] == 2


def test_tally_includes_zero_vote_proposals(app, client, as_user):
    """Test that nominations with no votes still appear, with vote_count 0."""

    # Arrange
    seed = _seed_voting_session(app)
    _seed_votes(app, seed['session_id'], [(seed['owner_id'], seed['proposal_ids'][0])])

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert {r['proposal_id'] for r in data['results']} == set(seed['proposal_ids'])
    assert _entry(data, seed['proposal_ids'][2])['vote_count'] == 0


def test_tally_sorted_by_vote_count_desc_then_proposal_id_asc(app, client, as_user):
    """Test that ordering is count descending, then proposal_id ascending."""

    # Arrange
    seed = _seed_voting_session(app, n_proposals=4, n_members=2)
    pids = seed['proposal_ids']
    _seed_votes(app, seed['session_id'], [
        (seed['owner_id'], pids[0]),
        (seed['admin_id'], pids[0]),
        (seed['member_ids'][0], pids[1]),
        (seed['member_ids'][1], pids[2]),
    ])

    # Act
    as_user(seed['owner_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    # pids[1] and pids[2] are tied at one vote each; the lower id wins the tie.
    ordering = [r['proposal_id'] for r in response.get_json()['results']]
    assert ordering == [pids[0], pids[1], pids[2], pids[3]]


def test_tally_eligible_voters_matches_group_member_count(app, client, as_user):
    """Test that eligible_voters counts the group's members, not the votes cast."""

    # Arrange
    seed = _seed_voting_session(app, n_proposals=2, n_members=3)
    _seed_votes(app, seed['session_id'], [(seed['owner_id'], seed['proposal_ids'][0])])

    # Act
    as_user(seed['owner_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['eligible_voters'] == 5
    assert data['total_votes'] == 1


def test_tally_entries_include_title_and_poster_url(app, client, as_user):
    """Test that each entry carries enough movie detail to render a card."""

    # Arrange
    seed = _seed_voting_session(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    entry = _entry(response.get_json(), seed['proposal_ids'][0])
    assert entry['title'] == seed['proposal_titles'][0]
    assert entry['poster_url'] == seed['proposal_posters'][0]


def test_tally_session_without_proposals_returns_empty_results(app, client, as_user):
    """Test that a session with no nominations yields an empty results list."""

    # Arrange
    seed = _seed_voting_session(app, n_proposals=0, n_members=1)

    # Act
    as_user(seed['owner_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert data['results'] == []
    assert data['total_votes'] == 0


def test_tally_during_open_session_returns_zero_counts(app, client, as_user):
    """Test that the tally is readable before voting opens, showing all zeros."""

    # Arrange
    # ASSUMPTION 5: the GET routes are not phase-gated — only writes are.
    seed = _seed_voting_session(app, status='open')

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    data = response.get_json()
    assert response.status_code == 200
    assert data['session_status'] == 'open'
    assert data['total_votes'] == 0
    assert all(r['vote_count'] == 0 for r in data['results'])


def test_tally_excludes_votes_from_another_session(app, client, as_user):
    """Test that a sibling session's ballots never inflate this session's count."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_extra_session(app, seed['group_id'], [seed['owner_id']])
    _seed_votes(app, seed['session_id'], [(seed['owner_id'], seed['proposal_ids'][0])])
    _seed_votes(app, other['session_id'], [(seed['admin_id'], other['proposal_ids'][0])])

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['total_votes'] == 1
    assert _entry(data, seed['proposal_ids'][0])['vote_count'] == 1


def test_tally_excludes_votes_from_another_group(app, client, as_user):
    """Test that an unrelated group's ballots never leak into this tally."""

    # Arrange
    seed = _seed_voting_session(app)
    other = _seed_voting_session(app, prefix='b')
    _seed_votes(app, seed['session_id'], [(seed['owner_id'], seed['proposal_ids'][0])])
    _seed_votes(app, other['session_id'], [
        (other['owner_id'], other['proposal_ids'][0]),
        (other['admin_id'], other['proposal_ids'][0]),
    ])

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['total_votes'] == 1
    assert {r['proposal_id'] for r in data['results']} == set(seed['proposal_ids'])


# ===========================================================================
# 12. Voter secrecy
#
# While a session is in `voting`, no caller of any role may learn who voted
# for what.
# ===========================================================================

def _seed_full_ballot(app, status='voting'):
    """A session where every member has already cast a ballot."""
    seed = _seed_voting_session(app, status=status, n_proposals=3, n_members=2)
    pids = seed['proposal_ids']
    seed['ballot'] = {
        seed['owner_id']: pids[0],
        seed['admin_id']: pids[0],
        seed['member_ids'][0]: pids[1],
        seed['member_ids'][1]: pids[1],
    }
    seed['usernames'] = {
        seed['owner_id']: seed['owner_username'],
        seed['admin_id']: seed['admin_username'],
        seed['member_ids'][0]: seed['member_usernames'][0],
        seed['member_ids'][1]: seed['member_usernames'][1],
    }
    _seed_votes(app, seed['session_id'], list(seed['ballot'].items()))
    return seed


def test_tally_hides_voters_during_voting_for_member(app, client, as_user):
    """Test that a member sees counts but no identities during voting."""

    # Arrange
    seed = _seed_full_ballot(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['identities_revealed'] is False
    assert all(r['voters'] is None for r in data['results'])


def test_tally_hides_voters_during_voting_for_owner(app, client, as_user):
    """Test that the owner's role does not unlock voter identities."""

    # Arrange
    seed = _seed_full_ballot(app)

    # Act
    as_user(seed['owner_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['identities_revealed'] is False
    assert all(r['voters'] is None for r in data['results'])


def test_tally_hides_voters_during_voting_for_admin(app, client, as_user):
    """Test that an admin's role does not unlock voter identities."""

    # Arrange
    seed = _seed_full_ballot(app)

    # Act
    as_user(seed['admin_id'])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['identities_revealed'] is False
    assert all(r['voters'] is None for r in data['results'])


def test_tally_leaks_no_identity_fields_during_voting(app, client, as_user):
    """Test that no identity survives anywhere in the voting-phase payload."""

    # Arrange
    seed = _seed_full_ballot(app)

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    # Deliberately structural rather than key-by-key: a checklist only covers
    # the fields someone remembered to check. This walks the whole payload, then
    # scans the raw body for the other voters' usernames.
    data = response.get_json()
    keys = _all_keys(data)
    assert 'user_id' not in keys
    assert 'username' not in keys
    assert 'voters' in keys

    body = response.get_data(as_text=True)
    caller_id = seed['member_ids'][0]
    for user_id, username in seed['usernames'].items():
        if user_id != caller_id:
            assert username not in body


def test_tally_after_decided_reveals_identities(app, client, as_user):
    """Test that identities are published once the session is decided."""

    # Arrange
    seed = _seed_full_ballot(app, status='decided')

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['session_status'] == 'decided'
    assert data['identities_revealed'] is True
    assert all(isinstance(r['voters'], list) for r in data['results'])


def test_tally_after_decided_voters_contain_correct_users(app, client, as_user):
    """Test that the revealed voter lists attribute each ballot correctly."""

    # Arrange
    seed = _seed_full_ballot(app, status='decided')

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    for proposal_id in seed['proposal_ids']:
        expected = {
            (uid, seed['usernames'][uid])
            for uid, pid in seed['ballot'].items()
            if pid == proposal_id
        }
        actual = {
            (v['user_id'], v['username']) for v in _entry(data, proposal_id)['voters']
        }
        assert actual == expected


def test_tally_after_closed_reveals_identities(app, client, as_user):
    """Test that a closed session keeps identities revealed."""

    # Arrange
    seed = _seed_full_ballot(app, status='closed')

    # Act
    as_user(seed['member_ids'][0])
    response = client.get(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes/tally'
    )

    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['identities_revealed'] is True
    assert _entry(data, seed['proposal_ids'][0])['voters'] is not None


# ===========================================================================
# 13. Concurrency
# ===========================================================================

def test_concurrent_cast_recovers_from_integrity_error(app, client, as_user, monkeypatch):
    """Test that losing a race on uq_vote_user_session lands as a change, not a 500."""

    # Arrange
    # Simulates two simultaneous first-time PUTs from the same user: ours hits
    # the unique constraint after the rival's row is already committed. The
    # rollback-and-retry pattern at proposals.py:61-66 must absorb it.
    seed = _seed_voting_session(app)
    voter_id = seed['member_ids'][0]
    rival_pid, own_pid = seed['proposal_ids'][0], seed['proposal_ids'][1]
    as_user(voter_id)

    real_commit = db.session.commit
    state = {'raised': False}

    def flaky_commit():
        # Only sabotage the commit that inserts something. Flask-Session shares
        # this scoped session and commits on its way out, but `as_user` already
        # created its row above, so that commit stages nothing new.
        if db.session.new and not state['raised']:
            state['raised'] = True
            db.session.rollback()
            with db.engine.begin() as conn:
                conn.execute(
                    text(
                        'INSERT INTO vote (proposal_id, user_id, session_id, voted_at) '
                        'VALUES (:p, :u, :s, now())'
                    ),
                    {'p': rival_pid, 'u': voter_id, 's': seed['session_id']},
                )
            raise IntegrityError(
                'INSERT INTO vote', {}, Exception('uq_vote_user_session')
            )
        return real_commit()

    monkeypatch.setattr(db.session, 'commit', flaky_commit)

    # Act
    response = client.put(
        f'/api/groups/{seed["group_id"]}/sessions/{seed["session_id"]}/votes',
        json={'proposal_id': own_pid},
    )
    monkeypatch.undo()

    # Assert
    rows = _stored_votes(app, seed['session_id'])
    assert state['raised'] is True
    assert response.status_code in (200, 201)
    assert len(rows) == 1
    assert rows[0]['proposal_id'] == own_pid
