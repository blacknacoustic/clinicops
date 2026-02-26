from dataclasses import dataclass
from typing import Optional

@dataclass
class SendResult:
    status: str
    external_sid: Optional[str] = None
    detail: Optional[str] = None

class MessagingProvider:
    def send_sms(self, to_phone: str, body: str) -> SendResult:
        raise NotImplementedError

class MockProvider(MessagingProvider):
    def send_sms(self, to_phone: str, body: str) -> SendResult:
        return SendResult(status="mock", external_sid=None, detail="Mock mode: not sent")