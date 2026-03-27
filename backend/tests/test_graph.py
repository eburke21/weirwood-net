import pytest


@pytest.mark.asyncio(loop_scope="session")
async def test_graph_returns_nodes(client):
    """GET /api/v1/graph returns nodes array."""
    resp = await client.get("/api/v1/graph")
    assert resp.status_code == 200
    body = resp.json()
    assert "nodes" in body
    assert "edges" in body
    assert "stats" in body
    assert isinstance(body["nodes"], list)
    assert len(body["nodes"]) == 75
    # Spot-check node structure
    node = body["nodes"][0]
    assert "id" in node
    assert "title" in node
    assert "type" in node
    assert "status" in node
    assert "book" in node
    assert "source_character" in node
    assert "connection_count" in node
    # Stats
    assert body["stats"]["total_nodes"] == 75


@pytest.mark.asyncio(loop_scope="session")
async def test_graph_filter_by_book(client):
    """?book=1 returns only book 1 nodes."""
    resp = await client.get("/api/v1/graph", params={"book": 1})
    assert resp.status_code == 200
    body = resp.json()
    assert body["stats"]["total_nodes"] == 17
    for node in body["nodes"]:
        assert node["book"] == 1
