from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class ProphecyType(str, Enum):
    VERBAL_PROPHECY = "verbal_prophecy"
    DREAM_VISION = "dream_vision"
    FLAME_VISION = "flame_vision"
    SONG = "song"
    HOUSE_WORDS = "house_words"
    PHYSICAL_SIGN = "physical_sign"
    GREENDREAM = "greendream"
    HOUSE_OF_UNDYING = "house_of_undying"
    OTHER = "other"


class ProphecyStatus(str, Enum):
    FULFILLED = "fulfilled"
    PARTIALLY_FULFILLED = "partially_fulfilled"
    UNFULFILLED = "unfulfilled"
    DEBATED = "debated"
    SUBVERTED = "subverted"


class Prophecy(SQLModel, table=True):
    __tablename__ = "prophecies"

    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str
    source_character: str
    source_chapter: str
    source_book: int = Field(ge=1, le=5)
    prophecy_type: ProphecyType
    status: ProphecyStatus = ProphecyStatus.UNFULFILLED
    fulfillment_evidence: str | None = None
    subject_characters: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    keywords: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
