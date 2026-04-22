import { useState, useEffect, useRef } from "react";
import { LuSend, LuMessageSquare } from "react-icons/lu";
import { api } from "../api/client";
import type { Book } from "../api/types";
import FlowerLogo from "../components/FlowerLogo";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.books.list().then((all) => setBooks(all.filter((b) => b.current_page > 0)));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { reply } = await api.chat(text);
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "LLM unavailable";
      setMessages((p) => [...p, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-100 flex-shrink-0">
        <FlowerLogo size={22} />
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">Lilac AI</h1>
          <p className="text-xs text-gray-400">
            {books.length === 0
              ? "Start reading a book to unlock AI chat"
              : `Aware of ${books.length} book${books.length !== 1 ? "s" : ""} in progress — spoiler-free`}
          </p>
        </div>

        {/* Books in context chips */}
        {books.length > 0 && (
          <div className="ml-auto flex gap-1.5 flex-wrap justify-end max-w-xs">
            {books.slice(0, 4).map((b) => (
              <span
                key={b.id}
                className="text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-100 rounded-full px-2.5 py-0.5 truncate max-w-[120px]"
                title={b.title}
              >
                {b.title}
              </span>
            ))}
            {books.length > 4 && (
              <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">
                +{books.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-50">
              <LuMessageSquare size={28} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Ask anything about your reading</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Questions about characters, themes, plot — all grounded in what you've read, never ahead of it.
              </p>
            </div>
            {books.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
                {[
                  "What are the main themes so far?",
                  "Summarize what I've read",
                  "Who are the key characters?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-sm text-left px-4 py-2.5 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-100 hover:border-violet-100 rounded-xl transition-colors text-gray-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center mr-2 mt-0.5">
                <FlowerLogo size={16} />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center mr-2 mt-0.5">
              <FlowerLogo size={16} />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-8 pb-6 flex-shrink-0">
        <div className="flex gap-3 items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={books.length === 0 ? "Start reading a book first…" : "Ask about your books…"}
            disabled={books.length === 0}
            className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || books.length === 0}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <LuSend size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
