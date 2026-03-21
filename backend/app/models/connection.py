from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class ConnectionType(str, Enum):
    THEMATIC_PARALLEL = "thematic_parallel"
    SHARED_FULFILLMENT = "shared_fulfillment"
    CONTRADICTION = "contradiction"
    SEQUENTIAL = "sequential"
    REINTERPRETATION = "reinterpretation"


class Connection(SQLModel, table=True):
    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint(
            "source_prophecy_id", "target_prophecy_id", "connection_type",
            name="uq_connection_pair_type",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    source_prophecy_id: int = Field(foreign_key="prophecies.id")
    target_prophecy_id: int = Field(foreign_key="prophecies.id")
    connection_type: ConnectionType
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str
    implication: str
    model_version: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
