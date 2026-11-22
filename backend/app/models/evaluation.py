# evalforge-ai/backend/app/models/evaluation.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    response_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("model_responses.id", ondelete="CASCADE"),
        index=True,
    )
    metric: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # correctness | faithfulness | relevance | hallucination_rate
    score: Mapped[float | None] = mapped_column(Numeric(5, 4))
    reasoning: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    response = relationship("ModelResponse", back_populates="evaluations")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    experiment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("experiments.id", ondelete="CASCADE"),
        index=True,
    )
    content: Mapped[dict] = mapped_column(JSONB, default=dict)
    pdf_path: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    experiment = relationship("Experiment", back_populates="reports")