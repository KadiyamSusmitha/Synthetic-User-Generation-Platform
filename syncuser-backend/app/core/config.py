import os

from dotenv import load_dotenv


load_dotenv()


class Settings:
    """
    Application configuration settings.
    """

    GEMINI_API_KEY: str | None = os.getenv(
        "GEMINI_API_KEY"
    )

    GEMINI_MODEL: str = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.1-flash-lite",
    )

    GEMINI_EMBEDDING_MODEL: str = os.getenv(
        "GEMINI_EMBEDDING_MODEL",
        "gemini-embedding-001",
    )

    GEMINI_EMBEDDING_DIMENSION: int = int(
        os.getenv(
            "GEMINI_EMBEDDING_DIMENSION",
            "768",
        )
    )


settings = Settings()
