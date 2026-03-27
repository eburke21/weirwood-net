from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore[call-overload]

FTS_CREATE = """
CREATE VIRTUAL TABLE IF NOT EXISTS prophecies_fts USING fts5(
    title, description, notes, content=prophecies, content_rowid=id
);
"""


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.execute(text(FTS_CREATE))


async def get_session():
    async with async_session() as session:
        yield session
