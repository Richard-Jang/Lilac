import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from database import get_session, FileRow
from models import ok, err, FileRecord
from parsers import epub as epub_parser, pdf as pdf_parser
import vector_store

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_EXTENSIONS = {"epub", "pdf"}


def _row_to_record(row: FileRow) -> dict:
    return FileRecord(
        id=row.id,
        filename=row.filename,
        file_type=row.file_type,
        size_bytes=row.size_bytes,
        title=row.title,
        author=row.author,
        chunk_count=row.chunk_count,
        uploaded_at=row.uploaded_at.isoformat(),
    ).model_dump()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> JSONResponse:
    # Validate extension
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return err(f"Unsupported file type '.{ext}'. Allowed: epub, pdf", 415)

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")

    # Save to disk
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    # Parse text and extract metadata
    try:
        if ext == "epub":
            title, author, chunks = epub_parser.parse(save_path)
        else:
            title, author, chunks = pdf_parser.parse(save_path)
    except Exception as e:
        os.remove(save_path)
        return err(f"Failed to parse file: {e}", 422)

    # Ingest into vector store
    try:
        vector_store.ingest(file_id, chunks)
    except Exception as e:
        os.remove(save_path)
        return err(f"Failed to index file: {e}", 500)

    # Persist metadata
    row = FileRow(
        id=file_id,
        filename=file.filename or f"{file_id}.{ext}",
        file_type=ext,
        size_bytes=len(contents),
        title=title or file.filename or "",
        author=author or "",
        chunk_count=len(chunks),
        uploaded_at=datetime.now(timezone.utc),
        path=save_path,
    )
    with get_session() as session:
        session.add(row)
        session.commit()
        session.refresh(row)
        record = _row_to_record(row)

    return JSONResponse(content=ok(record), status_code=201)


@router.get("")
def list_files() -> dict:
    with get_session() as session:
        rows = session.query(FileRow).order_by(FileRow.uploaded_at.desc()).all()
        return ok([_row_to_record(r) for r in rows])


@router.get("/{file_id}")
def get_file(file_id: str):
    with get_session() as session:
        row = session.get(FileRow, file_id)
        if row is None:
            return err("File not found", 404)
        return ok(_row_to_record(row))


@router.delete("/{file_id}")
def delete_file(file_id: str):
    with get_session() as session:
        row = session.get(FileRow, file_id)
        if row is None:
            return err("File not found", 404)

        # Remove from disk
        if os.path.exists(row.path):
            os.remove(row.path)

        # Remove from vector store
        vector_store.delete_collection(file_id)

        session.delete(row)
        session.commit()

    return ok({"id": file_id, "deleted": True})
