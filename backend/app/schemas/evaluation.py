# evalforge-ai/backend/app/schemas/evaluation.py
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict


class EvaluationResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    response_id: uuid.UUID
    metric: str
    score: float | None
    reasoning: str | None
    details: dict[str, Any]


class ModelResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    model_id: uuid.UUID
    test_case_id: uuid.UUID
    response: str | None
    latency_ms: int | None
    input_tokens: int | None
    output_tokens: int | None
    cost: float | None
    error: str | None
    evaluations: list[EvaluationResultOut] = []