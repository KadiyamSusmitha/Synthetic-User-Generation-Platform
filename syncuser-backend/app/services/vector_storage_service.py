from sqlalchemy.orm import Session

from app.models.memory_embedding import MemoryEmbedding
from app.services.embedding_service import embedding_service


class VectorStorageService:
    """
    Service responsible for generating embeddings
    and storing memory vectors in PostgreSQL.
    """

    def store_memory(
        self,
        db: Session,
        experiment_id: int,
        source_type: str,
        source_id: int,
        content: str,
        persona_id: int | None = None,
        synthetic_response_id: int | None = None,
        metadata: dict | None = None,
    ) -> MemoryEmbedding:
        """
        Generate an embedding for the supplied content
        and store it in the memory_embeddings table.
        """

        if not content or not content.strip():
            raise ValueError(
                "Memory content cannot be empty."
            )

        allowed_source_types = {
            "persona",
            "synthetic_response",
            "research_data",
        }

        if source_type not in allowed_source_types:
            raise ValueError(
                "Invalid source_type. "
                "Expected one of: "
                "persona, synthetic_response, research_data."
            )

        embedding = embedding_service.generate_embedding(
            content
        )

        memory_embedding = MemoryEmbedding(
            experiment_id=experiment_id,
            persona_id=persona_id,
            synthetic_response_id=synthetic_response_id,
            source_type=source_type,
            source_id=source_id,
            content=content.strip(),
            embedding=embedding,
            metadata_json=metadata,
        )

        db.add(memory_embedding)
        db.commit()
        db.refresh(memory_embedding)

        return memory_embedding


vector_storage_service = VectorStorageService()