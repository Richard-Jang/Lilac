from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text
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
    file_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    title = Column(String, nullable=False, default="")
    author = Column(String, nullable=False, default="")
    chunk_count = Column(Integer, nullable=False, default=0)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    path = Column(String, nullable=False)


class BookRow(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    title = Column(String, nullable=False, default="")
    author = Column(String, nullable=False, default="")
    cover_path = Column(String, nullable=True)
    page_count = Column(Integer, nullable=False, default=0)
    char_count = Column(Integer, nullable=False, default=0)
    current_page = Column(Integer, nullable=False, default=0)
    completed = Column(Boolean, nullable=False, default=False)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    path = Column(String, nullable=False)


class PageRow(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(String, nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    label = Column(String, nullable=False, default="")


class HighlightRow(Base):
    __tablename__ = "highlights"

    id = Column(String, primary_key=True)
    book_id = Column(String, nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class QuoteRow(Base):
    __tablename__ = "quotes"

    id = Column(String, primary_key=True)
    book_id = Column(String, nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class NoteRow(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True)
    book_id = Column(String, nullable=False)
    page_number = Column(Integer, nullable=False)
    selected_text = Column(Text, nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class BookmarkRow(Base):
    __tablename__ = "bookmarks"

    id = Column(String, primary_key=True)
    book_id = Column(String, nullable=False)
    page_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_session() -> Session:
    return Session(engine)
