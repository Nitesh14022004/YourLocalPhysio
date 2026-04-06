"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="#home"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
          onClick={closeMenu}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            YL
          </span>
          <span className="hidden sm:inline">Your Local Physio</span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href + label}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/login"
            className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            onClick={closeMenu}
          >
            Admin
          </Link>
          <Link
            href="/book"
            className="hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:inline-flex"
            onClick={closeMenu}
          >
            Book Home Visit
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`border-t border-slate-200 bg-white md:hidden ${open ? "block" : "hidden"}`}
      >
        <nav
          className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
          aria-label="Mobile"
        >
          {navLinks.map(({ href, label }) => (
            <a
              key={href + label}
              href={href}
              className="rounded-lg px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50"
              onClick={closeMenu}
            >
              {label}
            </a>
          ))}
          <Link
            href="/admin/login"
            className="rounded-lg border border-slate-200 px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50"
            onClick={closeMenu}
          >
            Admin
          </Link>
          <Link
            href="/book"
            className="mt-2 rounded-lg bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-blue-700"
            onClick={closeMenu}
          >
            Book Home Visit
          </Link>
        </nav>
      </div>
    </header>
  );
}
