from fastapi import APIRouter, Depends, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.rate_limit import AI_GENERATE_LIMIT, PREDICT_GLOBAL_LIMIT, limiter
from app.services.streaming import create_sse_response
from app.services.weirwood import predict_global, predict_single

router = APIRouter(prefix="/api/v1/predict", tags=["predictions"])


@router.post("/prophecy/{prophecy_id}")
@limiter.limit(AI_GENERATE_LIMIT)
async def prediction_single(
    request: Request,
    prophecy_id: int,
    session: AsyncSession = Depends(get_session),
):
    return create_sse_response(predict_single(prophecy_id, session))


@router.post("/global")
@limiter.limit(PREDICT_GLOBAL_LIMIT)
async def prediction_global(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    return create_sse_response(predict_global(session))
