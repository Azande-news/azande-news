"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function SiteMenu({
  user,
  isAdmin,
}: {
  user: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  function close() {
    setOpen(false);
    setShowMore(false);
  }

  const linkClass = "py-3 px-4 text-base font-medium text-ink border-b border-border hover:bg-offwhite transition-colors";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-sm transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-paper overflow-y-auto">
            <div className="bg-[#1A1A1A] text-white h-14 flex items-center justify-between px-4 sticky top-0">
              <span className="font-display font-bold text-lg">Menu</span>
              <button onClick={close} aria-label="Close menu" className="p-1.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col">
              <Link href="/" onClick={close} className={linkClass}>Home</Link>
              <Link href="/category/announcements" onClick={close} className={linkClass}>Announcements</Link>

              <div className="px-4 pt-4 pb-1 font-meta text-[11px] tracking-wider uppercase text-grey">
                Categories
              </div>
              {CATEGORIES.filter((c) => c.value !== "announcements").map((c) => (
                <Link key={c.value} href={`/category/${c.value}`} onClick={close} className={linkClass}>
                  {c.label}
                </Link>
              ))}

              <div className="px-4 pt-4 pb-1 font-meta text-[11px] tracking-wider uppercase text-grey">
                More about the Azande
              </div>
              <Link href="/azande-people" onClick={close} className={linkClass}>The Azande People</Link>
              <Link href="/dictionary" onClick={close} className={linkClass}>Dictionary</Link>

              {user && (
                <>
                  <div className="px-4 pt-4 pb-1 font-meta text-[11px] tracking-wider uppercase text-grey">
                    Your account
                  </div>
                  {isAdmin && (
                    <Link href="/admin" onClick={close} className={linkClass}>Admin</Link>
                  )}
                  <Link href="/bookmarks" onClick={close} className={linkClass}>Saved posts</Link>
                </>
              )}

              <button
                onClick={() => setShowMore(!showMore)}
                className="py-3 px-4 text-base font-medium text-grey hover:bg-offwhite transition-colors text-left flex items-center justify-between"
              >
                More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showMore ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showMore && (
                <>
                  <Link href="/about" onClick={close} className={linkClass}>About</Link>
                  <Link href="/contact" onClick={close} className={linkClass}>Contact</Link>
                  <Link href="/privacy" onClick={close} className={linkClass}>Privacy</Link>
                  <Link href="/terms" onClick={close} className={linkClass}>Terms</Link>
                  <Link href="/editorial-standards" onClick={close} className={linkClass}>Editorial Standards</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
