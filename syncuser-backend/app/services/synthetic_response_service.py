from uuid import uuid4

from app.core.config import settings
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.schemas.persona import PersonaResponse
from app.schemas.synthetic_response import (
    GeneratedSyntheticAnswer,
)
from app.services.ai_exceptions import AIServiceError
from app.services.llm_service import (
    generate_structured_synthetic_answers,
)
from app.services.prompt_builder import (
    build_synthetic_responses_prompt,
)
from app.services.similarity_search_service import (
    similarity_search_service,
)
from app.services.synthetic_response_validator import (
    validate_synthetic_answer,
    SyntheticResponseValidationError,
)


def _build_persona_data(persona: Persona) -> PersonaResponse:
    """Convert a database persona to the prompt schema."""

    return PersonaResponse(
        id=persona.id,
        experiment_id=persona.experiment_id,
        name=persona.name,
        gender=persona.gender,
        description=persona.description or "",
        age=persona.age or 0,
        occupation=persona.occupation or "",
        location=persona.location or "",
        goals=persona.goals or [],
        pain_points=persona.pain_points or [],
        behaviors=persona.behaviors or [],
        interests=persona.interests or [],
        needs=persona.needs or [],
        created_at=persona.created_at,
    )


def _retrieve_memories_by_question(
    persona: Persona,
    experiment: Experiment,
    questions: list[SurveyQuestion],
    db=None,
) -> dict[str, list[dict]]:
    """
    Retrieve relevant memories for each question.
    Memory retrieval does not make Gemini generation requests.
    """

    memories_by_question: dict[str, list[dict]] = {}

    if db is None:
        return memories_by_question

    for question in questions:
        memory_results = (
            similarity_search_service.search_similar_memories(
                db=db,
                experiment_id=experiment.id,
                query=question.question,
                limit=5,
                persona_id=persona.id,
            )
        )

        memories_by_question[str(question.id)] = [
            {
                "id": memory.id,
                "source_type": memory.source_type,
                "source_id": memory.source_id,
                "content": memory.content,
                "metadata": memory.metadata_json,
                "distance": float(distance),
                "similarity": 1.0 - float(distance),
            }
            for memory, distance in memory_results
        ]

    return memories_by_question


def generate_synthetic_answers_for_persona(
    persona: Persona,
    experiment: Experiment,
    questions: list[SurveyQuestion],
    db=None,
) -> dict:
    """
    Generate and validate answers for every survey question
    using one Gemini generation request for this persona.
    """

    if not questions:
        return {
            "persona_id": persona.id,
            "persona_name": persona.name,
            "answers": {},
        }

    persona_data = _build_persona_data(persona)

    memories_by_question = _retrieve_memories_by_question(
        persona=persona,
        experiment=experiment,
        questions=questions,
        db=db,
    )

    question_payload = [
        {
            "question_id": str(question.id),
            "question_text": question.question,
            "question_type": question.question_type,
            "options": question.options or [],
        }
        for question in questions
    ]

    prompt = build_synthetic_responses_prompt(
        persona=persona_data,
        experiment_name=experiment.name,
        experiment_description=experiment.description,
        questions=question_payload,
        memories_by_question=memories_by_question,
    )

    generated_batch = generate_structured_synthetic_answers(prompt)

    expected_ids = [str(question.id) for question in questions]
    expected_id_set = set(expected_ids)

    generated_by_id = {}

    for item in generated_batch.answers:
        question_id = str(item.question_id)

        if question_id not in expected_id_set:
            raise AIServiceError(
                "AI returned an answer for an unknown survey question.",
                status_code=502,
            )

        if question_id in generated_by_id:
            raise AIServiceError(
                "AI returned duplicate answers for a survey question.",
                status_code=502,
            )

        generated_by_id[question_id] = item.answer

    missing_ids = expected_id_set - set(generated_by_id)

    if missing_ids:
        raise AIServiceError(
            "AI did not return answers for every survey question. "
            "Please try generating the responses again.",
            status_code=502,
        )

    validated_answers = {}

    question_by_id = {
        str(question.id): question
        for question in questions
    }

    for question_id in expected_ids:
        question = question_by_id[question_id]

        try:
            validated_answer = validate_synthetic_answer(
                generated_answer=GeneratedSyntheticAnswer(
                    answer=generated_by_id[question_id]
                ),
                question_type=question.question_type,
                options=question.options or [],
            )

        except SyntheticResponseValidationError as error:
            raise AIServiceError(
                "AI generated an answer that did not match "
                "the survey question requirements. "
                "Please try generating the responses again.",
                status_code=502,
            ) from error

        validated_answers[question_id] = validated_answer.answer

    return {
        "persona_id": persona.id,
        "persona_name": persona.name,
        "answers": validated_answers,
    }


def generate_synthetic_response_for_persona(
    persona: Persona,
    experiment: Experiment,
    questions: list[SurveyQuestion],
    db=None,
) -> dict:
    """
    Compatibility wrapper for the existing per-persona workflow.
    """

    return generate_synthetic_answers_for_persona(
        persona=persona,
        experiment=experiment,
        questions=questions,
        db=db,
    )


def generate_and_store_synthetic_response_for_persona(
    persona: Persona,
    experiment: Experiment,
    survey_id: int,
    questions: list[SurveyQuestion],
    db,
    generation_id: str,
) -> SyntheticResponse:
    """
    Generate one complete persona response and store it.
    """

    generated_response = generate_synthetic_answers_for_persona(
        persona=persona,
        experiment=experiment,
        questions=questions,
        db=db,
    )

    synthetic_response = SyntheticResponse(
        survey_id=survey_id,
        experiment_id=experiment.id,
        persona_id=persona.id,
        response_data=generated_response,
        generation_id=generation_id,
        model_name=settings.GEMINI_MODEL,
        generation_status="completed",
    )

    db.add(synthetic_response)
    db.flush()

    return synthetic_response


def generate_and_store_synthetic_responses_for_personas(
    personas: list[Persona],
    experiment: Experiment,
    survey_id: int,
    questions: list[SurveyQuestion],
    db,
) -> list[SyntheticResponse]:
    """
    Generate and store one response per persona.
    Each persona's answers share one generation request.
    """

    generation_id = f"gen_{uuid4().hex}"
    synthetic_responses = []

    for persona in personas:
        synthetic_response = (
            generate_and_store_synthetic_response_for_persona(
                persona=persona,
                experiment=experiment,
                survey_id=survey_id,
                questions=questions,
                db=db,
                generation_id=generation_id,
            )
        )

        synthetic_responses.append(synthetic_response)

    return synthetic_responses