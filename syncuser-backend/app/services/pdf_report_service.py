from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class PDFReportService:
    """
    Generates PDF research reports using ReportLab.
    """

    def __init__(self) -> None:
        self.styles = getSampleStyleSheet()

        self.title_style = ParagraphStyle(
            "ReportTitle",
            parent=self.styles["Title"],
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            spaceAfter=12,
        )

        self.heading_style = ParagraphStyle(
            "ReportHeading",
            parent=self.styles["Heading2"],
            fontSize=14,
            leading=18,
            spaceBefore=10,
            spaceAfter=8,
        )

        self.subheading_style = ParagraphStyle(
            "ReportSubheading",
            parent=self.styles["Heading3"],
            fontSize=11,
            leading=14,
            spaceBefore=8,
            spaceAfter=5,
        )

        self.body_style = ParagraphStyle(
            "ReportBody",
            parent=self.styles["BodyText"],
            fontSize=9,
            leading=13,
            spaceAfter=5,
        )

        self.small_style = ParagraphStyle(
            "ReportSmall",
            parent=self.styles["BodyText"],
            fontSize=8,
            leading=11,
        )

    def _paragraph(
        self,
        text: Any,
        style: ParagraphStyle | None = None,
    ) -> Paragraph:
        value = "" if text is None else str(text)

        return Paragraph(
            value.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;"),
            style or self.body_style,
        )

    def _add_title(
        self,
        story: list[Any],
        title: str,
    ) -> None:
        story.append(
            self._paragraph(
                title,
                self.title_style,
            )
        )

        story.append(
            Spacer(
                1,
                5 * mm,
            )
        )

    def _add_metadata(
        self,
        story: list[Any],
        metadata: dict[str, Any],
    ) -> None:
        date_range = metadata.get(
            "date_range",
            {},
        )

        start_date = date_range.get(
            "start"
        )

        end_date = date_range.get(
            "end"
        )

        if start_date and end_date:
            date_range_text = (
                f"{start_date} to {end_date}"
            )
        elif start_date:
            date_range_text = start_date
        elif end_date:
            date_range_text = end_date
        else:
            date_range_text = "All Time"

        metadata_rows = [
            [
                self._paragraph(
                    "Experiment",
                    self.small_style,
                ),
                self._paragraph(
                    metadata.get(
                        "experiment_name",
                        "",
                    ),
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Report Type",
                    self.small_style,
                ),
                self._paragraph(
                    metadata.get(
                        "report_type",
                        "",
                    ),
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Date Range",
                    self.small_style,
                ),
                self._paragraph(
                    date_range_text,
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Generated At",
                    self.small_style,
                ),
                self._paragraph(
                    metadata.get(
                        "generated_at",
                        "",
                    ),
                    self.small_style,
                ),
            ],
        ]

        table = Table(
            metadata_rows,
            colWidths=[
                38 * mm,
                132 * mm,
            ],
        )

        table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, -1),
                        colors.HexColor(
                            "#E8F5F1"
                        ),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.HexColor(
                            "#B8DCD2"
                        ),
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.25,
                        colors.HexColor(
                            "#D8E8E3"
                        ),
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        story.append(table)

        story.append(
            Spacer(
                1,
                6 * mm,
            )
        )

    def _add_summary(
        self,
        story: list[Any],
        summary: dict[str, Any],
    ) -> None:
        story.append(
            self._paragraph(
                "Research Summary",
                self.heading_style,
            )
        )

        rows = [
            [
                self._paragraph(
                    "Metric",
                    self.small_style,
                ),
                self._paragraph(
                    "Value",
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Surveys",
                    self.small_style,
                ),
                self._paragraph(
                    summary.get(
                        "survey_count",
                        0,
                    ),
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Questions",
                    self.small_style,
                ),
                self._paragraph(
                    summary.get(
                        "question_count",
                        0,
                    ),
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Personas",
                    self.small_style,
                ),
                self._paragraph(
                    summary.get(
                        "persona_count",
                        0,
                    ),
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Participating Personas",
                    self.small_style,
                ),
                self._paragraph(
                    summary.get(
                        "participating_persona_count",
                        0,
                    ),
                    self.small_style,
                ),
            ],
            [
                self._paragraph(
                    "Synthetic Responses",
                    self.small_style,
                ),
                self._paragraph(
                    summary.get(
                        "synthetic_response_count",
                        0,
                    ),
                    self.small_style,
                ),
            ],
        ]

        table = Table(
            rows,
            colWidths=[
                95 * mm,
                75 * mm,
            ],
        )

        table.setStyle(
            self._standard_table_style()
        )

        story.append(table)

    def _add_experiment_summary(
        self,
        story: list[Any],
        data: dict[str, Any],
    ) -> None:
        story.append(
            self._paragraph(
                "Experiment Overview",
                self.heading_style,
            )
        )

        experiment = data.get(
            "experiment",
            {},
        )

        fields = [
            (
                "Experiment Name",
                experiment.get(
                    "name",
                    "",
                ),
            ),
            (
                "Target Audience",
                experiment.get(
                    "target_audience",
                    "",
                ),
            ),
            (
                "Status",
                experiment.get(
                    "status",
                    "",
                ),
            ),
            (
                "Description",
                experiment.get(
                    "description",
                    "",
                ),
            ),
        ]

        rows = []

        for label, value in fields:
            rows.append(
                [
                    self._paragraph(
                        label,
                        self.small_style,
                    ),
                    self._paragraph(
                        value or "Not specified",
                        self.small_style,
                    ),
                ]
            )

        table = Table(
            rows,
            colWidths=[
                42 * mm,
                128 * mm,
            ],
        )

        table.setStyle(
            self._standard_table_style()
        )

        story.append(table)

        story.append(
            Spacer(
                1,
                5 * mm,
            )
        )

        self._add_summary(
            story,
            data.get(
                "summary",
                {},
            ),
        )

    def _add_persona_analysis(
        self,
        story: list[Any],
        data: dict[str, Any],
    ) -> None:
        story.append(
            self._paragraph(
                "Persona Analysis",
                self.heading_style,
            )
        )

        personas = data.get(
            "personas",
            [],
        )

        if not personas:
            story.append(
                self._paragraph(
                    "No personas are available for this experiment."
                )
            )
            return

        for index, persona in enumerate(
            personas,
            start=1,
        ):
            story.append(
                self._paragraph(
                    f"{index}. {persona.get('name', 'Unnamed Persona')}",
                    self.subheading_style,
                )
            )

            details = [
                (
                    "Age",
                    persona.get(
                        "age",
                        "Not specified",
                    ),
                ),
                (
                    "Gender",
                    persona.get(
                        "gender",
                        "Not specified",
                    ),
                ),
                (
                    "Occupation",
                    persona.get(
                        "occupation",
                        "Not specified",
                    ),
                ),
                (
                    "Location",
                    persona.get(
                        "location",
                        "Not specified",
                    ),
                ),
            ]

            rows = []

            for label, value in details:
                rows.append(
                    [
                        self._paragraph(
                            label,
                            self.small_style,
                        ),
                        self._paragraph(
                            value,
                            self.small_style,
                        ),
                    ]
                )

            table = Table(
                rows,
                colWidths=[
                    40 * mm,
                    130 * mm,
                ],
            )

            table.setStyle(
                self._standard_table_style()
            )

            story.append(table)

            if persona.get("description"):
                story.append(
                    Spacer(
                        1,
                        2 * mm,
                    )
                )

                story.append(
                    self._paragraph(
                        (
                            "<b>Description:</b> "
                            f"{persona['description']}"
                        ),
                        self.small_style,
                    )
                )

            self._add_list_section(
                story,
                "Goals",
                persona.get(
                    "goals",
                    [],
                ),
            )

            self._add_list_section(
                story,
                "Needs",
                persona.get(
                    "needs",
                    [],
                ),
            )

            self._add_list_section(
                story,
                "Pain Points",
                persona.get(
                    "pain_points",
                    [],
                ),
            )

            self._add_list_section(
                story,
                "Behaviors",
                persona.get(
                    "behaviors",
                    [],
                ),
            )

            self._add_list_section(
                story,
                "Interests",
                persona.get(
                    "interests",
                    [],
                ),
            )

            story.append(
                Spacer(
                    1,
                    4 * mm,
                )
            )

    def _add_survey_results(
        self,
        story: list[Any],
        data: dict[str, Any],
    ) -> None:
        story.append(
            self._paragraph(
                "Survey Results",
                self.heading_style,
            )
        )

        surveys = data.get(
            "surveys",
            [],
        )

        questions = data.get(
            "questions",
            [],
        )

        responses = data.get(
            "responses",
            [],
        )

        if not surveys:
            story.append(
                self._paragraph(
                    "No surveys are available for this experiment."
                )
            )
            return

        for survey in surveys:
            story.append(
                self._paragraph(
                    survey.get(
                        "title",
                        "Untitled Survey",
                    ),
                    self.subheading_style,
                )
            )

            story.append(
                self._paragraph(
                    (
                        f"Status: "
                        f"{survey.get('status', 'Unknown')}"
                    ),
                    self.small_style,
                )
            )

            survey_questions = [
                question
                for question in questions
                if question.get("survey_id")
                == survey.get("id")
            ]

            if not survey_questions:
                story.append(
                    self._paragraph(
                        "No questions found.",
                        self.small_style,
                    )
                )
                continue

            question_rows = [
                [
                    self._paragraph(
                        "Question",
                        self.small_style,
                    ),
                    self._paragraph(
                        "Type",
                        self.small_style,
                    ),
                    self._paragraph(
                        "Responses",
                        self.small_style,
                    ),
                ]
            ]

            for question in survey_questions:
                response_count = self._count_question_responses(
                    responses,
                    question.get("id"),
                )

                question_rows.append(
                    [
                        self._paragraph(
                            question.get(
                                "question",
                                "",
                            ),
                            self.small_style,
                        ),
                        self._paragraph(
                            question.get(
                                "question_type",
                                "",
                            ),
                            self.small_style,
                        ),
                        self._paragraph(
                            response_count,
                            self.small_style,
                        ),
                    ]
                )

            table = Table(
                question_rows,
                colWidths=[
                    100 * mm,
                    35 * mm,
                    35 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                self._standard_table_style(
                    header=True
                )
            )

            story.append(table)

            story.append(
                Spacer(
                    1,
                    4 * mm,
                )
            )

    def _add_insights(
        self,
        story: list[Any],
        data: dict[str, Any],
    ) -> None:
        story.append(
            self._paragraph(
                "Research Insights",
                self.heading_style,
            )
        )

        summary = data.get(
            "summary",
            {},
        )

        responses = data.get(
            "responses",
            [],
        )

        story.append(
            self._paragraph(
                (
                    "This report summarizes the synthetic research "
                    f"dataset containing "
                    f"{summary.get('synthetic_response_count', 0)} "
                    "generated responses."
                )
            )
        )

        story.append(
            Spacer(
                1,
                3 * mm,
            )
        )

        if responses:
            story.append(
                self._paragraph(
                    "Synthetic Response Overview",
                    self.subheading_style,
                )
            )

            rows = [
                [
                    self._paragraph(
                        "Persona",
                        self.small_style,
                    ),
                    self._paragraph(
                        "Response ID",
                        self.small_style,
                    ),
                    self._paragraph(
                        "Created At",
                        self.small_style,
                    ),
                ]
            ]

            for response in responses:
                rows.append(
                    [
                        self._paragraph(
                            response.get(
                                "persona_name",
                                "Unknown",
                            ),
                            self.small_style,
                        ),
                        self._paragraph(
                            response.get(
                                "id",
                                "",
                            ),
                            self.small_style,
                        ),
                        self._paragraph(
                            response.get(
                                "created_at",
                                "",
                            ),
                            self.small_style,
                        ),
                    ]
                )

            table = Table(
                rows,
                colWidths=[
                    60 * mm,
                    30 * mm,
                    80 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                self._standard_table_style(
                    header=True
                )
            )

            story.append(table)

        else:
            story.append(
                self._paragraph(
                    "No synthetic responses are available."
                )
            )

    def _add_list_section(
        self,
        story: list[Any],
        title: str,
        values: Any,
    ) -> None:
        if not values:
            return

        if not isinstance(
            values,
            list,
        ):
            values = [values]

        story.append(
            self._paragraph(
                f"<b>{title}:</b> "
                + ", ".join(
                    str(value)
                    for value in values
                ),
                self.small_style,
            )
        )

    def _count_question_responses(
        self,
        responses: list[dict[str, Any]],
        question_id: int | None,
    ) -> int:
        if question_id is None:
            return 0

        question_key = str(
            question_id
        )

        count = 0

        for response in responses:
            answers = response.get(
                "answers",
                {},
            )

            if question_key in answers:
                count += 1

        return count

    def _standard_table_style(
        self,
        header: bool = False,
    ) -> TableStyle:
        commands = [
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor(
                    "#C9D8D4"
                ),
            ),
            (
                "INNERGRID",
                (0, 0),
                (-1, -1),
                0.25,
                colors.HexColor(
                    "#DCE7E4"
                ),
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP",
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                6,
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                6,
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),
        ]

        if header:
            commands.append(
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor(
                        "#E8F5F1"
                    ),
                )
            )

        return TableStyle(
            commands
        )

    def generate_pdf(
        self,
        report_payload: dict[str, Any],
        output_path: str | Path,
    ) -> str:
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

        report_type = metadata.get(
            "report_type"
        )

        document = SimpleDocTemplate(
            str(output),
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
        )

        story: list[Any] = []

        self._add_title(
            story,
            metadata.get(
                "title",
                "Research Report",
            ),
        )

        self._add_metadata(
            story,
            metadata,
        )

        if report_type == "experiment_summary":
            self._add_experiment_summary(
                story,
                data,
            )

        elif report_type == "persona_analysis":
            self._add_persona_analysis(
                story,
                data,
            )

        elif report_type == "survey_results":
            self._add_survey_results(
                story,
                data,
            )

        elif report_type == "insights":
            self._add_insights(
                story,
                data,
            )

        else:
            raise ValueError(
                f"Unsupported report type: {report_type}"
            )

        document.build(story)

        return str(output)


pdf_report_service = PDFReportService()