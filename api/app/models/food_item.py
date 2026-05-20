from app.extensions import db


class FoodItem(db.Model):
    __tablename__ = 'food_item'

    id          = db.Column(db.Integer, primary_key=True)
    session_id  = db.Column(db.Integer, db.ForeignKey('movie_night_session.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    name        = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    quantity    = db.Column(db.String(64), nullable=True)
    created_at  = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    session = db.relationship('MovieNightSession', back_populates='food_items')
    user    = db.relationship('User', back_populates='food_items')

    def to_dict(self):
        return {
            'id':          self.id,
            'session_id':  self.session_id,
            'user_id':     self.user_id,
            'name':        self.name,
            'description': self.description,
            'quantity':    self.quantity,
            'created_at':  self.created_at.isoformat() if self.created_at else None,
        }
