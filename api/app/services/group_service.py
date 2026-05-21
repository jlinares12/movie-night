from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember


def transfer_or_dissolve(group_id: int, departing_user_id: int) -> GroupMember | None:
    successor = (
        GroupMember.query
        .filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id != departing_user_id,
            GroupMember.role == 'admin',
        )
        .order_by(GroupMember.joined_at)
        .first()
    )

    if successor is None:
        successor = (
            GroupMember.query
            .filter(
                GroupMember.group_id == group_id,
                GroupMember.user_id != departing_user_id,
                GroupMember.role == 'member',
            )
            .order_by(GroupMember.joined_at)
            .first()
        )

    if successor:
        successor.role = 'owner'
        return successor

    group = db.session.get(Group, group_id)
    db.session.delete(group)
    return None
