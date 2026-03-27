import pytest


@pytest.mark.asyncio(loop_scope="session")
async def test_list_events(client):
    """GET /api/v1/events returns all events."""
    resp = await client.get("/api/v1/events")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    # The seed file contains 23 events
    assert len(body) == 23
    # Events should be ordered by book
    books = [e["book"] for e in body]
    assert books == sorted(books)
    # Spot-check structure
    first = body[0]
    assert "id" in first
    assert "title" in first
    assert "description" in first
    assert "book" in first
    assert "chapter" in first
    assert "characters_involved" in first
