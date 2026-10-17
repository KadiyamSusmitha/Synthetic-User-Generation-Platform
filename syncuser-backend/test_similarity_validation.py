from app.database import SessionLocal
from app.services.vector_storage_service import (
    vector_storage_service,
)
from app.services.similarity_search_service import (
    similarity_search_service,
)


def main():
    db = SessionLocal()

    memory_1 = None
    memory_2 = None
    memory_3 = None

    try:
        # --------------------------------------------------
        # Step 1: Create three temporary memories
        # --------------------------------------------------
        memory_1 = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            source_type="research_data",
            source_id=1,
            content=(
                "Students prefer simple onboarding "
                "with clear instructions."
            ),
            metadata={
                "test": True,
                "phase": "7.6.7",
            },
        )

        memory_2 = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            source_type="research_data",
            source_id=2,
            content=(
                "Students prefer guided tutorials "
                "during the onboarding process."
            ),
            metadata={
                "test": True,
                "phase": "7.6.7",
            },
        )

        memory_3 = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            source_type="research_data",
            source_id=3,
            content=(
                "Students prefer short onboarding "
                "steps with helpful explanations."
            ),
            metadata={
                "test": True,
                "phase": "7.6.7",
            },
        )

        print("Three temporary memories stored.")
        print("Memory IDs:", [
            memory_1.id,
            memory_2.id,
            memory_3.id,
        ])

        # --------------------------------------------------
        # Step 2: Test limit handling
        # --------------------------------------------------
        results = (
            similarity_search_service
            .search_similar_memories(
                db=db,
                experiment_id=6,
                query=(
                    "What onboarding experience "
                    "do students prefer?"
                ),
                limit=2,
            )
        )

        print()
        print("Limit handling test")
        print("Requested limit: 2")
        print("Results returned:", len(results))

        assert len(results) <= 2, (
            "Limit handling failed: "
            "more results than the requested limit "
            "were returned."
        )

        print("Limit handling: PASSED")

        # --------------------------------------------------
        # Step 3: Test empty query
        # --------------------------------------------------
        try:
            similarity_search_service.search_similar_memories(
                db=db,
                experiment_id=6,
                query="",
                limit=5,
            )

            raise AssertionError(
                "Empty query validation failed: "
                "no error was raised."
            )

        except ValueError as exc:
            print()
            print("Empty query validation: PASSED")
            print("Error:", str(exc))

        # --------------------------------------------------
        # Step 4: Test invalid limit
        # --------------------------------------------------
        try:
            similarity_search_service.search_similar_memories(
                db=db,
                experiment_id=6,
                query="onboarding experience",
                limit=0,
            )

            raise AssertionError(
                "Invalid limit validation failed: "
                "no error was raised."
            )

        except ValueError as exc:
            print()
            print("Invalid limit validation: PASSED")
            print("Error:", str(exc))

        # --------------------------------------------------
        # Step 5: Test no-result behavior
        # --------------------------------------------------
        no_results = (
            similarity_search_service
            .search_similar_memories(
                db=db,
                experiment_id=999999,
                query="completely unrelated test query",
                limit=5,
            )
        )

        print()
        print("No-result test")
        print("Results returned:", len(no_results))

        assert no_results == [], (
            "No-result handling failed: "
            "expected an empty list."
        )

        print("No-result handling: PASSED")

        # --------------------------------------------------
        # Final result
        # --------------------------------------------------
        print()
        print(
            "All similarity-search validation tests: PASSED"
        )

    finally:
        # --------------------------------------------------
        # Step 6: Clean up temporary memories
        # --------------------------------------------------
        if memory_1 is not None:
            db.delete(memory_1)

        if memory_2 is not None:
            db.delete(memory_2)

        if memory_3 is not None:
            db.delete(memory_3)

        db.commit()

        print()
        print(
            "Temporary validation memories deleted."
        )

        db.close()


if __name__ == "__main__":
    main()