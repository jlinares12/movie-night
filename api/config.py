import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 4,
        "max_overflow": 8,
    }

    _cloud_sql_conn = os.getenv('CLOUD_SQL_CONNECTION_NAME')
    if _cloud_sql_conn:
        SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {
            "host": f"/cloudsql/{_cloud_sql_conn}"
        }

    CLERK_SECRET_KEY = os.environ.get('CLERK_SECRET_KEY')
    # Clerk JWKS endpoint, e.g. https://<frontend-api>/.well-known/jwks.json
    # Found in Clerk dashboard → API Keys → JWT public key
    CLERK_JWKS_URL = os.environ.get('CLERK_JWKS_URL')

    # Flask-Session (server-side, stored in PostgreSQL)
    SESSION_TYPE = 'sqlalchemy'
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_NAME = 'movie_night_session'
    SESSION_SQLALCHEMY_TABLE = 'flask_sessions'

    # CORS — restrict origins list when production domain is known
    CORS_ALLOWED_ORIGINS = os.environ.get(
        'CORS_ALLOWED_ORIGINS', 'http://localhost:5173'
    ).split(',')
