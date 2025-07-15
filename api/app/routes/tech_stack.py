from flask import Blueprint

bp = Blueprint('tech', __name__)

@bp.route('/api/data')
def data():
    return {"tech" : ["Flask", "React", "Python", "Typescript"]}