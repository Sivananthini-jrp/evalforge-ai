# evalforge-ai/backend/app/models/response.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ModelResponse(Base):
    __tablename__ = "model_responses"
    __table_args__ = (
        UniqueConstraint(
            "experiment_id", "test_case_id", "model_id", name="uq_response_triple"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    experiment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("experiments.id", ondelete="CASCADE"), index=True
    )
    test_case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_cases.id", ondelete="CASCADE"), index=True
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("models.id"), index=True
    )

    response: Mapped[str | None] = mapped_column(Text)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    input_tokens: Mapped[int | None] = mapped_column(Integer)
    output_tokens: Mapped[int | None] = mapped_column(Integer)
    cost: Mapped[float | None] = mapped_column(Numeric(10, 6))
    error: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # relationships
    experiment = relationship("Experiment", back_populates="responses")
    test_case = relationship("TestCase", back_populates="responses")
    model = relationship("Model", back_populates="responses")
    evaluations = relationship(
        "EvaluationResult", back_populates="response", cascade="all, delete-orphan"
    )