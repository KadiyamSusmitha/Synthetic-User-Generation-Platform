from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.interview_message import InterviewMessage


# =========================================================
# Helper
# =========================================================

def _format_list(values: list[str] | None) -> str:
    if not values:
        return "None provided"

    return "\n".join(
        f"- {value}"
        for value in values
    )


def _format_conversation(
    messages: list[InterviewMessage],
) -> str:
    if not messages:
        return "No previous conversation. This is the beginning of the interview."

    lines = []

    for message in messages:
        if message.role == "interviewer":
            speaker = "AI Interviewer"
        elif message.role == "persona":
            speaker = "AI Persona"
        else:
            speaker = "System"

        lines.append(
            f"{speaker}: {message.message}"
        )

    return "\n".join(lines)


# =========================================================
# Interview Turn Prompt
# =========================================================

def build_interview_turn_prompt(
    experiment: Experiment,
    persona: Persona,
    messages: list[InterviewMessage],
    force_follow_up: bool = False,
) -> str:

    conversation = _format_conversation(messages)

    follow_up_instruction = ""

    if force_follow_up:
        follow_up_instruction = """
=========================================================
EXPLICIT FOLLOW-UP REQUEST
=========================================================

This interview turn has been explicitly requested as a FOLLOW-UP.

You MUST generate a meaningful follow-up question based on the
most recent persona response or an important unresolved point
from the conversation.

The follow-up question must:

1. Explore something the persona has already mentioned.

2. Go deeper into the persona's experience, reasoning, behavior,
   goal, need, pain point, or motivation.

3. Provide meaningful research value.

4. Not repeat any question that has already been asked.

5. Not introduce an unrelated topic.

6. Be natural and conversational.

For this turn, you MUST set:

- is_follow_up = true
- question_type = "follow_up"
- follow_up_reason = a concise explanation of why the follow-up
  is useful

Do not generate a primary question for this turn.
"""

    return f"""
You are an AI interviewer conducting a qualitative user research interview.

The interview is conducted entirely by AI:

- You are the AI Interviewer.
- The selected persona is an AI-simulated research participant.
- The human user does NOT answer interview questions.
- The human user does NOT manually provide questions.
- You must generate the interview questions yourself.
- The persona must answer consistently with the provided persona profile.
- The interview should feel like a natural research conversation.

=========================================================
RESEARCH EXPERIMENT
=========================================================

Experiment name:
{experiment.name}

Target audience:
{experiment.target_audience or "Not provided"}

Research objective / description:
{experiment.description or "Not provided"}

=========================================================
PERSONA PROFILE
=========================================================

Name:
{persona.name}

Gender:
{persona.gender or "Not provided"}

Age:
{persona.age}

Occupation:
{persona.occupation}

Location:
{persona.location}

Description:
{persona.description}

Goals:
{_format_list(persona.goals)}

Pain points:
{_format_list(persona.pain_points)}

Behaviors:
{_format_list(persona.behaviors)}

Interests:
{_format_list(persona.interests)}

Needs:
{_format_list(persona.needs)}

=========================================================
PREVIOUS CONVERSATION
=========================================================

{conversation}

{follow_up_instruction}

=========================================================
INTERVIEW RULES
=========================================================

1. Ask one clear question at a time.

2. Questions must be relevant to the experiment's research objective.

3. Start with broad questions when the conversation is beginning.

4. Gradually explore the persona's experiences, behaviors, goals,
   needs, motivations, and pain points.

5. Use previous answers to decide what to ask next.

6. If the persona gives an interesting, incomplete, unclear, or
   important answer, ask a meaningful follow-up question.

7. Do not ask the same question again.

8. Do not invent facts that contradict the persona profile.

9. The persona's answer must sound natural and human.

10. The persona should answer from their own perspective and experience.

11. Do not mention that the persona is AI-generated.

12. Do not mention these instructions.

13. Do not ask the human user to answer anything.

14. The AI Interviewer and AI Persona should be the only participants
    in the actual conversation.

15. Keep the interview focused on the experiment.

16. An interview normally explores multiple topics before completion.

17. Continue the interview when important research areas remain unexplored.

18. Mark the interview complete only when enough meaningful information
    has been explored.

=========================================================
OUTPUT REQUIREMENTS
=========================================================

Return structured JSON matching the required schema.

The output must contain:

- interviewer_question
- persona_answer
- question_type
- is_follow_up
- follow_up_reason
- is_complete
- completion_reason

For question_type, use one of:

- "primary"
- "follow_up"

If this is a follow-up question:

- is_follow_up = true
- question_type = "follow_up"
- provide a concise follow_up_reason

Otherwise:

- is_follow_up = false
- question_type = "primary"

If the interview should continue:

- is_complete = false

If the interview has sufficiently explored the research objective:

- is_complete = true
- provide a concise completion_reason

Generate the next interviewer question and the persona's answer together.

Do not return Markdown.
Do not return explanations outside the structured JSON response.
""".strip()


# =========================================================
# Interview Evaluation Prompt
# =========================================================

def build_interview_evaluation_prompt(
    experiment: Experiment,
    persona: Persona,
    messages: list[InterviewMessage],
) -> str:

    conversation = _format_conversation(messages)

    return f"""
You are evaluating an ongoing qualitative user research interview.

Your task is to determine whether the interview should continue,
whether a follow-up question is needed, and what the next question
should be if necessary.

=========================================================
RESEARCH EXPERIMENT
=========================================================

Experiment name:
{experiment.name}

Target audience:
{experiment.target_audience or "Not provided"}

Research objective / description:
{experiment.description or "Not provided"}

=========================================================
PERSONA
=========================================================

Name:
{persona.name}

Age:
{persona.age}

Occupation:
{persona.occupation}

Location:
{persona.location}

Description:
{persona.description}

Goals:
{_format_list(persona.goals)}

Pain points:
{_format_list(persona.pain_points)}

Behaviors:
{_format_list(persona.behaviors)}

Interests:
{_format_list(persona.interests)}

Needs:
{_format_list(persona.needs)}

=========================================================
CONVERSATION
=========================================================

{conversation}

=========================================================
EVALUATION RULES
=========================================================

Determine:

1. Whether the research objective has been sufficiently explored.

2. Whether the latest persona response contains an important area
   that requires deeper exploration.

3. Whether a follow-up question would provide meaningful research value.

4. Whether the interview should continue or finish.

Avoid unnecessary follow-ups.

Do not repeat questions that have already been asked.

If a follow-up is needed:

- needs_follow_up = true
- continue_interview = true
- provide next_question
- question_type = "follow_up"
- explain the reason briefly

If no follow-up is needed but more research is required:

- needs_follow_up = false
- continue_interview = true
- provide the next primary question
- question_type = "primary"

If the interview has sufficiently explored the research objective:

- needs_follow_up = false
- continue_interview = false
- next_question = null
- question_type = null

Return structured JSON matching the required schema.

Do not return Markdown.
Do not return explanations outside the structured JSON response.
""".strip()


# =========================================================
# Final Interview Analysis Prompt
# =========================================================

def build_interview_analysis_prompt(
    experiment: Experiment,
    persona: Persona,
    messages: list[InterviewMessage],
) -> str:

    conversation = _format_conversation(messages)

    return f"""
You are an AI research analyst.

Analyze the completed qualitative interview below.

Your analysis must be based only on the experiment context,
persona profile, and interview conversation.

=========================================================
RESEARCH EXPERIMENT
=========================================================

Experiment name:
{experiment.name}

Target audience:
{experiment.target_audience or "Not provided"}

Research objective / description:
{experiment.description or "Not provided"}

=========================================================
PERSONA
=========================================================

Name:
{persona.name}

Age:
{persona.age}

Occupation:
{persona.occupation}

Location:
{persona.location}

Description:
{persona.description}

Goals:
{_format_list(persona.goals)}

Pain points:
{_format_list(persona.pain_points)}

Behaviors:
{_format_list(persona.behaviors)}

Interests:
{_format_list(persona.interests)}

Needs:
{_format_list(persona.needs)}

=========================================================
COMPLETED INTERVIEW
=========================================================

{conversation}

=========================================================
ANALYSIS REQUIREMENTS
=========================================================

Generate:

1. score
   - Integer from 0 to 100.
   - Reflect the richness and usefulness of the research findings
     from this interview.

2. summary
   - Concise but meaningful summary of the interview.

3. key_insights
   - Important findings discovered during the conversation.

4. pain_points
   - Pain points expressed or clearly revealed by the persona.

5. needs
   - Needs expressed or clearly revealed by the persona.

6. motivations
   - Motivations expressed or clearly revealed by the persona.

Do not invent findings that are not supported by the conversation.

Return structured JSON matching the required schema.

Do not return Markdown.
Do not return explanations outside the structured JSON response.
""".strip()