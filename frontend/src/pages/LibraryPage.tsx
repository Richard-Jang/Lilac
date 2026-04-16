import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LuLayoutGrid,
  LuList,
  LuPlus,
  LuSearch,
  LuListFilter,
  LuClock,
} from "react-icons/lu";
import { BOOKS, type Book, type BookStatus } from "../data/books";

type FilterTab = "all" | BookStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Books" },
  { key: "reading", label: "Currently Reading" },
  { key: "finished", label: "Finished" },
  { key: "want", label: "Want to Read" },
];

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
  return (
    <motion.div
      className="w-40 cursor-pointer"
      variants={gridItemVariants}
      onClick={() => navigate(`/reader/${book.id}`)}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className="relative w-40 h-[220px] rounded-xl overflow-hidden shadow"
        style={{ background: book.color }}
      >
        <span className="absolute top-3 left-3 right-3 text-white/30 text-[10px] font-semibold leading-tight">
          {book.title}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex flex-col justify-end p-3 gap-1.5">
          <div>
            <p className="text-white text-[11px] font-bold leading-tight m-0">{book.title}</p>
            <p className="text-white/75 text-[10px] m-0">{book.author}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/85 text-[9px] font-semibold">
              {book.progress}% completed
            </span>
            <span className="text-white/60 text-[9px]">{book.lastActivity}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ListRow({ book }: { book: Book }) {
  const navigate = useNavigate();
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
        style={{ background: book.color }}
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
              animate={{ width: `${book.progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <span className="text-[13px] font-bold text-violet-600 min-w-[32px] text-right">
            {book.progress}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-[100px] text-right">
        <div className="flex items-center justify-end gap-1 text-[10px] font-semibold tracking-widest text-gray-400">
          <LuClock size={12} />
          <span>LAST ACTIVITY</span>
        </div>
        <span className="text-[13px] text-gray-700">{book.lastActivity}</span>
      </div>
    </motion.div>
  );
}

export default function LibraryPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const filtered = BOOKS.filter((b) => {
    const matchesTab = tab === "all" || b.status === tab;
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const contentKey = `${tab}-${view}-${search}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
            You have {BOOKS.length} books in your collection.
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
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <LuPlus size={16} />
            Add Book
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
      </div>
    </div>
  );
}
