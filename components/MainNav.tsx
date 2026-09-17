"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const PRIMARY_LINKS: { href: string; label: string }[] = [
  { href: "/category/general", label: "Local News" },
  { href: "/category/culture", label: "Culture" },
  { href: "/category/history", label: "History" },
];

const MORE_LINKS: { href: string; label: string }[] = [
  { href: "/category/language", label: "Zande Language" },
  { href: "/category/diaspora", label: "Diaspora" },
  { href: "/category/community", label: "Community" },
  { href: "/category/announcements", label: "Notices" },
  { href: "/azande-people", label: "Heritage" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/posts/new", label: "Write a Post" },
];

export default function MainNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHomeActive = pathname === "/";
  const isLiveActive = pathname?.startsWith("/live");
  const moreActive = MORE_LINKS.some((l) => pathname?.startsWith(l.href));

  return (
    <nav className="bg-paper border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <Link
            href="/"
            className={`shrink-0 py-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              isHomeActive ? "text-accent border-accent" : "text-ink border-transparent hover:bg-offwhite"
            }`}
          >
            Home
          </Link>

          <Link
            href="/live"
            className={`shrink-0 py-3 px-3 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 text-accent hover:bg-offwhite ${
              isLiveActive ? "border-accent" : "border-transparent"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live
          </Link>

          {PRIMARY_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 py-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  active ? "text-accent border-accent" : "text-ink border-transparent hover:bg-offwhite"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="relative shrink-0" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`py-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1 border-b-2 ${
                moreOpen || moreActive ? "text-accent border-accent" : "text-ink border-transparent hover:bg-offwhite"
              }`}
            >
              More
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute left-0 top-full z-40 bg-paper border border-border shadow-md min-w-[200px] py-2">
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-ink hover:bg-offwhite hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
