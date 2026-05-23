from functools import wraps
from flask import session, g, jsonify
from app.models import User


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
