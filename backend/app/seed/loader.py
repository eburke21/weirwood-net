import json
import logging
from pathlib import Path

from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Prophecy, Event

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).parent


async def seed_database(session: AsyncSession) -> None:
    await _seed_prophecies(session)
    await _seed_events(session)


async def _seed_prophecies(session: AsyncSession) -> None:
    result = await session.exec(select(Prophecy).limit(1))
    if result.first() is not None:
        logger.info("Prophecies table already has data, skipping seed")
        return

    path = SEED_DIR / "prophecies.json"
    with open(path) as f:
        data = json.load(f)

    for entry in data:
        prophecy = Prophecy(**entry)
        session.add(prophecy)

    await session.commit()

    # Populate FTS index
    await session.exec(
        text("INSERT INTO prophecies_fts(rowid, title, description, notes) SELECT id, title, description, notes FROM prophecies")
    )
    await session.commit()
    logger.info(f"Seeded {len(data)} prophecies (with FTS index)")


async def _seed_events(session: AsyncSession) -> None:
    result = await session.exec(select(Event).limit(1))
    if result.first() is not None:
        logger.info("Events table already has data, skipping seed")
        return

    path = SEED_DIR / "events.json"
    with open(path) as f:
        data = json.load(f)

    for entry in data:
        event = Event(**entry)
        session.add(event)

    await session.commit()
    logger.info(f"Seeded {len(data)} events")
