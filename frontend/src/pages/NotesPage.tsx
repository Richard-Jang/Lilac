import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LuHighlighter, LuStickyNote, LuQuote, LuTrash2, LuBookOpen, LuHeart } from "react-icons/lu";
import { api } from "../api/client";
import type { AllAnnotationsEntry, Highlight, Note, Quote } from "../api/types";

type Tab = "highlights" | "notes" | "quotes";

interface FlatHighlight extends Highlight {
  book_id: string;
  book_title: string;
  book_author: string;
}

interface FlatNote extends Note {
  book_id: string;
  book_title: string;
  book_author: string;
}

interface FlatQuote extends Quote {
  book_id: string;
  book_title: string;
  book_author: string;
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {icon}
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}

export default function NotesPage() {
  const [entries, setEntries] = useState<AllAnnotationsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("highlights");

  useEffect(() => {
    api.annotations
      .getAll()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const highlights: FlatHighlight[] = entries.flatMap((e) =>
    e.highlights.map((h) => ({ ...h, book_id: e.book_id, book_title: e.book_title, book_author: e.book_author }))
  );
  const notes: FlatNote[] = entries.flatMap((e) =>
    e.notes.map((n) => ({ ...n, book_id: e.book_id, book_title: e.book_title, book_author: e.book_author }))
  );
  const quotes: FlatQuote[] = entries.flatMap((e) =>
    e.quotes.map((q) => ({ ...q, book_id: e.book_id, book_title: e.book_title, book_author: e.book_author }))
  );

  async function removeHighlight(h: FlatHighlight) {
    try {
      await api.books.deleteHighlight(h.book_id, h.id);
      setEntries((prev) =>
        prev.map((e) =>
          e.book_id === h.book_id ? { ...e, highlights: e.highlights.filter((x) => x.id !== h.id) } : e
        )
      );
    } catch {}
  }

  async function removeNote(n: FlatNote) {
    try {
      await api.books.deleteNote(n.book_id, n.id);
      setEntries((prev) =>
        prev.map((e) =>
          e.book_id === n.book_id ? { ...e, notes: e.notes.filter((x) => x.id !== n.id) } : e
        )
      );
    } catch {}
  }

  async function removeQuote(q: FlatQuote) {
    try {
      await api.books.deleteQuote(q.book_id, q.id);
      setEntries((prev) =>
        prev.map((e) =>
          e.book_id === q.book_id ? { ...e, quotes: e.quotes.filter((x) => x.id !== q.id) } : e
        )
      );
    } catch {}
  }

  async function toggleFavorite(q: FlatQuote) {
    try {
      const { favorited } = await api.books.favoriteQuote(q.book_id, q.id);
      setEntries((prev) =>
        prev.map((e) =>
          e.book_id === q.book_id
            ? { ...e, quotes: e.quotes.map((x) => (x.id === q.id ? { ...x, favorited } : x)) }
            : e
        )
      );
    } catch {}
  }

  const tabDefs = [
    { key: "highlights" as Tab, label: "Highlights", icon: <LuHighlighter size={14} />, count: highlights.length },
    { key: "notes" as Tab, label: "Notes", icon: <LuStickyNote size={14} />, count: notes.length },
    { key: "quotes" as Tab, label: "Quotes", icon: <LuQuote size={14} />, count: quotes.length },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>;
  }

  const totalCount = highlights.length + notes.length + quotes.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-0 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount === 0
            ? "No annotations yet"
            : `${totalCount} annotation${totalCount !== 1 ? "s" : ""} across ${entries.length} book${entries.length !== 1 ? "s" : ""}`}
        </p>

        <div className="flex gap-1 mt-6 border-b border-gray-100">
          {tabDefs.map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === key
                  ? "text-violet-600 border-violet-600"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              {icon}
              {label}
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  tab === key ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === "highlights" && (
          <div className="flex flex-col gap-3 max-w-2xl">
            {highlights.length === 0 ? (
              <EmptyState
                icon={<LuHighlighter size={28} className="text-yellow-400" />}
                title="No highlights yet"
                description="Select text while reading to save highlights."
              />
            ) : (
              highlights.map((h) => (
                <div key={h.id} className="group bg-yellow-50 border border-yellow-100 rounded-2xl p-4 relative">
                  <p className="text-sm text-gray-800 leading-relaxed">{h.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link
                      to={`/reader/${h.book_id}`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors"
                    >
                      <LuBookOpen size={11} />
                      {h.book_title}
                    </Link>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">Page {h.page_number}</span>
                  </div>
                  <button
                    onClick={() => removeHighlight(h)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
                  >
                    <LuTrash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="flex flex-col gap-3 max-w-2xl">
            {notes.length === 0 ? (
              <EmptyState
                icon={<LuStickyNote size={28} className="text-blue-400" />}
                title="No notes yet"
                description="Select text while reading and add a note."
              />
            ) : (
              notes.map((n) => (
                <div key={n.id} className="group bg-white border border-gray-100 rounded-2xl p-4 relative shadow-sm">
                  <p className="text-sm italic text-blue-600 mb-2">"{n.selected_text}"</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link
                      to={`/reader/${n.book_id}`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors"
                    >
                      <LuBookOpen size={11} />
                      {n.book_title}
                    </Link>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">Page {n.page_number}</span>
                  </div>
                  <button
                    onClick={() => removeNote(n)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
                  >
                    <LuTrash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "quotes" && (
          <div className="flex flex-col gap-3 max-w-2xl">
            {quotes.length === 0 ? (
              <EmptyState
                icon={<LuQuote size={28} className="text-purple-400" />}
                title="No quotes yet"
                description="Select text while reading to save a quote with attribution."
              />
            ) : (
              quotes.map((q) => (
                <div key={q.id} className="group bg-white border border-gray-100 rounded-2xl p-5 relative shadow-sm">
                  <p className="text-base leading-relaxed text-gray-800 italic pr-8">"{q.text}"</p>
                  <p className="text-sm text-purple-600 font-medium mt-3">
                    — {q.book_title}
                    {q.book_author ? `, ${q.book_author}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      to={`/reader/${q.book_id}`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors"
                    >
                      <LuBookOpen size={11} />
                      {q.book_title}
                    </Link>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">Page {q.page_number}</span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFavorite(q)}
                      className={`transition-colors ${q.favorited ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                      title={q.favorited ? "Remove from favorites" : "Add to favorites"}
                    >
                      <LuHeart size={14} className={q.favorited ? "fill-red-500" : ""} />
                    </button>
                    <button onClick={() => removeQuote(q)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <LuTrash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
