from pydantic import BaseModel
from typing import Any
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
