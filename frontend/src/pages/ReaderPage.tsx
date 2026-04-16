import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuMoon,
  LuSun,
  LuType,
  LuHighlighter,
  LuPencil,
} from "react-icons/lu";
import { BOOKS } from "../data/books";

const CHAPTER_CONTENT = [
  `There was music from my neighbor's house through the summer nights. In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars. At high tide in the afternoon I watched his guests diving from the tower of his raft, or taking the sun on the hot sand of his beach while his two motor-boats slit the waters of the Sound...`,
  `On week-ends his Rolls-Royce became an omnibus, bearing parties to and from the city between nine in the morning and long past midnight, while his station wagon scampered like a brisk yellow bug to meet all trains. And on Mondays eight servants, including an extra gardener, toiled all day with mops and scrubbing-brushes and hammers and garden-shears, repairing the ravages of the night before.`,
];

const FONT_SIZES = [14, 16, 18, 20, 22];

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(2);
  const [darkMode, setDarkMode] = useState(false);

  const book = BOOKS.find((b) => b.id === id) ?? BOOKS[0];

  const ctrlBtn = `flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
    darkMode
      ? "text-gray-400 hover:text-gray-100 hover:bg-white/10"
      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
  }`;

  return (
    <div
      className={`flex flex-col h-full transition-colors duration-200 ${
        darkMode ? "bg-[#1a1a2e] text-gray-300" : "bg-white text-gray-700"
      }`}
    >
      {/* Top bar */}
      <motion.div
        className={`flex items-center justify-between px-6 py-3.5 border-b transition-colors ${
          darkMode ? "border-white/10" : "border-gray-200"
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            className={ctrlBtn}
            onClick={() => navigate("/library")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuChevronLeft size={18} />
          </motion.button>
          <span className={`text-sm font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
            {book.title}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              darkMode ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-400"
            }`}
          >
            Chapter 3
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            className={ctrlBtn}
            onClick={() => setDarkMode((d) => !d)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {darkMode ? <LuSun size={16} /> : <LuMoon size={16} />}
          </motion.button>
          <div className={`w-px h-5 ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 mx-1">
            <LuType size={14} />
            {FONT_SIZES[fontSize]}
          </span>
          <motion.button
            className={ctrlBtn}
            onClick={() => setFontSize((f) => Math.max(0, f - 1))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-xs font-bold">A</span>
          </motion.button>
          <motion.button
            className={ctrlBtn}
            onClick={() => setFontSize((f) => Math.min(FONT_SIZES.length - 1, f + 1))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-base font-bold">A</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex justify-center px-6 py-12 pb-28">
        <motion.div
          className="max-w-[640px] w-full leading-[1.9] text-justify"
          style={{ fontSize: FONT_SIZES[fontSize] }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.h2
            className={`font-serif text-[26px] font-normal italic text-center mb-10 ${
              darkMode ? "text-gray-100" : "text-gray-900"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Chapter III
          </motion.h2>
          {CHAPTER_CONTENT.map((para, i) => (
            <motion.p
              key={i}
              className="mb-7"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
            >
              {para}
            </motion.p>
          ))}
        </motion.div>
      </div>

      {/* Bottom bar */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2, type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="flex items-center bg-white rounded-full shadow-lg px-1 py-2">
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuChevronLeft size={18} />
          </motion.button>
          <div className="flex flex-col items-center px-5 min-w-[80px]">
            <span className="text-[9px] font-bold tracking-widest text-gray-400">PROGRESS</span>
            <span className="text-lg font-bold text-gray-900">{book.progress}%</span>
          </div>
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuChevronRight size={18} />
          </motion.button>
        </div>
        <div className="flex gap-2">
          <motion.button
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-gray-400 shadow-md hover:text-violet-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuHighlighter size={18} />
          </motion.button>
          <motion.button
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-violet-600 shadow-md transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuPencil size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
