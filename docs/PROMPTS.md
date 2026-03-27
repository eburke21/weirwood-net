# AI Prompts — Weirwood.net

All prompts are defined in `backend/app/services/prompts.py`. This document explains the design decisions behind each one.

## Design Principles

1. **Evidence-constrained reasoning** — Every prompt instructs Claude to cite specific chapters, scenes, or quotes. This prevents hallucination and produces verifiable output.
2. **Structured JSON output** — Connection finder and fulfillment analyzer request JSON responses with specific schemas. This enables programmatic validation (check IDs, clamp confidence, verify enums).
3. **Books-only scope** — All prompts specify "Do NOT use knowledge from the TV show" to maintain canon consistency.
4. **Quality over quantity** — "Fewer high-quality connections are better than many weak ones" — this reduces noise and improves the user experience.

## Prompt Templates

### 1. Connection Finder

**Purpose:** Find meaningful connections between a target prophecy and all others in the database.

**System prompt:** Literary analyst persona focused on foreshadowing and prophecy, grounded in textual evidence.

**User prompt structure:**
- TARGET PROPHECY block with full details (ID, source, content, status, notes)
- ALL OTHER PROPHECIES block with every other prophecy
- 5 connection types defined (thematic_parallel, shared_fulfillment, contradiction, sequential, reinterpretation)
- Rules emphasizing textual evidence and confidence calibration
- JSON output schema with `connected_to_id`, `connection_type`, `confidence`, `evidence`, `implication`

**Why IDs in the prompt:** Each prophecy is formatted as `[ID: 7] Title` — the bracketed ID format makes database IDs salient so Claude references them correctly in the JSON output.

**Output handling:** Non-streaming Claude call → JSON parsed → each connection validated (ID exists, type valid, confidence 0-1) → persisted to DB → yielded as SSE event.

### 2. Fulfillment Analyzer

**Purpose:** Given an event description, find which prophecies it might fulfill.

**Filtering:** Only unfulfilled and partially_fulfilled prophecies are included in the prompt (no point checking already-fulfilled ones).

**Output fields:** `prophecy_id`, `match_confidence`, `fulfillment_type` (literal/metaphorical/subverted/partial), `reasoning`, `remaining_unfulfilled`.

**Input sanitization:** Freeform event descriptions are HTML-stripped and length-limited to 500 characters before inclusion in the prompt.

### 3. Per-Prophecy TWOW Prediction

**Purpose:** Predict how a specific unfulfilled prophecy might be resolved in The Winds of Winter.

**Context enrichment:** Includes the prophecy's known connections (from the connection finder) to give Claude relationship context.

**Output format:** Free-form prose (300-500 words) with structured sections:
1. Current evidence and trajectory
2. Most likely fulfillment scenario
3. Alternative scenarios
4. Wildcard possibility

**Streaming:** Uses `client.messages.stream()` for real-time token delivery — the user sees text appearing character by character.

### 4. Global TWOW Report

**Purpose:** Generate a comprehensive predictions report organized by narrative thread, not by individual prophecy.

**Scope:** All unfulfilled/partially_fulfilled/debated prophecies + all connections.

**Suggested sections:** Northern Front, Daenerys's Return, King's Landing, Riverlands, Essos, Convergence Points.

**Output:** Long-form prose (1500-2500 words) streamed token by token.

## Token Budget Estimates

| Operation | Input Tokens | Output Tokens | Cost (approx) |
|-----------|-------------|---------------|---------------|
| Connection finder (1 vs 74) | ~5,000 | ~1,500 | ~$0.02 |
| Fulfillment analysis | ~3,000 | ~1,000 | ~$0.015 |
| Per-prophecy prediction | ~1,500 | ~800 | ~$0.01 |
| Global report | ~8,000 | ~4,000 | ~$0.05 |

All results are cached — repeat requests cost $0.

## Defensive Parsing

Even with "respond ONLY with valid JSON, no markdown" in prompts, Claude sometimes wraps responses in code fences. The service strips these defensively:

```python
if raw_text.startswith("```"):
    raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0]
```

All JSON fields are validated before persistence:
- `connected_to_id` checked against database IDs
- `connection_type` checked against enum values
- `confidence` clamped to 0.0-1.0
- Invalid results are logged and skipped, not surfaced to the user
