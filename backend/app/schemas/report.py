# evalforge-ai/backend/app/schemas/report.py
import uuid
from typing import Any

from pydantic import BaseModel


class ModelMetrics(BaseModel):
    avg: float
    n: int


class ModelPerformance(BaseModel):
    avg_latency_ms: float
    total_tokens: int
    total_cost: float


class ReportOut(BaseModel):
    experiment_id: uuid.UUID
    per_model_metrics: dict[str, dict[str, ModelMetrics]]
    performance: dict[str, ModelPerformance]
    recommendations: list[str]