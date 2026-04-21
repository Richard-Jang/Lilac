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
