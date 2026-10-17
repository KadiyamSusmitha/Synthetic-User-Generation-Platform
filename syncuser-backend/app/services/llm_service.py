from google import genai
from google.genai.errors import ClientError, ServerError
from pydantic import ValidationError

from app.schemas.persona import GeneratedPersonas
from app.schemas.synthetic_response import GeneratedSyntheticAnswer
from app.schemas.synthetic_response import GeneratedSyntheticAnswers
from app.core.config import settings
from app.services.retry_service import execute_with_retry
from app.services.ai_exceptions import AIServiceError
from app.schemas.sentiment import SentimentClassification
from app.schemas.sentiment import BatchSentimentClassification
from app.schemas.themes import ThemeClassification
from app.schemas.insights import InsightClassification
from app.schemas.interview_ai import (
    InterviewAnalysisOutput,
    InterviewEvaluationOutput,
    InterviewTurnOutput,
)

if not settings.GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )


client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
)


def generate_llm_response(prompt: str) -> str:
    """
    Generate a normal text response from Gemini.
    """

    try:
        interaction = client.interactions.create(
            model=settings.GEMINI_MODEL,
            input=prompt,
        )

    except ClientError as error:
        print(
            "Gemini client error:",
            f"code={error.code}, "
            f"status={error.status}, "
            f"message={error.message}",
        )

        if error.code == 429:
            raise AIServiceError(
                "AI service is temporarily busy. "
                "Please try again later.",
                status_code=429,
            ) from error

        if error.code == 401:
            raise AIServiceError(
                "AI service configuration is invalid.",
                status_code=500,
            ) from error

        if error.code == 403:
            raise AIServiceError(
                "AI service configuration does not have access.",
                status_code=500,
            ) from error

        if error.code == 400:
            raise AIServiceError(
                "AI request could not be processed.",
                status_code=502,
            ) from error

        raise AIServiceError(
            "AI service could not process the request.",
            status_code=502,
        ) from error

    except ServerError as error:
        print(
            "Gemini server error:",
            f"code={error.code}, "
            f"status={error.status}, "
            f"message={error.message}",
        )

        raise AIServiceError(
            "AI service is temporarily unavailable. "
            "Please try again later.",
            status_code=503,
        ) from error

    except Exception as error:
        print(
            "Unexpected Gemini error:",
            error,
        )

        raise AIServiceError(
            "Failed to connect to the AI service. "
            "Please try again.",
            status_code=502,
        ) from error

    return interaction.output_text


def generate_structured_personas(
    prompt: str,
) -> GeneratedPersonas:
    """
    Generate structured persona data from Gemini
    and validate it using the GeneratedPersonas schema.
    """

    try:
        interaction = client.interactions.create(
            model=settings.GEMINI_MODEL,
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": GeneratedPersonas.model_json_schema(),
            },
        )

    except ClientError as error:
        print(
            "Gemini client error:",
            f"code={error.code}, "
            f"status={error.status}, "
            f"message={error.message}",
        )

        if error.code == 429:
            raise AIServiceError(
                "AI service is temporarily busy. "
                "Please try again later.",
                status_code=429,
            ) from error

        if error.code == 401:
            raise AIServiceError(
                "AI service configuration is invalid.",
                status_code=500,
            ) from error

        if error.code == 403:
            raise AIServiceError(
                "AI service configuration does not have access.",
                status_code=500,
            ) from error

        if error.code == 400:
            raise AIServiceError(
                "AI request could not be processed.",
                status_code=502,
            ) from error

        raise AIServiceError(
            "AI service could not process the request.",
            status_code=502,
        ) from error

    except ServerError as error:
        print(
            "Gemini server error:",
            f"code={error.code}, "
            f"status={error.status}, "
            f"message={error.message}",
        )

        raise AIServiceError(
            "AI service is temporarily unavailable. "
            "Please try again later.",
            status_code=503,
        ) from error

    except Exception as error:
        print(
            "Unexpected Gemini error:",
            error,
        )

        raise AIServiceError(
            "Failed to connect to the AI service. "
            "Please try again.",
            status_code=502,
        ) from error

    try:
        return GeneratedPersonas.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid persona response. "
            "Please try again.",
            status_code=502,
        ) from error


def generate_structured_synthetic_answer(
    prompt: str,
) -> GeneratedSyntheticAnswer:
    """
    Generate a structured synthetic survey answer from Gemini
    and validate it using the GeneratedSyntheticAnswer schema.

    Transient AI errors such as 429 and 503 are retried
    using limited exponential backoff.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": GeneratedSyntheticAnswer.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the request.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini error:",
                error,
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return GeneratedSyntheticAnswer.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid synthetic response. "
            "Please try again.",
            status_code=502,
        ) from error


def generate_structured_sentiment(
    prompt: str,
) -> SentimentClassification:
    """
    Classify response content into positive, neutral, or negative
    sentiment using Gemini structured output.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": SentimentClassification.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the request.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini error:",
                error,
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return SentimentClassification.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured sentiment output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid sentiment response. "
            "Please try again.",
            status_code=502,
        ) from error


def generate_batch_sentiment(
    prompt: str,
) -> BatchSentimentClassification:
    """
    Generate structured sentiment classifications for multiple
    synthetic responses from Gemini in one request.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": (
                        BatchSentimentClassification
                        .model_json_schema()
                    ),
                },
            )

        except ClientError as error:
            if error.code == 429:
                raise AIServiceError(
                    "AI service rate limit exceeded.",
                    status_code=429,
                ) from error

            if error.code in {401, 403}:
                raise AIServiceError(
                    "AI service authentication failed.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "Invalid request sent to the AI service.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service request failed.",
                status_code=502,
            ) from error

        except ServerError as error:
            raise AIServiceError(
                "AI service is temporarily unavailable.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                f"Unexpected Gemini error: {error}"
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return BatchSentimentClassification.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        raise AIServiceError(
            "AI service returned invalid sentiment data.",
            status_code=502,
        ) from error


def generate_structured_themes(
    prompt: str,
) -> ThemeClassification:
    """
    Generate structured research themes from Gemini
    and validate them using the ThemeClassification schema.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": ThemeClassification.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the request.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini theme analysis error:",
                repr(error),
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return ThemeClassification.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured theme output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid theme response. "
            "Please try again.",
            status_code=502,
        ) from error

def generate_structured_insights(
    prompt: str,
) -> InsightClassification:
    """
    Generate structured research insights from Gemini
    and validate them using the InsightClassification schema.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": InsightClassification.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the request.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini insight analysis error:",
                repr(error),
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return InsightClassification.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured insight output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid insight response. "
            "Please try again.",
            status_code=502,
        ) from error

# =========================================================
# Interview AI
# =========================================================

def generate_structured_interview_turn(
    prompt: str,
) -> InterviewTurnOutput:
    """
    Generate one complete AI interview turn.

    The output contains:
    - AI interviewer question
    - AI persona answer
    - question type
    - follow-up information
    - completion information
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": InterviewTurnOutput.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini interview client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the interview request.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini interview server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini interview error:",
                repr(error),
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return InterviewTurnOutput.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured interview output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid interview response. "
            "Please try again.",
            status_code=502,
        ) from error


def generate_structured_interview_evaluation(
    prompt: str,
) -> InterviewEvaluationOutput:
    """
    Evaluate the current interview and determine whether:
    - a follow-up is needed,
    - another primary question is needed,
    - or the interview should finish.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": InterviewEvaluationOutput.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini interview evaluation client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the interview evaluation.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini interview evaluation server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini interview evaluation error:",
                repr(error),
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return InterviewEvaluationOutput.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid interview evaluation output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid interview evaluation. "
            "Please try again.",
            status_code=502,
        ) from error


def generate_structured_interview_analysis(
    prompt: str,
) -> InterviewAnalysisOutput:
    """
    Analyze the completed interview and generate:
    - score
    - summary
    - key insights
    - pain points
    - needs
    - motivations
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": InterviewAnalysisOutput.model_json_schema(),
                },
            )

        except ClientError as error:
            print(
                "Gemini interview analysis client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service could not process the interview analysis.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini interview analysis server error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini interview analysis error:",
                repr(error),
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(
        generate_interaction
    )

    try:
        return InterviewAnalysisOutput.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid interview analysis output:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid interview analysis. "
            "Please try again.",
            status_code=502,
        ) from error

def generate_structured_synthetic_answers(
    prompt: str,
) -> GeneratedSyntheticAnswers:
    """
    Generate structured answers for multiple survey questions
    in one Gemini request and validate the returned schema.
    """

    def generate_interaction():
        try:
            return client.interactions.create(
                model=settings.GEMINI_MODEL,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": (
                        GeneratedSyntheticAnswers.model_json_schema()
                    ),
                },
            )

        except ClientError as error:
            print(
                "Gemini batch synthetic-response client error:",
                f"code={error.code}, "
                f"status={error.status}, "
                f"message={error.message}",
            )

            if error.code == 429:
                raise AIServiceError(
                    "AI service is temporarily busy. "
                    "Please try again later.",
                    status_code=429,
                ) from error

            if error.code == 401:
                raise AIServiceError(
                    "AI service configuration is invalid.",
                    status_code=500,
                ) from error

            if error.code == 403:
                raise AIServiceError(
                    "AI service configuration does not have access.",
                    status_code=500,
                ) from error

            if error.code == 400:
                raise AIServiceError(
                    "AI request could not be processed.",
                    status_code=502,
                ) from error

            raise AIServiceError(
                "AI service request failed.",
                status_code=502,
            ) from error

        except ServerError as error:
            print(
                "Gemini batch synthetic-response server error:",
                repr(error),
            )

            raise AIServiceError(
                "AI service is temporarily unavailable. "
                "Please try again later.",
                status_code=503,
            ) from error

        except Exception as error:
            print(
                "Unexpected Gemini batch synthetic-response error:",
                repr(error),
            )

            raise AIServiceError(
                "Failed to connect to the AI service. "
                "Please try again.",
                status_code=502,
            ) from error

    interaction = execute_with_retry(generate_interaction)

    try:
        return GeneratedSyntheticAnswers.model_validate_json(
            interaction.output_text
        )

    except ValidationError as error:
        print(
            "Gemini returned invalid structured synthetic answers:",
            error,
        )

        raise AIServiceError(
            "AI generated an invalid synthetic-response batch. "
            "Please try again.",
            status_code=502,
        ) from error