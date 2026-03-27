import json

import pytest

from app.services.streaming import sse_event


@pytest.mark.asyncio(loop_scope="session")
async def test_sse_event_format():
    """sse_event() returns correct dict structure."""
    result = sse_event("status", {"message": "hello"})
    assert isinstance(result, dict)
    assert result["event"] == "status"
    # data should be a JSON string
    parsed = json.loads(result["data"])
    assert parsed == {"message": "hello"}


@pytest.mark.asyncio(loop_scope="session")
async def test_sse_event_with_complex_data():
    """sse_event() handles nested data correctly."""
    data = {"connections": [{"id": 1, "confidence": 0.9}], "total": 1}
    result = sse_event("complete", data)
    assert result["event"] == "complete"
    parsed = json.loads(result["data"])
    assert parsed["total"] == 1
    assert len(parsed["connections"]) == 1
