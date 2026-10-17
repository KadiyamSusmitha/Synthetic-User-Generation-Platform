from app.schemas.synthetic_response import GeneratedSyntheticAnswer
from app.services.synthetic_response_validator import (
    SyntheticResponseValidationError,
    validate_synthetic_answer,
)


def test_valid_cases():
    valid_cases = [
        ("single_choice", "  Good  ", ["OK", "Good", "Happy"]),
        (
            "multiple_choice",
            [" Dashboard ", "Reports "],
            ["Dashboard", "Transactions", "Reports"],
        ),
        ("rating", 4, []),
        ("yes_no", " Yes ", []),
        ("likert", " Happy ", ["Happy", "Not Happy"]),
        ("short_text", "  I like the product.  ", []),
        ("long_text", "  The product was useful.  ", []),
    ]

    print("=== VALID CASES ===")

    for question_type, answer, options in valid_cases:
        result = validate_synthetic_answer(
            GeneratedSyntheticAnswer(answer=answer),
            question_type,
            options,
        )

        print(
            f"{question_type}: "
            f"{answer!r} -> {result.answer!r}"
        )


def test_invalid_cases():
    invalid_cases = [
        ("single_choice", "Invalid", ["OK", "Good", "Happy"]),
        (
            "multiple_choice",
            ["Dashboard", "Invalid"],
            ["Dashboard", "Reports"],
        ),
        ("rating", 6, []),
        ("yes_no", "Maybe", []),
        ("likert", "Unknown", ["Happy", "Not Happy"]),
        ("short_text", "   ", []),
        ("long_text", "   ", []),
    ]

    print()
    print("=== INVALID CASES ===")

    for question_type, answer, options in invalid_cases:
        try:
            validate_synthetic_answer(
                GeneratedSyntheticAnswer(answer=answer),
                question_type,
                options,
            )

            print(
                f"{question_type}: ERROR - invalid answer accepted"
            )

        except SyntheticResponseValidationError as error:
            print(
                f"{question_type}: REJECTED - {error}"
            )


if __name__ == "__main__":
    test_valid_cases()
    test_invalid_cases()