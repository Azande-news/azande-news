"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const LINKS: { href: string; label: string }[] = [
  { href: "/category/general", label: "Local News" },
  { href: "/category/culture", label: "Culture" },
  { href: "/category/history", label: "History" },
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

  const isHomeActive = pathname === "/";
  const isLiveActive = pathname?.startsWith("/live");

  const base =
    "shrink-0 py-3 px-3 font-meta text-brevier font-semibold whitespace-nowrap transition-colors border-b-4";
  const on = "text-white border-white";
  const off = "text-white/85 border-transparent hover:text-white hover:border-white/40";

  return (
    <nav className="bg-black">
      <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center overflow-x-auto scrollbar-none">
          <Link href="/" className={`${base} ${isHomeActive ? on : off}`}>
            Home
          </Link>

          <Link
            href="/live"
            className={`${base} flex items-center gap-1.5 ${isLiveActive ? on : off}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live
          </Link>

          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${base} ${pathname?.startsWith(link.href) ? on : off}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
