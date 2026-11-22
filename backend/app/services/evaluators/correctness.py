# evalforge-ai/backend/app/services/evaluators/correctness.py
import re
import numpy as np
from fastembed import TextEmbedding
from app.config import settings

_embedder = None

def _get_embedder():
    global _embedder
    if _embedder is None:
        # Lightweight ONNX model (very low RAM)
        _embedder = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _embedder

def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())

def evaluate(expected: str | None, actual: str | None) -> dict:
    if not expected or not actual:
        return {"score": 0.0, "exact_match": False, "semantic_sim": 0.0, "passed": False}

    e_norm, a_norm = _normalize(expected), _normalize(actual)
    exact = e_norm == a_norm or e_norm in a_norm

    embedder = _get_embedder()
    embeddings = list(embedder.embed([expected, actual]))
    sim = float(np.dot(embeddings[0], embeddings[1]))

    score = max(1.0 if exact else 0.0, sim)
    threshold = settings.DEFAULT_CORRECTNESS_THRESHOLD
    return {
        "score": round(score, 4),
        "exact_match": exact,
        "semantic_sim": round(sim, 4),
        "passed": score >= threshold,
    }