import pytest
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.errors import AIServiceError
from app.services.spend import (
    check_spend_budget,
    estimate_cost_usd,
    get_daily_spend_usd,
    record_spend,
)


def test_estimate_cost_sonnet_4():
    # claude-sonnet-4: $3/MTok input, $15/MTok output
    cost = estimate_cost_usd("claude-sonnet-4-20250514", 1_000_000, 1_000_000)
    assert cost == pytest.approx(18.0)


def test_estimate_cost_unknown_model_uses_conservative_fallback():
    # Fallback rates are opus-tier ($15/$75) so we over-estimate, never under.
    cost = estimate_cost_usd("future-unknown-model", 1_000_000, 1_000_000)
    assert cost == pytest.approx(90.0)


def test_estimate_cost_zero_tokens():
    assert estimate_cost_usd("claude-sonnet-4", 0, 0) == 0.0


@pytest.mark.asyncio
async def test_record_and_read_back_daily_spend():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore[call-overload]

    async with session_maker() as session:
        assert await get_daily_spend_usd(session) == 0.0

        cost = await record_spend(
            endpoint="test",
            model="claude-sonnet-4-20250514",
            input_tokens=100_000,
            output_tokens=50_000,
            session=session,
        )
        # 0.1 * $3 + 0.05 * $15 = $0.30 + $0.75 = $1.05
        assert cost == pytest.approx(1.05)

        total = await get_daily_spend_usd(session)
        assert total == pytest.approx(1.05)


@pytest.mark.asyncio
async def test_check_budget_raises_when_cap_reached(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore[call-overload]

    # Force a tight cap so one recorded spend trips it.
    monkeypatch.setattr(settings, "MAX_DAILY_API_SPEND_USD", 1.0)

    async with session_maker() as session:
        # Initially under budget — no raise.
        await check_spend_budget(session)

        # Burn past the cap.
        await record_spend(
            endpoint="test",
            model="claude-sonnet-4",
            input_tokens=1_000_000,
            output_tokens=0,
            session=session,
        )

        with pytest.raises(AIServiceError):
            await check_spend_budget(session)


@pytest.mark.asyncio
async def test_check_budget_disabled_when_cap_is_zero(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore[call-overload]

    monkeypatch.setattr(settings, "MAX_DAILY_API_SPEND_USD", 0.0)

    async with session_maker() as session:
        await record_spend(
            endpoint="test",
            model="claude-sonnet-4",
            input_tokens=10_000_000,
            output_tokens=10_000_000,
            session=session,
        )
        # Even with huge spend, zero-cap means unlimited — no raise.
        await check_spend_budget(session)
