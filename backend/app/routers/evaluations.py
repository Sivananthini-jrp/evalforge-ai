# evalforge-ai/backend/app/routers/evaluations.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.response import ModelResponse
from app.models.user import User
from app.schemas.evaluation import ModelResponseOut
from app.utils.deps import get_current_user


router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.get("/experiments/{experiment_id}", response_model=list[ModelResponseOut])
def list_responses(
    experiment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exp = db.get(Experiment, experiment_id)
    if not exp or exp.user_id != user.id:
        raise HTTPException(404, "Experiment not found")

    rows = db.scalars(
        select(ModelResponse).where(ModelResponse.experiment_id == experiment_id)
    ).all()
    return [ModelResponseOut.model_validate(r) for r in rows]