from google import genai
from google.genai import types

from app.core.config import settings
from app.services.ai_exceptions import AIServiceError


class EmbeddingService:
    """
    Service responsible for generating text embeddings
    using the configured Gemini embedding model.
    """

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise AIServiceError(
                "Gemini API key is not configured.",
                status_code=500,
            )

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def generate_embedding(
        self,
        text: str,
        task_type: str = "RETRIEVAL_DOCUMENT",
    ) -> list[float]:
        """
        Generate a vector embedding for the supplied text.

        RETRIEVAL_DOCUMENT is used for stored memory.
        RETRIEVAL_QUERY is used for similarity-search queries.
        """

        if not text or not text.strip():
            raise AIServiceError(
                "Text cannot be empty for embedding generation.",
                status_code=400,
            )

        allowed_task_types = {
            "RETRIEVAL_DOCUMENT",
            "RETRIEVAL_QUERY",
        }

        if task_type not in allowed_task_types:
            raise AIServiceError(
                (
                    "Invalid embedding task type. "
                    "Expected RETRIEVAL_DOCUMENT or RETRIEVAL_QUERY."
                ),
                status_code=400,
            )

        try:
            result = self.client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(
                    output_dimensionality=(
                        settings.GEMINI_EMBEDDING_DIMENSION
                    ),
                    task_type=task_type,
                ),
            )

            if not result.embeddings:
                raise AIServiceError(
                    "Gemini returned no embedding.",
                    status_code=502,
                )

            embedding = result.embeddings[0].values

            if not embedding:
                raise AIServiceError(
                    "Gemini returned an empty embedding.",
                    status_code=502,
                )

            if len(embedding) != settings.GEMINI_EMBEDDING_DIMENSION:
                raise AIServiceError(
                    (
                        "Invalid embedding dimension. "
                        f"Expected "
                        f"{settings.GEMINI_EMBEDDING_DIMENSION}, "
                        f"got {len(embedding)}."
                    ),
                    status_code=502,
                )

            return list(embedding)

        except AIServiceError:
            raise

        except Exception as exc:
            raise AIServiceError(
                f"Embedding generation failed: {str(exc)}",
                status_code=502,
            ) from exc


embedding_service = EmbeddingService()