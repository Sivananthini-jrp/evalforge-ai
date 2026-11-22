# evalforge-ai/backend/app/routers/models.py
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.model import Model
from app.models.user import User
from app.schemas.model import ModelOut
from app.utils.deps import get_current_user


router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=list[ModelOut])
def list_models(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(Model).where(Model.is_active.is_(True))).all()
    return [ModelOut.model_validate(r) for r in rows]