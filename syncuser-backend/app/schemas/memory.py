from datetime import datetime

from pydantic import BaseModel


class MemorySearchResult(BaseModel):
    """
    Represents one memory returned from
    similarity search.
    """

    id: int

    experiment_id: int

    persona_id: int | None = None

    synthetic_response_id: int | None = None

    source_type: str

    source_id: int

    content: str

    metadata: dict | None = None

    distance: float

    similarity: float

    created_at: datetime


class MemorySearchResponse(BaseModel):
    """
    Response returned by the memory search API.
    """

    experiment_id: int

    query: str

    limit: int

    persona_id: int | None = None

    result_count: int

    memories: list[MemorySearchResult]