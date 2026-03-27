from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import Event

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("")
async def list_events(session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(Event).order_by(Event.book))  # type: ignore[arg-type]
    events = result.all()
    return [event.model_dump() for event in events]
