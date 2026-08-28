"""restore compound fk on vote

Revision ID: e6cc35f98219
Revises: 94142c319da2
Create Date: 2026-08-28 22:20:09.410323

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e6cc35f98219'
down_revision = '94142c319da2'
branch_labels = None
depends_on = None


# Reinstates fk_vote_proposal_session, dropped by 3ee9a76f3481, so the database
# itself guarantees a vote's proposal belongs to the same session as the vote.
# `vote_proposal_id_fkey` is the name Postgres assigned when 3ee9a76f3481
# created the replacement single-column FK with name=None.
#
# ADD CONSTRAINT fails if any existing row violates it, and migrations run as a
# Cloud Run Job that blocks the deploy on failure. Confirm this returns 0 first:
#   SELECT count(*) FROM vote v
#     JOIN movie_proposal p ON v.proposal_id = p.id
#    WHERE p.session_id <> v.session_id;
def upgrade():
    with op.batch_alter_table('vote', schema=None) as batch_op:
        batch_op.drop_constraint('vote_proposal_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_vote_proposal_session',
            'movie_proposal',
            ['proposal_id', 'session_id'],
            ['id', 'session_id'],
            ondelete='CASCADE',
        )


def downgrade():
    with op.batch_alter_table('vote', schema=None) as batch_op:
        batch_op.drop_constraint('fk_vote_proposal_session', type_='foreignkey')
        batch_op.create_foreign_key(
            'vote_proposal_id_fkey',
            'movie_proposal',
            ['proposal_id'],
            ['id'],
            ondelete='CASCADE',
        )
