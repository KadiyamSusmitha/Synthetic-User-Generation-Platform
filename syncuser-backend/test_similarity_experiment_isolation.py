from app.database import SessionLocal
from app.services.vector_storage_service import (
    vector_storage_service,
)
from app.services.similarity_search_service import (
    similarity_search_service,
)


def main():
    db = SessionLocal()

    experiment_6_memory = None
    experiment_9_memory = None

    try:
        # --------------------------------------------------
        # Step 1: Create temporary memory for Experiment 6
        # --------------------------------------------------
        experiment_6_memory = (
            vector_storage_service.store_memory(
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
                    "phase": "7.6.5",
                    "experiment": 6,
                },
            )
        )

        print(
            "Experiment 6 temporary memory stored."
        )
        print(
            "Memory ID:",
            experiment_6_memory.id,
        )

        # --------------------------------------------------
        # Step 2: Create temporary memory for Experiment 9
        # --------------------------------------------------
        experiment_9_memory = (
            vector_storage_service.store_memory(
                db=db,
                experiment_id=9,
                source_type="research_data",
                source_id=1,
                content=(
                    "Users prefer detailed financial "
                    "reports with spending breakdowns."
                ),
                metadata={
                    "test": True,
                    "phase": "7.6.5",
                    "experiment": 9,
                },
            )
        )

        print()
        print(
            "Experiment 9 temporary memory stored."
        )
        print(
            "Memory ID:",
            experiment_9_memory.id,
        )

        # --------------------------------------------------
        # Step 3: Search ONLY Experiment 6
        # --------------------------------------------------
        results = (
            similarity_search_service
            .search_similar_memories(
                db=db,
                experiment_id=6,
                query=(
                    "What kind of onboarding "
                    "experience do students prefer?"
                ),
                limit=5,
            )
        )

        print()
        print(
            "Similarity search for Experiment 6: OK"
        )
        print(
            "Results found:",
            len(results),
        )

        # --------------------------------------------------
        # Step 4: Verify experiment isolation
        # --------------------------------------------------
        returned_experiment_ids = [
            result.experiment_id
            for result, distance in results
        ]

        print()
        print(
            "Returned experiment IDs:",
            returned_experiment_ids,
        )

        assert all(
            experiment_id == 6
            for experiment_id in returned_experiment_ids
        ), (
            "Experiment isolation failed: "
            "a memory from another experiment was returned."
        )

        returned_memory_ids = [
            result.id
            for result, distance in results
        ]

        assert experiment_9_memory.id not in returned_memory_ids, (
            "Experiment 9 memory was incorrectly "
            "returned in Experiment 6 search."
        )

        print()
        print(
            "Experiment isolation: PASSED"
        )
        print(
            "Experiment 9 memory was not returned."
        )

    finally:
        # --------------------------------------------------
        # Step 5: Clean up temporary memories
        # --------------------------------------------------
        if experiment_6_memory is not None:
            db.delete(experiment_6_memory)

        if experiment_9_memory is not None:
            db.delete(experiment_9_memory)

        db.commit()

        print()
        print(
            "Temporary memories deleted."
        )

        db.close()


if __name__ == "__main__":
    main()