from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
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
    creator_id = user.id

    cb = Callback(
        id=str(uuid4()),
        patient_last_name=payload.patient_last_name.strip(),
        patient_dob=payload.patient_dob,
        patient_phone=payload.patient_phone,
        category=payload.category,
        priority=payload.priority,
        status=CallbackStatus.NEW,
        due_at=payload.due_at,
        created_by=creator_id,
        assigned_user_id=(payload.assigned_user_id or creator_id),
        updated_by=creator_id,
    )
    db.add(cb)
    db.commit()
    db.refresh(cb)
    return cb

@router.get("", response_model=list[schemas.CallbackRead])
def list_cbs(
    status: str | None = None,
    due: str | None = None,
    assigned_to: str | None = None, # New: Filter by assigned staff
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Callback)

    if status:
        q = q.filter(Callback.status == status)
    
    if assigned_to:
        q = q.filter(Callback.assigned_user_id == assigned_to)

    now = datetime.now(timezone.utc)

    if due == "overdue":
        q = q.filter(
            and_(
                Callback.status != CallbackStatus.COMPLETED,
                Callback.due_at < now,
            )
        )
    elif due == "today":
        today = date.today()
        start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
        end = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc)
        q = q.filter(
            and_(
                Callback.status != CallbackStatus.COMPLETED,
                Callback.due_at >= start,
                Callback.due_at <= end,
            )
        )

    return q.order_by(Callback.due_at.asc()).limit(500).all()

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

    # model_dump(exclude_unset=True) allows partial updates 
    # (e.g. updating JUST the outcome_note from the Task board)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cb, k, v)

    cb.updated_by = user.id
    cb.updated_at = datetime.now(timezone.utc) # Track when progress was made

    db.commit()
    db.refresh(cb)
    return cb

@router.post("/{cb_id}/complete", response_model=schemas.CallbackRead)
def complete_cb(
    cb_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cb = db.query(Callback).filter(Callback.id == cb_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Not found")

    cb.status = CallbackStatus.COMPLETED
    cb.completed_at = datetime.now(timezone.utc)
    cb.updated_by = user.id

    db.commit()
    db.refresh(cb)
    return cb

@router.get("", response_model=list[schemas.CallbackRead])
def list_cbs(
    status: str | None = None,
    category: str | None = None,  # Add this parameter
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Callback)

    # CRITICAL: If we ask for INTERNAL_TASK, only show those.
    # Otherwise, hide them from the regular callback list.
    if category == "INTERNAL_TASK":
        q = q.filter(Callback.category == "INTERNAL_TASK")
    else:
        q = q.filter(Callback.category != "INTERNAL_TASK")

    if status:
        q = q.filter(Callback.status == status)

    return q.order_by(Callback.due_at.asc()).all()

@router.delete("/{cb_id}")
def delete_callback(cb_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cb = db.query(Callback).filter(Callback.id == cb_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Callback not found")
    
    # Restrict deletion to Admin or Creator
    if user.role != Role.ADMIN and cb.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(cb)
    db.commit()
    return {"ok": True}