# evalforge-ai/backend/app/services/evaluators/relevance.py
import numpy as np
from fastembed import TextEmbedding
from app.config import settings

_embedder = None

def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _embedder

def evaluate(question: str, response: str | None) -> dict:
    if not response or not response.strip():
        return {"score": 0.0, "passed": False}

    embedder = _get_embedder()
    embeddings = list(embedder.embed([question, response]))
    sim = float(np.dot(embeddings[0], embeddings[1]))
    
    threshold = settings.DEFAULT_RELEVANCE_THRESHOLD
    return {"score": round(sim, 4), "passed": sim >= threshold}