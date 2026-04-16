export type BookStatus = "reading" | "finished" | "want";

export interface Book {
  id: string;
  title: string;
  author: string;
  color: string;
  progress: number;
  lastActivity: string;
  status: BookStatus;
}

export const BOOKS: Book[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    color: "#2563EB",
    progress: 21,
    lastActivity: "2 hours ago",
    status: "reading",
  },
  {
    id: "2",
    title: "1984",
    author: "George Orwell",
    color: "#B91C1C",
    progress: 45,
    lastActivity: "Yesterday",
    status: "reading",
  },
  {
    id: "3",
    title: "Brave New World",
    author: "Aldous Huxley",
    color: "#065F46",
    progress: 10,
    lastActivity: "3 days ago",
    status: "reading",
  },
  {
    id: "4",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    color: "#D97706",
    progress: 88,
    lastActivity: "1 week ago",
    status: "finished",
  },
  {
    id: "5",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    color: "#BE185D",
    progress: 0,
    lastActivity: "Not started",
    status: "want",
  },
  {
    id: "6",
    title: "Moby Dick",
    author: "Herman Melville",
    color: "#1F2937",
    progress: 0,
    lastActivity: "Not started",
    status: "want",
  },
];
