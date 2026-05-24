import secrets
from flask import Blueprint, g, jsonify, request, Response, stream_with_context
from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.utils.auth import require_auth
from app.services.group_service import transfer_or_dissolve

bp = Blueprint('groups', __name__)


def _get_membership(group_id, user):
    return GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()


# ---------------------------------------------------------------------------
# Groups CRUD
# ---------------------------------------------------------------------------

@bp.route('/api/groups', methods=['POST'])
@require_auth
def create_group():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400
    if len(name) > 128:
        return jsonify({'error': 'name must be 128 characters or fewer'}), 400

    group = Group(name=name, description=data.get('description'), created_by_id=g.current_user.id)
    db.session.add(group)
    db.session.flush()
    db.session.add(GroupMember(user_id=g.current_user.id, group_id=group.id, role='owner'))
    db.session.commit()
    return jsonify(group.to_dict()), 201


@bp.route('/api/groups', methods=['GET'])
@require_auth
def list_groups():
    memberships = GroupMember.query.filter_by(user_id=g.current_user.id).all()
    result = []
    for m in memberships:
        entry = m.group.to_dict()
        entry['member_count'] = len(m.group.members)
        entry['your_role'] = m.role
        result.append(entry)
    return jsonify(result), 200


@bp.route('/api/groups/<int:group_id>', methods=['GET'])
@require_auth
def get_group(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    if not _get_membership(group_id, g.current_user):
        return jsonify({'error': 'forbidden'}), 403

    membership = _get_membership(group_id, g.current_user)
    data = group.to_dict()
    data['your_role'] = membership.role
    data['members'] = [m.to_dict() for m in group.members]
    data['sessions'] = [s.to_dict() for s in group.sessions]
    return jsonify(data), 200


@bp.route('/api/groups/<int:group_id>', methods=['PATCH'])
@require_auth
def update_group(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    membership = _get_membership(group_id, g.current_user)
    if not membership or membership.role == 'member':
        return jsonify({'error': 'forbidden'}), 403

    data = request.get_json() or {}
    if 'name' in data:
        name = (data['name'] or '').strip()
        if not name:
            return jsonify({'error': 'name cannot be empty'}), 400
        if len(name) > 128:
            return jsonify({'error': 'name must be 128 characters or fewer'}), 400
        group.name = name
    if 'description' in data:
        group.description = data['description']

    db.session.commit()
    return jsonify(group.to_dict()), 200


@bp.route('/api/groups/<int:group_id>', methods=['DELETE'])
@require_auth
def delete_group(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    membership = _get_membership(group_id, g.current_user)
    if not membership or membership.role != 'owner':
        return jsonify({'error': 'forbidden'}), 403

    db.session.delete(group)
    db.session.commit()
    return '', 204


# ---------------------------------------------------------------------------
# Membership
# ---------------------------------------------------------------------------

@bp.route('/api/groups/join', methods=['POST'])
@require_auth
def join_group():
    data = request.get_json() or {}
    invite_code = data.get('invite_code')
    if not invite_code:
        return jsonify({'error': 'invite_code is required'}), 400

    group = Group.query.filter_by(invite_code=invite_code).first()
    if not group:
        return jsonify({'error': 'invalid invite code'}), 404

    if _get_membership(group.id, g.current_user):
        return jsonify({'error': 'already a member'}), 409

    db.session.add(GroupMember(user_id=g.current_user.id, group_id=group.id, role='member'))
    db.session.commit()
    return jsonify(group.to_dict()), 201


@bp.route('/api/groups/<int:group_id>/invite/regenerate', methods=['POST'])
@require_auth
def regenerate_invite(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    membership = _get_membership(group_id, g.current_user)
    if not membership or membership.role == 'member':
        return jsonify({'error': 'forbidden'}), 403

    group.invite_code = secrets.token_urlsafe(6)
    db.session.commit()
    return jsonify(group.to_dict()), 200


@bp.route('/api/groups/<int:group_id>/members/<int:target_user_id>', methods=['PATCH'])
@require_auth
def update_member_role(group_id, target_user_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    caller = _get_membership(group_id, g.current_user)
    if not caller or caller.role != 'owner':
        return jsonify({'error': 'forbidden'}), 403

    target = GroupMember.query.filter_by(group_id=group_id, user_id=target_user_id).first()
    if not target:
        return jsonify({'error': 'member not found'}), 404

    data = request.get_json() or {}
    new_role = data.get('role')
    if new_role not in ('admin', 'member'):
        return jsonify({'error': 'invalid role'}), 400

    target.role = new_role
    db.session.commit()
    return jsonify(target.to_dict()), 200


@bp.route('/api/groups/<int:group_id>/members/<int:target_user_id>', methods=['DELETE'])
@require_auth
def remove_member(group_id, target_user_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    caller = _get_membership(group_id, g.current_user)
    if not caller:
        return jsonify({'error': 'forbidden'}), 403

    target = GroupMember.query.filter_by(group_id=group_id, user_id=target_user_id).first()
    if not target:
        return jsonify({'error': 'member not found'}), 404

    is_self = caller.user_id == target.user_id

    if not is_self:
        if caller.role == 'member':
            return jsonify({'error': 'forbidden'}), 403
        if caller.role == 'admin' and target.role in ('owner', 'admin'):
            return jsonify({'error': 'forbidden'}), 403

    if target.role == 'owner':
        other_count = GroupMember.query.filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id != target_user_id,
        ).count()
        if other_count == 0:
            return jsonify({'error': 'owner cannot leave as sole member'}), 400
        transfer_or_dissolve(group_id, target_user_id)

    db.session.delete(target)
    db.session.commit()
    return '', 204


# ---------------------------------------------------------------------------
# SSE stream
# ---------------------------------------------------------------------------

@bp.route('/api/groups/<int:group_id>/events', methods=['GET'])
@require_auth
def sse_stream(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404
    if not _get_membership(group_id, g.current_user):
        return jsonify({'error': 'forbidden'}), 403

    def event_stream():
        yield ': connected\n\n'

    return Response(
        stream_with_context(event_stream()),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )
