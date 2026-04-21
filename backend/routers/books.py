import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, UploadFile, File
from fastapi.responses import JSONResponse
from database import get_session, BookRow, PageRow, HighlightRow, QuoteRow, NoteRow, BookmarkRow
from models import (
    ok, err, BookRecord,
    HighlightRequest, QuoteRequest, NoteRequest, BookmarkRequest, SetPageRequest,
)
from parsers import epub as epub_parser, pdf as pdf_parser
import vector_store

router = APIRouter(prefix="/books", tags=["books"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_EXTENSIONS = {"epub", "pdf"}
PAGE_WINDOW = 5
_EMBED_CHUNK_SIZE = 1000
_EMBED_CHUNK_OVERLAP = 100


def _split_for_embed(pages: list[dict]) -> list[dict]:
    """Chunk page texts to fit the embedding model's context window."""
    chunks = []
    idx = 0
    for page in pages:
        text = page["text"]
        start = 0
        while start < len(text):
            end = start + _EMBED_CHUNK_SIZE
            chunks.append({
                "text": text[start:end],
                "chunk_index": idx,
                "page_number": page["page_number"],
                "label": page["label"],
            })
            idx += 1
            start += _EMBED_CHUNK_SIZE - _EMBED_CHUNK_OVERLAP
    return chunks


def _row_to_record(row: BookRow) -> dict:
    return BookRecord(
        id=row.id,
        filename=row.filename,
        file_type=row.file_type,
        size_bytes=row.size_bytes,
        title=row.title,
        author=row.author,
        cover_path=row.cover_path,
        page_count=row.page_count,
        char_count=row.char_count,
        current_page=row.current_page,
        completed=row.completed,
        uploaded_at=row.uploaded_at.isoformat(),
    ).model_dump()


def _all_pages(session, book_id: str) -> list[dict]:
    rows = (
        session.query(PageRow)
        .filter(PageRow.book_id == book_id)
        .order_by(PageRow.page_number)
        .all()
    )
    return [{"page_number": r.page_number, "label": r.label, "text": r.text} for r in rows]


# --- Collection ---

@router.get("/completed")
def list_completed() -> dict:
    with get_session() as session:
        rows = session.query(BookRow).filter(BookRow.completed == True).order_by(BookRow.uploaded_at.desc()).all()
        return ok([_row_to_record(r) for r in rows])


@router.get("/ongoing")
def list_ongoing() -> dict:
    with get_session() as session:
        rows = session.query(BookRow).filter(BookRow.completed == False).order_by(BookRow.uploaded_at.desc()).all()
        return ok([_row_to_record(r) for r in rows])


@router.get("")
def list_books() -> dict:
    with get_session() as session:
        rows = session.query(BookRow).order_by(BookRow.uploaded_at.desc()).all()
        return ok([_row_to_record(r) for r in rows])


def _index_in_background(book_id: str, pages: list[dict]) -> None:
    try:
        vector_store.ingest(book_id, _split_for_embed(pages))
    except Exception as e:
        print(f"[vector store] failed to index {book_id}: {e}")


@router.post("")
async def upload_book(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()) -> JSONResponse:
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return err(f"Unsupported file type '.{ext}'. Allowed: epub, pdf", 415)

    book_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{book_id}.{ext}")

    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    try:
        cover_path = None
        if ext == "epub":
            title, author, cover_item, pages = epub_parser.parse(save_path)
            if cover_item:
                img_ext = cover_item.media_type.split("/")[-1]
                cover_path = os.path.join(UPLOAD_DIR, f"{book_id}_cover.{img_ext}")
                with open(cover_path, "wb") as f:
                    f.write(cover_item.get_content())
        else:
            title, author, chunks = pdf_parser.parse(save_path)
            pages = [
                {"page_number": i, "text": ch["text"], "label": f"Page {ch['page']}"}
                for i, ch in enumerate(chunks)
            ]
    except Exception as e:
        os.remove(save_path)
        return err(f"Failed to parse file: {e}", 422)

    background_tasks.add_task(_index_in_background, book_id, pages)

    with get_session() as session:
        row = BookRow(
            id=book_id,
            filename=file.filename or f"{book_id}.{ext}",
            file_type=ext,
            size_bytes=len(contents),
            title=title or file.filename or "",
            author=author or "",
            cover_path=cover_path,
            page_count=len(pages),
            char_count=sum(len(p["text"]) for p in pages),
            current_page=0,
            completed=False,
            uploaded_at=datetime.now(timezone.utc),
            path=save_path,
        )
        session.add(row)
        for p in pages:
            session.add(PageRow(book_id=book_id, page_number=p["page_number"], text=p["text"], label=p["label"]))
        session.commit()
        session.refresh(row)
        record = _row_to_record(row)

    return JSONResponse(content=ok(record), status_code=201)


@router.delete("/{book_id}")
def delete_book(book_id: str) -> dict:
    with get_session() as session:
        row = session.get(BookRow, book_id)
        if row is None:
            return err("Book not found", 404)
        if os.path.exists(row.path):
            os.remove(row.path)
        if row.cover_path and os.path.exists(row.cover_path):
            os.remove(row.cover_path)
        vector_store.delete_collection(book_id)
        session.query(PageRow).filter(PageRow.book_id == book_id).delete()
        session.query(HighlightRow).filter(HighlightRow.book_id == book_id).delete()
        session.query(QuoteRow).filter(QuoteRow.book_id == book_id).delete()
        session.query(NoteRow).filter(NoteRow.book_id == book_id).delete()
        session.query(BookmarkRow).filter(BookmarkRow.book_id == book_id).delete()
        session.delete(row)
        session.commit()
    return ok({"id": book_id, "deleted": True})


@router.patch("/{book_id}/complete")
def toggle_complete(book_id: str) -> dict:
    with get_session() as session:
        row = session.get(BookRow, book_id)
        if row is None:
            return err("Book not found", 404)
        row.completed = not row.completed
        session.commit()
        session.refresh(row)
        return ok(_row_to_record(row))


# --- Reader ---

@router.get("/{book_id}")
def get_book(book_id: str) -> dict:
    with get_session() as session:
        row = session.get(BookRow, book_id)
        if row is None:
            return err("Book not found", 404)
        return ok({"book": _row_to_record(row), "pages": _all_pages(session, book_id)})


@router.patch("/{book_id}/page")
def set_page(book_id: str, body: SetPageRequest) -> dict:
    with get_session() as session:
        row = session.get(BookRow, book_id)
        if row is None:
            return err("Book not found", 404)
        row.current_page = max(0, min(body.page, row.page_count - 1))
        session.commit()
        session.refresh(row)
        return ok(_row_to_record(row))


# --- Annotations ---

@router.post("/{book_id}/highlight")
def add_highlight(book_id: str, body: HighlightRequest) -> JSONResponse:
    with get_session() as session:
        if session.get(BookRow, book_id) is None:
            return err("Book not found", 404)
        row = HighlightRow(
            id=str(uuid.uuid4()),
            book_id=book_id,
            page_number=body.page_number,
            text=body.text,
            created_at=datetime.now(timezone.utc),
        )
        session.add(row)
        session.commit()
        return JSONResponse(content=ok({"id": row.id}), status_code=201)


@router.post("/{book_id}/quote")
def add_quote(book_id: str, body: QuoteRequest) -> JSONResponse:
    with get_session() as session:
        if session.get(BookRow, book_id) is None:
            return err("Book not found", 404)
        row = QuoteRow(
            id=str(uuid.uuid4()),
            book_id=book_id,
            page_number=body.page_number,
            text=body.text,
            created_at=datetime.now(timezone.utc),
        )
        session.add(row)
        session.commit()
        return JSONResponse(content=ok({"id": row.id}), status_code=201)


@router.post("/{book_id}/note")
def add_note(book_id: str, body: NoteRequest) -> JSONResponse:
    with get_session() as session:
        if session.get(BookRow, book_id) is None:
            return err("Book not found", 404)
        row = NoteRow(
            id=str(uuid.uuid4()),
            book_id=book_id,
            page_number=body.page_number,
            selected_text=body.selected_text,
            note=body.note,
            created_at=datetime.now(timezone.utc),
        )
        session.add(row)
        session.commit()
        return JSONResponse(content=ok({"id": row.id}), status_code=201)


@router.post("/{book_id}/bookmark")
def add_bookmark(book_id: str, body: BookmarkRequest) -> JSONResponse:
    with get_session() as session:
        if session.get(BookRow, book_id) is None:
            return err("Book not found", 404)
        row = BookmarkRow(
            id=str(uuid.uuid4()),
            book_id=book_id,
            page_number=body.page_number,
            created_at=datetime.now(timezone.utc),
        )
        session.add(row)
        session.commit()
        return JSONResponse(content=ok({"id": row.id}), status_code=201)
