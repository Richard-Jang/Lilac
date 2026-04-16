import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

_CHUNK_SIZE = 2000   # characters (~500 tokens)
_CHUNK_OVERLAP = 200


def _strip_html(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    return soup.get_text(separator=" ", strip=True)


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def parse(path: str) -> tuple[str, str, list[dict]]:
    """
    Parse an epub file and return (title, author, chunks).
    Each chunk: {text, chapter, chunk_index}
    """
    book = epub.read_epub(path, options={"ignore_ncx": True})

    title: str = book.get_metadata("DC", "title")[0][0] if book.get_metadata("DC", "title") else ""
    creators = book.get_metadata("DC", "creator")
    author: str = creators[0][0] if creators else ""

    chunks: list[dict] = []
    chunk_index = 0

    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        chapter_name = item.get_name()
        raw_html = item.get_content().decode("utf-8", errors="ignore")
        text = _strip_html(raw_html)

        if not text.strip():
            continue

        for segment in _chunk_text(text, _CHUNK_SIZE, _CHUNK_OVERLAP):
            segment = segment.strip()
            if not segment:
                continue
            chunks.append({
                "text": segment,
                "chapter": chapter_name,
                "chunk_index": chunk_index,
            })
            chunk_index += 1

    return title, author, chunks
