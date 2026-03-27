from fastapi import APIRouter, Depends, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import Connection, Prophecy, ProphecyStatus, ProphecyType

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


@router.get("")
async def get_graph_data(
    session: AsyncSession = Depends(get_session),
    book: int | None = Query(None, ge=1, le=5),
    type: ProphecyType | None = Query(None),
    status: ProphecyStatus | None = Query(None),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
):
    # Build filtered prophecy query
    prophecy_query = select(Prophecy)
    if book is not None:
        prophecy_query = prophecy_query.where(Prophecy.source_book == book)
    if type is not None:
        prophecy_query = prophecy_query.where(Prophecy.prophecy_type == type)
    if status is not None:
        prophecy_query = prophecy_query.where(Prophecy.status == status)

    result = await session.exec(prophecy_query)
    prophecies = result.all()
    node_ids = {p.id for p in prophecies}

    # Build edges (only where both ends are in the filtered node set)
    edge_query = select(Connection).where(Connection.confidence >= min_confidence)
    edge_result = await session.exec(edge_query)
    all_connections = edge_result.all()

    edges = []
    connection_counts: dict[int, int] = {pid: 0 for pid in node_ids}
    for conn in all_connections:
        if conn.source_prophecy_id in node_ids and conn.target_prophecy_id in node_ids:
            edges.append({
                "source": conn.source_prophecy_id,
                "target": conn.target_prophecy_id,
                "connection_type": conn.connection_type,
                "confidence": conn.confidence,
            })
            connection_counts[conn.source_prophecy_id] = connection_counts.get(conn.source_prophecy_id, 0) + 1
            connection_counts[conn.target_prophecy_id] = connection_counts.get(conn.target_prophecy_id, 0) + 1

    nodes = [
        {
            "id": p.id,
            "title": p.title,
            "type": p.prophecy_type,
            "status": p.status,
            "book": p.source_book,
            "source_character": p.source_character,
            "connection_count": connection_counts.get(p.id, 0),
        }
        for p in prophecies
    ]

    total_connections = sum(connection_counts.values()) / 2 if connection_counts else 0
    avg_connections = total_connections / len(nodes) if nodes else 0

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "avg_connections": round(avg_connections, 1),
        },
    }
