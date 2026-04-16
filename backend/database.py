from sqlalchemy import create_engine, Column, String, Integer, DateTime, text
from sqlalchemy.orm import DeclarativeBase, Session
from datetime import datetime, timezone

DATABASE_URL = "sqlite:///./lilac.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


class FileRow(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)      # "epub" | "pdf"
    size_bytes = Column(Integer, nullable=False)
    title = Column(String, nullable=False, default="")
    author = Column(String, nullable=False, default="")
    chunk_count = Column(Integer, nullable=False, default=0)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    path = Column(String, nullable=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_session() -> Session:
    return Session(engine)
