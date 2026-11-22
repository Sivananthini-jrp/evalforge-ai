# evalforge-ai/backend/app/utils/deps.py
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    subject = decode_token(credentials.credentials)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user