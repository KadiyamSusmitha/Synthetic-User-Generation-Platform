from sqlalchemy.orm import Session

from app.models.memory_embedding import MemoryEmbedding
from app.services.embedding_service import embedding_service


class SimilaritySearchService:
    """
    Service responsible for finding memories
    similar to a supplied text query.
    """

    def search_similar_memories(
        self,
        db: Session,
        experiment_id: int,
        query: str,
        limit: int = 5,
        persona_id: int | None = None,
    ) -> list[tuple[MemoryEmbedding, float]]:
        """
        Search memory embeddings using cosine distance.

        Returns:
            A list of tuples containing:
            (MemoryEmbedding, cosine_distance)
        """

        if not query or not query.strip():
            raise ValueError(
                "Search query cannot be empty."
            )

        if limit <= 0:
            raise ValueError(
                "Search limit must be greater than zero."
            )

        query_embedding = embedding_service.generate_embedding(
            query.strip(),
            task_type="RETRIEVAL_QUERY",
        )

        distance_expression = (
            MemoryEmbedding.embedding.cosine_distance(
                query_embedding
            )
        )

        query_builder = (
            db.query(
                MemoryEmbedding,
                distance_expression.label(
                    "distance"
                ),
            )
            .filter(
                MemoryEmbedding.experiment_id
                == experiment_id
            )
        )

        if persona_id is not None:
            query_builder = query_builder.filter(
                MemoryEmbedding.persona_id
                == persona_id
            )

        results = (
            query_builder
            .order_by(distance_expression.asc())
            .limit(limit)
            .all()
        )

        return results


similarity_search_service = SimilaritySearchService()