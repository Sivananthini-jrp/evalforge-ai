# evalforge-ai/backend/app/services/evaluators/correctness.py
"""
Correctness evaluator.

Combines:
  - exact / substring match (fast, deterministic)
  - semantic similarity via SentenceTransformers (handles paraphrase)

Neither is sufficient alone, so we blend them:
  score = max(1.0 if exact else 0.0, semantic_sim)
"""
from __future__ import annotations

import re

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings


_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def evaluate(expected: str | None, actual: str | None) -> dict:
    if not expected or not actual:
        return {"score": 0.0, "exact_match": False, "semantic_sim": 0.0, "passed": False}

    e_norm, a_norm = _normalize(expected), _normalize(actual)
    exact = e_norm == a_norm or e_norm in a_norm

    model = _get_model()
    emb = model.encode([expected, actual], normalize_embeddings=True)
    sim = float(np.dot(emb[0], emb[1]))

    score = max(1.0 if exact else 0.0, sim)
    threshold = settings.DEFAULT_CORRECTNESS_THRESHOLD
    return {
        "score": round(score, 4),
        "exact_match": exact,
        "semantic_sim": round(sim, 4),
        "passed": score >= threshold,
    }