import pytest


@pytest.mark.asyncio(loop_scope="session")
async def test_list_prophecies_returns_all(client):
    """GET /api/v1/prophecies returns items whose total matches seed count."""
    resp = await client.get("/api/v1/prophecies", params={"limit": 200})
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    # The seed file contains 75 prophecies
    assert body["total"] == 75
    assert len(body["items"]) == 75


@pytest.mark.asyncio(loop_scope="session")
async def test_filter_by_book(client):
    """?book=3 returns only book 3 entries."""
    resp = await client.get("/api/v1/prophecies", params={"book": 3, "limit": 200})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 10
    for item in body["items"]:
        assert item["source_book"] == 3


@pytest.mark.asyncio(loop_scope="session")
async def test_filter_by_type(client):
    """?type=song returns only songs."""
    resp = await client.get("/api/v1/prophecies", params={"type": "song", "limit": 200})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 7
    for item in body["items"]:
        assert item["prophecy_type"] == "song"


@pytest.mark.asyncio(loop_scope="session")
async def test_filter_by_status(client):
    """?status=fulfilled returns only fulfilled."""
    resp = await client.get("/api/v1/prophecies", params={"status": "fulfilled", "limit": 200})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 22
    for item in body["items"]:
        assert item["status"] == "fulfilled"


@pytest.mark.asyncio(loop_scope="session")
async def test_combined_filters(client):
    """?book=3&status=fulfilled returns intersection."""
    resp = await client.get(
        "/api/v1/prophecies",
        params={"book": 3, "status": "fulfilled", "limit": 200},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    for item in body["items"]:
        assert item["source_book"] == 3
        assert item["status"] == "fulfilled"


@pytest.mark.asyncio(loop_scope="session")
async def test_search(client):
    """?search=valonqar returns The Valonqar."""
    resp = await client.get("/api/v1/prophecies", params={"search": "valonqar"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    titles = [item["title"] for item in body["items"]]
    assert "The Valonqar" in titles


@pytest.mark.asyncio(loop_scope="session")
async def test_pagination(client):
    """?limit=5&offset=0 returns 5; ?limit=5&offset=5 returns next 5 (no overlap)."""
    resp1 = await client.get("/api/v1/prophecies", params={"limit": 5, "offset": 0})
    resp2 = await client.get("/api/v1/prophecies", params={"limit": 5, "offset": 5})
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    body1 = resp1.json()
    body2 = resp2.json()
    assert len(body1["items"]) == 5
    assert len(body2["items"]) == 5
    ids1 = {item["id"] for item in body1["items"]}
    ids2 = {item["id"] for item in body2["items"]}
    assert ids1.isdisjoint(ids2), "Paginated pages should not overlap"


@pytest.mark.asyncio(loop_scope="session")
async def test_sort(client):
    """?sort_by=title&sort_order=desc returns titles in descending order."""
    resp = await client.get(
        "/api/v1/prophecies",
        params={"sort_by": "title", "sort_order": "desc", "limit": 200},
    )
    assert resp.status_code == 200
    body = resp.json()
    titles = [item["title"] for item in body["items"]]
    assert titles == sorted(titles, reverse=True)


@pytest.mark.asyncio(loop_scope="session")
async def test_get_prophecy_by_id(client):
    """GET /api/v1/prophecies/1 returns the prophecy."""
    resp = await client.get("/api/v1/prophecies/1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert "title" in body
    assert "description" in body
    assert "connections" in body


@pytest.mark.asyncio(loop_scope="session")
async def test_get_prophecy_not_found(client):
    """GET /api/v1/prophecies/9999 returns 404."""
    resp = await client.get("/api/v1/prophecies/9999")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "NOT_FOUND"
