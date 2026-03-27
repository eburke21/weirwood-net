import pytest


@pytest.mark.asyncio(loop_scope="session")
async def test_get_connections_empty(client):
    """GET /api/v1/prophecies/1/connections returns empty list initially."""
    resp = await client.get("/api/v1/prophecies/1/connections")
    assert resp.status_code == 200
    body = resp.json()
    assert body["prophecy_id"] == 1
    assert isinstance(body["connections"], list)
    assert len(body["connections"]) == 0
    assert body["cached"] is False
