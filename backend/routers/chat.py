import os
from fastapi import APIRouter, Depends
from database import get_session, BookRow
from models import ok, err, ChatRequest
from routers.deps import get_current_user
import vector_store

router = APIRouter(tags=["chat"])


@router.post("/chat")
def global_chat(body: ChatRequest, user_id: str = Depends(get_current_user)) -> dict:
    with get_session() as session:
        books = session.query(BookRow).filter(BookRow.current_page > 0).all()
        book_info = [
            (b.id, b.title, b.author, b.current_page, b.page_count)
            for b in books
        ]

    if not book_info:
        return ok({"reply": "You haven't started reading any books yet. Add a book to your library and start reading to chat with the AI."})

    # Query each book's vector store up to its current page
    all_results: list[dict] = []
    for book_id, title, author, current_page, _page_count in book_info:
        results = vector_store.query_up_to_page(book_id, body.message, current_page, n=8)
        for r in results:
            all_results.append({**r, "_book_title": title, "_book_author": author})

    if not all_results:
        return ok({"reply": "The books haven't been indexed yet. Please wait a moment and try again."})

    # Keep the most relevant results, then sort chronologically per book
    all_results.sort(key=lambda x: x["distance"])
    top = all_results[:20]
    top.sort(key=lambda x: (x["_book_title"], x["metadata"].get("page_number", 0)))

    books_summary = "\n".join(
        f'- "{title}" by {author} (read pages 1–{cp} of {pc})'
        for _, title, author, cp, pc in book_info
    )

    context_parts: list[str] = []
    current_book = None
    for r in top:
        bt = r["_book_title"]
        if bt != current_book:
            context_parts.append(f"[{bt}]")
            current_book = bt
        context_parts.append(r["text"])

    context = "\n\n".join(context_parts)

    system = (
        "You are a reading assistant with knowledge of what the user has read across multiple books. "
        "Only discuss content from pages already read — never spoil what happens later. "
        "Base your answers on the provided passages.\n\n"
        f"BOOKS IN PROGRESS:\n{books_summary}\n\n"
        f"RELEVANT PASSAGES:\n{context}"
    )

    try:
        import ollama as _ollama
        response = _ollama.chat(
            model=os.getenv("CHAT_MODEL", "llama3"),
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": body.message},
            ],
        )
        try:
            reply = response.message.content
        except AttributeError:
            reply = response["message"]["content"]
    except Exception as e:
        return err(f"LLM unavailable: {e}", 503)

    return ok({"reply": reply})
