import logging
from datetime import datetime, timezone

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.models import SpendLog

logger = logging.getLogger(__name__)

# USD per 1M tokens. Keyed by model-id prefix so minor version bumps
# (e.g. dated suffixes) don't require a table update.
MODEL_PRICING: dict[str, tuple[float, float]] = {
    "claude-opus-4": (15.0, 75.0),
    "claude-sonnet-4": (3.0, 15.0),
    "claude-haiku-4": (0.8, 4.0),
    "claude-3-7-sonnet": (3.0, 15.0),
    "claude-3-5-sonnet": (3.0, 15.0),
    "claude-3-5-haiku": (0.8, 4.0),
    "claude-3-opus": (15.0, 75.0),
}

# Fallback when model prefix is unknown — pick a conservative rate so the
# budget check over-estimates rather than under-estimates cost.
_FALLBACK_PRICING = (15.0, 75.0)


def estimate_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    input_rate, output_rate = _FALLBACK_PRICING
    for prefix, rates in MODEL_PRICING.items():
        if model.startswith(prefix):
            input_rate, output_rate = rates
            break
    return (input_tokens / 1_000_000) * input_rate + (output_tokens / 1_000_000) * output_rate


def _today_start_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


async def get_daily_spend_usd(session: AsyncSession) -> float:
    stmt = select(func.coalesce(func.sum(SpendLog.cost_usd), 0.0)).where(
        SpendLog.timestamp >= _today_start_utc()
    )
    result = await session.exec(stmt)  # type: ignore[call-overload]
    value = result.one()
    return float(value) if value is not None else 0.0


async def check_spend_budget(session: AsyncSession) -> None:
    # Local import to avoid circular dependency (errors -> spend -> errors).
    from app.errors import AIServiceError

    cap = settings.MAX_DAILY_API_SPEND_USD
    if cap <= 0:
        return  # Disabled / unlimited.

    spent = await get_daily_spend_usd(session)
    if spent >= cap:
        logger.warning(
            "Daily spend cap reached: $%.4f / $%.2f — blocking Claude API call",
            spent,
            cap,
        )
        raise AIServiceError(
            f"Daily API spend limit reached (${spent:.2f} / ${cap:.2f}). "
            "Try again tomorrow."
        )


async def record_spend(
    endpoint: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    session: AsyncSession,
) -> float:
    cost = estimate_cost_usd(model, input_tokens, output_tokens)
    entry = SpendLog(
        endpoint=endpoint,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost,
    )
    session.add(entry)
    await session.commit()
    logger.info(
        "Claude usage: endpoint=%s model=%s input=%d output=%d cost=$%.4f",
        endpoint,
        model,
        input_tokens,
        output_tokens,
        cost,
    )
    return cost
