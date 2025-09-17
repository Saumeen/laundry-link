"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const Header = () => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 600); // Increased threshold to detect when past hero section
  });

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between whitespace-nowrap px-4 py-4 sm:px-6 lg:px-10 transition-all duration-500 ease-in-out`}
      style={{
        background: scrolled 
          ? 'rgba(255, 255, 255, 0.35)' 
          : 'rgba(255, 255, 255, 0.20)',
        backdropFilter: scrolled ? 'blur(25px)' : 'blur(15px)',
        WebkitBackdropFilter: scrolled ? 'blur(25px)' : 'blur(15px)',
        borderBottom: scrolled 
          ? '1px solid rgba(255, 255, 255, 0.25)' 
          : '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: scrolled 
          ? '0 12px 40px 0 rgba(31, 38, 135, 0.45)' 
          : '0 6px 25px 0 rgba(31, 38, 135, 0.25)',
      }}
    >
        <div className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
            className="material-symbols-outlined text-4xl text-[var(--primary-color)] sm:text-5xl"
          >
            local_laundry_service
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="tracking-tighter text-[#111618]"
          >
            Laundry Link
          </motion.h2>
        </div>
        
        <div className="flex items-center justify-end gap-2 sm:gap-4 lg:gap-10">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="hidden items-center gap-12 lg:flex"
          >
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[var(--primary-color)] relative group"
              href="/"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-color)] transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[var(--primary-color)] relative group"
              href="/services"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-color)] transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[var(--primary-color)] relative group"
              href="/pricing"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-color)] transition-all group-hover:w-full"></span>
            </Link>
          </motion.nav>
          
          <Link href="/registerlogin">
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--primary-color)] px-6 text-base font-bold leading-normal tracking-wide text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl sm:flex lg:h-14 lg:px-8 lg:text-lg"
            >
              <span className="truncate">Sign In</span>
            </motion.button>
          </Link>
          
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="rounded-full p-2 hover:bg-gray-200/50 lg:hidden transition-colors"
          >
            <span className="material-symbols-outlined text-3xl text-gray-700">
              menu
            </span>
          </motion.button>
        </div>
      
    </motion.header>
  );
};

export default Header;
