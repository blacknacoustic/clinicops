from ..config import settings
from .providers import MessagingProvider, MockProvider

def get_provider() -> MessagingProvider:
    # later: return TwilioProvider when MESSAGING_PROVIDER == "twilio"
    return MockProvider()