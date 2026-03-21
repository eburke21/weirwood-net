from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str
    book: int = Field(ge=1, le=5)
    chapter: str
    characters_involved: list[str] = Field(default_factory=list, sa_column=Column(JSON))
