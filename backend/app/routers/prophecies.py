import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, literal_column, or_, text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.errors import NotFoundError
from app.models import Connection, Prophecy, ProphecyStatus, ProphecyType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/prophecies", tags=["prophecies"])

ALLOWED_SORT_FIELDS = {"source_book", "title", "prophecy_type", "status", "source_character"}


@router.get("")
async def list_prophecies(
    session: AsyncSession = Depends(get_session),
    book: int | None = Query(None, ge=1, le=5),
    character: str | None = Query(None),
    type: ProphecyType | None = Query(None),
    status: ProphecyStatus | None = Query(None),
    subject: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("source_book"),
    sort_order: str = Query("asc"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    # Connection count subquery
    conn_count = (
        select(func.count())
        .where(
            or_(
                Connection.source_prophecy_id == Prophecy.id,
                Connection.target_prophecy_id == Prophecy.id,
            )
        )
        .correlate(Prophecy)
        .scalar_subquery()
    )

    query = select(Prophecy, conn_count.label("connection_count"))

    # Apply filters
    if book is not None:
        query = query.where(Prophecy.source_book == book)
    if character is not None:
        query = query.where(Prophecy.source_character.ilike(f"%{character}%"))
    if type is not None:
        query = query.where(Prophecy.prophecy_type == type)
    if status is not None:
        query = query.where(Prophecy.status == status)
    if subject is not None:
        query = query.where(literal_column("subject_characters").like(f"%{subject}%"))
    if search is not None:
        try:
            # Use FTS5 for relevance-ranked search
            fts_ids = select(literal_column("rowid")).select_from(
                text("prophecies_fts")
            ).where(
                text("prophecies_fts MATCH :search")
            ).params(search=search)
            query = query.where(Prophecy.id.in_(fts_ids))
        except Exception:
            # Fall back to LIKE if FTS5 is not available
            logger.warning("FTS5 search failed, falling back to LIKE")
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    Prophecy.title.ilike(pattern),
                    Prophecy.description.ilike(pattern),
                    Prophecy.notes.ilike(pattern),
                )
            )

    # Count total before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.exec(count_query)
    total = total_result.one()

    # Sort
    sort_field = sort_by if sort_by in ALLOWED_SORT_FIELDS else "source_book"
    sort_column = getattr(Prophecy, sort_field)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Paginate
    query = query.offset(offset).limit(limit)

    result = await session.exec(query)
    rows = result.all()

    items = []
    for row in rows:
        prophecy = row[0]
        connection_count = row[1]
        data = prophecy.model_dump()
        data["connection_count"] = connection_count
        items.append(data)

    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/{prophecy_id}")
async def get_prophecy(
    prophecy_id: int,
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Prophecy).where(Prophecy.id == prophecy_id))
    prophecy = result.first()
    if prophecy is None:
        raise NotFoundError(f"Prophecy with id {prophecy_id} not found")

    # Get connections where this prophecy is source or target
    conn_query = select(Connection).where(
        or_(
            Connection.source_prophecy_id == prophecy_id,
            Connection.target_prophecy_id == prophecy_id,
        )
    )
    conn_result = await session.exec(conn_query)
    connections_raw = conn_result.all()

    # Enrich connections with connected prophecy info
    connections = []
    for conn in connections_raw:
        connected_id = (
            conn.target_prophecy_id
            if conn.source_prophecy_id == prophecy_id
            else conn.source_prophecy_id
        )
        connected_result = await session.exec(
            select(Prophecy.id, Prophecy.title, Prophecy.status).where(Prophecy.id == connected_id)
        )
        connected = connected_result.first()
        connections.append({
            "id": conn.id,
            "connected_prophecy": {
                "id": connected[0],
                "title": connected[1],
                "status": connected[2],
            } if connected else None,
            "connection_type": conn.connection_type,
            "confidence": conn.confidence,
            "evidence": conn.evidence,
            "implication": conn.implication,
            "model_version": conn.model_version,
            "generated_at": conn.generated_at,
        })

    data = prophecy.model_dump()
    data["connections"] = connections
    return data
