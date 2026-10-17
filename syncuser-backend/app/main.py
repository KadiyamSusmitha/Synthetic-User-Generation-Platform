from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.experiments import router as experiments_router
from app.routers.personas import router as personas_router
from app.routers.survey import router as survey_router
from app.routers.synthetic_responses import (
    router as synthetic_responses_router,
)
from app.routers.memory import router as memory_router
from app.routers.analytics import router as analytics_router
from app.routers.reports import router as reports_router
from app.routers.interview import router as interview_router

app = FastAPI(
    title="SynUser API",
    description="Backend API for the SynUser Synthetic User Generation Platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication routes
app.include_router(auth_router)

# Dashboard routes
app.include_router(dashboard_router)

# Experiment routes
app.include_router(experiments_router)

# Persona routes
app.include_router(personas_router)

app.include_router(survey_router)

app.include_router(synthetic_responses_router)

app.include_router(memory_router)

app.include_router(analytics_router)

app.include_router(reports_router)
# Interview routes
app.include_router(interview_router)

@app.get("/")
def root():
    return {
        "message": "SynUser backend is running successfully!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }