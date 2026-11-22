# evalforge-ai/backend/app/models/dataset.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="datasets")
    test_cases = relationship(
        "TestCase", back_populates="dataset", cascade="all, delete-orphan"
    )
    experiments = relationship("Experiment", back_populates="dataset")


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    expected_answer: Mapped[str | None] = mapped_column(Text)
    context: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100))
    difficulty: Mapped[str | None] = mapped_column(String(20))

    # Python attribute `extra_metadata` maps to DB column `metadata`
    # because `metadata` is reserved on SQLAlchemy's declarative Base.
    extra_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    dataset = relationship("Dataset", back_populates="test_cases")
    responses = relationship("ModelResponse", back_populates="test_case")