# evalforge-ai/backend/app/models/model.py
import uuid

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Model(Base):
    """Registry of LLM configurations the platform can call."""
    __tablename__ = "models"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # openai|gemini|groq|ollama
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    cost_per_1k_input: Mapped[float | None] = mapped_column(Numeric(10, 6), default=0)
    cost_per_1k_output: Mapped[float | None] = mapped_column(Numeric(10, 6), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # relationships
    responses = relationship("ModelResponse", back_populates="model")
    experiment_links = relationship(
        "ExperimentModel", back_populates="model", cascade="all, delete-orphan"
    )