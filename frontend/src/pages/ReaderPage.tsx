import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  Fragment,
  type ReactNode,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuMoon,
  LuSun,
  LuType,
  LuBookmark,
  LuMenu,
  LuX,
  LuBookOpen,
  LuHighlighter,
  LuStickyNote,
  LuQuote,
  LuMessageSquare,
  LuSend,
  LuTrash2,
  LuSearch,
} from "react-icons/lu";
import { api } from "../api/client";
import type { Book, Page, BookAnnotations, Highlight, Note, Quote } from "../api/types";

const FONT_SIZES = [14, 16, 18, 20, 22];
const LINE_HEIGHT = 1.6;
const PAD_TOP = 32;
const PAD_BOTTOM = 80;
const PAD_H = 48;
const CHAPTER_HEADING_PX = 100;
const SKELETON_WIDTHS = ["100%", "92%", "87%", "100%", "95%", "80%", "100%", "88%", "96%", "74%"];

const SENTENCE_END = /[.!?]["''"]?\s*$/;

interface View {
  text: string;
  label: string;
  backendPage: number;
  isFirstOfChapter: boolean;
}

interface SelectionInfo {
  text: string;
  top: number;
  left: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnnotationMark {
  text: string;
  type: "highlight" | "note" | "quote" | "search";
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
  for (let i = lo - 1; i >= Math.max(0, lo - 200); i--) {
    if (SENTENCE_END.test(words[i])) return i + 1;
  }
  return lo;
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

    el.style.height = `${isFirstOfChapter ? fullHeight - CHAPTER_HEADING_PX : fullHeight}px`;

    let viewText = queue[0].text;
    let consumed = 1;

    fillMeasure(el, viewText);

    if (el.scrollHeight > el.clientHeight) {
      const words = viewText.split(" ");
      let lo = 1;
      let hi = words.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        fillMeasure(el, words.slice(0, mid).join(" "));
        if (el.scrollHeight <= el.clientHeight) lo = mid;
        else hi = mid - 1;
      }
      const splitAt = splitAtSentence(words, lo);
      const fitting = words.slice(0, splitAt).join(" ");
      const rest = words.slice(splitAt).join(" ").trim();

      views.push({ text: fitting, label, backendPage: bp, isFirstOfChapter });
      el.style.height = `${fullHeight}px`;
      queue = rest ? [{ text: rest, label, bp }, ...queue.slice(1)] : queue.slice(1);
      continue;
    }

    let partial: { text: string; label: string; bp: number } | null = null;
    let qi = 1;
    while (qi < queue.length && queue[qi].label === label) {
      const candidate = viewText + "\n\n" + queue[qi].text;
      fillMeasure(el, candidate);
      if (el.scrollHeight > el.clientHeight) {
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

function renderAnnotations(para: string, marks: AnnotationMark[], dark: boolean): ReactNode {
  if (!marks.length) return para;

  const positioned = marks
    .map((m) => ({ ...m, start: para.indexOf(m.text) }))
    .filter((m) => m.start !== -1)
    .sort((a, b) => a.start - b.start);

  if (!positioned.length) return para;

  const parts: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const m of positioned) {
    if (m.start < cursor) continue;
    if (m.start > cursor) parts.push(<span key={key++}>{para.slice(cursor, m.start)}</span>);

    const bgClass =
      m.type === "highlight"
        ? dark ? "bg-yellow-400/30" : "bg-yellow-200"
        : m.type === "note"
        ? dark ? "bg-blue-400/25" : "bg-blue-100"
        : m.type === "quote"
        ? dark ? "bg-purple-400/25" : "bg-purple-100"
        : dark ? "bg-orange-400/40" : "bg-orange-200"; // search

    parts.push(
      <mark key={key++} className={`rounded-sm px-0.5 ${bgClass}`} style={{ color: "inherit" }}>
        {m.text}
      </mark>
    );
    cursor = m.start + m.text.length;
  }

  if (cursor < para.length) parts.push(<span key={key++}>{para.slice(cursor)}</span>);
  return <>{parts}</>;
}

type SidebarMode = "chapters" | "annotations" | "chat" | null;

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
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);

  // Annotations
  const [annotations, setAnnotations] = useState<BookAnnotations>({ highlights: [], notes: [], quotes: [] });
  const [annotationTab, setAnnotationTab] = useState<"highlights" | "notes" | "quotes">("highlights");
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const syncedBPRef = useRef(-1);
  const currentBPRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.books.get(id), api.books.getAnnotations(id)])
      .then(([{ book: b, pages: ps }, ann]) => {
        setBook(b);
        setPages(ps);
        setAnnotations(ann);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery("");
  }, [searchOpen]);

  // Navigate to first match when query changes
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return views
      .map((v, i) => ({ i, match: v.text.toLowerCase().includes(q) }))
      .filter((x) => x.match)
      .map((x) => x.i);
  }, [searchQuery, views]);

  useEffect(() => {
    if (searchMatches.length > 0) {
      setSearchMatchIndex(0);
      setViewIndex(searchMatches[0]);
    }
  }, [searchMatches]);

  function goToSearchMatch(delta: number) {
    if (!searchMatches.length) return;
    const next = (searchMatchIndex + delta + searchMatches.length) % searchMatches.length;
    setSearchMatchIndex(next);
    setViewIndex(searchMatches[next]);
  }

  // Dismiss selection popup on outside click
  useEffect(() => {
    if (!selectionInfo) return;
    function close(e: PointerEvent) {
      const popup = document.getElementById("selection-popup");
      if (popup && !popup.contains(e.target as Node)) {
        setSelectionInfo(null);
        setNoteMode(false);
        setNoteText("");
      }
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [selectionInfo]);

  function handleMouseUp() {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!text || !id) { setSelectionInfo(null); return; }
    const range = selection!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionInfo({
      text,
      top: rect.top - 52,
      left: Math.max(80, Math.min(rect.left + rect.width / 2, window.innerWidth - 80)),
    });
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    setSelectionInfo(null);
    setNoteMode(false);
    setNoteText("");
  }

  async function handleHighlight() {
    if (!id || !selectionInfo || !views[viewIndex]) return;
    const { text } = selectionInfo;
    const page_number = views[viewIndex].backendPage;
    clearSelection();
    try {
      await api.books.addHighlight(id, page_number, text);
      setAnnotations((p) => ({ ...p, highlights: [...p.highlights, { id: crypto.randomUUID(), text, page_number, created_at: new Date().toISOString() }] }));
    } catch {}
  }

  async function handleSaveNote() {
    if (!id || !selectionInfo || !views[viewIndex] || !noteText.trim()) return;
    const selected_text = selectionInfo.text;
    const note = noteText.trim();
    const page_number = views[viewIndex].backendPage;
    clearSelection();
    try {
      await api.books.addNote(id, page_number, selected_text, note);
      setAnnotations((p) => ({ ...p, notes: [...p.notes, { id: crypto.randomUUID(), selected_text, note, page_number, created_at: new Date().toISOString() }] }));
    } catch {}
  }

  async function handleQuote() {
    if (!id || !selectionInfo || !views[viewIndex]) return;
    const { text } = selectionInfo;
    const page_number = views[viewIndex].backendPage;
    clearSelection();
    try {
      await api.books.addQuote(id, page_number, text);
      setAnnotations((p) => ({ ...p, quotes: [...p.quotes, { id: crypto.randomUUID(), text, page_number, favorited: false, created_at: new Date().toISOString() }] }));
    } catch {}
  }

  async function handleDeleteHighlight(h: Highlight) {
    if (!id) return;
    try {
      await api.books.deleteHighlight(id, h.id);
      setAnnotations((p) => ({ ...p, highlights: p.highlights.filter((x) => x.id !== h.id) }));
    } catch {}
  }

  async function handleDeleteNote(n: Note) {
    if (!id) return;
    try {
      await api.books.deleteNote(id, n.id);
      setAnnotations((p) => ({ ...p, notes: p.notes.filter((x) => x.id !== n.id) }));
    } catch {}
  }

  async function handleDeleteQuote(q: Quote) {
    if (!id) return;
    try {
      await api.books.deleteQuote(id, q.id);
      setAnnotations((p) => ({ ...p, quotes: p.quotes.filter((x) => x.id !== q.id) }));
    } catch {}
  }

  async function handleSendChat() {
    if (!id || !chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    setChatInput("");
    setChatMessages((p) => [...p, { role: "user", content: message }]);
    setChatLoading(true);
    try {
      const { reply } = await api.books.chat(id, message);
      setChatMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "LLM unavailable";
      setChatMessages((p) => [...p, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  const chapters = useMemo(() => {
    const seen = new Set<string>();
    return pages
      .filter((p) => { if (seen.has(p.label)) return false; seen.add(p.label); return true; })
      .map((p) => ({ label: p.label, backendPage: p.page_number }));
  }, [pages]);

  function jumpToChapter(label: string) {
    const idx = views.findIndex((v) => v.label === label);
    if (idx !== -1) setViewIndex(idx);
    setSidebarMode(null);
  }

  function toggleSidebar(mode: SidebarMode) {
    setSidebarMode((prev) => (prev === mode ? null : mode));
  }

  const currentView = views[viewIndex];
  const paragraphs = currentView?.text.split(/\n\n+/).filter(Boolean) ?? [];
  const chapterNumber = chapters.findIndex((c) => c.label === currentView?.label) + 1;

  const progressLabel = views.length
    ? progressMode === "percent"
      ? `${Math.round((viewIndex / Math.max(1, views.length - 1)) * 100)}%`
      : `${viewIndex + 1} / ${views.length}`
    : "—";

  // Build annotation marks for current page
  const currentPageMarks = useMemo((): AnnotationMark[] => {
    const bp = currentView?.backendPage;
    if (bp === undefined) return [];
    const marks: AnnotationMark[] = [
      ...annotations.highlights.filter((h) => h.page_number === bp).map((h) => ({ text: h.text, type: "highlight" as const })),
      ...annotations.notes.filter((n) => n.page_number === bp).map((n) => ({ text: n.selected_text, type: "note" as const })),
      ...annotations.quotes.filter((q) => q.page_number === bp).map((q) => ({ text: q.text, type: "quote" as const })),
    ];
    if (searchQuery.trim() && currentView?.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      marks.push({ text: searchQuery, type: "search" });
    }
    return marks;
  }, [currentView, annotations, searchQuery]);

  const dark = darkMode;
  const ctrlBtn = `flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${dark ? "text-gray-400 hover:text-gray-100 hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`;
  const activeCtrlBtn = `flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${dark ? "text-violet-400 bg-violet-500/20" : "text-violet-600 bg-violet-50"}`;

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="grid grid-cols-3 items-center px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="flex justify-center"><div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" /></div>
          <div className="flex gap-2 justify-end">
            {[1,2,3,4].map(i => <div key={i} className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        </div>
        <div className="flex-1 flex justify-center px-6 pt-10">
          <div className="max-w-[640px] w-full flex flex-col gap-3.5">
            <div className="h-7 w-48 bg-gray-100 rounded-lg animate-pulse mb-2" />
            {SKELETON_WIDTHS.map((w, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w, animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        </div>
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
    <div className={`flex flex-col h-full transition-colors duration-200 ${dark ? "bg-[#1a1a2e] text-gray-300" : "bg-white text-gray-700"}`}>
      {/* Off-screen measurement div */}
      <div ref={measureRef} aria-hidden style={{ position: "fixed", top: -9999, left: -9999, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }} />

      {/* Selection popup */}
      <AnimatePresence>
        {selectionInfo && (
          <motion.div
            id="selection-popup"
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.12 }}
            style={{ position: "fixed", top: selectionInfo.top, left: selectionInfo.left, transform: "translateX(-50%)", zIndex: 200 }}
            className="bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden"
          >
            {noteMode ? (
              <div className="p-3 flex flex-col gap-2 w-64">
                <p className="text-xs text-gray-400 truncate">"{selectionInfo.text}"</p>
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add your note…"
                  rows={3}
                  className="text-sm bg-white/10 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 placeholder-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveNote();
                    if (e.key === "Escape") { setNoteMode(false); setNoteText(""); }
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveNote} className="flex-1 bg-violet-600 hover:bg-violet-700 rounded-lg py-1.5 text-xs font-semibold transition-colors">Save</button>
                  <button onClick={() => { setNoteMode(false); setNoteText(""); }} className="px-3 bg-white/10 hover:bg-white/20 rounded-lg py-1.5 text-xs transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex">
                <button onClick={handleHighlight} className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-white/10 transition-colors text-xs font-medium text-yellow-300">
                  <LuHighlighter size={13} /> Highlight
                </button>
                <div className="w-px bg-white/10" />
                <button onClick={() => setNoteMode(true)} className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-white/10 transition-colors text-xs font-medium text-blue-300">
                  <LuStickyNote size={13} /> Note
                </button>
                <div className="w-px bg-white/10" />
                <button onClick={handleQuote} className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-white/10 transition-colors text-xs font-medium text-purple-300">
                  <LuQuote size={13} /> Quote
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right sidebar */}
      <AnimatePresence>
        {sidebarMode && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSidebarMode(null)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              className={`relative ml-auto h-full w-[26rem] flex flex-col shadow-2xl ${dark ? "bg-[#12122a]" : "bg-white"}`}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sidebar header tabs */}
              <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${dark ? "border-white/10" : "border-gray-100"}`}>
                <div className="flex gap-1">
                  {(
                    [
                      { mode: "chapters" as SidebarMode, icon: <LuBookOpen size={13} />, label: "Chapters" },
                      { mode: "annotations" as SidebarMode, icon: <LuHighlighter size={13} />, label: "Annotations" },
                      { mode: "chat" as SidebarMode, icon: <LuMessageSquare size={13} />, label: "Chat" },
                    ] as const
                  ).map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setSidebarMode(mode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        sidebarMode === mode
                          ? dark ? "bg-violet-500/20 text-violet-300" : "bg-violet-50 text-violet-600"
                          : dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSidebarMode(null)}
                  className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${dark ? "text-gray-400 hover:bg-white/10" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <LuX size={15} />
                </button>
              </div>

              {/* Chapters */}
              {sidebarMode === "chapters" && (
                <div className="flex-1 overflow-y-auto py-2">
                  {chapters.map((ch, i) => {
                    const isCurrent = currentView?.label === ch.label;
                    return (
                      <button
                        key={ch.label}
                        className={`w-full text-left px-5 py-3 transition-colors ${
                          isCurrent
                            ? dark ? "text-violet-400 font-semibold bg-violet-500/10" : "text-violet-600 font-semibold bg-violet-50"
                            : dark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => jumpToChapter(ch.label)}
                      >
                        <span className={`block text-[10px] font-semibold tracking-widest mb-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>CHAPTER {i + 1}</span>
                        <span className="text-sm leading-snug">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Annotations */}
              {sidebarMode === "annotations" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className={`flex border-b flex-shrink-0 ${dark ? "border-white/10" : "border-gray-100"}`}>
                    {(["highlights", "notes", "quotes"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setAnnotationTab(tab)}
                        className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                          annotationTab === tab
                            ? dark ? "text-violet-300 border-b-2 border-violet-400" : "text-violet-600 border-b-2 border-violet-600"
                            : dark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {tab} <span className={`ml-1 text-[10px] ${dark ? "text-gray-600" : "text-gray-400"}`}>{annotations[tab].length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-2">
                    {annotationTab === "highlights" && (
                      annotations.highlights.length === 0
                        ? <p className={`text-xs text-center mt-8 ${dark ? "text-gray-600" : "text-gray-400"}`}>Select text to highlight</p>
                        : annotations.highlights.map((h) => (
                          <div key={h.id} className={`rounded-xl p-3 group relative ${dark ? "bg-yellow-400/10" : "bg-yellow-50"}`}>
                            <p className={`text-xs leading-relaxed ${dark ? "text-yellow-200" : "text-gray-700"}`}>{h.text}</p>
                            <p className={`text-[10px] mt-1.5 ${dark ? "text-gray-600" : "text-gray-400"}`}>Page {h.page_number}</p>
                            <button onClick={() => handleDeleteHighlight(h)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"><LuTrash2 size={12} /></button>
                          </div>
                        ))
                    )}
                    {annotationTab === "notes" && (
                      annotations.notes.length === 0
                        ? <p className={`text-xs text-center mt-8 ${dark ? "text-gray-600" : "text-gray-400"}`}>Select text and add a note</p>
                        : annotations.notes.map((n) => (
                          <div key={n.id} className={`rounded-xl p-3 group relative ${dark ? "bg-blue-400/10" : "bg-blue-50"}`}>
                            <p className={`text-[10px] font-medium italic mb-1.5 ${dark ? "text-blue-300" : "text-blue-600"}`}>"{n.selected_text}"</p>
                            <p className={`text-xs leading-relaxed ${dark ? "text-gray-300" : "text-gray-700"}`}>{n.note}</p>
                            <p className={`text-[10px] mt-1.5 ${dark ? "text-gray-600" : "text-gray-400"}`}>Page {n.page_number}</p>
                            <button onClick={() => handleDeleteNote(n)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"><LuTrash2 size={12} /></button>
                          </div>
                        ))
                    )}
                    {annotationTab === "quotes" && (
                      annotations.quotes.length === 0
                        ? <p className={`text-xs text-center mt-8 ${dark ? "text-gray-600" : "text-gray-400"}`}>Select text to save a quote</p>
                        : annotations.quotes.map((q) => (
                          <div key={q.id} className={`rounded-xl p-3 group relative ${dark ? "bg-purple-400/10" : "bg-purple-50"}`}>
                            <p className={`text-xs leading-relaxed italic ${dark ? "text-purple-200" : "text-gray-700"}`}>"{q.text}"</p>
                            <p className={`text-[10px] mt-1.5 font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>
                              — {book.title}{book.author ? `, ${book.author}` : ""}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${dark ? "text-gray-600" : "text-gray-400"}`}>Page {q.page_number}</p>
                            <button onClick={() => handleDeleteQuote(q)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"><LuTrash2 size={12} /></button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Chat */}
              {sidebarMode === "chat" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                    {chatMessages.length === 0 && (
                      <p className={`text-xs text-center mt-8 leading-relaxed ${dark ? "text-gray-600" : "text-gray-400"}`}>
                        Ask anything about what you've read so far.<br />
                        The AI only knows up to page {book.current_page}.
                      </p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-violet-600 text-white rounded-br-md"
                            : dark ? "bg-white/10 text-gray-200 rounded-bl-md" : "bg-gray-100 text-gray-700 rounded-bl-md"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className={`rounded-2xl rounded-bl-md px-3 py-2 text-xs ${dark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-400"}`}>
                          Thinking…
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className={`flex gap-2 p-3 border-t flex-shrink-0 ${dark ? "border-white/10" : "border-gray-100"}`}>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                      placeholder="Ask about the book…"
                      className={`flex-1 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 ${dark ? "bg-white/10 text-gray-200 placeholder-gray-600" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={chatLoading || !chatInput.trim()}
                      className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      <LuSend size={13} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <motion.div
        className={`grid grid-cols-3 items-center px-4 py-3.5 border-b transition-colors flex-shrink-0 ${dark ? "border-white/10" : "border-gray-200"}`}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      >
        {/* Left */}
        <div className="flex items-center gap-1">
          <motion.button className={ctrlBtn} onClick={() => navigate("/library")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <LuChevronLeft size={18} />
          </motion.button>
          <span className={`text-sm font-semibold truncate max-w-[140px] ${dark ? "text-gray-100" : "text-gray-900"}`}>{book.title}</span>
        </div>

        {/* Center: chapter label or search */}
        <div className="flex justify-center">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToSearchMatch(1);
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                placeholder="Search in book…"
                className={`text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 w-40 ${dark ? "bg-white/10 text-gray-200 placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`}
              />
              {searchQuery.trim() && (
                <span className={`text-[10px] font-semibold tabular-nums ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  {searchMatches.length > 0 ? `${searchMatchIndex + 1}/${searchMatches.length}` : "0 results"}
                </span>
              )}
            </div>
          ) : (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full truncate max-w-[180px] ${dark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"}`}
              title={currentView?.label}
            >
              {chapterNumber > 0 ? `Ch. ${chapterNumber} · ` : ""}{currentView?.label ?? ""}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 justify-end">
          {searchOpen ? (
            <>
              <motion.button className={ctrlBtn} onClick={() => goToSearchMatch(-1)} whileTap={{ scale: 0.9 }} disabled={!searchMatches.length}>
                <LuChevronLeft size={15} />
              </motion.button>
              <motion.button className={ctrlBtn} onClick={() => goToSearchMatch(1)} whileTap={{ scale: 0.9 }} disabled={!searchMatches.length}>
                <LuChevronRight size={15} />
              </motion.button>
              <motion.button className={activeCtrlBtn} onClick={() => setSearchOpen(false)} whileTap={{ scale: 0.9 }}>
                <LuX size={15} />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button className={ctrlBtn} onClick={() => setDarkMode((d) => !d)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                {dark ? <LuSun size={16} /> : <LuMoon size={16} />}
              </motion.button>
              <div className={`w-px h-4 ${dark ? "bg-white/10" : "bg-gray-200"}`} />
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                <LuType size={13} />{FONT_SIZES[fontSize]}
              </span>
              <motion.button className={ctrlBtn} onClick={() => setFontSize((f) => Math.max(0, f - 1))} whileTap={{ scale: 0.9 }}>
                <span className="text-xs font-bold">A</span>
              </motion.button>
              <motion.button className={ctrlBtn} onClick={() => setFontSize((f) => Math.min(FONT_SIZES.length - 1, f + 1))} whileTap={{ scale: 0.9 }}>
                <span className="text-sm font-bold">A</span>
              </motion.button>
              <div className={`w-px h-4 ${dark ? "bg-white/10" : "bg-gray-200"}`} />
              <motion.button className={searchOpen ? activeCtrlBtn : ctrlBtn} onClick={() => setSearchOpen(true)} whileTap={{ scale: 0.9 }} title="Search">
                <LuSearch size={15} />
              </motion.button>
              <motion.button className={sidebarMode === "annotations" ? activeCtrlBtn : ctrlBtn} onClick={() => toggleSidebar("annotations")} whileTap={{ scale: 0.9 }} title="Annotations">
                <LuStickyNote size={15} />
              </motion.button>
              <motion.button className={sidebarMode === "chat" ? activeCtrlBtn : ctrlBtn} onClick={() => toggleSidebar("chat")} whileTap={{ scale: 0.9 }} title="AI Chat">
                <LuMessageSquare size={15} />
              </motion.button>
              <motion.button className={sidebarMode === "chapters" ? activeCtrlBtn : ctrlBtn} onClick={() => toggleSidebar("chapters")} whileTap={{ scale: 0.9 }} title="Chapters">
                <LuMenu size={16} />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* Content area */}
      <div ref={outerRef} className="flex-1 overflow-hidden flex justify-center px-6 pt-8 pb-20" onMouseUp={handleMouseUp}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewIndex}
            className="max-w-[640px] w-full overflow-hidden"
            style={{ fontSize: FONT_SIZES[fontSize], lineHeight: LINE_HEIGHT }}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {currentView?.isFirstOfChapter && (
              <div className="overflow-hidden" style={{ height: CHAPTER_HEADING_PX, marginBottom: 0 }}>
                <p className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${dark ? "text-gray-500" : "text-gray-400"}`}>{book.title}</p>
                <h2 className={`font-bold leading-tight ${dark ? "text-gray-100" : "text-gray-900"}`} style={{ fontSize: Math.round(FONT_SIZES[fontSize] * 1.6) }}>
                  {currentView.label}
                </h2>
              </div>
            )}

            {paragraphs.length > 0 ? (
              paragraphs.map((para, i) => (
                <Fragment key={i}>
                  <p className="mb-7">{renderAnnotations(para, currentPageMarks, dark)}</p>
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
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2, type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="flex items-center bg-white rounded-full shadow-lg px-1 py-2">
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
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
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setViewIndex((i) => Math.min(views.length - 1, i + 1))}
            disabled={viewIndex === views.length - 1}
          >
            <LuChevronRight size={18} />
          </motion.button>
        </div>
        <motion.button
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-violet-600 shadow-md transition-colors"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => id && book && api.books.addBookmark(id, book.current_page)}
          title="Bookmark"
        >
          <LuBookmark size={18} />
        </motion.button>
      </motion.div>
    </div>
  );
}
