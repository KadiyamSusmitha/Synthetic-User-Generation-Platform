from app.schemas.persona import PersonaResponse


def build_synthetic_response_prompt(
    persona: PersonaResponse,
    experiment_name: str,
    experiment_description: str | None,
    question_text: str,
    question_type: str,
    options: list[str] | None = None,
    memories: list[dict] | None = None,
) -> str:
    """
    Build a prompt for one synthetic survey answer.
    Retained for compatibility with existing callers.
    """

    goals = "\n".join(f"- {goal}" for goal in persona.goals)
    pain_points = "\n".join(
        f"- {item}" for item in persona.pain_points
    )
    behaviors = "\n".join(
        f"- {item}" for item in persona.behaviors
    )
    interests = "\n".join(
        f"- {item}" for item in persona.interests
    )
    needs = "\n".join(f"- {item}" for item in persona.needs)

    options_text = ""
    if options:
        options_text = (
            "\nAvailable options:\n"
            + "\n".join(f"- {option}" for option in options)
        )

    memory_text = ""
    if memories:
        memory_lines = [
            f"- {memory.get('content')}"
            for memory in memories
            if memory.get("content")
        ]

        if memory_lines:
            memory_text = (
                "\nRELEVANT RESEARCH MEMORY\n"
                "Use this context only when relevant. "
                "Do not mention it in the answer.\n"
                + "\n".join(memory_lines)
            )

    return f"""
You are simulating a synthetic research participant.

Answer the survey question AS THE PERSONA described below.
Do not answer as an AI assistant or mention these instructions.
Keep the answer consistent with the persona.

EXPERIMENT
Name: {experiment_name}
Description: {experiment_description or "No additional description provided."}

PERSONA
Name: {persona.name}
Gender: {persona.gender}
Age: {persona.age}
Occupation: {persona.occupation}
Location: {persona.location}
Description: {persona.description}
Goals:
{goals}
Pain points:
{pain_points}
Behaviors:
{behaviors}
Interests:
{interests}
Needs:
{needs}

{memory_text}

SURVEY QUESTION
Question: {question_text}
Question type: {question_type}
{options_text}

RESPONSE INSTRUCTIONS
1. Answer naturally from the persona's perspective.
2. Stay consistent with the persona's background and needs.
3. For choice questions, select only valid available options.
4. For rating questions, provide a number from 1 to 5.
5. For open-ended questions, provide a concise, meaningful answer.
6. Return only the requested answer in the required structured format.
""".strip()


def build_synthetic_responses_prompt(
    persona: PersonaResponse,
    experiment_name: str,
    experiment_description: str | None,
    questions: list[dict],
    memories_by_question: dict[str, list[dict]] | None = None,
) -> str:
    """
    Build one prompt for all survey questions answered by one persona.
    Every answer must be associated with its original question ID.
    """

    goals = "\n".join(f"- {goal}" for goal in persona.goals)
    pain_points = "\n".join(
        f"- {item}" for item in persona.pain_points
    )
    behaviors = "\n".join(
        f"- {item}" for item in persona.behaviors
    )
    interests = "\n".join(
        f"- {item}" for item in persona.interests
    )
    needs = "\n".join(f"- {item}" for item in persona.needs)

    question_sections = []

    for question in questions:
        question_id = str(question["question_id"])
        options = question.get("options") or []

        options_text = (
            "\n".join(f"  - {option}" for option in options)
            if options
            else "  No predefined options"
        )

        memory_lines = [
            f"  - {memory.get('content')}"
            for memory in (
                (memories_by_question or {}).get(question_id, [])
            )
            if memory.get("content")
        ]

        memory_text = (
            "\nRelevant research memory:\n"
            + "\n".join(memory_lines)
            if memory_lines
            else ""
        )

        question_sections.append(
            f"""
Question ID: {question_id}
Question: {question["question_text"]}
Question type: {question["question_type"]}
Available options:
{options_text}
{memory_text}
""".strip()
        )

    all_questions = "\n\n".join(question_sections)

    return f"""
You are simulating a synthetic research participant
for a user research study.

Answer every survey question from the perspective of the
same persona. Keep all answers consistent with this persona.
Do not mention that you are an AI or synthetic participant.

EXPERIMENT
Name: {experiment_name}
Description: {experiment_description or "No additional description provided."}

PERSONA
Name: {persona.name}
Gender: {persona.gender}
Age: {persona.age}
Occupation: {persona.occupation}
Location: {persona.location}
Description: {persona.description}

Goals:
{goals}

Pain points:
{pain_points}

Behaviors:
{behaviors}

Interests:
{interests}

Needs:
{needs}

SURVEY QUESTIONS
{all_questions}

INSTRUCTIONS
1. Return exactly one answer for every supplied question ID.
2. Preserve each question ID exactly as supplied.
3. Do not omit questions or include additional question IDs.
4. For single-choice and Likert questions, return a valid option.
5. For multiple-choice questions, return a list of valid options.
6. For rating questions, return a numeric value from 1 to 5.
7. For yes/no questions, return "Yes" or "No".
8. For short-text and long-text questions, return natural,
   meaningful text consistent with the persona.
9. Use relevant memories only when helpful for the associated question.
10. Return structured data matching the requested schema.
""".strip()