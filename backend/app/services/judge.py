# evalforge-ai/backend/app/services/judge.py
"""
LLM-as-judge wrapper. Used when deterministic evaluators are ambiguous
or when we want a second opinion on a claim.

Reuses the provider factory so the judge is a configurable model
(settings.JUDGE_MODEL_PROVIDER / settings.JUDGE_MODEL_NAME).
"""
from __future__ import annotations

from app.config import settings
from app.services.llm_providers.factory import build_provider


_JUDGE_SYSTEM = (
    "You are a strict, careful evaluator. "
    "Answer only with JSON of the shape "
    '{"verdict": "supported"|"contradicted"|"unsupported", "reasoning": "<one sentence>"}. '
    "Do not add markdown code fences, do not add any text outside the JSON."
)


async def judge_claim(evidence: str, claim: str) -> dict:
    """Ask the configured judge LLM to classify a single claim against evidence."""
    provider = build_provider(
        provider=settings.JUDGE_MODEL_PROVIDER,
        model_name=settings.JUDGE_MODEL_NAME,
    )
    prompt = (
        f"Evidence:\n{evidence}\n\n"
        f"Claim:\n{claim}\n\n"
        "Classify the claim against the evidence. Respond in JSON."
    )
    result = await provider.generate(prompt, system=_JUDGE_SYSTEM)

    # Parse JSON defensively — models occasionally wrap in ```json
    text = result.text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].lstrip()

    import json
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {
            "verdict": "unsupported",
            "reasoning": f"judge returned non-JSON: {text[:120]}",
            "raw": result.text,
        }

    return {
        "verdict": parsed.get("verdict", "unsupported"),
        "reasoning": parsed.get("reasoning", ""),
        "raw": result.text,
    }