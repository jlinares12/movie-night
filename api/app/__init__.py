from flask import Flask
from config import Config
from .extensions import db, migrate, sess, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Flask-Session needs the db instance set before init
    app.config['SESSION_SQLALCHEMY'] = db
    sess.init_app(app)

    cors.init_app(
        app,
        origins=app.config['CORS_ALLOWED_ORIGINS'],
        supports_credentials=True,
    )

    # Register models (keeps them in Alembic's metadata scope)
    from app.models import (
        User, Group, GroupMember, MovieNightSession,
        SessionResult, MovieProposal, Vote, FoodItem, Movie,
    )

    # Register blueprints
    from app.routes.groups import bp as groups_bp
    from app.routes.sessions import bp as sessions_bp
    from app.routes.tech_stack import bp as tech_bp
    from app.routes.webhooks import bp as webhook_bp
    from app.routes.movies import bp as movies_bp
    from app.routes.auth import bp as auth_bp
    from app.routes.proposals import bp as proposals_bp
    from app.routes.health import bp as health_bp

    app.register_blueprint(groups_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(tech_bp)
    app.register_blueprint(webhook_bp)
    app.register_blueprint(movies_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(proposals_bp)
    app.register_blueprint(health_bp)

    return app
