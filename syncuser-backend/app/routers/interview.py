from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.interview import Interview
from app.models.interview_note import InterviewNote
from app.models.interview_result import InterviewResult
from app.models.user import User
from app.schemas.interview import (
    CompleteInterviewResponse,
    InterviewConversationResponse,
    InterviewCreate,
    InterviewMessageResponse,
    InterviewNoteCreate,
    InterviewNoteResponse,
    InterviewResponse,
    InterviewResultResponse,
)
from app.services.ai_exceptions import AIServiceError
from app.services.interview_service import (
    complete_interview,
    delete_interview,
    generate_interview_follow_up,
    generate_interview_result,
    generate_interview_turn,
    get_interview_messages,
    get_user_interview_with_context,
    run_interview_cycle,
    save_interview,
)
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/interviews",
    tags=["Interviews"],
)


# =========================================================
# Helper
# =========================================================

def handle_service_error(error: Exception):
    if isinstance(error, AIServiceError):
        raise HTTPException(
            status_code=error.status_code,
            detail=str(error),
        )

    if isinstance(error, ValueError):
        message = str(error)

        if "not found" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred while processing the interview.",
    )


# =========================================================
# Start Interview
# =========================================================

@router.post(
    "/",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.experiment import Experiment
    from app.models.persona import Persona

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == data.experiment_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found.",
        )

    persona = (
        db.query(Persona)
        .filter(
            Persona.id == data.persona_id,
            Persona.experiment_id == data.experiment_id,
        )
        .first()
    )

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona does not belong to the selected experiment.",
        )

    interview = Interview(
        user_id=current_user.id,
        experiment_id=data.experiment_id,
        persona_id=data.persona_id,
        status="In Progress",
        total_questions=0,
        questions_explored=0,
        follow_up_questions=0,
        is_saved=False,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return interview


# =========================================================
# Get All Interviews
# =========================================================

@router.get(
    "/",
    response_model=list[InterviewResponse],
)
def get_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == current_user.id,
        )
        .order_by(
            Interview.created_at.desc()
        )
        .all()
    )

    return interviews


# =========================================================
# Get Interview Conversation
# =========================================================

@router.get(
    "/{interview_id}",
    response_model=InterviewConversationResponse,
)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview, experiment, persona = get_user_interview_with_context(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        messages = get_interview_messages(
            interview_id=interview.id,
            db=db,
        )

        return {
            "interview": interview,
            "messages": messages,
        }

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Get Interview Messages
# =========================================================

@router.get(
    "/{interview_id}/messages",
    response_model=list[InterviewMessageResponse],
)
def get_messages(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        get_user_interview_with_context(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        return get_interview_messages(
            interview_id=interview_id,
            db=db,
        )

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Generate First / Next AI Interview Turn
# =========================================================

@router.post(
    "/{interview_id}/turn",
    response_model=InterviewConversationResponse,
)
def generate_turn(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview, interviewer_message, persona_message = generate_interview_turn(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
            force_follow_up=False,
        )

        messages = get_interview_messages(
            interview_id=interview.id,
            db=db,
        )

        return {
            "interview": interview,
            "messages": messages,
        }

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Generate Explicit AI Follow-up
# =========================================================

@router.post(
    "/{interview_id}/follow-up",
    response_model=InterviewConversationResponse,
)
def generate_follow_up(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview, interviewer_message, persona_message = generate_interview_follow_up(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        messages = get_interview_messages(
            interview_id=interview.id,
            db=db,
        )

        return {
            "interview": interview,
            "messages": messages,
        }

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Run One AI Interview Cycle
# =========================================================

@router.post(
    "/{interview_id}/cycle",
)
def interview_cycle(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = run_interview_cycle(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        return result

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Complete Interview
# =========================================================

@router.post(
    "/{interview_id}/complete",
    response_model=CompleteInterviewResponse,
)
def finish_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview = complete_interview(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        result = generate_interview_result(
            interview_id=interview.id,
            user_id=current_user.id,
            db=db,
        )

        return {
            "interview": interview,
            "result": result,
        }

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Save Interview
# =========================================================

@router.post(
    "/{interview_id}/save",
    response_model=InterviewResponse,
)
def save_completed_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview = save_interview(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        return interview

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Delete Interview
# =========================================================

@router.delete(
    "/{interview_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_completed_or_in_progress_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        delete_interview(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        return None

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Get Interview Result
# =========================================================

@router.get(
    "/{interview_id}/result",
    response_model=InterviewResultResponse,
)
def get_interview_result(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview, experiment, persona = get_user_interview_with_context(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        result = (
            db.query(InterviewResult)
            .filter(
                InterviewResult.interview_id == interview.id,
            )
            .first()
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview result is not available yet.",
            )

        return result

    except HTTPException:
        raise

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Add Interview Note
# =========================================================

@router.post(
    "/{interview_id}/notes",
    response_model=InterviewNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_note(
    interview_id: int,
    data: InterviewNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview, experiment, persona = get_user_interview_with_context(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        note_text = data.note.strip()

        if not note_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note cannot be empty.",
            )

        note = InterviewNote(
            interview_id=interview.id,
            note=note_text,
        )

        db.add(note)
        db.commit()
        db.refresh(note)

        return note

    except HTTPException:
        raise

    except Exception as error:
        handle_service_error(error)


# =========================================================
# Get Interview Notes
# =========================================================

@router.get(
    "/{interview_id}/notes",
    response_model=list[InterviewNoteResponse],
)
def get_notes(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        interview, experiment, persona = get_user_interview_with_context(
            interview_id=interview_id,
            user_id=current_user.id,
            db=db,
        )

        notes = (
            db.query(InterviewNote)
            .filter(
                InterviewNote.interview_id == interview.id
            )
            .order_by(
                InterviewNote.created_at.asc()
            )
            .all()
        )

        return notes

    except Exception as error:
        handle_service_error(error)