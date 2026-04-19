from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.rate_limit import AI_GENERATE_LIMIT, limiter
from app.services.streaming import create_sse_response
from app.services.weirwood import analyze_fulfillment

router = APIRouter(prefix="/api/v1/analyze", tags=["analyze"])


class FulfillmentRequest(BaseModel):
    event_description: str | None = None
    event_id: int | None = None


@router.post("/fulfillment")
@limiter.limit(AI_GENERATE_LIMIT)
async def fulfillment_analysis(
    request: Request,
    body: FulfillmentRequest,
    session: AsyncSession = Depends(get_session),
):
    return create_sse_response(
        analyze_fulfillment(body.event_description, body.event_id, session)
    )
