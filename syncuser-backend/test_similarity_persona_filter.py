from app.database import SessionLocal
from app.services.vector_storage_service import (
    vector_storage_service,
)
from app.services.similarity_search_service import (
    similarity_search_service,
)


def main():
    db = SessionLocal()

    maya_memory = None
    marcus_memory = None

    try:
        # --------------------------------------------------
        # Step 1: Create temporary memory for Maya
        # Persona ID = 1
        # Experiment ID = 6
        # --------------------------------------------------
        maya_memory = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            persona_id=1,
            source_type="research_data",
            source_id=1,
            content=(
                "Maya prefers simple onboarding "
                "with clear instructions and guidance."
            ),
            metadata={
                "test": True,
                "phase": "7.6.6",
                "persona": "Maya Patel",
            },
        )

        print(
            "Maya temporary memory stored."
        )
        print(
            "Memory ID:",
            maya_memory.id,
        )

        # --------------------------------------------------
        # Step 2: Create temporary memory for Marcus
        # Persona ID = 2
        # Experiment ID = 6
        # --------------------------------------------------
        marcus_memory = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            persona_id=2,
            source_type="research_data",
            source_id=1,
            content=(
                "Marcus prefers detailed onboarding "
                "with advanced explanations."
            ),
            metadata={
                "test": True,
                "phase": "7.6.6",
                "persona": "Marcus Johnson",
            },
        )

        print()
        print(
            "Marcus temporary memory stored."
        )
        print(
            "Memory ID:",
            marcus_memory.id,
        )

        # --------------------------------------------------
        # Step 3: Search only for Maya
        # --------------------------------------------------
        results = (
            similarity_search_service
            .search_similar_memories(
                db=db,
                experiment_id=6,
                persona_id=1,
                query=(
                    "What kind of onboarding "
                    "experience does Maya prefer?"
                ),
                limit=5,
            )
        )

        print()
        print(
            "Persona-filtered similarity search: OK"
        )
        print(
            "Results found:",
            len(results),
        )

        # --------------------------------------------------
        # Step 4: Display returned personas
        # --------------------------------------------------
        returned_persona_ids = [
            result.persona_id
            for result, distance in results
        ]

        print()
        print(
            "Returned persona IDs:",
            returned_persona_ids,
        )

        # --------------------------------------------------
        # Step 5: Verify persona isolation
        # --------------------------------------------------
        assert all(
            persona_id == 1
            for persona_id in returned_persona_ids
        ), (
            "Persona filtering failed: "
            "a memory belonging to another persona "
            "was returned."
        )

        returned_memory_ids = [
            result.id
            for result, distance in results
        ]

        assert maya_memory.id in returned_memory_ids, (
            "Maya's memory was not returned."
        )

        assert marcus_memory.id not in returned_memory_ids, (
            "Marcus's memory was incorrectly returned "
            "in Maya's persona search."
        )

        print()
        print(
            "Persona filtering: PASSED"
        )
        print(
            "Only Maya's memory was returned."
        )
        print(
            "Marcus's memory was not returned."
        )

    finally:
        # --------------------------------------------------
        # Step 6: Clean up temporary memories
        # --------------------------------------------------
        if maya_memory is not None:
            db.delete(maya_memory)

        if marcus_memory is not None:
            db.delete(marcus_memory)

        db.commit()

        print()
        print(
            "Temporary persona memories deleted."
        )

        db.close()


if __name__ == "__main__":
    main()