from datetime import datetime

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.interview import Interview
from app.models.interview_message import InterviewMessage
from app.models.interview_note import InterviewNote
from app.models.interview_result import InterviewResult
from app.models.persona import Persona
from app.services.ai_exceptions import AIServiceError
from app.services.interview_prompt_builder import (
    build_interview_analysis_prompt,
    build_interview_evaluation_prompt,
    build_interview_turn_prompt,
)
from app.services.llm_service import (
    generate_structured_interview_analysis,
    generate_structured_interview_evaluation,
    generate_structured_interview_turn,
)


# =========================================================
# Interview lookup helpers
# =========================================================

def get_user_interview_with_context(
    interview_id: int,
    user_id: int,
    db: Session,
) -> tuple[Interview, Experiment, Persona]:

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )

    if not interview:
        raise ValueError("Interview not found.")

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == interview.experiment_id,
            Experiment.user_id == user_id,
        )
        .first()
    )

    if not experiment:
        raise ValueError("Experiment not found.")

    persona = (
        db.query(Persona)
        .filter(
            Persona.id == interview.persona_id,
            Persona.experiment_id == experiment.id,
        )
        .first()
    )

    if not persona:
        raise ValueError("Persona not found.")

    return interview, experiment, persona


def get_interview_messages(
    interview_id: int,
    db: Session,
) -> list[InterviewMessage]:

    return (
        db.query(InterviewMessage)
        .filter(
            InterviewMessage.interview_id == interview_id
        )
        .order_by(InterviewMessage.created_at.asc())
        .all()
    )


# =========================================================
# Message persistence
# =========================================================

def save_interview_message(
    interview: Interview,
    role: str,
    message: str,
    db: Session,
    question_type: str | None = None,
) -> InterviewMessage:

    interview_message = InterviewMessage(
        interview_id=interview.id,
        role=role,
        message=message.strip(),
        question_type=question_type,
    )

    db.add(interview_message)

    return interview_message


# =========================================================
# Generate one AI interview turn
# =========================================================

def generate_interview_turn(
    interview_id: int,
    user_id: int,
    db: Session,
    force_follow_up: bool = False,
) -> tuple[Interview, InterviewMessage, InterviewMessage]:

    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    if interview.status == "Completed":
        raise ValueError(
            "This interview has already been completed."
        )

    messages = get_interview_messages(
        interview.id,
        db,
    )

    prompt = build_interview_turn_prompt(
        experiment=experiment,
        persona=persona,
        messages=messages,
        force_follow_up=force_follow_up,
    )

    ai_output = generate_structured_interview_turn(
        prompt
    )

    # =====================================================
    # IMPORTANT:
    # The endpoint/action determines the question type.
    #
    # Normal / Start / Next:
    #     force_follow_up = False
    #
    # Explicit Follow-up:
    #     force_follow_up = True
    #
    # We do NOT trust Gemini's is_follow_up value here
    # to classify the database record.
    # =====================================================

    is_follow_up = force_follow_up

    question_type = (
        "follow_up"
        if is_follow_up
        else "primary"
    )

    interviewer_message = save_interview_message(
        interview=interview,
        role="interviewer",
        message=ai_output.interviewer_question,
        question_type=question_type,
        db=db,
    )

    persona_message = save_interview_message(
        interview=interview,
        role="persona",
        message=ai_output.persona_answer,
        db=db,
    )

    interview.total_questions += 1

    if is_follow_up:
        interview.follow_up_questions += 1
    else:
        interview.questions_explored += 1

    if ai_output.is_complete:
        interview.status = "Completed"
        interview.completed_at = datetime.utcnow()

    db.commit()

    db.refresh(interviewer_message)
    db.refresh(persona_message)
    db.refresh(interview)

    return (
        interview,
        interviewer_message,
        persona_message,
    )


# =========================================================
# Generate explicit follow-up
# =========================================================

def generate_interview_follow_up(
    interview_id: int,
    user_id: int,
    db: Session,
):
    return generate_interview_turn(
        interview_id=interview_id,
        user_id=user_id,
        db=db,
        force_follow_up=True,
    )


# =========================================================
# Evaluate current interview
# =========================================================

def evaluate_interview(
    interview_id: int,
    user_id: int,
    db: Session,
):
    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    messages = get_interview_messages(
        interview.id,
        db,
    )

    prompt = build_interview_evaluation_prompt(
        experiment=experiment,
        persona=persona,
        messages=messages,
    )

    return generate_structured_interview_evaluation(
        prompt
    )


# =========================================================
# Generate next interview turn
# =========================================================

def continue_interview(
    interview_id: int,
    user_id: int,
    db: Session,
):
    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    if interview.status == "Completed":
        raise ValueError(
            "This interview has already been completed."
        )

    evaluation = evaluate_interview(
        interview_id=interview_id,
        user_id=user_id,
        db=db,
    )

    if not evaluation.continue_interview:

        complete_interview(
            interview_id=interview_id,
            user_id=user_id,
            db=db,
        )

        return {
            "completed": True,
            "evaluation": evaluation,
        }

    return generate_interview_turn(
        interview_id=interview_id,
        user_id=user_id,
        db=db,
    )


# =========================================================
# Complete interview
# =========================================================

def complete_interview(
    interview_id: int,
    user_id: int,
    db: Session,
) -> Interview:

    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    if interview.status != "Completed":
        interview.status = "Completed"
        interview.completed_at = datetime.utcnow()

        db.commit()
        db.refresh(interview)

    return interview


# =========================================================
# Save interview
# =========================================================

def save_interview(
    interview_id: int,
    user_id: int,
    db: Session,
) -> Interview:

    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    if interview.status != "Completed":
        raise ValueError(
            "Only completed interviews can be saved."
        )

    if not interview.is_saved:
        interview.is_saved = True

        db.commit()
        db.refresh(interview)

    return interview


# =========================================================
# Delete interview
# =========================================================

def delete_interview(
    interview_id: int,
    user_id: int,
    db: Session,
) -> None:

    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    # Delete dependent records first so the interview can be
    # removed safely even when foreign keys do not use CASCADE.
    db.query(InterviewMessage).filter(
        InterviewMessage.interview_id == interview.id
    ).delete(synchronize_session=False)

    db.query(InterviewResult).filter(
        InterviewResult.interview_id == interview.id
    ).delete(synchronize_session=False)

    db.query(InterviewNote).filter(
        InterviewNote.interview_id == interview.id
    ).delete(synchronize_session=False)

    db.delete(interview)
    db.commit()


# =========================================================
# Generate final interview analysis
# =========================================================

def generate_interview_result(
    interview_id: int,
    user_id: int,
    db: Session,
) -> InterviewResult:

    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    messages = get_interview_messages(
        interview.id,
        db,
    )

    if not messages:
        raise ValueError(
            "Cannot analyze an interview with no conversation."
        )

    prompt = build_interview_analysis_prompt(
        experiment=experiment,
        persona=persona,
        messages=messages,
    )

    ai_output = generate_structured_interview_analysis(
        prompt
    )

    result = (
        db.query(InterviewResult)
        .filter(
            InterviewResult.interview_id == interview.id
        )
        .first()
    )

    if result:
        result.score = ai_output.score
        result.summary = ai_output.summary
        result.key_insights = ai_output.key_insights
        result.pain_points = ai_output.pain_points
        result.needs = ai_output.needs
        result.motivations = ai_output.motivations

    else:
        result = InterviewResult(
            interview_id=interview.id,
            score=ai_output.score,
            summary=ai_output.summary,
            key_insights=ai_output.key_insights,
            pain_points=ai_output.pain_points,
            needs=ai_output.needs,
            motivations=ai_output.motivations,
        )

        db.add(result)

    db.commit()
    db.refresh(result)

    return result


# =========================================================
# Run complete AI interview cycle
# =========================================================

def run_interview_cycle(
    interview_id: int,
    user_id: int,
    db: Session,
):
    """
    Run one AI interview cycle.

    The cycle is:

        AI Interviewer
              ↓
        AI Persona
              ↓
        Evaluation
              ↓
        Continue / Follow-up / Complete
    """

    interview, experiment, persona = (
        get_user_interview_with_context(
            interview_id,
            user_id,
            db,
        )
    )

    if interview.status == "Completed":
        result = (
            db.query(InterviewResult)
            .filter(
                InterviewResult.interview_id == interview.id
            )
            .first()
        )

        if not result:
            result = generate_interview_result(
                interview_id=interview.id,
                user_id=user_id,
                db=db,
            )

        return {
            "interview": interview,
            "result": result,
            "completed": True,
        }

    (
        interview,
        interviewer_message,
        persona_message,
    ) = generate_interview_turn(
        interview_id=interview_id,
        user_id=user_id,
        db=db,
    )

    if interview.status == "Completed":

        result = generate_interview_result(
            interview_id=interview.id,
            user_id=user_id,
            db=db,
        )

        return {
            "interview": interview,
            "interviewer_message": interviewer_message,
            "persona_message": persona_message,
            "result": result,
            "completed": True,
        }

    evaluation = evaluate_interview(
        interview_id=interview.id,
        user_id=user_id,
        db=db,
    )

    if not evaluation.continue_interview:

        interview = complete_interview(
            interview_id=interview.id,
            user_id=user_id,
            db=db,
        )

        result = generate_interview_result(
            interview_id=interview.id,
            user_id=user_id,
            db=db,
        )

        return {
            "interview": interview,
            "interviewer_message": interviewer_message,
            "persona_message": persona_message,
            "evaluation": evaluation,
            "result": result,
            "completed": True,
        }

    return {
        "interview": interview,
        "interviewer_message": interviewer_message,
        "persona_message": persona_message,
        "evaluation": evaluation,
        "completed": False,
    }