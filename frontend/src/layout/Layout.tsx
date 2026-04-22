import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./Sidebar";
import ProfileModal from "../components/ProfileModal";

export default function Layout() {
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar onProfileClick={() => setProfileOpen(true)} />
      <motion.main
        key={location.pathname}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        <Outlet />
      </motion.main>
      <AnimatePresence>
        {profileOpen && (
          <ProfileModal onClose={() => setProfileOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
