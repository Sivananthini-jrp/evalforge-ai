# evalforge-ai/backend/app/models/experiment.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    evaluator_config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    dataset_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="experiments")
    dataset = relationship("Dataset", back_populates="experiments")
    model_links = relationship(
        "ExperimentModel", back_populates="experiment", cascade="all, delete-orphan"
    )
    responses = relationship(
        "ModelResponse", back_populates="experiment", cascade="all, delete-orphan"
    )
    reports = relationship(
        "Report", back_populates="experiment", cascade="all, delete-orphan"
    )

    @property
    def models(self) -> list:
        return [link.model for link in self.model_links]


class ExperimentModel(Base):
    __tablename__ = "experiment_models"

    experiment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("experiments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("models.id"),
        primary_key=True,
    )

    experiment = relationship("Experiment", back_populates="model_links")
    model = relationship("Model", back_populates="experiment_links")