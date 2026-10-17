from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.schemas.survey import (
    SurveyCreate,
    SurveyResponse,
    SurveyUpdate,
)

from app.schemas.survey_question import (
    SurveyQuestionCreate,
    SurveyQuestionResponse,
    SurveyQuestionUpdate,
)

from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/surveys",
    tags=["Surveys"],
)


def current_utc_time():
    """
    Return current UTC time as a timezone-naive datetime.

    The database currently uses SQLAlchemy DateTime columns
    without timezone=True, so we remove the timezone information
    after getting the current UTC time.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ============================================================
# CREATE SURVEY
# ============================================================

@router.post(
    "",
    response_model=SurveyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_survey(
    survey_data: SurveyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = Survey(
        user_id=current_user.id,
        experiment_id=survey_data.experiment_id,
        title=survey_data.title.strip(),
        status="Draft",
    )

    db.add(survey)
    db.commit()
    db.refresh(survey)

    return survey


# ============================================================
# GET ALL SURVEYS
# ============================================================

@router.get(
    "",
    response_model=list[SurveyResponse],
)
def get_surveys(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    surveys = (
        db.query(Survey)
        .filter(Survey.user_id == current_user.id)
        .order_by(Survey.id.desc())
        .all()
    )

    return surveys


# ============================================================
# MARK SURVEY AS READY
# ============================================================

@router.patch(
    "/{survey_id}/ready",
    response_model=SurveyResponse,
)
def mark_survey_ready(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    if survey.status == "Ready":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Survey is already ready.",
        )

    question_count = (
        db.query(SurveyQuestion)
        .filter(
            SurveyQuestion.survey_id == survey_id
        )
        .count()
    )

    if question_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add at least one question before marking the survey as ready.",
        )

    survey.status = "Ready"

    # Update the survey modification timestamp.
    survey.updated_at = current_utc_time()

    db.commit()
    db.refresh(survey)

    return survey


# ============================================================
# GET SINGLE SURVEY - AUTHENTICATED OWNER
# ============================================================

@router.get(
    "/{survey_id}",
    response_model=SurveyResponse,
)
def get_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    return survey


# ============================================================
# UPDATE SURVEY
# ============================================================

@router.patch(
    "/{survey_id}",
    response_model=SurveyResponse,
)
def update_survey(
    survey_id: int,
    survey_data: SurveyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    if survey_data.title is not None:
        survey.title = survey_data.title.strip()

    # Always update the timestamp when the survey is saved.
    survey.updated_at = current_utc_time()

    db.commit()
    db.refresh(survey)

    return survey


# ============================================================
# DELETE SURVEY
# ============================================================

@router.delete(
    "/{survey_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    db.delete(survey)
    db.commit()

    return None


# ============================================================
# GET SURVEY QUESTIONS - AUTHENTICATED OWNER
# ============================================================

@router.get(
    "/{survey_id}/questions",
    response_model=list[SurveyQuestionResponse],
)
def get_survey_questions(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    questions = (
        db.query(SurveyQuestion)
        .filter(
            SurveyQuestion.survey_id == survey_id,
        )
        .order_by(
            SurveyQuestion.display_order.asc(),
            SurveyQuestion.id.asc(),
        )
        .all()
    )

    return questions


# ============================================================
# CREATE SURVEY QUESTION
# ============================================================

@router.post(
    "/{survey_id}/questions",
    response_model=SurveyQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_survey_question(
    survey_id: int,
    question_data: SurveyQuestionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    if question_data.display_order is None:
        last_question = (
            db.query(SurveyQuestion)
            .filter(
                SurveyQuestion.survey_id == survey_id,
            )
            .order_by(
                SurveyQuestion.display_order.desc(),
            )
            .first()
        )

        display_order = (
            last_question.display_order + 1
            if last_question
            else 0
        )
    else:
        display_order = question_data.display_order

    question = SurveyQuestion(
        survey_id=survey_id,
        question=question_data.question.strip(),
        question_type=question_data.question_type,
        options=[
            option.strip()
            for option in question_data.options
            if option.strip()
        ],
        required=question_data.required,
        display_order=display_order,
    )

    db.add(question)

    # A question was added, so the parent survey was modified.
    survey.updated_at = current_utc_time()

    db.commit()
    db.refresh(question)

    return question


# ============================================================
# UPDATE SURVEY QUESTION
# ============================================================

@router.patch(
    "/{survey_id}/questions/{question_id}",
    response_model=SurveyQuestionResponse,
)
def update_survey_question(
    survey_id: int,
    question_id: int,
    question_data: SurveyQuestionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    question = (
        db.query(SurveyQuestion)
        .filter(
            SurveyQuestion.id == question_id,
            SurveyQuestion.survey_id == survey_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey question not found",
        )

    if question_data.question is not None:
        question.question = question_data.question.strip()

    if question_data.question_type is not None:
        question.question_type = question_data.question_type

    if question_data.options is not None:
        question.options = [
            option.strip()
            for option in question_data.options
            if option.strip()
        ]

    if question_data.required is not None:
        question.required = question_data.required

    if question_data.display_order is not None:
        question.display_order = question_data.display_order

    # A question was modified, so update the parent survey timestamp.
    survey.updated_at = current_utc_time()

    db.commit()
    db.refresh(question)

    return question


# ============================================================
# DELETE SURVEY QUESTION
# ============================================================

@router.delete(
    "/{survey_id}/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_survey_question(
    survey_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    question = (
        db.query(SurveyQuestion)
        .filter(
            SurveyQuestion.id == question_id,
            SurveyQuestion.survey_id == survey_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey question not found",
        )

    db.delete(question)

    # A question was deleted, so update the parent survey timestamp.
    survey.updated_at = current_utc_time()

    db.commit()

    return None