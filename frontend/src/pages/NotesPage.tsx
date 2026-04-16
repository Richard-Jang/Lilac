import { LuNotebookPen } from "react-icons/lu";

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
      <LuNotebookPen size={40} className="text-violet-200" />
      <h2 className="m-0 text-lg font-semibold text-gray-600">Notes</h2>
      <p className="m-0 text-sm">Your reading notes will appear here.</p>
    </div>
  );
}
