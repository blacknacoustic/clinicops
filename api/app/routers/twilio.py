from fastapi import APIRouter, Form
from fastapi.responses import Response

router = APIRouter(prefix="/api/twilio", tags=["twilio"])

def twiml(xml: str) -> Response:
    return Response(content=xml, media_type="text/xml")

@router.post("/sms")
def sms(Body: str = Form(""), From: str = Form("")):
    # placeholder; will update appointment confirmations later
    return twiml("""<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks! We got your message.</Message></Response>""")