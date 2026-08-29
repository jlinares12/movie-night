from functools import wraps
from flask import session, g, jsonify
from app.models import GroupMember, User


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'not authenticated'}), 401
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            session.clear()
            return jsonify({'error': 'not authenticated'}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def get_membership(group_id, user):
    """The caller's GroupMember row for this group, or None if not a member."""
    return GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
