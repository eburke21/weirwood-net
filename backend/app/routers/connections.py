from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import or_
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import Connection
from app.rate_limit import AI_GENERATE_LIMIT, limiter
from app.services.streaming import create_sse_response
from app.services.weirwood import find_connections, get_cached_connections

router = APIRouter(prefix="/api/v1/prophecies", tags=["connections"])


class GenerateRequest(BaseModel):
    force_regenerate: bool = False


@router.get("/{prophecy_id}/connections")
async def get_connections(
    prophecy_id: int,
    session: AsyncSession = Depends(get_session),
):
    connections = await get_cached_connections(prophecy_id, session)
    return {
        "prophecy_id": prophecy_id,
        "connections": connections,
        "cached": len(connections) > 0,
    }


@router.post("/{prophecy_id}/connections/generate")
@limiter.limit(AI_GENERATE_LIMIT)
async def generate_connections(
    request: Request,
    prophecy_id: int,
    body: GenerateRequest = GenerateRequest(),
    session: AsyncSession = Depends(get_session),
):
    if body.force_regenerate:
        # Delete existing connections for this prophecy
        existing = await session.exec(
            select(Connection).where(
                or_(
                    Connection.source_prophecy_id == prophecy_id,  # type: ignore[arg-type]
                    Connection.target_prophecy_id == prophecy_id,  # type: ignore[arg-type]
                )
            )
        )
        for conn in existing.all():
            await session.delete(conn)
        await session.commit()

    return create_sse_response(find_connections(prophecy_id, session))
