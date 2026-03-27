from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models as _models  # noqa: F401 — ensure all models are registered with SQLModel metadata
from app.config import settings
from app.database import async_session, init_db
from app.errors import (
    AIServiceError,
    NotFoundError,
    RateLimitedError,
    ValidationError,
    ai_service_handler,
    not_found_handler,
    rate_limited_handler,
    validation_error_handler,
)
from app.routers.analyze import router as analyze_router
from app.routers.connections import router as connections_router
from app.routers.events import router as events_router
from app.routers.export import router as export_router
from app.routers.graph import router as graph_router
from app.routers.predict import router as predict_router
from app.routers.prophecies import router as prophecies_router
from app.seed.loader import seed_database


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
app.include_router(graph_router)

app.add_exception_handler(NotFoundError, not_found_handler)  # type: ignore[arg-type]
app.add_exception_handler(ValidationError, validation_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(AIServiceError, ai_service_handler)  # type: ignore[arg-type]
app.add_exception_handler(RateLimitedError, rate_limited_handler)  # type: ignore[arg-type]


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
