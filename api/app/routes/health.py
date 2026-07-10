from flask import Blueprint
from sqlalchemy import text
from app.extensions import db

bp = Blueprint('health', __name__)


@bp.route('/api/health')
def health():
    try:
        db.session.execute(text('SELECT 1'))
        return {"status": "ok", "db": "ok"}
    except Exception:
        return {"status": "ok", "db": "unavailable"}, 500
