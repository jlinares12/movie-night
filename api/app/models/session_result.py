from app.extensions import db


class SessionResult(db.Model):
    __tablename__ = 'session_result'
    __table_args__ = (
        # Compound FK ensures winning_proposal belongs to this session
        db.ForeignKeyConstraint(
            ['winning_proposal_id', 'session_id'],
            ['movie_proposal.id', 'movie_proposal.session_id'],
            name='fk_result_proposal_session',
            ondelete='CASCADE',
        ),
    )

    id                  = db.Column(db.Integer, primary_key=True)
    session_id          = db.Column(db.Integer, db.ForeignKey('movie_night_session.id', ondelete='CASCADE'), unique=True, nullable=False)
    winning_proposal_id = db.Column(db.Integer, nullable=False, index=True)
    finalized_at        = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    session          = db.relationship('MovieNightSession', back_populates='result')
    winning_proposal = db.relationship('MovieProposal', foreign_keys=[winning_proposal_id])

    def to_dict(self):
        return {
            'id':                  self.id,
            'session_id':          self.session_id,
            'winning_proposal_id': self.winning_proposal_id,
            'finalized_at':        self.finalized_at.isoformat() if self.finalized_at else None,
        }
