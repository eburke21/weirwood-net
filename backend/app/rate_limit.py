from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings

GLOBAL_LIMIT = f"{settings.RATE_LIMIT_PER_MINUTE}/minute"

# Expensive AI endpoints — tighter limits than the global default. Tuned so a
# demo user can explore freely but a bot can't drain the daily Claude budget.
AI_GENERATE_LIMIT = "5/minute"
PREDICT_GLOBAL_LIMIT = "2/minute"

limiter = Limiter(key_func=get_remote_address, default_limits=[GLOBAL_LIMIT])


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    retry_after = int(getattr(exc, "retry_after", 60) or 60)
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMITED",
                "message": "Too many requests",
                "details": {"retry_after": retry_after, "limit": str(exc.detail)},
            }
        },
        headers={"Retry-After": str(retry_after)},
    )
