"""add updated_by to callbacks

Revision ID: 8c45a5b5f701
Revises: 39212586fd71
Create Date: 2026-02-25 08:07:04.544963
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8c45a5b5f701'
down_revision = '39212586fd71'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("callbacks", sa.Column("updated_by", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_callbacks_updated_by_users",
        "callbacks",
        "users",
        ["updated_by"],
        ["id"],
    )

def downgrade():
    op.drop_constraint("fk_callbacks_updated_by_users", "callbacks", type_="foreignkey")
    op.drop_column("callbacks", "updated_by")