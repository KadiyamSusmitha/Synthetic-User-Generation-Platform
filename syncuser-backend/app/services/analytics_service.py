from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.services.theme_service import theme_service


class AnalyticsService:
    """Service responsible for calculating experiment analytics."""

    SUPPORTED_QUESTION_TYPES = {
        "single_choice",
        "rating",
        "short_text",
        "long_text",
        "yes_no",
        "multiple_choice",
        "likert",
    }

    def get_experiment_analytics(
        self,
        db: Session,
        experiment: Experiment,
    ) -> dict[str, Any]:
        """Calculate analytics using responses from Ready surveys."""

        surveys = (
            db.query(Survey)
            .filter(
                Survey.experiment_id == experiment.id,
                Survey.status == "Ready",
            )
            .order_by(Survey.id.asc())
            .all()
        )

        survey_ids = [survey.id for survey in surveys]

        questions = []
        synthetic_responses = []

        if survey_ids:
            questions = (
                db.query(SurveyQuestion)
                .filter(SurveyQuestion.survey_id.in_(survey_ids))
                .order_by(
                    SurveyQuestion.display_order.asc(),
                    SurveyQuestion.id.asc(),
                )
                .all()
            )

            synthetic_responses = (
                db.query(SyntheticResponse)
                .filter(
                    SyntheticResponse.experiment_id == experiment.id,
                    SyntheticResponse.survey_id.in_(survey_ids),
                )
                .order_by(
                    SyntheticResponse.created_at.asc(),
                    SyntheticResponse.id.asc(),
                )
                .all()
            )

        personas = (
            db.query(Persona)
            .filter(Persona.experiment_id == experiment.id)
            .order_by(Persona.id)
            .all()
        )

        synthetic_answer_records = (
            self._build_synthetic_answer_records(synthetic_responses)
        )

        question_analytics = [
            self._calculate_question_analytics(
                question=question,
                synthetic_answer_records=synthetic_answer_records,
            )
            for question in questions
        ]

        demographic_patterns = self._calculate_demographic_patterns(
            personas=personas,
            synthetic_responses=synthetic_responses,
        )

        persona_patterns = self._calculate_persona_patterns(
            personas=personas,
            synthetic_responses=synthetic_responses,
            questions=questions,
        )

        trends = self._calculate_response_trends(
            synthetic_responses=synthetic_responses,
        )

        overview_metrics = self._calculate_overview_metrics(
            personas=personas,
            synthetic_responses=synthetic_responses,
            question_analytics=question_analytics,
        )

        # Preserve the existing theme-analysis integration.
        theme_result = theme_service.analyze_experiment(
            db=db,
            experiment=experiment,
        )

        overview_metrics["key_themes"] = len(
            theme_result.get("themes", [])
        )

        common_answers = self._calculate_common_answers(
            synthetic_answer_records=synthetic_answer_records,
            questions=questions,
        )

        total_responses = len(synthetic_responses)

        return {
            "experiment_id": experiment.id,
            "experiment_name": experiment.name,
            "summary": {
                "synthetic_responses": total_responses,
                "total_responses": total_responses,
                "surveys": len(surveys),
                "questions": len(questions),
                "personas": len(personas),
            },
            "overview_metrics": overview_metrics,
            "question_analytics": question_analytics,
            "demographic_patterns": demographic_patterns,
            "persona_patterns": persona_patterns,
            "trends": trends,
            "common_answers": common_answers,
        }

    # ------------------------------------------------------------------
    # Response normalization
    # ------------------------------------------------------------------

    def _build_synthetic_answer_records(
        self,
        synthetic_responses: list[SyntheticResponse],
    ) -> list[dict[str, Any]]:
        """Convert synthetic response JSON into normalized answer records."""

        records = []

        for response in synthetic_responses:
            response_data = response.response_data

            if not isinstance(response_data, dict):
                continue

            answers = response_data.get("answers")

            if not isinstance(answers, dict):
                continue

            for question_id, answer in answers.items():
                if not self._is_question_id(question_id):
                    continue

                records.append(
                    {
                        "response_id": response.id,
                        "question_id": int(question_id),
                        "answer": answer,
                        "source": "synthetic",
                        "created_at": response.created_at,
                        "persona_id": response.persona_id,
                    }
                )

        return records

    @staticmethod
    def _is_question_id(value: Any) -> bool:
        """Return True when a value represents a positive numeric ID."""

        if isinstance(value, bool):
            return False

        if isinstance(value, int):
            return value > 0

        if isinstance(value, str):
            return value.isdigit() and int(value) > 0

        return False

    # ------------------------------------------------------------------
    # Question analytics
    # ------------------------------------------------------------------

    def _calculate_question_analytics(
        self,
        question: SurveyQuestion,
        synthetic_answer_records: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Calculate analytics for an individual survey question."""

        synthetic_answers = [
            record
            for record in synthetic_answer_records
            if record["question_id"] == question.id
        ]

        result = {
            "question_id": question.id,
            "survey_id": question.survey_id,
            "question": question.question,
            "question_type": question.question_type,
            "options": question.options or [],
            "required": question.required,
            "display_order": question.display_order,
            "synthetic_response_count": len(synthetic_answers),
            "response_count": len(synthetic_answers),
            "analytics": {},
        }

        if not synthetic_answers:
            return result

        question_type = str(question.question_type).lower()

        if question_type in {"single_choice", "yes_no", "likert"}:
            result["analytics"] = self._calculate_choice_analytics(
                answers=synthetic_answers,
                options=question.options or [],
            )

        elif question_type == "rating":
            result["analytics"] = self._calculate_rating_analytics(
                answers=synthetic_answers,
            )

        elif question_type == "multiple_choice":
            result["analytics"] = (
                self._calculate_multiple_choice_analytics(
                    answers=synthetic_answers,
                    options=question.options or [],
                )
            )

        elif question_type in {"short_text", "long_text"}:
            result["analytics"] = self._calculate_text_analytics(
                answers=synthetic_answers,
            )

        else:
            result["analytics"] = {
                "type": "unsupported",
                "message": (
                    "Analytics are not implemented for this "
                    "question type yet."
                ),
            }

        return result

    def _calculate_choice_analytics(
        self,
        answers: list[dict[str, Any]],
        options: list[str],
    ) -> dict[str, Any]:
        """Calculate categorical answer counts and percentages."""

        values = []

        for record in answers:
            answer = record["answer"]

            if isinstance(answer, str) and answer.strip():
                values.append(answer.strip())

        counts = Counter(values)
        total = len(values)

        known_options = []

        for option in options:
            if isinstance(option, str):
                cleaned = option.strip()

                if cleaned and cleaned not in known_options:
                    known_options.append(cleaned)

        distribution = []

        for option in known_options:
            count = counts.get(option, 0)

            distribution.append(
                {
                    "option": option,
                    "count": count,
                    "percentage": self._percentage(count, total),
                }
            )

        for value, count in counts.items():
            if value not in known_options:
                distribution.append(
                    {
                        "option": value,
                        "count": count,
                        "percentage": self._percentage(count, total),
                    }
                )

        distribution.sort(
            key=lambda item: (
                -item["count"],
                item["option"].lower(),
            )
        )

        return {
            "type": "choice",
            "valid_answer_count": total,
            "distribution": distribution,
            "most_common": (
                distribution[0]["option"] if distribution else None
            ),
        }

    def _calculate_rating_analytics(
        self,
        answers: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Calculate statistics for numerical rating answers."""

        numeric_values = []

        for record in answers:
            value = record["answer"]

            if isinstance(value, bool):
                continue

            if isinstance(value, (int, float)):
                numeric_values.append(float(value))

            elif isinstance(value, str):
                try:
                    numeric_values.append(float(value.strip()))
                except ValueError:
                    continue

        if not numeric_values:
            return {
                "type": "rating",
                "valid_answer_count": 0,
                "average": None,
                "minimum": None,
                "maximum": None,
                "distribution": [],
            }

        counts = Counter(numeric_values)

        distribution = [
            {
                "rating": rating,
                "count": count,
                "percentage": self._percentage(
                    count,
                    len(numeric_values),
                ),
            }
            for rating, count in sorted(counts.items())
        ]

        return {
            "type": "rating",
            "valid_answer_count": len(numeric_values),
            "average": round(
                sum(numeric_values) / len(numeric_values),
                2,
            ),
            "minimum": min(numeric_values),
            "maximum": max(numeric_values),
            "distribution": distribution,
        }

    def _calculate_multiple_choice_analytics(
        self,
        answers: list[dict[str, Any]],
        options: list[str],
    ) -> dict[str, Any]:
        """Calculate independent frequencies for multiple-choice answers."""

        counts = Counter()
        valid_response_count = 0

        for record in answers:
            answer = record["answer"]

            if not isinstance(answer, list):
                continue

            selected_options = [
                item.strip()
                for item in answer
                if isinstance(item, str) and item.strip()
            ]

            if not selected_options:
                continue

            valid_response_count += 1

            for item in selected_options:
                counts[item] += 1

        known_options = []

        for option in options:
            if isinstance(option, str):
                cleaned = option.strip()

                if cleaned and cleaned not in known_options:
                    known_options.append(cleaned)

        distribution = []

        for option in known_options:
            count = counts.get(option, 0)

            distribution.append(
                {
                    "option": option,
                    "count": count,
                    "percentage_of_responses": self._percentage(
                        count,
                        valid_response_count,
                    ),
                }
            )

        for value, count in counts.items():
            if value not in known_options:
                distribution.append(
                    {
                        "option": value,
                        "count": count,
                        "percentage_of_responses": self._percentage(
                            count,
                            valid_response_count,
                        ),
                    }
                )

        distribution.sort(
            key=lambda item: (
                -item["count"],
                item["option"].lower(),
            )
        )

        return {
            "type": "multiple_choice",
            "valid_response_count": valid_response_count,
            "total_selections": sum(counts.values()),
            "distribution": distribution,
        }

    def _calculate_text_analytics(
        self,
        answers: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Calculate basic statistics for text answers."""

        text_values = [
            record["answer"].strip()
            for record in answers
            if isinstance(record["answer"], str)
            and record["answer"].strip()
        ]

        counts = Counter(text_values)

        return {
            "type": "text",
            "valid_answer_count": len(text_values),
            "unique_answer_count": len(counts),
            "common_answers": [
                {"answer": answer, "count": count}
                for answer, count in counts.most_common(10)
            ],
            "responses": text_values,
        }

    # ------------------------------------------------------------------
    # Demographic analytics
    # ------------------------------------------------------------------

    def _calculate_demographic_patterns(
        self,
        personas: list[Persona],
        synthetic_responses: list[SyntheticResponse],
    ) -> dict[str, Any]:
        """Calculate demographics for participating personas."""

        participating_persona_ids = {
            response.persona_id
            for response in synthetic_responses
            if response.persona_id is not None
        }

        participating_personas = [
            persona
            for persona in personas
            if persona.id in participating_persona_ids
        ]

        ages = [
            persona.age
            for persona in participating_personas
            if isinstance(persona.age, int)
            and not isinstance(persona.age, bool)
        ]

        genders = [
            persona.gender.strip()
            for persona in participating_personas
            if isinstance(persona.gender, str)
            and persona.gender.strip()
        ]

        locations = [
            persona.location.strip()
            for persona in participating_personas
            if isinstance(persona.location, str)
            and persona.location.strip()
        ]

        occupations = [
            persona.occupation.strip()
            for persona in participating_personas
            if isinstance(persona.occupation, str)
            and persona.occupation.strip()
        ]

        return {
            "participating_personas": len(participating_personas),
            "age": self._calculate_age_distribution(ages),
            "gender": self._calculate_value_distribution(genders),
            "location": self._calculate_value_distribution(locations),
            "occupation": self._calculate_value_distribution(occupations),
        }

    def _calculate_age_distribution(
        self,
        ages: list[int],
    ) -> dict[str, Any]:
        """Calculate age statistics and age buckets."""

        if not ages:
            return {
                "count": 0,
                "average": None,
                "minimum": None,
                "maximum": None,
                "distribution": [],
            }

        buckets = {
            "18-24": 0,
            "25-34": 0,
            "35-44": 0,
            "45+": 0,
        }

        for age in ages:
            if 18 <= age <= 24:
                buckets["18-24"] += 1
            elif 25 <= age <= 34:
                buckets["25-34"] += 1
            elif 35 <= age <= 44:
                buckets["35-44"] += 1
            elif age >= 45:
                buckets["45+"] += 1

        distribution = [
            {
                "range": age_range,
                "count": count,
                "percentage": self._percentage(count, len(ages)),
            }
            for age_range, count in buckets.items()
        ]

        return {
            "count": len(ages),
            "average": round(sum(ages) / len(ages), 2),
            "minimum": min(ages),
            "maximum": max(ages),
            "distribution": distribution,
        }

    def _calculate_value_distribution(
        self,
        values: list[str],
    ) -> dict[str, Any]:
        counts = Counter(values)

        distribution = [
            {
                "value": value,
                "count": count,
                "percentage": self._percentage(count, len(values)),
            }
            for value, count in counts.items()
        ]

        distribution.sort(
            key=lambda item: (
                -item["count"],
                item["value"].lower(),
            )
        )

        return {
            "count": len(values),
            "unique_count": len(counts),
            "distribution": distribution,
        }

    # ------------------------------------------------------------------
    # Persona analytics
    # ------------------------------------------------------------------

    def _calculate_persona_patterns(
        self,
        personas: list[Persona],
        synthetic_responses: list[SyntheticResponse],
        questions: list[SurveyQuestion],
    ) -> list[dict[str, Any]]:
        """Return a summary for each participating persona."""

        response_by_persona = defaultdict(list)

        for response in synthetic_responses:
            response_by_persona[response.persona_id].append(response)

        question_lookup = {
            question.id: question for question in questions
        }

        persona_results = []

        for persona in personas:
            responses = response_by_persona.get(persona.id, [])

            if not responses:
                continue

            answer_map = defaultdict(list)

            for response in responses:
                response_data = response.response_data

                if not isinstance(response_data, dict):
                    continue

                answers = response_data.get("answers")

                if not isinstance(answers, dict):
                    continue

                for question_id, answer in answers.items():
                    if self._is_question_id(question_id):
                        answer_map[int(question_id)].append(answer)

            question_answers = []

            for question_id, answers in answer_map.items():
                question = question_lookup.get(question_id)

                if question is None:
                    continue

                question_answers.append(
                    {
                        "question_id": question.id,
                        "question": question.question,
                        "question_type": question.question_type,
                        "answers": answers,
                    }
                )

            persona_results.append(
                {
                    "persona_id": persona.id,
                    "persona_name": persona.name,
                    "age": persona.age,
                    "gender": persona.gender,
                    "occupation": persona.occupation,
                    "location": persona.location,
                    "synthetic_response_count": len(responses),
                    "question_answers": question_answers,
                }
            )

        return persona_results

    # ------------------------------------------------------------------
    # Common answers
    # ------------------------------------------------------------------

    def _calculate_common_answers(
        self,
        synthetic_answer_records: list[dict[str, Any]],
        questions: list[SurveyQuestion],
    ) -> list[dict[str, Any]]:
        """Find common answers for categorical questions."""

        question_lookup = {
            question.id: question for question in questions
        }

        counters = defaultdict(Counter)

        for record in synthetic_answer_records:
            question = question_lookup.get(record["question_id"])

            if question is None:
                continue

            if question.question_type in {
                "single_choice",
                "yes_no",
                "likert",
            }:
                answer = record["answer"]

                if isinstance(answer, str) and answer.strip():
                    counters[question.id][answer.strip()] += 1

            elif question.question_type == "multiple_choice":
                answer = record["answer"]

                if isinstance(answer, list):
                    for item in answer:
                        if isinstance(item, str) and item.strip():
                            counters[question.id][item.strip()] += 1

        results = []

        for question_id, counter in counters.items():
            question = question_lookup.get(question_id)

            if question is None:
                continue

            for answer, count in counter.most_common(5):
                results.append(
                    {
                        "question_id": question.id,
                        "question": question.question,
                        "answer": answer,
                        "count": count,
                    }
                )

        results.sort(
            key=lambda item: (
                -item["count"],
                item["question_id"],
            )
        )

        return results[:20]

    # ------------------------------------------------------------------
    # Trends
    # ------------------------------------------------------------------

    def _calculate_response_trends(
        self,
        synthetic_responses: list[SyntheticResponse],
    ) -> dict[str, Any]:
        """Calculate synthetic response counts by calendar date."""

        daily_counts = defaultdict(int)

        for response in synthetic_responses:
            date_key = self._date_key(response.created_at)

            if date_key:
                daily_counts[date_key] += 1

        trends = [
            {
                "date": date_key,
                "synthetic": daily_counts[date_key],
                "total": daily_counts[date_key],
            }
            for date_key in sorted(daily_counts)
        ]

        return {
            "granularity": "day",
            "data": trends,
        }

    @staticmethod
    def _date_key(
        value: datetime | None,
    ) -> str | None:
        if not isinstance(value, datetime):
            return None

        return value.date().isoformat()

    # ------------------------------------------------------------------
    # Overview metrics
    # ------------------------------------------------------------------

    def _calculate_overview_metrics(
        self,
        personas: list[Persona],
        synthetic_responses: list[SyntheticResponse],
        question_analytics: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Calculate the metrics used by the Insights overview."""

        total_responses = len(synthetic_responses)

        participating_persona_ids = {
            response.persona_id
            for response in synthetic_responses
            if response.persona_id is not None
        }

        total_personas = len(personas)
        participating_personas = len(participating_persona_ids)

        engagement_rate = self._percentage(
            participating_personas,
            total_personas,
        )

        satisfaction_score = self._calculate_satisfaction_score(
            question_analytics
        )

        satisfaction_details = (
            self._calculate_satisfaction_score_details(
                question_analytics
            )
        )

        return {
            "total_responses": total_responses,
            "engagement_rate": engagement_rate,
            "participating_personas": participating_personas,
            "total_personas": total_personas,
            "key_themes": None,
            "satisfaction_score": satisfaction_details["score"],
            "satisfaction_valid_answer_count": (
                    satisfaction_details["valid_answer_count"]
            ),
            "total_responses_change": None,
            "engagement_rate_change": None,
            "key_themes_change": None,
            "satisfaction_score_change": None,
        }


    def _calculate_satisfaction_score_details(
        self,
        question_analytics: list[dict[str, Any]],
    ) -> dict[str, Any]:
        weighted_score_total = 0.0
        valid_answer_count = 0

        positive_terms = (
            "happy",
            "satisfied",
            "excellent",
            "very good",
            "good",
        )

        negative_terms = (
            "unhappy",
            "unsatisfied",
            "dissatisfied",
            "not satisfied",
            "very poor",
            "poor",
        )

        neutral_terms = (
            "neutral",
            "neither",
            "average",
            "okay",
            "ok",
        )

        for question in question_analytics:
            question_text = str(
                question.get("question", "")
            ).lower()

            question_type = str(
                question.get("question_type", "")
            ).lower()

            analytics = question.get("analytics") or {}

            # Numeric rating questions.
            if question_type == "rating":
                average = analytics.get("average")
                count = analytics.get("valid_answer_count", 0)

                if average is None or not isinstance(count, (int, float)):
                    continue

                if count <= 0:
                    continue

                # Prefer the configured scale when numeric options exist.
                options = question.get("options") or []
                numeric_options = []

                for option in options:
                    value = option

                    if isinstance(option, dict):
                        value = option.get(
                            "value",
                            option.get("label"),
                        )

                    try:
                        numeric_options.append(float(value))
                    except (TypeError, ValueError):
                        continue

                scale_max = (
                    max(numeric_options)
                    if numeric_options
                    else 5.0
                )

                if scale_max <= 0:
                    continue

                score = (float(average) / scale_max) * 10
                score = max(0.0, min(10.0, score))

                weighted_score_total += score * count
                valid_answer_count += int(count)
                continue

            # Only include categorical questions about satisfaction.
            if not any(
                term in question_text
                for term in (
                    "satisf",
                    "happy",
                    "happiness",
                )
            ):
                continue

            distribution = analytics.get("distribution") or []

            if not isinstance(distribution, list):
                continue

            for item in distribution:
                if not isinstance(item, dict):
                    continue

                option = str(item.get("option", "")).strip().lower()

                try:
                    count = int(item.get("count", 0))
                except (TypeError, ValueError):
                    continue

                if not option or count <= 0:
                    continue

                if any(term in option for term in negative_terms):
                    score = 0.0
                elif any(term in option for term in positive_terms):
                    score = 10.0
                elif any(term in option for term in neutral_terms):
                    score = 5.0
                else:
                    # Do not invent a score for an unrecognized answer.
                    continue

                weighted_score_total += score * count
                valid_answer_count += count

        return {
            "score": (
                round(
                    weighted_score_total / valid_answer_count,
                    2,
                )
                if valid_answer_count > 0
                else None
            ),
            "valid_answer_count": valid_answer_count,
        }


    @staticmethod
    def _calculate_satisfaction_score(
        question_analytics: list[dict[str, Any]],
    ) -> float | None:
        """
        Calculate a satisfaction score from 0 to 10.

        Numerical rating questions use their actual average and
        observed maximum. Explicit satisfaction-related choice
        questions use weighted categorical scores.

        This function makes no LLM/API calls.
        """

        positive_answers = {
            "happy",
            "satisfied",
            "very satisfied",
            "very happy",
            "extremely satisfied",
            "extremely happy",
            "positive",
            "excellent",
            "very good",
        }

        neutral_answers = {
            "neutral",
            "neither satisfied nor dissatisfied",
            "average",
            "moderate",
        }

        negative_answers = {
            "unhappy",
            "un happy",
            "unsatisfied",
            "dissatisfied",
            "very dissatisfied",
            "very unhappy",
            "negative",
            "poor",
            "very poor",
        }

        weighted_total = 0.0
        total_valid_answers = 0

        for question in question_analytics:
            question_text = str(
                question.get("question", "")
            ).strip().lower()

            question_type = str(
                question.get("question_type", "")
            ).strip().lower().replace("-", "_").replace(" ", "_")

            analytics = question.get("analytics") or {}

            if not isinstance(analytics, dict):
                continue

            # A question must explicitly relate to satisfaction.
            is_satisfaction_question = any(
                keyword in question_text
                for keyword in (
                    "satisf",
                    "happy",
                    "unhappy",
                )
            )

            # Numerical rating questions.
            if question_type == "rating":
                average = analytics.get("average")
                valid_count = analytics.get("valid_answer_count", 0)
                maximum = analytics.get("maximum")
                minimum = analytics.get("minimum")

                if average is None:
                    continue

                try:
                    average = float(average)
                    valid_count = int(valid_count)
                except (TypeError, ValueError):
                    continue

                if valid_count <= 0:
                    continue

                # Infer the rating scale from observed values.
                # The usual 1–5 scale becomes a 0–10 score.
                try:
                    minimum = float(minimum) if minimum is not None else 1.0
                    maximum = float(maximum) if maximum is not None else 5.0
                except (TypeError, ValueError):
                    minimum, maximum = 1.0, 5.0

                if maximum <= minimum:
                    continue

                normalized_score = (
                    (average - minimum) / (maximum - minimum)
                ) * 10

                normalized_score = max(
                    0.0,
                    min(10.0, normalized_score),
                )

                weighted_total += normalized_score * valid_count
                total_valid_answers += valid_count
                continue

            # Do not interpret unrelated choice questions as satisfaction.
            if not is_satisfaction_question:
                continue

            # Choice distributions are lists of:
            # {"option": "Happy", "count": 6, "percentage": 50.0}
            distribution = analytics.get("distribution", [])

            if not isinstance(distribution, list):
                continue

            for item in distribution:
                if not isinstance(item, dict):
                    continue

                answer = str(item.get("option", "")).strip().lower()

                try:
                    count = int(item.get("count", 0))
                except (TypeError, ValueError):
                    continue

                if count <= 0:
                    continue

                if answer in positive_answers:
                    score = 10.0
                elif answer in neutral_answers:
                    score = 5.0
                elif answer in negative_answers:
                    score = 0.0
                else:
                    # Ignore unknown answers rather than guessing.
                    continue

                weighted_total += score * count
                total_valid_answers += count

        if total_valid_answers == 0:
            return None

        return round(weighted_total / total_valid_answers, 2)

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------

    @staticmethod
    def _percentage(
        value: int | float,
        total: int | float,
    ) -> float:
        if not total:
            return 0.0

        return round(
            (float(value) / float(total)) * 100,
            2,
        )

    def get_question_analytics(
        self,
        db: Session,
        experiment: Experiment,
        question_id: int,
    ) -> dict[str, Any]:
        """Return analytics for a question in a Ready survey."""

        question = (
            db.query(SurveyQuestion)
            .join(
                Survey,
                Survey.id == SurveyQuestion.survey_id,
            )
            .filter(
                SurveyQuestion.id == question_id,
                Survey.experiment_id == experiment.id,
                Survey.status == "Ready",
            )
            .first()
        )

        if not question:
            raise ValueError(
                "Question not found in a Ready survey for this experiment."
            )

        analytics = self.get_experiment_analytics(
            db=db,
            experiment=experiment,
        )

        for item in analytics["question_analytics"]:
            if item["question_id"] == question_id:
                return item

        raise ValueError("Question analytics not found.")


analytics_service = AnalyticsService()