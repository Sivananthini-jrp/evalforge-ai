# evalforge-ai/backend/app/services/evaluators/faithfulness.py
"""
Faithfulness: 1 - hallucination_rate.
Faithfulness is the inverse metric, kept separate so the DB can store
both without one being derivable from the other later (thresholds, weighting).
"""
from __future__ import annotations

from app.services.evaluators import hallucination


def evaluate(context: str | None, response: str | None) -> dict:
    if not context:
        return {"score": None, "reason": "no context provided", "passed": None}

    result = hallucination.analyze(context, response)
    score = round(1.0 - result["hallucination_rate"], 4)
    return {
        "score": score,
        "claims": result["claims"],
        "passed": not result["has_hallucination"],
    }