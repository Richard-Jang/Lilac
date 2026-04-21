import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LuX, LuHeart, LuBookmark, LuSettings, LuChevronRight } from "react-icons/lu";
import { api } from "../api/client";

interface ProfileModalProps {
  onClose: () => void;
}

const LINKS = [
  { icon: LuBookmark, label: "Reading Statistics" },
  { icon: LuSettings, label: "Account Settings" },
];

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [bookCount, setBookCount] = useState<number | null>(null);

  useEffect(() => {
    api.books.list().then((books) => setBookCount(books.length));
  }, []);

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
            ?
          </motion.div>

          <motion.h2
            className="text-[22px] font-bold text-gray-900 m-0 mb-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            My Library
          </motion.h2>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-1 w-full border border-gray-200 rounded-xl overflow-hidden mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            <div className="flex flex-col items-center py-5 px-4 bg-white gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {bookCount ?? "—"}
              </span>
              <span className="text-[11px] font-semibold tracking-widest text-gray-400">BOOKS</span>
            </div>
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
            </div>
            <div className="flex flex-col border-t border-gray-200">
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                No quotes saved yet.
              </div>
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
