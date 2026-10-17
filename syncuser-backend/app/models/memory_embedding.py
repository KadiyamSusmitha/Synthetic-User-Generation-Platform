from datetime import datetime

from pgvector.sqlalchemy import VECTOR
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)

from app.database import Base


class MemoryEmbedding(Base):
    __tablename__ = "memory_embeddings"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    experiment_id = Column(
        Integer,
        ForeignKey("experiments.id"),
        nullable=False,
        index=True,
    )

    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),
        nullable=True,
        index=True,
    )

    synthetic_response_id = Column(
        Integer,
        ForeignKey("synthetic_responses.id"),
        nullable=True,
        index=True,
    )

    source_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    source_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    content = Column(
        Text,
        nullable=False,
    )

    embedding = Column(
        VECTOR(768),
        nullable=False,
    )

    metadata_json = Column(
        "metadata",
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )