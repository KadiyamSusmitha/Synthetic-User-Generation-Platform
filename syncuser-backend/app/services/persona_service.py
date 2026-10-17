from app.models.experiment import Experiment
from app.services.llm_service import generate_structured_personas


def build_persona_prompt(
    experiment: Experiment,
    persona_count: int,
    instructions: str | None = None,
    existing_names: list[str] | None = None,
) -> str:

    research_goal = (
        experiment.description
        or "No specific research goal provided."
    )

    target_audience = (
        experiment.target_audience
        or "General users"
    )

    experiment_name = experiment.name

    additional_instructions = ""

    if instructions:
        additional_instructions = f"""
Additional instructions from the researcher:
{instructions}

Treat these instructions as additional constraints for persona generation.
Do not ignore or contradict them unless they conflict with the required schema.
"""

    existing_names_text = ""

    if existing_names:
        existing_names_text = f"""
Existing persona names that MUST NOT be reused:
{", ".join(existing_names)}

Important:
- Every newly generated persona must have a different name.
- Do not reuse any existing persona name.
- Treat names as case-insensitive when checking for duplicates.
"""

    prompt = f"""
You are an expert user researcher, UX researcher, and customer research
specialist.

Your task is to generate exactly {persona_count} realistic user personas
for the research experiment described below.

The personas will be used by researchers to understand different types of
users, their motivations, problems, behaviors, interests, and needs.

==================================================
RESEARCH EXPERIMENT
==================================================

Experiment Name:
{experiment_name}

Target Audience:
{target_audience}

Research Goal:
{research_goal}

{additional_instructions}

{existing_names_text}

==================================================
PERSONA GENERATION PRINCIPLES
==================================================

Generate personas that are directly relevant to the target audience and
research goal.

Each persona should represent a believable type of user rather than a
random fictional character.

The personas must be:

1. Realistic
   - Use believable demographic and professional details.
   - Make the persona feel like a real potential user.
   - Avoid exaggerated or unrealistic characteristics.

2. Research-relevant
   - Every persona must be relevant to the target audience.
   - Goals, pain points, behaviors, interests, and needs must connect to
     the research goal.

3. Internally consistent
   - Age, occupation, location, behaviors, interests, goals, pain points,
     and needs should logically fit together.
   - Do not create contradictions between fields.

4. Meaningfully diverse
   - Personas must represent genuinely different user patterns.
   - Do not create several personas that are essentially the same user.
   - Vary relevant characteristics such as motivations, experience levels,
     priorities, behaviors, challenges, and needs when appropriate.
   - Diversity must still remain realistic for the target audience.

5. Specific
   - Avoid vague statements such as "wants a better experience."
   - Describe concrete goals, behaviors, problems, interests, and needs.
   - Make the information useful for user research and product decisions.

6. Non-stereotypical
   - Do not use stereotypes based on gender, occupation, age, location,
     or other characteristics.
   - Do not assume interests or behavior solely from demographic details.

==================================================
PERSONA REQUIREMENTS
==================================================

1. Generate exactly {persona_count} personas.

2. Every persona must contain a meaningful value for every required field.

3. Never return null values.

4. Never return empty strings.

5. Never return empty arrays.

6. Every persona must have a realistic full name.

7. Every persona name must be unique within this generation.

8. Every persona name must be different from all existing persona names
   provided above.

9. Do not generate placeholder names such as:
   - User 1
   - User 2
   - Persona 1
   - Persona A
   - Test User
   - Sample User

10. Every persona must belong to the specified target audience.

11. Every persona must be meaningfully different from the other generated
    personas.

12. Do not create differences using only name, age, or location.
    The underlying motivations, behaviors, goals, pain points, interests,
    and needs should also differ meaningfully.

==================================================
GENDER REQUIREMENTS
==================================================

- gender must be exactly "male" or "female".
- Never return null for gender.
- Never return an empty gender.
- Do not use any other gender value.
- Do not infer gender from occupation.
- Do not infer gender from interests.
- Do not use stereotypes to determine gender.
- Gender must be explicitly generated as part of the persona.
- Keep gender consistent within each persona.

==================================================
FIELD-SPECIFIC REQUIREMENTS
==================================================

For each persona provide:

name:
- A unique, realistic full name.
- Do not reuse an existing persona name.

gender:
- Exactly "male" or "female".

description:
- A concise but meaningful summary of who the persona is.
- Explain their relevant context and relationship to the research topic.
- Avoid generic descriptions.

age:
- A realistic integer age.
- Age must make sense with the occupation and persona context.

occupation:
- A realistic occupation appropriate for the persona's age and context.

location:
- A realistic location appropriate for the target audience.

goals:
- Provide 3 to 5 realistic and specific goals.
- Goals should relate to the persona's motivations and the research goal.
- Avoid generic goals.

pain_points:
- Provide 3 to 5 realistic and specific problems or frustrations.
- Pain points should be relevant to the persona's situation.
- Avoid repeating the same generic problems across every persona.

behaviors:
- Provide 3 to 5 observable and realistic behaviors.
- Describe what the persona actually does rather than vague personality
  traits.
- Behaviors should be consistent with the persona's goals and context.

interests:
- Provide 3 to 5 relevant interests.
- Interests should make sense for the persona.
- Do not use stereotypes based on demographics.

needs:
- Provide 3 to 5 realistic and actionable needs.
- Needs should connect logically to the persona's goals and pain points.

==================================================
QUALITY CHECK BEFORE RETURNING
==================================================

Before producing the final structured response, internally verify every
generated persona.

For each persona check:

- Is the persona relevant to the target audience?
- Is the persona relevant to the research goal?
- Are all fields meaningful?
- Are there any null values?
- Are there any empty strings?
- Are there any empty arrays?
- Is the age realistic?
- Does the occupation fit the age and context?
- Does the location make sense?
- Are the goals specific and realistic?
- Are the pain points specific and realistic?
- Are the behaviors observable and realistic?
- Are the interests relevant?
- Are the needs actionable?
- Are the fields internally consistent?
- Is the persona meaningfully different from the other personas?
- Is the name unique?
- Is the name different from all existing persona names?
- Is gender exactly "male" or "female"?

If any persona is too generic, repetitive, contradictory, or unrealistic,
improve it before returning the response.

==================================================
FINAL OUTPUT RULES
==================================================

- Return exactly {persona_count} personas.
- Do not return additional personas.
- Do not omit any required field.
- Do not return null values.
- Do not return empty strings.
- Do not return empty arrays.
- Do not add explanations outside the structured persona data.
- Follow the provided structured output schema exactly.
"""

    return prompt


def generate_personas_for_experiment(
    experiment: Experiment,
    persona_count: int = 3,
    instructions: str | None = None,
    existing_names: list[str] | None = None,
):
    prompt = build_persona_prompt(
        experiment=experiment,
        persona_count=persona_count,
        instructions=instructions,
        existing_names=existing_names,
    )

    generated_personas = generate_structured_personas(prompt)

    # -----------------------------------------------------
    # Validate persona count
    # -----------------------------------------------------

    if len(generated_personas.personas) != persona_count:
        raise ValueError(
            f"Expected {persona_count} personas, "
            f"but received {len(generated_personas.personas)}."
        )

    # -----------------------------------------------------
    # Validate unique names within generated personas
    # -----------------------------------------------------

    generated_names = [
        persona.name.strip()
        for persona in generated_personas.personas
    ]

    normalized_generated_names = [
        name.casefold()
        for name in generated_names
    ]

    if len(normalized_generated_names) != len(
        set(normalized_generated_names)
    ):
        raise ValueError(
            "Generated personas contain duplicate names."
        )

    # -----------------------------------------------------
    # Validate against existing persona names
    # -----------------------------------------------------

    normalized_existing_names = {
        name.strip().casefold()
        for name in (existing_names or [])
        if name and name.strip()
    }

    duplicate_existing_names = (
        set(normalized_generated_names)
        & normalized_existing_names
    )

    if duplicate_existing_names:
        raise ValueError(
            "Generated persona names already exist: "
            + ", ".join(duplicate_existing_names)
        )

    # -----------------------------------------------------
    # Final validation
    # -----------------------------------------------------

    for persona in generated_personas.personas:

        if not persona.name.strip():
            raise ValueError(
                "Generated persona contains an empty name."
            )

        if persona.gender not in {"male", "female"}:
            raise ValueError(
                "Generated persona contains an invalid gender."
            )

    return generated_personas