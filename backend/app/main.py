# evalforge-ai/backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
import app.models  # noqa: F401 — ensures all models are registered

from app.routers import (
    auth as auth_router,
    datasets as datasets_router,
    models as models_router,
    experiments as experiments_router,
    evaluations as evaluations_router,
    reports as reports_router,
)


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: DDL is applied via schema.sql (already live in Neon).
# Do NOT re-add Base.metadata.create_all — it drifts from your SQL.

for r in (
    auth_router.router,
    datasets_router.router,
    models_router.router,
    experiments_router.router,
    evaluations_router.router,
    reports_router.router,
):
    app.include_router(r, prefix=settings.API_PREFIX)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME}