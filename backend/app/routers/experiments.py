# evalforge-ai/backend/app/routers/experiments.py
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset import Dataset, TestCase
from app.models.experiment import Experiment, ExperimentModel
from app.models.model import Model
from app.models.user import User
from app.schemas.experiment import ExperimentCreate, ExperimentDetail, ExperimentOut
from app.schemas.model import ModelOut
from app.services.experiment_runner import run_experiment
from app.utils.deps import get_current_user


router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("", response_model=list[ExperimentOut])
def list_experiments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(Experiment)
        .where(Experiment.user_id == user.id)
        .order_by(Experiment.created_at.desc())
    ).all()
    return [ExperimentOut.model_validate(r) for r in rows]


@router.post("", response_model=ExperimentOut, status_code=201)
def create_experiment(
    payload: ExperimentCreate,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ds = db.get(Dataset, payload.dataset_id)
    if not ds or ds.user_id != user.id:
        raise HTTPException(404, "Dataset not found")

    count = db.query(TestCase).filter(TestCase.dataset_id == ds.id).count()
    if count == 0:
        raise HTTPException(400, "Dataset has no test cases")

    # validate model IDs
    models = db.scalars(select(Model).where(Model.id.in_(payload.model_ids))).all()
    if len(models) != len(payload.model_ids):
        raise HTTPException(400, "One or more model IDs are invalid")

    exp = Experiment(
        user_id=user.id,
        dataset_id=ds.id,
        name=payload.name,
        prompt_template=payload.prompt_template,
        evaluator_config=payload.evaluator_config,
        dataset_version=ds.version,
        status="pending",
    )
    db.add(exp)
    db.flush()
    for m in models:
        db.add(ExperimentModel(experiment_id=exp.id, model_id=m.id))
    db.commit()
    db.refresh(exp)

    bg.add_task(run_experiment, exp.id)
    return ExperimentOut.model_validate(exp)


@router.get("/{experiment_id}", response_model=ExperimentDetail)
def get_experiment(
    experiment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exp = db.get(Experiment, experiment_id)
    if not exp or exp.user_id != user.id:
        raise HTTPException(404, "Experiment not found")
    out = ExperimentDetail.model_validate(exp)
    out.models = [ModelOut.model_validate(link.model) for link in exp.model_links]
    return out


@router.post("/{experiment_id}/rerun", response_model=ExperimentOut, status_code=201)
def rerun(
    experiment_id: UUID,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    src = db.get(Experiment, experiment_id)
    if not src or src.user_id != user.id:
        raise HTTPException(404, "Experiment not found")

    exp = Experiment(
        user_id=user.id,
        dataset_id=src.dataset_id,
        name=f"{src.name} (rerun)",
        prompt_template=src.prompt_template,
        evaluator_config=src.evaluator_config,
        dataset_version=src.dataset_version,
        status="pending",
    )
    db.add(exp)
    db.flush()
    for link in src.model_links:
        db.add(ExperimentModel(experiment_id=exp.id, model_id=link.model_id))
    db.commit()
    db.refresh(exp)
    bg.add_task(run_experiment, exp.id)
    return ExperimentOut.model_validate(exp)