from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.movie_night_session import MovieNightSession
from app.models.movie_proposal import MovieProposal
from app.utils.auth import require_auth

bp = Blueprint('proposals', __name__)


def _get_membership(group_id, user):
    return GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()


def _proposal_dict(p: MovieProposal) -> dict:
    d = p.to_dict()
    d['proposed_by_username'] = p.proposed_by_user.username
    return d


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>/proposals', methods=['POST'])
@require_auth
def create_proposal(group_id, session_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404

    membership = _get_membership(group_id, g.current_user)
    if not membership:
        return jsonify({'error': 'forbidden'}), 403

    movie_session = db.session.get(MovieNightSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return jsonify({'error': 'session not found'}), 404

    if movie_session.status != 'open':
        return jsonify({'error': 'nominations are closed'}), 409

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'title is required'}), 400

    existing = MovieProposal.query.filter_by(
        session_id=session_id, proposed_by_id=g.current_user.id
    ).first()
    if existing:
        return jsonify({'error': 'you already nominated a movie'}), 409

    proposal = MovieProposal(
        session_id=session_id,
        proposed_by_id=g.current_user.id,
        title=title,
        tmdb_id=data.get('tmdb_id'),
        poster_url=data.get('poster_url'),
        overview=data.get('overview'),
        runtime_minutes=data.get('runtime_minutes'),
    )
    db.session.add(proposal)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'this movie is already nominated'}), 409

    return jsonify(proposal.to_dict()), 201


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>/proposals', methods=['GET'])
@require_auth
def list_proposals(group_id, session_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404

    if not _get_membership(group_id, g.current_user):
        return jsonify({'error': 'forbidden'}), 403

    movie_session = db.session.get(MovieNightSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return jsonify({'error': 'session not found'}), 404

    proposals = MovieProposal.query.filter_by(session_id=session_id).all()
    return jsonify([_proposal_dict(p) for p in proposals]), 200


@bp.route(
    '/api/groups/<int:group_id>/sessions/<int:session_id>/proposals/<int:proposal_id>',
    methods=['DELETE'],
)
@require_auth
def delete_proposal(group_id, session_id, proposal_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404

    membership = _get_membership(group_id, g.current_user)
    if not membership:
        return jsonify({'error': 'forbidden'}), 403

    movie_session = db.session.get(MovieNightSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return jsonify({'error': 'session not found'}), 404

    proposal = db.session.get(MovieProposal, proposal_id)
    if not proposal or proposal.session_id != session_id:
        return jsonify({'error': 'proposal not found'}), 404

    if movie_session.status != 'open':
        return jsonify({'error': 'nominations are closed'}), 409

    is_proposer = proposal.proposed_by_id == g.current_user.id
    is_privileged = membership.role in ('owner', 'admin')
    if not is_proposer and not is_privileged:
        return jsonify({'error': 'forbidden'}), 403

    db.session.delete(proposal)
    db.session.commit()
    return '', 204
