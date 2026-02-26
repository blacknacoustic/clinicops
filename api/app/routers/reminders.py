from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime, timezone

from ..deps import get_db, get_current_user
from ..models import Appointment, ReminderAttempt
from ..messaging.factory import get_provider

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

@router.post("/{appt_id}/send")
def send_reminder(appt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if not appt.patient_phone:
        raise HTTPException(400, "No patient phone on file")

    body = f"Southern Grace Medical Care: Reminder—your appointment is on {appt.appt_start.strftime('%b %d, %Y at %I:%M %p')}. Reply 1 to confirm. Reply STOP to opt out."

    provider = get_provider()
    result = provider.send_sms(appt.patient_phone, body)

    attempt = ReminderAttempt(
        id=str(uuid4()),
        appointment_id=appt.id,
        channel="sms",
        status=result.status,
        provider_response=result.detail,
        external_sid=result.external_sid,
        attempted_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.commit()

    return {"ok": True, "status": result.status, "detail": result.detail}