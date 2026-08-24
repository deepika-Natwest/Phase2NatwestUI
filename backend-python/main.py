from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS, UPLOAD_DIR, PORT
from routers import (
    auth, chatbot, capabilities, dashboard, deliverables,
    events, franchises, leadership, pricing, programs,
    recognitions, reference_data, upload, user_statuses, users,
)

app = FastAPI(title="NatWest API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (profile pics, event images, etc.)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Auth (POST /api/login)
app.include_router(auth.router, prefix="/api", tags=["Auth"])

# Dashboard
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# CRUD resources
app.include_router(capabilities.router, prefix="/api/capabilities", tags=["Capabilities"])
app.include_router(franchises.router, prefix="/api/franchises", tags=["Franchises"])

# Users + bulk upload share the /api/users prefix
app.include_router(upload.router, prefix="/api/users", tags=["Upload"])   # /api/users/upload — register BEFORE users
app.include_router(users.router, prefix="/api/users", tags=["Users"])

app.include_router(leadership.router, prefix="/api/leadership", tags=["Leadership"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(recognitions.router, prefix="/api/recognition", tags=["Recognitions"])
app.include_router(deliverables.router, prefix="/api/deliverables", tags=["Deliverables"])
app.include_router(programs.router, prefix="/api/programs", tags=["Programs"])

# Chatbot / AI
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])

# Supporting data
app.include_router(pricing.router, prefix="/api/pricing", tags=["Pricing"])
app.include_router(reference_data.router, prefix="/api/reference-data", tags=["Reference Data"])
app.include_router(user_statuses.router, prefix="/api/user-statuses", tags=["User Statuses"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
