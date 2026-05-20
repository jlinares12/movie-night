import secrets
from app.extensions import db


class Group(db.Model):
    __tablename__ = 'group'

    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(128), nullable=False)
    description    = db.Column(db.Text, nullable=True)
    invite_code    = db.Column(db.String(16), unique=True, nullable=False)
    created_by_id  = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at     = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    created_by = db.relationship('User', foreign_keys=[created_by_id])
    members    = db.relationship('GroupMember', back_populates='group', cascade='all, delete-orphan')
    sessions   = db.relationship('MovieNightSession', back_populates='group', cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        if 'invite_code' not in kwargs:
            kwargs['invite_code'] = secrets.token_urlsafe(6)
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id':            self.id,
            'name':          self.name,
            'description':   self.description,
            'invite_code':   self.invite_code,
            'created_by_id': self.created_by_id,
            'created_at':    self.created_at.isoformat() if self.created_at else None,
        }
