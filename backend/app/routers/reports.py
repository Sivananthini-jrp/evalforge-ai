# evalforge-ai/backend/app/routers/reports.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.user import User
from app.schemas.report import ReportOut
from app.services.report_generator import aggregate, render_pdf
from app.utils.deps import get_current_user


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{experiment_id}", response_model=ReportOut)
def get_report(
    experiment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exp = db.get(Experiment, experiment_id)
    if not exp or exp.user_id != user.id:
        raise HTTPException(404, "Experiment not found")

    data = aggregate(db, experiment_id)
    return ReportOut(experiment_id=experiment_id, **data)


@router.get("/{experiment_id}/pdf")
def download_pdf(
    experiment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exp = db.get(Experiment, experiment_id)
    if not exp or exp.user_id != user.id:
        raise HTTPException(404, "Experiment not found")

    data = aggregate(db, experiment_id)
    pdf_bytes = render_pdf(data, exp.name)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="evalforge_{exp.name}.pdf"'},
    )