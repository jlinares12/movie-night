"""rename movie_night_session to call_time_session

Revision ID: 94142c319da2
Revises: 3ee9a76f3481
Create Date: 2026-06-13 03:19:03.069473

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '94142c319da2'
down_revision = '3ee9a76f3481'
branch_labels = None
depends_on = None


# NOTE: Autogenerate cannot detect a table rename — it emitted a drop+create,
# which fails because the `session_status` enum type already exists (and would
# also need FK reordering). Replaced with an in-place rename: Postgres carries
# the inbound FKs (vote / movie_proposal / food_item / session_result) and the
# `session_status` type across the rename automatically; only the table and its
# two named indexes need touching so future autogenerate stays clean.
def upgrade():
    op.rename_table('movie_night_session', 'call_time_session')
    op.execute('ALTER INDEX IF EXISTS ix_movie_night_session_created_by_id '
               'RENAME TO ix_call_time_session_created_by_id')
    op.execute('ALTER INDEX IF EXISTS ix_movie_night_session_group_id '
               'RENAME TO ix_call_time_session_group_id')


def downgrade():
    op.execute('ALTER INDEX IF EXISTS ix_call_time_session_group_id '
               'RENAME TO ix_movie_night_session_group_id')
    op.execute('ALTER INDEX IF EXISTS ix_call_time_session_created_by_id '
               'RENAME TO ix_movie_night_session_created_by_id')
    op.rename_table('call_time_session', 'movie_night_session')
