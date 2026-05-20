from datetime import datetime, timezone
from app.extensions import db


class Movie(db.Model):
    __tablename__ = 'movies'

    id                = db.Column(db.Integer, primary_key=True)
    tmdb_id           = db.Column(db.Integer, unique=True, nullable=False, index=True)
    title             = db.Column(db.String(512), nullable=False, index=True)
    original_title    = db.Column(db.String(512), nullable=True)
    overview          = db.Column(db.Text, nullable=True)
    poster_url        = db.Column(db.String(512), nullable=True)
    backdrop_url      = db.Column(db.String(512), nullable=True)
    release_date      = db.Column(db.Date, nullable=True)
    runtime_minutes   = db.Column(db.Integer, nullable=True)
    genres            = db.Column(db.JSON, nullable=False, default=list)
    popularity        = db.Column(db.Float, nullable=True)
    vote_average      = db.Column(db.Float, nullable=True)
    original_language = db.Column(db.String(10), nullable=True)
    cached_at         = db.Column(db.DateTime(timezone=True), nullable=False,
                                  default=lambda: datetime.now(timezone.utc))

    def is_stale(self, ttl_days: int = 30) -> bool:
        age = datetime.now(timezone.utc) - self.cached_at
        return age.days >= ttl_days

    def to_dict(self) -> dict:
        return {
            'id':                self.id,
            'tmdb_id':           self.tmdb_id,
            'title':             self.title,
            'original_title':    self.original_title,
            'overview':          self.overview,
            'poster_url':        self.poster_url,
            'backdrop_url':      self.backdrop_url,
            'release_date':      self.release_date.isoformat() if self.release_date else None,
            'runtime_minutes':   self.runtime_minutes,
            'genres':            self.genres,
            'popularity':        self.popularity,
            'vote_average':      self.vote_average,
            'original_language': self.original_language,
            'cached_at':         self.cached_at.isoformat() if self.cached_at else None,
        }
