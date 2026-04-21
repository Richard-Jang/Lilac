from pydantic import BaseModel
from typing import Any, Optional
from fastapi.responses import JSONResponse


# --- Response envelope ---

def ok(data: Any) -> dict:
    return {"response": data, "error": {}}


def err(msg: str, code: int = 400) -> JSONResponse:
    return JSONResponse(
        content={"response": {}, "error": {"message": msg, "code": code}},
        status_code=code,
    )


# --- Auth ---

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str


# --- Files ---

class FileRecord(BaseModel):
    id: str
    filename: str
    file_type: str
    size_bytes: int
    title: str
    author: str
    chunk_count: int
    uploaded_at: str


# --- Books ---

class BookRecord(BaseModel):
    id: str
    filename: str
    file_type: str
    size_bytes: int
    title: str
    author: str
    cover_path: Optional[str]
    page_count: int
    char_count: int
    current_page: int
    completed: bool
    uploaded_at: str


# --- Reader annotations ---

class HighlightRequest(BaseModel):
    page_number: int
    text: str


class QuoteRequest(BaseModel):
    page_number: int
    text: str


class NoteRequest(BaseModel):
    page_number: int
    selected_text: str
    note: str


class BookmarkRequest(BaseModel):
    page_number: int


class SetPageRequest(BaseModel):
    page: int
