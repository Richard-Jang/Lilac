import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LuBookOpen,
  LuMessageSquare,
  LuNotebookPen,
  LuUser,
  LuSettings,
} from "react-icons/lu";

interface SidebarProps {
  onProfileClick: () => void;
}

const NAV_ITEMS = [
  { to: "/library", icon: LuBookOpen, label: "Library" },
  { to: "/ai", icon: LuMessageSquare, label: "Lilac AI" },
  { to: "/notes", icon: LuNotebookPen, label: "Notes" },
];

function NavItem({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl w-[52px] cursor-pointer select-none ${
        isActive ? "text-violet-600" : "text-gray-400"
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0.5 bg-violet-100 rounded-[9px] z-0"
            layoutId="sidebar-active"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  );
}

export default function Sidebar({ onProfileClick }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="flex flex-col items-center w-[68px] min-h-screen bg-white border-r border-gray-200 py-4 flex-shrink-0">
      <motion.div
        className="flex items-center justify-center w-10 h-10 mb-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 2L17.5 10.5L26 14L17.5 17.5L14 26L10.5 17.5L2 14L10.5 10.5L14 2Z"
            fill="#7c3aed"
          />
        </svg>
      </motion.div>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }, i) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="no-underline">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * (i + 1), duration: 0.2 }}
              >
                <NavItem isActive={isActive}>
                  <span className="relative z-10 flex items-center justify-center w-9 h-9">
                    <Icon size={20} />
                  </span>
                  <span className="relative z-10 text-[10px] font-medium">{label}</span>
                </NavItem>
              </motion.div>
            </NavLink>
          );
        })}

        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <NavItem isActive={false} onClick={onProfileClick}>
            <span className="relative z-10 flex items-center justify-center w-9 h-9">
              <LuUser size={20} />
            </span>
            <span className="relative z-10 text-[10px] font-medium">Profile</span>
          </NavItem>
        </motion.div>
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
      >
        <NavItem isActive={false}>
          <span className="relative z-10 flex items-center justify-center w-9 h-9">
            <LuSettings size={20} />
          </span>
          <span className="relative z-10 text-[10px] font-medium">Settings</span>
        </NavItem>
      </motion.div>
    </aside>
  );
}
