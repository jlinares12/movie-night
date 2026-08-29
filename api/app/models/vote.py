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
    session_id  = db.Column(db.Integer, db.ForeignKey('call_time_session.id', ondelete='CASCADE'), nullable=False, index=True)
    voted_at    = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    # session_id belongs to two foreign keys (the compound one above and its
    # own), so both `proposal` and `session` write it. That overlap is
    # intentional — the compound FK rejects any pair they disagree on — and
    # `overlaps` says so without changing what either relationship copies.
    proposal = db.relationship('MovieProposal', back_populates='votes', overlaps='votes')
    user     = db.relationship('User', back_populates='votes')
    session  = db.relationship('CallTimeSession', back_populates='votes', overlaps='proposal,votes')

    def to_dict(self):
        return {
            'id':          self.id,
            'proposal_id': self.proposal_id,
            'user_id':     self.user_id,
            'session_id':  self.session_id,
            'voted_at':    self.voted_at.isoformat() if self.voted_at else None,
        }
