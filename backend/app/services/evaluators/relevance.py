# evalforge-ai/backend/app/services/evaluators/relevance.py
"""
Answer relevance: does the response address the question?
Semantic similarity between question and response.
"""
from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings


_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def evaluate(question: str, response: str | None) -> dict:
    if not response or not response.strip():
        return {"score": 0.0, "passed": False}

    model = _get_model()
    emb = model.encode([question, response], normalize_embeddings=True)
    sim = float(np.dot(emb[0], emb[1]))
    threshold = settings.DEFAULT_RELEVANCE_THRESHOLD
    return {"score": round(sim, 4), "passed": sim >= threshold}