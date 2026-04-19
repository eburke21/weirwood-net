from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class SpendLog(SQLModel, table=True):
    __tablename__ = "spend_log"

    id: int | None = Field(default=None, primary_key=True)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
    )
    endpoint: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
