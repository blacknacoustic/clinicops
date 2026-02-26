from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    APP_BASE_URL: str = "http://localhost:8000"
    TIMEZONE: str = "America/Chicago"

    MESSAGING_PROVIDER: str = "mock"
    REMINDER_MODE: str = "manual"

    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None

settings = Settings()