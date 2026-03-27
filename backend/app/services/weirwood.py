import hashlib
import json
import logging
from collections.abc import AsyncGenerator

import anthropic
from anthropic.types import TextBlock
from sqlalchemy import or_
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.errors import NotFoundError
from app.models import AnalysisCache, Connection, ConnectionType, Event, Prophecy
from app.services.prompts import (
    CONNECTION_FINDER_SYSTEM,
    FULFILLMENT_SYSTEM,
    PREDICTION_SYSTEM,
    build_connection_finder_prompt,
    build_fulfillment_prompt,
    build_prediction_global_prompt,
    build_prediction_single_prompt,
)
from app.services.streaming import sse_event

logger = logging.getLogger(__name__)

VALID_CONNECTION_TYPES = {t.value for t in ConnectionType}


def _get_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


def compute_input_hash(analysis_type: str, input_data: str) -> str:
    return hashlib.sha256(f"{analysis_type}:{input_data}".encode()).hexdigest()


async def get_cached_analysis(analysis_type: str, input_hash: str, session: AsyncSession) -> AnalysisCache | None:
    result = await session.exec(
        select(AnalysisCache).where(
            AnalysisCache.analysis_type == analysis_type,
            AnalysisCache.input_hash == input_hash,
        )
    )
    return result.first()


async def store_analysis(
    analysis_type: str,
    input_hash: str,
    input_summary: str,
    result_json: str,
    model_version: str,
    session: AsyncSession,
) -> None:
    existing = await get_cached_analysis(analysis_type, input_hash, session)
    if existing:
        existing.result_json = result_json
        existing.model_version = model_version
        session.add(existing)
    else:
        cache_entry = AnalysisCache(
            analysis_type=analysis_type,
            input_hash=input_hash,
            input_summary=input_summary,
            result_json=result_json,
            model_version=model_version,
        )
        session.add(cache_entry)
    await session.commit()


async def get_cached_connections(prophecy_id: int, session: AsyncSession) -> list[dict]:
    query = select(Connection).where(
        or_(
            Connection.source_prophecy_id == prophecy_id,  # type: ignore[arg-type]
            Connection.target_prophecy_id == prophecy_id,  # type: ignore[arg-type]
        )
    )
    result = await session.exec(query)
    connections = result.all()

    enriched = []
    for conn in connections:
        connected_id = (
            conn.target_prophecy_id
            if conn.source_prophecy_id == prophecy_id
            else conn.source_prophecy_id
        )
        connected = await session.get(Prophecy, connected_id)
        enriched.append({
            "id": conn.id,
            "connected_prophecy": {
                "id": connected.id,
                "title": connected.title,
                "status": connected.status,
            } if connected else None,
            "connection_type": conn.connection_type,
            "confidence": conn.confidence,
            "evidence": conn.evidence,
            "implication": conn.implication,
            "model_version": conn.model_version,
            "generated_at": conn.generated_at.isoformat() if conn.generated_at else None,
        })

    return enriched


async def find_connections(prophecy_id: int, session: AsyncSession) -> AsyncGenerator:
    # Fetch target prophecy
    target = await session.get(Prophecy, prophecy_id)
    if target is None:
        raise NotFoundError(f"Prophecy with id {prophecy_id} not found")

    # Fetch all other prophecies
    result = await session.exec(select(Prophecy).where(Prophecy.id != prophecy_id))
    others = result.all()

    yield sse_event("status", {
        "message": f"Analyzing connections for '{target.title}' against {len(others)} other prophecies..."
    })

    # Build prompt and call Claude
    prompt = build_connection_finder_prompt(target, others)
    valid_ids = {p.id for p in others}

    try:
        client = _get_client()
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=4096,
            system=CONNECTION_FINDER_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract text content
        first_block = response.content[0]
        raw_text = first_block.text if isinstance(first_block, TextBlock) else ""
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0]

        data = json.loads(raw_text)
        raw_connections = data.get("connections", [])

    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        yield sse_event("error", {"message": f"AI service error: {e.message}"})
        return
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error(f"Failed to parse AI response: {e}")
        yield sse_event("error", {"message": "Failed to parse AI response"})
        return

    # Validate and persist each connection
    persisted_count = 0
    for raw in raw_connections:
        connected_id = raw.get("connected_to_id")
        conn_type = raw.get("connection_type")
        confidence = raw.get("confidence", 0.5)
        evidence = raw.get("evidence", "")
        implication = raw.get("implication", "")

        # Validate
        if connected_id not in valid_ids:
            logger.warning(f"Skipping connection to unknown prophecy {connected_id}")
            continue
        if conn_type not in VALID_CONNECTION_TYPES:
            logger.warning(f"Skipping invalid connection type: {conn_type}")
            continue
        confidence = max(0.0, min(1.0, float(confidence)))

        # Upsert: check if this exact connection exists
        existing_query = select(Connection).where(
            Connection.source_prophecy_id == prophecy_id,
            Connection.target_prophecy_id == connected_id,
            Connection.connection_type == conn_type,
        )
        existing_result = await session.exec(existing_query)
        existing = existing_result.first()

        if existing:
            existing.confidence = confidence
            existing.evidence = evidence
            existing.implication = implication
            existing.model_version = settings.CLAUDE_MODEL
            session.add(existing)
        else:
            connection = Connection(
                source_prophecy_id=prophecy_id,
                target_prophecy_id=connected_id,
                connection_type=conn_type,
                confidence=confidence,
                evidence=evidence,
                implication=implication,
                model_version=settings.CLAUDE_MODEL,
            )
            session.add(connection)

        await session.commit()
        persisted_count += 1

        # Fetch connected prophecy info for the SSE event
        connected = await session.get(Prophecy, connected_id)
        yield sse_event("connection", {
            "connected_to_id": connected_id,
            "connected_prophecy_title": connected.title if connected else "Unknown",
            "connected_prophecy_status": connected.status if connected else None,
            "connection_type": conn_type,
            "confidence": confidence,
            "evidence": evidence,
            "implication": implication,
        })

    yield sse_event("complete", {
        "total_connections": persisted_count,
        "persisted": True,
    })


# --- Fulfillment Analyzer ---

def _sanitize_input(text: str) -> str:
    import re
    text = re.sub(r"<[^>]+>", "", text)  # Strip HTML tags
    return text[:500].strip()


async def analyze_fulfillment(
    event_description: str | None,
    event_id: int | None,
    session: AsyncSession,
) -> AsyncGenerator:
    # Resolve event description
    if event_id is not None:
        event = await session.get(Event, event_id)
        if event is None:
            raise NotFoundError(f"Event with id {event_id} not found")
        description = event.description
        summary = event.title
    elif event_description:
        description = _sanitize_input(event_description)
        summary = description[:80]
    else:
        yield sse_event("error", {"message": "Either event_description or event_id is required"})
        return

    # Check cache
    input_hash = compute_input_hash("fulfillment", description)
    cached = await get_cached_analysis("fulfillment", input_hash, session)
    if cached:
        cached_data = json.loads(cached.result_json)
        yield sse_event("status", {"message": f"Returning cached analysis for '{summary}'..."})
        for match in cached_data.get("matches", []):
            prophecy = await session.get(Prophecy, match.get("prophecy_id"))
            match["prophecy_title"] = prophecy.title if prophecy else "Unknown"
            yield sse_event("match", match)
        yield sse_event("complete", {"total_matches": len(cached_data.get("matches", [])), "cached": True})
        return

    # Fetch unfulfilled/partially fulfilled prophecies
    result = await session.exec(
        select(Prophecy).where(Prophecy.status.in_(["unfulfilled", "partially_fulfilled"]))  # type: ignore[attr-defined]
    )
    prophecies = result.all()

    yield sse_event("status", {
        "message": f"Analyzing which prophecies '{summary}' might fulfill ({len(prophecies)} candidates)..."
    })

    # Build prompt and call Claude
    prompt = build_fulfillment_prompt(description, prophecies)
    valid_ids = {p.id for p in prophecies}

    try:
        client = _get_client()
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=4096,
            system=FULFILLMENT_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        first_block = response.content[0]
        raw_text = first_block.text if isinstance(first_block, TextBlock) else ""
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0]

        data = json.loads(raw_text)
        matches = data.get("matches", [])

    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        yield sse_event("error", {"message": f"AI service error: {e.message}"})
        return
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error(f"Failed to parse AI response: {e}")
        yield sse_event("error", {"message": "Failed to parse AI response"})
        return

    # Validate and yield matches
    valid_matches = []
    for match in matches:
        prophecy_id = match.get("prophecy_id")
        if prophecy_id not in valid_ids:
            continue
        match["match_confidence"] = max(0.0, min(1.0, float(match.get("match_confidence", 0.5))))
        prophecy = await session.get(Prophecy, prophecy_id)
        match["prophecy_title"] = prophecy.title if prophecy else "Unknown"
        valid_matches.append(match)
        yield sse_event("match", match)

    # Cache the result
    await store_analysis(
        analysis_type="fulfillment",
        input_hash=input_hash,
        input_summary=summary,
        result_json=json.dumps({"matches": valid_matches}),
        model_version=settings.CLAUDE_MODEL,
        session=session,
    )

    yield sse_event("complete", {"total_matches": len(valid_matches), "cached": False})


# --- TWOW Predictions ---

async def predict_single(prophecy_id: int, session: AsyncSession) -> AsyncGenerator:
    prophecy = await session.get(Prophecy, prophecy_id)
    if prophecy is None:
        raise NotFoundError(f"Prophecy with id {prophecy_id} not found")

    # Check cache
    input_hash = compute_input_hash("prediction_single", f"{prophecy_id}:{settings.CLAUDE_MODEL}")
    cached = await get_cached_analysis("prediction_single", input_hash, session)
    if cached:
        cached_data = json.loads(cached.result_json)
        yield sse_event("status", {"message": f"Returning cached prediction for '{prophecy.title}'..."})
        yield sse_event("chunk", {"text": cached_data.get("text", "")})
        yield sse_event("complete", {"cached": True})
        return

    # Fetch connections for this prophecy
    conn_result = await session.exec(
        select(Connection).where(
            or_(
                Connection.source_prophecy_id == prophecy_id,  # type: ignore[arg-type]
                Connection.target_prophecy_id == prophecy_id,  # type: ignore[arg-type]
            )
        )
    )
    connections = conn_result.all()

    # Build prophecies lookup for connection formatting
    all_result = await session.exec(select(Prophecy))
    prophecies_by_id: dict[int, Prophecy] = {p.id: p for p in all_result.all() if p.id is not None}

    yield sse_event("status", {
        "message": f"Generating TWOW prediction for '{prophecy.title}'..."
    })

    prompt = build_prediction_single_prompt(prophecy, connections, prophecies_by_id)

    try:
        client = _get_client()
        full_text = ""
        async with client.messages.stream(
            model=settings.CLAUDE_MODEL,
            max_tokens=2048,
            system=PREDICTION_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                yield sse_event("chunk", {"text": text})

        # Cache the full result
        await store_analysis(
            analysis_type="prediction_single",
            input_hash=input_hash,
            input_summary=f"Prediction for: {prophecy.title}",
            result_json=json.dumps({"text": full_text}),
            model_version=settings.CLAUDE_MODEL,
            session=session,
        )

        yield sse_event("complete", {"cached": False})

    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        yield sse_event("error", {"message": f"AI service error: {e.message}"})


async def predict_global(session: AsyncSession) -> AsyncGenerator:
    # Fetch all unfulfilled prophecies
    result = await session.exec(
        select(Prophecy).where(Prophecy.status.in_(["unfulfilled", "partially_fulfilled", "debated"]))  # type: ignore[attr-defined]
    )
    prophecies = result.all()

    # Check cache
    prophecy_ids = sorted(p.id for p in prophecies if p.id is not None)
    input_hash = compute_input_hash("prediction_global", f"{prophecy_ids}:{settings.CLAUDE_MODEL}")
    cached = await get_cached_analysis("prediction_global", input_hash, session)
    if cached:
        cached_data = json.loads(cached.result_json)
        yield sse_event("status", {"message": "Returning cached global predictions report..."})
        yield sse_event("chunk", {"text": cached_data.get("text", "")})
        yield sse_event("complete", {"cached": True})
        return

    # Fetch all connections
    conn_result = await session.exec(select(Connection))
    connections = conn_result.all()

    # Build lookup
    all_result = await session.exec(select(Prophecy))
    prophecies_by_id: dict[int, Prophecy] = {p.id: p for p in all_result.all() if p.id is not None}

    yield sse_event("status", {
        "message": f"Generating global TWOW predictions report for {len(prophecies)} unfulfilled prophecies..."
    })

    prompt = build_prediction_global_prompt(prophecies, connections, prophecies_by_id)

    try:
        client = _get_client()
        full_text = ""
        async with client.messages.stream(
            model=settings.CLAUDE_MODEL,
            max_tokens=8192,
            system=PREDICTION_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                yield sse_event("chunk", {"text": text})

        # Cache the full result
        await store_analysis(
            analysis_type="prediction_global",
            input_hash=input_hash,
            input_summary="Global TWOW Predictions Report",
            result_json=json.dumps({"text": full_text}),
            model_version=settings.CLAUDE_MODEL,
            session=session,
        )

        yield sse_event("complete", {"cached": False})

    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        yield sse_event("error", {"message": f"AI service error: {e.message}"})
