from app.models import Prophecy

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


def format_prophecy_list(prophecies: list[Prophecy]) -> str:
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


def build_connection_finder_prompt(target: Prophecy, others: list[Prophecy]) -> str:
    return CONNECTION_FINDER_TEMPLATE.format(
        target_block=format_prophecy_for_prompt(target),
        others_block=format_prophecy_list(others),
    )
