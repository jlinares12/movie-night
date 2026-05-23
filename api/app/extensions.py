from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_session import Session
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
sess = Session()
cors = CORS()
