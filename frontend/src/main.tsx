import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./layout/Layout";
import LibraryPage from "./pages/LibraryPage";
import ReaderPage from "./pages/ReaderPage";
import NotesPage from "./pages/NotesPage";
import AiPage from "./pages/AiPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/library" replace /> },
      { path: "library", element: <LibraryPage /> },
      { path: "reader/:id", element: <ReaderPage /> },
      { path: "notes", element: <NotesPage /> },
      { path: "ai", element: <AiPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
