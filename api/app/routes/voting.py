from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.call_time_session import CallTimeSession
from app.models.movie_proposal import MovieProposal
from app.models.user import User
from app.models.vote import Vote
from app.utils.auth import get_membership, require_auth

bp = Blueprint('voting', __name__)

# Statuses in which the vote roll becomes a group historical record.
REVEALED_STATUSES = ('decided', 'closed')


def _load_context(group_id, session_id):
    """Run the shared gate chain. Returns (session, membership, error).

    The order is load-bearing: membership is checked before the session lookup
    so a non-member cannot use response codes to enumerate which session ids
    exist inside a group they do not belong to.
    """
    group = db.session.get(Group, group_id)
    if not group:
        return None, None, (jsonify({'error': 'group not found'}), 404)

    membership = get_membership(group_id, g.current_user)
    if not membership:
        return None, None, (jsonify({'error': 'forbidden'}), 403)

    movie_session = db.session.get(CallTimeSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return None, None, (jsonify({'error': 'session not found'}), 404)

    return movie_session, membership, None


def _my_vote(session_id):
    return Vote.query.filter_by(
        session_id=session_id, user_id=g.current_user.id
    ).first()


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>/votes', methods=['PUT'])
@require_auth
def cast_vote(group_id, session_id):
    movie_session, _, error = _load_context(group_id, session_id)
    if error:
        return error

    if movie_session.status == 'open':
        return jsonify({'error': 'voting has not started'}), 409
    if movie_session.status != 'voting':
        return jsonify({'error': 'voting is closed'}), 409

    data = request.get_json(silent=True) or {}
    proposal_id = data.get('proposal_id')
    # bool is an int subclass; True would otherwise pass as proposal 1.
    if not isinstance(proposal_id, int) or isinstance(proposal_id, bool):
        return jsonify({'error': 'proposal_id is required'}), 400

    # 404 rather than 400: a proposal in some other session must not be
    # confirmed as real to someone who cannot see it.
    proposal = db.session.get(MovieProposal, proposal_id)
    if not proposal or proposal.session_id != session_id:
        return jsonify({'error': 'proposal not found'}), 404

    vote = _my_vote(session_id)
    if vote:
        vote.proposal_id = proposal_id
        db.session.commit()
        return jsonify(vote.to_dict()), 200

    vote = Vote(
        session_id=session_id,
        user_id=g.current_user.id,
        proposal_id=proposal_id,
    )
    db.session.add(vote)
    try:
        db.session.commit()
    except IntegrityError:
        # Lost a race on uq_vote_user_session against a simultaneous PUT from
        # this same user. The rival's row is now the caller's ballot — land as
        # a change rather than a 500.
        db.session.rollback()
        vote = _my_vote(session_id)
        if not vote:
            raise
        vote.proposal_id = proposal_id
        db.session.commit()
        return jsonify(vote.to_dict()), 200

    return jsonify(vote.to_dict()), 201


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>/votes/me', methods=['GET'])
@require_auth
def get_my_vote(group_id, session_id):
    _, _, error = _load_context(group_id, session_id)
    if error:
        return error

    vote = _my_vote(session_id)
    if vote:
        return jsonify(vote.to_dict()), 200

    # Never a 404 — src/services/apiError.ts throws on every non-2xx, and
    # "you haven't voted yet" is a state, not an error.
    return jsonify({
        'id':          None,
        'proposal_id': None,
        'user_id':     g.current_user.id,
        'session_id':  session_id,
        'voted_at':    None,
    }), 200


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>/votes/tally', methods=['GET'])
@require_auth
def get_tally(group_id, session_id):
    movie_session, _, error = _load_context(group_id, session_id)
    if error:
        return error

    # Driven solely by the session's current status — there is no separate flag
    # to keep in sync, and no role unlocks identities early.
    revealed = movie_session.status in REVEALED_STATUSES

    proposals = MovieProposal.query.filter_by(session_id=session_id).all()
    counts = dict(
        db.session.query(Vote.proposal_id, db.func.count(Vote.id))
        .filter(Vote.session_id == session_id)
        .group_by(Vote.proposal_id)
        .all()
    )

    voters = {}
    if revealed:
        rows = (
            db.session.query(Vote.proposal_id, User.id, User.username)
            .join(User, User.id == Vote.user_id)
            .filter(Vote.session_id == session_id)
            .all()
        )
        for proposal_id, user_id, username in rows:
            voters.setdefault(proposal_id, []).append(
                {'user_id': user_id, 'username': username}
            )

    # Built from the proposals, not the votes, so zero-vote nominations still
    # appear rather than vanishing from the list.
    results = [
        {
            'proposal_id': p.id,
            'title':       p.title,
            'poster_url':  p.poster_url,
            'vote_count':  counts.get(p.id, 0),
            'voters':      voters.get(p.id, []) if revealed else None,
        }
        for p in proposals
    ]
    # Stable across polls: count descending, then proposal_id ascending.
    results.sort(key=lambda r: (-r['vote_count'], r['proposal_id']))

    return jsonify({
        'session_status':      movie_session.status,
        'total_votes':         sum(counts.values()),
        'eligible_voters':     GroupMember.query.filter_by(group_id=group_id).count(),
        'identities_revealed': revealed,
        'results':             results,
    }), 200
