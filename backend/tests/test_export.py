import pytest


@pytest.mark.asyncio(loop_scope="session")
async def test_export_prophecy(client):
    """GET /api/v1/export/prophecy/1 returns markdown content."""
    resp = await client.get("/api/v1/export/prophecy/1")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/markdown")
    assert "content-disposition" in resp.headers
    content = resp.text
    # Should start with a markdown heading
    assert content.startswith("# ")
    # Should contain expected sections
    assert "## Description" in content
    assert "**Source:**" in content
    assert "**Type:**" in content
    assert "**Status:**" in content
    # Footer
    assert "Weirwood.net" in content


@pytest.mark.asyncio(loop_scope="session")
async def test_export_not_found(client):
    """GET /api/v1/export/prophecy/9999 returns 404."""
    resp = await client.get("/api/v1/export/prophecy/9999")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "NOT_FOUND"
