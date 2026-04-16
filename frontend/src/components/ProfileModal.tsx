import { motion } from "motion/react";
import { LuX, LuHeart, LuBookmark, LuSettings, LuChevronRight } from "react-icons/lu";

interface ProfileModalProps {
  onClose: () => void;
}

const QUOTES = [
  {
    text: '"So we beat on, boats against the current, borne back ceaselessly into the past."',
    source: "THE GREAT GATSBY",
  },
  {
    text: '"It was a bright cold day in April, and the clocks were striking thirteen."',
    source: "1984",
  },
  {
    text: '"I am not afraid of storms, for I am learning how to sail my ship."',
    source: "LITTLE WOMEN",
  },
];

const LINKS = [
  { icon: LuBookmark, label: "Reading Statistics" },
  { icon: LuSettings, label: "Account Settings" },
];

export default function ProfileModal({ onClose }: ProfileModalProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/30 flex items-stretch justify-end z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white w-full max-w-[700px] flex flex-col overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <LuBookmark size={16} />
            <span>Profile</span>
          </div>
          <motion.button
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LuX size={20} />
          </motion.button>
        </div>

        {/* Body */}
        <div className="px-8 py-10 flex flex-col items-center">
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-semibold mb-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
          >
            JD
          </motion.div>

          <motion.h2
            className="text-[22px] font-bold text-gray-900 m-0 mb-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            Jane Doe
          </motion.h2>

          <motion.div
            className="flex items-center gap-2 mb-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.2 }}
          >
            <span className="bg-violet-100 text-violet-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Level 12
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-400 text-[13px]">Favorite Genre: Classic Literature</span>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 w-full border border-gray-200 rounded-xl overflow-hidden divide-x divide-gray-200 mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            {[
              { value: "14", label: "BOOKS" },
              { value: "2.4k", label: "PAGES" },
              { value: "642k", label: "WORDS" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center py-5 px-4 bg-white gap-1">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-[11px] font-semibold tracking-widest text-gray-400">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Quotes */}
          <motion.div
            className="w-full mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-[15px]">
                <LuHeart size={16} className="text-red-500 fill-red-500" />
                <span>Favorited Quotes</span>
              </div>
              <span className="text-[11px] font-semibold tracking-widest text-gray-400">
                3 TOTAL
              </span>
            </div>
            <div className="flex flex-col border-t border-gray-200">
              {QUOTES.map((q, i) => (
                <motion.div
                  key={i}
                  className="flex gap-3 py-5 border-b border-gray-200"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.2 }}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="flex items-center justify-center w-6 h-6 bg-violet-100 text-violet-600 rounded text-base font-bold leading-none">
                      "
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-gray-700 italic leading-relaxed m-0">{q.text}</p>
                    <span className="text-[12px] font-bold tracking-wide text-violet-600 text-right">
                      — {q.source}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          <motion.div
            className="w-full flex flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.2 }}
          >
            {LINKS.map(({ icon: Icon, label }) => (
              <motion.button
                key={label}
                className="flex items-center justify-between py-4 border-b border-gray-200 text-sm text-gray-700 cursor-pointer bg-transparent font-[inherit] w-full text-left"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
                <LuChevronRight size={16} className="text-gray-400" />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
