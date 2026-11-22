# evalforge-ai/backend/app/services/evaluators/ragas_eval.py
"""
Thin RAGAS adapter.

RAGAS (https://docs.ragas.io) computes 4 RAG metrics:
  - faithfulness      : is the answer grounded in the retrieved context?
  - answer_relevancy  : does the answer address the question?
  - context_precision : are the retrieved chunks relevant?
  - context_recall    : did the retriever find the needed chunks?

We only have question + context + (optionally) expected_answer, so we
compute faithfulness and answer_relevancy. context_precision/recall need
the raw retrieved chunks, not a single blob, and are out of scope here.

RAGAS itself calls an LLM as judge internally; we point it at the same
provider used by `services/judge.py`.
"""
from __future__ import annotations

import json
from functools import lru_cache


@lru_cache(maxsize=1)
def _ragas_available() -> bool:
    try:
        import ragas  # noqa: F401
        return True
    except ImportError:
        return False


def evaluate(question: str, context: str | None, response: str | None, expected: str | None = None) -> dict:
    """
    Return the same shape as other evaluators:
      {"score": float | None, "passed": bool | None, "details": {...}}
    """
    if not _ragas_available():
        return {"score": None, "passed": None, "details": {"reason": "ragas not installed"}}
    if not question or not context or not response:
        return {"score": None, "passed": None, "details": {"reason": "missing inputs"}}

    from datasets import Dataset
    from ragas import evaluate as ragas_evaluate
    from ragas.metrics import answer_relevancy, faithfulness

    row = {
        "question": question,
        "contexts": [context],
        "answer": response,
    }
    if expected:
        row["ground_truth"] = expected

    ds = Dataset.from_list([row])
    try:
        result = ragas_evaluate(ds, metrics=[faithfulness, answer_relevancy])
        scores = result.to_pandas().to_dict(orient="records")[0]
        faith = float(scores.get("faithfulness", 0.0))
        relevance = float(scores.get("answer_relevancy", 0.0))
        return {
            "score": round((faith + relevance) / 2, 4),
            "passed": (faith + relevance) / 2 >= 0.5,
            "details": {"faithfulness": faith, "answer_relevancy": relevance},
        }
    except Exception as exc:
        return {"score": None, "passed": None, "details": {"reason": f"ragas error: {exc}"}}