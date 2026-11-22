# evalforge-ai/backend/app/schemas/dataset.py
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TestCaseCreate(BaseModel):
    question: str
    expected_answer: str | None = None
    context: str | None = None
    category: str | None = None
    difficulty: str | None = None
    extra_metadata: dict[str, Any] = Field(default_factory=dict)


class TestCaseOut(TestCaseCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dataset_id: uuid.UUID


class DatasetCreate(BaseModel):
    name: str
    description: str | None = None


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    version: int
    description: str | None
    created_at: datetime
    test_case_count: int = 0


class DatasetDetail(DatasetOut):
    test_cases: list[TestCaseOut] = Field(default_factory=list)