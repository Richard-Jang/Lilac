import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LuLayoutGrid,
  LuList,
  LuPlus,
  LuSearch,
  LuListFilter,
  LuClock,
  LuLoader,
} from "react-icons/lu";
import { api } from "../api/client";
import type { Book } from "../api/types";

type FilterTab = "all" | "reading" | "finished";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Books" },
  { key: "reading", label: "Currently Reading" },
  { key: "finished", label: "Finished" },
];

const COLORS = [
  "#2563EB", "#B91C1C", "#065F46", "#D97706",
  "#BE185D", "#1F2937", "#7C3AED", "#0369A1",
];

const API_BASE = "http://localhost:8000";

function bookColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function coverUrl(book: Book): string | null {
  if (!book.cover_path) return null;
  const filename = book.cover_path.split("/").pop();
  return filename ? `${API_BASE}/uploads/${filename}` : null;
}

function bookProgress(book: Book): number {
  if (book.page_count === 0) return 0;
  return Math.round((book.current_page / book.page_count) * 100);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
  exit: {},
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
  exit: { opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.12 } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, x: 16, transition: { duration: 0.1 } },
};

function GridCard({ book }: { book: Book }) {
  const navigate = useNavigate();
  const color = bookColor(book.id);
  const img = coverUrl(book);
  const progress = bookProgress(book);
  return (
    <motion.div
      className="w-48 cursor-pointer"
      variants={gridItemVariants}
      onClick={() => navigate(`/reader/${book.id}`)}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className="relative w-48 h-[272px] rounded-xl overflow-hidden shadow-md"
        style={
          img
            ? { backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: color }
        }
      >
        {!img && (
          <span className="absolute top-3 left-3 right-3 text-white/30 text-[10px] font-semibold leading-tight">
            {book.title}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-3 gap-1.5">
          <div>
            <p className="text-white text-[11px] font-bold leading-tight m-0">{book.title}</p>
            <p className="text-white/75 text-[10px] m-0">{book.author}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/85 text-[9px] font-semibold">
              {progress}% completed
            </span>
            <span className="text-white/60 text-[9px]">{relativeTime(book.uploaded_at)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ListRow({ book }: { book: Book }) {
  const navigate = useNavigate();
  const color = bookColor(book.id);
  const progress = bookProgress(book);
  return (
    <motion.div
      className="flex items-center gap-5 py-4 border-b border-gray-200 cursor-pointer px-3 rounded-lg"
      variants={listItemVariants}
      onClick={() => navigate(`/reader/${book.id}`)}
      whileHover={{ x: 4, backgroundColor: "#f9fafb", transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className="w-14 h-20 rounded-md flex items-end p-1.5 flex-shrink-0 shadow-sm"
        style={{ background: color }}
      >
        <span className="text-white/50 text-[8px] font-semibold leading-tight">{book.title}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900 m-0 mb-1">{book.title}</p>
        <p className="text-sm text-gray-400 m-0">{book.author}</p>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[160px]">
        <span className="text-[11px] font-semibold tracking-wide text-gray-400">Progress</span>
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <span className="text-[13px] font-bold text-violet-600 min-w-[32px] text-right">
            {progress}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-[100px] text-right">
        <div className="flex items-center justify-end gap-1 text-[10px] font-semibold tracking-widest text-gray-400">
          <LuClock size={12} />
          <span>LAST ACTIVITY</span>
        </div>
        <span className="text-[13px] text-gray-700">{relativeTime(book.uploaded_at)}</span>
      </div>
    </motion.div>
  );
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchBooks() {
    try {
      const data = await api.books.list();
      setBooks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBooks(); }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      await api.books.upload(file);
      await fetchBooks();
    } finally {
      setUploading(false);
    }
  }

  const filtered = books.filter((b) => {
    const matchesTab =
      tab === "all" ||
      (tab === "reading" ? !b.completed : b.completed);
    const q = search.toLowerCase();
    const matchesSearch = b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const contentKey = `${tab}-${view}-${search}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <motion.div
        className="flex items-start justify-between px-8 pt-7"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 leading-tight">
            Your Library
          </h1>
          <p className="text-sm text-gray-400 m-0">
            {loading ? "Loading…" : `You have ${books.length} book${books.length === 1 ? "" : "s"} in your collection.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-gray-200 transition-colors ${
              view === "grid" ? "text-gray-900 bg-gray-100 border-gray-300" : "text-gray-400"
            }`}
            onClick={() => setView("grid")}
            aria-label="Grid view"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LuLayoutGrid size={16} />
          </motion.button>
          <motion.button
            className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-gray-200 transition-colors ${
              view === "list" ? "text-gray-900 bg-gray-100 border-gray-300" : "text-gray-400"
            }`}
            onClick={() => setView("list")}
            aria-label="List view"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LuList size={16} />
          </motion.button>
          <motion.button
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <LuLoader size={16} className="animate-spin" /> : <LuPlus size={16} />}
            {uploading ? "Uploading…" : "Add Book"}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center justify-between px-8 border-b border-gray-200 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.2 }}
      >
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors mb-[-1px] ${
                tab === t.key ? "text-violet-600" : "text-gray-400 hover:text-gray-700"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {tab === t.key && (
                <motion.div
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-violet-600 rounded-t-sm"
                  layoutId="tab-underline"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-[7px] bg-gray-50">
            <LuSearch size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search library..."
              className="w-40 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <motion.button
            className="flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LuListFilter size={16} />
          </motion.button>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Loading your library…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            {books.length === 0 ? "Upload an epub or pdf to get started." : "No books match your search."}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div
                key={contentKey}
                className="flex flex-wrap gap-5"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {filtered.map((book) => (
                  <GridCard key={book.id} book={book} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={contentKey}
                className="flex flex-col"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {filtered.map((book) => (
                  <ListRow key={book.id} book={book} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
