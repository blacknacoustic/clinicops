from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from uuid import uuid4
from datetime import datetime, timezone, date

from ..deps import get_db, get_current_user
from ..models import Callback, CallbackStatus, User, Role
from ..schemas import CallbackCreate, CallbackUpdate
from .. import schemas, models

router = APIRouter(prefix="/api/callbacks", tags=["callbacks"])

@router.post("", response_model=schemas.CallbackRead)
def create_cb(
    payload: CallbackCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cb = Callback(
        id=str(uuid4()),
        patient_last_name=payload.patient_last_name.strip(),
        patient_dob=payload.patient_dob,
        patient_phone=payload.patient_phone,
        category=payload.category,
        priority=payload.priority,
        status=payload.status or CallbackStatus.NEW,
        due_at=payload.due_at,
        created_by=user.id,
        assigned_user_id=(payload.assigned_user_id or user.id),
        updated_by=user.id,
    )
    db.add(cb)
    db.commit()
    db.refresh(cb)
    return cb

@router.get("", response_model=list[schemas.CallbackRead])
def list_cbs(
    status: str | None = None,
    due: str | None = None,
    category: str | None = None, 
    assigned_to: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Callback)

    # Separation Logic: Filters by category if provided, otherwise hides internal tasks
    if category == "INTERNAL_TASK":
        q = q.filter(Callback.category == "INTERNAL_TASK")
    else:
        q = q.filter(or_(Callback.category != "INTERNAL_TASK", Callback.category == None))

    if status:
        q = q.filter(Callback.status == status)
    
    if assigned_to:
        q = q.filter(Callback.assigned_user_id == assigned_to)

    now = datetime.now(timezone.utc)
    if due == "overdue":
        q = q.filter(and_(Callback.status != CallbackStatus.COMPLETED, Callback.due_at < now))
    elif due == "today":
        today = date.today()
        start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
        end = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc)
        q = q.filter(and_(Callback.status != CallbackStatus.COMPLETED, Callback.due_at >= start, Callback.due_at <= end))

    return q.order_by(Callback.due_at.asc()).all()

@router.patch("/{cb_id}", response_model=schemas.CallbackRead)
def update_cb(
    cb_id: str,
    payload: CallbackUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cb = db.query(Callback).filter(Callback.id == cb_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cb, k, v)

    cb.updated_by = user.id
    cb.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cb)
    return cb

@router.get("/{cb_id}", response_model=schemas.CallbackRead) 
def get_callback(cb_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cb = db.query(Callback).filter(Callback.id == cb_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Callback not found")
    return cb

@router.delete("/{cb_id}")
def delete_callback(cb_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cb = db.query(Callback).filter(Callback.id == cb_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Callback not found")
    if user.role != Role.ADMIN and cb.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(cb)
    db.commit()
    return {"ok": True}