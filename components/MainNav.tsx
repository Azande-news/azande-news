"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const TOPICS: { href: string; label: string }[] = [
  { href: "/category/general", label: "Local News" },
  { href: "/category/culture", label: "Culture" },
  { href: "/category/history", label: "History" },
  { href: "/category/language", label: "Zande Language" },
  { href: "/category/diaspora", label: "Diaspora" },
  { href: "/category/community", label: "Community" },
  { href: "/category/announcements", label: "Notices" },
  { href: "/azande-people", label: "Heritage" },
  { href: "/dictionary", label: "Dictionary" },
];

export default function MainNav() {
  const pathname = usePathname();
  const isHomeActive = pathname === "/";
  const isLiveActive = pathname?.startsWith("/live");

  return (
    <div className="bg-paper border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <Link
            href="/"
            className={`shrink-0 py-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              isHomeActive
                ? "text-accent border-accent"
                : "text-ink border-transparent hover:bg-offwhite"
            }`}
          >
            Home
          </Link>
          <Link
            href="/live"
            className={`shrink-0 py-3 px-3 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${
              isLiveActive
                ? "text-accent border-accent"
                : "text-accent border-transparent hover:bg-offwhite"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live
          </Link>
          {TOPICS.map((topic) => {
            const active = pathname?.startsWith(topic.href);
            return (
              <Link
                key={topic.href}
                href={topic.href}
                className={`shrink-0 py-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  active
                    ? "text-accent border-accent"
                    : "text-ink border-transparent hover:bg-offwhite"
                }`}
              >
                {topic.label}
              </Link>
            );
          })}
          <Link
            href="/posts/new"
            className="shrink-0 py-3 px-3 text-sm font-semibold whitespace-nowrap text-ink border-b-2 border-transparent hover:bg-offwhite transition-colors"
          >
            Write a Post
          </Link>
        </div>
      </div>
    </div>
  );
}
