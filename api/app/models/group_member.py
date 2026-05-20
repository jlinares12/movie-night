from app.extensions import db


class GroupMember(db.Model):
    __tablename__ = 'group_member'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'group_id', name='uq_group_member_user_group'),
    )

    id        = db.Column(db.Integer, primary_key=True)
    user_id   = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id  = db.Column(db.Integer, db.ForeignKey('group.id', ondelete='CASCADE'), nullable=False, index=True)
    role      = db.Column(db.Enum('owner', 'member', name='group_member_role'), nullable=False, default='member')
    joined_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    user  = db.relationship('User', back_populates='group_memberships')
    group = db.relationship('Group', back_populates='members')

    def to_dict(self):
        return {
            'id':        self.id,
            'user_id':   self.user_id,
            'group_id':  self.group_id,
            'role':      self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }
