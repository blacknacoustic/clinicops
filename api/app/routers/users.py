from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4

from ..deps import get_db, require_roles, get_current_user
from ..models import User, Role
from ..schemas import UserOut, UserCreate
from ..security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])

def require_admin(u: User = Depends(get_current_user)) -> User:
    if u.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    return u

@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.username.asc()).all()

@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    exists = db.query(User).filter(User.username == payload.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")

    u = User(
        id=str(uuid4()),
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u