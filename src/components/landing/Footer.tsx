"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "../ui/Logo";
import Image from "next/image";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white/70 px-3 py-8 sm:px-4 sm:py-12 md:px-6 lg:px-10 lg:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 flex flex-col gap-4 sm:gap-5 text-center md:col-span-2 md:text-left lg:col-span-1">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl font-bold md:justify-start">
              <span className="material-symbols-outlined text-4xl sm:text-5xl text-[var(--primary-color)]">
                local_laundry_service
              </span>
              <h2 className="tracking-tighter text-[#111618]">Laundry Link</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-600">
              Your partner for pristine laundry and dry cleaning in Bahrain.
            </p>
          </div>
          <div className="text-center md:text-left lg:ml-12">
            <h4 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-gray-800">Services</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  className="text-base sm:text-lg text-gray-600 transition-colors hover:text-[var(--primary-color)]"
                  href="/services"
                >
                  Wash &amp; Iron
                </Link>
              </li>
              <li>
                <Link
                  className="text-base sm:text-lg text-gray-600 transition-colors hover:text-[var(--primary-color)]"
                  href="/services"
                >
                  Dry Cleaning
                </Link>
              </li>
              <li>
                <Link
                  className="text-base sm:text-lg text-gray-600 transition-colors hover:text-[var(--primary-color)]"
                  href="/services"
                >
                  Express Service
                </Link>
              </li>
              <li>
                <Link
                  className="text-base sm:text-lg text-gray-600 transition-colors hover:text-[var(--primary-color)]"
                  href="/services"
                >
                  Bedding &amp; Linens
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-gray-800">Contact Us</h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-600">
              <li className="flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg md:justify-start">
                <span className="material-symbols-outlined text-xl sm:text-2xl text-[var(--primary-color)]">
                  call
                </span>
                +973 1234 5678
              </li>
              <li className="flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg md:justify-start">
                <span className="material-symbols-outlined text-xl sm:text-2xl text-[var(--primary-color)]">
                  mark_email_read
                </span>
                hello@laundrylink.bh
              </li>
              <li className="flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg md:justify-start">
                <span className="material-symbols-outlined text-xl sm:text-2xl text-[var(--primary-color)]">
                  nest_clock_farsight_analog
                </span>
                8am - 10pm, Mon-Sun
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-gray-800">Follow Us</h4>
            <div className="flex justify-center gap-4 sm:gap-5 md:justify-start">
              <a
                className="text-gray-500 transition-colors hover:text-[var(--primary-color)]"
                href="#"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              </a>
              <a
                className="text-gray-500 transition-colors hover:text-[var(--primary-color)]"
                href="#"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a
                className="text-gray-500 transition-colors hover:text-[var(--primary-color)]"
                href="#"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9.5 16.5a1 1 0 100-2 1 1 0 000 2zm1-3.5a1 1 0 11-2 0 1 1 0 012 0zm2.5 2.5a1 1 0 100-2 1 1 0 000 2zm1-3.5a1 1 0 11-2 0 1 1 0 012 0zm-7-2a1 1 0 100-2 1 1 0 000 2zm1-3.5a1 1 0 11-2 0 1 1 0 012 0zm11 5.5a1 1 0 100-2 1 1 0 000 2zm1-3.5a1 1 0 11-2 0 1 1 0 012 0z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
            <div className="mt-4 sm:mt-6 flex justify-center md:justify-start" id="efada-container">
             <Image
                src='/image-r-1.png'
                alt='Government Seal'
                width={120}
                height={120}
                className="h-12 w-auto sm:h-16 rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500 sm:mt-12 sm:pt-8 sm:text-base lg:text-lg">
          <p>
            © 2025 Laundry Link. All Rights Reserved. Crafted with care in
            Bahrain.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
