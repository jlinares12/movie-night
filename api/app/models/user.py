from app.extensions import db


class User(db.Model):
    __tablename__ = 'user'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.String(64), unique=True, index=True, nullable=False)
    username   = db.Column(db.String(64), unique=True, index=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    group_memberships = db.relationship('GroupMember', back_populates='user', cascade='all, delete-orphan')
    proposals         = db.relationship('MovieProposal', back_populates='proposed_by_user', cascade='all, delete-orphan')
    votes             = db.relationship('Vote', back_populates='user', cascade='all, delete-orphan')
    food_items        = db.relationship('FoodItem', back_populates='user', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':         self.id,
            'user_id':    self.user_id,
            'username':   self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
