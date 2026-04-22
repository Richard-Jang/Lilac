import warnings
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from typing import Any

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

PAGE_SIZE = 1800


def _extract_heading(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in ("h1", "h2", "h3", "h4"):
        el = soup.find(tag)
        if el:
            text = el.get_text(strip=True)
            if text:
                return text
    return ""


def _strip_html(html: str) -> str:
    """Strip HTML to plain text, removing the chapter heading and preserving paragraph breaks."""
    soup = BeautifulSoup(html, "lxml")
    first_heading = soup.find(["h1", "h2"])
    if first_heading:
        first_heading.decompose()
    raw = soup.get_text(separator="\n")
    # Group non-empty lines into paragraphs separated by blank lines
    lines = [line.strip() for line in raw.splitlines()]
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines:
        if line:
            current.append(line)
        else:
            if current:
                paragraphs.append(" ".join(current))
                current = []
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def _build_toc_map(toc) -> dict[str, str]:
    result: dict[str, str] = {}

    def walk(items: list) -> None:
        for entry in items:
            link = entry[0] if isinstance(entry, tuple) else entry
            children = entry[1] if isinstance(entry, tuple) else []
            if hasattr(link, "href") and getattr(link, "title", None):
                name = link.href.split("#")[0]
                if name not in result:
                    result[name] = link.title
            walk(children)

    walk(toc)
    return result


def _split_pages(text: str) -> list[str]:
    """Split text into ~PAGE_SIZE-char pages, always completing the current word."""
    pages: list[str] = []
    start = 0
    while start < len(text):
        end = start + PAGE_SIZE
        if end >= len(text):
            pages.append(text[start:].strip())
            break
        while end < len(text) and text[end] not in (".", "!", "\n", "\t"):
            end += 1
        if end < len(text) and text[end] in (".", "!"):
            end += 1
        pages.append(text[start:end].strip())
        start = end + 1
    return [p for p in pages if p]


def parse(path: str) -> tuple[str, str, Any, list[dict]]:
    """
    Parse an epub and return (title, author, cover_image, pages).
    Each page: {page_number, text, label}.
    Chapter boundaries are always page boundaries.
    Chapter headings are stripped from the text body (they become the label).
    """
    book = epub.read_epub(path, options={"ignore_ncx": False})

    title: str = book.get_metadata("DC", "title")[0][0] if book.get_metadata("DC", "title") else ""
    creators = book.get_metadata("DC", "creator")
    author: str = creators[0][0] if creators else ""
    cover_image = book.get_item_with_id("cover-image")

    toc_map = _build_toc_map(book.toc)

    pages: list[dict] = []
    page_number = 0
    chapter_num = 0

    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        raw_html = item.get_content().decode("utf-8", errors="ignore")
        text = _strip_html(raw_html).strip()
        if not text:
            continue

        chapter_num += 1
        item_name = item.get_name()

        chapter_label = (
            toc_map.get(item_name)
            or toc_map.get(item_name.split("/")[-1])
            or _extract_heading(raw_html)
            or f"Chapter {chapter_num}"
        )

        for page_text in _split_pages(text):
            pages.append({
                "page_number": page_number,
                "text": page_text,
                "label": chapter_label,
            })
            page_number += 1

    return title, author, cover_image, pages