# evalforge-ai/backend/app/models/__init__.py
"""
Import every model so that Base.metadata is fully populated
when Alembic or Base.metadata.create_all() runs.
"""
from app.models.user import User
from app.models.dataset import Dataset, TestCase
from app.models.experiment import Experiment, ExperimentModel
from app.models.response import ModelResponse
from app.models.evaluation import EvaluationResult, Report
from app.models.model import Model

__all__ = [
    "User",
    "Dataset",
    "TestCase",
    "Experiment",
    "ExperimentModel",
    "ModelResponse",
    "EvaluationResult",
    "Report",
    "Model",
]