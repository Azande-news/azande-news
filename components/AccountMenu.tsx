"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function AccountMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-paper border border-border rounded-sm shadow-lg py-1 min-w-[180px] z-50">
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-ink hover:bg-offwhite transition-colors">
              Admin
            </Link>
          )}
          <Link href="/messages" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-ink hover:bg-offwhite transition-colors">
            Messages
          </Link>
          <Link href="/bookmarks" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-ink hover:bg-offwhite transition-colors">
            Saved
          </Link>
          <div className="border-t border-border mt-1 pt-1">
            <div className="px-4 py-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
