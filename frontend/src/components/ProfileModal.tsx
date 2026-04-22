import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LuX, LuHeart, LuBookOpen } from "react-icons/lu";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Book, AllAnnotationsEntry } from "../api/types";

interface ProfileModalProps {
  onClose: () => void;
}

function getStoredUser(): { username: string } {
  try {
    return JSON.parse(localStorage.getItem("lilac_user") || "{}");
  } catch {
    return { username: "" };
  }
}

function computeStats(books: Book[]) {
  const totalPages = books.reduce((s, b) => s + b.current_page, 0);
  const totalWords = books.reduce((s, b) => {
    const fraction = b.page_count > 0 ? b.current_page / b.page_count : 0;
    return s + Math.round((fraction * b.char_count) / 5);
  }, 0);
  return { totalPages, totalWords };
}

function formatWords(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { username } = getStoredUser();
  const initials = (username || "?").slice(0, 2).toUpperCase();

  const [books, setBooks] = useState<Book[]>([]);
  const [entries, setEntries] = useState<AllAnnotationsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.books.list(), api.annotations.getAll()])
      .then(([b, e]) => { setBooks(b); setEntries(e); })
      .finally(() => setLoading(false));
  }, []);

  const { totalPages, totalWords } = computeStats(books);

  const favoritedQuotes = entries.flatMap((e) =>
    e.quotes
      .filter((q) => q.favorited)
      .map((q) => ({ ...q, book_id: e.book_id, book_title: e.book_title, book_author: e.book_author }))
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 flex items-stretch justify-end z-[100]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white w-full max-w-[700px] flex flex-col overflow-y-auto"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <LuBookOpen size={16} />
            <span>Profile</span>
          </div>
          <motion.button
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={onClose}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          >
            <LuX size={20} />
          </motion.button>
        </div>

        {/* Body */}
        <div className="px-8 py-10 flex flex-col items-center">
          {/* Avatar */}
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-3 select-none"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {initials}
          </motion.div>

          <motion.p
            className="text-lg font-bold text-gray-900 mb-1"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {username || "Reader"}
          </motion.p>

          {/* My Library heading */}
          <motion.h2
            className="text-[13px] font-bold tracking-widest text-gray-400 uppercase mt-6 mb-3 self-start"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            My Library
          </motion.h2>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 w-full border border-gray-200 rounded-xl overflow-hidden mb-10"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {[
              { value: loading ? "—" : String(books.length), label: "BOOKS" },
              { value: loading ? "—" : String(totalPages), label: "PAGES READ" },
              { value: loading ? "—" : formatWords(totalWords), label: "WORDS READ" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center py-5 px-4 gap-1 ${i > 0 ? "border-l border-gray-200" : ""}`}
              >
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-400">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Favorited Quotes */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 font-semibold text-gray-900 text-[15px] mb-4">
              <LuHeart size={16} className="text-red-500 fill-red-500" />
              <span>Favorited Quotes</span>
              {favoritedQuotes.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({favoritedQuotes.length})</span>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
              ) : favoritedQuotes.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  No favorited quotes yet. Heart a quote in the Notes page.
                </div>
              ) : (
                favoritedQuotes.map((q) => (
                  <div key={q.id} className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-sm text-gray-800 italic leading-relaxed">"{q.text}"</p>
                    <p className="text-xs text-purple-600 font-medium mt-2">
                      — {q.book_title}{q.book_author ? `, ${q.book_author}` : ""}
                    </p>
                    <Link
                      to={`/reader/${q.book_id}`}
                      onClick={onClose}
                      className="text-[10px] text-gray-400 hover:text-violet-600 transition-colors mt-1 inline-block"
                    >
                      Open book →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
