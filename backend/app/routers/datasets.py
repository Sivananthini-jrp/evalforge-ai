# evalforge-ai/backend/app/routers/datasets.py
import csv
import io
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset import Dataset, TestCase
from app.models.user import User
from app.schemas.dataset import DatasetCreate, DatasetDetail, DatasetOut, TestCaseCreate
from app.utils.deps import get_current_user


router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("", response_model=list[DatasetOut])
def list_datasets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(Dataset).where(Dataset.user_id == user.id)).all()
    out = []
    for d in rows:
        count = db.query(TestCase).filter(TestCase.dataset_id == d.id).count()
        out.append(DatasetOut(
            id=d.id, name=d.name, version=d.version,
            description=d.description, created_at=d.created_at,
            test_case_count=count,
        ))
    return out


@router.post("", response_model=DatasetOut, status_code=201)
def create_dataset(
    payload: DatasetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ds = Dataset(user_id=user.id, name=payload.name, description=payload.description)
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return DatasetOut(
        id=ds.id, name=ds.name, version=ds.version,
        description=ds.description, created_at=ds.created_at, test_case_count=0,
    )


@router.get("/{dataset_id}", response_model=DatasetDetail)
def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ds = db.get(Dataset, dataset_id)
    if not ds or ds.user_id != user.id:
        raise HTTPException(404, "Dataset not found")
    cases = db.scalars(select(TestCase).where(TestCase.dataset_id == ds.id)).all()
    return DatasetDetail(
        id=ds.id, name=ds.name, version=ds.version,
        description=ds.description, created_at=ds.created_at,
        test_case_count=len(cases),
        test_cases=cases,
    )


@router.post("/{dataset_id}/upload", response_model=DatasetDetail, status_code=201)
async def upload_test_cases(
    dataset_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Accept CSV or JSON. Handles uppercase headers and semicolons."""
    ds = db.get(Dataset, dataset_id)
    if not ds or ds.user_id != user.id:
        raise HTTPException(404, "Dataset not found")

    raw = await file.read()
    # utf-8-sig handles standard UTF-8 and files saved from Excel (BOM)
    text = raw.decode("utf-8-sig")
    rows: list[dict] = []

    if file.filename.lower().endswith(".json"):
        data = json.loads(text)
        rows = data if isinstance(data, list) else data.get("rows", [])
    elif file.filename.lower().endswith(".csv"):
        # Sniff the delimiter (handles commas and semicolons from Excel)
        import csv
        dialect = csv.Sniffer().sniff(text[:1024]) if text else csv.excel
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        rows = list(reader)
    else:
        raise HTTPException(400, "Only .csv or .json accepted")

        print(f"DEBUG: Found {len(rows)} rows in the file.")
    created = 0
    for row in rows:
        # Clean the headers: lowercase and strip spaces to prevent "Question " vs "question" issues
        clean_row = {str(k).strip().lower(): v for k, v in row.items() if k}
        
        question = clean_row.get("question")
        if not question:
            continue  # Skip if there's no question
            
        db.add(TestCase(
            dataset_id=ds.id,
            question=str(question).strip(),
            expected_answer=clean_row.get("expected_answer") or clean_row.get("expected") or None,
            context=clean_row.get("context") or None,
            category=clean_row.get("category") or None,
            difficulty=clean_row.get("difficulty") or None,
            extra_metadata={"source": "csv_upload"},
        ))
        created += 1
    db.commit()

    cases = db.scalars(select(TestCase).where(TestCase.dataset_id == ds.id)).all()
    return DatasetDetail(
        id=ds.id, name=ds.name, version=ds.version,
        description=ds.description, created_at=ds.created_at,
        test_case_count=len(cases),
        test_cases=cases,
    )


@router.post("/{dataset_id}/cases", response_model=DatasetDetail, status_code=201)
def add_test_case(
    dataset_id: UUID,
    payload: TestCaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ds = db.get(Dataset, dataset_id)
    if not ds or ds.user_id != user.id:
        raise HTTPException(404, "Dataset not found")
    db.add(TestCase(dataset_id=ds.id, **payload.model_dump()))
    db.commit()
    cases = db.scalars(select(TestCase).where(TestCase.dataset_id == ds.id)).all()
    return DatasetDetail(
        id=ds.id, name=ds.name, version=ds.version,
        description=ds.description, created_at=ds.created_at,
        test_case_count=len(cases),
        test_cases=cases,
    )