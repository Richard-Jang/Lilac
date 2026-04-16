import { LuMessageSquare } from "react-icons/lu";

export default function AiPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
      <LuMessageSquare size={40} className="text-violet-200" />
      <h2 className="m-0 text-lg font-semibold text-gray-600">Lilac AI</h2>
      <p className="m-0 text-sm">Your AI reading assistant is coming soon.</p>
    </div>
  );
}
