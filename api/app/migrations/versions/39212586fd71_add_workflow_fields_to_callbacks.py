"""add workflow fields to callbacks

Revision ID: 39212586fd71
Revises: 0001_init
Create Date: 2026-02-25 07:35:38.000334
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '39212586fd71'
down_revision = '0001_init'
branch_labels = None
depends_on = None


def upgrade():
    # 1) Create providers table
    op.create_table(
        "providers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("npi", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    # 2) Create lanes table
    op.create_table(
        "lanes",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
    )

    # 3) Add workflow columns to callbacks
    op.add_column("callbacks", sa.Column("lane_id", sa.String(), nullable=True))
    op.add_column("callbacks", sa.Column("assigned_user_id", sa.String(), nullable=True))
    op.add_column("callbacks", sa.Column("clinician_of_record_id", sa.String(), nullable=True))

    # 4) Add FK constraints
    op.create_foreign_key("fk_callbacks_lane_id", "callbacks", "lanes", ["lane_id"], ["id"])
    op.create_foreign_key("fk_callbacks_assigned_user_id", "callbacks", "users", ["assigned_user_id"], ["id"])
    op.create_foreign_key("fk_callbacks_clinician_of_record_id", "callbacks", "providers", ["clinician_of_record_id"], ["id"])

    # Optional but recommended: make created_by a FK to users.id (your model says it is)
    # If you already have data later, this is still fine because nullable=True.
    op.create_foreign_key("fk_callbacks_created_by", "callbacks", "users", ["created_by"], ["id"])

    # Optional but recommended: make appointments.provider_id a FK to providers.id
    # Only do this if provider_id column exists (it does) and you want constraint now.
    op.create_foreign_key("fk_appointments_provider_id", "appointments", "providers", ["provider_id"], ["id"])


def downgrade():
    # reverse optional FKs first
    op.drop_constraint("fk_appointments_provider_id", "appointments", type_="foreignkey")
    op.drop_constraint("fk_callbacks_created_by", "callbacks", type_="foreignkey")

    # drop callback FKs
    op.drop_constraint("fk_callbacks_clinician_of_record_id", "callbacks", type_="foreignkey")
    op.drop_constraint("fk_callbacks_assigned_user_id", "callbacks", type_="foreignkey")
    op.drop_constraint("fk_callbacks_lane_id", "callbacks", type_="foreignkey")

    # drop columns
    op.drop_column("callbacks", "clinician_of_record_id")
    op.drop_column("callbacks", "assigned_user_id")
    op.drop_column("callbacks", "lane_id")

    # drop tables
    op.drop_table("lanes")
    op.drop_table("providers")