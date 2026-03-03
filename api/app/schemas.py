from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict
from .models import CallbackCategory, Priority, CallbackStatus, Role

class LoginReq(BaseModel):
    username: str
    password: str

class LoginResp(BaseModel):
    access_token: str

# --- CALLBACK SCHEMAS ---

class CallbackCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patient_last_name: str
    patient_dob: date
    patient_phone: str | None = Field(default=None, alias="phone")
    category: CallbackCategory
    priority: Priority
    due_at: datetime
    status: CallbackStatus | None = None
    assigned_user_id: str | None = None

class CallbackUpdate(BaseModel):
    status: CallbackStatus | None = None
    due_at: datetime | None = None
    outcome_note: str | None = None
    next_step: str | None = None
    next_due_at: datetime | None = None
    assigned_user_id: str | None = None

# ADD THIS: This is what the router is looking for
class CallbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_last_name: str
    patient_dob: date
    patient_phone: str | None
    category: CallbackCategory
    priority: Priority
    status: CallbackStatus
    due_at: datetime
    created_at: datetime
    created_by: str
    assigned_user_id: str | None = None
    outcome_note: str | None = None
    next_step: str | None = None

# --- OTHER SCHEMAS ---

class DashboardSummary(BaseModel):
    open: int
    due_today: int
    overdue: int
    completed_today: int
    oldest_open_minutes: int | None
    
class UserOut(BaseModel):
    id: str
    username: str
    role: Role
    is_active: bool

class UserCreate(BaseModel):
    username: str
    password: str
    role: Role = Role.STAFF
    is_active: bool = True
  
class MeOut(BaseModel):
    id: str
    username: str
    role: Role
    is_active: bool