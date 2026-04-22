from fastapi import APIRouter, Depends
from database import get_session, HighlightRow, NoteRow, QuoteRow, BookRow
from models import ok
from routers.deps import get_current_user

router = APIRouter(prefix="/annotations", tags=["annotations"])


@router.get("")
def get_all_annotations(user_id: str = Depends(get_current_user)) -> dict:
    with get_session() as session:
        highlights = session.query(HighlightRow).filter(HighlightRow.user_id == user_id).all()
        notes = session.query(NoteRow).filter(NoteRow.user_id == user_id).all()
        quotes = session.query(QuoteRow).filter(QuoteRow.user_id == user_id).all()

        book_ids = (
            {h.book_id for h in highlights}
            | {n.book_id for n in notes}
            | {q.book_id for q in quotes}
        )

        books: dict[str, BookRow] = {}
        if book_ids:
            books = {b.id: b for b in session.query(BookRow).filter(BookRow.id.in_(book_ids)).all()}

        entries: dict[str, dict] = {}
        for bid in book_ids:
            book = books.get(bid)
            entries[bid] = {
                "book_id": bid,
                "book_title": book.title if book else "Unknown",
                "book_author": book.author if book else "Unknown",
                "highlights": [],
                "notes": [],
                "quotes": [],
            }

        for h in highlights:
            entries[h.book_id]["highlights"].append({
                "id": h.id,
                "text": h.text,
                "page_number": h.page_number,
                "created_at": h.created_at.isoformat(),
            })
        for n in notes:
            entries[n.book_id]["notes"].append({
                "id": n.id,
                "selected_text": n.selected_text,
                "note": n.note,
                "page_number": n.page_number,
                "created_at": n.created_at.isoformat(),
            })
        for q in quotes:
            entries[q.book_id]["quotes"].append({
                "id": q.id,
                "text": q.text,
                "page_number": q.page_number,
                "favorited": q.favorited,
                "created_at": q.created_at.isoformat(),
            })

        return ok(list(entries.values()))
