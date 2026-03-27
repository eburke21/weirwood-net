from collections.abc import Sequence

from app.models import Connection, Prophecy

BOOK_NAMES = {1: "AGOT", 2: "ACOK", 3: "ASOS", 4: "AFFC", 5: "ADWD"}


def format_prophecy_for_prompt(prophecy: Prophecy) -> str:
    book_name = BOOK_NAMES.get(prophecy.source_book, f"Book {prophecy.source_book}")
    lines = [
        f"[ID: {prophecy.id}] {prophecy.title}",
        f"  Source: {prophecy.source_character}, {prophecy.source_chapter} ({book_name})",
        f"  Type: {prophecy.prophecy_type}",
        f"  Content: {prophecy.description}",
        f"  Status: {prophecy.status}",
    ]
    if prophecy.notes:
        lines.append(f"  Notes: {prophecy.notes}")
    return "\n".join(lines)


def format_prophecy_list(prophecies: Sequence[Prophecy]) -> str:
    return "\n\n".join(format_prophecy_for_prompt(p) for p in prophecies)


CONNECTION_FINDER_SYSTEM = (
    "You are a literary analyst specializing in A Song of Ice and Fire foreshadowing and prophecy. "
    "Your analysis must be grounded in specific textual evidence from the books. "
    "Do not speculate beyond what the text supports."
)

CONNECTION_FINDER_TEMPLATE = """TARGET PROPHECY:
{target_block}

ALL OTHER PROPHECIES IN THE DATABASE:
{others_block}

Find meaningful connections between the TARGET and other prophecies.
Connection types:
- thematic_parallel: Similar imagery, symbolism, or narrative pattern
- shared_fulfillment: Both could be fulfilled by the same future event
- contradiction: If one is true, the other cannot be (or requires reinterpretation)
- sequential: One logically precedes or triggers the other
- reinterpretation: Understanding one changes the meaning of the other

Rules:
- Only report connections with genuine textual evidence
- Do not force connections — fewer high-quality connections are better than many weak ones
- Confidence should reflect strength of textual evidence, not your certainty about future events
- For each connection, cite specific chapters, scenes, or quotes as evidence

Respond ONLY with valid JSON, no markdown:
{{
  "connections": [
    {{
      "connected_to_id": <int>,
      "connection_type": "<type>",
      "confidence": <0.0-1.0>,
      "evidence": "<specific textual evidence with chapter references>",
      "implication": "<what this connection suggests for the story>"
    }}
  ]
}}"""


def build_connection_finder_prompt(target: Prophecy, others: Sequence[Prophecy]) -> str:
    return CONNECTION_FINDER_TEMPLATE.format(
        target_block=format_prophecy_for_prompt(target),
        others_block=format_prophecy_list(others),
    )


# --- Fulfillment Analyzer ---

FULFILLMENT_SYSTEM = (
    "You are a literary analyst specializing in ASOIAF prophecy fulfillment. "
    "Your analysis must be grounded in specific textual evidence from the books."
)

FULFILLMENT_TEMPLATE = """EVENT:
{event_description}

PROPHECIES TO CHECK AGAINST:
{prophecies_block}

For each prophecy that this event could plausibly fulfill (fully or partially),
provide a match assessment.

Rules:
- Only include prophecies with genuine textual basis for a match
- Consider both literal and metaphorical fulfillment
- ASOIAF prophecies are often fulfilled in unexpected ways — consider subversions
- Rank matches by confidence, highest first

Respond ONLY with valid JSON, no markdown:
{{
  "matches": [
    {{
      "prophecy_id": <int>,
      "match_confidence": <0.0-1.0>,
      "fulfillment_type": "literal | metaphorical | subverted | partial",
      "reasoning": "<detailed reasoning with textual evidence>",
      "remaining_unfulfilled": "<what parts of the prophecy would still be open, if any>"
    }}
  ]
}}"""


def build_fulfillment_prompt(event_description: str, prophecies: Sequence[Prophecy]) -> str:
    return FULFILLMENT_TEMPLATE.format(
        event_description=event_description,
        prophecies_block=format_prophecy_list(prophecies),
    )


# --- TWOW Predictions ---

PREDICTION_SYSTEM = (
    "You are a literary analyst predicting how unfulfilled ASOIAF prophecies "
    "might be resolved in The Winds of Winter. Base predictions on textual evidence "
    "from the existing 5 books only. Do NOT use knowledge from the TV show."
)

PREDICTION_SINGLE_TEMPLATE = """PROPHECY:
{prophecy_block}

Known connections to other prophecies:
{connections_block}

CONSTRAINTS:
- Base predictions on textual evidence from the existing 5 books
- Consider character arcs, geographic positions, and narrative momentum as of ADWD
- Acknowledge uncertainty — present 2-3 possible fulfillment scenarios ranked by likelihood
- Do NOT use knowledge from the TV show (books only)
- Cite specific chapters, character positions, or plot threads as evidence

Write a structured analysis (aim for 300-500 words):
1. Current evidence and trajectory
2. Most likely fulfillment scenario
3. Alternative scenarios
4. Wildcard possibility (low probability but textually supported)"""


def format_connections_for_prompt(connections: Sequence[Connection], prophecies_by_id: dict[int, Prophecy]) -> str:
    if not connections:
        return "No connections analyzed yet."
    lines = []
    for conn in connections:
        target = prophecies_by_id.get(conn.target_prophecy_id)
        title = target.title if target else f"Prophecy #{conn.target_prophecy_id}"
        lines.append(f"- {conn.connection_type} with '{title}' (confidence: {conn.confidence:.0%}): {conn.evidence[:200]}")
    return "\n".join(lines)


def build_prediction_single_prompt(prophecy: Prophecy, connections: Sequence[Connection], prophecies_by_id: dict[int, Prophecy]) -> str:
    return PREDICTION_SINGLE_TEMPLATE.format(
        prophecy_block=format_prophecy_for_prompt(prophecy),
        connections_block=format_connections_for_prompt(connections, prophecies_by_id),
    )


PREDICTION_GLOBAL_TEMPLATE = """UNFULFILLED PROPHECIES:
{prophecies_block}

KNOWN CONNECTIONS BETWEEN THESE PROPHECIES:
{connections_block}

Generate a report organized by narrative thread (not by individual prophecy).
Group related prophecies together and analyze how they might converge.

Suggested sections (adapt as the evidence dictates):
- The Northern Front (Stark prophecies, winter, Others)
- Daenerys's Return (dragon prophecies, Azor Ahai, fire visions)
- King's Landing (valonqar, political prophecies, wildfire)
- The Riverlands/Brotherhood (Lady Stoneheart, Arya's arc)
- Essos Loose Threads (Quaithe, Eastern prophecies)
- Convergence Points (where multiple prophecy threads collide)

Rules:
- Books only, no show knowledge
- Cite specific textual evidence for every claim
- Acknowledge uncertainty and competing interpretations
- Aim for 1500-2500 words total"""


def build_prediction_global_prompt(prophecies: Sequence[Prophecy], connections: Sequence[Connection], prophecies_by_id: dict[int, Prophecy]) -> str:
    return PREDICTION_GLOBAL_TEMPLATE.format(
        prophecies_block=format_prophecy_list(prophecies),
        connections_block=format_connections_for_prompt(connections, prophecies_by_id),
    )
