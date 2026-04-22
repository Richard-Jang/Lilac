export interface Book {
  id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  title: string;
  author: string;
  cover_path: string | null;
  page_count: number;
  char_count: number;
  current_page: number;
  completed: boolean;
  uploaded_at: string;
}

export interface Page {
  page_number: number;
  label: string;
  text: string;
}

export interface BookResponse {
  book: Book;
  pages: Page[];
}

export interface AuthResponse {
  token: string;
  user_id: string;
  username: string;
}

export interface Highlight {
  id: string;
  text: string;
  page_number: number;
  created_at: string;
}

export interface Note {
  id: string;
  selected_text: string;
  note: string;
  page_number: number;
  created_at: string;
}

export interface Quote {
  id: string;
  text: string;
  page_number: number;
  favorited: boolean;
  created_at: string;
}

export interface BookAnnotations {
  highlights: Highlight[];
  notes: Note[];
  quotes: Quote[];
}

export interface AllAnnotationsEntry {
  book_id: string;
  book_title: string;
  book_author: string;
  highlights: Highlight[];
  notes: Note[];
  quotes: Quote[];
}
