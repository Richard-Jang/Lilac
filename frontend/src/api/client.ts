import type { Book, BookResponse } from "./types";

const BASE = "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Request failed");
  return json.response as T;
}

export const api = {
  books: {
    list: () => request<Book[]>("/books"),
    upload: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return request<Book>("/books", { method: "POST", body: fd });
    },
    get: (id: string) => request<BookResponse>(`/books/${id}`),
    setPage: (id: string, page: number) =>
      request<Book>(`/books/${id}/page`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page }),
      }),
    delete: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/books/${id}`, { method: "DELETE" }),
    toggleComplete: (id: string) =>
      request<Book>(`/books/${id}/complete`, { method: "PATCH" }),
    addHighlight: (id: string, page_number: number, text: string) =>
      request<{ id: string }>(`/books/${id}/highlight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_number, text }),
      }),
    addBookmark: (id: string, page_number: number) =>
      request<{ id: string }>(`/books/${id}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_number }),
      }),
  },
};
