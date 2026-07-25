"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function CategoriesDropdown() {
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
        className="flex items-center gap-1 py-3 text-sm font-medium text-grey hover:text-ink transition-colors"
      >
        Categories
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full bg-paper border border-border rounded-sm shadow-lg py-1 min-w-[180px] z-50">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/category/${c.value}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-offwhite transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
