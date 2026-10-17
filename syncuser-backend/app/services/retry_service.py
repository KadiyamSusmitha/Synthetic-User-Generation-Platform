import time
from collections.abc import Callable
from typing import TypeVar
from app.services.ai_exceptions import AIServiceError


T = TypeVar("T")


# Maximum number of additional attempts after the first attempt.
MAX_RETRIES = 2

# Initial delay before the first retry.
BASE_DELAY_SECONDS = 1


def is_retryable_ai_error(error: AIServiceError) -> bool:
    """
    Determine whether an AI service error should be retried.

    Retry only transient AI service failures.
    """

    return error.status_code in {
        429,
        503,
    }


def execute_with_retry(
    operation: Callable[[], T],
    max_retries: int = MAX_RETRIES,
    base_delay: float = BASE_DELAY_SECONDS,
) -> T:
    """
    Execute an AI operation with limited exponential backoff.

    The operation is retried only for retryable AI errors.

    Example retry delays:

        Attempt 1 -> failure
        wait 1 second

        Attempt 2 -> failure
        wait 2 seconds

        Attempt 3 -> failure
        raise error
    """

    attempt = 0

    while True:
        try:
            return operation()

        except AIServiceError as error:
            if not is_retryable_ai_error(error):
                raise

            if attempt >= max_retries:
                raise

            delay = base_delay * (2 ** attempt)

            print(
                "Retryable AI error received. "
                f"Retrying in {delay} seconds..."
            )

            time.sleep(delay)

            attempt += 1