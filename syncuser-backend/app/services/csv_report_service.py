import csv
import json
from pathlib import Path
from typing import Any


class CSVReportService:
    """
    Generates CSV research reports from prepared report data.
    """

    def _stringify(self, value: Any) -> str:
        if value is None:
            return ""

        if isinstance(value, (dict, list)):
            return json.dumps(
                value,
                ensure_ascii=False,
            )

        return str(value)

    def generate_csv(
        self,
        report_payload: dict[str, Any],
        output_path: str | Path,
    ) -> str:
        """
        Generates a structured CSV report.
        """

        output = Path(output_path)

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        metadata = report_payload.get(
            "metadata",
            {},
        )

        data = report_payload.get(
            "data",
            {},
        )

        summary = data.get(
            "summary",
            {},
        )

        surveys = data.get(
            "surveys",
            [],
        )

        questions = data.get(
            "questions",
            [],
        )

        personas = data.get(
            "personas",
            [],
        )

        responses = data.get(
            "responses",
            [],
        )

        question_lookup = {
            str(question.get("id")): question
            for question in questions
        }

        with output.open(
            "w",
            newline="",
            encoding="utf-8-sig",
        ) as csv_file:
            writer = csv.writer(csv_file)

            writer.writerow(
                [
                    "Section",
                    "Field",
                    "Value",
                    "Persona",
                    "Question",
                    "Answer",
                ]
            )

            # -------------------------------------------------
            # Report metadata
            # -------------------------------------------------

            writer.writerow(
                [
                    "Report",
                    "Title",
                    self._stringify(
                        metadata.get("title")
                    ),
                    "",
                    "",
                    "",
                ]
            )

            writer.writerow(
                [
                    "Report",
                    "Type",
                    self._stringify(
                        metadata.get("report_type")
                    ),
                    "",
                    "",
                    "",
                ]
            )

            writer.writerow(
                [
                    "Report",
                    "Generated At",
                    self._stringify(
                        metadata.get("generated_at")
                    ),
                    "",
                    "",
                    "",
                ]
            )

            date_range = metadata.get(
                "date_range",
                {},
            )

            writer.writerow(
                [
                    "Report",
                    "Start Date",
                    self._stringify(
                        date_range.get("start")
                    ),
                    "",
                    "",
                    "",
                ]
            )

            writer.writerow(
                [
                    "Report",
                    "End Date",
                    self._stringify(
                        date_range.get("end")
                    ),
                    "",
                    "",
                    "",
                ]
            )

            # -------------------------------------------------
            # Experiment
            # -------------------------------------------------

            experiment = data.get(
                "experiment",
                {},
            )

            for field, value in experiment.items():
                writer.writerow(
                    [
                        "Experiment",
                        field,
                        self._stringify(value),
                        "",
                        "",
                        "",
                    ]
                )

            # -------------------------------------------------
            # Summary
            # -------------------------------------------------

            for field, value in summary.items():
                writer.writerow(
                    [
                        "Summary",
                        field,
                        self._stringify(value),
                        "",
                        "",
                        "",
                    ]
                )

            # -------------------------------------------------
            # Surveys
            # -------------------------------------------------

            for survey in surveys:
                writer.writerow(
                    [
                        "Survey",
                        "Survey",
                        self._stringify(
                            survey.get("title")
                        ),
                        "",
                        "",
                        "",
                    ]
                )

                writer.writerow(
                    [
                        "Survey",
                        "Status",
                        self._stringify(
                            survey.get("status")
                        ),
                        "",
                        "",
                        "",
                    ]
                )

            # -------------------------------------------------
            # Questions
            # -------------------------------------------------

            for question in questions:
                writer.writerow(
                    [
                        "Question",
                        "Question Type",
                        self._stringify(
                            question.get(
                                "question_type"
                            )
                        ),
                        "",
                        self._stringify(
                            question.get("question")
                        ),
                        "",
                    ]
                )

                writer.writerow(
                    [
                        "Question",
                        "Options",
                        self._stringify(
                            question.get("options")
                        ),
                        "",
                        self._stringify(
                            question.get("question")
                        ),
                        "",
                    ]
                )

            # -------------------------------------------------
            # Personas
            # -------------------------------------------------

            for persona in personas:
                writer.writerow(
                    [
                        "Persona",
                        "Profile",
                        self._stringify(
                            {
                                "id": persona.get("id"),
                                "gender": persona.get(
                                    "gender"
                                ),
                                "age": persona.get("age"),
                                "occupation": persona.get(
                                    "occupation"
                                ),
                                "location": persona.get(
                                    "location"
                                ),
                            }
                        ),
                        self._stringify(
                            persona.get("name")
                        ),
                        "",
                        "",
                    ]
                )

                writer.writerow(
                    [
                        "Persona",
                        "Goals",
                        self._stringify(
                            persona.get("goals")
                        ),
                        self._stringify(
                            persona.get("name")
                        ),
                        "",
                        "",
                    ]
                )

                writer.writerow(
                    [
                        "Persona",
                        "Needs",
                        self._stringify(
                            persona.get("needs")
                        ),
                        self._stringify(
                            persona.get("name")
                        ),
                        "",
                        "",
                    ]
                )

                writer.writerow(
                    [
                        "Persona",
                        "Pain Points",
                        self._stringify(
                            persona.get(
                                "pain_points"
                            )
                        ),
                        self._stringify(
                            persona.get("name")
                        ),
                        "",
                        "",
                    ]
                )

            # -------------------------------------------------
            # Synthetic responses
            # -------------------------------------------------

            for response in responses:
                persona_name = (
                    response.get("persona_name")
                    or f"Persona {response.get('persona_id')}"
                )

                answers = response.get(
                    "answers",
                    {},
                )

                if isinstance(answers, dict):
                    for question_id, answer in answers.items():
                        question = question_lookup.get(
                            str(question_id)
                        )

                        question_text = (
                            question.get("question")
                            if question
                            else f"Question {question_id}"
                        )

                        writer.writerow(
                            [
                                "Synthetic Response",
                                "Response ID",
                                self._stringify(
                                    response.get("id")
                                ),
                                persona_name,
                                question_text,
                                self._stringify(answer),
                            ]
                        )
                else:
                    writer.writerow(
                        [
                            "Synthetic Response",
                            "Response ID",
                            self._stringify(
                                response.get("id")
                            ),
                            persona_name,
                            "",
                            self._stringify(
                                answers
                            ),
                        ]
                    )

        return str(output)


csv_report_service = CSVReportService()