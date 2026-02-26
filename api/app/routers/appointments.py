from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timezone, date, timedelta
from ..deps import get_db, get_current_user
from ..models import Appointment, ReminderAttempt, AppointmentConfirm

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.get("")
def list_appointments(range: str = "tomorrow", db: Session = Depends(get_db), user=Depends(get_current_user)):
    today = date.today()
    if range == "today":
        start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    else:
        tmr = today + timedelta(days=1)
        start = datetime(tmr.year, tmr.month, tmr.day, tzinfo=timezone.utc)
    end = start + timedelta(days=1)

    items = db.query(Appointment).filter(and_(Appointment.appt_start >= start, Appointment.appt_start < end))\
        .order_by(Appointment.appt_start.asc()).limit(500).all()
    return items

@router.post("/{appt_id}/confirm")
def confirm(appt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt: raise HTTPException(404, "Not found")
    appt.confirmed_status = AppointmentConfirm.CONFIRMED
    db.commit()
    return {"ok": True}

@router.post("/{appt_id}/reschedule")
def reschedule(appt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt: raise HTTPException(404, "Not found")
    appt.confirmed_status = AppointmentConfirm.RESCHEDULE_REQUESTED
    db.commit()
    return {"ok": True}

@router.get("/{appt_id}/attempts")
def attempts(appt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.query(ReminderAttempt).filter(ReminderAttempt.appointment_id == appt_id)\
        .order_by(ReminderAttempt.attempted_at.desc()).limit(50).all()
    return items