from flask import Flask
from config import Config
from .extensions import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register models
    from app.models import (
        User, Group, GroupMember, MovieNightSession,
        SessionResult, MovieProposal, Vote, FoodItem,
    )

    # Register blueprints
    from app.routes.groups import bp as groups_bp
    from app.routes.tech_stack import bp as tech_bp
    from app.routes.webhooks import bp as webhook_bp

    app.register_blueprint(groups_bp)
    app.register_blueprint(tech_bp)
    app.register_blueprint(webhook_bp)

    return app