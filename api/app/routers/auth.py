from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from ..deps import get_db, get_current_user
from ..schemas import LoginReq, LoginResp
from ..models import User, Role
from ..security import verify_password, create_access_token, hash_password
from ..schemas import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResp)
def login(payload: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Bad credentials")
    return {"access_token": create_access_token(user.id, user.role.value)}

@router.post("/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        return {"ok": True, "note": "admin already exists"}
    u = User(id=str(uuid4()), username="admin", password_hash=hash_password("admin123!"), role=Role.ADMIN, is_active=True)
    db.add(u); db.commit()
    return {"ok": True, "username": "admin", "password": "admin123!"}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user