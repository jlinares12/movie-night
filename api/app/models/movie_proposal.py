from app.extensions import db


class MovieProposal(db.Model):
    __tablename__ = 'movie_proposal'
    __table_args__ = (
        db.UniqueConstraint('proposed_by_id', 'session_id', name='uq_proposal_user_session'),
        # Enables compound FK targets from Vote and SessionResult
        db.UniqueConstraint('id', 'session_id', name='uq_proposal_id_session'),
        # One TMDB movie per session (only enforced when tmdb_id is not NULL)
        db.Index('ix_proposal_tmdb_session', 'tmdb_id', 'session_id',
                 unique=True,
                 postgresql_where=db.text('tmdb_id IS NOT NULL')),
    )

    id              = db.Column(db.Integer, primary_key=True)
    session_id      = db.Column(db.Integer, db.ForeignKey('call_time_session.id', ondelete='CASCADE'), nullable=False, index=True)
    proposed_by_id  = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    title           = db.Column(db.String(256), nullable=False)
    tmdb_id         = db.Column(db.Integer, nullable=True)
    poster_url      = db.Column(db.String(512), nullable=True)
    overview        = db.Column(db.Text, nullable=True)
    runtime_minutes = db.Column(db.Integer, nullable=True)
    proposed_at     = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    session          = db.relationship('CallTimeSession', back_populates='proposals')
    proposed_by_user = db.relationship('User', back_populates='proposals')
    votes            = db.relationship('Vote', back_populates='proposal', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':              self.id,
            'session_id':      self.session_id,
            'proposed_by_id':  self.proposed_by_id,
            'title':           self.title,
            'tmdb_id':         self.tmdb_id,
            'poster_url':      self.poster_url,
            'overview':        self.overview,
            'runtime_minutes': self.runtime_minutes,
            'proposed_at':     self.proposed_at.isoformat() if self.proposed_at else None,
        }
