import enum
from sqlalchemy import String, Date, DateTime, Boolean, Text, ForeignKey, Enum, func, JSON
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    PROVIDER = "PROVIDER"
    STAFF = "STAFF"

class CallbackCategory(str, enum.Enum):
    RESULTS = "RESULTS"
    SCHEDULING = "SCHEDULING"
    REFERRAL = "REFERRAL"
    MED = "MED"
    BILLING = "BILLING"
    OTHER = "OTHER"

class Priority(str, enum.Enum):
    ROUTINE = "ROUTINE"
    SAME_DAY = "SAME_DAY"
    URGENT = "URGENT"

class CallbackStatus(str, enum.Enum):
    NEW = "NEW"
    ATTEMPTED = "ATTEMPTED"
    WAITING_ON_PATIENT = "WAITING_ON_PATIENT"
    ESCALATED = "ESCALATED"
    COMPLETED = "COMPLETED"

class AppointmentConfirm(str, enum.Enum):
    UNCONFIRMED = "UNCONFIRMED"
    CONFIRMED = "CONFIRMED"
    RESCHEDULE_REQUESTED = "RESCHEDULE_REQUESTED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[Role] = mapped_column(Enum(Role))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Lane(Base):
    __tablename__ = "lanes"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)

class Provider(Base):
    __tablename__ = "providers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    display_name: Mapped[str] = mapped_column(String)
    npi: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Callback(Base):
    __tablename__ = "callbacks"
    id: Mapped[str] = mapped_column(String, primary_key=True)

    patient_last_name: Mapped[str] = mapped_column(String)
    patient_dob: Mapped[str] = mapped_column(Date)
    patient_phone: Mapped[str | None] = mapped_column(String, nullable=True)

    category: Mapped[CallbackCategory] = mapped_column(Enum(CallbackCategory))
    priority: Mapped[Priority] = mapped_column(Enum(Priority))
    status: Mapped[CallbackStatus] = mapped_column(Enum(CallbackStatus), default=CallbackStatus.NEW)

    due_at: Mapped[str] = mapped_column(DateTime(timezone=True))
    lane_id: Mapped[str | None] = mapped_column(String, ForeignKey("lanes.id"), nullable=True)
    assigned_user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    clinician_of_record_id: Mapped[str | None] = mapped_column(String, ForeignKey("providers.id"), nullable=True)

    outcome_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_step: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_due_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    external_ref: Mapped[str | None] = mapped_column(String, nullable=True)

    patient_last_name: Mapped[str] = mapped_column(String)
    patient_dob: Mapped[str] = mapped_column(Date)
    patient_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    patient_email: Mapped[str | None] = mapped_column(String, nullable=True)

    appt_start: Mapped[str] = mapped_column(DateTime(timezone=True))
    appt_type: Mapped[str | None] = mapped_column(String, nullable=True)
    provider_id: Mapped[str | None] = mapped_column(String, ForeignKey("providers.id"), nullable=True)

    confirmed_status: Mapped[AppointmentConfirm] = mapped_column(Enum(AppointmentConfirm), default=AppointmentConfirm.UNCONFIRMED)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ReminderAttempt(Base):
    __tablename__ = "reminder_attempts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    appointment_id: Mapped[str] = mapped_column(String, ForeignKey("appointments.id"))
    channel: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    provider_response: Mapped[str | None] = mapped_column(String, nullable=True)
    external_sid: Mapped[str | None] = mapped_column(String, nullable=True)
    attempted_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ImportMapping(Base):
    __tablename__ = "import_mappings"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    mapping: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())