from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, date
from ..deps import get_db, get_current_user
from ..models import Callback, CallbackStatus
from ..schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today = date.today()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    end = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc)

    open_count = db.query(func.count(Callback.id)).filter(Callback.status != CallbackStatus.COMPLETED).scalar()
    overdue = db.query(func.count(Callback.id)).filter(Callback.status != CallbackStatus.COMPLETED, Callback.due_at < now).scalar()
    due_today = db.query(func.count(Callback.id)).filter(Callback.status != CallbackStatus.COMPLETED, Callback.due_at >= start, Callback.due_at <= end).scalar()
    completed_today = db.query(func.count(Callback.id)).filter(Callback.status == CallbackStatus.COMPLETED, Callback.completed_at >= start, Callback.completed_at <= end).scalar()

    oldest = db.query(func.min(Callback.created_at)).filter(Callback.status != CallbackStatus.COMPLETED).scalar()
    oldest_minutes = int((now - oldest).total_seconds() // 60) if oldest else None

    return {
        "open": int(open_count or 0),
        "due_today": int(due_today or 0),
        "overdue": int(overdue or 0),
        "completed_today": int(completed_today or 0),
        "oldest_open_minutes": oldest_minutes
    }