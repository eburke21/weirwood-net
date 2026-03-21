import json
import logging
from collections.abc import AsyncGenerator

import anthropic
from sqlalchemy import or_
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.errors import NotFoundError
from app.models import Prophecy, Connection, ConnectionType
from app.services.prompts import (
    CONNECTION_FINDER_SYSTEM,
    build_connection_finder_prompt,
)
from app.services.streaming import sse_event

logger = logging.getLogger(__name__)

VALID_CONNECTION_TYPES = {t.value for t in ConnectionType}


def _get_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def get_cached_connections(prophecy_id: int, session: AsyncSession) -> list[dict]:
    query = select(Connection).where(
        or_(
            Connection.source_prophecy_id == prophecy_id,
            Connection.target_prophecy_id == prophecy_id,
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
        raw_text = response.content[0].text
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
