from datetime import datetime
from flask import Blueprint, g, jsonify, request
from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.call_time_session import CallTimeSession
from app.utils.auth import require_auth

bp = Blueprint('sessions', __name__)

STATUS_ORDER = ['open', 'voting', 'decided', 'closed']


def _get_membership(group_id, user):
    return GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()


@bp.route('/api/groups/<int:group_id>/sessions', methods=['POST'])
@require_auth
def create_session(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    membership = _get_membership(group_id, g.current_user)
    if not membership or membership.role == 'member':
        return jsonify({'error': 'forbidden'}), 403

    data = request.get_json() or {}
    scheduled_for = None
    if data.get('scheduled_for'):
        try:
            scheduled_for = datetime.fromisoformat(data['scheduled_for'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'malformed scheduled_for'}), 400

    movie_session = CallTimeSession(
        group_id=group_id,
        created_by_id=g.current_user.id,
        scheduled_for=scheduled_for,
        status='open',
    )
    db.session.add(movie_session)
    db.session.commit()
    return jsonify(movie_session.to_dict()), 201


@bp.route('/api/groups/<int:group_id>/sessions', methods=['GET'])
@require_auth
def list_sessions(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    if not _get_membership(group_id, g.current_user):
        return jsonify({'error': 'forbidden'}), 403

    sessions = (
        CallTimeSession.query
        .filter_by(group_id=group_id)
        .order_by(CallTimeSession.created_at.desc())
        .all()
    )
    return jsonify([s.to_dict() for s in sessions]), 200


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>', methods=['GET'])
@require_auth
def get_session(group_id, session_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    if not _get_membership(group_id, g.current_user):
        return jsonify({'error': 'forbidden'}), 403

    movie_session = db.session.get(CallTimeSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return jsonify({'error': 'session not found'}), 404
    return jsonify(movie_session.to_dict()), 200


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>', methods=['PATCH'])
@require_auth
def update_session(group_id, session_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    membership = _get_membership(group_id, g.current_user)
    if not membership or membership.role == 'member':
        return jsonify({'error': 'forbidden'}), 403

    movie_session = db.session.get(CallTimeSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return jsonify({'error': 'session not found'}), 404

    data = request.get_json() or {}

    if 'status' in data:
        new_status = data['status']
        if new_status not in STATUS_ORDER:
            return jsonify({'error': 'invalid status'}), 400
        if STATUS_ORDER.index(new_status) <= STATUS_ORDER.index(movie_session.status):
            return jsonify({'error': 'invalid status transition'}), 400
        movie_session.status = new_status

    if 'scheduled_for' in data:
        try:
            movie_session.scheduled_for = datetime.fromisoformat(
                data['scheduled_for'].replace('Z', '+00:00')
            )
        except (ValueError, AttributeError):
            return jsonify({'error': 'malformed scheduled_for'}), 400

    db.session.commit()
    return jsonify(movie_session.to_dict()), 200


@bp.route('/api/groups/<int:group_id>/sessions/<int:session_id>', methods=['DELETE'])
@require_auth
def delete_session(group_id, session_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    membership = _get_membership(group_id, g.current_user)
    if not membership or membership.role == 'member':
        return jsonify({'error': 'forbidden'}), 403

    movie_session = db.session.get(CallTimeSession, session_id)
    if not movie_session or movie_session.group_id != group_id:
        return jsonify({'error': 'session not found'}), 404

    db.session.delete(movie_session)
    db.session.commit()
    return '', 204
