from api.server import db, bcrypt

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer            , primary_key=True           )
    username          = db.Column(db.String( 50 )       , unique=True, nullable=False)
    email         = db.Column(db.String( 120 )      , unique=True, nullable=False)
    password_hash = db.Column(db.String( length=60 ), nullable=False             )

    @property
    def password(self):
        return self.password

    @password.setter
    def password(self, plain_text_password):
        self.password_hash = bcrypt.generate_password_hash(plain_text_password).decode('utf-8')

    def check_password_correction(self, attempted_password):
        return bcrypt.check_password_hash(self.password_hash, attempted_password)

    def json(self):
        return {'id': self.id, 'name': self.name, 'email': self.email}

