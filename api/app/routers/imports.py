from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from dateutil import parser as dtparser
from ..deps import get_db, get_current_user
from ..models import ImportMapping, Appointment
from ..utils_csv import sniff_headers, parse_rows

router = APIRouter(prefix="/api/imports", tags=["imports"])

@router.post("/appointments/headers")
async def upload_headers(file: UploadFile = File(...), user=Depends(get_current_user)):
    b = await file.read()
    return {"headers": sniff_headers(b)}

@router.post("/appointments/save-mapping")
def save_mapping(name: str, mapping: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(ImportMapping).filter(ImportMapping.name == name).first()
    if existing:
        existing.mapping = mapping
    else:
        db.add(ImportMapping(id=str(uuid4()), name=name, mapping=mapping))
    db.commit()
    return {"ok": True}

@router.get("/appointments/mapping")
def get_mapping(name: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    m = db.query(ImportMapping).filter(ImportMapping.name == name).first()
    return {"mapping": m.mapping if m else None}

@router.post("/appointments/import")
async def import_appointments(name: str, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    m = db.query(ImportMapping).filter(ImportMapping.name == name).first()
    if not m:
        raise HTTPException(400, "No mapping saved yet for this import name")

    b = await file.read()
    rows = parse_rows(b)
    mapping = m.mapping

    imported = 0
    for r in rows:
        try:
            last = (r.get(mapping.get("patient_last_name",""), "")).strip()
            dob_raw = (r.get(mapping.get("patient_dob",""), "")).strip()
            start_raw = (r.get(mapping.get("appt_start",""), "")).strip()
            if not (last and dob_raw and start_raw):
                continue

            dob = dtparser.parse(dob_raw).date()
            appt_start = dtparser.parse(start_raw)

            def g(field: str):
                col = mapping.get(field)
                if not col: return None
                v = r.get(col, "")
                return v.strip() if isinstance(v, str) else None

            db.add(Appointment(
                id=str(uuid4()),
                external_ref=g("external_ref"),
                patient_last_name=last,
                patient_dob=dob,
                patient_phone=g("patient_phone"),
                patient_email=g("patient_email"),
                appt_start=appt_start,
                appt_type=g("appt_type"),
                confirmed_status="UNCONFIRMED"
            ))
            imported += 1
        except Exception:
            continue

    db.commit()
    return {"imported": imported}