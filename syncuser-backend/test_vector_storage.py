from app.database import SessionLocal
from app.services.vector_storage_service import vector_storage_service


def main():
    db = SessionLocal()

    try:
        memory = vector_storage_service.store_memory(
            db=db,
            experiment_id=6,
            source_type="research_data",
            source_id=1,
            content=(
                "Users prefer simple onboarding flows "
                "with clear instructions."
            ),
            metadata={
                "test": True,
                "phase": "7.5",
            },
    )

        print("Vector storage: OK")
        print("Memory ID:", memory.id)
        print("Experiment ID:", memory.experiment_id)
        print("Source Type:", memory.source_type)
        print("Source ID:", memory.source_id)
        print("Content:", memory.content)
        print("Embedding Dimensions:", len(memory.embedding))

    finally:
        db.close()


if __name__ == "__main__":
    main()