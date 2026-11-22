# evalforge-ai/backend/app/schemas/model.py
import uuid

from pydantic import BaseModel, ConfigDict


class ModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider: str
    model_name: str
    display_name: str
    cost_per_1k_input: float | None = 0
    cost_per_1k_output: float | None = 0
    is_active: bool