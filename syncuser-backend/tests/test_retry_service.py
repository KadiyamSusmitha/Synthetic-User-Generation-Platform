import pytest

from app.services.ai_exceptions import AIServiceError
from app.services.retry_service import (
    execute_with_retry,
    is_retryable_ai_error,
)


def test_retryable_error_is_retried():
    attempts = []

    def retryable_operation():
        attempts.append(1)

        if len(attempts) <= 2:
            raise AIServiceError(
                "Temporary AI failure",
                status_code=503,
            )

        return "SUCCESS"

    result = execute_with_retry(
        retryable_operation,
        max_retries=2,
        base_delay=0,
    )

    assert result == "SUCCESS"
    assert len(attempts) == 3


def test_non_retryable_error_is_not_retried():
    attempts = []

    def non_retryable_operation():
        attempts.append(1)

        raise AIServiceError(
            "Invalid AI request",
            status_code=400,
        )

    with pytest.raises(AIServiceError) as error_info:
        execute_with_retry(
            non_retryable_operation,
            max_retries=2,
            base_delay=0,
        )

    error = error_info.value

    assert error.status_code == 400
    assert len(attempts) == 1


def test_retryable_error_is_exhausted():
    attempts = []

    def always_failing_operation():
        attempts.append(1)

        raise AIServiceError(
            "AI service unavailable",
            status_code=503,
        )

    with pytest.raises(AIServiceError) as error_info:
        execute_with_retry(
            always_failing_operation,
            max_retries=2,
            base_delay=0,
        )

    error = error_info.value

    assert error.status_code == 503
    assert len(attempts) == 3


def test_retry_error_classification():
    retryable_429 = AIServiceError(
        "Rate limited",
        status_code=429,
    )

    retryable_503 = AIServiceError(
        "Service unavailable",
        status_code=503,
    )

    non_retryable_400 = AIServiceError(
        "Bad request",
        status_code=400,
    )

    non_retryable_500 = AIServiceError(
        "Configuration error",
        status_code=500,
    )

    assert is_retryable_ai_error(retryable_429) is True
    assert is_retryable_ai_error(retryable_503) is True
    assert is_retryable_ai_error(non_retryable_400) is False
    assert is_retryable_ai_error(non_retryable_500) is False