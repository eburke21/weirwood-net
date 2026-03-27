import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from httpx import AsyncClient, ASGITransport

# Create test engine and session factory BEFORE importing app modules
# that depend on app.database (the module-level engine/async_session).
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
)

test_async_session = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_test_session():
    async with test_async_session() as session:
        yield session


# Patch app.database before importing the app so that any module that
# reads ``from app.database import engine`` at import time gets the test
# versions.  We also need these patches in place before the FastAPI
# lifespan handler runs (it calls init_db / seed_database).
import app.database  # noqa: E402

app.database.engine = test_engine
app.database.async_session = test_async_session

from app.main import app as fastapi_app  # noqa: E402
from app.database import get_session  # noqa: E402
from app.seed.loader import seed_database  # noqa: E402

# Override the dependency so routers use the test session
fastapi_app.dependency_overrides[get_session] = get_test_session


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def _setup_db():
    """Create all tables, FTS index, and seed once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.execute(text(app.database.FTS_CREATE))

    async with test_async_session() as session:
        await seed_database(session)

    yield

    # Teardown: drop all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def client(_setup_db):
    """Async HTTP client pointing at the FastAPI app (no lifespan)."""
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
