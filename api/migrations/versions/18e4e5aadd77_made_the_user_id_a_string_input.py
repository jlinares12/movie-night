"""Made the user_id a string input

Revision ID: 18e4e5aadd77
Revises: 0b977e3fe5a5
Create Date: 2025-07-29 15:00:36.279357

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '18e4e5aadd77'
down_revision = '0b977e3fe5a5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('user_id',
               existing_type=sa.INTEGER(),
               type_=sa.String(length=64),
               existing_nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('user_id',
               existing_type=sa.String(length=64),
               type_=sa.INTEGER(),
               existing_nullable=True)

    # ### end Alembic commands ###
