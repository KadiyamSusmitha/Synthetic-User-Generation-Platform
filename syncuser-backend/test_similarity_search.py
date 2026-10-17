from app.database import SessionLocal
from app.services.vector_storage_service import vector_storage_service
from app.services.similarity_search_service import (
    similarity_search_service,
)


def main():
    db = SessionLocal()

    memory = None

    try:
        # Step 1: Store a temporary memory
        memory = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            source_type="research_data",
            source_id=1,
            content=(
                "Students prefer simple onboarding "
                "with clear instructions and guidance."
            ),
            metadata={
                "test": True,
                "phase": "7.6",
            },
        )

        print("Temporary memory stored.")
        print("Memory ID:", memory.id)

        # Step 2: Search for a semantically similar query
        results = (
            similarity_search_service.search_similar_memories(
                db=db,
                experiment_id=6,
                query=(
                    "What kind of onboarding experience "
                    "do students prefer?"
                ),
                limit=5,
            )
        )

        print()
        print("Similarity search: OK")
        print("Results found:", len(results))

        for index, (result, distance) in enumerate(
            results,
            start=1,
        ):
            print()
            print(f"Result {index}")
            print("Memory ID:", result.id)
            print("Source Type:", result.source_type)
            print("Content:", result.content)
            print("Cosine Distance:", distance)

    finally:
        # Step 3: Clean up temporary memory
        if memory is not None:
            db.delete(memory)
            db.commit()
            print()
            print(
                "Temporary similarity-search memory deleted."
            )

        db.close()


if __name__ == "__main__":
    main()