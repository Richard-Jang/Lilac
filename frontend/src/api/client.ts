import type { Book, BookResponse, AuthResponse, BookAnnotations, AllAnnotationsEntry } from "./types";

const BASE = "http://localhost:8000";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = localStorage.getItem("lilac_token");
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const json = await res.json();
  if (res.status === 401) {
    localStorage.removeItem("lilac_token");
    localStorage.removeItem("lilac_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(json.error?.message ?? "Request failed");
  return json.response as T;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
  },

  books: {
    list: () => request<Book[]>("/books", { headers: authHeaders() }),
    upload: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return request<Book>("/books", { method: "POST", body: fd, headers: authHeaders() });
    },
    get: (id: string) => request<BookResponse>(`/books/${id}`, { headers: authHeaders() }),
    setPage: (id: string, page: number) =>
      request<Book>(`/books/${id}/page`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ page }),
      }),
    delete: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/books/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),
    toggleComplete: (id: string) =>
      request<Book>(`/books/${id}/complete`, { method: "PATCH", headers: authHeaders() }),

    getAnnotations: (id: string) =>
      request<BookAnnotations>(`/books/${id}/annotations`, { headers: authHeaders() }),

    addHighlight: (id: string, page_number: number, text: string) =>
      request<{ id: string }>(`/books/${id}/highlight`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ page_number, text }),
      }),
    deleteHighlight: (bookId: string, highlightId: string) =>
      request<{ deleted: boolean }>(`/books/${bookId}/highlight/${highlightId}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),

    addNote: (id: string, page_number: number, selected_text: string, note: string) =>
      request<{ id: string }>(`/books/${id}/note`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ page_number, selected_text, note }),
      }),
    deleteNote: (bookId: string, noteId: string) =>
      request<{ deleted: boolean }>(`/books/${bookId}/note/${noteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),

    addQuote: (id: string, page_number: number, text: string) =>
      request<{ id: string }>(`/books/${id}/quote`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ page_number, text }),
      }),
    favoriteQuote: (bookId: string, quoteId: string) =>
      request<{ favorited: boolean }>(`/books/${bookId}/quote/${quoteId}/favorite`, {
        method: "PATCH",
        headers: authHeaders(),
      }),
    deleteQuote: (bookId: string, quoteId: string) =>
      request<{ deleted: boolean }>(`/books/${bookId}/quote/${quoteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),

    addBookmark: (id: string, page_number: number) =>
      request<{ id: string }>(`/books/${id}/bookmark`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ page_number }),
      }),

    chat: (id: string, message: string) =>
      request<{ reply: string }>(`/books/${id}/chat`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ message }),
      }),
  },

  annotations: {
    getAll: () =>
      request<AllAnnotationsEntry[]>("/annotations", { headers: authHeaders() }),
  },

  chat: (message: string) =>
    request<{ reply: string }>("/chat", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ message }),
    }),
};
