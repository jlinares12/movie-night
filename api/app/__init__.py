from flask import Flask
from config import Config
#from .extensions import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    #db.init_app(app)
    #migrate.init_app(app, db)

    # Register blueprints
    from app.routes.groups import bp as groups_bp
    from app.routes.tech_stack import bp as tech_bp

    app.register_blueprint(groups_bp)
    app.register_blueprint(tech_bp)

    return app