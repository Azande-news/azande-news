"use client";

import { useState } from "react";
import Link from "next/link";

type Section = "news" | "heritage" | "language" | "more" | null;

const SECTIONS: Record<Exclude<Section, null>, { label: string; links: { href: string; label: string }[] }> = {
  news: {
    label: "News",
    links: [
      { href: "/category/general", label: "General" },
      { href: "/category/announcements", label: "Announcements" },
      { href: "/category/community", label: "Community" },
      { href: "/category/diaspora", label: "Diaspora" },
    ],
  },
  heritage: {
    label: "Culture",
    links: [
      { href: "/category/culture", label: "Culture" },
      { href: "/category/history", label: "History" },
      { href: "/azande-people", label: "Heritage" },
    ],
  },
  language: {
    label: "Language",
    links: [
      { href: "/category/language", label: "Zande Language" },
      { href: "/dictionary", label: "Dictionary" },
    ],
  },
  more: {
    label: "Contribute",
    links: [
      { href: "/posts/new", label: "Write a Post" },
      { href: "/dictionary", label: "Contribute a Word" },
    ],
  },
};

export default function MainNav() {
  const [open, setOpen] = useState<Section>(null);

  function toggle(section: Exclude<Section, null>) {
    setOpen(open === section ? null : section);
  }

  return (
    <div className="bg-paper border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            onClick={() => setOpen(null)}
            className="shrink-0 py-3 px-3 text-sm font-semibold text-ink hover:bg-offwhite transition-colors"
          >
            Home
          </Link>
          {(Object.keys(SECTIONS) as Array<Exclude<Section, null>>).map((key) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`shrink-0 py-3 px-3 text-sm font-semibold transition-colors flex items-center gap-1 ${
                open === key ? "text-accent" : "text-ink hover:bg-offwhite"
              }`}
            >
              {SECTIONS[key].label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open === key ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-offwhite">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {SECTIONS[open].links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(null)}
                  className="text-sm font-medium text-ink hover:text-accent transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


