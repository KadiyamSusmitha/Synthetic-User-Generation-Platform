from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.user import User
from app.schemas.memory import (
    MemorySearchResponse,
    MemorySearchResult,
)
from app.services.ai_exceptions import AIServiceError
from app.services.similarity_search_service import (
    similarity_search_service,
)
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/memory",
    tags=["Memory"],
)


@router.get(
    "/search/{experiment_id}",
    response_model=MemorySearchResponse,
)
def search_memory(
    experiment_id: int,
    query: str = Query(
        ...,
        min_length=1,
        description="Text query used to search experiment memory.",
    ),
    limit: int = Query(
        5,
        ge=1,
        le=50,
        description="Maximum number of memories to return.",
    ),
    persona_id: int | None = Query(
        None,
        description="Optional persona filter.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search experiment memory using semantic similarity.

    Access is restricted to experiments owned by
    the authenticated user.
    """

    # ---------------------------------------------------------
    # 1. Verify experiment ownership
    # ---------------------------------------------------------

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found.",
        )

    # ---------------------------------------------------------
    # 2. Validate optional persona
    # ---------------------------------------------------------

    if persona_id is not None:
        persona = (
            db.query(Persona)
            .filter(
                Persona.id == persona_id,
                Persona.experiment_id == experiment_id,
            )
            .first()
        )

        if not persona:
            raise HTTPException(
                status_code=404,
                detail="Persona not found for this experiment.",
            )

    # ---------------------------------------------------------
    # 3. Perform similarity search
    # ---------------------------------------------------------

    try:
        results = (
            similarity_search_service.search_similar_memories(
                db=db,
                experiment_id=experiment_id,
                query=query.strip(),
                limit=limit,
                persona_id=persona_id,
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except AIServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc

    # ---------------------------------------------------------
    # 4. Convert search results to API response
    # ---------------------------------------------------------

    memories = []

    for memory, distance in results:

        similarity = 1.0 - float(distance)

        memories.append(
            MemorySearchResult(
                id=memory.id,
                experiment_id=memory.experiment_id,
                persona_id=memory.persona_id,
                synthetic_response_id=(
                    memory.synthetic_response_id
                ),
                source_type=memory.source_type,
                source_id=memory.source_id,
                content=memory.content,
                metadata=memory.metadata_json,
                distance=float(distance),
                similarity=similarity,
                created_at=memory.created_at,
            )
        )

    # ---------------------------------------------------------
    # 5. Return response
    # ---------------------------------------------------------

    return MemorySearchResponse(
        experiment_id=experiment_id,
        query=query.strip(),
        limit=limit,
        persona_id=persona_id,
        result_count=len(memories),
        memories=memories,
    )