from alembic import op
import sqlalchemy as sa

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("username", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.Enum("ADMIN","MANAGER","PROVIDER","STAFF", name="role"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "callbacks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("patient_last_name", sa.String(), nullable=False),
        sa.Column("patient_dob", sa.Date(), nullable=False),
        sa.Column("patient_phone", sa.String(), nullable=True),
        sa.Column("category", sa.Enum("RESULTS","SCHEDULING","REFERRAL","MED","BILLING","OTHER", name="callbackcategory"), nullable=False),
        sa.Column("priority", sa.Enum("ROUTINE","SAME_DAY","URGENT", name="priority"), nullable=False),
        sa.Column("status", sa.Enum("NEW","ATTEMPTED","WAITING_ON_PATIENT","ESCALATED","COMPLETED", name="callbackstatus"), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("outcome_note", sa.Text(), nullable=True),
        sa.Column("next_step", sa.Text(), nullable=True),
        sa.Column("next_due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "appointments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("external_ref", sa.String(), nullable=True),
        sa.Column("patient_last_name", sa.String(), nullable=False),
        sa.Column("patient_dob", sa.Date(), nullable=False),
        sa.Column("patient_phone", sa.String(), nullable=True),
        sa.Column("patient_email", sa.String(), nullable=True),
        sa.Column("appt_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("appt_type", sa.String(), nullable=True),
        sa.Column("provider_id", sa.String(), nullable=True),
        sa.Column("confirmed_status", sa.Enum("UNCONFIRMED","CONFIRMED","RESCHEDULE_REQUESTED","CANCELLED", name="apptconfirm"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "reminder_attempts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("appointment_id", sa.String(), nullable=False),
        sa.Column("channel", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("provider_response", sa.String(), nullable=True),
        sa.Column("external_sid", sa.String(), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "import_mappings",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("mapping", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

def downgrade():
    op.drop_table("import_mappings")
    op.drop_table("reminder_attempts")
    op.drop_table("appointments")
    op.drop_table("callbacks")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")