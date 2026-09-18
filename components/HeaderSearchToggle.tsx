"use client";

import { useState, useRef, useEffect } from "react";
import SearchBox from "@/components/SearchBox";

export default function HeaderSearchToggle() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Search"
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 bg-paper border border-border shadow-md p-3 w-72">
          <SearchBox />
        </div>
      )}
    </div>
  );
}
