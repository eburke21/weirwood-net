import json
from collections.abc import AsyncGenerator

from sse_starlette.sse import EventSourceResponse


def sse_event(event: str, data: dict) -> dict:
    return {"event": event, "data": json.dumps(data)}


def create_sse_response(generator: AsyncGenerator) -> EventSourceResponse:
    return EventSourceResponse(
        generator,
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
