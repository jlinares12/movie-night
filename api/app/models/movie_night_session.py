from app.extensions import db


class MovieNightSession(db.Model):
    __tablename__ = 'movie_night_session'

    id             = db.Column(db.Integer, primary_key=True)
    group_id       = db.Column(db.Integer, db.ForeignKey('group.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by_id  = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), nullable=True, index=True)
    scheduled_for  = db.Column(db.DateTime(timezone=True), nullable=True)
    status         = db.Column(
        db.Enum('open', 'voting', 'decided', 'closed', name='session_status'),
        nullable=False,
        default='open',
    )
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    group      = db.relationship('Group', back_populates='sessions')
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    proposals  = db.relationship('MovieProposal', back_populates='session', cascade='all, delete-orphan')
    votes      = db.relationship('Vote', back_populates='session', cascade='all, delete-orphan')
    food_items = db.relationship('FoodItem', back_populates='session', cascade='all, delete-orphan')
    result     = db.relationship('SessionResult', back_populates='session', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':            self.id,
            'group_id':      self.group_id,
            'created_by_id': self.created_by_id,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'status':        self.status,
            'created_at':    self.created_at.isoformat() if self.created_at else None,
        }
