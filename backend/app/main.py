from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, async_session
from app.errors import (
    NotFoundError, ValidationError, AIServiceError, RateLimitedError,
    not_found_handler, validation_error_handler, ai_service_handler, rate_limited_handler,
)
from app.seed.loader import seed_database
from app.routers.prophecies import router as prophecies_router
from app.routers.events import router as events_router
from app.routers.connections import router as connections_router
from app.routers.analyze import router as analyze_router
from app.routers.predict import router as predict_router
from app.routers.export import router as export_router
import app.models  # noqa: F401 — ensure all models are registered with SQLModel metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session() as session:
        await seed_database(session)
    yield


app = FastAPI(
    title="Weirwood.net API",
    description="ASOIAF Prophecy Tracker & Connection Engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(prophecies_router)
app.include_router(events_router)
app.include_router(connections_router)
app.include_router(analyze_router)
app.include_router(predict_router)
app.include_router(export_router)

app.add_exception_handler(NotFoundError, not_found_handler)
app.add_exception_handler(ValidationError, validation_error_handler)
app.add_exception_handler(AIServiceError, ai_service_handler)
app.add_exception_handler(RateLimitedError, rate_limited_handler)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
