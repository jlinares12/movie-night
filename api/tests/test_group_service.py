from datetime import datetime, timezone, timedelta

from app.extensions import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User
from app.services.group_service import transfer_or_dissolve


def test_admin_promoted_over_member_when_owner_departs(app):
    now = datetime.now(timezone.utc)
    with app.app_context():
        owner = User(user_id='clerk_owner', username='owner')
        admin_user = User(user_id='clerk_admin', username='admin_user')
        member_user = User(user_id='clerk_member', username='member_user')
        db.session.add_all([owner, admin_user, member_user])
        db.session.flush()

        group = Group(name='Test Group', created_by_id=owner.id)
        db.session.add(group)
        db.session.flush()

        db.session.add(GroupMember(user_id=owner.id, group_id=group.id, role='owner'))
        db.session.add(GroupMember(user_id=admin_user.id, group_id=group.id, role='admin',
                                   joined_at=now - timedelta(hours=2)))
        db.session.add(GroupMember(user_id=member_user.id, group_id=group.id, role='member',
                                   joined_at=now - timedelta(hours=1)))
        db.session.commit()
        group_id = group.id
        owner_id = owner.id
        admin_id = admin_user.id

    with app.app_context():
        result = transfer_or_dissolve(group_id, owner_id)

        assert result is not None
        assert result.user_id == admin_id
        assert result.role == 'owner'

        # Rollback proves the function did not commit internally
        db.session.rollback()
        admin_m = GroupMember.query.filter_by(user_id=admin_id, group_id=group_id).first()
        assert admin_m.role == 'admin'


def test_oldest_member_promoted_when_no_admins(app):
    now = datetime.now(timezone.utc)
    with app.app_context():
        owner = User(user_id='clerk_owner', username='owner')
        older_user = User(user_id='clerk_older', username='older')
        newer_user = User(user_id='clerk_newer', username='newer')
        db.session.add_all([owner, older_user, newer_user])
        db.session.flush()

        group = Group(name='Test Group', created_by_id=owner.id)
        db.session.add(group)
        db.session.flush()

        db.session.add(GroupMember(user_id=owner.id, group_id=group.id, role='owner'))
        db.session.add(GroupMember(user_id=older_user.id, group_id=group.id, role='member',
                                   joined_at=now - timedelta(hours=2)))
        db.session.add(GroupMember(user_id=newer_user.id, group_id=group.id, role='member',
                                   joined_at=now - timedelta(hours=1)))
        db.session.commit()
        group_id = group.id
        owner_id = owner.id
        older_id = older_user.id

    with app.app_context():
        result = transfer_or_dissolve(group_id, owner_id)

        assert result is not None
        assert result.user_id == older_id
        assert result.role == 'owner'

        db.session.rollback()
        older_m = GroupMember.query.filter_by(user_id=older_id, group_id=group_id).first()
        assert older_m.role == 'member'


def test_group_dissolved_when_owner_is_last_member(app):
    with app.app_context():
        owner = User(user_id='clerk_owner', username='owner')
        db.session.add(owner)
        db.session.flush()

        group = Group(name='Solo Group', created_by_id=owner.id)
        db.session.add(group)
        db.session.flush()
        db.session.add(GroupMember(user_id=owner.id, group_id=group.id, role='owner'))
        db.session.commit()
        group_id = group.id
        owner_id = owner.id

    with app.app_context():
        result = transfer_or_dissolve(group_id, owner_id)

        assert result is None
        db.session.flush()
        assert db.session.get(Group, group_id) is None

        db.session.rollback()
        assert db.session.get(Group, group_id) is not None


def test_multiple_owned_groups_handled_without_intermediate_commits(app):
    now = datetime.now(timezone.utc)
    with app.app_context():
        owner = User(user_id='clerk_owner', username='owner')
        member_user = User(user_id='clerk_member', username='member')
        db.session.add_all([owner, member_user])
        db.session.flush()

        group_a = Group(name='Group A', created_by_id=owner.id)
        group_b = Group(name='Group B', created_by_id=owner.id)
        db.session.add_all([group_a, group_b])
        db.session.flush()

        db.session.add(GroupMember(user_id=owner.id, group_id=group_a.id, role='owner'))
        db.session.add(GroupMember(user_id=owner.id, group_id=group_b.id, role='owner'))
        db.session.add(GroupMember(user_id=member_user.id, group_id=group_a.id, role='member',
                                   joined_at=now))
        db.session.commit()
        group_a_id = group_a.id
        group_b_id = group_b.id
        owner_id = owner.id
        member_id = member_user.id

    with app.app_context():
        owned = GroupMember.query.filter_by(user_id=owner_id, role='owner').all()
        for m in owned:
            transfer_or_dissolve(m.group_id, owner_id)

        # group_a: member promoted; group_b: dissolved — all staged, not committed
        new_owner_m = GroupMember.query.filter_by(user_id=member_id, group_id=group_a_id).first()
        assert new_owner_m.role == 'owner'
        db.session.flush()
        assert db.session.get(Group, group_b_id) is None

        # Rollback proves no intermediate commits — all changes revert together
        db.session.rollback()
        new_owner_m = GroupMember.query.filter_by(user_id=member_id, group_id=group_a_id).first()
        assert new_owner_m.role == 'member'
        assert db.session.get(Group, group_b_id) is not None
