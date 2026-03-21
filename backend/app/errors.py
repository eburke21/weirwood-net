from fastapi import Request
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    def __init__(self, detail: str):
        self.detail = detail


class ValidationError(Exception):
    def __init__(self, detail: str, fields: dict | None = None):
        self.detail = detail
        self.fields = fields or {}


class AIServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail


class RateLimitedError(Exception):
    def __init__(self, retry_after: int = 60):
        self.retry_after = retry_after


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "NOT_FOUND", "message": exc.detail}},
    )


async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": exc.detail, "details": exc.fields}},
    )


async def ai_service_handler(request: Request, exc: AIServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"error": {"code": "AI_SERVICE_ERROR", "message": exc.detail}},
    )


async def rate_limited_handler(request: Request, exc: RateLimitedError) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"error": {"code": "RATE_LIMITED", "message": "Too many requests", "details": {"retry_after": exc.retry_after}}},
        headers={"Retry-After": str(exc.retry_after)},
    )
