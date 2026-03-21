from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.services.streaming import create_sse_response
from app.services.weirwood import analyze_fulfillment

router = APIRouter(prefix="/api/v1/analyze", tags=["analyze"])


class FulfillmentRequest(BaseModel):
    event_description: str | None = None
    event_id: int | None = None


@router.post("/fulfillment")
async def fulfillment_analysis(
    body: FulfillmentRequest,
    session: AsyncSession = Depends(get_session),
):
    return create_sse_response(
        analyze_fulfillment(body.event_description, body.event_id, session)
    )
