from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/weirwood.db"
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    MAX_DAILY_API_SPEND_USD: float = 5.0
    RATE_LIMIT_PER_MINUTE: int = 10
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
