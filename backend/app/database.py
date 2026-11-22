# evalforge-ai/backend/app/database.py
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    future=True,
    connect_args={"connect_timeout": 15},  # psycopg3 honors this
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,
)


class Base(DeclarativeBase):
    """All SQLAlchemy models inherit from this."""


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()