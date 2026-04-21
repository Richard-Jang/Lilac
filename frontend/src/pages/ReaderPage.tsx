import { useState, useEffect, useLayoutEffect, useRef, Fragment, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuMoon,
  LuSun,
  LuType,
  LuHighlighter,
  LuBookmark,
  LuMenu,
  LuX,
  LuBookOpen,
} from "react-icons/lu";
import { api } from "../api/client";
import type { Book, Page } from "../api/types";

const FONT_SIZES = [14, 16, 18, 20, 22];
const LINE_HEIGHT = 1.6;
// Matches pt-8 (32px) + pb-20 (80px) on the content wrapper
const PAD_TOP = 32;
const PAD_BOTTOM = 80;
// Matches px-6 * 2
const PAD_H = 48;
// Total height consumed by the chapter heading block (text + margin below)
const CHAPTER_HEADING_PX = 100;

const SENTENCE_END = /[.!?]["'\u2019\u201d]?\s*$/;

interface View {
  text: string;
  label: string;
  backendPage: number;
  isFirstOfChapter: boolean;
}

function fillMeasure(el: HTMLDivElement, text: string): void {
  el.innerHTML = "";
  const paras = text.split(/\n\n+/).filter(Boolean);
  paras.forEach((para, i) => {
    const p = document.createElement("p");
    p.style.marginBottom = "28px";
    p.textContent = para;
    el.appendChild(p);
    if (i < paras.length - 1) {
      const sep = document.createElement("div");
      sep.style.textAlign = "center";
      sep.style.marginBottom = "28px";
      sep.textContent = "· · ·";
      el.appendChild(sep);
    }
  });
  const last = el.lastElementChild as HTMLElement | null;
  if (last) last.style.marginBottom = "0";
}

function splitAtSentence(words: string[], lo: number): number {
  // Walk back from `lo` to find the last sentence-ending word
  for (let i = lo - 1; i >= Math.max(0, lo - 200); i--) {
    if (SENTENCE_END.test(words[i])) return i + 1;
  }
  return lo; // fallback: word boundary
}

function buildViews(pages: Page[], el: HTMLDivElement): View[] {
  const views: View[] = [];
  const seenLabels = new Set<string>();
  const fullHeight = el.clientHeight;

  let queue = pages.map((p) => ({ text: p.text, label: p.label, bp: p.page_number }));

  while (queue.length > 0) {
    const { label, bp } = queue[0];
    const isFirstOfChapter = !seenLabels.has(label);
    seenLabels.add(label);

    // Reduce available height for the chapter heading on first view
    el.style.height = `${isFirstOfChapter ? fullHeight - CHAPTER_HEADING_PX : fullHeight}px`;

    let viewText = queue[0].text;
    let consumed = 1;

    fillMeasure(el, viewText);

    if (el.scrollHeight > el.clientHeight) {
      // Overflow — binary-search for word count that fits
      const words = viewText.split(" ");
      let lo = 1;
      let hi = words.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        fillMeasure(el, words.slice(0, mid).join(" "));
        if (el.scrollHeight <= el.clientHeight) lo = mid;
        else hi = mid - 1;
      }
      // Snap split point back to the nearest sentence boundary
      const splitAt = splitAtSentence(words, lo);
      const fitting = words.slice(0, splitAt).join(" ");
      const rest = words.slice(splitAt).join(" ").trim();

      views.push({ text: fitting, label, backendPage: bp, isFirstOfChapter });
      el.style.height = `${fullHeight}px`;
      queue = rest
        ? [{ text: rest, label, bp }, ...queue.slice(1)]
        : queue.slice(1);
      continue;
    }

    // Try pulling in next same-chapter pages to fill remaining space
    let partial: { text: string; label: string; bp: number } | null = null;
    let qi = 1;
    while (qi < queue.length && queue[qi].label === label) {
      const candidate = viewText + "\n\n" + queue[qi].text;
      fillMeasure(el, candidate);
      if (el.scrollHeight > el.clientHeight) {
        // Binary search: how many words of queue[qi] fit after viewText?
        const nextWords = queue[qi].text.split(" ");
        let lo = 0;
        let hi = nextWords.length - 1;
        while (lo < hi) {
          const mid = Math.floor((lo + hi + 1) / 2);
          fillMeasure(el, viewText + "\n\n" + nextWords.slice(0, mid).join(" "));
          if (el.scrollHeight <= el.clientHeight) lo = mid;
          else hi = mid - 1;
        }
        if (lo > 0) {
          const splitAt = splitAtSentence(nextWords, lo);
          if (splitAt > 0) {
            const fitting = nextWords.slice(0, splitAt).join(" ");
            const rest = nextWords.slice(splitAt).join(" ").trim();
            viewText += "\n\n" + fitting;
            consumed++;
            if (rest) partial = { text: rest, label: queue[qi].label, bp: queue[qi].bp };
          }
        }
        break;
      }
      viewText = candidate;
      consumed++;
      qi++;
    }

    views.push({ text: viewText, label, backendPage: bp, isFirstOfChapter });
    el.style.height = `${fullHeight}px`;
    const remaining = queue.slice(consumed);
    queue = partial ? [partial, ...remaining] : remaining;
  }

  return views;
}

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<View[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [fontSize, setFontSize] = useState(2);
  const [darkMode, setDarkMode] = useState(false);
  const [progressMode, setProgressMode] = useState<"percent" | "page">("percent");
  const [menuOpen, setMenuOpen] = useState(false);

  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const syncedBPRef = useRef(-1);
  const currentBPRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    api.books
      .get(id)
      .then(({ book: b, pages: ps }) => {
        setBook(b);
        setPages(ps);
        currentBPRef.current = b.current_page;
      })
      .finally(() => setLoading(false));
  }, [id]);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure || !pages.length) return;

    const w = Math.min(outer.offsetWidth - PAD_H, 640);
    const h = outer.offsetHeight - PAD_TOP - PAD_BOTTOM;
    if (w <= 0 || h <= 0) return;

    measure.style.width = `${w}px`;
    measure.style.height = `${h}px`;
    measure.style.fontSize = `${FONT_SIZES[fontSize]}px`;
    measure.style.lineHeight = String(LINE_HEIGHT);

    const built = buildViews(pages, measure);
    setViews(built);

    const targetBP = currentBPRef.current;
    const idx = built.findIndex((v) => v.backendPage >= targetBP);
    setViewIndex(Math.max(0, idx === -1 ? built.length - 1 : idx));
  }, [pages, fontSize]);

  useEffect(() => {
    if (!id || !views.length) return;
    const bp = views[viewIndex]?.backendPage ?? 0;
    if (bp === syncedBPRef.current) return;
    syncedBPRef.current = bp;
    currentBPRef.current = bp;
    api.books.setPage(id, bp).then(setBook).catch(() => {});
  }, [viewIndex, views, id]);

  const chapters = useMemo(() => {
    const seen = new Set<string>();
    return pages
      .filter((p) => {
        if (seen.has(p.label)) return false;
        seen.add(p.label);
        return true;
      })
      .map((p) => ({ label: p.label, backendPage: p.page_number }));
  }, [pages]);

  function jumpToChapter(label: string) {
    const idx = views.findIndex((v) => v.label === label);
    if (idx !== -1) setViewIndex(idx);
    setMenuOpen(false);
  }

  const currentView = views[viewIndex];
  const paragraphs = currentView?.text.split(/\n\n+/).filter(Boolean) ?? [];
  const chapterNumber = chapters.findIndex((c) => c.label === currentView?.label) + 1;

  const progressLabel = views.length
    ? progressMode === "percent"
      ? `${Math.round((viewIndex / Math.max(1, views.length - 1)) * 100)}%`
      : `${viewIndex + 1} / ${views.length}`
    : "—";

  const ctrlBtn = `flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
    darkMode
      ? "text-gray-400 hover:text-gray-100 hover:bg-white/10"
      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
  }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Book not found.{" "}
        <button className="ml-2 text-violet-600 underline" onClick={() => navigate("/library")}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full transition-colors duration-200 ${
        darkMode ? "bg-[#1a1a2e] text-gray-300" : "bg-white text-gray-700"
      }`}
    >
      {/* Off-screen measurement div */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          overflow: "hidden",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />

      {/* Chapter sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              className="relative ml-auto h-full w-72 bg-white flex flex-col shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <LuBookOpen size={15} />
                  <span>Chapters</span>
                </div>
                <button
                  className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <LuX size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {chapters.map((ch, i) => {
                  const isCurrent = currentView?.label === ch.label;
                  return (
                    <button
                      key={ch.label}
                      className={`w-full text-left px-5 py-3 transition-colors ${
                        isCurrent
                          ? "text-violet-600 font-semibold bg-violet-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => jumpToChapter(ch.label)}
                    >
                      <span className="block text-[10px] font-semibold tracking-widest text-gray-400 mb-0.5">
                        CHAPTER {i + 1}
                      </span>
                      <span className="text-sm leading-snug">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <motion.div
        className={`grid grid-cols-3 items-center px-4 py-3.5 border-b transition-colors flex-shrink-0 ${
          darkMode ? "border-white/10" : "border-gray-200"
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Left */}
        <div className="flex items-center gap-1">
          <motion.button
            className={ctrlBtn}
            onClick={() => navigate("/library")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuChevronLeft size={18} />
          </motion.button>
          <span
            className={`text-sm font-semibold truncate max-w-[140px] ${
              darkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {book.title}
          </span>
        </div>

        {/* Center */}
        <div className="flex justify-center">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full truncate max-w-[180px] ${
              darkMode ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"
            }`}
            title={currentView?.label}
          >
            {currentView?.label ?? ""}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 justify-end">
          <motion.button
            className={ctrlBtn}
            onClick={() => setDarkMode((d) => !d)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {darkMode ? <LuSun size={16} /> : <LuMoon size={16} />}
          </motion.button>
          <div className={`w-px h-4 ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
            <LuType size={13} />
            {FONT_SIZES[fontSize]}
          </span>
          <motion.button
            className={ctrlBtn}
            onClick={() => setFontSize((f) => Math.max(0, f - 1))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-xs font-bold">A</span>
          </motion.button>
          <motion.button
            className={ctrlBtn}
            onClick={() => setFontSize((f) => Math.min(FONT_SIZES.length - 1, f + 1))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-sm font-bold">A</span>
          </motion.button>
          <div className={`w-px h-4 ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
          <motion.button
            className={ctrlBtn}
            onClick={() => setMenuOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuMenu size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Content area — no scrolling */}
      <div
        ref={outerRef}
        className="flex-1 overflow-hidden flex justify-center px-6 pt-8 pb-20"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={viewIndex}
            className="max-w-[640px] w-full overflow-hidden"
            style={{ fontSize: FONT_SIZES[fontSize], lineHeight: LINE_HEIGHT }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {/* Chapter heading — only on the first view of each chapter */}
            {currentView?.isFirstOfChapter && (
              <div
                className="overflow-hidden"
                style={{ height: CHAPTER_HEADING_PX, marginBottom: 0 }}
              >
                <p
                  className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {book.title}
                </p>
                <h2
                  className={`font-bold leading-tight ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                  style={{ fontSize: Math.round(FONT_SIZES[fontSize] * 1.6) }}
                >
                  {currentView.label}
                </h2>
              </div>
            )}

            {paragraphs.length > 0 ? (
              paragraphs.map((para, i) => (
                <Fragment key={i}>
                  <p className="mb-7">{para}</p>
                </Fragment>
              ))
            ) : (
              <p className="text-gray-400 text-center mt-16">No content.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2, type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="flex items-center bg-white rounded-full shadow-lg px-1 py-2">
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewIndex((i) => Math.max(0, i - 1))}
            disabled={viewIndex === 0}
          >
            <LuChevronLeft size={18} />
          </motion.button>

          <motion.button
            className="flex flex-col items-center px-5 min-w-[88px] cursor-pointer"
            onClick={() => setProgressMode((m) => (m === "percent" ? "page" : "percent"))}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">
              {progressMode === "percent" ? "Progress" : "Page"}
            </span>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{progressLabel}</span>
          </motion.button>

          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewIndex((i) => Math.min(views.length - 1, i + 1))}
            disabled={viewIndex === views.length - 1}
          >
            <LuChevronRight size={18} />
          </motion.button>
        </div>

        <div className="flex gap-2">
          <motion.button
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-gray-400 shadow-md hover:text-violet-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuHighlighter size={18} />
          </motion.button>
          <motion.button
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-violet-600 shadow-md transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => id && book && api.books.addBookmark(id, book.current_page)}
          >
            <LuBookmark size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
