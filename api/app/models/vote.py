from app.extensions import db


class Vote(db.Model):
    __tablename__ = 'vote'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'session_id', name='uq_vote_user_session'),
        # Compound FK ensures the voted proposal belongs to this session
        db.ForeignKeyConstraint(
            ['proposal_id', 'session_id'],
            ['movie_proposal.id', 'movie_proposal.session_id'],
            name='fk_vote_proposal_session',
            ondelete='CASCADE',
        ),
    )

    id          = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, nullable=False, index=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id  = db.Column(db.Integer, db.ForeignKey('movie_night_session.id', ondelete='CASCADE'), nullable=False, index=True)
    voted_at    = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    proposal = db.relationship('MovieProposal', foreign_keys=[proposal_id], back_populates='votes')
    user     = db.relationship('User', back_populates='votes')
    session  = db.relationship('MovieNightSession', back_populates='votes')

    def to_dict(self):
        return {
            'id':          self.id,
            'proposal_id': self.proposal_id,
            'user_id':     self.user_id,
            'session_id':  self.session_id,
            'voted_at':    self.voted_at.isoformat() if self.voted_at else None,
        }
