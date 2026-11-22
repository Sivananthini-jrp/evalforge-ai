# evalforge-ai/backend/app/schemas/experiment.py
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.model import ModelOut


class ExperimentCreate(BaseModel):
    name: str
    dataset_id: uuid.UUID
    model_ids: list[uuid.UUID] = Field(min_length=1)
    prompt_template: str = Field(min_length=10)
    evaluator_config: dict[str, Any] = Field(default_factory=dict)


class ExperimentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    dataset_id: uuid.UUID
    status: str
    dataset_version: int
    prompt_template: str
    evaluator_config: dict[str, Any]
    created_at: datetime
    completed_at: datetime | None
    error_message: str | None = None


class ExperimentDetail(ExperimentOut):
    models: list[ModelOut] = Field(default_factory=list)