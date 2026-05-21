"""add admin to group_member_role enum

Revision ID: a1b2c3d4e5f6
Revises: 8f6a04744227
Create Date: 2026-05-21 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '8f6a04744227'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE group_member_role ADD VALUE IF NOT EXISTS 'admin'")


def downgrade():
    # PostgreSQL does not support removing enum values directly.
    # To rollback, the enum must be recreated without 'admin'.
    pass
