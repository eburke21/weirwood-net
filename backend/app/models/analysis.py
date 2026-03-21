from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class AnalysisType(str, Enum):
    FULFILLMENT = "fulfillment"
    PREDICTION_SINGLE = "prediction_single"
    PREDICTION_GLOBAL = "prediction_global"


class AnalysisCache(SQLModel, table=True):
    __tablename__ = "analysis_cache"
    __table_args__ = (
        UniqueConstraint("analysis_type", "input_hash", name="uq_analysis_type_hash"),
    )

    id: int | None = Field(default=None, primary_key=True)
    analysis_type: AnalysisType
    input_hash: str
    input_summary: str
    result_json: str
    model_version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
