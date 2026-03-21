from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.services.streaming import create_sse_response
from app.services.weirwood import predict_single, predict_global

router = APIRouter(prefix="/api/v1/predict", tags=["predictions"])


@router.post("/prophecy/{prophecy_id}")
async def prediction_single(
    prophecy_id: int,
    session: AsyncSession = Depends(get_session),
):
    return create_sse_response(predict_single(prophecy_id, session))


@router.post("/global")
async def prediction_global(
    session: AsyncSession = Depends(get_session),
):
    return create_sse_response(predict_global(session))
