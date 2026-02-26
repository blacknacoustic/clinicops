from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, callbacks, dashboard, imports, appointments, reminders, twilio, users

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(callbacks.router)
app.include_router(dashboard.router)
app.include_router(imports.router)
app.include_router(appointments.router)
app.include_router(reminders.router)
app.include_router(twilio.router)
app.include_router(users.router)