"use client";

import { useState } from "react";
import Link from "next/link";

type Category = { value: string; label: string };

export default function MobileMenu({
  user,
  isAdmin,
  categories,
}: {
  user: boolean;
  isAdmin: boolean;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="sm:hidden p-1.5 -ml-1.5 text-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] sm:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-paper overflow-y-auto">
            <div className="bg-ink text-paper h-14 flex items-center justify-between px-4">
              <span className="font-display font-bold">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <nav className="p-4 flex flex-col">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold text-ink border-b border-border"
              >
                Home
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.value}
                  href={`/category/${c.value}`}
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-medium text-grey border-b border-border"
                >
                  {c.label}
                </Link>
              ))}

              <div className="pt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-ink py-2"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/posts/new"
                      onClick={() => setOpen(false)}
                      className="bg-accent text-paper text-center px-4 py-2.5 rounded-sm text-sm font-medium"
                    >
                      Write a post
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="text-center text-sm font-medium text-ink border border-border px-4 py-2.5 rounded-sm"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="bg-accent text-paper text-center px-4 py-2.5 rounded-sm text-sm font-medium"
                    >
                      Join &mdash; it&apos;s free
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
