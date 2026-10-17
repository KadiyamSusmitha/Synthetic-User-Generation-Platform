from pprint import pprint

from app.database import SessionLocal
from app.models.experiment import Experiment
from app.services.analytics_service import analytics_service


def run_experiment_analytics(experiment_id: int):
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(Experiment.id == experiment_id)
            .first()
        )

        if not experiment:
            print(
                f"\nExperiment {experiment_id} was not found."
            )
            return

        print("\n" + "=" * 80)
        print(
            f"EXPERIMENT {experiment.id}: "
            f"{experiment.name}"
        )
        print("=" * 80)

        analytics = (
            analytics_service.get_experiment_analytics(
                db=db,
                experiment=experiment,
            )
        )

        print("\nSUMMARY")
        pprint(analytics["summary"])

        print("\nRESPONSE SOURCE DISTRIBUTION")
        pprint(
            analytics[
                "response_source_distribution"
            ]
        )

        print("\nQUESTION ANALYTICS")

        for question in analytics[
            "question_analytics"
        ]:
            print("\nQuestion:")
            print(
                f'{question["question_id"]}: '
                f'{question["question"]}'
            )

            print(
                f'Type: '
                f'{question["question_type"]}'
            )

            print(
                f'Real responses: '
                f'{question["real_response_count"]}'
            )

            print(
                f'Synthetic responses: '
                f'{question["synthetic_response_count"]}'
            )

            print(
                f'Total responses: '
                f'{question["response_count"]}'
            )

            print("Analytics:")
            pprint(question["analytics"])

        print("\nDEMOGRAPHIC PATTERNS")
        pprint(
            analytics[
                "demographic_patterns"
            ]
        )

        print("\nPERSONA PATTERNS")

        for persona in analytics[
            "persona_patterns"
        ]:
            print(
                f'{persona["persona_id"]}: '
                f'{persona["persona_name"]}'
            )

        print("\nTRENDS")
        pprint(
            analytics["trends"]
        )

        print("\nCOMMON ANSWERS")
        pprint(
            analytics["common_answers"]
        )

        print("\nVALIDATION COMPLETE")

    finally:
        db.close()


if __name__ == "__main__":
    for experiment_id in [6, 9, 10, 11]:
                run_experiment_analytics(
            experiment_id
        )